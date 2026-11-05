# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Social All-in-One": a single Tampermonkey userscript (plain JavaScript, no dependencies, no package.json) that adds media download and quick save/unsave buttons to Facebook, Instagram, Threads and TikTok.

## Commands

- Build: `node scripts/build-userscript.mjs`. It concatenates `src/` into `dist/social-all-in-one.bundle.js`, `dist/social-all-in-one.user.js` (header plus bundle) and `dist/social-all-in-one.meta.js` (header only, polled by `@updateURL`). The `@version` is date-based (`YYYY.M.D.HHMM`), so every build is newer.
- Syntax check: `node --check src/<file>.js`. There are no tests and no linter.
- Pre-commit hook: `.githooks/pre-commit` rebuilds `dist/` and stages it whenever staged files touch `src/`. Enable it once per clone with `git config core.hooksPath .githooks`. Never edit `dist/` by hand.

## Development and release flow

- Local development: `tampermonkey/social-all-in-one.local.user.js` is a loader that `@require`s each `src/*.js` from disk via `file:///D:/AgentWorks/...`, so editing `src/` and reloading the tab takes effect.
  - If you change `@match`, `@grant` or `@connect`, update both this loader and the header in `scripts/build-userscript.mjs`. The user then re-pastes the loader into Tampermonkey.
- Release: push to `main`. Installed copies auto-update from `raw.githubusercontent.com/CountlessSkies/ultimate-social-extension/main/dist/`.
- When a pushed fix "doesn't work" in the browser, first prove which code is running. Tampermonkey often keeps an old copy, either cached `@require`s or a GitHub install that hasn't updated yet. One check: dispatch a synthetic event, or look for a CSS rule that only the new code adds.

## Architecture

- `src/` files are concatenated in a fixed order: `shared.js`, `core.js`, `facebook.js`, `instagram.js`, `tiktok.js`. The order is set by the `SOURCES` array in the build script and must match the loader's `@require` order.
- In the local loader each file runs as a separate `@require`. So shared helpers in `shared.js` are top-level `var` / `function` declarations (prefixed `sc`), not `const`.
- Each site module is an IIFE gated by a hostname check (`location.hostname.includes(...) && (() => {...})()`).
- `core.js` is an older file, partly minified (single-letter names). It holds:
  - the Instagram ⚡ panel scanner;
  - Instagram Saved-page unsave;
  - Threads quick save, per-media download buttons and the "all" button;
  - the Threads post cache.

### Shared building blocks (`src/shared.js`)

- `scWatchDom(fn)`: one throttled MutationObserver for all modules. Decorators are re-run on every tick, so they must be idempotent. They mark processed elements with `data-*` attributes.
- `scSaveUrl(url, name)` / `scFetchBlob`: fetch the bytes, then save via a Blob URL and `<a download>`, so the file name is kept. GM_xmlhttpRequest is the fallback for CDNs without CORS.
  - Do not switch to `GM_download`: in the user's setup it produced UUID file names.
- Button kit:
  - `scButton("overlay" | "inline", icon, title, {small})`
  - `scSetState` (idle / loading / done / error)
  - `scRun(button, job, {queue})`. Jobs go through `scQueue`, a global promise chain, so several clicked downloads save in click order. Quick save/unsave passes `{ queue: false }`.
  - New buttons should use this kit for a consistent look; site-specific sizing goes in each module's `GM_addStyle`.
- `scBestDashVideo(xml)`: picks the highest-bandwidth video Representation from a DASH manifest.

### Where media data comes from

Each module hooks the page's `fetch` / XHR via `unsafeWindow` at `document-start` and also scans the first-load JSON embedded in the page. Button clicks then look media up in those caches rather than scraping the DOM.

- **Facebook:** GraphQL responses (newline-delimited JSON, possibly prefixed with `for (;;);`):
  - `viewer_image` for full-size photos;
  - `all_subattachments` for photo sets;
  - `dash_manifests` / `progressive_urls` for video.
- **Instagram:** `i.instagram.com/api/v1/media/{id}/info/` via GM_xmlhttpRequest. The feed/post logic is ported from `D:/AgentWorks/ig-download`; read its `ARCHITECTURE.md` before changing carousel slide resolution or naming.
- **Threads:** the page JSON plus GraphQL (`carousel_media`, `video_dash_manifest`).
- **TikTok:** `__UNIVERSAL_DATA_FOR_REHYDRATION__` plus the `item_list` / `search` / `item/detail` / `related` API responses. Video downloads use the largest `bitrateInfo` stream.

### Conventions the user cares about

- File names:
  - Instagram: `<user>_<original CDN name>`
  - Threads: `threads_<user>_…`
  - Facebook: `fb_<username or numeric profile id>_<original name | video id>`
  - TikTok: `tt_<user>_<post id>[_n]`
  - Renaming is a key feature; don't break it.
- Video: always the sharpest stream. A DASH video-only track is acceptable (no audio needed).
- UI strings shown to the user (tooltips, errors) are in Vietnamese.
- Instagram hotkeys (A / D carousel, S / Shift+S download) match `event.code` and also map Unikey Telex output (`đ`, `â`, acute-accented letters) back to the key, because Unikey swallows the physical key.
- Downloads land in `D:\Desktop\_Works`. Chrome's multiple-download allow list needs `[*.]site.com` patterns, so blocked multi-downloads are a browser setting, not a script bug.
