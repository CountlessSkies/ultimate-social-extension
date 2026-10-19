// ==UserScript==
// @name         Social All-in-One
// @namespace    github.com/CountlessSkies/ultimate-social-extension
// @version      2026.10.19.1516
// @description  Facebook quick-save, Instagram tools and media download, Threads media tools.
// @match        https://*.facebook.com/*
// @match        https://*.instagram.com/*
// @match        https://*.threads.net/*
// @match        https://*.threads.com/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        unsafeWindow
// @connect      instagram.com
// @connect      i.instagram.com
// @connect      threads.net
// @connect      threads.com
// @connect      cdninstagram.com
// @connect      fbcdn.net
// @updateURL    https://raw.githubusercontent.com/CountlessSkies/ultimate-social-extension/main/dist/social-all-in-one.meta.js
// @downloadURL  https://raw.githubusercontent.com/CountlessSkies/ultimate-social-extension/main/dist/social-all-in-one.user.js
// ==/UserScript==

!function(){"use strict";const t="sc:ig-results";let e=!1,n={};const o=[];let r="";const a=new Map,i=new Map,s=new Map;let l,c=!1,d=!1;const u=()=>{const t=location.hostname;return t.includes("facebook.com")?"facebook":t.includes("instagram.com")?"instagram":t.includes("threads.net")||t.includes("threads.com")?"threads":"unknown"},p=t=>new Promise(e=>setTimeout(e,t));function h(t){let e=0n;for(const n of t){const t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".indexOf(n);t>=0&&(e=64n*e+BigInt(t))}return e.toString()}async function m(t){var e,o;const r=/^\d+$/.test(t)?t:h(t),a=function(){var t,e,n;const o=Array.from(document.scripts).map(t=>t.textContent||"").join("\n"),r=t=>{var e,n;return(null==(e=document.querySelector(`input[name="${t}"]`))?void 0:e.value)||(null==(n=document.querySelector(`meta[name="${t}"]`))?void 0:n.content)},a=t=>{var e,n;const r=t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return(null==(e=o.match(new RegExp(`["']${r}["']\\s*[:=]\\s*["']?([^"',}&\\s]+)`)))?void 0:e[1])||(null==(n=o.match(new RegExp(`(?:^|[?&])${r}=([^&"'\\s]+)`)))?void 0:n[1])},i={docId:(null==(t=o.match(/"BarcelonaLightboxDialogRootQuery".{0,200}?(?:"id"|"doc_id")\s*:\s*"([0-9]+)"/))?void 0:t[1])||(null==(e=o.match(/"BarcelonaPostPageDirectQuery".{0,200}?(?:"id"|"doc_id")\s*:\s*"([0-9]+)"/))?void 0:e[1])||a("doc_id"),lsd:r("lsd")||(null==(n=o.match(/"token":"([A-Za-z0-9_-]+)","__typename":"LSD"/))?void 0:n[1])||a("lsd"),jazoest:r("jazoest")||a("jazoest"),isLoggedIn:/"__relay_internal__pv__BarcelonaIsLoggedInrelayprovider"\s*:\s*true/.test(o)};for(const t of["__hs","__rev","__s","__hsi","__dyn","__csr","__hsdp","__hblp","__sjsp","__spin_r","__spin_t"])i[t]=r(t)||a(t);return i}(),i=n["x-csrftoken"]||(null==(e=document.cookie.match(/(?:^|; )csrftoken=([^;]+)/))?void 0:e[1])||"",s={postID:r,__relay_internal__pv__BarcelonaOptionalCookiesEnabledrelayprovider:!0,__relay_internal__pv__BarcelonaIsLoggedInrelayprovider:a.isLoggedIn,__relay_internal__pv__BarcelonaHasGhostPostConsumptionrelayprovider:!0,__relay_internal__pv__IsTagIndicatorEnabledrelayprovider:!0,__relay_internal__pv__BarcelonaHasDeepDiverelayprovider:!1,__relay_internal__pv__BarcelonaHasSpoilerStylingInforelayprovider:!1,__relay_internal__pv__BarcelonaHasGhostPostEmojiActivationrelayprovider:!1,__relay_internal__pv__BarcelonaHasPodcastConsumptionrelayprovider:!0},l=new URLSearchParams({fb_api_caller_class:"RelayModern",fb_api_req_friendly_name:"BarcelonaLightboxDialogRootQuery",variables:JSON.stringify(s),doc_id:a.docId||"25345179165155449"});a.jazoest&&l.set("jazoest",a.jazoest);for(const t of["__hs","__rev","__s","__hsi","__dyn","__csr","__hsdp","__hblp","__sjsp","__spin_r","__spin_t"]){const e=a[t];"string"==typeof e&&e&&l.set(t,e)}const c=await unsafeWindow.fetch("https://www.threads.com/graphql/query",{method:"POST",credentials:"include",headers:{"Content-Type":"application/x-www-form-urlencoded","X-CSRFToken":i,"X-IG-App-ID":n["x-ig-app-id"]||"238280553337426","X-FB-LSD":n["x-fb-lsd"]||a.lsd||"AVpX_XXXX","X-ASBD-ID":n["x-asbd-id"]||"129477","X-FB-Friendly-Name":"BarcelonaLightboxDialogRootQuery"},body:l});if(!c.ok)throw new Error(`Threads GraphQL trả ${c.status}. Có thể Threads vừa đổi token/API.`);const d=await c.json(),u=(null==(o=null==d?void 0:d.data)?void 0:o.data)||(null==d?void 0:d.data)||d,p=(t,e=new WeakSet)=>{if(!t||"object"!=typeof t||e.has(t))return null;if(e.add(t),String(t.pk||t.id||"").split("_")[0]===r&&(t.video_versions||t.image_versions2||t.carousel_media))return t;for(const n of Array.isArray(t)?t:Object.values(t)){const t=p(n,e);if(t)return t}return null},m=(null==u?void 0:u.pk)===r?u:p(u);return m?(m.carousel_media||[m]).flatMap(t=>{var e,n,o,r,a;return null!=(n=null==(e=t.video_versions)?void 0:e[0])&&n.url?[{url:t.video_versions[0].url,kind:"video",id:t.pk}]:null!=(a=null==(r=null==(o=t.image_versions2)?void 0:o.candidates)?void 0:r[0])&&a.url?[{url:t.image_versions2.candidates.sort((t,e)=>e.width*e.height-t.width*t.height)[0].url,kind:"image",id:t.pk}]:[]}):[]}async function f(t,e){const n=await fetch(t);if(!n.ok)throw new Error(`Không tải được media (${n.status}).`);const o=await n.blob(),r=URL.createObjectURL(o),a=document.createElement("a");a.href=r,a.download=e,a.style.display="none",document.body.append(a),a.click(),a.remove(),setTimeout(()=>URL.revokeObjectURL(r),1e3)}function g(){const t=window.innerWidth,e=window.innerHeight,n=new Set;for(const[o,r]of s){if(!o.isConnected||!r.isConnected){s.delete(o);continue}const a=r.getBoundingClientRect();let i=Math.max(0,a.left),l=Math.max(0,a.top),c=Math.min(t,a.right),d=Math.min(e,a.bottom);for(let t=r.parentElement;t&&c>i&&d>l;t=t.parentElement){const e=getComputedStyle(t),n=/hidden|clip|scroll|auto/.test(e.overflowX),o=/hidden|clip|scroll|auto/.test(e.overflowY);if(!n&&!o)continue;const r=t.getBoundingClientRect();n&&(i=Math.max(i,r.left),c=Math.min(c,r.right)),o&&(l=Math.max(l,r.top),d=Math.min(d,r.bottom))}const u=Math.max(0,c-i),p=Math.max(0,d-l);let h=a.width>=120&&a.height>=120&&u/a.width>.9&&p/a.height>.9;if(h){const t=`${Math.round(i)}:${Math.round(l)}:${Math.round(u)}:${Math.round(p)}`;n.has(t)?h=!1:n.add(t)}o.style.setProperty("display",h?"flex":"none","important"),h&&(o.style.setProperty("left",`${Math.round(c-42)}px`,"important"),o.style.setProperty("top",`${Math.round(l+10)}px`,"important"))}}function v(t=800){g(),l&&clearInterval(l);const e=Date.now();l=window.setInterval(()=>{g(),Date.now()-e>=t&&l&&(clearInterval(l),l=void 0)},50)}async function b(t){const e=await unsafeWindow.fetch(`https://i.instagram.com${t}`,{credentials:"include",headers:{"X-IG-App-ID":"936619743392459","X-Requested-With":"XMLHttpRequest",Accept:"application/json"}});if(!e.ok)throw new Error(`Instagram trả ${e.status}. Hãy mở Instagram và đăng nhập trước.`);return e.json()}function y(t,e){if(!t.length)throw new Error("Chưa có dữ liệu để export.");const n=Object.keys(t[0]),o=[n.join(","),...t.map(t=>n.map(e=>(t=>`"${String(t??"").replaceAll('"','""')}"`)(t[e])).join(","))].join("\n"),r=URL.createObjectURL(new Blob([o],{type:"text/csv;charset=utf-8"}));(function(t,e){GM_download({url:t,name:e,saveAs:!1,onerror:()=>window.open(t,"_blank","noopener")})})(r,e),setTimeout(()=>URL.revokeObjectURL(r),3e4)}function _(){const n=document.createElement("button");n.id="sc-launcher",n.textContent="⚡",n.title="Social All-in-One";const o=document.createElement("section");o.id="sc-panel",o.hidden=!0,o.innerHTML=`<div class="sc-row"><strong>Social All-in-One</strong><span class="sc-muted" style="margin-left:auto">${u()}</span></div><div class="sc-muted">Instagram scanner chạy bằng phiên đăng nhập của tab này.</div><div class="sc-row"><input id="sc-user" class="sc-input" placeholder="Instagram username"><select id="sc-type" class="sc-input"><option value="followers">Followers</option><option value="following">Following</option></select></div><div class="sc-row"><button id="sc-scan" class="sc-btn">Quét danh sách</button><button id="sc-meta" class="sc-btn alt">Quét metadata</button><button id="sc-stop" class="sc-btn danger">Dừng</button></div><div class="sc-row"><button id="sc-export-list" class="sc-btn alt">Export list CSV</button><button id="sc-export-meta" class="sc-btn alt">Export metadata CSV</button></div><pre id="sc-status" class="sc-status">Sẵn sàng.</pre>`;const r=o.querySelector("#sc-status"),a=t=>{r.textContent=`${(new Date).toLocaleTimeString()}  ${t}\n${r.textContent||""}`};o.querySelector("#sc-scan").onclick=async()=>{try{const n=o.querySelector("#sc-user").value,r=o.querySelector("#sc-type").value;if(!n)throw new Error("Nhập username Instagram.");await async function(n,o,r){var a,i,s;e=!1;const l=(t=>t.trim().replace(/^@/,"").replace(/\/.+$/,""))(n),c=await b(`/api/v1/users/web_profile_info/?username=${encodeURIComponent(l)}`),d=(null==(a=c.data)?void 0:a.user)||c.user;if(!(null!=d&&d.id||null!=d&&d.pk))throw new Error(`Không tìm thấy @${l}.`);const u=d.id||d.pk,h="followers"===o?(null==(i=d.edge_followed_by)?void 0:i.count)??d.follower_count??0:(null==(s=d.edge_follow)?void 0:s.count)??d.following_count??0,m=[];let f=null;for(;!e;){const t=new URLSearchParams({count:"50",...f?{max_id:f}:{}}),e=await b(`/api/v1/friendships/${u}/${o}/?${t}`);if(m.push(...(e.users||[]).map(t=>({id:String(t.id||t.pk),username:t.username,full_name:t.full_name||"",profile_pic_url:t.profile_pic_url||"",is_verified:!!t.is_verified}))),r(`${o}: ${m.length}/${h||"?"} @${l}`),f=e.next_max_id||null,!f)break;await p(1100+900*Math.random())}return await GM_setValue(t,m),r(e?`Đã dừng: lưu ${m.length} tài khoản.`:`Hoàn tất: ${m.length} tài khoản.`),m}(n,r,a)}catch(t){a(`Lỗi: ${t.message||t}`)}},o.querySelector("#sc-meta").onclick=async()=>{try{await async function(n){var o,r;const a=await GM_getValue(t,[]);if(!a.length)throw new Error("Chưa có kết quả followers/following để quét.");e=!1;const i=[];for(const[t,s]of a.entries()){if(e)break;try{const t=await b(`/api/v1/users/web_profile_info/?username=${encodeURIComponent(s.username)}`),e=(null==(o=t.data)?void 0:o.user)||t.user;i.push({id:String(e.id||e.pk||""),username:e.username,fullName:e.full_name||"",mediaCount:Number(e.media_count??(null==(r=e.edge_owner_to_timeline_media)?void 0:r.count)??0),isPrivate:!!e.is_private,isVerified:!!e.is_verified,followedByViewer:!!e.followed_by_viewer,followsViewer:!!e.follows_viewer})}catch{}n(`Metadata: ${t+1}/${a.length}`),await p(2e3+3e3*Math.random())}return await GM_setValue("sc:ig-metadata",i),n(`Metadata xong: ${i.length} tài khoản.`),i}(a)}catch(t){a(`Lỗi: ${t.message||t}`)}},o.querySelector("#sc-stop").onclick=()=>{e=!0,a("Đang yêu cầu dừng…")},o.querySelector("#sc-export-list").onclick=async()=>{try{y(await GM_getValue(t,[]),"instagram-list.csv"),a("Đã export list.")}catch(t){a(`Lỗi: ${t.message||t}`)}},o.querySelector("#sc-export-meta").onclick=async()=>{try{y(await GM_getValue("sc:ig-metadata",[]),"instagram-metadata.csv"),a("Đã export metadata.")}catch(t){a(`Lỗi: ${t.message||t}`)}},n.onclick=()=>{o.hidden=!o.hidden},document.body.append(n,o)}function w(){const t=u();"facebook"===t&&(function(){if(!document.getElementById("sc-facebook-quick-save-style")){const t=document.createElement("style");t.id="sc-facebook-quick-save-style",t.textContent=".sc-facebook-quick-save{position:absolute!important;right:52px!important;top:2px!important;z-index:100!important}.sc-facebook-quick-save button,.sc-facebook-quick-unsave{width:30px!important;height:30px!important;border:0!important;border-radius:999px!important;display:grid!important;place-items:center!important;color:#fff!important;background:rgba(0,0,0,.56)!important;cursor:pointer!important}.sc-facebook-quick-save button:hover,.sc-facebook-quick-unsave:hover{background:rgba(0,0,0,.76)!important}.sc-facebook-quick-save button[data-state=saving],.sc-facebook-quick-unsave[data-state=unsaving]{opacity:.55!important;cursor:wait!important}.sc-facebook-quick-save button[data-state=saved] svg{fill:currentColor!important}.sc-facebook-quick-save svg,.sc-facebook-quick-unsave svg{width:17px!important;height:17px!important;fill:none!important;stroke:currentColor!important;stroke-width:2.2!important;stroke-linecap:round!important;stroke-linejoin:round!important}.sc-facebook-quick-unsave svg path{fill:currentColor!important}.sc-facebook-quick-unsave svg line{stroke:#fff!important;stroke-width:2.8!important}",document.documentElement.append(t)}const t=["actions for this post","more actions","post actions","tùy chọn cho bài viết","hành động khác","hành động"];document.querySelectorAll('[role="button"],[aria-label]').forEach(e=>{const n=(e.getAttribute("aria-label")||"").toLowerCase();if(!e.getClientRects().length||!t.some(t=>n.includes(t)))return;const o=null==e.parentElement?void 0:e.parentElement.parentElement;if(!o||o.querySelector(".sc-facebook-quick-save"))return;"static"===getComputedStyle(o).position&&(o.style.position="relative");const r=document.createElement("span");r.className="sc-facebook-quick-save";const a=document.createElement("button");a.type="button",a.title="Lưu nhanh bài viết",a.setAttribute("aria-label",a.title),a.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',r.append(a),o.append(r),a.addEventListener("click",t=>{if("saving"===a.dataset.state||"saved"===a.dataset.state)return;t.preventDefault(),t.stopPropagation(),a.dataset.state="saving",e.click();let n=0;const o=()=>{const t=Array.from(document.querySelectorAll('[role="menu"] [role="menuitem"],[role="dialog"] [role="menuitem"],[role="menu"] [role="button"],[role="dialog"] [role="button"]')).find(t=>{return t.getClientRects().length>0&&[t,...t.querySelectorAll("span")].some(t=>["save post","save reel","save video","lưu bài viết","lưu thước phim","lưu video"].includes((t.textContent||"").trim().replace(/\s+/g," ").toLowerCase()))});t?(t.click(),(()=>{let t=0;const e=()=>{const n=Array.from(document.querySelectorAll('h1,h2,h3,[role="heading"]')).find(t=>/^(save to|lưu vào)$/i.test((t.textContent||"").trim()))&&Array.from(document.querySelectorAll('button,[role="button"]')).find(t=>t.getClientRects().length>0&&/^(done|xong|hoàn tất)$/i.test((t.textContent||"").trim()));n?(n.click(),a.dataset.state="saved",a.title="Đã lưu bài viết"):++t<20?setTimeout(e,150):(a.dataset.state="error",a.title="Không hoàn tất được hộp Save To")};setTimeout(e,150)})()):++n<20?setTimeout(o,150):(a.dataset.state="error",a.title="Không tìm thấy mục Lưu")};setTimeout(o,250)},!0)})}(),/^\/saved(?:\/|$)/.test(location.pathname)&&document.querySelectorAll('[aria-label="More options for saved item"]').forEach(t=>{const e=t.parentElement?.parentElement,n=e?.parentElement;if(!n||n.querySelector(".sc-facebook-quick-unsave"))return;const o=document.createElement("button");o.type="button",o.className="sc-facebook-quick-unsave",o.title="Bỏ lưu nhanh",o.setAttribute("aria-label",o.title),o.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/><line x1="4" y1="4" x2="20" y2="20"/></svg>',n.insertBefore(o,e),o.addEventListener("click",e=>{if(e.preventDefault(),e.stopPropagation(),"unsaving"===o.dataset.state)return;o.dataset.state="unsaving",o.title="Đang bỏ lưu…",t.click();let n=0;const r=()=>{const e=Array.from(document.querySelectorAll('[role="menu"][aria-label="More options"]')).find(t=>t.getClientRects().length>0),a=e&&Array.from(e.querySelectorAll('[role="menuitem"]')).find(t=>/^(unsave|bỏ lưu)$/i.test((t.textContent||"").trim()));if(a&&"true"===t.getAttribute("aria-expanded")){a.click();let t=0;const e=()=>{o.isConnected&&(++t<30?setTimeout(e,150):(o.dataset.state="error",o.title="Chưa xác nhận được bỏ lưu — thử lại"))};setTimeout(e,150)}else++n<20?setTimeout(r,150):(o.dataset.state="error",o.title="Không tìm thấy mục Bỏ lưu — thử lại")};setTimeout(r,150)},!0)}),function(){const t=document.querySelector("#sc-facebook-story-dl");if(!/\/stories(?:\/|$)/.test(location.pathname)&&!/[?&](?:story_fbid|story_id)=/.test(location.search))return void(null==t||t.remove());r!==location.href&&(r=location.href,o.length=0);const e=t=>{const e=t.getBoundingClientRect();return e.width>=180&&e.height>=180&&e.right>0&&e.bottom>0&&e.left<innerWidth&&e.top<innerHeight},n=Array.from(document.querySelectorAll('[aria-label="Video player"]')).filter(e).sort((t,e)=>e.getBoundingClientRect().width*e.getBoundingClientRect().height-t.getBoundingClientRect().width*t.getBoundingClientRect().height)[0],a=(null==n?void 0:n.querySelector("video"))||Array.from(document.querySelectorAll("video")).filter(e).sort((t,e)=>e.getBoundingClientRect().width*e.getBoundingClientRect().height-t.getBoundingClientRect().width*t.getBoundingClientRect().height)[0],i=n||a?void 0:Array.from(document.querySelectorAll("img")).filter(t=>{const n=t.getBoundingClientRect();return e(t)&&n.width>=250&&n.height>=300&&n.left>.25*innerWidth&&!/profile picture|avatar/i.test(t.alt)}).sort((t,e)=>e.getBoundingClientRect().width*e.getBoundingClientRect().height-t.getBoundingClientRect().width*t.getBoundingClientRect().height)[0],s=n||a||i;if(!s&&!o.length)return;const l=null==s?void 0:s.getBoundingClientRect(),c=t||document.createElement("button");c.id="sc-facebook-story-dl",c.title=n||a||o.length?"Tải Facebook Story video":"Tải Facebook Story ảnh",c.setAttribute("aria-label",c.title),c.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11.17l3.59-3.58L17 12l-5 5-5-5 1.41-1.41L11 14.17V3h1ZM5 19h14v2H5v-2Z"/></svg>',c.style.left=`${Math.round(Math.max(8,l?l.right-48:innerWidth-58))}px`,c.style.top=`${Math.round(Math.max(8,l?l.top+10:84))}px`,c.onclick=async t=>{var e;t.preventDefault(),t.stopPropagation();const r=(null==n?void 0:n.querySelector("video"))||a,s=function(t){var e;if(!t)return;const n=new Set,o=[],r=t=>{const e=[{value:t,key:""}];let r=0;for(;e.length&&r++<8e3;){const{value:t,key:r}=e.pop();if("string"!=typeof t){if(t&&"object"==typeof t&&!n.has(t)){n.add(t);try{for(const[n,o]of Object.entries(t))e.push({value:o,key:n})}catch{}}}else if(/^https?:\/\//.test(t)&&/\.fbcdn\.net\//i.test(t)&&!/bytestart/i.test(t)){if(/image|thumbnail|preview|poster|cover/i.test(r))continue;const e=/playable_url_quality_hd|playable.*hd/i.test(r)?30:/playable|dash|manifest|video.*url/i.test(r)?20:/url|src/i.test(r)?10:0;e&&o.push({url:t,score:e})}}},a=Object.keys(t).find(t=>t.startsWith("__reactFiber$"));let i=a?t[a]:void 0;for(let t=0;i&&t<45;t++,i=i.return)r(i.memoizedProps),r(i.pendingProps);return null==(e=o.sort((t,e)=>e.score-t.score)[0])?void 0:e.url}(r)||function(t,e){var n,o;const r=unsafeWindow.__REACT_DEVTOOLS_GLOBAL_HOOK__;if(null==r||!r.renderers||null==r||!r.getFiberRoots)return;const a=[],i=new Set,s=t=>{const e=[{value:t,key:""}];let n=0;for(;e.length&&n++<3e3;){const{value:t,key:n}=e.pop();if("string"!=typeof t){if(t&&"object"==typeof t&&!i.has(t)){i.add(t);try{for(const[n,o]of Object.entries(t))e.push({value:o,key:n})}catch{}}}else if(/^https?:\/\//.test(t)&&/\.fbcdn\.net\//i.test(t)&&!/bytestart/i.test(t)){if(/image|thumbnail|preview|poster|cover/i.test(n))continue;const e=/playable_url_quality_hd|playable.*hd/i.test(n)?30:/playable|dash|manifest|video.*url/i.test(n)?20:/url|src/i.test(n)?10:0;e&&a.push({url:t,score:e})}}};try{for(const o of r.renderers.keys()){const a=r.getFiberRoots(o);for(const o of a){const r=[o.current||o],a=new Set;let i=0;for(;r.length&&i++<7e4;){const o=r.pop();if(!o||a.has(o))continue;a.add(o);const i=[o.child];let l,c=0;for(;i.length&&c++<300;){const t=i.pop();if(t){if(1===(null==(n=t.stateNode)?void 0:n.nodeType)){l=t.stateNode;break}t.child&&i.push(t.child),t.sibling&&i.push(t.sibling)}}!!l&&(!!t&&(l===t||l.contains(t)||t.contains(l))||!!e&&(l===e||l.contains(e)||e.contains(l)))&&(s(o.memoizedProps),s(o.pendingProps)),o.child&&r.push(o.child),o.sibling&&r.push(o.sibling)}}}}catch{}return null==(o=a.sort((t,e)=>e.score-t.score)[0])?void 0:o.url}(r,n),l=performance.getEntriesByType("resource").map(t=>t.name).reverse().find(t=>/\.fbcdn\.net\//i.test(t)&&(/\.(?:mp4|m3u8)(?:[?#]|$)/i.test(t)||/bytestart|video|dash|playlist/i.test(t))),d=(null==r?void 0:r.currentSrc)||(null==r?void 0:r.src)||s||o.at(-1)||l||(null==i?void 0:i.currentSrc)||(null==i?void 0:i.src);if(c.dataset.scStorySource=null!=r&&r.currentSrc||null!=r&&r.src?"video-element":s?"react-playable-url":o.length?"graphql-playable-url":l?"media-buffer":i?"image":"none",!d||!/^https?:\/\//.test(d))return void(c.title="Chưa lấy được link Story");const u=n||a||l||o.length?"mp4":(null==(e=d.match(/\.(jpe?g|png|webp)(?:[?#]|$)/i))?void 0:e[1])||"jpg";c.textContent="…";try{await async function(t,e){const n=await fetch(t);if(!n.ok)throw new Error(`Facebook trả ${n.status}`);const o=await n.blob();if(!o.size)throw new Error("Facebook trả file rỗng");const r=URL.createObjectURL(o),a=document.createElement("a");a.href=r,a.download=e,a.style.display="none",document.body.append(a),a.click(),a.remove(),setTimeout(()=>URL.revokeObjectURL(r),3e4)}(d,function(t,e){var n,o;const r=null==(n=location.pathname.match(/\/stories\/(\d+)/))?void 0:n[1],a=function(t){var e;if(!t)return;const n=t.getBoundingClientRect(),o=new Set(["stories","profile.php","l.php","watch","reel","home.php","groups","marketplace","gaming"]);return null==(e=Array.from(document.querySelectorAll("a[href]")).flatMap(t=>{var e;try{const r=new URL(t.href),a=r.hostname.endsWith("facebook.com")?null==(e=r.pathname.match(/^\/([^/?]+)/))?void 0:e[1]:void 0,i=t.getBoundingClientRect();return!a||o.has(a)||i.width<1||i.height<1?[]:[{username:a,distance:Math.abs(i.top+i.height/2-(n.top+42))+.15*Math.abs(i.left-n.left)}]}catch{return[]}}).sort((t,e)=>t.distance-e.distance)[0])?void 0:e.username}(e)||r||"unknown",i=new URLSearchParams(location.search).get("story_fbid")||new URLSearchParams(location.search).get("story_id"),s=location.pathname.split("/").filter(Boolean).at(-1);let l;if(s&&!i)try{l=null==(o=atob(s).match(/\d{6,}/))?void 0:o[0]}catch{}return`${a}_${i||l||"media"}.${t}`}(u,n)),c.textContent="✓",setTimeout(()=>{c.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11.17l3.59-3.58L17 12l-5 5-5-5 1.41-1.41L11 14.17V3h1ZM5 19h14v2H5v-2Z"/></svg>'},1e3)}catch(t){c.textContent="×",c.title=`Không tải được Story: ${t instanceof Error?t.message:String(t)}`}},t||document.body.append(c)}()),"instagram"===t&&location.pathname.includes("/saved/all-posts/")&&document.querySelectorAll('main a[href*="/p/"]').forEach(t=>{if(t.querySelector(".sc-unsave-btn"))return;const e=document.createElement("button");e.className="sc-unsave-btn",e.textContent="✕ UNSAVE",e.onclick=e=>{e.preventDefault(),e.stopPropagation(),t.click(),setTimeout(()=>{var e;const n=document.querySelector('svg[aria-label="Remove"]');null==(e=null==n?void 0:n.closest('button,[role="button"]'))||e.click(),setTimeout(()=>{var e,n;null==(n=null==(e=document.querySelector('svg[aria-label="Close"]'))?void 0:e.closest('button,[role="button"]'))||n.click(),t.remove()},500)},120)},"static"===getComputedStyle(t).position&&(t.style.position="relative"),t.append(e)}),"threads"===t&&(function(){const t=location.pathname.includes("/saved");document.querySelectorAll('svg[aria-label="More"],svg[title="More"],[aria-label*="Tùy chọn"],[aria-label*="Hành động"],[aria-label="More actions"],[aria-label="Actions"]').forEach(e=>{var n;if(e.closest('header,nav,[role="banner"],[role="navigation"]'))return;let o=null;for(let t=e,n=0;t&&n<=5&&!o;t=t.parentElement,n+=1)t.querySelector('a[href*="/post/"],a[href*="/p/"]')&&(o=t);if(!o||/\bviews?/i.test(o.textContent||""))return;const r=null==(n=e.closest('[role="button"]')||e.parentElement)?void 0:n.parentElement;if(!r||r.querySelector(".sc-threads-save-container"))return;const a=r.querySelectorAll("svg").length,i=document.createElement("div");i.className="sc-threads-save-container",i.style.cssText=`position:absolute!important;right:${a>1?"72px":"40px"};top:-10px;z-index:100;display:flex;align-items:center;justify-content:center;width:32px;height:32px;`;const s=document.createElement("button");s.className="sc-threads-save-btn",s.title=t?"Bỏ lưu nhanh":"Lưu nhanh",s.innerHTML=t?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',s.onclick=n=>{n.preventDefault(),n.stopPropagation(),s.classList.add("loading"),(e.closest('[role="button"]')||e.closest("button")||e).click();let o=0;const r=()=>{const e=Array.from(document.querySelectorAll('[role="menu"]')).find(t=>!!t.offsetParent)||null;e&&function(t,e=[],n=document){for(const o of Array.from(n.querySelectorAll("div,span,button,a"))){const n=(o.textContent||"").trim().toLowerCase();if(n&&!(n.length>35)&&o.offsetParent&&t.some(t=>n.includes(t))&&!e.some(t=>n.includes(t))&&!Array.from(o.children).some(e=>t.some(t=>(e.textContent||"").toLowerCase().includes(t))))return(o.closest('[role="menuitem"],button,[role="button"]')||o).click(),!0}return!1}(t?["unsave","bỏ lưu"]:["save","lưu"],["xem","view","undo","hoàn tác","mục đã lưu","saved items"],e)?(s.classList.remove("loading"),s.classList.add("success")):++o<15?setTimeout(r,300):(s.classList.remove("loading"),s.classList.add("error"))};setTimeout(r,600)},"static"===getComputedStyle(r).position&&(r.style.position="relative"),i.append(s),r.append(i)})}(),document.querySelectorAll('img, div[aria-label="Video player"]').forEach(t=>{if(t.hasAttribute("data-sc-dl"))return;const e=t instanceof HTMLImageElement?t:null;if(e){if(function(t){if(t.closest('div[aria-label="Video player"]'))return!0;const e=t.getBoundingClientRect();if(e.width<1||e.height<1)return!1;for(let n=t.parentElement,o=0;n&&o<15;n=n.parentElement,o+=1)if(Array.from(n.querySelectorAll('div[aria-label="Video player"]')).some(t=>{const n=t.getBoundingClientRect();return!(n.width<120||n.height<120)&&Math.max(0,Math.min(e.right,n.right)-Math.max(e.left,n.left))*Math.max(0,Math.min(e.bottom,n.bottom)-Math.max(e.top,n.top))/Math.min(e.width*e.height,n.width*n.height)>.7}))return!0;return!1}(e))return;let t=e.parentElement;for(let e=0;t&&e<4;t=t.parentElement,e+=1)if(t.querySelector('div[aria-label="Video player"],video'))return;const n=e.getBoundingClientRect(),o=e.alt.toLowerCase();if(n.width<120||n.height<120||/profile picture|avatar/.test(o))return}else{const e=t.getBoundingClientRect();if(e.width<120||e.height<120)return}t.setAttribute("data-sc-dl","1");const n=t.closest('button,a,[role="button"]'),o=(null==n?void 0:n.parentElement)||(null==e?void 0:e.parentElement)||t;if(!o)return;o.classList.add("sc-dl-container"),"static"===getComputedStyle(o).position&&(o.style.position="relative");const r=document.createElement("button");r.type="button",r.className=e?"sc-thread-btn":"sc-thread-btn sc-thread-video-btn",r.innerHTML=e?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 3h2v10.17l3.59-3.58L18 11l-6 6-6-6 1.41-1.41L11 13.17V3zm-6 16h14v2H5v-2z"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7L8 5zm9 14h2v2h-2v-2z"/></svg>',r.title=e?"Tải ảnh":"Tải video";const l=function(t){var e;let n=t;for(let t=0;t<30&&n;t+=1,n=n.parentElement){const t=Array.from(n.querySelectorAll('a[href*="/@"]')).find(t=>{var e;const n=(null==(e=t.textContent)?void 0:e.trim())||"";return 0===n.length||!n.startsWith("@")}),o=null==(e=null==t?void 0:t.href.match(/@([^/?#]+)/))?void 0:e[1];if(o)return o}return"threads"}(t),u=t=>{t.stopPropagation()};r.addEventListener("pointerdown",u,!0),r.addEventListener("mousedown",u,!0),r.addEventListener("mouseup",u,!0);let p=!1;const g=async()=>{if(!p){p=!0,r.textContent="…";try{if(e){const t=new URL(e.src).pathname.split("/").pop()||"image.jpg";await f(e.src,`threads_${l}_${t}`)}else{const e=t.closest("article,[data-pressable-container]")||document.body,n=function(t){var e,n,o;let r=t;for(let t=0;t<15&&r;t+=1,r=r.parentElement){const t=null==(e=r.querySelector('a[href*="/post/"],a[href*="/p/"]'))?void 0:e.href,o=null==(n=null==t?void 0:t.match(/\/(?:post|p)\/([^/?#]+)/))?void 0:n[1];if(o)return h(o)}const a=null==(o=location.pathname.match(/\/(?:post|p)\/([^/?#]+)/))?void 0:o[1];return a?h(a):null}(t);if(!n)throw new Error("Không tìm được mã bài Threads.");const o=await m(n),r=Array.from(e.querySelectorAll('div[aria-label="Video player"]')).indexOf(t),a=o.filter(t=>"video"===t.kind)[Math.max(0,r)],i=(null==a?void 0:a.url)||function(t){const e=[...Array.from(t.querySelectorAll("video")).flatMap(t=>[t.currentSrc,t.src]),...Array.from(t.querySelectorAll("source[src]")).map(t=>t.src)].find(t=>/^https?:\/\//.test(t));if(e)return e;try{return performance.getEntriesByType("resource").map(t=>t.name).reverse().find(t=>/^https:\/\/.+\.(?:mp4|m3u8)(?:[?#].*)?$/i.test(t)||/cdninstagram|fbcdn/i.test(t)&&/video|dash|playlist/i.test(t))||null}catch{return null}}(t);if(!i)throw new Error("Không thấy stream video. Hãy phát video khoảng một giây rồi bấm lại.");await f(i,`threads_${l}_${(null==a?void 0:a.id)||n}.mp4`)}r.textContent="✓"}catch(t){console.warn("[Social All-in-One]",t),r.textContent="×",r.title=`Lỗi tải: ${t instanceof Error?t.message:String(t)}`}finally{p=!1}}},b={button:r,download:g};i.set(o,b),n&&i.set(n,b),r.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation(),t.stopImmediatePropagation(),g()},!0),e?(r.style.setProperty("position","fixed","important"),r.style.setProperty("right","auto","important"),r.style.setProperty("z-index","2147483647","important"),document.body.append(r),s.set(r,e),d||(d=!0,document.addEventListener("pointerdown",()=>v(),!0),document.addEventListener("scroll",()=>v(),!0),window.addEventListener("resize",()=>v())),v()):o.append(r),a.set(r,g),function(){if(c)return;c=!0;const t=(t,e)=>{if(0!==t.button||t.target instanceof Element&&t.target.closest(".sc-thread-btn"))return;const n=t.composedPath().find(t=>t instanceof HTMLElement&&i.has(t)),o=n&&i.get(n),r=null==o?void 0:o.button.getBoundingClientRect(),s=!!r&&t.clientX>=r.left&&t.clientX<=r.right&&t.clientY>=r.top&&t.clientY<=r.bottom;if(o&&s)return t.preventDefault(),t.stopImmediatePropagation(),t.stopPropagation(),void(e&&o.download());const l=document.elementsFromPoint(t.clientX,t.clientY).map(t=>t.closest(".sc-thread-btn")).find(t=>!!t&&a.has(t)),c=[];for(const e of a.keys()){if(!e.isConnected){a.delete(e);continue}const n=e.getBoundingClientRect();t.clientX>=n.left&&t.clientX<=n.right&&t.clientY>=n.top&&t.clientY<=n.bottom&&c.push(e)}const d=1===c.length?c[0]:void 0,u=(l||d)&&a.get(l||d);u&&(t.preventDefault(),t.stopImmediatePropagation(),t.stopPropagation(),e&&u())};document.addEventListener("pointerdown",e=>t(e,!0),!0),document.addEventListener("click",e=>t(e,!1),!0)}()}))}!function t(){if(function(){if("threads"!==u())return;const t=unsafeWindow;if(t.__scThreadsHeaderHook)return;t.__scThreadsHeaderHook=!0;const e=t.fetch.bind(t);t.fetch=async(t,o)=>{const r="string"==typeof t?t:t instanceof URL?t.href:t.url;if(/threads\.(?:com|net)\/graphql\//.test(r)){const e=new Headers((null==o?void 0:o.headers)||(t instanceof Request?t.headers:void 0));for(const t of["x-fb-lsd","x-asbd-id","x-ig-app-id","x-csrftoken"]){const o=e.get(t);o&&(n[t]=o)}}return e(t,o)};const o=t.XMLHttpRequest,r=o.prototype.open,a=o.prototype.setRequestHeader;o.prototype.open=function(t,e,...n){return this.__scThreadsGraphql=/threads\.(?:com|net)\/graphql\//.test(String(e)),r.call(this,t,e,...n)},o.prototype.setRequestHeader=function(t,e){if(this.__scThreadsGraphql){const o=t.toLowerCase();["x-fb-lsd","x-asbd-id","x-ig-app-id","x-csrftoken"].includes(o)&&e&&(n[o]=e)}return a.call(this,t,e)}}(),function(){if("facebook"!==u())return;const t=unsafeWindow;if(t.__scFacebookStoryHook)return;t.__scFacebookStoryHook=!0;const e=(t,e=!1)=>{!/^(https?:)?\/\//.test(t)||!/\.fbcdn\.net\//i.test(t)||!e&&!/video|bytestart|\.mp4(?:[?#]|$)|\.m3u8(?:[?#]|$)/i.test(t)||(o.includes(t)||o.push(t),o.length>20&&o.splice(0,o.length-20))},n=t=>{try{const n=["string"==typeof t?JSON.parse(t):t];let o=0;for(;n.length&&o++<2e4;){const t=n.pop();if(Array.isArray(t))n.push(...t);else if(t&&"object"==typeof t)for(const[o,r]of Object.entries(t))"string"==typeof r&&/(?:playable|video|dash|manifest).*url/i.test(o)?e(r,!0):r&&"object"==typeof r&&n.push(r)}}catch{}},r=t.fetch.bind(t);t.fetch=async(t,o)=>{const a="string"==typeof t?t:t instanceof URL?t.href:t.url;e(a);const i=await r(t,o);return i.clone().text().then(n).catch(()=>{}),i};const a=t.XMLHttpRequest,i=a.prototype.open;a.prototype.open=function(t,o,...r){return e(String(o)),this.addEventListener("loadend",()=>{try{n(this.response||this.responseText)}catch{}},{once:!0}),i.call(this,t,o,...r)}}(),!document.body)return void document.addEventListener("DOMContentLoaded",t,{once:!0});let e;GM_addStyle("\n    #sc-launcher{position:fixed;right:18px;bottom:18px;z-index:2147483646;border:0;border-radius:50%;width:46px;height:46px;background:#635bff;color:#fff;font-size:22px;cursor:pointer;box-shadow:0 6px 24px #0006}\n    #sc-panel{position:fixed;right:18px;bottom:74px;z-index:2147483646;width:350px;max-height:75vh;overflow:auto;background:#111827;color:#e5e7eb;border:1px solid #374151;border-radius:12px;padding:14px;font:13px system-ui,sans-serif;box-shadow:0 16px 40px #0009}\n    #sc-panel[hidden]{display:none}.sc-row{display:flex;gap:8px;margin:8px 0}.sc-row>*{min-width:0}.sc-input{flex:1;padding:8px;border:1px solid #4b5563;border-radius:7px;background:#1f2937;color:#fff}.sc-btn{padding:8px 10px;border:0;border-radius:7px;background:#635bff;color:#fff;cursor:pointer}.sc-btn.alt{background:#374151}.sc-btn.danger{background:#be123c}.sc-muted{color:#9ca3af;margin:6px 0}.sc-status{white-space:pre-wrap;max-height:160px;overflow:auto;padding:8px;background:#0b1220;border-radius:7px}.sc-unsave-btn{z-index:2147483645!important;cursor:pointer!important;border:0!important;color:#fff!important;background:#be123c!important;border-radius:999px!important;line-height:1!important}.sc-unsave-btn{position:absolute!important;right:6px!important;top:6px!important;padding:6px!important;font-size:10px!important}.sc-save-btn-small{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;background:rgba(99,102,241,.1);color:#6366f1;border:1px solid rgba(99,102,241,.2);border-radius:50%;cursor:pointer;transition:all .2s ease}.sc-save-btn-small:hover{background:rgba(99,102,241,.2);transform:scale(1.1)}.sc-threads-save-btn{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;background:rgba(0,0,0,.5);color:rgba(255,255,255,.9);border:1px solid rgba(255,255,255,.4);border-radius:50%;cursor:pointer;backdrop-filter:blur(4px);transition:all .2s cubic-bezier(.175,.885,.32,1.275)}.sc-threads-save-btn:hover{background:rgba(0,0,0,.8);transform:scale(1.1);border-color:#fff;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.5)}.loading{animation:sc-pulse 1s infinite ease-in-out}.success{animation:sc-pop .4s forwards}.sc-threads-save-btn.success svg,.sc-save-btn-small.success svg{fill:currentColor!important;stroke:none!important}@keyframes sc-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.1);opacity:.7}}@keyframes sc-pop{0%{transform:scale(1)}50%{transform:scale(1.4)}100%{transform:scale(1.1)}}.sc-dl-container:hover .sc-thread-btn{opacity:1!important}.sc-thread-btn{position:absolute!important;right:10px!important;top:10px!important;z-index:2147483645!important;display:flex!important;align-items:center!important;justify-content:center!important;width:32px!important;height:32px!important;padding:0!important;border:1.5px solid rgba(255,255,255,.52)!important;border-radius:50%!important;background:rgba(0,0,0,.62)!important;color:rgba(255,255,255,.94)!important;backdrop-filter:blur(8px)!important;box-shadow:0 3px 12px rgba(0,0,0,.35)!important;opacity:.88!important;pointer-events:auto!important;cursor:pointer!important;transition:opacity .2s ease,transform .22s cubic-bezier(.175,.885,.32,1.275),background .2s ease!important}.sc-thread-btn:hover{background:rgba(0,0,0,.86)!important;transform:scale(1.12)!important;border-color:#fff!important}.sc-thread-btn svg{width:18px!important;height:18px!important;fill:currentColor!important}.sc-thread-video-btn{left:10px!important;right:auto!important;top:10px!important;bottom:auto!important;background:rgba(124,58,237,.82)!important;border-color:rgba(221,214,254,.9)!important}.sc-thread-video-btn:hover{background:rgba(109,40,217,.98)!important}#sc-facebook-story-dl{position:fixed;z-index:2147483647;display:flex;align-items:center;justify-content:center;width:38px;height:38px;padding:0;border:1.5px solid rgba(255,255,255,.8);border-radius:50%;background:rgba(37,99,235,.9);color:#fff;box-shadow:0 3px 12px rgba(0,0,0,.45);cursor:pointer;backdrop-filter:blur(8px)}#sc-facebook-story-dl:hover{background:rgba(29,78,216,1);transform:scale(1.1)}#sc-facebook-story-dl svg{width:19px;height:19px;fill:currentColor}\n  "),_(),w(),new MutationObserver(()=>{clearTimeout(e),e=window.setTimeout(w,500)}).observe(document.body,{childList:!0,subtree:!0}),console.info("[Social All-in-One] active:",u())}()}();
// Instagram feed/post/reel download, A/D carousel and S download hotkeys.
// Ported from D:/AgentWorks/ig-download (minimal/content.js, see its
// ARCHITECTURE.md); stories are handled by the module below.
location.hostname.includes('instagram.com') && (() => {
  const CLASS = 'ig-minimal-download';
  const LIKE = 'M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z';
  const ICON = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M19 9h-4V3H9v6H5l7 7 7-7Zm-14 9v2h14v-2H5Z"/></svg>';
  const mediaIdCache = new Map();
  const mediaInfoCache = new Map();

  const parentAt = (node, levels) => {
    let result = node;
    while (levels-- && result) result = result.parentElement;
    return result;
  };

  function unlockImageMenus() {
    document.querySelectorAll('article img, main img').forEach((image) => {
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
    return null;
  }

  function shortcodeFrom(article) {
    const pageMatch = location.pathname.match(/\/(?:p|reel|reels)\/([^/]+)/);
    if (pageMatch) return { code: pageMatch[1], route: location.pathname.includes('/p/') ? 'p' : 'reel' };
    for (const link of article?.querySelectorAll?.('a[href]') || []) {
      const match = link.getAttribute('href')?.match(/^\/(p|reel)\/([^/]+)/);
      if (match) return { code: match[2], route: match[1] };
    }
    return null;
  }

  // Instagram shortcodes are base64url-encoded numeric media IDs. This avoids
  // relying solely on the HTML marker that Instagram frequently changes.
  function mediaIdFromShortcode(shortcode) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let id = 0n;
    for (const character of shortcode) {
      const value = alphabet.indexOf(character);
      if (value < 0) return null;
      id = id * 64n + BigInt(value);
    }
    return id.toString();
  }

  async function findMediaId(code, route) {
    const key = `${route}:${code}`;
    if (!mediaIdCache.has(key)) {
      const postUrl = `https://www.instagram.com/${route}/${code}/`;
      const response = await fetch(postUrl);
      const html = await response.text();
      const match = html.match(/instagram:\/\/media\?id=(\d+)|["' ]media_id["' ]:["' ](\d+)/);
      const mediaId = match?.[1] || match?.[2] || mediaIdFromShortcode(code);
      if (!mediaId) return null;
      mediaIdCache.set(key, mediaId);
    }
    return mediaIdCache.get(key);
  }

  async function mediaInfo(id) {
    if (mediaInfoCache.has(id)) return mediaInfoCache.get(id);
    const appId = findAppId();
    if (!appId) throw new Error('Could not find Instagram app id');
    const apiUrl = `https://i.instagram.com/api/v1/media/${id}/info/`;
    const headers = { Accept: '*/*', 'X-IG-App-ID': appId };
    let payload;
    // A content script has host permissions, while a userscript does not.
    // Let Tampermonkey make this cross-origin API request when it is available.
    if (typeof GM_xmlhttpRequest === 'function') {
      payload = await new Promise((resolve, reject) => {
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
    } else {
      const response = await fetch(apiUrl, { credentials: 'include', headers });
      if (!response.ok) throw new Error(`Instagram API: ${response.status}`);
      payload = await response.json();
    }
    const item = payload.items?.[0];
    if (!item) throw new Error('Instagram returned no media');
    mediaInfoCache.set(id, item);
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
      username: item.owner?.username || parent?.owner?.username || parent?.user?.username || 'instagram',
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

  function makeFilename(media) {
    const username = String(media.username).replace(/[\\/:*?"<>|]/g, '_');
    let sourceName = String(media.sourceName || filenameFromUrl(media.url) || media.id).replace(/[\\/:*?"<>|]/g, '_');
    if (!/\.[a-z0-9]{2,5}$/i.test(sourceName)) sourceName += media.type === 'video' ? '.mp4' : '.jpg';
    return `${username}_${sourceName}`;
  }

  async function save(media) {
    const name = makeFilename(media);
    // This mirrors the pre-cleanup extension: obtain the media bytes, then
    // download a Blob URL so `anchor.download` is the filename authority.
    // Tampermonkey's XHR supplies the cross-origin access formerly provided by
    // the extension's host permissions.
    const blob = typeof GM_xmlhttpRequest === 'function'
      ? await new Promise((resolve, reject) => {
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
      })
      : await (async () => {
        const response = await fetch(media.url, { headers: new Headers({ Origin: location.origin }), mode: 'cors' });
        if (!response.ok) throw new Error(`Media request: ${response.status}`);
        return response.blob();
      })();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = name;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  async function download(kind, article, button) {
    const media = await resolvePostOrReel(article);
    await save(media);
  }

  function setButtonState(button, state) {
    const colors = { idle: !isFeedPage() || button.dataset.hotkeyTarget === 'true' ? '#0095f6' : '#fff', loading: '#f59e0b', done: '#22a06b', failed: '#ed4956' };
    button.style.backgroundColor = 'transparent';
    button.style.color = colors[state];
    button.style.transform = state === 'loading' ? 'scale(.92)' : 'scale(1)';
    button.title = state === 'loading' ? 'Downloading…' : state === 'done' ? 'Downloaded' : state === 'failed' ? 'Download failed' : `Download ${button.dataset.kind}`;
  }

  async function startDownload(button) {
    if (!button || button.dataset.busy) return;
    button.dataset.busy = '1';
    setButtonState(button, 'loading');
    try {
      // Do not retain a custom DOM object on the button: Tampermonkey crosses
      // an isolated-world boundary for such properties. Resolve it at click time.
      const article = button.closest('article') || document.querySelector('article') || document;
      await download(button.dataset.kind, article, button);
      setButtonState(button, 'done');
    } catch (error) {
      setButtonState(button, 'failed');
      button.title = `Download failed: ${error.message}`;
      console.error('[IG downloader]', error);
    } finally {
      button.dataset.busy = '';
      setTimeout(() => setButtonState(button, 'idle'), 1800);
    }
  }

  function nearestVisibleButton() {
    const viewportCenter = window.innerHeight / 2;
    const candidates = [...document.querySelectorAll(`.${CLASS}`)].filter((button) => {
      const rect = button.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
    });
    candidates.sort((left, right) => {
      const leftCenter = left.getBoundingClientRect().top + left.getBoundingClientRect().height / 2;
      const rightCenter = right.getBoundingClientRect().top + right.getBoundingClientRect().height / 2;
      return Math.abs(leftCenter - viewportCenter) - Math.abs(rightCenter - viewportCenter);
    });
    return candidates[0] || null;
  }

  function isFeedPage() {
    return location.pathname === '/' || location.pathname === '/feed/';
  }

  function refreshHotkeyIndicator() {
    if (!isFeedPage()) return;
    const target = nearestVisibleButton();
    document.querySelectorAll(`.${CLASS}`).forEach((button) => {
      const isTarget = button === target;
      button.dataset.hotkeyTarget = String(isTarget);
      if (!button.dataset.busy) button.style.color = isTarget ? '#0095f6' : '#fff';
    });
  }

  function isTypingTarget(target) {
    return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
  }

  // A/D carousel navigation. This keeps the supplied userscript's selection
  // rules isolated from the downloader so it cannot affect media resolution.
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

  function clickCarouselControl(side) {
    const isNext = side === 'right';
    const semanticSelector = isNext
      ? 'button[aria-label="Next"]'
      : 'button[aria-label="Previous"], button[aria-label="Prev"]';
    let button = pickCarouselControl([...document.querySelectorAll(semanticSelector)], side);
    if (!button) {
      const label = isNext ? 'next' : 'previous';
      const candidates = [...document.querySelectorAll('button')].filter((element) => {
        const aria = (element.getAttribute('aria-label') || '').toLowerCase();
        const title = (element.getAttribute('title') || '').toLowerCase();
        if (isNext) return aria.includes(label) || title.includes(label);
        return !(aria.includes('next') || title.includes('next'));
      });
      button = pickCarouselControl(candidates, side);
    }
    if (!button && !isNext) button = document.querySelector('button._afxv._al46._al47');
    if (!button) return false;
    button.click();
    return true;
  }

  function interceptCarouselHotkeys(event) {
    if (event.ctrlKey || event.altKey || event.metaKey || event.repeat || isTypingTarget(event.target)) return;
    const key = event.key.toLowerCase();
    const side = key === 'a' ? 'left' : key === 'd' ? 'right' : null;
    if (!side || !clickCarouselControl(side)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function addButton(container, kind, article) {
    if (!(container instanceof HTMLElement) || container.querySelector(`.${CLASS}[data-kind="${kind}"]`)) return;
    const button = document.createElement('a');
    button.className = CLASS;
    button.dataset.kind = kind;
    button.innerHTML = ICON;
    button.title = `Download ${kind}`;
    button.setAttribute('style', 'cursor:pointer;padding:7px;color:#0095f6;background:transparent;border-radius:8px;position:relative;display:inline-flex;z-index:999;line-height:0;transition:color .18s ease,transform .18s ease');
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await startDownload(button);
    });
    container.append(button);
  }

  function scanPosts() {
    document.querySelectorAll('article').forEach((article) => {
      const like = article.querySelector(`path[d="${LIKE}"]`);
      if (like) addButton(parentAt(like, 7), 'post', article);
    });
    if (location.pathname.match(/\/(?:p|reel)\//)) {
      const reply = document.querySelector('path[d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"]');
      const container = document.querySelector('div[role="presentation"] section') || parentAt(reply, 5);
      if (container) addButton(container, 'post', document.querySelector('article') || document);
    }
  }

  function scanReels() {
    if (!location.pathname.startsWith('/reels/')) return;
    document.querySelectorAll(`path[d="${LIKE}"]`).forEach((like) => {
      const scope = parentAt(like, 8) || document;
      addButton(parentAt(like, 8), 'reel', scope);
    });
  }

  function scan() {
    unlockImageMenus();
    scanPosts();
    scanReels();
    refreshHotkeyIndicator();
  }

  function interceptDownloadHotkey(event) {
    if (event.key.toLowerCase() !== 's' || event.ctrlKey || event.altKey || event.metaKey || event.repeat || isTypingTarget(event.target)) return;
    const button = nearestVisibleButton();
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    // Start once on keydown, but also suppress the matching keypress/keyup:
    // Instagram may bind its Save action to a different keyboard event.
    if (event.type === 'keydown') startDownload(button);
  }

  ['keydown', 'keypress', 'keyup'].forEach((type) => {
    window.addEventListener(type, interceptDownloadHotkey, true);
  });
  window.addEventListener('keydown', interceptCarouselHotkeys, true);

  window.addEventListener('scroll', refreshHotkeyIndicator, { passive: true });
  window.addEventListener('resize', refreshHotkeyIndicator, { passive: true });


  setInterval(scan, 1200);
  scan();
})();
// Instagram story download (floating button + S hotkey) and grid tile download.
// Feed, post and reel downloads come from the ig-download module above.
!(function () {
  "use strict";
  if (!location.hostname.includes("instagram.com")) return;

  const APP_ID = "936619743392459";
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const CODE_RE = /\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/;
  const ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a1 1 0 0 1 1 1v9.59l3.3-3.3a1 1 0 1 1 1.4 1.42l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 1 1 1.4-1.42l3.3 3.3V4a1 1 0 0 1 1-1zM5 19h14a1 1 0 1 1 0 2H5a1 1 0 1 1 0-2z"/></svg>';

  const shortcodeToPk = (code) => {
    let pk = 0n;
    for (const ch of code.slice(0, 11)) pk = pk * 64n + BigInt(ALPHABET.indexOf(ch));
    return pk.toString();
  };
  const csrf = () => (document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/) || [])[1] || "";

  async function api(path) {
    const res = await unsafeWindow.fetch(`https://www.instagram.com/api/v1${path}`, {
      credentials: "include",
      headers: {
        "X-IG-App-ID": APP_ID,
        "X-CSRFToken": csrf(),
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new Error(`Instagram trả ${res.status}`);
    return res.json();
  }

  const largest = (list) =>
    list && list.length
      ? list.reduce((a, b) => ((b.width || 0) * (b.height || 0) > (a.width || 0) * (a.height || 0) ? b : a)).url
      : null;
  const mediaUrl = (item) =>
    largest(item.video_versions) || largest(item.image_versions2 && item.image_versions2.candidates);
  const fileKey = (url) => {
    try {
      return new URL(url, location.href).pathname.split("/").pop();
    } catch {
      return "";
    }
  };
  const extOf = (url) => {
    const m = fileKey(url).match(/\.(mp4|jpe?g|png|webp|heic)$/i);
    return m ? m[1].toLowerCase().replace("jpeg", "jpg") : /\.mp4|video/i.test(url) ? "mp4" : "jpg";
  };

  // Fetch the bytes and download a Blob URL so `a.download` sets the name
  // (GM_download may ignore it; see ig-download ARCHITECTURE.md).
  async function fetchBlob(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      return await res.blob();
    } catch {
      return new Promise((resolve, reject) =>
        GM_xmlhttpRequest({
          method: "GET",
          url,
          responseType: "blob",
          onload: (r) => (r.status >= 200 && r.status < 300 ? resolve(r.response) : reject(new Error(`Media ${r.status}`))),
          onerror: () => reject(new Error("Không tải được media.")),
        }),
      );
    }
  }
  async function save(url, name) {
    const blobUrl = URL.createObjectURL(await fetchBlob(url));
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = name;
    a.style.display = "none";
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 3e4);
  }

  // File name: <user>_<original CDN file name>.
  async function saveItems(urls, user) {
    if (!urls.length) throw new Error("Không tìm thấy media.");
    for (const url of urls) {
      const base = fileKey(url) || String(Date.now());
      await save(url, `${user || "unknown"}_${/\.[a-z0-9]{2,4}$/i.test(base) ? base : `${base}.${extOf(url)}`}`);
    }
  }

  // ---- React fiber helpers (the save-story extension's approach) ----
  function fiberVideoUrl(el) {
    const keys = ["video_url", "playbackUrl", "progressiveUrl", "hdSrc", "hd_src", "sdSrc", "sd_src"];
    const isVideo = (v) => typeof v === "string" && v.startsWith("https://") && /\.mp4|\/o1\/v\//.test(v);
    const seen = new WeakSet();
    const walk = (obj, depth) => {
      if (!obj || typeof obj !== "object" || depth > 6 || seen.has(obj)) return null;
      seen.add(obj);
      for (const k of keys) if (isVideo(obj[k])) return obj[k];
      for (const v of Object.values(obj)) {
        if (isVideo(v)) return v;
        if (v && typeof v === "object") {
          const found = walk(v, depth + 1);
          if (found) return found;
        }
      }
      return null;
    };
    const fiberKey = Object.keys(el).find((k) => k.startsWith("__reactFiber"));
    let fiber = fiberKey && el[fiberKey];
    for (let i = 0; fiber && i < 30; i++, fiber = fiber.return) {
      const found = walk(fiber.memoizedProps, 0);
      if (found) return found;
    }
    return null;
  }
  // The URL only carries the media id after the viewer advances once (opening
  // from a profile gives /stories/<user>/), but the fiber props always hold it.
  function fiberMediaPk(el) {
    const fiberKey = Object.keys(el).find((k) => k.startsWith("__reactFiber"));
    let fiber = fiberKey && el[fiberKey];
    for (let i = 0; fiber && i < 30; i++, fiber = fiber.return) {
      const media = fiber.memoizedProps && fiber.memoizedProps.media;
      const pk = media && String(media.pk || media.id || "").split("_")[0];
      if (pk && /^\d+$/.test(pk)) return pk;
    }
    return null;
  }

  // ---- Stories ----
  // The story viewer is an overlay: the page underneath (e.g. a profile grid)
  // stays in the DOM, so pick the story media by size instead of by container.
  function storyMediaEl() {
    const area = (el) => el.getBoundingClientRect().width * el.getBoundingClientRect().height;
    return [...document.querySelectorAll("img,video")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.height >= innerHeight * 0.5 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
      })
      .sort((a, b) => area(b) - area(a))[0];
  }
  async function downloadStory() {
    const m = location.pathname.match(/^\/stories\/([^/]+)\/(\d+)?/);
    if (!m) throw new Error("Không phải trang story.");
    const isHighlight = m[1] === "highlights";
    const user = isHighlight ? "highlight" : m[1];
    const hl = location.pathname.match(/^\/stories\/highlights\/\d+\/(\d+)/);
    const el = storyMediaEl();
    const pk = (el && fiberMediaPk(el)) || (isHighlight ? hl && hl[1] : m[2]);
    if (pk) {
      try {
        const info = await api(`/media/${pk}/info/`);
        const item = info.items && info.items[0];
        const url = item && mediaUrl(item);
        if (url) return saveItems([url], (item.user && item.user.username) || user);
      } catch (e) {
        console.warn("[Social All-in-One] story media/info:", e);
      }
    }
    const url = el && (el.tagName === "VIDEO" ? fiberVideoUrl(el) : el.currentSrc || el.src);
    if (!url || url.startsWith("blob:")) throw new Error("Không lấy được link story.");
    return saveItems([url], user);
  }

  // ---- Grid tiles: the whole post (every carousel item) ----
  async function downloadPost(code) {
    const info = await api(`/media/${shortcodeToPk(code)}/info/`);
    const item = info.items && info.items[0];
    if (!item) throw new Error("API không trả media.");
    const slides = item.carousel_media && item.carousel_media.length ? item.carousel_media : [item];
    return saveItems(slides.map(mediaUrl).filter(Boolean), item.user && item.user.username);
  }

  // ---- UI ----
  GM_addStyle(
    ".sc-ig-dl{position:absolute!important;left:8px!important;top:8px!important;z-index:2147483645!important;display:flex!important;align-items:center!important;justify-content:center!important;width:32px!important;height:32px!important;padding:0!important;border:1.5px solid rgba(255,255,255,.55)!important;border-radius:50%!important;background:rgba(0,0,0,.62)!important;color:#fff!important;cursor:pointer!important;backdrop-filter:blur(8px)!important;box-shadow:0 3px 12px rgba(0,0,0,.35)!important}.sc-ig-dl:hover{background:rgba(0,0,0,.86)!important;transform:scale(1.1)!important}.sc-ig-dl svg,#sc-ig-page-dl svg{width:18px;height:18px;fill:currentColor}.sc-ig-dl[data-state=busy],#sc-ig-page-dl[data-state=busy]{opacity:.55!important;cursor:wait!important}#sc-ig-page-dl{position:fixed;right:74px;bottom:22px;z-index:2147483646;display:flex;align-items:center;justify-content:center;width:38px;height:38px;padding:0;border:1.5px solid rgba(255,255,255,.8);border-radius:50%;background:rgba(219,39,119,.92);color:#fff;box-shadow:0 3px 12px rgba(0,0,0,.45);cursor:pointer}#sc-ig-page-dl:hover{background:#be185d;transform:scale(1.08)}",
  );

  function makeButton(cls, title, run) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = cls;
    btn.title = title;
    btn.innerHTML = ICON;
    const stop = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    ["pointerdown", "mousedown", "dblclick"].forEach((t) => btn.addEventListener(t, stop, !0));
    btn.addEventListener(
      "click",
      async (e) => {
        stop(e);
        if (btn.dataset.state === "busy") return;
        btn.dataset.state = "busy";
        try {
          await run();
          btn.textContent = "✓";
        } catch (err) {
          btn.textContent = "×";
          btn.title = `Lỗi: ${err instanceof Error ? err.message : String(err)}`;
          console.error("[Social All-in-One] Instagram download:", err);
        }
        delete btn.dataset.state;
        setTimeout(() => (btn.innerHTML = ICON), 2500);
      },
      !0,
    );
    return btn;
  }

  // Story button, pinned inside the top-right corner of the story just below
  // its header; falls back to the CSS corner position when no media is shown.
  function placeStoryButton(btn) {
    const el = storyMediaEl();
    const r = el && el.getBoundingClientRect();
    btn.style.left = r ? `${Math.round(r.right - 50)}px` : "";
    btn.style.top = r ? `${Math.round(r.top + 92)}px` : "";
    btn.style.right = btn.style.bottom = r ? "auto" : "";
  }
  function syncStoryButton() {
    let btn = document.getElementById("sc-ig-page-dl");
    if (!location.pathname.startsWith("/stories/")) {
      if (btn) clearInterval(btn.__scTimer), btn.remove();
      return;
    }
    if (!btn) {
      btn = makeButton("", "Tải story này (phím S)", downloadStory);
      btn.id = "sc-ig-page-dl";
      document.body.append(btn);
      btn.__scTimer = setInterval(() => placeStoryButton(btn), 250);
    }
    placeStoryButton(btn);
  }

  // S downloads the open story (ig-download's S hotkey covers feed/post/reel).
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.key.toLowerCase() !== "s" || e.ctrlKey || e.altKey || e.metaKey || e.repeat) return;
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || (t && t.isContentEditable)) return;
      const btn = location.pathname.startsWith("/stories/") && document.getElementById("sc-ig-page-dl");
      if (!btn) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      btn.click();
    },
    !0,
  );

  // Inline buttons on grid tiles (profile, explore, saved).
  function decorateGrid() {
    document.querySelectorAll("a[href]").forEach((a) => {
      if (a.closest("article") || a.querySelector(".sc-ig-dl")) return;
      const m = a.getAttribute("href").match(CODE_RE);
      const img = m && a.querySelector("img");
      if (!img) return;
      const r = img.getBoundingClientRect();
      if (r.width < 120 || r.height < 120) return;
      if (getComputedStyle(a).position === "static") a.style.position = "relative";
      a.append(makeButton("sc-ig-dl", "Tải toàn bộ media của bài này", () => downloadPost(m[1])));
    });
  }

  let timer;
  const refresh = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        syncStoryButton();
        decorateGrid();
      } catch (err) {
        console.error("[Social All-in-One] Instagram UI:", err);
      }
    }, 400);
  };
  const start = () => {
    refresh();
    new MutationObserver(refresh).observe(document.body, { childList: !0, subtree: !0 });
  };
  document.body ? start() : document.addEventListener("DOMContentLoaded", start, { once: !0 });
})();
