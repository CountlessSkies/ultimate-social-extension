// YouTube: a download button on the watch page and on Shorts that hands the
// link to ytg.exe (D:/AgentWorks/yt-dlp-gui), the command-line twin of the
// yt-dlp GUI. A browser cannot start programs, so the button opens
// ytg:<url-encoded link>; Windows runs tools/ytg/ytg-handler.ps1 for that
// scheme (registered once with tools/ytg/ytg-protocol.reg), which starts
// ytg in a console window showing the progress. Quality and folder come from
// ytg's own settings.
location.hostname.endsWith("youtube.com") &&
  (() => {
    "use strict";

    // The video on screen, as a clean link: watch?v=<id> or shorts/<id>.
    function currentVideoUrl() {
      const shorts = location.pathname.match(/^\/shorts\/([\w-]{6,})/);
      if (shorts) return `https://www.youtube.com/shorts/${shorts[1]}`;
      const id = new URLSearchParams(location.search).get("v");
      return id ? `https://www.youtube.com/watch?v=${id}` : null;
    }

    function ytgButton(extraClass) {
      const button = scButton("inline", "download", "Tải bằng ytg (yt-dlp)");
      button.classList.add("sc-yt", extraClass);
      button.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          const url = currentVideoUrl();
          if (!url) return void scSetState(button, "error", "Không thấy link video");
          // Chrome asks once whether to open ytg; nothing reports back, so
          // the button only confirms that the link was handed over.
          location.href = `ytg:${encodeURIComponent(url)}`;
          scSetState(button, "done", "Đã gửi sang ytg — xem tiến trình trong cửa sổ console");
        },
        true,
      );
      return button;
    }

    function decorate() {
      // Watch page: after Like/Share in the row under the title.
      const row = document.querySelector("ytd-watch-metadata #top-level-buttons-computed");
      if (row && !row.querySelector(".sc-yt")) row.append(ytgButton("sc-yt-watch"));
      // Shorts: first in each reel's action column (only the active reel is
      // on screen; the link is read from the URL at click time).
      document.querySelectorAll("reel-action-bar-view-model").forEach((bar) => {
        if (!bar.querySelector(".sc-yt")) bar.prepend(ytgButton("sc-yt-shorts"));
      });
    }

    // YouTube's own buttons: 36 px grey pills on watch pages, 48 px circles on Shorts.
    GM_addStyle(
      ".sc-in.sc-yt{background:var(--yt-spec-badge-chip-background,rgba(127,127,127,.2))!important;color:var(--yt-spec-text-primary,currentColor)!important}" +
        ".sc-in.sc-yt:hover{background:var(--yt-spec-10-percent-layer,rgba(127,127,127,.32))!important}" +
        ".sc-in.sc-yt-watch{width:36px!important;height:36px!important;margin-left:8px!important}" +
        ".sc-in.sc-yt-shorts{width:48px!important;height:48px!important;margin-bottom:16px!important}" +
        ".sc-in.sc-yt .sc-icon{width:20px;height:20px}",
    );

    scWatchDom(decorate);
  })();
