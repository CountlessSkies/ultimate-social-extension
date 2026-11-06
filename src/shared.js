// Helpers shared by every module. They are top-level `var`/function
// declarations so the files after this one see them both in the built bundle
// (one script) and when the local loader @requires each src/ file separately.

var SC_TAG = "[Social All-in-One]";

// One MutationObserver for every module. It throttles instead of debouncing:
// pages with a playing video mutate continuously, and a debounce that restarts
// on every mutation would never fire there.
var scWatchDom = (() => {
  const callbacks = [];
  let timer = 0;
  let last = 0;
  const run = () => {
    timer = 0;
    if (!document.body) return;
    last = Date.now();
    for (const fn of callbacks) {
      try {
        fn();
      } catch (err) {
        console.error(SC_TAG, err);
      }
    }
  };
  const schedule = () => {
    if (!timer) timer = setTimeout(run, Math.max(0, 400 - (Date.now() - last)));
  };
  const start = () => {
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    schedule();
  };
  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start, { once: true });
  return (fn) => {
    callbacks.push(fn);
    schedule();
  };
})();

var scSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Polls `find` until it returns something truthy, or resolves null on timeout.
async function scWaitFor(find, { timeout = 3000, interval = 150 } = {}) {
  const end = Date.now() + timeout;
  for (;;) {
    const found = find();
    if (found) return found;
    if (Date.now() >= end) return null;
    await scSleep(interval);
  }
}

var scIsVisible = (el) => !!el && el.getClientRects().length > 0;
var scText = (el) => (el.textContent || "").trim().replace(/\s+/g, " ").toLowerCase();
var scIsTyping = (t) =>
  t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || !!(t && t.isContentEditable);

// Downloads `url` under `name`. The bytes are fetched first and saved through a
// Blob URL so `a.download` decides the file name (GM_download and the browser
// may ignore a name given for a cross-origin URL). GM_xmlhttpRequest covers
// CDNs that do not send CORS headers. `referer` is for CDNs that answer 403
// unless the request carries the site's cookies and Referer (TikTok videos):
// fetch then sends cookies, and GM_xmlhttpRequest sends that Referer.
async function scFetchBlob(url, { referer } = {}) {
  try {
    const res = await fetch(url, referer ? { credentials: "include" } : undefined);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    if (blob.size) return blob;
  } catch {
    // fall through to GM_xmlhttpRequest
  }
  return new Promise((resolve, reject) =>
    GM_xmlhttpRequest({
      method: "GET",
      url,
      headers: referer ? { Referer: referer } : undefined,
      responseType: "blob",
      onload: (r) =>
        r.status >= 200 && r.status < 300 && r.response && r.response.size
          ? resolve(r.response)
          : reject(new Error(`Media request: ${r.status}`)),
      onerror: () => reject(new Error("Media request failed")),
      ontimeout: () => reject(new Error("Media request timed out")),
    }),
  );
}
// ---- Download history ----
// Every saved file name is remembered in GM storage (one key per name). Our
// names are stable per media (<prefix><user>_<media id or CDN name>), so a
// known name means the file was downloaded before. Jobs that save several
// files (whole post, photo set) pass `skipSaved` and skip those; a click on
// one item always downloads. scRun reports the skip count of its job (jobs
// run one at a time in the queue, so one counter is enough).
var scSkipped = 0;
var scHistoryKey = (name) => `dl:${String(name).toLowerCase()}`;
var scWasSaved = (name) => !!GM_getValue(scHistoryKey(name), 0);
var scMarkSaved = (name) => GM_setValue(scHistoryKey(name), Date.now());
// True when the file should be skipped (and counts it).
function scSkipIfSaved(name, skipSaved) {
  if (!skipSaved || !scWasSaved(name)) return false;
  scSkipped++;
  return true;
}

