/* Social All-in-One implementation. It is bundled and loaded by the local userscript loader. */

declare const GM_getValue: <T>(key: string, fallback: T) => Promise<T>;
declare const GM_setValue: (key: string, value: unknown) => Promise<void>;
declare const GM_download: (options: { url: string; name: string; saveAs?: boolean; onerror?: (error: unknown) => void }) => void;
declare const GM_addStyle: (css: string) => void;
declare const unsafeWindow: Window;

type Platform = 'facebook' | 'instagram' | 'threads' | 'unknown';
type IgUser = { id: string; username: string; full_name: string; profile_pic_url: string; is_verified: boolean };
type Metadata = { id: string; username: string; fullName: string; mediaCount: number; isPrivate: boolean; isVerified: boolean; followedByViewer: boolean; followsViewer: boolean };

const APP_ID = '936619743392459';
const STORE_KEY = 'sc:ig-results';
let scanStopped = false;
let threadsHeaders: Record<string, string> = {};
const threadsDownloadHitAreas = new Map<HTMLButtonElement, () => Promise<void>>();
let threadsDownloadHitInterceptorInstalled = false;

const platform = (): Platform => {
  const host = location.hostname;
  if (host.includes('facebook.com')) return 'facebook';
  if (host.includes('instagram.com')) return 'instagram';
  if (host.includes('threads.net') || host.includes('threads.com')) return 'threads';
  return 'unknown';
};

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
const cleanUsername = (value: string) => value.trim().replace(/^@/, '').replace(/\/.+$/, '');
const escapeCsv = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;

function installStyles() {
  GM_addStyle(`
    #sc-launcher{position:fixed;right:18px;bottom:18px;z-index:2147483646;border:0;border-radius:50%;width:46px;height:46px;background:#635bff;color:#fff;font-size:22px;cursor:pointer;box-shadow:0 6px 24px #0006}
    #sc-panel{position:fixed;right:18px;bottom:74px;z-index:2147483646;width:350px;max-height:75vh;overflow:auto;background:#111827;color:#e5e7eb;border:1px solid #374151;border-radius:12px;padding:14px;font:13px system-ui,sans-serif;box-shadow:0 16px 40px #0009}
    #sc-panel[hidden]{display:none}.sc-row{display:flex;gap:8px;margin:8px 0}.sc-row>*{min-width:0}.sc-input{flex:1;padding:8px;border:1px solid #4b5563;border-radius:7px;background:#1f2937;color:#fff}.sc-btn{padding:8px 10px;border:0;border-radius:7px;background:#635bff;color:#fff;cursor:pointer}.sc-btn.alt{background:#374151}.sc-btn.danger{background:#be123c}.sc-muted{color:#9ca3af;margin:6px 0}.sc-status{white-space:pre-wrap;max-height:160px;overflow:auto;padding:8px;background:#0b1220;border-radius:7px}.sc-unsave-btn{z-index:2147483645!important;cursor:pointer!important;border:0!important;color:#fff!important;background:#be123c!important;border-radius:999px!important;line-height:1!important}.sc-unsave-btn{position:absolute!important;right:6px!important;top:6px!important;padding:6px!important;font-size:10px!important}.sc-save-btn-small{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;background:rgba(99,102,241,.1);color:#6366f1;border:1px solid rgba(99,102,241,.2);border-radius:50%;cursor:pointer;transition:all .2s ease}.sc-save-btn-small:hover{background:rgba(99,102,241,.2);transform:scale(1.1)}.sc-threads-save-btn{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;background:rgba(0,0,0,.5);color:rgba(255,255,255,.9);border:1px solid rgba(255,255,255,.4);border-radius:50%;cursor:pointer;backdrop-filter:blur(4px);transition:all .2s cubic-bezier(.175,.885,.32,1.275)}.sc-threads-save-btn:hover{background:rgba(0,0,0,.8);transform:scale(1.1);border-color:#fff;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.5)}.loading{animation:sc-pulse 1s infinite ease-in-out}.success{animation:sc-pop .4s forwards}.sc-threads-save-btn.success svg,.sc-save-btn-small.success svg{fill:currentColor!important;stroke:none!important}@keyframes sc-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.1);opacity:.7}}@keyframes sc-pop{0%{transform:scale(1)}50%{transform:scale(1.4)}100%{transform:scale(1.1)}}.sc-dl-container:hover .sc-thread-btn{opacity:1!important}.sc-thread-btn{position:absolute!important;right:10px!important;top:10px!important;z-index:2147483645!important;display:flex!important;align-items:center!important;justify-content:center!important;width:32px!important;height:32px!important;padding:0!important;border:1.5px solid rgba(255,255,255,.52)!important;border-radius:50%!important;background:rgba(0,0,0,.62)!important;color:rgba(255,255,255,.94)!important;backdrop-filter:blur(8px)!important;box-shadow:0 3px 12px rgba(0,0,0,.35)!important;opacity:.88!important;pointer-events:auto!important;cursor:pointer!important;transition:opacity .2s ease,transform .22s cubic-bezier(.175,.885,.32,1.275),background .2s ease!important}.sc-thread-btn:hover{background:rgba(0,0,0,.86)!important;transform:scale(1.12)!important;border-color:#fff!important}.sc-thread-btn svg{width:18px!important;height:18px!important;fill:currentColor!important}
  `);
}

