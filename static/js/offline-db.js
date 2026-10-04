// IndexedDB wrapper – all emergency data lives here so it works offline.
const STORES=['users','emergencyContacts','downloadedAreas','roads','nodes','shelters','hospitals','safeZones','hazardZones','blockedRoads','riskData','routes','emergencyGuides','syncQueue'];
const GUIDES=[
 {id:'flood',icon:'🌊',title:'Flood',tips:['Move to higher ground.','Avoid moving floodwater.','Avoid flooded roads.','Follow official evacuation instructions.']},
 {id:'landslide',icon:'🪨',title:'Landslide',tips:['Move away from unstable slopes.','Avoid valleys and landslide paths.','Do not approach damaged roads.','Follow evacuation instructions.']},
 {id:'earthquake',icon:'🌎',title:'Earthquake',tips:['Move away from damaged structures.','Avoid elevators.','Follow designated evacuation routes.']},
 {id:'fire',icon:'🔥',title:'Fire',tips:['Move away from smoke/fire.','Use designated exits.','Do not return to the affected area.']},
 {id:'cyclone',icon:'🌀',title:'Cyclone',tips:['Move to designated shelters.','Stay away from damaged structures.','Follow official warnings.']}];
const OFFICIAL=[{id:'o1',name:'Police',number:'100',official:true},{id:'o2',name:'Fire & Rescue',number:'101',official:true},
 {id:'o3',name:'Ambulance',number:'108',official:true},{id:'o4',name:'Disaster Management',number:'1070',official:true},{id:'o5',name:'National Emergency',number:'112',official:true}];
const DB={
  db:null,
  open(){return new Promise((res,rej)=>{
    const r=indexedDB.open('resqflow',1);
    r.onupgradeneeded=()=>STORES.forEach(s=>r.result.createObjectStore(s,{keyPath:'id'}));
    r.onsuccess=()=>{this.db=r.result;res()};r.onerror=()=>rej(r.error);});},
  tx(s,mode,fn){return new Promise((res,rej)=>{const t=this.db.transaction(s,mode),o=fn(t.objectStore(s));t.oncomplete=()=>res(o.result);t.onerror=()=>rej(t.error);});},
  put(s,o){return this.tx(s,'readwrite',x=>x.put(o))},
  get(s,id){return this.tx(s,'readonly',x=>x.get(id))},
  getAll(s){return this.tx(s,'readonly',x=>x.getAll())},
  del(s,id){return this.tx(s,'readwrite',x=>x.delete(id))},
  async seedIfEmpty(){if(!(await this.getAll('nodes')).length)await this.seedArea();},
  async seedArea(){
    const A=Graph.AREA;
    for(const n of A.nodes){await this.put('nodes',n);
      if(n.type==='shelter')await this.put('shelters',n);if(n.type==='hospital')await this.put('hospitals',n);}
    for(const e of A.edges)await this.put('roads',{id:e[0]+'-'+e[1],a:e[0],b:e[1],vuln:e[2]});
    for(const p of A.pois)await this.put('safeZones',{id:p.name,...p});
    for(const g of GUIDES)await this.put('emergencyGuides',g);
    for(const c of OFFICIAL)if(!(await this.get('emergencyContacts',c.id)))await this.put('emergencyContacts',c);
    await this.put('downloadedAreas',{id:A.name,at:Date.now()});
  }
};
