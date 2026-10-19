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
              // Current pages define it as ["LSD",[],{"token":"…"},…].
              (o.match(/\["LSD",\[\],\{"token":"([^"]+)"/) || [])[1] ||
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
    (n.id = "sc-launcher"), (n.innerHTML = scIcon("bolt")), (n.title = "Social All-in-One");
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
    await scRun(button, async () => {
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
    });
  }
  function decorateInstagramUnsave() {
    if (!location.pathname.includes("/saved/all-posts/")) return;
    document.querySelectorAll('main a[href*="/p/"],main a[href*="/reel/"]').forEach((tile) => {
      if (tile.querySelector(".sc-unsave-btn")) return;
      const button = scButton("overlay", "bookmark-off", "Bỏ lưu bài này");
      button.classList.add("sc-unsave-btn");
      button.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        instagramUnsave(tile, button);
      };
      if (getComputedStyle(tile).position === "static") tile.style.position = "relative";
      tile.append(button);
    });
  }
  // Threads post data, read from what the page itself loaded (first-load JSON
  // and GraphQL responses) instead of replaying a GraphQL query: code ->
  // { user, items: [{ url, kind }] } with every carousel item.
  const threadsPosts = new Map();
  const largestUrl = (list) =>
    (list || []).reduce((best, c) => (!best || (c.width || 0) * (c.height || 0) > (best.width || 0) * (best.height || 0) ? c : best), null)?.url;
  function rememberThreadsPost(p) {
    const items = (p.carousel_media && p.carousel_media.length ? p.carousel_media : [p])
      .map((c) => {
        const video = largestUrl(c.video_versions);
        return video ? { url: video, kind: "video" } : { url: largestUrl(c.image_versions2 && c.image_versions2.candidates), kind: "image" };
      })
      .filter((item) => item.url);
    if (items.length) threadsPosts.set(p.code, { user: p.user && p.user.username, items });
    if (threadsPosts.size > 2000) threadsPosts.delete(threadsPosts.keys().next().value);
  }
  function scanThreadsPayload(text) {
    if (typeof text !== "string" || !/image_versions2|video_versions/.test(text)) return;
    for (const line of text.replace(/^for \(;;\);/, "").split("\n")) {
      let stack;
      try {
        stack = [JSON.parse(line)];
      } catch {
        continue;
      }
      for (let n = 0; stack.length && n++ < 5e5; ) {
        const v = stack.pop();
        if (Array.isArray(v)) stack.push(...v);
        else if (v && "object" == typeof v) {
          if ("string" == typeof v.code && (v.carousel_media || v.image_versions2)) rememberThreadsPost(v);
          for (const x of Object.values(v)) x && "object" == typeof x && stack.push(x);
        }
      }
    }
  }
  function scanThreadsPageData() {
    document.querySelectorAll('script[type="application/json"]:not([data-sc-scanned])').forEach((s) => {
      s.dataset.scScanned = "1";
      if (s.textContent.includes('"image_versions2"')) scanThreadsPayload(s.textContent);
    });
  }

  // Threads posts with several images/videos: a stack button beside quick
  // save that downloads every item of the post.
  function threadsMediaCount(post) {
    return [...post.querySelectorAll('img, div[aria-label="Video player"]')].filter((el) => {
      if (el instanceof HTMLImageElement && (/profile picture|avatar/i.test(el.alt) || el.closest('div[aria-label="Video player"]')))
        return !1;
      const r = el.getBoundingClientRect();
      return r.width >= 120 && r.height >= 120;
    }).length;
  }
  function decorateThreadsAll() {
    scanThreadsPageData();
    document.querySelectorAll(".sc-threads-save-container:not([data-sc-all])").forEach((box) => {
      const post = box.closest("[data-pressable-container]");
      const match = post && post.querySelector('a[href*="/post/"]')?.href.match(/\/@([^/]+)\/post\/([^/?#]+)/);
      if (!match) return;
      const [, user, code] = match;
      const cached = threadsPosts.get(code);
      if (cached && cached.items.length < 2) return void (box.dataset.scAll = "0");
      // Without data yet, rely on what is rendered; images load lazily, so
      // posts that do not show two media yet are retried on the next pass.
      if (!cached && threadsMediaCount(post) < 2) return;
      box.dataset.scAll = "1";
      const button = scButton("inline", "stack", "Tải cả bài", { small: !0 });
      button.classList.add("sc-threads-all-btn");
      button.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        scRun(button, async () => {
          scanThreadsPageData();
          const data = threadsPosts.get(code);
          const items = data ? data.items : await m(code);
          if (!items.length) throw new Error("Không lấy được media của bài.");
          // threads_<user>_<original file name>, like the single-item buttons.
          for (const item of items) {
            const name = new URL(item.url).pathname.split("/").pop() || ("video" === item.kind ? "video.mp4" : "image.jpg");
            await f(item.url, `threads_${(data && data.user) || user}_${name}`);
          }
        });
      };
      box.prepend(button);
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
                (i.style.cssText = `position:absolute!important;right:${a > 1 ? "70px" : "38px"};top:-8px;z-index:100;display:flex;align-items:center;`);
              const s = scButton(
                "inline",
                t ? "bookmark-off" : "bookmark",
                t ? "Bỏ lưu nhanh" : "Lưu nhanh",
                { small: !0 },
              );
              s.classList.add("sc-threads-save-btn"),
                (s.onclick = (n) => {
                  if (
                    (n.preventDefault(),
                    n.stopPropagation(),
                    "loading" === s.dataset.state)
                  )
                    return;
                  scSetState(s, "loading"),
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
                      scSetIcon(s, t ? "bookmark" : "bookmark-filled", t ? "Đã bỏ lưu" : "Đã lưu");
                      scSetState(s, "done");
                    } else if (e && findItem(e, already)) {
                      // Already in the wanted state: close the menu, report done.
                      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: !0 }));
                      scSetIcon(s, t ? "bookmark" : "bookmark-filled", t ? "Đã bỏ lưu" : "Đã lưu");
                      scSetState(s, "done");
                    } else if (++o < 15) setTimeout(r, 300);
                    else {
                      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: !0 }));
                      scSetState(s, "error", "Không tìm thấy mục Lưu");
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
            const r = scButton("overlay", "download", e ? "Tải ảnh" : "Tải video");
            r.classList.add("sc-thread-btn");
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
                  (p = !0), scSetState(r, "loading");
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
                    scSetState(r, "done");
                  } catch (t) {
                    console.warn("[Social All-in-One]", t),
                      scSetState(r, "error", `Lỗi tải: ${t instanceof Error ? t.message : String(t)}`);
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
          const isGraphql = /\/graphql\//.test(r);
          if (isGraphql) {
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
          const res = await e(t, o);
          isGraphql &&
            res
              .clone()
              .text()
              .then(scanThreadsPayload)
              .catch(() => {});
          return res;
        };
        const o = t.XMLHttpRequest,
          r = o.prototype.open,
          a = o.prototype.setRequestHeader;
        (o.prototype.open = function (t, e, ...n) {
          return (
            (this.__scThreadsGraphql = /\/graphql\//.test(String(e))),
            this.__scThreadsGraphql &&
              this.addEventListener(
                "loadend",
                () => {
                  try {
                    ("" !== this.responseType && "text" !== this.responseType) || scanThreadsPayload(this.responseText);
                  } catch {}
                },
                { once: !0 },
              ),
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
      "#sc-launcher{position:fixed;right:18px;bottom:18px;z-index:2147483646;width:40px;height:40px;padding:0;border:0;border-radius:50%;background:#635bff;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .15s ease}#sc-launcher:hover{transform:scale(1.06)}#sc-launcher .sc-icon{width:20px;height:20px}#sc-panel{position:fixed;right:18px;bottom:68px;z-index:2147483646;width:350px;max-height:75vh;overflow:auto;background:#161618;color:#e7e7ea;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px;font:13px system-ui,sans-serif}#sc-panel[hidden]{display:none}.sc-row{display:flex;gap:8px;margin:8px 0}.sc-row>*{min-width:0}.sc-input{flex:1;padding:8px;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:rgba(255,255,255,.06);color:#fff}.sc-btn{padding:8px 10px;border:0;border-radius:8px;background:#635bff;color:#fff;cursor:pointer}.sc-btn:disabled{opacity:.5;cursor:wait}.sc-btn.alt{background:rgba(255,255,255,.08)}.sc-btn.danger{background:#b4232f}.sc-muted{color:#8d8d94;margin:6px 0}.sc-status{white-space:pre-wrap;max-height:160px;overflow:auto;padding:8px;background:rgba(0,0,0,.35);border-radius:8px}.sc-ov.sc-unsave-btn{right:8px;top:8px}.sc-ov.sc-thread-btn{right:10px;top:10px}.sc-in.sc-threads-save-btn,.sc-in.sc-threads-all-btn{color:var(--barcelona-secondary-icon,currentColor)!important}"
    ),
      // The ⚡ scanner only works on instagram.com (it calls Instagram APIs).
      "instagram" === u() && _(),
      scWatchDom(w),
      "threads" === u() && scWatchDom(decorateThreadsAll),
      console.info("[Social All-in-One] active:", u());
  })();
})();
