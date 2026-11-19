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
          // Launch from a hidden frame, not by navigating the tab: Opera
          // closed the YouTube tab after handing location.href to ytg.
          const frame = document.createElement("iframe");
          frame.style.display = "none";
          frame.src = `ytg:${encodeURIComponent(url)}`;
          document.body.append(frame);
          setTimeout(() => frame.remove(), 5000);
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
      // Like YouTube's own items: a round button with a label underneath.
      document.querySelectorAll("reel-action-bar-view-model").forEach((bar) => {
        if (bar.querySelector(".sc-yt")) return;
        const item = document.createElement("div");
        item.className = "sc-yt-item";
        const label = document.createElement("span");
        label.textContent = "Tải";
        item.append(ytgButton("sc-yt-shorts"), label);
        bar.prepend(item);
      });
    }

    // Measured from YouTube's own buttons: 36 px grey pills on watch pages;
    // on Shorts 48 px circles (white 10 % fill, #f1f1f1 icon), a 12/18 px
    // label 4 px below and 8 px to the next item.
    GM_addStyle(
      ".sc-in.sc-yt-watch{width:36px!important;height:36px!important;margin-left:8px!important;background:var(--yt-spec-badge-chip-background,rgba(127,127,127,.2))!important;color:var(--yt-spec-text-primary,currentColor)!important}" +
        ".sc-in.sc-yt-watch:hover{background:var(--yt-spec-10-percent-layer,rgba(127,127,127,.32))!important}" +
        ".sc-in.sc-yt-watch .sc-icon{width:20px;height:20px}" +
        ".sc-yt-item{display:flex;flex-direction:column;align-items:center;padding-bottom:8px;color:#f1f1f1;font:12px/18px Roboto,Arial,sans-serif}" +
        ".sc-yt-item>span{margin-top:4px}" +
        ".sc-in.sc-yt-shorts{width:48px!important;height:48px!important;background:rgba(255,255,255,.1)!important;color:#f1f1f1!important}" +
        ".sc-in.sc-yt-shorts:hover{background:rgba(255,255,255,.2)!important}" +
        ".sc-in.sc-yt-shorts[data-state=done],.sc-in.sc-yt-watch[data-state=done]{color:#1d9e5f!important}" +
        ".sc-in.sc-yt-shorts[data-state=error],.sc-in.sc-yt-watch[data-state=error]{color:#e0393e!important}" +
        ".sc-in.sc-yt-shorts .sc-icon{width:24px;height:24px}",
    );

    scWatchDom(decorate);
  })();
