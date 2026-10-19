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

!(function () {
  "use strict";
  const t = "sc:ig-results";
  let e = !1,
    n = {};
  const a = new Map(),
    i = new WeakMap(),
    s = new Map(),
    threadsRejected = new WeakMap();
  let l,
    c = !1,
    d = !1;
  const u = () => {
      const t = location.hostname;
      return t.includes("facebook.com")
        ? "facebook"
        : t.includes("instagram.com")
          ? "instagram"
          : t.includes("threads.net") || t.includes("threads.com")
            ? "threads"
            : "unknown";
    },
    p = (t) => new Promise((e) => setTimeout(e, t));
  function h(t) {
    let e = 0n;
    for (const n of t) {
      const t =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".indexOf(
          n,
        );
      t >= 0 && (e = 64n * e + BigInt(t));
    }
    return e.toString();
  }
  async function m(t) {
    var e, o;
    const r = /^\d+$/.test(t) ? t : h(t),
      a = (function () {
        var t, e, n;
        const o = Array.from(document.scripts)
            .map((t) => t.textContent || "")
            .join("\n"),
          r = (t) => {
            var e, n;
            return (
              (null == (e = document.querySelector(`input[name="${t}"]`))
                ? void 0
                : e.value) ||
              (null == (n = document.querySelector(`meta[name="${t}"]`))
                ? void 0
                : n.content)
            );
          },
          a = (t) => {
            var e, n;
            const r = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            return (
              (null ==
              (e = o.match(
                new RegExp(`["']${r}["']\\s*[:=]\\s*["']?([^"',}&\\s]+)`),
              ))
                ? void 0
                : e[1]) ||
              (null == (n = o.match(new RegExp(`(?:^|[?&])${r}=([^&"'\\s]+)`)))
                ? void 0
                : n[1])
            );
          },
          i = {
            docId:
              (null ==
              (t = o.match(
                /"BarcelonaLightboxDialogRootQuery".{0,200}?(?:"id"|"doc_id")\s*:\s*"([0-9]+)"/,
              ))
                ? void 0
                : t[1]) ||
              (null ==
              (e = o.match(
                /"BarcelonaPostPageDirectQuery".{0,200}?(?:"id"|"doc_id")\s*:\s*"([0-9]+)"/,
              ))
                ? void 0
                : e[1]) ||
              a("doc_id"),
            lsd:
              r("lsd") ||
              (null ==
              (n = o.match(/"token":"([A-Za-z0-9_-]+)","__typename":"LSD"/))
                ? void 0
                : n[1]) ||
              a("lsd"),
            jazoest: r("jazoest") || a("jazoest"),
            isLoggedIn:
              /"__relay_internal__pv__BarcelonaIsLoggedInrelayprovider"\s*:\s*true/.test(
                o,
              ),
          };
        for (const t of [
          "__hs",
          "__rev",
          "__s",
          "__hsi",
          "__dyn",
          "__csr",
          "__hsdp",
          "__hblp",
          "__sjsp",
          "__spin_r",
          "__spin_t",
        ])
          i[t] = r(t) || a(t);
        return i;
      })(),
      i =
        n["x-csrftoken"] ||
        (null == (e = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/))
          ? void 0
          : e[1]) ||
        "",
      s = {
        postID: r,
        __relay_internal__pv__BarcelonaOptionalCookiesEnabledrelayprovider: !0,
        __relay_internal__pv__BarcelonaIsLoggedInrelayprovider: a.isLoggedIn,
        __relay_internal__pv__BarcelonaHasGhostPostConsumptionrelayprovider: !0,
        __relay_internal__pv__IsTagIndicatorEnabledrelayprovider: !0,
        __relay_internal__pv__BarcelonaHasDeepDiverelayprovider: !1,
        __relay_internal__pv__BarcelonaHasSpoilerStylingInforelayprovider: !1,
        __relay_internal__pv__BarcelonaHasGhostPostEmojiActivationrelayprovider:
          !1,
        __relay_internal__pv__BarcelonaHasPodcastConsumptionrelayprovider: !0,
      },
      l = new URLSearchParams({
        fb_api_caller_class: "RelayModern",
        fb_api_req_friendly_name: "BarcelonaLightboxDialogRootQuery",
        variables: JSON.stringify(s),
        doc_id: a.docId || "25345179165155449",
      });
    a.jazoest && l.set("jazoest", a.jazoest);
    for (const t of [
      "__hs",
      "__rev",
      "__s",
      "__hsi",
      "__dyn",
      "__csr",
      "__hsdp",
      "__hblp",
      "__sjsp",
      "__spin_r",
      "__spin_t",
    ]) {
      const e = a[t];
      "string" == typeof e && e && l.set(t, e);
    }
    if (!(n["x-fb-lsd"] || a.lsd))
      throw new Error(
        "Chưa có token LSD của Threads. Cuộn trang một chút rồi bấm lại.",
      );
    const c = await unsafeWindow.fetch(
      "https://www.threads.com/graphql/query",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-CSRFToken": i,
          "X-IG-App-ID": n["x-ig-app-id"] || "238280553337426",
          "X-FB-LSD": n["x-fb-lsd"] || a.lsd,
          "X-ASBD-ID": n["x-asbd-id"] || "129477",
          "X-FB-Friendly-Name": "BarcelonaLightboxDialogRootQuery",
        },
        body: l,
      },
    );
    if (!c.ok)
      throw new Error(
        `Threads GraphQL trả ${c.status}. Có thể Threads vừa đổi token/API.`,
      );
    const d = await c.json(),
      u =
        (null == (o = null == d ? void 0 : d.data) ? void 0 : o.data) ||
        (null == d ? void 0 : d.data) ||
        d,
      p = (t, e = new WeakSet()) => {
        if (!t || "object" != typeof t || e.has(t)) return null;
        if (
          (e.add(t),
          String(t.pk || t.id || "").split("_")[0] === r &&
            (t.video_versions || t.image_versions2 || t.carousel_media))
        )
          return t;
        for (const n of Array.isArray(t) ? t : Object.values(t)) {
          const t = p(n, e);
          if (t) return t;
        }
        return null;
      },
      m = (null == u ? void 0 : u.pk) === r ? u : p(u);
    return m
      ? (m.carousel_media || [m]).flatMap((t) => {
          var e, n, o, r, a;
          return null != (n = null == (e = t.video_versions) ? void 0 : e[0]) &&
            n.url
            ? [
                {
                  url: t.video_versions[0].url,
                  kind: "video",
                  id: t.pk,
                  poster: t.image_versions2?.candidates?.[0]?.url,
                },
              ]
            : null !=
                  (a =
                    null ==
                    (r =
                      null == (o = t.image_versions2) ? void 0 : o.candidates)
                      ? void 0
                      : r[0]) && a.url
              ? [
                  {
                    url: t.image_versions2.candidates.sort(
                      (t, e) => e.width * e.height - t.width * t.height,
                    )[0].url,
                    kind: "image",
                    id: t.pk,
                  },
                ]
              : [];
        })
      : [];
  }
  const f = scSaveUrl;
  function g() {
    const t = window.innerWidth,
      e = window.innerHeight,
      n = new Set();
    for (const [o, r] of s) {
      if (!o.isConnected || !r.isConnected) {
        s.delete(o), o.remove();
        continue;
      }
      const a = r.getBoundingClientRect();
      let i = Math.max(0, a.left),
        l = Math.max(0, a.top),
        c = Math.min(t, a.right),
        d = Math.min(e, a.bottom);
      for (let t = r.parentElement; t && c > i && d > l; t = t.parentElement) {
        const e = getComputedStyle(t),
          n = /hidden|clip|scroll|auto/.test(e.overflowX),
          o = /hidden|clip|scroll|auto/.test(e.overflowY);
        if (!n && !o) continue;
        const r = t.getBoundingClientRect();
        n && ((i = Math.max(i, r.left)), (c = Math.min(c, r.right))),
          o && ((l = Math.max(l, r.top)), (d = Math.min(d, r.bottom)));
      }
      const u = Math.max(0, c - i),
        p = Math.max(0, d - l);
      let h =
        a.width >= 120 &&
        a.height >= 120 &&
        u / a.width > 0.9 &&
        p / a.height > 0.9;
      if (h) {
        const t = `${Math.round(i)}:${Math.round(l)}:${Math.round(u)}:${Math.round(p)}`;
        n.has(t) ? (h = !1) : n.add(t);
      }
      o.style.setProperty("display", h ? "flex" : "none", "important"),
        h &&
          (o.style.setProperty("left", `${Math.round(c - 42)}px`, "important"),
          o.style.setProperty("top", `${Math.round(l + 10)}px`, "important"));
    }
  }
  function v() {
    if (l) return;
    l = requestAnimationFrame(() => {
      (l = void 0), g();
    });
    for (const ms of [150, 400, 800]) setTimeout(g, ms);
  }
  // Instagram private API through the tab's session. Rate limits (429) are
  // retried with a growing pause instead of aborting a long scan.
  async function b(t, log) {
    for (let attempt = 1; ; attempt++) {
      const e = await unsafeWindow.fetch(`https://i.instagram.com${t}`, {
        credentials: "include",
        headers: {
          "X-IG-App-ID": "936619743392459",
          "X-Requested-With": "XMLHttpRequest",
          Accept: "application/json",
        },
      });
      if (e.status === 429 && attempt <= 3) {
        const wait = 30 * attempt;
        log && log(`Instagram giới hạn tốc độ (429), chờ ${wait}s rồi thử lại…`);
        await p(wait * 1e3);
        continue;
      }
      if (!e.ok)
        throw new Error(
          `Instagram trả ${e.status}. Hãy mở Instagram và đăng nhập trước.`,
        );
      return e.json();
    }
  }
  // CSV with a BOM (so Excel reads Vietnamese names) and with cells that start
  // like a formula prefixed by ' (names are written by other users).
  function y(t, e) {
    if (!t.length) throw new Error("Chưa có dữ liệu để export.");
    const cell = (v) => {
      let s = String(v ?? "");
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
      return `"${s.replaceAll('"', '""')}"`;
    };
    const n = Object.keys(t[0]),
      o = [n.join(","), ...t.map((row) => n.map((k) => cell(row[k])).join(","))].join("\n"),
      r = URL.createObjectURL(new Blob(["﻿", o], { type: "text/csv;charset=utf-8" }));
    GM_download({
      url: r,
      name: e,
      saveAs: !1,
      onerror: () => window.open(r, "_blank", "noopener"),
    });
    setTimeout(() => URL.revokeObjectURL(r), 3e4);
  }
  // "@name", "name" or a pasted profile URL -> "name".
  function igUsername(input) {
    const s = input.trim();
    try {
      if (/instagram\.com/i.test(s)) return new URL(/^https?:/i.test(s) ? s : `https://${s}`).pathname.split("/").filter(Boolean)[0] || "";
    } catch {}
    return s.replace(/^@/, "").replace(/\/.*$/, "");
  }
  async function scanList(input, type, log) {
    const name = igUsername(input);
    const info = await b(`/api/v1/users/web_profile_info/?username=${encodeURIComponent(name)}`, log);
    const user = (info.data && info.data.user) || info.user;
    if (!user || !(user.id || user.pk)) throw new Error(`Không tìm thấy @${name}.`);
    const id = user.id || user.pk;
    const total =
      type === "followers"
        ? ((user.edge_followed_by && user.edge_followed_by.count) ?? user.follower_count ?? 0)
        : ((user.edge_follow && user.edge_follow.count) ?? user.following_count ?? 0);
    const rows = [];
    let maxId = null;
    try {
      while (!e) {
        const q = new URLSearchParams({ count: "50", ...(maxId ? { max_id: maxId } : {}) });
        const page = await b(`/api/v1/friendships/${id}/${type}/?${q}`, log);
        rows.push(
          ...(page.users || []).map((u) => ({
            id: String(u.id || u.pk),
            username: u.username,
            full_name: u.full_name || "",
            profile_pic_url: u.profile_pic_url || "",
            is_verified: !!u.is_verified,
          })),
        );
        log(`${type}: ${rows.length}/${total || "?"} @${name}`);
        maxId = page.next_max_id || null;
        if (!maxId) break;
        await p(1100 + 900 * Math.random());
      }
    } finally {
      // Keep what was collected even when a request failed midway.
      if (rows.length) await GM_setValue(t, rows);
    }
    log(e ? `Đã dừng: lưu ${rows.length} tài khoản.` : `Hoàn tất: ${rows.length} tài khoản.`);
  }
  async function scanMetadata(log) {
    const list = await GM_getValue(t, []);
    if (!list.length) throw new Error("Chưa có kết quả followers/following để quét.");
    const rows = [];
    let failedInRow = 0;
    try {
      for (const [index, item] of list.entries()) {
        if (e) break;
        try {
          const info = await b(`/api/v1/users/web_profile_info/?username=${encodeURIComponent(item.username)}`, log);
          const u = (info.data && info.data.user) || info.user;
          rows.push({
            id: String(u.id || u.pk || ""),
            username: u.username,
            fullName: u.full_name || "",
            mediaCount: Number(u.media_count ?? (u.edge_owner_to_timeline_media && u.edge_owner_to_timeline_media.count) ?? 0),
            isPrivate: !!u.is_private,
            isVerified: !!u.is_verified,
            followedByViewer: !!u.followed_by_viewer,
            followsViewer: !!u.follows_viewer,
          });
          failedInRow = 0;
        } catch (err) {
          log(`@${item.username}: ${err.message || err}`);
          if (++failedInRow >= 5) throw new Error("5 lỗi liên tiếp, dừng quét metadata.");
        }
        log(`Metadata: ${index + 1}/${list.length}`);
        await p(2e3 + 3e3 * Math.random());
      }
    } finally {
      if (rows.length) await GM_setValue("sc:ig-metadata", rows);
    }
    log(`Metadata xong: ${rows.length} tài khoản.`);
  }
  function _() {
    const n = document.createElement("button");
    (n.id = "sc-launcher"), (n.textContent = "⚡"), (n.title = "Social All-in-One");
    const o = document.createElement("section");
    (o.id = "sc-panel"),
      (o.hidden = !0),
      (o.innerHTML = `<div class="sc-row"><strong>Social All-in-One</strong><span class="sc-muted" style="margin-left:auto">${u()}</span></div><div class="sc-muted">Instagram scanner chạy bằng phiên đăng nhập của tab này.</div><div class="sc-row"><input id="sc-user" class="sc-input" placeholder="Instagram username hoặc link profile"><select id="sc-type" class="sc-input"><option value="followers">Followers</option><option value="following">Following</option></select></div><div class="sc-row"><button id="sc-scan" class="sc-btn">Quét danh sách</button><button id="sc-meta" class="sc-btn alt">Quét metadata</button><button id="sc-stop" class="sc-btn danger">Dừng</button></div><div class="sc-row"><button id="sc-export-list" class="sc-btn alt">Export list CSV</button><button id="sc-export-meta" class="sc-btn alt">Export metadata CSV</button></div><pre id="sc-status" class="sc-status">Sẵn sàng.</pre>`);
    const status = o.querySelector("#sc-status"),
      log = (msg) => {
        status.textContent = `${new Date().toLocaleTimeString()}  ${msg}\n${status.textContent || ""}`;
      },
      scanButtons = [o.querySelector("#sc-scan"), o.querySelector("#sc-meta")];
    // One scan at a time: both share the stop flag.
    const run = async (job) => {
      if (scanButtons[0].disabled) return;
      scanButtons.forEach((btn) => (btn.disabled = !0));
      e = !1;
      try {
        await job();
      } catch (err) {
        log(`Lỗi: ${err.message || err}`);
      } finally {
        scanButtons.forEach((btn) => (btn.disabled = !1));
      }
    };
    o.querySelector("#sc-scan").onclick = () =>
      run(async () => {
        const name = o.querySelector("#sc-user").value;
        if (!name.trim()) throw new Error("Nhập username Instagram.");
        await scanList(name, o.querySelector("#sc-type").value, log);
      });
    o.querySelector("#sc-meta").onclick = () => run(() => scanMetadata(log));
    o.querySelector("#sc-stop").onclick = () => {
      (e = !0), log("Đang yêu cầu dừng…");
    };
    o.querySelector("#sc-export-list").onclick = async () => {
      try {
        y(await GM_getValue(t, []), "instagram-list.csv"), log("Đã export list.");
      } catch (err) {
        log(`Lỗi: ${err.message || err}`);
      }
    };
    o.querySelector("#sc-export-meta").onclick = async () => {
      try {
        y(await GM_getValue("sc:ig-metadata", []), "instagram-metadata.csv"), log("Đã export metadata.");
      } catch (err) {
        log(`Lỗi: ${err.message || err}`);
      }
    };
    n.onclick = () => {
      o.hidden = !o.hidden;
    };
    document.body.append(n, o);
  }
  // Instagram /saved/all-posts/: open the post, toggle its bookmark off inside
  // the dialog, confirm it flipped back to "Save", then close and hide the tile.
  const IG_REMOVE = 'svg[aria-label="Remove" i],svg[aria-label="Bỏ lưu" i],svg[aria-label="Gỡ" i]';
  const IG_SAVE = 'svg[aria-label="Save" i],svg[aria-label="Lưu" i]';
  const IG_CLOSE = 'svg[aria-label="Close" i],svg[aria-label="Đóng" i]';
  async function instagramUnsave(tile, button) {
    button.dataset.state = "busy";
    button.textContent = "…";
    try {
      tile.click();
      const dialog = await scWaitFor(() => [...document.querySelectorAll('[role="dialog"]')].find((d) => d.querySelector(IG_REMOVE)), {
        timeout: 5000,
      });
      if (!dialog) throw new Error("Không mở được bài viết");
      dialog.querySelector(IG_REMOVE).closest('button,[role="button"]').click();
      const flipped = await scWaitFor(() => dialog.querySelector(IG_SAVE));
      const close = document.querySelector(IG_CLOSE);
      if (close) close.closest('button,[role="button"]').click();
      else history.back();
      if (!flipped) throw new Error("Chưa xác nhận được bỏ lưu");
      tile.style.display = "none";
    } catch (err) {
      button.textContent = "× " + (err instanceof Error ? err.message : String(err));
      delete button.dataset.state;
    }
  }
  function decorateInstagramUnsave() {
    if (!location.pathname.includes("/saved/all-posts/")) return;
    document.querySelectorAll('main a[href*="/p/"],main a[href*="/reel/"]').forEach((tile) => {
      if (tile.querySelector(".sc-unsave-btn")) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sc-unsave-btn";
      button.title = "Bỏ lưu bài này";
      button.textContent = "✕ UNSAVE";
      button.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!button.dataset.state) instagramUnsave(tile, button);
      };
      if (getComputedStyle(tile).position === "static") tile.style.position = "relative";
      tile.append(button);
    });
  }
  function w() {
    const t = u();
      "instagram" === t && decorateInstagramUnsave(),
      "threads" === t &&
        ((function () {
          const t = location.pathname.includes("/saved");
          document
            .querySelectorAll(
              'svg[aria-label="More"],svg[title="More"],[aria-label*="Tùy chọn"],[aria-label*="Hành động"],[aria-label="More actions"],[aria-label="Actions"]',
            )
            .forEach((e) => {
              var n;
              if (e.closest('header,nav,[role="banner"],[role="navigation"]'))
                return;
              let o = null;
              for (
                let t = e, n = 0;
                t && n <= 5 && !o;
                t = t.parentElement, n += 1
              )
                t.querySelector('a[href*="/post/"],a[href*="/p/"]') && (o = t);
              if (!o || /\bviews?/i.test(o.textContent || "")) return;
              const r =
                null == (n = e.closest('[role="button"]') || e.parentElement)
                  ? void 0
                  : n.parentElement;
              if (!r || r.querySelector(".sc-threads-save-container")) return;
              const a = r.querySelectorAll("svg").length,
                i = document.createElement("div");
              (i.className = "sc-threads-save-container"),
                (i.style.cssText = `position:absolute!important;right:${a > 1 ? "72px" : "40px"};top:-10px;z-index:100;display:flex;align-items:center;justify-content:center;width:32px;height:32px;`);
              const s = document.createElement("button");
              (s.className = "sc-threads-save-btn"),
                (s.title = t ? "Bỏ lưu nhanh" : "Lưu nhanh"),
                (s.innerHTML = t
                  ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
                  : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>'),
                (s.onclick = (n) => {
                  n.preventDefault(),
                    n.stopPropagation(),
                    s.classList.add("sc-loading"),
                    (
                      e.closest('[role="button"]') ||
                      e.closest("button") ||
                      e
                    ).click();
                  // Menu items are matched on their whole label, so "Save"
                  // never hits "Unsave" (which would toggle a saved post off).
                  const findItem = (menu, labels) =>
                    Array.from(menu.querySelectorAll("div,span,button,a")).find(
                      (o) =>
                        o.offsetParent &&
                        labels.includes(scText(o)) &&
                        !Array.from(o.children).some((c) =>
                          labels.includes(scText(c)),
                        ),
                    );
                  const want = t ? ["unsave", "bỏ lưu"] : ["save", "lưu"],
                    already = t ? ["save", "lưu"] : ["unsave", "bỏ lưu"];
                  let o = 0;
                  const r = () => {
                    const e =
                      Array.from(
                        document.querySelectorAll('[role="menu"]'),
                      ).find((t) => !!t.offsetParent) || null;
                    const item = e && findItem(e, want);
                    if (item) {
                      (
                        item.closest('[role="menuitem"],button,[role="button"]') ||
                        item
                      ).click();
                      s.classList.remove("sc-loading");
                      s.classList.add("sc-success");
                    } else if (e && findItem(e, already)) {
                      // Already in the wanted state: close the menu, report done.
                      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: !0 }));
                      s.classList.remove("sc-loading");
                      s.classList.add("sc-success");
                      s.title = t ? "Bài đã bỏ lưu sẵn" : "Bài đã được lưu sẵn";
                    } else if (++o < 15) setTimeout(r, 300);
                    else {
                      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: !0 }));
                      s.classList.remove("sc-loading");
                      s.classList.add("sc-error");
                      s.title = "Không tìm thấy mục Lưu";
                    }
                  };
                  setTimeout(r, 600);
                }),
                "static" === getComputedStyle(r).position &&
                  (r.style.position = "relative"),
                i.append(s),
                r.append(i);
            });
        })(),
        document
          .querySelectorAll('img, div[aria-label="Video player"]')
          .forEach((t) => {
            if (t.hasAttribute("data-sc-dl")) return;
            const e = t instanceof HTMLImageElement ? t : null;
            // Loaded images rejected before are skipped until their src changes.
            if (e && threadsRejected.get(e) === e.currentSrc) return;
            const reject = () => {
              e && e.complete && threadsRejected.set(e, e.currentSrc);
            };
            if (e) {
              if (
                (function (t) {
                  if (t.closest('div[aria-label="Video player"]')) return !0;
                  const e = t.getBoundingClientRect();
                  if (e.width < 1 || e.height < 1) return !1;
                  for (
                    let n = t.parentElement, o = 0;
                    n && o < 15;
                    n = n.parentElement, o += 1
                  )
                    if (
                      Array.from(
                        n.querySelectorAll('div[aria-label="Video player"]'),
                      ).some((t) => {
                        const n = t.getBoundingClientRect();
                        return (
                          !(n.width < 120 || n.height < 120) &&
                          (Math.max(
                            0,
                            Math.min(e.right, n.right) -
                              Math.max(e.left, n.left),
                          ) *
                            Math.max(
                              0,
                              Math.min(e.bottom, n.bottom) -
                                Math.max(e.top, n.top),
                            )) /
                            Math.min(e.width * e.height, n.width * n.height) >
                            0.7
                        );
                      })
                    )
                      return !0;
                  return !1;
                })(e)
              )
                return void reject();
              let t = e.parentElement;
              for (let e = 0; t && e < 4; t = t.parentElement, e += 1)
                if (t.querySelector('div[aria-label="Video player"],video'))
                  return void reject();
              const n = e.getBoundingClientRect(),
                o = e.alt.toLowerCase();
              if (
                n.width < 120 ||
                n.height < 120 ||
                /profile picture|avatar/.test(o)
              )
                return void reject();
            } else {
              const e = t.getBoundingClientRect();
              if (e.width < 120 || e.height < 120) return;
            }
            t.setAttribute("data-sc-dl", "1");
            const n = t.closest('button,a,[role="button"]'),
              o =
                (null == n ? void 0 : n.parentElement) ||
                (null == e ? void 0 : e.parentElement) ||
                t;
            if (!o) return;
            o.classList.add("sc-dl-container"),
              "static" === getComputedStyle(o).position &&
                (o.style.position = "relative");
            const r = document.createElement("button");
            (r.type = "button"),
              (r.className = e
                ? "sc-thread-btn"
                : "sc-thread-btn sc-thread-video-btn"),
              (r.innerHTML = e
                ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 3h2v10.17l3.59-3.58L18 11l-6 6-6-6 1.41-1.41L11 13.17V3zm-6 16h14v2H5v-2z"/></svg>'
                : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7L8 5zm9 14h2v2h-2v-2z"/></svg>'),
              (r.title = e ? "Tải ảnh" : "Tải video");
            const l = (function (t) {
                var e;
                let n = t;
                for (let t = 0; t < 30 && n; t += 1, n = n.parentElement) {
                  const t = Array.from(
                      n.querySelectorAll('a[href*="/@"]'),
                    ).find((t) => {
                      var e;
                      const n =
                        (null == (e = t.textContent) ? void 0 : e.trim()) || "";
                      return 0 === n.length || !n.startsWith("@");
                    }),
                    o =
                      null ==
                      (e = null == t ? void 0 : t.href.match(/@([^/?#]+)/))
                        ? void 0
                        : e[1];
                  if (o) return o;
                }
                return "threads";
              })(t),
              u = (t) => {
                t.stopPropagation();
              };
            r.addEventListener("pointerdown", u, !0),
              r.addEventListener("mousedown", u, !0),
              r.addEventListener("mouseup", u, !0);
            let p = !1;
            const g = async () => {
                if (!p) {
                  (p = !0), (r.textContent = "…");
                  try {
                    if (e) {
                      // Largest srcset candidate: src is often a small one.
                      const src =
                          (e.srcset || "")
                            .split(",")
                            .map((c) => c.trim().split(/\s+/))
                            .map(([url, w]) => ({ url, w: parseInt(w) || 0 }))
                            .filter((c) => c.url)
                            .sort((a, b) => b.w - a.w)[0]?.url ||
                          e.currentSrc ||
                          e.src,
                        t =
                          new URL(src, location.href).pathname.split("/").pop() ||
                          "image.jpg";
                      await f(src, `threads_${l}_${t}`);
                    } else {
                      const e =
                          t.closest("article,[data-pressable-container]") ||
                          document.body,
                        n = (function (t) {
                          var e, n, o;
                          let r = t;
                          for (
                            let t = 0;
                            t < 15 && r;
                            t += 1, r = r.parentElement
                          ) {
                            const t =
                                null ==
                                (e = r.querySelector(
                                  'a[href*="/post/"],a[href*="/p/"]',
                                ))
                                  ? void 0
                                  : e.href,
                              o =
                                null ==
                                (n =
                                  null == t
                                    ? void 0
                                    : t.match(/\/(?:post|p)\/([^/?#]+)/))
                                  ? void 0
                                  : n[1];
                            if (o) return h(o);
                          }
                          const a =
                            null ==
                            (o = location.pathname.match(
                              /\/(?:post|p)\/([^/?#]+)/,
                            ))
                              ? void 0
                              : o[1];
                          return a ? h(a) : null;
                        })(t);
                      if (!n) throw new Error("Không tìm được mã bài Threads.");
                      const o = await m(n),
                        videos = o.filter((t) => "video" === t.kind),
                        fileOf = (u) => {
                          try {
                            return new URL(u, location.href).pathname.split("/").pop();
                          } catch {
                            return "";
                          }
                        },
                        // Match the player's poster against each video's cover
                        // image; the DOM only keeps nearby carousel slides, so
                        // counting players gives a wrong index.
                        poster = fileOf(
                          t.querySelector("video")?.poster ||
                            t.querySelector("img")?.currentSrc ||
                            "",
                        ),
                        r = Array.from(
                          e.querySelectorAll('div[aria-label="Video player"]'),
                        ).indexOf(t),
                        a =
                          (poster && videos.find((v) => v.poster && fileOf(v.poster) === poster)) ||
                          videos[Math.max(0, r)],
                        i =
                          (null == a ? void 0 : a.url) ||
                          (function (t) {
                            const e = [
                              ...Array.from(
                                t.querySelectorAll("video"),
                              ).flatMap((t) => [t.currentSrc, t.src]),
                              ...Array.from(
                                t.querySelectorAll("source[src]"),
                              ).map((t) => t.src),
                            ].find((t) => /^https?:\/\//.test(t));
                            if (e) return e;
                            // A page-wide guess is only safe with a single player.
                            if (document.querySelectorAll('div[aria-label="Video player"]').length !== 1)
                              return null;
                            try {
                              return (
                                performance
                                  .getEntriesByType("resource")
                                  .map((t) => t.name)
                                  .reverse()
                                  .find(
                                    (t) =>
                                      /^https:\/\/.+\.mp4(?:[?#].*)?$/i.test(t) &&
                                      !/bytestart/i.test(t),
                                  ) || null
                              );
                            } catch {
                              return null;
                            }
                          })(t);
                      if (!i)
                        throw new Error(
                          "Không thấy stream video. Hãy phát video khoảng một giây rồi bấm lại.",
                        );
                      await f(
                        i,
                        `threads_${l}_${(null == a ? void 0 : a.id) || n}.mp4`,
                      );
                    }
                    r.textContent = "✓";
                  } catch (t) {
                    console.warn("[Social All-in-One]", t),
                      (r.textContent = "×"),
                      (r.title = `Lỗi tải: ${t instanceof Error ? t.message : String(t)}`);
                  } finally {
                    p = !1;
                  }
                }
              },
              b = { button: r, download: g };
            i.set(o, b),
              n && i.set(n, b),
              r.addEventListener(
                "click",
                (t) => {
                  t.preventDefault(),
                    t.stopPropagation(),
                    t.stopImmediatePropagation(),
                    g();
                },
                !0,
              ),
              e
                ? (r.style.setProperty("position", "fixed", "important"),
                  r.style.setProperty("right", "auto", "important"),
                  r.style.setProperty("z-index", "2147483647", "important"),
                  document.body.append(r),
                  s.set(r, e),
                  d ||
                    ((d = !0),
                    document.addEventListener("pointerdown", () => v(), !0),
                    document.addEventListener("scroll", () => v(), !0),
                    window.addEventListener("resize", () => v())),
                  v())
                : o.append(r),
              a.set(r, g),
              (function () {
                if (c) return;
                c = !0;
                const t = (t, e) => {
                  if (
                    0 !== t.button ||
                    (t.target instanceof Element &&
                      t.target.closest(".sc-thread-btn"))
                  )
                    return;
                  const n = t
                      .composedPath()
                      .find((t) => t instanceof HTMLElement && i.has(t)),
                    o = n && i.get(n),
                    r = null == o ? void 0 : o.button.getBoundingClientRect(),
                    s =
                      !!r &&
                      t.clientX >= r.left &&
                      t.clientX <= r.right &&
                      t.clientY >= r.top &&
                      t.clientY <= r.bottom;
                  if (o && s)
                    return (
                      t.preventDefault(),
                      t.stopImmediatePropagation(),
                      t.stopPropagation(),
                      void (e && o.download())
                    );
                  const l = document
                      .elementsFromPoint(t.clientX, t.clientY)
                      .map((t) => t.closest(".sc-thread-btn"))
                      .find((t) => !!t && a.has(t)),
                    c = [];
                  for (const e of a.keys()) {
                    if (!e.isConnected) {
                      a.delete(e);
                      continue;
                    }
                    const n = e.getBoundingClientRect();
                    t.clientX >= n.left &&
                      t.clientX <= n.right &&
                      t.clientY >= n.top &&
                      t.clientY <= n.bottom &&
                      c.push(e);
                  }
                  const d = 1 === c.length ? c[0] : void 0,
                    u = (l || d) && a.get(l || d);
                  u &&
                    (t.preventDefault(),
                    t.stopImmediatePropagation(),
                    t.stopPropagation(),
                    e && u());
                };
                document.addEventListener("pointerdown", (e) => t(e, !0), !0),
                  document.addEventListener("click", (e) => t(e, !1), !0);
              })();
          }));
  }
  !(function t() {
    if (
      ((function () {
        if ("threads" !== u()) return;
        const t = unsafeWindow;
        if (t.__scThreadsHeaderHook) return;
        t.__scThreadsHeaderHook = !0;
        const e = t.fetch.bind(t);
        t.fetch = async (t, o) => {
          const r =
            "string" == typeof t ? t : t instanceof URL ? t.href : t.url;
          if (/threads\.(?:com|net)\/graphql\//.test(r)) {
            const e = new Headers(
              (null == o ? void 0 : o.headers) ||
                (t instanceof Request ? t.headers : void 0),
            );
            for (const t of [
              "x-fb-lsd",
              "x-asbd-id",
              "x-ig-app-id",
              "x-csrftoken",
            ]) {
              const o = e.get(t);
              o && (n[t] = o);
            }
          }
          return e(t, o);
        };
        const o = t.XMLHttpRequest,
          r = o.prototype.open,
          a = o.prototype.setRequestHeader;
        (o.prototype.open = function (t, e, ...n) {
          return (
            (this.__scThreadsGraphql = /threads\.(?:com|net)\/graphql\//.test(
              String(e),
            )),
            r.call(this, t, e, ...n)
          );
        }),
          (o.prototype.setRequestHeader = function (t, e) {
            if (this.__scThreadsGraphql) {
              const o = t.toLowerCase();
              ["x-fb-lsd", "x-asbd-id", "x-ig-app-id", "x-csrftoken"].includes(
                o,
              ) &&
                e &&
                (n[o] = e);
            }
            return a.call(this, t, e);
          });
      })(),
      !document.body)
    )
      return void document.addEventListener("DOMContentLoaded", t, {
        once: !0,
      });
    GM_addStyle(
      "\n    #sc-launcher{position:fixed;right:18px;bottom:18px;z-index:2147483646;border:0;border-radius:50%;width:46px;height:46px;background:#635bff;color:#fff;font-size:22px;cursor:pointer;box-shadow:0 6px 24px #0006}\n    #sc-panel{position:fixed;right:18px;bottom:74px;z-index:2147483646;width:350px;max-height:75vh;overflow:auto;background:#111827;color:#e5e7eb;border:1px solid #374151;border-radius:12px;padding:14px;font:13px system-ui,sans-serif;box-shadow:0 16px 40px #0009}\n    #sc-panel[hidden]{display:none}.sc-row{display:flex;gap:8px;margin:8px 0}.sc-row>*{min-width:0}.sc-input{flex:1;padding:8px;border:1px solid #4b5563;border-radius:7px;background:#1f2937;color:#fff}.sc-btn{padding:8px 10px;border:0;border-radius:7px;background:#635bff;color:#fff;cursor:pointer}.sc-btn:disabled{opacity:.5;cursor:wait}.sc-btn.alt{background:#374151}.sc-btn.danger{background:#be123c}.sc-muted{color:#9ca3af;margin:6px 0}.sc-status{white-space:pre-wrap;max-height:160px;overflow:auto;padding:8px;background:#0b1220;border-radius:7px}.sc-unsave-btn{z-index:2147483645!important;cursor:pointer!important;border:0!important;color:#fff!important;background:#be123c!important;border-radius:999px!important;line-height:1!important}.sc-unsave-btn{position:absolute!important;right:6px!important;top:6px!important;padding:6px!important;font-size:10px!important}.sc-save-btn-small{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;background:rgba(99,102,241,.1);color:#6366f1;border:1px solid rgba(99,102,241,.2);border-radius:50%;cursor:pointer;transition:all .2s ease}.sc-save-btn-small:hover{background:rgba(99,102,241,.2);transform:scale(1.1)}.sc-threads-save-btn{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;background:rgba(0,0,0,.5);color:rgba(255,255,255,.9);border:1px solid rgba(255,255,255,.4);border-radius:50%;cursor:pointer;backdrop-filter:blur(4px);transition:all .2s cubic-bezier(.175,.885,.32,1.275)}.sc-threads-save-btn:hover{background:rgba(0,0,0,.8);transform:scale(1.1);border-color:#fff;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.5)}.sc-loading{animation:sc-pulse 1s infinite ease-in-out}.sc-success{animation:sc-pop .4s forwards}.sc-threads-save-btn.sc-success svg,.sc-save-btn-small.sc-success svg{fill:currentColor!important;stroke:none!important}@keyframes sc-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.1);opacity:.7}}@keyframes sc-pop{0%{transform:scale(1)}50%{transform:scale(1.4)}100%{transform:scale(1.1)}}.sc-dl-container:hover .sc-thread-btn{opacity:1!important}.sc-thread-btn{position:absolute!important;right:10px!important;top:10px!important;z-index:2147483645!important;display:flex!important;align-items:center!important;justify-content:center!important;width:32px!important;height:32px!important;padding:0!important;border:1.5px solid rgba(255,255,255,.52)!important;border-radius:50%!important;background:rgba(0,0,0,.62)!important;color:rgba(255,255,255,.94)!important;backdrop-filter:blur(8px)!important;box-shadow:0 3px 12px rgba(0,0,0,.35)!important;opacity:.88!important;pointer-events:auto!important;cursor:pointer!important;transition:opacity .2s ease,transform .22s cubic-bezier(.175,.885,.32,1.275),background .2s ease!important}.sc-thread-btn:hover{background:rgba(0,0,0,.86)!important;transform:scale(1.12)!important;border-color:#fff!important}.sc-thread-btn svg{width:18px!important;height:18px!important;fill:currentColor!important}.sc-thread-video-btn{left:10px!important;right:auto!important;top:10px!important;bottom:auto!important;background:rgba(124,58,237,.82)!important;border-color:rgba(221,214,254,.9)!important}.sc-thread-video-btn:hover{background:rgba(109,40,217,.98)!important}\n  ",
    ),
      // The ⚡ scanner only works on instagram.com (it calls Instagram APIs).
      "instagram" === u() && _(),
      scWatchDom(w),
      console.info("[Social All-in-One] active:", u());
  })();
})();

// Facebook: quick save on posts, quick unsave on /saved, Story download.
location.hostname.includes("facebook.com") &&
  (() => {
    "use strict";

    const SAVE_ICON =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
    const UNSAVE_ICON =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/><line x1="4" y1="4" x2="20" y2="20"/></svg>';
    const DOWNLOAD_ICON =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11.17l3.59-3.58L17 12l-5 5-5-5 1.41-1.41L11 14.17V3h1ZM5 19h14v2H5v-2Z"/></svg>';

    // ---- Network hook: remember playable video URLs from GraphQL responses ----
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
    function scanPayload(text) {
      if (typeof text !== "string" || !/playable|video/i.test(text)) return;
      for (const line of text.replace(/^for \(;;\);/, "").split("\n")) {
        let stack;
        try {
          stack = [JSON.parse(line)];
        } catch {
          continue;
        }
        for (let n = 0; stack.length && n++ < 2e4; ) {
          const value = stack.pop();
          if (Array.isArray(value)) stack.push(...value);
          else if (value && typeof value === "object")
            for (const [key, v] of Object.entries(value))
              if (typeof v === "string" && /(?:playable|video|dash|manifest).*url/i.test(key)) rememberPlayable(v);
              else if (v && typeof v === "object") stack.push(v);
        }
      }
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

    async function quickSave(trigger, button) {
      button.dataset.state = "saving";
      trigger.click();
      const item = await scWaitFor(() => findMenuItem(SAVE_LABELS), { timeout: 3000 });
      if (!item) {
        const alreadySaved = !!findMenuItem(UNSAVE_LABELS);
        closeMenu(trigger);
        button.dataset.state = alreadySaved ? "saved" : "error";
        button.title = alreadySaved ? "Bài viết đã được lưu sẵn" : "Không tìm thấy mục Lưu";
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
      button.dataset.state = "saved";
      button.title = "Đã lưu bài viết";
    }

    function decorateQuickSave() {
      document.querySelectorAll(POST_MENU_SELECTOR).forEach((trigger) => {
        if (!scIsVisible(trigger)) return;
        const host = trigger.parentElement && trigger.parentElement.parentElement;
        if (!host || host.querySelector(".sc-facebook-quick-save")) return;
        if (getComputedStyle(host).position === "static") host.style.position = "relative";
        const wrap = document.createElement("span");
        wrap.className = "sc-facebook-quick-save";
        const button = document.createElement("button");
        button.type = "button";
        button.title = "Lưu nhanh bài viết";
        button.setAttribute("aria-label", button.title);
        button.innerHTML = SAVE_ICON;
        wrap.append(button);
        host.append(wrap);
        button.addEventListener(
          "click",
          (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (button.dataset.state === "saving" || button.dataset.state === "saved") return;
            quickSave(trigger, button).catch((err) => {
              button.dataset.state = "error";
              button.title = `Lỗi: ${err.message}`;
            });
          },
          true,
        );
      });
    }

    // ---- Quick unsave on /saved ----
    const SAVED_ITEM_MENU_SELECTOR = '[aria-label="More options for saved item" i],[aria-label*="mục đã lưu" i]';

    async function quickUnsave(trigger, button) {
      button.dataset.state = "unsaving";
      button.title = "Đang bỏ lưu…";
      trigger.click();
      const item = await scWaitFor(() => {
        if (trigger.getAttribute("aria-expanded") !== "true") return null;
        const menu = [...document.querySelectorAll('[role="menu"]')].find(scIsVisible);
        return menu && [...menu.querySelectorAll('[role="menuitem"]')].find((i) => /^(unsave|bỏ lưu)$/i.test((i.textContent || "").trim()));
      });
      if (!item) {
        closeMenu(trigger);
        button.dataset.state = "error";
        button.title = "Không tìm thấy mục Bỏ lưu — thử lại";
        return;
      }
      item.click();
      // Facebook removes the saved item once the unsave went through.
      const gone = await scWaitFor(() => !button.isConnected, { timeout: 4500 });
      if (!gone) {
        button.dataset.state = "error";
        button.title = "Chưa xác nhận được bỏ lưu — thử lại";
      }
    }

    function decorateQuickUnsave() {
      if (!/^\/saved(?:\/|$)/.test(location.pathname)) return;
      document.querySelectorAll(SAVED_ITEM_MENU_SELECTOR).forEach((trigger) => {
        const anchor = trigger.parentElement && trigger.parentElement.parentElement;
        const host = anchor && anchor.parentElement;
        if (!host || host.querySelector(".sc-facebook-quick-unsave")) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "sc-facebook-quick-unsave";
        button.title = "Bỏ lưu nhanh";
        button.setAttribute("aria-label", button.title);
        button.innerHTML = UNSAVE_ICON;
        host.insertBefore(button, anchor);
        button.addEventListener(
          "click",
          (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (button.dataset.state === "unsaving") return;
            quickUnsave(trigger, button).catch((err) => {
              button.dataset.state = "error";
              button.title = `Lỗi: ${err.message}`;
            });
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

    // <username>_<story id>.<ext>
    function storyFilename(ext, box) {
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
      return `${username || bucket || "unknown"}_${cardId || "media"}.${ext}`;
    }

    async function downloadStory() {
      const media = storyMedia();
      if (!media) throw new Error("Chưa lấy được link Story");
      await scSaveUrl(media.url, storyFilename(media.ext, media.box));
    }

    function syncStoryButton() {
      let button = document.getElementById("sc-facebook-story-dl");
      if (!isStoryPage()) return void (button && button.remove());
      const { video, box } = currentStory();
      if (!box) return void (button && button.remove());
      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.id = "sc-facebook-story-dl";
        button.innerHTML = DOWNLOAD_ICON;
        button.addEventListener("click", async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (button.dataset.state) return;
          button.dataset.state = "busy";
          button.textContent = "…";
          try {
            await downloadStory();
            button.textContent = "✓";
          } catch (err) {
            button.textContent = "×";
            button.title = `Không tải được Story: ${err instanceof Error ? err.message : String(err)}`;
          }
          setTimeout(() => {
            button.innerHTML = DOWNLOAD_ICON;
            delete button.dataset.state;
          }, 1500);
        });
        document.body.append(button);
      }
      // Only position and label are refreshed here; rewriting the content would
      // re-trigger the DOM observer and wipe the ✓/× feedback.
      const r = box.getBoundingClientRect();
      button.style.left = `${Math.round(Math.max(8, r.right - 48))}px`;
      button.style.top = `${Math.round(Math.max(8, r.top + 10))}px`;
      if (!button.dataset.state) {
        button.title = video ? "Tải Facebook Story video" : "Tải Facebook Story ảnh";
        button.setAttribute("aria-label", button.title);
      }
    }

    GM_addStyle(
      ".sc-facebook-quick-save{position:absolute!important;right:52px!important;top:2px!important;z-index:100!important}.sc-facebook-quick-save button,.sc-facebook-quick-unsave{width:30px!important;height:30px!important;border:0!important;border-radius:999px!important;display:grid!important;place-items:center!important;color:#fff!important;background:rgba(0,0,0,.56)!important;cursor:pointer!important}.sc-facebook-quick-save button:hover,.sc-facebook-quick-unsave:hover{background:rgba(0,0,0,.76)!important}.sc-facebook-quick-save button[data-state=saving],.sc-facebook-quick-unsave[data-state=unsaving]{opacity:.55!important;cursor:wait!important}.sc-facebook-quick-save button[data-state=saved] svg{fill:currentColor!important}.sc-facebook-quick-save button[data-state=error],.sc-facebook-quick-unsave[data-state=error]{background:rgba(190,18,60,.85)!important}.sc-facebook-quick-save svg,.sc-facebook-quick-unsave svg{width:17px!important;height:17px!important;fill:none!important;stroke:currentColor!important;stroke-width:2.2!important;stroke-linecap:round!important;stroke-linejoin:round!important}.sc-facebook-quick-unsave svg path{fill:currentColor!important}.sc-facebook-quick-unsave svg line{stroke:#fff!important;stroke-width:2.8!important}" +
        "#sc-facebook-story-dl{position:fixed;z-index:2147483647;display:flex;align-items:center;justify-content:center;width:38px;height:38px;padding:0;border:1.5px solid rgba(255,255,255,.8);border-radius:50%;background:rgba(37,99,235,.9);color:#fff;box-shadow:0 3px 12px rgba(0,0,0,.45);cursor:pointer;backdrop-filter:blur(8px)}#sc-facebook-story-dl:hover{background:rgba(29,78,216,1);transform:scale(1.1)}#sc-facebook-story-dl svg{width:19px;height:19px;fill:currentColor}",
    );

    scWatchDom(() => {
      decorateQuickSave();
      decorateQuickUnsave();
      syncStoryButton();
    });
  })();

// Instagram downloads: feed/post/reel buttons next to the bookmark, story
// button, grid tile buttons, A/D carousel and S download hotkeys.
// Feed/post/reel logic is ported from D:/AgentWorks/ig-download; read its
// ARCHITECTURE.md before changing carousel resolution or file naming.
location.hostname.includes('instagram.com') && (() => {
  const CLASS = 'ig-minimal-download';
  const ICON = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M19 9h-4V3H9v6H5l7 7 7-7Zm-14 9v2h14v-2H5Z"/></svg>';
  const ALL_ICON = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M4 6H2v14a2 2 0 0 0 2 2h14v-2H4V6Zm16-4H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Zm-6 13-4-4h3V5h2v6h3l-4 4Z"/></svg>';
  // The S hotkey targets single-item buttons; "all" buttons are reached with Shift+S.
  const SINGLE = `.${CLASS}:not([data-kind="all"])`;
  const isCarousel = (scope) =>
    !!scope.querySelector('button[aria-label^="Go to slide"], button[aria-label="Next"], button[aria-label="Tiếp"]');
  const ROUND_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a1 1 0 0 1 1 1v9.59l3.3-3.3a1 1 0 1 1 1.4 1.42l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 1 1 1.4-1.42l3.3 3.3V4a1 1 0 0 1 1-1zM5 19h14a1 1 0 1 1 0 2H5a1 1 0 1 1 0-2z"/></svg>';
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

  function toDownload(item, parent, renderedUrl = '') {
    const video = largestCandidate(item.video_versions);
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

  function setButtonState(button, state) {
    const colors = { idle: !isFeedPage() || button.dataset.hotkeyTarget === 'true' ? '#0095f6' : '#fff', loading: '#f59e0b', done: '#22a06b', failed: '#ed4956' };
    if (state === 'idle') delete button.dataset.state;
    else button.dataset.state = state;
    button.style.backgroundColor = 'transparent';
    button.style.color = colors[state];
    button.style.transform = state === 'loading' ? 'scale(.92)' : 'scale(1)';
    button.title = state === 'loading' ? 'Downloading…' : state === 'done' ? 'Downloaded' : state === 'failed' ? 'Download failed' : button.dataset.kind === 'all' ? 'Download all media of this post (Shift+S)' : `Download ${button.dataset.kind}`;
  }

  async function startDownload(button) {
    if (!button || button.dataset.state === 'loading') return;
    setButtonState(button, 'loading');
    try {
      // Do not retain a custom DOM object on the button: Tampermonkey crosses
      // an isolated-world boundary for such properties. Resolve it at click time.
      const scope = postScopeOf(button);
      if (button.dataset.kind === 'all') {
        const short = shortcodeFrom(scope);
        if (!short) throw new Error('Could not resolve post or reel code');
        await downloadWholePost(short.code, short.route);
      } else {
        await save(await resolvePostOrReel(scope));
      }
      setButtonState(button, 'done');
    } catch (error) {
      setButtonState(button, 'failed');
      button.title = `Download failed: ${error.message}`;
      console.error(SC_TAG, error);
    } finally {
      setTimeout(() => setButtonState(button, 'idle'), 1800);
    }
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
  function refreshHotkeyIndicator() {
    if (!isFeedPage() || indicatorFrame) return;
    indicatorFrame = requestAnimationFrame(() => {
      indicatorFrame = 0;
      const target = nearestVisibleButton();
      document.querySelectorAll(SINGLE).forEach((button) => {
        const isTarget = button === target;
        button.dataset.hotkeyTarget = String(isTarget);
        // Keep the loading / done / failed colours until the button resets.
        if (!button.dataset.state) button.style.color = isTarget ? '#0095f6' : '#fff';
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
      const label = isNext ? 'next' : 'previous';
      const candidates = [...scope.querySelectorAll('button')].filter((element) => {
        const aria = (element.getAttribute('aria-label') || '').toLowerCase();
        const title = (element.getAttribute('title') || '').toLowerCase();
        if (isNext) return aria.includes(label) || title.includes(label);
        return !(aria.includes('next') || title.includes('next'));
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
    const button = document.createElement('a');
    button.className = CLASS;
    button.dataset.kind = kind;
    button.innerHTML = kind === 'all' ? ALL_ICON : ICON;
    button.title = kind === 'all' ? 'Download all media of this post (Shift+S)' : `Download ${kind}`;
    button.setAttribute('style', 'cursor:pointer;padding:7px;color:#0095f6;background:transparent;border-radius:8px;position:relative;display:inline-flex;z-index:999;line-height:0;transition:color .18s ease,transform .18s ease');
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

  // Round buttons for the story viewer and grid tiles.
  function makeRoundButton(className, title, run) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.title = title;
    button.innerHTML = ROUND_ICON;
    const stop = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    ['pointerdown', 'mousedown', 'dblclick'].forEach((type) => button.addEventListener(type, stop, true));
    button.addEventListener('click', async (e) => {
      stop(e);
      if (button.dataset.state) return;
      button.dataset.state = 'busy';
      try {
        await run();
        button.textContent = '✓';
      } catch (err) {
        button.textContent = '×';
        button.title = `Lỗi: ${err instanceof Error ? err.message : String(err)}`;
        console.error(SC_TAG, 'Instagram download:', err);
      }
      setTimeout(() => {
        button.innerHTML = ROUND_ICON;
        delete button.dataset.state;
      }, 2500);
    }, true);
    return button;
  }

  // Story button, pinned inside the top-right corner of the story just below
  // its header; falls back to the CSS corner position when no media is shown.
  function placeStoryButton(button) {
    const r = storyMediaEl()?.getBoundingClientRect();
    button.style.left = r ? `${Math.round(r.right - 50)}px` : '';
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
      button = makeRoundButton('', 'Tải story này (phím S)', async () => save(await resolveStory()));
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
      a.append(makeRoundButton('sc-ig-dl', 'Tải toàn bộ media của bài này', () => downloadWholePost(match[2], route)));
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

  GM_addStyle(
    '.sc-ig-dl{position:absolute!important;left:8px!important;top:8px!important;z-index:2147483645!important;display:flex!important;align-items:center!important;justify-content:center!important;width:32px!important;height:32px!important;padding:0!important;border:1.5px solid rgba(255,255,255,.55)!important;border-radius:50%!important;background:rgba(0,0,0,.62)!important;color:#fff!important;cursor:pointer!important;backdrop-filter:blur(8px)!important;box-shadow:0 3px 12px rgba(0,0,0,.35)!important}.sc-ig-dl:hover{background:rgba(0,0,0,.86)!important;transform:scale(1.1)!important}.sc-ig-dl svg,#sc-ig-page-dl svg{width:18px;height:18px;fill:currentColor}.sc-ig-dl[data-state=busy],#sc-ig-page-dl[data-state=busy]{opacity:.55!important;cursor:wait!important}#sc-ig-page-dl{position:fixed;right:74px;bottom:22px;z-index:2147483646;display:flex;align-items:center;justify-content:center;width:38px;height:38px;padding:0;border:1.5px solid rgba(255,255,255,.8);border-radius:50%;background:rgba(219,39,119,.92);color:#fff;box-shadow:0 3px 12px rgba(0,0,0,.45);cursor:pointer}#sc-ig-page-dl:hover{background:#be185d;transform:scale(1.08)}',
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
