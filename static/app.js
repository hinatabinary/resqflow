// Shared app logic: state, header/nav, connectivity, battery, map drawing, demo scenarios.
const App={
  root:document.body.dataset.root||'',
  def:{cond:{rain:5,soil:30,vibration:5,flood:0,traffic:30,severity:0},scenario:'Normal',landslides:[],blocked:[],
       demoOffline:false,lastSync:Date.now(),start:'A',dest:'S1',algo:'dijkstra',log:[]},
  state:null,bat:null,onChange:null,
  load(){const d=JSON.parse(JSON.stringify(this.def));try{this.state={...d,...JSON.parse(localStorage.rq)}}catch(e){this.state=d}},
  save(){localStorage.rq=JSON.stringify(this.state)},
  online(){return navigator.onLine&&!this.state.demoOffline},
  changed(){this.onChange&&this.onChange()},
  recalc(){Graph.apply(this.state);this.save()},
  route(){const s=this.state,best=Router.find(Graph,s.start,s.dest,s.algo);
    return {best,alts:best?Router.alternatives(Graph,s.start,s.dest,s.algo,best):[]}},

  async boot(title){
    this.load();
    document.getElementById('hdr').innerHTML=`<h1>🛟 ResQFlow</h1><small>${title}</small><div id="status"></div>`;
    const L=[['Home','index.html'],['Map','pages/map.html'],['Route','pages/route.html'],['SOS','pages/sos.html'],['Contacts','pages/contacts.html'],['Prepare','pages/prepare.html'],['Guide','pages/guide.html']];
    document.getElementById('nav').innerHTML=L.map(l=>`<a href="${this.root+l[1]}" class="${location.pathname.endsWith(l[1].split('/').pop())?'on':''}">${l[0]}</a>`).join('');
    document.querySelector('main').insertAdjacentHTML('beforeend','<p class="note">Prototype for a college project. AI/ML risk values are simulated. Not a certified emergency system – always follow official instructions and call your local emergency number.</p>');
    await DB.open();await DB.seedIfEmpty();await Graph.build(this.state);
    addEventListener('online',()=>{this.status();Sync.run();this.changed()});addEventListener('offline',()=>{this.status();this.changed()});
    if(navigator.getBattery)navigator.getBattery().then(b=>{this.bat=b;b.onlevelchange=()=>this.status();this.status()});
    if('serviceWorker' in navigator)navigator.serviceWorker.register(this.root+'service-worker.js').catch(()=>{});
    GPS.start(()=>{this.status();this.changed()});
    this.status();Sync.run();
  },
  status(){
    const on=this.online(),lv=this.bat?Math.round(this.bat.level*100):null,m=[];
    document.getElementById('status').innerHTML=`<span>${on?'🟢 Online':'🔴 Offline'}</span><span>${GPS.status}</span><span>🔋 ${lv==null?'n/a':lv+'%'}</span><span>⚠️ ${this.state.scenario}</span>`;
    if(!on)m.push('🔴 OFFLINE MODE – Internet unavailable. Using cached emergency data.');
    if(lv!=null&&lv<=10)m.push('🔋 CRITICAL BATTERY – Emergency Mode Active');else if(lv!=null&&lv<=20)m.push('🔋 Emergency Battery Mode');
    const b=document.getElementById('banner');b.style.display=m.length?'block':'none';b.innerHTML=m.join('<br>');
    document.body.classList.toggle('lowbat',lv!=null&&lv<=20);
  },
  pick(id,which){this.state[which]=id;this.save();this.changed()},

  renderRoute(el,r,alts=[]){
    if(!r){el.innerHTML='<h3>❌ No safe route</h3><p>Every path to this destination is blocked.</p>';return}
    const lab=RiskModel.label(r.maxRisk),st=r.maxRisk<40?'SAFE ✅':r.maxRisk<70?'CAUTION ⚠️':'DANGEROUS 🔴';
    const nm=r=>r.path.map(i=>Graph.node(i).name).join(' → ');
    el.innerHTML=`<h3>Recommended Route</h3><p>${nm(r)}</p><p>Distance: <b>${r.dist.toFixed(1)} km</b><br>Estimated Time: <b>${Math.round(r.time)} min</b><br>Risk: <b class="${lab}">${lab}</b> (worst road ${r.maxRisk}%)<br>Status: <b>${st}</b></p>`+
      (alts.length?'<h4>Alternative routes</h4>'+alts.map(a=>`<p>${nm(a)}<br>${a.dist.toFixed(1)} km · ${Math.round(a.time)} min · risk ${RiskModel.label(a.maxRisk)}</p>`).join(''):'');
  },

  drawMap(id,{pick=false}={}){
    if(typeof L==='undefined'){document.getElementById(id).innerHTML='<p class="card bad">Map library not cached yet. Open the app once while online.</p>';return null}
    const map=L.map(id).setView([13.09,80.275],13),g=L.layerGroup().addTo(map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap'}).addTo(map);
    const ic=h=>L.divIcon({className:'ico',html:h,iconSize:[26,26]});
    return {map,draw(route){
      g.clearLayers();
      Graph.edges.forEach(e=>{const a=Graph.node(e.a),b=Graph.node(e.b);
        L.polyline([[a.lat,a.lng],[b.lat,b.lng]],{color:e.blocked?'#000':RiskModel.color(e.risk),weight:5,dashArray:e.blocked?'4 8':null})
         .bindPopup(`${Graph.name(e)}<br>${e.blocked?'⚫ BLOCKED':RiskModel.label(e.risk)+' risk '+e.risk+'%'}<br>${e.dist.toFixed(1)} km`).addTo(g);
        if(App.state.landslides.includes(e.id))L.circle([(a.lat+b.lat)/2,(a.lng+b.lng)/2],{radius:450,color:'#c1121f',fillOpacity:.15}).addTo(g);});
      if(route)L.polyline(route.path.map(i=>{const n=Graph.node(i);return[n.lat,n.lng]}),{color:'#1d6fff',weight:10,opacity:.55}).addTo(g);
      Graph.nodes.forEach(n=>{let pop=`<b>${n.name}</b>`;
        if(pick)pop+=`<br><button onclick="App.pick('${n.id}','start')">Start here</button><button onclick="App.pick('${n.id}','dest')">Go here</button>`;
        L.marker([n.lat,n.lng],{icon:ic(n.icon||'⚪')}).bindPopup(pop).addTo(g)});
      Graph.AREA.pois.forEach(p=>L.marker([p.lat,p.lng],{icon:ic(p.icon)}).bindPopup(p.name).addTo(g));
      if(GPS.pos)L.marker([GPS.pos.lat,GPS.pos.lng],{icon:ic('🔵')}).bindPopup('You are here').addTo(g);
    }};
  },

  demo:{
    reset(){fetch('/api/reset',{method:'POST'}).catch(()=>{});const s=App.state;s.cond={...App.def.cond};s.blocked=[];s.landslides=[];s.scenario='Normal';s.demoOffline=false;s.log=['Scenario 1 – Normal: risk LOW, internet ONLINE.'];App.recalc();App.status();App.changed()},
    rain(){const s=App.state;s.cond={rain:60,soil:70,vibration:10,flood:20,traffic:50,severity:30};s.scenario='Heavy Rainfall';s.log.push('Scenario 2 – Heavy rainfall: risk scores rose on all roads.');App.recalc();App.status();App.changed()},
    landslide(){const s=App.state,prev=App.route().best;if(!prev)return;
      const e=prev.edges[Math.min(1,prev.edges.length-1)];
      s.cond={rain:60,soil:70,vibration:40,flood:20,traffic:50,severity:70};s.scenario='Landslide';
      s.landslides.push(e.id);if(!s.blocked.includes(e.id))s.blocked.push(e.id);
      App.recalc();const now=App.route().best;
      s.log.push(`⚠️ ROUTE UPDATED – Previous route unsafe. Road ${Graph.name(e)}: BLOCKED. `+(now?'New safest route: '+now.path.map(i=>Graph.node(i).name).join(' → ')+` (${now.dist.toFixed(1)} km, risk ${RiskModel.label(now.maxRisk)}).`:'No route left.'));
      App.recalc();App.status();App.changed()},
    offline(){const s=App.state;s.demoOffline=!s.demoOffline;s.log.push(s.demoOffline?'Scenario 5 – Internet DISABLED: OFFLINE MODE (cached graph, contacts, guide, SOS all still work).':'Internet ENABLED again – syncing.');App.save();App.status();if(!s.demoOffline)Sync.run();App.changed()}
  }
};
