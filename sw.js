/*
  sw.js — HW Reliability Toolkit
  Version : 2.1.1
  Updated : 2026-09-11
  Spec    : Shared Spec v1.7

  Cache-first。所有工具都是單檔靜態頁，安裝時一次全部預先快取，之後完全離線可用。

  ** 改過任何工具就要改 CACHE 這一行的版本號。**
  Cache-first 代表舊版會一直被端出來，換掉 CACHE 名稱才會觸發重新下載並清掉舊快取。

  Changelog
  2.1.1  對應 hrv-toolkit.html v1.1.1。
  2.1.0  對應 hrv-toolkit.html v1.1.0（最近五筆與存檔格）。
  2.0.1  對應 hrv-toolkit.html v1.0.1。
  2.0.0  四支獨立工具合併為 hrv-toolkit.html，預快取清單同步縮減。
  1.0.0  Initial release
*/

var CACHE = 'hw-reliability-toolkit-v2.1.1';

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
