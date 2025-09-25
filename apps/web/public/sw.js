// Basic SW
const STATIC_CACHE = "static-v1";
const STATIC_ASSETS = ["/","/manifest.webmanifest","/icons/icon-192.png","/icons/icon-512.png","/icons/maskable-512.png","/icons/apple-touch-icon.png"];
self.addEventListener("install", e=>{ e.waitUntil(caches.open(STATIC_CACHE).then(c=>c.addAll(STATIC_ASSETS))); self.skipWaiting(); });
self.addEventListener("activate", e=>{ e.waitUntil((async()=>{ const ks=await caches.keys(); await Promise.all(ks.filter(k=>k!==STATIC_CACHE).map(k=>caches.delete(k))); await self.clients.claim(); })()); });
self.addEventListener("fetch", e=>{
  const req=e.request; const url=new URL(req.url); const accept=req.headers.get("accept")||"";
  if (url.pathname.startsWith("/api/") || accept.includes("text/event-stream")) return;
  if (req.mode==="navigate"){ e.respondWith((async()=>{ try{ return await fetch(req); }catch{ const c=await caches.open(STATIC_CACHE); return (await c.match("/"))||Response.redirect("/"); } })()); return; }
  if (req.method==="GET"){ e.respondWith((async()=>{ const c=await caches.open(STATIC_CACHE); const hit=await c.match(req); if(hit) return hit; try{ const res=await fetch(req); if(res.ok && url.origin===location.origin) c.put(req,res.clone()); return res; }catch{ return new Response("",{status:503}); } })()); }
});