// Returns false when skipped by `skipSaved`.
async function scSaveUrl(url, name, options = {}) {
  if (scSkipIfSaved(name, options.skipSaved)) return false;
  const blobUrl = URL.createObjectURL(await scFetchBlob(url, options));
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = name;
  a.style.display = "none";
  document.body.append(a);
  a.click();
  a.remove();
  // Large videos need time before the Blob URL can be released.
  setTimeout(() => URL.revokeObjectURL(blobUrl), 6e4);
  scMarkSaved(name);
  return true;
}

// ---- Button design kit ----
// Two button styles, one icon set, one accent and four shared states:
// - "overlay" (.sc-ov): round dark button laid over media (grid tiles, stories,
//   Threads images, Saved-page unsave).
// - "inline" (.sc-in): borderless icon next to the site's own controls (feed
//   action row, post "..." menu); it takes the site's icon colour.
// States: idle, loading (spinner), done (green check), error (red x; the
// reason is in the tooltip).
var SC_ACCENT = "#635bff";
var SC_ICONS = {
  download: '<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"/><path d="M7 11l5 5l5 -5"/><path d="M12 4l0 12"/>',
  stack: '<path d="M12 4l-8 4l8 4l8 -4l-8 -4"/><path d="M4 12l8 4l8 -4"/><path d="M4 16l8 4l8 -4"/>',
  bookmark: '<path d="M18 7v14l-6 -4l-6 4v-14a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4z"/>',
  "bookmark-off":
    '<path d="M7.708 3.721a3.982 3.982 0 0 1 2.292 -.721h4a4 4 0 0 1 4 4v7m0 4v3l-6 -4l-6 4v-14c0 -.308 .035 -.609 .1 -.897"/><path d="M3 3l18 18"/>',
  check: '<path d="M5 12l5 5l10 -10"/>',
  x: '<path d="M18 6l-12 12"/><path d="M6 6l12 12"/>',
  loader: '<path d="M12 3a9 9 0 1 0 9 9"/>',
  bolt: '<path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11"/>',
  eye: '<path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6"/>',
  "eye-off":
    '<path d="M10.585 10.587a2 2 0 0 0 2.829 2.828"/><path d="M16.681 16.673a8.717 8.717 0 0 1 -4.681 1.327c-3.6 0 -6.6 -2 -9 -6c1.272 -2.12 2.712 -3.678 4.32 -4.674m2.86 -1.146a9.055 9.055 0 0 1 1.82 -.18c3.6 0 6.6 2 9 6c-.666 1.11 -1.379 2.067 -2.138 2.87"/><path d="M3 3l18 18"/>',
};
// "<name>-filled" draws the same outline filled (e.g. a saved bookmark).
var scIcon = (name) => {
  const filled = name.endsWith("-filled");
  const path = SC_ICONS[filled ? name.slice(0, -7) : name];
  return `<svg class="sc-icon" viewBox="0 0 24 24" fill="${filled ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
};

// `style` is "overlay" or "inline"; `small` makes an inline button match 20px
// site icons (Facebook, Threads) instead of 24px ones (Instagram).
function scButton(style, icon, title, { small = false } = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = style === "overlay" ? "sc-ov" : small ? "sc-in sc-sm" : "sc-in";
  button.dataset.icon = icon;
  button.dataset.label = title;
  button.title = title;
  button.setAttribute("aria-label", title);
  button.innerHTML = scIcon(icon);
  return button;
}

// Changes the icon a button shows when idle (e.g. bookmark -> filled bookmark).
function scSetIcon(button, icon, title) {
  button.dataset.icon = icon;
  if (title) button.dataset.label = title;
  if (!button.dataset.state) scSetState(button, "idle");
}

const scResetTimers = new WeakMap();
function scSetState(button, state, message) {
  clearTimeout(scResetTimers.get(button));
  if (state === "idle") {
    delete button.dataset.state;
    button.innerHTML = scIcon(button.dataset.icon);
    button.title = button.dataset.label;
    return;
  }
  button.dataset.state = state;
  button.innerHTML = scIcon({ loading: "loader", done: "check", error: "x" }[state]);
  button.title = message || { loading: "Đang tải…", done: "Xong", error: "Có lỗi" }[state];
  if (state !== "loading")
    scResetTimers.set(button, setTimeout(() => scSetState(button, "idle"), state === "error" ? 6000 : 1800));
}

// Downloads run one job at a time in click order, so several carousels clicked
// in a row land as A1 A2 A3 B1 B2 instead of interleaving.
var scQueueTail = Promise.resolve();
function scQueue(job) {
  const run = scQueueTail.then(job);
  scQueueTail = run.catch(() => {});
  return run;
}

// Runs `job` with loading / done / error feedback; clicks while busy are
// ignored. Jobs wait in the download queue unless `queue` is false (quick
// save/unsave, which should not wait behind downloads).
async function scRun(button, job, { queue = true } = {}) {
  if (button.dataset.state === "loading") return;
  scSetState(button, "loading");
  const counted = async () => {
    scSkipped = 0;
    await job();
    return scSkipped;
  };
  try {
    // Unqueued jobs (quick save) save no files and must not reset the
    // counter of the download running in the queue.
    const skipped = queue ? await scQueue(counted) : (await job(), 0);
    scSetState(button, "done", skipped ? `Xong — bỏ qua ${skipped} file đã tải trước đó` : undefined);
  } catch (err) {
    scSetState(button, "error", `Lỗi: ${err instanceof Error ? err.message : String(err)}`);
    console.error(SC_TAG, err);
  }
}

GM_addStyle(`
.sc-ov,.sc-in{box-sizing:border-box!important;margin:0!important;padding:0!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;line-height:0!important;font:inherit!important;transition:background-color .15s ease,color .15s ease,transform .15s ease!important}
.sc-ov{position:absolute;z-index:2147483645;width:32px!important;height:32px!important;border:1px solid rgba(255,255,255,.25)!important;border-radius:50%!important;background:rgba(0,0,0,.55)!important;color:#fff!important;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.sc-ov:hover{background:rgba(0,0,0,.78)!important;transform:scale(1.06)}
.sc-ov .sc-icon{width:18px;height:18px}
.sc-ov[data-state=done]{background:#1d7a4f!important;border-color:#1d7a4f!important}
.sc-ov[data-state=error]{background:#b4232f!important;border-color:#b4232f!important}
.sc-in{width:40px!important;height:40px!important;border:0!important;border-radius:50%!important;background:transparent!important;color:inherit!important}
.sc-in.sc-sm{width:34px!important;height:34px!important}
.sc-in:hover{background:rgba(127,127,127,.16)!important}
.sc-in .sc-icon{width:24px;height:24px}
.sc-in.sc-sm .sc-icon{width:20px;height:20px}
.sc-in[data-target=true],.sc-in[data-icon=bookmark-filled]{color:${SC_ACCENT}!important}
.sc-in[data-state=done]{color:#1d9e5f!important}
.sc-in[data-state=error]{color:#e0393e!important}
.sc-ov[data-state=loading] .sc-icon,.sc-in[data-state=loading] .sc-icon{animation:sc-spin .8s linear infinite}
@keyframes sc-spin{to{transform:rotate(360deg)}}
`);

// The highest-bitrate picture stream of a DASH manifest (Facebook, Instagram
// and Threads all ship one). It has no sound, but it is the sharpest copy:
// the progressive files with sound stop at 720p. Null when there is none.
function scBestDashVideo(xml) {
  if (typeof xml !== "string" || !xml) return null;
  try {
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    const best = [...doc.querySelectorAll("Representation")]
      .filter((r) => /video/.test(r.getAttribute("mimeType") || r.parentElement.getAttribute("mimeType") || ""))
      .sort((a, b) => (+b.getAttribute("bandwidth") || 0) - (+a.getAttribute("bandwidth") || 0))[0];
    const url = best && best.querySelector("BaseURL")?.textContent.trim();
    return url && /^https?:/.test(url) ? url : null;
  } catch {
    return null;
  }
}
