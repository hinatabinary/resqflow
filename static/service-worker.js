const V='resqflow-v1';
const LEAF='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.';
const ASSETS=['./','index.html','style.css','app.js','manifest.json','pages/map.html','pages/route.html','pages/contacts.html','pages/sos.html','pages/prepare.html','pages/guide.html',
'js/graph.js','js/dijkstra.js','js/risk-model.js','js/offline-db.js','js/gps.js','js/sync.js',LEAF+'min.css',LEAF+'min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(ASSETS.map(u=>c.add(u).catch(()=>{})))));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))));self.clients.claim()});
// cache-first; anything fetched (including map tiles) is stored for offline use
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(hit=>hit||fetch(e.request).then(r=>{
    const copy=r.clone();caches.open(V).then(c=>c.put(e.request,copy));return r;
  }).catch(()=>e.request.mode==='navigate'?caches.match('index.html'):Response.error())));
});
