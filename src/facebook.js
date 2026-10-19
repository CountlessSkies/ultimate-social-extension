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
