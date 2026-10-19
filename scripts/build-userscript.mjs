// Builds dist/social-all-in-one.user.js: the userscript header plus the bundle
// in one file, so Tampermonkey can install and auto-update it from GitHub.
// Usage: node scripts/build-userscript.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const RAW = "https://raw.githubusercontent.com/CountlessSkies/ultimate-social-extension/main/dist";

// Date-based version so every build is newer than the installed one.
const d = new Date();
const pad = (n) => String(n).padStart(2, "0");
const version = `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}.${pad(d.getHours())}${pad(d.getMinutes())}`;

const header = `// ==UserScript==
// @name         Social All-in-One
// @namespace    github.com/CountlessSkies/ultimate-social-extension
// @version      ${version}
// @description  Facebook quick-save, Instagram tools and media download, Threads media tools.
// @match        https://*.facebook.com/*
// @match        https://*.instagram.com/*
// @match        https://*.threads.net/*
// @match        https://*.threads.com/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_download
// @grant        GM_addStyle
// @grant        unsafeWindow
// @connect      instagram.com
// @connect      i.instagram.com
// @connect      threads.net
// @connect      threads.com
// @connect      cdninstagram.com
// @connect      fbcdn.net
// @updateURL    ${RAW}/social-all-in-one.meta.js
// @downloadURL  ${RAW}/social-all-in-one.user.js
// ==/UserScript==
`;

const bundle = readFileSync(`${root}dist/social-all-in-one.bundle.js`, "utf8");
writeFileSync(`${root}dist/social-all-in-one.user.js`, `${header}\n${bundle}`);
// Tampermonkey polls @updateURL; a header-only file keeps update checks light.
writeFileSync(`${root}dist/social-all-in-one.meta.js`, header);
console.log(`Built social-all-in-one.user.js v${version}`);
