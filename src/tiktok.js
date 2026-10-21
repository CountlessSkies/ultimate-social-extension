// TikTok: download buttons in the feed's action bar (For You, Following, a
// video page) and on grid tiles (profile, explore, search). Videos save the
// largest bitrateInfo entry (e.g. 1080p H.265, with sound, no watermark)
// instead of playAddr (often 540p); photo posts save every image.
// Item data comes from the page: the first-load JSON and the item_list /
// search / detail API responses (the approach the Social AIO extension uses).
location.hostname.endsWith("tiktok.com") &&
  (() => {
    "use strict";

    const items = new Map(); // post id and video id -> itemStruct
    function remember(item) {
      if (!item || !item.id || !(item.video || item.imagePost)) return;
      items.set(String(item.id), item);
      if (item.video && item.video.id) items.set(String(item.video.id), item);
      if (items.size > 4000) items.delete(items.keys().next().value);
    }
    function scanApi(text) {
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return;
      }
      const list = data.itemList || data.item_list || data.items || (Array.isArray(data.data) ? data.data : []);
      for (const entry of list) remember((entry && entry.item) || entry);
      if (data.itemInfo) remember(data.itemInfo.itemStruct);
    }
    function scanPageData() {
      const script = document.getElementById("__UNIVERSAL_DATA_FOR_REHYDRATION__");
      if (!script || script.dataset.scScanned === script.textContent.length.toString()) return;
      script.dataset.scScanned = script.textContent.length.toString();
      try {
        const scope = JSON.parse(script.textContent).__DEFAULT_SCOPE__ || {};
        remember(scope["webapp.video-detail"]?.itemInfo?.itemStruct);
      } catch {}
    }

    // Page hook at document-start, before TikTok keeps its own fetch reference.
    (() => {
      const page = unsafeWindow;
      if (page.__scTiktokHook) return;
      page.__scTiktokHook = true;
      const wanted = (url) => /\/api\//.test(url) && /item_list|search|item\/detail|related/.test(url);
      const pageFetch = page.fetch.bind(page);
      page.fetch = async (input, init) => {
        const res = await pageFetch(input, init);
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (wanted(url))
          res
            .clone()
            .text()
            .then(scanApi)
            .catch(() => {});
        return res;
      };
      const open = page.XMLHttpRequest.prototype.open;
      page.XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        if (wanted(String(url)))
          this.addEventListener(
            "loadend",
            () => {
              try {
                if (this.responseType === "" || this.responseType === "text") scanApi(this.responseText);
              } catch {}
            },
            { once: true },
          );
        return open.call(this, method, url, ...rest);
      };
    })();

    const safeName = (s) => String(s).replace(/[\\/:*?"<>|]/g, "_");
    const area = (play) => (play.Width || 0) * (play.Height || 0);
    // The sharpest stream: largest bitrateInfo picture, then highest bitrate.
    function bestVideoUrl(video) {
      const best = [...(video.bitrateInfo || [])]
        .filter((b) => b.PlayAddr && b.PlayAddr.UrlList && b.PlayAddr.UrlList.length)
        .sort((a, b) => area(b.PlayAddr) - area(a.PlayAddr) || (b.Bitrate || 0) - (a.Bitrate || 0))[0];
      return (best && best.PlayAddr.UrlList[0]) || video.playAddr || video.downloadAddr || null;
    }
    // tt_<username>_<post id>.mp4, or tt_<username>_<post id>_<n>.<ext> for photos.
    async function downloadItem(id) {
      scanPageData();
      const item = items.get(String(id));
      if (!item) throw new Error("Chưa có dữ liệu bài này — cuộn lại hoặc mở bài rồi thử lại");
      const user = safeName((item.author && (item.author.uniqueId || item.author.id)) || "tiktok");
      const images = item.imagePost && item.imagePost.images;
      if (images && images.length) {
        for (const [index, image] of images.entries()) {
          const url = image.imageURL && image.imageURL.urlList && image.imageURL.urlList[0];
          if (!url) continue;
          const ext = (new URL(url).pathname.match(/\.(jpe?g|png|webp|heic)/i) || [, "jpg"])[1].toLowerCase();
          await scSaveUrl(url, `tt_${user}_${item.id}_${index + 1}.${ext}`);
        }
        return;
      }
      const url = item.video && bestVideoUrl(item.video);
      if (!url) throw new Error("Không có link video");
      await scSaveUrl(url, `tt_${user}_${item.id}.mp4`);
    }

    const idFromHref = (href) => ((href || "").match(/\/(?:video|photo)\/(\d+)/) || [])[1] || null;
    const stopEvents = (button) => {
      const stop = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };
      ["pointerdown", "mousedown", "mouseup", "dblclick"].forEach((type) => button.addEventListener(type, stop, true));
      return stop;
    };

    // Feed items (For You, Following, a video page): first in the action bar.
    function decorateFeed() {
      document.querySelectorAll('article:not([data-sc-tt]), [data-e2e="recommend-list-item-container"]:not([data-sc-tt])').forEach((post) => {
        const bar = post.querySelector('[class*="SectionActionBarContainer"]');
        if (!bar || !post.querySelector('[data-e2e="feed-video"], [id*="xgwrapper"]')) return;
        post.dataset.scTt = "1";
        const button = scButton("inline", "download", "Tải video/ảnh (bản nét nhất)");
        button.classList.add("sc-tt-action");
        const stop = stopEvents(button);
        button.addEventListener(
          "click",
          (e) => {
            stop(e);
            scRun(button, () => {
              // Resolved at click time: TikTok recycles feed containers.
              const id =
                post.querySelector('[id*="xgwrapper"]')?.id.split("-").at(-1) ||
                idFromHref(post.querySelector('a[href*="/video/"], a[href*="/photo/"]')?.getAttribute("href")) ||
                idFromHref(location.pathname);
              if (!id) throw new Error("Không tìm được ID video");
              return downloadItem(id);
            });
          },
          true,
        );
        bar.prepend(button);
      });
    }

    // Grid tiles (profile, explore, search, "you may like"): overlay buttons.
    function decorateTiles() {
      document.querySelectorAll('a[href*="/video/"]:not([data-sc-tt]), a[href*="/photo/"]:not([data-sc-tt])').forEach((link) => {
        const id = idFromHref(link.getAttribute("href"));
        if (!id || link.closest("article, [data-e2e='recommend-list-item-container']")) return void (link.dataset.scTt = "0");
        // The largest media: profile tiles hold a zero-height <picture> next to
        // the <img>/<canvas> that are actually shown.
        const size = [...link.querySelectorAll("img, video, picture, canvas")]
          .map((el) => el.getBoundingClientRect())
          .sort((a, b) => b.width * b.height - a.width * a.height)[0];
        if (!size || size.width < 100 || size.height < 100) return;
        link.dataset.scTt = "1";
        const tile = link.parentElement || link;
        if (getComputedStyle(tile).position === "static") tile.style.position = "relative";
        const button = scButton("overlay", "download", "Tải video/ảnh (bản nét nhất)");
        button.classList.add("sc-tt-tile");
        const stop = stopEvents(button);
        button.addEventListener(
          "click",
          (e) => {
            stop(e);
            scRun(button, () => downloadItem(id));
          },
          true,
        );
        tile.append(button);
      });
    }

    // TikTok's own action buttons are 48px grey circles with white icons.
    GM_addStyle(
      ".sc-in.sc-tt-action{width:48px!important;height:48px!important;margin-bottom:12px!important;background:rgba(127,127,127,.22)!important;color:#fff!important}.sc-in.sc-tt-action:hover{background:rgba(127,127,127,.36)!important}.sc-ov.sc-tt-tile{right:8px;top:8px}",
    );

    scWatchDom(() => {
      scanPageData();
      decorateFeed();
      decorateTiles();
    });
  })();
