// Facebook: quick save on posts, quick unsave on /saved, Story, photo and video download.
location.hostname.includes("facebook.com") &&
  (() => {
    "use strict";

    // ---- Network hook: remember playable video URLs and photos from GraphQL ----
    // Facebook answers GraphQL/ajax calls with newline-separated JSON, sometimes
    // behind a `for (;;);` guard, so each line is parsed on its own. Only those
    // endpoints are read; other responses (media, streams) are left alone.
    const sniffed = []; // { url, href, time }, newest last
    const API_RE = /\/api\/graphql\/|\/ajax\//;
    function rememberPlayable(url) {
      if (!/^https?:\/\//.test(url) || !/\.fbcdn\.net\//i.test(url) || /bytestart/i.test(url)) return;
      if (sniffed.some((s) => s.url === url)) return;
      sniffed.push({ url, href: location.href, time: Date.now() });
      if (sniffed.length > 50) sniffed.splice(0, sniffed.length - 50);
    }
    // Photo objects carry "image" (the feed-sized copy) and "viewer_image" (the
    // large copy the photo viewer shows, same original file name), keyed by the
    // fbid that photo links use.
    const photos = new Map(); // fbid -> { uri, ownerId }
    function rememberPhoto(photo) {
      const image = photo.viewer_image;
      if (!image || typeof image.uri !== "string" || !photo.id) return;
      photos.set(String(photo.id), { uri: image.uri, ownerId: photo.owner && photo.owner.id });
      if (photos.size > 3000) photos.delete(photos.keys().next().value);
    }
    const mediasets = new Map(); // mediaset_token -> [fbid, ...] in post order
    function rememberSet(attachment) {
      const ids = (attachment.all_subattachments.nodes || [])
        .map((node) => node && node.media && node.media.id)
        .filter(Boolean)
        .map(String);
      if (ids.length) mediasets.set(attachment.mediaset_token, ids);
    }
    // Videos carry progressive_urls (SD and HD MP4 with sound) and a DASH
    // manifest whose picture-only streams go higher (e.g. 1080p over a 720p
    // HD). Downloads take the highest-bitrate DASH picture stream (no sound),
    // falling back to HD then SD, and are named by the video id, which is
    // unique and stable (the /reel/<id>, /videos/<id> number).
    const videos = new Map(); // video id -> { hd, sd, dash, ownerId }
    const storyVideos = new Map(); // story card id (last URL segment) -> video id
    function rememberVideo(video, card) {
      const pick = (quality) =>
        (video.progressive_urls.find((p) => p && p.metadata && p.metadata.quality === quality) || {}).progressive_url;
      const id = String(video.id);
      const dash =
        (Array.isArray(video.dash_manifests) && video.dash_manifests[0] && video.dash_manifests[0].manifest_xml) || null;
      const entry = { hd: pick("HD"), sd: pick("SD"), dash, ownerId: video.owner && video.owner.id };
      if (!entry.hd && !entry.sd && !dash) return;
      videos.set(id, entry);
      if (card) storyVideos.set(card, id);
      if (videos.size > 1500) videos.delete(videos.keys().next().value);
    }
    // The manifest is only parsed when a download starts.
    function bestVideoUrl(entry) {
      if (entry.dash)
        try {
          const doc = new DOMParser().parseFromString(entry.dash, "text/xml");
          const best = [...doc.querySelectorAll("Representation")]
            .filter((r) => /video/.test(r.getAttribute("mimeType") || r.parentElement.getAttribute("mimeType") || ""))
            .sort((a, b) => (+b.getAttribute("bandwidth") || 0) - (+a.getAttribute("bandwidth") || 0))[0];
          const url = best && best.querySelector("BaseURL")?.textContent.trim();
          if (url && /^https?:/.test(url)) return url;
        } catch {}
      return entry.hd || entry.sd;
    }
    // Story cards are nodes whose id is the base64 "S:_ISC:…" in the story URL.
    const isStoryCardId = (id) => typeof id === "string" && id.startsWith("UzpfSVND");
    function scanPayload(text) {
      if (typeof text !== "string") return;
      const video = /playable|video/i.test(text);
      const photo = text.includes('"viewer_image"');
      const progressive = text.includes('"progressive_urls"');
      if (!video && !photo && !progressive) return;
      for (const line of text.replace(/^for \(;;\);/, "").split("\n")) {
        let stack;
        try {
          stack = [[JSON.parse(line), null]];
        } catch {
          continue;
        }
        for (let n = 0; stack.length && n++ < 4e5; ) {
          const [value, card] = stack.pop();
          if (Array.isArray(value)) value.forEach((x) => x && typeof x === "object" && stack.push([x, card]));
          else if (value && typeof value === "object") {
            const here = isStoryCardId(value.id) ? value.id : card;
            if (photo && value.viewer_image) rememberPhoto(value);
            if (photo && value.mediaset_token && value.all_subattachments) rememberSet(value);
            if (progressive && Array.isArray(value.progressive_urls) && value.id) rememberVideo(value, here);
            for (const [key, v] of Object.entries(value))
              if (typeof v === "string") {
                if (video && /(?:playable|video|dash|manifest).*url/i.test(key)) rememberPlayable(v);
              } else if (v && typeof v === "object") stack.push([v, here]);
          }
        }
      }
    }
    // Posts rendered with the first page load come as JSON in <script> tags.
    function scanPageData() {
      document.querySelectorAll('script[type="application/json"]:not([data-sc-scanned])').forEach((script) => {
        script.dataset.scScanned = "1";
        if (/"viewer_image"|"progressive_urls"/.test(script.textContent)) scanPayload(script.textContent);
      });
    }
    (() => {
      const page = unsafeWindow;
      if (page.__scFacebookStoryHook) return;
      page.__scFacebookStoryHook = true;
      const pageFetch = page.fetch.bind(page);
      page.fetch = async (input, init) => {
        const res = await pageFetch(input, init);
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (API_RE.test(url))
          res
            .clone()
            .text()
            .then(scanPayload)
            .catch(() => {});
        return res;
      };
      const open = page.XMLHttpRequest.prototype.open;
      page.XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        if (API_RE.test(String(url)))
          this.addEventListener(
            "loadend",
            () => {
              try {
                if (this.responseType === "" || this.responseType === "text") scanPayload(this.responseText);
              } catch {}
            },
            { once: true },
          );
        return open.call(this, method, url, ...rest);
      };
    })();

    // Closes an open Facebook menu so a failed attempt does not leave it on screen.
    function closeMenu(trigger) {
      if (trigger && trigger.getAttribute("aria-expanded") === "true") trigger.click();
      else document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", keyCode: 27, bubbles: true }));
    }
    const visibleMenuItems = () =>
      [
        ...document.querySelectorAll(
          '[role="menu"] [role="menuitem"],[role="dialog"] [role="menuitem"],[role="menu"] [role="button"],[role="dialog"] [role="button"]',
        ),
      ].filter(scIsVisible);
    // Exact labels only: "Unsave post" / "Bỏ lưu bài viết" must never match.
    const SAVE_LABELS = ["save post", "save reel", "save video", "lưu bài viết", "lưu thước phim", "lưu video"];
    const UNSAVE_LABELS = ["unsave post", "unsave reel", "unsave video", "bỏ lưu bài viết", "bỏ lưu thước phim", "bỏ lưu video"];
    const findMenuItem = (labels) =>
      visibleMenuItems().find((item) => [item, ...item.querySelectorAll("span")].some((el) => labels.includes(scText(el))));

    // ---- Quick save on posts ----
    // The post's "..." trigger. Post labels go on with the author ("Actions for
    // this post by …"), so they match by prefix; the generic ones must match
    // exactly so comment and chat menus (labels merely containing "hành
    // động") are left alone.
    const POST_MENU_SELECTOR = [
      ...["actions for this post", "tùy chọn cho bài viết", "hành động với bài viết này"].map(
        (label) => `[aria-label^="${label}" i]`,
      ),
      ...["more actions", "post actions", "hành động khác", "hành động"].map((label) => `[aria-label="${label}" i]`),
    ].join(",");

    // Resolves once the post is saved (or already was); throws otherwise.
    async function quickSave(trigger) {
      trigger.click();
      const item = await scWaitFor(() => findMenuItem(SAVE_LABELS), { timeout: 3000 });
      if (!item) {
        const alreadySaved = !!findMenuItem(UNSAVE_LABELS);
        closeMenu(trigger);
        if (!alreadySaved) throw new Error("Không tìm thấy mục Lưu");
        return;
      }
      item.click();
      // Facebook either saves straight away or asks for a collection in a
      // "Save to" dialog; finish that dialog with Done when it appears.
      const done = await scWaitFor(
        () => {
          const heading = [...document.querySelectorAll('h1,h2,h3,[role="heading"]')].find((h) =>
            /^(save to|lưu vào)$/i.test((h.textContent || "").trim()),
          );
          const dialog = heading && (heading.closest('[role="dialog"]') || document);
          return (
            dialog &&
            [...dialog.querySelectorAll('button,[role="button"]')].find(
              (b) => scIsVisible(b) && /^(done|xong|hoàn tất)$/i.test((b.textContent || "").trim()),
            )
          );
        },
        { timeout: 1500 },
      );
      if (done) done.click();
    }

    function decorateQuickSave() {
      document.querySelectorAll(POST_MENU_SELECTOR).forEach((trigger) => {
        if (!scIsVisible(trigger)) return;
        const host = trigger.parentElement && trigger.parentElement.parentElement;
        if (!host || host.querySelector(".sc-facebook-quick-save")) return;
        if (getComputedStyle(host).position === "static") host.style.position = "relative";
        const button = scButton("inline", "bookmark", "Lưu nhanh bài viết", { small: true });
        button.classList.add("sc-facebook-quick-save");
        host.append(button);
        button.addEventListener(
          "click",
          async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (button.dataset.saved) return;
            await scRun(button, () => quickSave(trigger));
            // Saved: keep a filled bookmark, like Facebook's own saved state.
            if (button.dataset.state === "done") {
              button.dataset.saved = "1";
              scSetIcon(button, "bookmark-filled", "Đã lưu bài viết");
            }
          },
          true,
        );
      });
    }

    // ---- Quick unsave on /saved ----
    const SAVED_ITEM_MENU_SELECTOR = '[aria-label="More options for saved item" i],[aria-label*="mục đã lưu" i]';

    async function quickUnsave(trigger, button) {
      trigger.click();
      const item = await scWaitFor(() => {
        if (trigger.getAttribute("aria-expanded") !== "true") return null;
        const menu = [...document.querySelectorAll('[role="menu"]')].find(scIsVisible);
        return menu && [...menu.querySelectorAll('[role="menuitem"]')].find((i) => /^(unsave|bỏ lưu)$/i.test((i.textContent || "").trim()));
      });
      if (!item) {
        closeMenu(trigger);
        throw new Error("Không tìm thấy mục Bỏ lưu — thử lại");
      }
      item.click();
      // Facebook removes the saved item once the unsave went through.
      const gone = await scWaitFor(() => !button.isConnected, { timeout: 4500 });
      if (!gone) throw new Error("Chưa xác nhận được bỏ lưu — thử lại");
    }

    function decorateQuickUnsave() {
      if (!/^\/saved(?:\/|$)/.test(location.pathname)) return;
      document.querySelectorAll(SAVED_ITEM_MENU_SELECTOR).forEach((trigger) => {
        const anchor = trigger.parentElement && trigger.parentElement.parentElement;
        const host = anchor && anchor.parentElement;
        if (!host || host.querySelector(".sc-facebook-quick-unsave")) return;
        const button = scButton("inline", "bookmark-off", "Bỏ lưu nhanh", { small: true });
        button.classList.add("sc-facebook-quick-unsave");
        host.insertBefore(button, anchor);
        button.addEventListener(
          "click",
          (e) => {
            e.preventDefault();
            e.stopPropagation();
            scRun(button, () => quickUnsave(trigger, button));
          },
          true,
        );
      });
    }

    // ---- Story download ----
    const isStoryPage = () => /^\/stories(?:\/|$)/.test(location.pathname);
    const inViewport = (el) => {
      const r = el.getBoundingClientRect();
      return r.width >= 180 && r.height >= 180 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight;
    };
    const largestFirst = (els) =>
      els
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .sort((a, b) => b.r.width * b.r.height - a.r.width * a.r.height)
        .map((x) => x.el);

    // The story currently on screen: its video player, video and/or image.
    function currentStory() {
      const player = largestFirst([...document.querySelectorAll('[aria-label="Video player"]')].filter(inViewport))[0];
      const video = (player && player.querySelector("video")) || largestFirst([...document.querySelectorAll("video")].filter(inViewport))[0];
      const image =
        player || video
          ? undefined
          : largestFirst(
              [...document.querySelectorAll("img")].filter((img) => {
                const r = img.getBoundingClientRect();
                return inViewport(img) && r.width >= 250 && r.height >= 300 && r.left > 0.25 * innerWidth && !/profile picture|avatar/i.test(img.alt);
              }),
            )[0];
      return { player, video, image, box: player || video || image };
    }

    // Collects fbcdn URLs under `value`, scored by how video-like their key is.
    function collectUrls(value, out, seen, budget) {
      const stack = [{ value, key: "" }];
      for (let n = 0; stack.length && n++ < budget; ) {
        const { value: v, key } = stack.pop();
        if (typeof v === "string") {
          if (!/^https?:\/\//.test(v) || !/\.fbcdn\.net\//i.test(v) || /bytestart/i.test(v)) continue;
          if (/image|thumbnail|preview|poster|cover/i.test(key)) continue;
          const score = /playable_url_quality_hd|playable.*hd/i.test(key)
            ? 30
            : /playable|dash|manifest|video.*url/i.test(key)
              ? 20
              : /url|src/i.test(key)
                ? 10
                : 0;
          if (score) out.push({ url: v, score });
        } else if (v && typeof v === "object" && !seen.has(v)) {
          seen.add(v);
          try {
            for (const [k, child] of Object.entries(v)) stack.push({ value: child, key: k });
          } catch {}
        }
      }
    }
    const best = (hits) => (hits.sort((a, b) => b.score - a.score)[0] || {}).url;

    // Walks up from the video's React fiber and stops at the nearest ancestor
    // that holds a playable URL: higher ancestors hold the whole story bucket,
    // where the best-scored URL can belong to another card.
    function fiberVideoUrl(video) {
      if (!video) return;
      const key = Object.keys(video).find((k) => k.startsWith("__reactFiber$"));
      const seen = new Set();
      const all = [];
      let fiber = key && video[key];
      for (let i = 0; fiber && i < 45; i++, fiber = fiber.return) {
        const hits = [];
        collectUrls(fiber.memoizedProps, hits, seen, 8e3);
        collectUrls(fiber.pendingProps, hits, seen, 8e3);
        if (hits.some((h) => h.score >= 20)) return best(hits);
        all.push(...hits);
      }
      return best(all);
    }

    // Last resort, only run on click: search the React roots (via the devtools
    // hook) for fibers rendered inside the player.
    function devtoolsVideoUrl(video, player) {
      const hook = unsafeWindow.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (!hook || !hook.renderers || !hook.getFiberRoots) return;
      // Only fibers rendered inside the player: their ancestors' props span the
      // whole page and return unrelated URLs.
      const inside = (node) => (player ? player.contains(node) : node === video);
      const hits = [];
      const seenProps = new Set();
      try {
        for (const id of hook.renderers.keys())
          for (const root of hook.getFiberRoots(id)) {
            const stack = [root.current || root];
            const seen = new Set();
            for (let n = 0; stack.length && n++ < 7e4; ) {
              const fiber = stack.pop();
              if (!fiber || seen.has(fiber)) continue;
              seen.add(fiber);
              const node = fiber.stateNode;
              if (node && node.nodeType === 1 && inside(node)) {
                collectUrls(fiber.memoizedProps, hits, seenProps, 3e3);
                collectUrls(fiber.pendingProps, hits, seenProps, 3e3);
              }
              if (fiber.child) stack.push(fiber.child);
              if (fiber.sibling) stack.push(fiber.sibling);
            }
          }
      } catch {}
      return best(hits);
    }

    const httpUrl = (url) => (url && /^https?:\/\//.test(url) ? url : undefined);

    // Picks the download URL at click time, so a story that advanced since the
    // last scan is not confused with the previous one. A blob: video source
    // (MSE playback) is skipped in favour of the real CDN URL.
    function storyMedia() {
      const { player, video, image } = currentStory();
      // The card in the URL maps to its video in the GraphQL data (also for
      // photo stories Facebook turned into a video, e.g. with music).
      scanPageData();
      const card = location.pathname.split("/").filter(Boolean).at(-1);
      const videoId = storyVideos.get(card);
      const known = videos.get(videoId);
      if (known) return { url: bestVideoUrl(known), ext: "mp4", box: player || video || image, videoId };
      if (!player && !video) {
        const url = httpUrl(image && (image.currentSrc || image.src));
        return url && { url, ext: (url.match(/\.(jpe?g|png|webp)(?:[?#]|$)/i) || [])[1] || "jpg", box: image };
      }
      const recentSniffed = sniffed.filter((s) => s.href === location.href).at(-1) || sniffed.at(-1);
      const performanceMp4 = performance
        .getEntriesByType("resource")
        .map((e) => e.name)
        .reverse()
        .find((u) => /\.fbcdn\.net\//i.test(u) && /\.mp4(?:[?#]|$)/i.test(u) && !/bytestart/i.test(u));
      const url =
        httpUrl(video && (video.currentSrc || video.src)) ||
        fiberVideoUrl(video) ||
        (recentSniffed && recentSniffed.url) ||
        performanceMp4 ||
        devtoolsVideoUrl(video, player);
      return url && { url, ext: "mp4", box: player || video };
    }

    // <username or profile id>_<video id>.mp4 for videos, _<original file name> for photos
    function storyFilename(url, ext, box, videoId) {
      const skip = new Set(["stories", "profile.php", "l.php", "watch", "reel", "home.php", "groups", "marketplace", "gaming"]);
      let username;
      if (box) {
        const r = box.getBoundingClientRect();
        username = [...document.querySelectorAll("a[href]")]
          .flatMap((a) => {
            try {
              const u = new URL(a.href);
              const name = u.hostname.endsWith("facebook.com") ? (u.pathname.match(/^\/([^/?]+)/) || [])[1] : undefined;
              const ar = a.getBoundingClientRect();
              if (!name || skip.has(name) || ar.width < 1 || ar.height < 1) return [];
              return [{ name, distance: Math.abs(ar.top + ar.height / 2 - (r.top + 42)) + 0.15 * Math.abs(ar.left - r.left) }];
            } catch {
              return [];
            }
          })
          .sort((a, b) => a.distance - b.distance)
          .map((x) => x.name)[0];
      }
      const bucket = (location.pathname.match(/\/stories\/(\d+)/) || [])[1];
      const last = location.pathname.split("/").filter(Boolean).at(-1);
      let cardId;
      try {
        cardId = (atob(last).match(/\d{6,}/) || [])[0];
      } catch {}
      const name = videoId ? `${videoId}.mp4` : fileNameOf(url);
      return `${safeName(username || bucket || "unknown")}_${safeName(/\.[a-z0-9]{2,5}$/i.test(name) ? name : `${cardId || "media"}.${ext}`)}`;
    }

    async function downloadStory() {
      const media = storyMedia();
      if (!media) throw new Error("Chưa lấy được link Story");
      await scSaveUrl(media.url, storyFilename(media.url, media.ext, media.box, media.videoId));
    }

    function syncStoryButton() {
      let button = document.getElementById("sc-facebook-story-dl");
      if (!isStoryPage()) return void (button && button.remove());
      const { video, box } = currentStory();
      if (!box) return void (button && button.remove());
      if (!button) {
        button = scButton("overlay", "download", "Tải Facebook Story");
        button.id = "sc-facebook-story-dl";
        button.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          scRun(button, downloadStory);
        });
        document.body.append(button);
      }
      // Only position and label are refreshed here; rewriting the content would
      // re-trigger the DOM observer and wipe the ✓/× feedback.
      const r = box.getBoundingClientRect();
      // Inside the top-right corner, below the story header controls.
      button.style.left = `${Math.round(Math.max(8, r.right - 44))}px`;
      button.style.top = `${Math.round(Math.max(8, r.top + 64))}px`;
      button.dataset.label = video ? "Tải Facebook Story video" : "Tải Facebook Story ảnh";
      if (!button.dataset.state) button.title = button.dataset.label;
    }

    // ---- Photo download ----
    const photoIdOf = (href) => {
      try {
        const url = new URL(href, location.href);
        return url.searchParams.get("fbid") || (url.pathname.match(/\/photos\/(?:[^/]+\/)*?(\d{8,})/) || [])[1] || null;
      } catch {
        return null;
      }
    };
    const safeName = (s) => String(s).replace(/[\\/:*?"<>|]/g, "_");
    const fileNameOf = (url) => {
      try {
        return decodeURIComponent(new URL(url).pathname.split("/").pop()) || "photo.jpg";
      } catch {
        return "photo.jpg";
      }
    };
    // Profile vanity name (or numeric id) from a facebook.com profile link.
    const profileNameOf = (href) => {
      try {
        const url = new URL(href, location.href);
        if (!url.hostname.endsWith("facebook.com")) return null;
        const first = url.pathname.split("/").filter(Boolean)[0];
        if (first === "profile.php") return url.searchParams.get("id");
        if (!first || /^(photo|photo\.php|photos|groups|watch|reel|stories|events|pages|permalink\.php|story\.php|hashtag)$/.test(first))
          return null;
        return first;
      } catch {
        return null;
      }
    };
    // Who posted the photo: their username, else their numeric profile id (from
    // a profile.php?id= link or the photo's GraphQL owner), else the photo's
    // fbid. Every header link is checked: in groups the first one is the group.
    function mediaOwner(scope, fbid, ownerId = photos.get(fbid)?.ownerId) {
      const post = scope && scope.closest('[aria-posinset],[role="article"]');
      const names = [
        ...(post ? post.querySelectorAll("h2 a[href], h3 a[href], h4 a[href], strong a[href]") : []),
        location,
        ...document.querySelectorAll('[role="dialog"] h2 a[href], [role="complementary"] h2 a[href], [role="main"] h2 a[href]'),
      ]
        .map((a) => profileNameOf(a.href))
        .filter(Boolean);
      return names.find((n) => !/^\d+$/.test(n)) || names.find((n) => /^\d+$/.test(n)) || ownerId || fbid;
    }
    // Downloads the large viewer copy when known, otherwise the copy on screen.
    async function downloadPhoto(fbid, img, scope) {
      scanPageData();
      const photo = photos.get(fbid);
      const url = (photo && photo.uri) || img.currentSrc || img.src;
      if (!url || !/^https?:/.test(url)) throw new Error("Chưa lấy được link ảnh");
      await scSaveUrl(url, `${safeName(mediaOwner(scope, fbid))}_${safeName(fileNameOf(url))}`);
    }
    const setTokenOf = (href) => {
      try {
        return new URL(href, location.href).searchParams.get("set");
      } catch {
        return null;
      }
    };
    // All photos of a post, one after another; reports any it had no data for.
    async function downloadSet(token, scope) {
      scanPageData();
      const ids = mediasets.get(token) || [];
      let missing = 0;
      for (const id of ids) {
        const photo = photos.get(id);
        if (!photo) {
          missing++;
          continue;
        }
        await scSaveUrl(photo.uri, `${safeName(mediaOwner(scope, id))}_${safeName(fileNameOf(photo.uri))}`);
      }
      if (missing) throw new Error(`Thiếu dữ liệu ${missing}/${ids.length} ảnh — cuộn lại bài viết rồi thử lại`);
    }
    // The photo set of a post: the set= token of its photo links, when the
    // GraphQL data listed more than one photo for it.
    function postSetOf(post) {
      for (const link of post.querySelectorAll('a[href*="set="]')) {
        const token = setTokenOf(link.href);
        if (token && (mediasets.get(token) || []).length > 1) return token;
      }
      return null;
    }
    function setButton(token, scope, style) {
      const count = (mediasets.get(token) || []).length;
      const button = scButton(style, "stack", `Tải cả bộ ${count} ảnh`, { small: style === "inline" });
      button.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          scRun(button, () => downloadSet(token, scope));
        },
        true,
      );
      return button;
    }
    // Feed posts with several photos: a stack button next to quick save.
    function decorateSets() {
      document.querySelectorAll(".sc-facebook-quick-save:not([data-sc-set])").forEach((save) => {
        const post = save.closest('[aria-posinset],[role="article"]');
        const token = post && postSetOf(post);
        if (!token) return;
        save.dataset.scSet = "1";
        const button = setButton(token, post, "inline");
        button.classList.add("sc-facebook-quick-set");
        save.parentElement.append(button);
      });
    }

    function photoButton(fbid, img, scope) {
      const button = scButton("overlay", "download", "Tải ảnh gốc");
      const stop = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };
      ["pointerdown", "mousedown", "mouseup", "dblclick"].forEach((type) => button.addEventListener(type, stop, true));
      button.addEventListener(
        "click",
        (e) => {
          stop(e);
          scRun(button, () => downloadPhoto(fbid, img, scope));
        },
        true,
      );
      return button;
    }

    // Every photo link (feed, profile, albums) with a large enough image.
    function decoratePhotos() {
      document.querySelectorAll('a[href*="fbid="]:not([data-sc-photo]), a[href*="/photos/"]:not([data-sc-photo])').forEach((link) => {
        const fbid = photoIdOf(link.href);
        if (!fbid) return void (link.dataset.scPhoto = "0");
        const img = link.querySelector("img");
        if (!img) return;
        const r = img.getBoundingClientRect();
        if (r.width < 150 || r.height < 150) return;
        link.dataset.scPhoto = "1";
        if (getComputedStyle(link).position === "static") link.style.position = "relative";
        const button = photoButton(fbid, img, link);
        button.classList.add("sc-fb-photo-dl");
        link.append(button);
      });
    }

    // The photo viewer (/photo/?fbid=…, also opened as an overlay from the feed).
    function syncViewerButton() {
      let button = document.getElementById("sc-fb-photo-viewer-dl");
      const fbid = photoIdOf(location.href);
      const img =
        fbid &&
        largestFirst([...document.querySelectorAll('img[data-visualcompletion="media-vc-image"]')].filter(inViewport))[0];
      if (!img) {
        document.getElementById("sc-fb-photo-viewer-all")?.remove();
        return void (button && button.remove());
      }
      if (!button || button.dataset.fbid !== fbid) {
        if (button) button.remove();
        button = photoButton(fbid, img, img);
        button.id = "sc-fb-photo-viewer-dl";
        button.dataset.fbid = fbid;
        document.body.append(button);
      }
      const r = img.getBoundingClientRect();
      button.style.left = `${Math.round(Math.max(8, r.right - 44))}px`;
      button.style.top = `${Math.round(Math.max(8, r.top + 12))}px`;

      const token = setTokenOf(location.href);
      let all = document.getElementById("sc-fb-photo-viewer-all");
      if (!token || (mediasets.get(token) || []).length < 2) return void (all && all.remove());
      if (!all || all.dataset.token !== token) {
        if (all) all.remove();
        all = setButton(token, img, "overlay");
        all.id = "sc-fb-photo-viewer-all";
        all.dataset.token = token;
        document.body.append(all);
      }
      all.style.left = `${Math.round(Math.max(8, r.right - 84))}px`;
      all.style.top = button.style.top;
    }

    // ---- Video download (feed, reels, watch) ----
    const videoIdFromUrl = () =>
      (location.pathname.match(/\/(?:reel|videos)\/(?:[^/]+\/)?(\d{6,})/) || [])[1] || new URLSearchParams(location.search).get("v");
    // The video's id: its data-video-id, else the nearest reel/video/watch link
    // inside its own post (stops at a container holding other videos), else the
    // page URL (/reel/<id>, /videos/<id>, watch?v=<id>).
    function videoIdOf(video) {
      const own = video.closest("[data-video-id]")?.getAttribute("data-video-id");
      if (own && /^\d+$/.test(own)) return own;
      let el = video.parentElement;
      for (let i = 0; el && i < 14 && el.querySelectorAll("video").length < 2; i++, el = el.parentElement)
        for (const a of el.querySelectorAll('a[href*="/reel/"],a[href*="/videos/"],a[href*="watch/?v="],a[href*="watch?v="]')) {
          const m = a.href.match(/\/reel\/(\d+)|\/videos\/(?:[^/?]+\/)?(\d+)|[?&]v=(\d+)/);
          if (m) return m[1] || m[2] || m[3];
        }
      return videoIdFromUrl();
    }
    async function downloadVideo(video) {
      scanPageData();
      const id = videoIdOf(video);
      if (!id) throw new Error("Không tìm được ID video");
      const data = videos.get(id);
      const url = data && bestVideoUrl(data);
      if (!url) throw new Error("Chưa có dữ liệu video này — cuộn lại hoặc tải lại trang");
      await scSaveUrl(url, `${safeName(mediaOwner(video, id, data.ownerId))}_${id}.mp4`);
    }
    function decorateVideos() {
      if (isStoryPage()) return;
      document.querySelectorAll("video:not([data-sc-video])").forEach((video) => {
        const r = video.getBoundingClientRect();
        const host = video.parentElement;
        if (!host || r.width < 200 || r.height < 150) return;
        video.dataset.scVideo = "1";
        if (getComputedStyle(host).position === "static") host.style.position = "relative";
        const button = scButton("overlay", "download", "Tải video (nét nhất, không tiếng)");
        button.classList.add("sc-fb-video-dl");
        const stop = (e) => {
          e.preventDefault();
          e.stopPropagation();
        };
        ["pointerdown", "mousedown", "mouseup", "dblclick"].forEach((type) => button.addEventListener(type, stop, true));
        button.addEventListener(
          "click",
          (e) => {
            stop(e);
            scRun(button, () => downloadVideo(video));
          },
          true,
        );
        host.append(button);
      });
    }

    // Look comes from the shared kit; only placement and Facebook's icon colour here.
    GM_addStyle(
      ".sc-in.sc-facebook-quick-save{position:absolute;right:46px;top:1px;z-index:100;color:var(--secondary-icon,currentColor)!important}" +
        ".sc-in.sc-facebook-quick-unsave{color:var(--secondary-icon,currentColor)!important}" +
        "#sc-facebook-story-dl,#sc-fb-photo-viewer-dl,#sc-fb-photo-viewer-all{position:fixed;z-index:2147483647}" +
        ".sc-in.sc-facebook-quick-set{position:absolute;right:80px;top:1px;z-index:100;color:var(--secondary-icon,currentColor)!important}" +
        ".sc-ov.sc-fb-photo-dl,.sc-ov.sc-fb-video-dl{right:8px;top:8px}",
    );

    scWatchDom(() => {
      scanPageData();
      decoratePhotos();
      decorateVideos();
      syncViewerButton();
      decorateQuickSave();
      decorateSets();
      decorateQuickUnsave();
      syncStoryButton();
    });
  })();