function clickText(keywords: string[], excludes: string[] = [], root: ParentNode = document) {
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('div,span,button,a'))) {
    const text = (el.textContent || '').trim().toLowerCase();
    if (!text || text.length > 35 || !el.offsetParent) continue;
    if (!keywords.some(word => text.includes(word)) || excludes.some(word => text.includes(word))) continue;
    if (Array.from(el.children).some(child => keywords.some(word => (child.textContent || '').toLowerCase().includes(word)))) continue;
    (el.closest<HTMLElement>('[role="menuitem"],button,[role="button"]') || el).click();
    return true;
  }
  return false;
}

function openMenuRoot() {
  return Array.from(document.querySelectorAll<HTMLElement>('[role="menu"]')).find(menu => !!menu.offsetParent) || null;
}

function autoClickDone(delay = 1000, maxAttempts = 30) {
  let attempts = 0;
  const findDone = () => {
    const done = Array.from(document.querySelectorAll<HTMLElement>('div[role="dialog"] [role="button"],div[role="dialog"] button,div[aria-modal="true"] span')).find(el => /^(done|hoàn tất|xong|chấp hành|chấp nhận)$/i.test((el.textContent || '').trim()));
    if (done) { done.click(); return; }
    if (++attempts < maxAttempts) setTimeout(findDone, 200);
  };
  setTimeout(findDone, delay);
}

function injectFacebookQuickSave() {
  const selector = '[aria-label="Actions for this post"],[aria-label="More actions"],[aria-label*="Tùy chọn"],[aria-label*="Hành động"],[aria-label="Actions"]';
  document.querySelectorAll<HTMLElement>(selector).forEach(menu => {
    const parentRow = menu.parentElement?.parentElement;
    if (!parentRow || parentRow.querySelector('.sc-save-container')) return;
    const container = document.createElement('div'); container.className = 'sc-save-container'; container.style.cssText = 'position:absolute!important;right:52px;top:2px;z-index:100;display:flex;align-items:center;';
    const button = document.createElement('button'); button.className = 'sc-save-btn-small'; button.title = 'Lưu nhanh'; button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
    button.onclick = event => { event.preventDefault(); event.stopPropagation(); button.classList.remove('success', 'error'); button.classList.add('loading'); menu.click(); let attempts = 0; const save = () => { const root = openMenuRoot(); if (root && clickText(['save', 'lưu'], ['xem', 'view', 'undo', 'hoàn tác', 'mục đã lưu', 'saved items'], root)) { autoClickDone(); button.classList.remove('loading'); button.classList.add('success'); } else if (++attempts < 15) setTimeout(save, 300); else { button.classList.remove('loading'); button.classList.add('error'); } }; setTimeout(save, 600); };
    if (getComputedStyle(parentRow).position === 'static') parentRow.style.position = 'relative'; container.append(button); parentRow.append(container);
  });
}

