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
