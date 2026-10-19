// Helpers shared by every module: Tampermonkey runs the whole bundle as one
// script, so these top-level declarations are visible to the files after it.

const SC_TAG = "[Social All-in-One]";

// One MutationObserver for every module. It throttles instead of debouncing:
// pages with a playing video mutate continuously, and a debounce that restarts
// on every mutation would never fire there.
const scWatchDom = (() => {
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

const scSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

const scIsVisible = (el) => !!el && el.getClientRects().length > 0;
const scText = (el) => (el.textContent || "").trim().replace(/\s+/g, " ").toLowerCase();
const scIsTyping = (t) =>
  t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || !!(t && t.isContentEditable);

// Downloads `url` under `name`. The bytes are fetched first and saved through a
// Blob URL so `a.download` decides the file name (GM_download and the browser
// may ignore a name given for a cross-origin URL). GM_xmlhttpRequest covers
// CDNs that do not send CORS headers.
async function scFetchBlob(url) {
  try {
    const res = await fetch(url);
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
async function scSaveUrl(url, name) {
  const blobUrl = URL.createObjectURL(await scFetchBlob(url));
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = name;
  a.style.display = "none";
  document.body.append(a);
  a.click();
  a.remove();
  // Large videos need time before the Blob URL can be released.
  setTimeout(() => URL.revokeObjectURL(blobUrl), 6e4);
}