function injectThreadsQuickSave() {
  const isSavedPage = location.pathname.includes('/saved');
  // In the current Threads UI most post menus are SVGs with title="More";
  // older builds exposed aria-label="More". Support both, without class names.
  const selector = 'svg[aria-label="More"],svg[title="More"],[aria-label*="Tùy chọn"],[aria-label*="Hành động"],[aria-label="More actions"],[aria-label="Actions"]';
  document.querySelectorAll<HTMLElement>(selector).forEach(menu => {
    if (menu.closest('header,nav,[role="banner"],[role="navigation"]')) return;
    let postHeader: HTMLElement | null = null;
    // A real post's permalink lives within five ancestors of its More button.
    // The "For you" column menu reaches post links only through the whole feed.
    for (let current: HTMLElement | null = menu, depth = 0; current && depth <= 5 && !postHeader; current = current.parentElement, depth += 1) {
      if (current.querySelector('a[href*="/post/"],a[href*="/p/"]')) postHeader = current;
    }
    // The column header now also has a post URL, but its local text contains
    // the view count. A post's own More button does not.
    if (!postHeader || /\bviews?/i.test(postHeader.textContent || '')) return;
    const parentRow = (menu.closest<HTMLElement>('[role="button"]') || menu.parentElement)?.parentElement;
    if (!parentRow || parentRow.querySelector('.sc-threads-save-container')) return;
    const svgCount = parentRow.querySelectorAll('svg').length; const container = document.createElement('div'); container.className = 'sc-threads-save-container'; container.style.cssText = `position:absolute!important;right:${svgCount > 1 ? '72px' : '40px'};top:-10px;z-index:100;display:flex;align-items:center;justify-content:center;width:32px;height:32px;`;
    const button = document.createElement('button'); button.className = 'sc-threads-save-btn'; button.title = isSavedPage ? 'Bỏ lưu nhanh' : 'Lưu nhanh'; button.innerHTML = isSavedPage ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
    button.onclick = event => { event.preventDefault(); event.stopPropagation(); button.classList.add('loading'); (menu.closest<HTMLElement>('[role="button"]') || menu.closest<HTMLElement>('button') || menu).click(); let attempts = 0; const action = () => { const root = openMenuRoot(); const target = root && clickText(isSavedPage ? ['unsave', 'bỏ lưu'] : ['save', 'lưu'], ['xem', 'view', 'undo', 'hoàn tác', 'mục đã lưu', 'saved items'], root); if (target) { button.classList.remove('loading'); button.classList.add('success'); } else if (++attempts < 15) setTimeout(action, 300); else { button.classList.remove('loading'); button.classList.add('error'); } }; setTimeout(action, 600); };
    if (getComputedStyle(parentRow).position === 'static') parentRow.style.position = 'relative'; container.append(button); parentRow.append(container);
  });
}

function instagramUnsave() {
  if (!location.pathname.includes('/saved/all-posts/')) return;
  document.querySelectorAll<HTMLElement>('main a[href*="/p/"]').forEach(card => {
    if (card.querySelector('.sc-unsave-btn')) return;
    const button = document.createElement('button'); button.className = 'sc-unsave-btn'; button.textContent = '✕ UNSAVE';
    button.onclick = event => {
      event.preventDefault(); event.stopPropagation(); card.click();
      setTimeout(() => {
        const icon = document.querySelector('svg[aria-label="Remove"]');
        (icon?.closest<HTMLElement>('button,[role="button"]'))?.click();
        setTimeout(() => { (document.querySelector('svg[aria-label="Close"]')?.closest<HTMLElement>('button,[role="button"]'))?.click(); card.remove(); }, 500);
      }, 120);
    };
    if (getComputedStyle(card).position === 'static') card.style.position = 'relative'; card.append(button);
  });
}

function download(url: string, filename: string) {
  GM_download({ url, name: filename, saveAs: false, onerror: () => window.open(url, '_blank', 'noopener') });
}

function shortcodeToId(shortcode: string) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'; let id = 0n;
  for (const char of shortcode) { const value = alphabet.indexOf(char); if (value >= 0) id = id * 64n + BigInt(value); }
  return id.toString();
}

