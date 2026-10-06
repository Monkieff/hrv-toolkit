/*
  sw.js — HW Reliability Toolkit
  Version : 2.8.7
  Updated : 2026-10-06
  Spec    : Shared Spec v1.14.7

  Cache-first。所有工具都是單檔靜態頁，安裝時一次全部預先快取，之後完全離線可用。

  ** 改過任何工具就要改 CACHE 這一行的版本號。**
  Cache-first 代表舊版會一直被端出來，換掉 CACHE 名稱才會觸發重新下載並清掉舊快取。

  Changelog
  2.8.7  對應 hrv-toolkit.html v1.8.7（首頁展開鈕文字）。
  2.8.6  對應 hrv-toolkit.html v1.8.6（Text Comparer、兩個工具補說明區、說明區間距統一）。
  2.8.5  對應 hrv-toolkit.html v1.8.5（選單順序、首頁展開鈕文字與間距）。
  2.8.4  對應 hrv-toolkit.html v1.8.4（拿掉各工具的全站頁尾、首頁說明、兩個工具改名）。
  2.8.3  對應 hrv-toolkit.html v1.8.3（首頁分類標題更突出、展開鈕文字）。
  2.8.2  對應 hrv-toolkit.html v1.8.2（Firmware Recorder 階段加 DoE、首頁介紹改成點了展開）。
  2.8.1  對應 hrv-toolkit.html v1.8.1（首頁精簡、選單 Home 區隔、英文標籤首字母大寫）。
  2.8.0  對應 hrv-toolkit.html v1.8.0（首頁、自由筆記存檔格）。
  2.7.0  對應 hrv-toolkit.html v1.7.0（Local Notes）。
  2.6.0  對應 hrv-toolkit.html v1.6.0（兩個排程工具的月曆）。
  2.5.0  對應 hrv-toolkit.html v1.5.0（Firmware Recorder 產出區與去重、IP Recorder 欄位順序）。
  2.4.0  對應 hrv-toolkit.html v1.4.0（Firmware Recorder、IP Recorder 框格）。
  2.3.1  對應 hrv-toolkit.html v1.3.1（Torque Converter 平板寬度修正）。
  2.3.0  對應 hrv-toolkit.html v1.3.0（IP Recorder 每個 IP 各有 MAC、選單順序）。
  2.2.0  對應 hrv-toolkit.html v1.2.0（外觀切換、Data Size Converter、IP Recorder）。
  2.1.1  對應 hrv-toolkit.html v1.1.1。
  2.1.0  對應 hrv-toolkit.html v1.1.0（最近五筆與存檔格）。
  2.0.1  對應 hrv-toolkit.html v1.0.1。
  2.0.0  四支獨立工具合併為 hrv-toolkit.html，預快取清單同步縮減。
  1.0.0  Initial release
*/

var CACHE = 'hw-reliability-toolkit-v2.8.7';

var ASSETS = [
  './',
  './index.html',
  './hrv-toolkit.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      // 單一檔案抓不到不該讓整個安裝失敗，逐一加入
      return Promise.all(ASSETS.map(function(url){
        return c.add(new Request(url, { cache: 'reload' })).catch(function(){ return null; });
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function(hit){
      if (hit) return hit;
      return fetch(req).then(function(res){
        // 只快取自己網域的正常回應
        if (res && res.status === 200 && res.type === 'basic'){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      }).catch(function(){
        // 離線又沒快取：導覽請求退回入口頁，其餘讓它失敗
        if (req.mode === 'navigate') return caches.match('./hrv-toolkit.html');
        return Response.error();
      });
    })
  );
});
