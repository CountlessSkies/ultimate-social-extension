// Instagram downloads: feed/post/reel buttons next to the bookmark, story
// button, grid tile buttons, A/D carousel and S download hotkeys.
// Feed/post/reel logic is ported from D:/AgentWorks/ig-download; read its
// ARCHITECTURE.md before changing carousel resolution or file naming.
location.hostname.includes('instagram.com') && (() => {
  const CLASS = 'ig-minimal-download';
  // The S hotkey targets single-item buttons; "all" buttons are reached with Shift+S.
  const SINGLE = `.${CLASS}:not([data-kind="all"])`;
  const isCarousel = (scope) =>
    !!scope.querySelector('button[aria-label^="Go to slide"], button[aria-label="Next"], button[aria-label="Tiếp"]');
  // Like/Unlike icons: anchoring on the label (not the outline-heart path)
  // keeps the button on posts that are already liked.
  const LIKE_SVG = 'svg[aria-label="Like"],svg[aria-label="Unlike"],svg[aria-label="Thích"],svg[aria-label="Bỏ thích"]';
  const CODE_RE = /\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/;
  const DEFAULT_APP_ID = '936619743392459';
  const INFO_TTL = 10 * 60 * 1000; // CDN links are signed and expire.
  const mediaIdCache = new Map();
  const mediaInfoCache = new Map();

  const parentAt = (node, levels) => {
    let result = node;
    while (levels-- && result) result = result.parentElement;
    return result;
  };

  function unlockImageMenus() {
    document.querySelectorAll('article img:not([data-ig-native-menu]), main img:not([data-ig-native-menu])').forEach((image) => {
      const rect = image.getBoundingClientRect();
      // Leave avatars and small interface icons alone; expose actual media only.
      if (rect.width < 180 || rect.height < 180) return;
      image.dataset.igNativeMenu = 'true';
      image.style.zIndex = '999';
      image.style.pointerEvents = 'auto';
    });
  }

  // Instagram attaches handlers that suppress the browser menu. Stopping that
  // propagation does not prevent the browser's own image context menu.
  document.addEventListener('contextmenu', (event) => {
    const image = event.target instanceof Element ? event.target.closest('img[data-ig-native-menu="true"]') : null;
    if (image) event.stopImmediatePropagation();
  }, true);

  function findAppId() {
    for (const script of document.querySelectorAll('body > script')) {
      const match = script.textContent?.match(/"X-IG-App-ID":"(\d+)"/);
      if (match) return match[1];
    }
    return DEFAULT_APP_ID;
  }

  function shortcodeFrom(article) {
    const pageMatch = location.pathname.match(/\/(?:p|reel|reels)\/([^/]+)/);
    if (pageMatch) return { code: pageMatch[1], route: location.pathname.includes('/p/') ? 'p' : 'reel' };
    for (const link of article?.querySelectorAll?.('a[href]') || []) {
      // Also matches /<user>/p/<code>/ links.
      const match = link.getAttribute('href')?.match(/\/(p|reel)\/([^/?#]+)/);
      if (match) return { code: match[2], route: match[1] };
    }
    return null;
  }

  // Instagram shortcodes are base64url-encoded numeric media IDs. Codes longer
  // than 11 characters carry a suffix after the ID.
  function mediaIdFromShortcode(shortcode) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let id = 0n;
    for (const character of shortcode.slice(0, 11)) {
      const value = alphabet.indexOf(character);
      if (value < 0) return null;
      id = id * 64n + BigInt(value);
    }
    return id.toString();
  }

  // Ordinary 11-character codes decode exactly, so the post page HTML is only
  // fetched for longer codes (and decoding stays the fallback if that fails).
  async function findMediaId(code, route) {
    const key = `${route}:${code}`;
    if (!mediaIdCache.has(key)) {
      let mediaId = code.length <= 11 ? mediaIdFromShortcode(code) : null;
      if (!mediaId) {
        try {
          const html = await (await fetch(`https://www.instagram.com/${route}/${code}/`)).text();
          const match = html.match(/instagram:\/\/media\?id=(\d+)|["' ]media_id["' ]:["' ](\d+)/);
          mediaId = match?.[1] || match?.[2];
        } catch (_) { /* decode below */ }
        mediaId = mediaId || mediaIdFromShortcode(code);
      }
      if (!mediaId) return null;
      mediaIdCache.set(key, mediaId);
    }
    return mediaIdCache.get(key);
  }

  async function mediaInfo(id) {
    const cached = mediaInfoCache.get(id);
    if (cached && Date.now() - cached.time < INFO_TTL) return cached.item;
    const apiUrl = `https://i.instagram.com/api/v1/media/${id}/info/`;
    const headers = { Accept: '*/*', 'X-IG-App-ID': findAppId() };
    // A content script has host permissions, while a userscript does not.
    // Tampermonkey makes this cross-origin API request.
    const payload = await new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: apiUrl,
        headers,
        onload: (result) => {
          if (result.status < 200 || result.status >= 300) {
            reject(new Error(`Instagram API: ${result.status}`));
            return;
          }
          try { resolve(JSON.parse(result.responseText)); } catch (_) { reject(new Error('Invalid Instagram API response')); }
        },
        onerror: () => reject(new Error('Instagram API request failed')),
        ontimeout: () => reject(new Error('Instagram API request timed out')),
      });
    });
    const item = payload.items?.[0];
    if (!item) throw new Error('Instagram returned no media');
    mediaInfoCache.set(id, { item, time: Date.now() });
    return item;
  }

  function largestCandidate(candidates) {
    return (candidates || []).reduce((best, candidate) => {
      const bestSize = (best?.width || 0) * (best?.height || 0);
      const size = (candidate.width || 0) * (candidate.height || 0);
      return size > bestSize ? candidate : best;
    }, null);
  }

  function filenameFromUrl(url) {
    try {
      const name = new URL(url).pathname.split('/').pop();
      return name ? decodeURIComponent(name) : '';
    } catch (_) {
      return '';
    }
  }

  // Videos take the sharpest DASH picture stream (no sound; video_versions
  // with sound stop at 720p), falling back to the largest video_versions.
  function toDownload(item, parent, renderedUrl = '') {
    const dash = scBestDashVideo(item.video_dash_manifest);
    const video = dash ? { url: dash } : largestCandidate(item.video_versions);
    const image = largestCandidate(item.image_versions2?.candidates);
    const source = video || image;
    if (!source?.url) throw new Error('No downloadable media URL');
    const id = item.id || item.pk || parent?.id || parent?.pk || 'instagram_media';
    return {
      url: source.url,
      type: video ? 'video' : 'image',
      username: item.owner?.username || item.user?.username || parent?.owner?.username || parent?.user?.username || 'instagram',
      id,
      // Match the original extension: its video/reel/story filename is the
      // basename of the resolved video_versions URL, not the media ID.
      sourceName: video ? filenameFromUrl(source.url) : filenameFromUrl(renderedUrl) || filenameFromUrl(source.url),
    };
  }

  function urlPath(url) {
    try { return new URL(url).pathname; } catch (_) { return ''; }
  }

  function visibleMediaSources(article) {
    const scope = article && typeof article.querySelectorAll === 'function' ? article : document;
    const articleRect = typeof scope.getBoundingClientRect === 'function'
      ? scope.getBoundingClientRect()
      : { left: 0, right: window.innerWidth, top: 0, bottom: window.innerHeight };
    const media = [];
    scope.querySelectorAll('img, video').forEach((element) => {
      const rect = element.getBoundingClientRect();
      const width = Math.max(0, Math.min(rect.right, articleRect.right) - Math.max(rect.left, articleRect.left));
      const height = Math.max(0, Math.min(rect.bottom, articleRect.bottom) - Math.max(rect.top, articleRect.top));
      const area = width * height;
      if (!area) return;
      // IG serves feed videos through a blob: currentSrc. Its poster remains a
      // real CDN URL and identifies the corresponding carousel_media item.
      const urls = element instanceof HTMLVideoElement
        ? [element.poster, element.currentSrc, element.src]
        : [element.currentSrc, element.src];
      media.push({ area, urls: urls.filter((url) => url && !url.startsWith('blob:')) });
    });
    return media.sort((left, right) => right.area - left.area);
  }

  function visibleMediaUrl(article) {
    return visibleMediaSources(article)[0]?.urls[0] || '';
  }

  function carouselIndexFromGeometry(article) {
    if (!(article instanceof Element)) return -1;
    const articleRect = article.getBoundingClientRect();
    const centerX = articleRect.left + articleRect.width / 2;
    // Instagram's feed keeps adjacent slides mounted. Their <li> transforms
    // move only the active slide to the article centre, independent of media
    // type or whether a video source is a blob URL.
    const slides = [...article.querySelectorAll('li[style]')]
      .filter((slide) => slide.querySelector('img, video'));
    let activeIndex = -1;
    let bestDistance = Infinity;
    slides.forEach((slide, index) => {
      const rect = slide.getBoundingClientRect();
      if (!rect.width || !rect.height || rect.bottom <= articleRect.top || rect.top >= articleRect.bottom) return;
      const distance = Math.abs(rect.left + rect.width / 2 - centerX);
      if (distance < bestDistance) {
        bestDistance = distance;
        activeIndex = index;
      }
    });
    return activeIndex;
  }

  function carouselIndexFromIndicator(article, total) {
    if (!(article instanceof Element)) return -1;
    // Feed carousel dots are real buttons now. The active one carries this
    // stable accessibility state even while IG keeps neighbouring slides in
    // the DOM with misleading transforms or preloaded media.
    const active = article.querySelector('button[aria-current="step"][aria-label]');
    const number = active?.getAttribute('aria-label')?.match(/(\d+)(?!.*\d)/)?.[1];
    const index = number ? Number(number) - 1 : -1;
    return Number.isInteger(index) && index >= 0 && index < total ? index : -1;
  }

  function carouselIndex(article, parent) {
    const value = new URLSearchParams(location.search).get('img_index');
    if (value) return Math.max(0, Number(value) - 1);
    if (!(article instanceof Element)) return 0;

    const indicatorIndex = carouselIndexFromIndicator(article, parent?.carousel_media?.length || 0);
    if (indicatorIndex >= 0) return indicatorIndex;

    // Fallback for layouts without semantic carousel indicators.
    const geometryIndex = carouselIndexFromGeometry(article);
    if (geometryIndex >= 0) return geometryIndex;

    // Fallback for layouts without carousel <li> slides.
    const visibleSources = visibleMediaSources(article);
    if (visibleSources.length && parent?.carousel_media) {
      // Match each rendered source in area order. This handles a video slide
      // whose playable source is a blob while its poster is an API thumbnail.
      for (const rendered of visibleSources) {
        const match = parent.carousel_media.findIndex((item) => {
          const candidates = [...(item.image_versions2?.candidates || []), ...(item.video_versions || [])];
          return candidates.some((candidate) => rendered.urls.some((url) => {
            const path = urlPath(url);
            return path && (urlPath(candidate.url) === path || filenameFromUrl(candidate.url) === filenameFromUrl(url));
          }));
        });
        if (match >= 0) return match;
      }
    }

    // Exact carousel-dot routing used by the working original extension.
    const isPostView = location.pathname.startsWith('/p/');
    let dots = [];
    if (isPostView) {
      dots = [...article.querySelectorAll(':scope > div > div > div > div:nth-child(2) > div')];
    } else if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
      dots = [...article.querySelectorAll(':scope > div > div:nth-child(2) > div > div > div > div > div > div:nth-child(2) > div')];
    } else {
      const nodes = article.querySelector('ul')?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.nextElementSibling?.childNodes;
      dots = nodes ? [...nodes].filter((node) => node instanceof HTMLElement) : [];
    }
    const activeDot = dots.findIndex((dot) => dot instanceof HTMLElement && dot.classList.length === 2);
    if (activeDot >= 0) return activeDot;

    // IG sometimes hides its dots. In that case the slide whose rendered media
    // is closest to the horizontal centre of this article is the active one.
    const slides = [...article.querySelectorAll('li[style][class]')];
    const articleRect = article.getBoundingClientRect();
    const centerX = articleRect.left + articleRect.width / 2;
    let bestIndex = -1;
    let bestDistance = Infinity;
    slides.forEach((slide, index) => {
      const media = slide.querySelector('img, video');
      const rect = media?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0 || rect.bottom <= articleRect.top || rect.top >= articleRect.bottom) return;
      const distance = Math.abs(rect.left + rect.width / 2 - centerX);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    return bestIndex >= 0 ? bestIndex : 0;
  }

  async function resolvePostOrReel(article) {
    const short = shortcodeFrom(article);
    if (!short) throw new Error('Could not resolve post or reel code');
    const id = await findMediaId(short.code, short.route);
    if (!id) throw new Error('Could not resolve Instagram media id');
    const parent = await mediaInfo(id);
    const item = parent.carousel_media ? parent.carousel_media[carouselIndex(article, parent)] || parent.carousel_media[0] : parent;
    return toDownload(item, parent, visibleMediaUrl(article));
  }

  // <owner.username>_<original CDN file name>
  function makeFilename(media) {
    const username = String(media.username).replace(/[\\/:*?"<>|]/g, '_');
    let sourceName = String(media.sourceName || filenameFromUrl(media.url) || media.id).replace(/[\\/:*?"<>|]/g, '_');
    if (!/\.[a-z0-9]{2,5}$/i.test(sourceName)) sourceName += media.type === 'video' ? '.mp4' : '.jpg';
    return `${username}_${sourceName}`;
  }

  async function save(media) {
    const name = makeFilename(media);
    // Obtain the media bytes, then download a Blob URL so `anchor.download` is
    // the filename authority (GM_download may ignore the name).
    // Tampermonkey's XHR supplies the cross-origin access formerly provided by
    // the extension's host permissions.
    const blob = await new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: media.url,
        responseType: 'blob',
        onload: (result) => {
          if (result.status >= 200 && result.status < 300 && result.response && typeof result.response.size === 'number') resolve(result.response);
          else reject(new Error(`Media request: ${result.status}`));
        },
        onerror: () => reject(new Error('Media request failed')),
        ontimeout: () => reject(new Error('Media request timed out')),
      });
    });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = name;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    // Large videos need time before the Blob URL can be released.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  }

  // ---- Feed / post / reel buttons ----

  // The post a button belongs to: its article, or the open post dialog. The
  // document-wide fallback would read the slide of the post behind a modal.
  function postScopeOf(button) {
    return button.closest('article, [role="dialog"]') || document.querySelector('[role="dialog"] article, article') || document;
  }

  async function startDownload(button) {
    if (!button) return;
    // Do not retain a custom DOM object on the button: Tampermonkey crosses
    // an isolated-world boundary for such properties. Resolve it at click time.
    await scRun(button, async () => {
      const scope = postScopeOf(button);
      if (button.dataset.kind === 'all') {
        const short = shortcodeFrom(scope);
        if (!short) throw new Error('Could not resolve post or reel code');
        await downloadWholePost(short.code, short.route);
      } else {
        await save(await resolvePostOrReel(scope));
      }
    });
  }

  // A button counts only when it is on screen and not covered by an overlay
  // (a post dialog over the feed, the story viewer).
  function isUncovered(button, rect) {
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return !!hit && (hit === button || button.contains(hit));
  }

  function nearestVisibleButton() {
    const viewportCenter = window.innerHeight / 2;
    const dialog = [...document.querySelectorAll('[role="dialog"]')].find(scIsVisible);
    const pool = (dialog || document).querySelectorAll(SINGLE);
    return [...pool]
      .map((button) => ({ button, rect: button.getBoundingClientRect() }))
      .filter(({ button, rect }) => rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight && isUncovered(button, rect))
      .sort((left, right) => Math.abs(left.rect.top + left.rect.height / 2 - viewportCenter) - Math.abs(right.rect.top + right.rect.height / 2 - viewportCenter))[0]?.button || null;
  }

  function isFeedPage() {
    return location.pathname === '/' || location.pathname === '/feed/';
  }

  let indicatorFrame = 0;
  // The button the S hotkey would download gets the accent colour.
  function refreshHotkeyIndicator() {
    if (indicatorFrame) return;
    indicatorFrame = requestAnimationFrame(() => {
      indicatorFrame = 0;
      const target = nearestVisibleButton();
      document.querySelectorAll(SINGLE).forEach((button) => {
        button.dataset.target = String(button === target);
      });
    });
  }

  // A/D carousel navigation, limited to the active post (the open dialog, or
  // the feed post the S hotkey targets) so it cannot click Follow/Message etc.
  function isVisibleCarouselControl(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0
      && rect.top < window.innerHeight && rect.left < window.innerWidth
      && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }

  function carouselControlScore(element, side) {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (rect.width < 20 || rect.height < 20 || rect.width > 120 || rect.height > 120) return Infinity;
    if (y < vh * 0.15 || y > vh * 0.85) return Infinity;
    if (side === 'right' && (x <= vw / 2 || x > vw - 20)) return Infinity;
    if (side === 'left' && (x >= vw / 2 || x < 80)) return Infinity;
    const horizontalTarget = side === 'left' ? vw * 0.30 : vw * 0.70;
    return Math.abs(y - vh / 2) + Math.abs(x - horizontalTarget) * 0.15;
  }

  function pickCarouselControl(candidates, side) {
    return candidates
      .filter(isVisibleCarouselControl)
      .map((element) => ({ element, score: carouselControlScore(element, side) }))
      .filter(({ score }) => Number.isFinite(score))
      .sort((left, right) => left.score - right.score)[0]?.element || null;
  }

  function carouselScope() {
    const dialog = [...document.querySelectorAll('[role="dialog"]')].find(scIsVisible);
    if (dialog) return dialog;
    if (isFeedPage()) return nearestVisibleButton()?.closest('article') || null;
    return document;
  }

  function clickCarouselControl(side) {
    const scope = carouselScope();
    if (!scope) return false;
    const isNext = side === 'right';
    const semanticSelector = isNext
      ? 'button[aria-label="Next"], button[aria-label="Tiếp"]'
      : 'button[aria-label="Previous"], button[aria-label="Prev"], button[aria-label="Go back"], button[aria-label="Quay lại"]';
    let button = pickCarouselControl([...scope.querySelectorAll(semanticSelector)], side);
    if (!button) {
      // Only buttons labelled for that direction, never this script's own: on
      // the first slide there is no back control, and "any button that is not
      // Next" used to hit the download button in the action row.
      const words = isNext ? ['next', 'tiếp'] : ['previous', 'prev', 'back', 'quay lại', 'trước'];
      const candidates = [...scope.querySelectorAll('button')].filter((element) => {
        if (element.matches('.sc-in, .sc-ov') || element.closest(`.${CLASS}`)) return false;
        const label = `${element.getAttribute('aria-label') || ''} ${element.getAttribute('title') || ''}`.toLowerCase();
        return words.some((word) => label.includes(word));
      });
      button = pickCarouselControl(candidates, side);
    }
    if (!button) return false;
    button.click();
    return true;
  }

  function interceptCarouselHotkeys(event) {
    if (event.ctrlKey || event.altKey || event.metaKey || event.repeat || scIsTyping(event.target)) return;
    const key = event.key.toLowerCase();
    const side = key === 'a' ? 'left' : key === 'd' ? 'right' : null;
    if (!side || !clickCarouselControl(side)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function addButton(container, kind) {
    if (!(container instanceof HTMLElement) || container.querySelector(`.${CLASS}[data-kind="${kind}"]`)) return;
    const button = kind === 'all'
      ? scButton('inline', 'stack', 'Tải cả bài (Shift+S)')
      : scButton('inline', 'download', kind === 'reel' ? 'Tải reel này (S)' : 'Tải ảnh/video đang xem (S)');
    button.classList.add(CLASS);
    button.dataset.kind = kind;
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await startDownload(button);
    });
    container.append(button);
  }

  // The action row holding Like / Comment / Share / Save.
  const actionRowOf = (scope) => {
    const like = scope.querySelector(LIKE_SVG);
    return like && parentAt(like, 6);
  };

  function scanPosts() {
    document.querySelectorAll('article').forEach((article) => {
      const row = article.querySelector(`.${CLASS}`)?.parentElement || actionRowOf(article);
      if (!row) return;
      addButton(row, 'post');
      // Carousels also get a "download the whole post" button.
      if (isCarousel(article)) addButton(row, 'all');
    });
    if (location.pathname.match(/\/(?:p|reel)\//)) {
      // One button per post page: skip when the article above already has one.
      const page = document.querySelector('[role="dialog"]') || document;
      const existing = page.querySelector(`.${CLASS}`);
      const reply = document.querySelector('path[d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"]');
      const container = existing?.parentElement || document.querySelector('div[role="presentation"] section') || parentAt(reply, 5);
      if (!container) return;
      if (!existing) addButton(container, 'post');
      if (isCarousel(page)) addButton(container, 'all');
    }
  }

  function scanReels() {
    if (!location.pathname.startsWith('/reels/')) return;
    document.querySelectorAll(LIKE_SVG).forEach((like) => {
      addButton(parentAt(like, 7), 'reel');
    });
  }

  // ---- Stories ----

  // The story viewer is an overlay: the page underneath (e.g. a profile grid)
  // stays in the DOM, so pick the story media by size instead of by container.
  function storyMediaEl(tag = 'img,video') {
    return [...document.querySelectorAll(tag)]
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.height >= innerHeight * 0.5 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth)
      .sort((a, b) => b.r.width * b.r.height - a.r.width * a.r.height)[0]?.el;
  }

  // Walks a React fiber upwards, returning the first value `pick` accepts.
  function fromFiber(el, pick) {
    const key = Object.keys(el).find((k) => k.startsWith('__reactFiber'));
    let fiber = key && el[key];
    for (let i = 0; fiber && i < 30; i++, fiber = fiber.return) {
      const found = pick(fiber.memoizedProps);
      if (found) return found;
    }
    return null;
  }

  // The URL only carries the media id after the viewer advances once (opening
  // from a profile gives /stories/<user>/), but the fiber props always hold it.
  const storyMediaPk = (el) => fromFiber(el, (props) => {
    const pk = props?.media && String(props.media.pk || props.media.id || '').split('_')[0];
    return pk && /^\d+$/.test(pk) ? pk : null;
  });

  // Fallback when the API is unavailable: the video URL in React props (the
  // save-story extension's approach); the element itself plays a blob: URL.
  function storyVideoUrl(video) {
    const keys = ['video_url', 'playbackUrl', 'progressiveUrl', 'hdSrc', 'hd_src', 'sdSrc', 'sd_src'];
    const isVideo = (v) => typeof v === 'string' && v.startsWith('https://') && /\.mp4|\/o1\/v\//.test(v);
    const seen = new WeakSet();
    const walk = (obj, depth) => {
      if (!obj || typeof obj !== 'object' || depth > 6 || seen.has(obj)) return null;
      seen.add(obj);
      for (const k of keys) if (isVideo(obj[k])) return obj[k];
      for (const v of Object.values(obj)) {
        if (isVideo(v)) return v;
        if (v && typeof v === 'object') {
          const found = walk(v, depth + 1);
          if (found) return found;
        }
      }
      return null;
    };
    return fromFiber(video, (props) => walk(props, 0));
  }

  async function resolveStory() {
    const match = location.pathname.match(/^\/stories\/([^/]+)\/(\d+)?/);
    if (!match) throw new Error('Không phải trang story.');
    const isHighlight = match[1] === 'highlights';
    const owner = isHighlight ? 'highlight' : match[1];
    const el = storyMediaEl();
    const urlPk = isHighlight ? location.pathname.match(/^\/stories\/highlights\/\d+\/(\d+)/)?.[1] : match[2];
    const pk = (el && storyMediaPk(el)) || urlPk;
    const rendered = el instanceof HTMLImageElement ? el.currentSrc || el.src : '';
    if (pk) {
      try {
        const item = await mediaInfo(pk);
        return toDownload(item, item, rendered);
      } catch (error) {
        console.warn(SC_TAG, 'story media info:', error);
      }
    }
    // A video story also renders its poster <img>: never save that instead.
    const video = el instanceof HTMLVideoElement ? el : storyMediaEl('video');
    const url = video ? storyVideoUrl(video) : rendered;
    if (!url || url.startsWith('blob:')) throw new Error('Không lấy được link story.');
    return { url, type: video ? 'video' : 'image', username: owner, id: pk || 'story', sourceName: filenameFromUrl(url) };
  }

  // ---- Grid tiles (profile, explore, saved): the whole post ----
  async function downloadWholePost(code, route) {
    const id = await findMediaId(code, route);
    if (!id) throw new Error('Could not resolve Instagram media id');
    const parent = await mediaInfo(id);
    for (const item of parent.carousel_media || [parent]) await save(toDownload(item, parent));
  }

  // Overlay buttons for the story viewer and grid tiles.
  function makeOverlayButton(icon, title, run) {
    const button = scButton('overlay', icon, title);
    const stop = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    ['pointerdown', 'mousedown', 'dblclick'].forEach((type) => button.addEventListener(type, stop, true));
    button.addEventListener('click', (e) => {
      stop(e);
      scRun(button, run);
    }, true);
    return button;
  }

  // Story button, pinned inside the top-right corner of the story just below
  // its header; falls back to the CSS corner position when no media is shown.
  function placeStoryButton(button) {
    const r = storyMediaEl()?.getBoundingClientRect();
    button.style.left = r ? `${Math.round(r.right - 44)}px` : '';
    button.style.top = r ? `${Math.round(r.top + 92)}px` : '';
    button.style.right = button.style.bottom = r ? 'auto' : '';
  }
  function syncStoryButton() {
    let button = document.getElementById('sc-ig-page-dl');
    if (!location.pathname.startsWith('/stories/')) {
      if (button) clearInterval(button.scTimer), button.remove();
      return;
    }
    if (!button) {
      button = makeOverlayButton('download', 'Tải story này (S)', async () => save(await resolveStory()));
      button.id = 'sc-ig-page-dl';
      document.body.append(button);
      // The story viewer animates between items without DOM-wide mutations.
      button.scTimer = setInterval(() => placeStoryButton(button), 500);
    }
    placeStoryButton(button);
  }

  function decorateGrid() {
    document.querySelectorAll('a[href]:not([data-sc-grid])').forEach((a) => {
      const match = a.getAttribute('href').match(CODE_RE);
      // Feed posts are articles with a Like button; the Saved grid is wrapped
      // in an article too, but its tiles still get a button.
      if (!match || a.closest('article')?.querySelector(LIKE_SVG)) return void (a.dataset.scGrid = '0');
      const img = a.querySelector('img');
      if (!img) return;
      const r = img.getBoundingClientRect();
      if (r.width < 120 || r.height < 120) return;
      a.dataset.scGrid = '1';
      if (getComputedStyle(a).position === 'static') a.style.position = 'relative';
      const route = match[1] === 'p' ? 'p' : 'reel';
      const button = makeOverlayButton('download', 'Tải cả bài', () => downloadWholePost(match[2], route));
      button.classList.add('sc-ig-grid');
      a.append(button);
    });
  }

  // ---- Hotkeys ----
  // S downloads the open story, or the targeted feed post / open post. One
  // handler for both, so neither swallows the key for the other.
  function interceptDownloadHotkey(event) {
    if (event.key.toLowerCase() !== 's' || event.ctrlKey || event.altKey || event.metaKey || event.repeat || scIsTyping(event.target)) return;
    const story = location.pathname.startsWith('/stories/') && document.getElementById('sc-ig-page-dl');
    const target = story || nearestVisibleButton();
    const button = !story && event.shiftKey ? target?.parentElement?.querySelector(`.${CLASS}[data-kind="all"]`) : target;
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    // Start once on keydown, but also suppress the matching keypress/keyup:
    // Instagram may bind its Save action to a different keyboard event.
    if (event.type !== 'keydown') return;
    if (story) story.click();
    else startDownload(button);
  }

  ['keydown', 'keypress', 'keyup'].forEach((type) => {
    window.addEventListener(type, interceptDownloadHotkey, true);
  });
  window.addEventListener('keydown', interceptCarouselHotkeys, true);
  window.addEventListener('scroll', refreshHotkeyIndicator, { passive: true });
  window.addEventListener('resize', refreshHotkeyIndicator, { passive: true });

  // Look comes from the shared kit; only placement is set here.
  GM_addStyle(
    '.sc-ov.sc-ig-grid{left:8px;top:8px}#sc-ig-page-dl{position:fixed;right:74px;bottom:22px;z-index:2147483646}',
  );

  scWatchDom(() => {
    unlockImageMenus();
    scanPosts();
    scanReels();
    syncStoryButton();
    decorateGrid();
    refreshHotkeyIndicator();
  });
})();