function getThreadsUsername(el: HTMLElement) {
  let current: HTMLElement | null = el;
  for (let depth = 0; depth < 30 && current; depth += 1, current = current.parentElement) {
    const links = Array.from(current.querySelectorAll<HTMLAnchorElement>('a[href*="/@"]'));
    const author = links.find(link => { const text = link.textContent?.trim() || ''; return text.length === 0 || !text.startsWith('@'); });
    const username = author?.href.match(/@([^/?#]+)/)?.[1];
    if (username) return username;
  }
  return 'threads';
}

function getThreadsPostId(el: HTMLElement) {
  let current: HTMLElement | null = el;
  for (let depth = 0; depth < 15 && current; depth += 1, current = current.parentElement) {
    const href = current.querySelector<HTMLAnchorElement>('a[href*="/post/"],a[href*="/p/"]')?.href;
    const shortcode = href?.match(/\/(?:post|p)\/([^/?#]+)/)?.[1];
    if (shortcode) return shortcodeToId(shortcode);
  }
  const shortcode = location.pathname.match(/\/(?:post|p)\/([^/?#]+)/)?.[1];
  return shortcode ? shortcodeToId(shortcode) : null;
}

async function threadsGraphql(postId: string): Promise<Array<{ url: string; kind: 'image' | 'video'; id?: string }>> {
  const postID = /^\d+$/.test(postId) ? postId : shortcodeToId(postId);
  const csrfToken = threadsHeaders['x-csrftoken'] || document.cookie.match(/(?:^|; )csrftoken=([^;]+)/)?.[1] || '';
  const variables = {
    postID,
    __relay_internal__pv__BarcelonaOptionalCookiesEnabledrelayprovider: true,
    __relay_internal__pv__BarcelonaIsLoggedInrelayprovider: false,
    __relay_internal__pv__BarcelonaHasGhostPostConsumptionrelayprovider: true,
    __relay_internal__pv__IsTagIndicatorEnabledrelayprovider: true,
    __relay_internal__pv__BarcelonaHasDeepDiverelayprovider: false,
    __relay_internal__pv__BarcelonaHasSpoilerStylingInforelayprovider: false,
    __relay_internal__pv__BarcelonaHasGhostPostEmojiActivationrelayprovider: false,
    __relay_internal__pv__BarcelonaHasPodcastConsumptionrelayprovider: true,
  };
  const body = new URLSearchParams({ variables: JSON.stringify(variables), doc_id: '25345179165155449' });
  const response = await unsafeWindow.fetch('https://www.threads.com/graphql/query', {
    method: 'POST', credentials: 'include', headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-CSRFToken': csrfToken,
      'X-IG-App-ID': threadsHeaders['x-ig-app-id'] || '238280553337426',
      'X-FB-LSD': threadsHeaders['x-fb-lsd'] || 'AVpX_XXXX',
      'X-ASBD-ID': threadsHeaders['x-asbd-id'] || '129477',
      'X-FB-Friendly-Name': 'BarcelonaLightboxDialogRootQuery',
    }, body,
  });
  if (!response.ok) throw new Error(`Threads GraphQL trả ${response.status}. Có thể Threads vừa đổi token/API.`);
  const json = await response.json(); const raw = json?.data?.data || json?.data;
  const post = raw?.pk === postID ? raw : (raw?.edges || []).flatMap((edge: any) => edge.node?.thread_items || []).map((item: any) => item.post).find((item: any) => String(item?.pk) === postID) || raw?.containing_thread?.thread_items?.map((item: any) => item.post).find((item: any) => String(item?.pk) === postID);
  if (!post) return [];
  const media = post.carousel_media || [post];
  return media.flatMap((item: any) => item.video_versions?.[0]?.url ? [{ url: item.video_versions[0].url, kind: 'video' as const, id: item.pk }] : item.image_versions2?.candidates?.[0]?.url ? [{ url: item.image_versions2.candidates.sort((a: any, b: any) => b.width * b.height - a.width * a.height)[0].url, kind: 'image' as const, id: item.pk }] : []);
}

async function downloadThreadsMedia(url: string, filename: string) {
  // This is intentionally the same blob + <a download> mechanism as the
  // original extension, so browsers preserve the filename exactly.
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Không tải được media (${response.status}).`);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl; anchor.download = filename; anchor.style.display = 'none';
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

function installThreadsDownloadHitInterceptor() {
  if (threadsDownloadHitInterceptorInstalled) return;
  threadsDownloadHitInterceptorInstalled = true;
  // Some Saved-carousel cells have a Threads-owned transparent pressable
  // layer above our attached button. Detect a press inside the visible icon
  // rectangle before that layer handles it; the icon still stays in its card.
  const intercept = (event: PointerEvent | MouseEvent, startDownload: boolean) => {
    if (event.button !== 0 || event.target instanceof Element && event.target.closest('.sc-thread-btn')) return;
    for (const [button, download] of threadsDownloadHitAreas) {
      if (!button.isConnected) { threadsDownloadHitAreas.delete(button); continue; }
      const rect = button.getBoundingClientRect();
      if (getComputedStyle(button).display === 'none' || event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) continue;
      event.preventDefault(); event.stopImmediatePropagation(); event.stopPropagation();
      if (startDownload) void download();
      return;
    }
  };
  document.addEventListener('pointerdown', event => intercept(event, true), true);
  // Prevent the later synthesized click from reaching Threads' post opener.
  document.addEventListener('click', event => intercept(event, false), true);
}

function threadsDownloader() {
  document.querySelectorAll<HTMLElement>('img, div[aria-label="Video player"]').forEach(media => {
    if (media.hasAttribute('data-sc-dl')) return;
    const image = media instanceof HTMLImageElement ? media : null;
    if (image) {
      // A video player can contain a poster <img>. It is not a separate image
      // download target, otherwise the player receives two overlapping buttons.
      if (image.closest('div[aria-label="Video player"]')) return;
      const box = image.getBoundingClientRect();
      const alt = image.alt.toLowerCase();
      // Threads often serves 700px avatars inside a 36px circle. Natural size is
      // therefore useless; only accept a real, visible post-media box.
      if (box.width < 120 || box.height < 120 || /profile picture|avatar/.test(alt)) return;
    }
    media.setAttribute('data-sc-dl', '1');
    // Current Threads wraps each carousel image in a button. Appending a button
    // inside it creates invalid nested controls and makes the carousel paint black.
    const mediaControl = media.closest<HTMLElement>('button,a,[role="button"]');
    // Saved-page videos are wrapped in <a href="…/post/…">. Use its parent
    // as the overlay host too; otherwise the link wins and opens the post.
    // For carousel images, the immediate parent is inside Threads' pressable
    // layer. Use the next card wrapper up: it has the same image bounds but
    // lets our control sit above that layer without becoming a floating portal.
    const container = mediaControl?.parentElement || image?.parentElement || media;
    if (!container) return;
    container.classList.add('sc-dl-container');
    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
    const button = document.createElement('button'); button.type = 'button'; button.className = 'sc-thread-btn'; button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 3h2v10.17l3.59-3.58L18 11l-6 6-6-6 1.41-1.41L11 13.17V3zm-6 16h14v2H5v-2z"/></svg>'; button.title = 'Tải media';
    const username = getThreadsUsername(media);
    // Threads treats a press anywhere on the media card as navigation. Block
    // pointer events before its card handler sees them, then handle click here.
    const blockCardNavigation = (event: Event) => { event.stopPropagation(); };
    button.addEventListener('pointerdown', blockCardNavigation, true);
    button.addEventListener('mousedown', blockCardNavigation, true);
    button.addEventListener('mouseup', blockCardNavigation, true);
    let downloading = false;
    const startDownload = async () => {
      if (downloading) return;
      downloading = true; button.textContent = '…';
      try {
        if (image) {
          const originalFilename = new URL(image.src).pathname.split('/').pop() || 'image.jpg';
          await downloadThreadsMedia(image.src, `threads_${username}_${originalFilename}`);
        }
        else {
          const article = media.closest('article,[data-pressable-container]') || document.body;
          const postId = getThreadsPostId(media); if (!postId) throw new Error('Không tìm được mã bài Threads.');
          const items = await threadsGraphql(postId); const index = Array.from(article.querySelectorAll('div[aria-label="Video player"]')).indexOf(media);
          const item = items.filter(item => item.kind === 'video')[Math.max(0, index)]; if (!item) throw new Error('Không lấy được link video.');
          await downloadThreadsMedia(item.url, `threads_${username}_${item.id || postId}.mp4`);
        }
        button.textContent = '✓';
      } catch (error) { console.warn('[Social All-in-One]', error); button.textContent = '×'; }
      finally { downloading = false; }
    };
    button.addEventListener('click', event => {
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); void startDownload();
    }, true);
    container.append(button);
    threadsDownloadHitAreas.set(button, startDownload);
    installThreadsDownloadHitInterceptor();
  });
}

async function igFetch(path: string) {
  const response = await unsafeWindow.fetch(`https://i.instagram.com${path}`, { credentials: 'include', headers: { 'X-IG-App-ID': APP_ID, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Instagram trả ${response.status}. Hãy mở Instagram và đăng nhập trước.`);
  return response.json();
}

async function scanInstagram(username: string, type: 'followers' | 'following', log: (message: string) => void) {
  scanStopped = false; const clean = cleanUsername(username); const profile = await igFetch(`/api/v1/users/web_profile_info/?username=${encodeURIComponent(clean)}`); const user = profile.data?.user || profile.user;
  if (!user?.id && !user?.pk) throw new Error(`Không tìm thấy @${clean}.`);
  const id = user.id || user.pk; const total = type === 'followers' ? user.edge_followed_by?.count ?? user.follower_count ?? 0 : user.edge_follow?.count ?? user.following_count ?? 0;
  const result: IgUser[] = []; let cursor: string | null = null;
  while (!scanStopped) {
    const query = new URLSearchParams({ count: '50', ...(cursor ? { max_id: cursor } : {}) }); const data = await igFetch(`/api/v1/friendships/${id}/${type}/?${query}`);
    result.push(...(data.users || []).map((entry: any) => ({ id: String(entry.id || entry.pk), username: entry.username, full_name: entry.full_name || '', profile_pic_url: entry.profile_pic_url || '', is_verified: !!entry.is_verified })));
    log(`${type}: ${result.length}/${total || '?'} @${clean}`); cursor = data.next_max_id || null; if (!cursor) break; await sleep(1100 + Math.random() * 900);
  }
  await GM_setValue(STORE_KEY, result); log(scanStopped ? `Đã dừng: lưu ${result.length} tài khoản.` : `Hoàn tất: ${result.length} tài khoản.`); return result;
}

async function scanMetadata(log: (message: string) => void) {
  const users = await GM_getValue<IgUser[]>(STORE_KEY, []); if (!users.length) throw new Error('Chưa có kết quả followers/following để quét.'); scanStopped = false;
  const rows: Metadata[] = [];
  for (const [index, item] of users.entries()) {
    if (scanStopped) break;
    try { const data = await igFetch(`/api/v1/users/web_profile_info/?username=${encodeURIComponent(item.username)}`); const user = data.data?.user || data.user; rows.push({ id: String(user.id || user.pk || ''), username: user.username, fullName: user.full_name || '', mediaCount: Number(user.media_count ?? user.edge_owner_to_timeline_media?.count ?? 0), isPrivate: !!user.is_private, isVerified: !!user.is_verified, followedByViewer: !!user.followed_by_viewer, followsViewer: !!user.follows_viewer }); } catch { /* a private/deleted account is skipped */ }
    log(`Metadata: ${index + 1}/${users.length}`); await sleep(2000 + Math.random() * 3000);
  }
  await GM_setValue('sc:ig-metadata', rows); log(`Metadata xong: ${rows.length} tài khoản.`); return rows;
}

function exportCsv(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) throw new Error('Chưa có dữ liệu để export.'); const headers = Object.keys(rows[0]); const csv = [headers.join(','), ...rows.map(row => headers.map(header => escapeCsv(row[header])).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); download(url, filename); setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function createDashboard() {
  const launcher = document.createElement('button'); launcher.id = 'sc-launcher'; launcher.textContent = '⚡'; launcher.title = 'Social All-in-One';
  const panel = document.createElement('section'); panel.id = 'sc-panel'; panel.hidden = true;
  panel.innerHTML = `<div class="sc-row"><strong>Social All-in-One</strong><span class="sc-muted" style="margin-left:auto">${platform()}</span></div><div class="sc-muted">Instagram scanner chạy bằng phiên đăng nhập của tab này.</div><div class="sc-row"><input id="sc-user" class="sc-input" placeholder="Instagram username"><select id="sc-type" class="sc-input"><option value="followers">Followers</option><option value="following">Following</option></select></div><div class="sc-row"><button id="sc-scan" class="sc-btn">Quét danh sách</button><button id="sc-meta" class="sc-btn alt">Quét metadata</button><button id="sc-stop" class="sc-btn danger">Dừng</button></div><div class="sc-row"><button id="sc-export-list" class="sc-btn alt">Export list CSV</button><button id="sc-export-meta" class="sc-btn alt">Export metadata CSV</button></div><pre id="sc-status" class="sc-status">Sẵn sàng.</pre>`;
  const status = panel.querySelector<HTMLElement>('#sc-status')!; const log = (message: string) => { status.textContent = `${new Date().toLocaleTimeString()}  ${message}\n${status.textContent || ''}`; };
  panel.querySelector<HTMLButtonElement>('#sc-scan')!.onclick = async () => { try { const username = (panel.querySelector<HTMLInputElement>('#sc-user')!).value; const type = (panel.querySelector<HTMLSelectElement>('#sc-type')!).value as 'followers' | 'following'; if (!username) throw new Error('Nhập username Instagram.'); await scanInstagram(username, type, log); } catch (error: any) { log(`Lỗi: ${error.message || error}`); } };
  panel.querySelector<HTMLButtonElement>('#sc-meta')!.onclick = async () => { try { await scanMetadata(log); } catch (error: any) { log(`Lỗi: ${error.message || error}`); } };
  panel.querySelector<HTMLButtonElement>('#sc-stop')!.onclick = () => { scanStopped = true; log('Đang yêu cầu dừng…'); };
  panel.querySelector<HTMLButtonElement>('#sc-export-list')!.onclick = async () => { try { exportCsv(await GM_getValue<Record<string, unknown>[]>(STORE_KEY, []), 'instagram-list.csv'); log('Đã export list.'); } catch (error: any) { log(`Lỗi: ${error.message || error}`); } };
  panel.querySelector<HTMLButtonElement>('#sc-export-meta')!.onclick = async () => { try { exportCsv(await GM_getValue<Record<string, unknown>[]>('sc:ig-metadata', []), 'instagram-metadata.csv'); log('Đã export metadata.'); } catch (error: any) { log(`Lỗi: ${error.message || error}`); } };
  launcher.onclick = () => { panel.hidden = !panel.hidden; }; document.body.append(launcher, panel);
}

function captureThreadsRequestHeaders() {
  if (platform() !== 'threads') return;
  const pageWindow = unsafeWindow as Window & { __scThreadsHeaderHook?: boolean };
  if (pageWindow.__scThreadsHeaderHook) return;
  pageWindow.__scThreadsHeaderHook = true;
  const originalFetch = pageWindow.fetch.bind(pageWindow);
  pageWindow.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (/threads\.(?:com|net)\/graphql\//.test(url)) {
      const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
      for (const name of ['x-fb-lsd', 'x-asbd-id', 'x-ig-app-id', 'x-csrftoken']) {
        const value = headers.get(name); if (value) threadsHeaders[name] = value;
      }
    }
    return originalFetch(input, init);
  };
}

function runPlatformFeatures() { const current = platform(); if (current === 'facebook') injectFacebookQuickSave(); if (current === 'instagram') instagramUnsave(); if (current === 'threads') { injectThreadsQuickSave(); threadsDownloader(); } }

function main() { installStyles(); captureThreadsRequestHeaders(); createDashboard(); runPlatformFeatures(); let timer: number | undefined; new MutationObserver(() => { clearTimeout(timer); timer = window.setTimeout(runPlatformFeatures, 500); }).observe(document.body, { childList: true, subtree: true }); console.info('[Social All-in-One] active:', platform()); }

main();
