// GRAPH ENGINE – nodes (junctions/shelters) + edges (roads with distance, risk, blocked).
const Graph={
  AREA:{name:'Chennai (demo)',
    nodes:[
      {id:'A',name:'Start – Central',lat:13.0827,lng:80.2707,icon:'📍'},
      {id:'B',name:'Junction B',lat:13.0900,lng:80.2600},{id:'C',name:'Junction C',lat:13.0950,lng:80.2800},
      {id:'D',name:'Junction D',lat:13.0750,lng:80.2800},{id:'E',name:'Junction E',lat:13.1000,lng:80.2900},
      {id:'F',name:'Junction F',lat:13.1050,lng:80.2650},
      {id:'S1',name:'Shelter – School',lat:13.1150,lng:80.2750,type:'shelter',icon:'🏠'},
      {id:'S2',name:'Shelter – Stadium',lat:13.0650,lng:80.2900,type:'shelter',icon:'🏠'},
      {id:'H1',name:'Hospital',lat:13.0700,lng:80.2500,type:'hospital',icon:'🏥'}],
    edges:[['A','B',30],['B','F',40],['F','S1',35],['A','C',25],['C','S1',30],['C','E',50],['E','S1',45],['A','D',20],['D','S2',60],['D','E',45],['A','H1',55],['H1','D',40]], // [from,to,vulnerability 0-100]
    pois:[{name:'Police Station',lat:13.0860,lng:80.2740,icon:'👮'},{name:'Fire Station',lat:13.0780,lng:80.2650,icon:'🚒'},{name:'Safe Zone – Park',lat:13.1000,lng:80.2700,icon:'🟩'}]},
  nodes:[],edges:[],
  km(a,b){const R=6371,r=x=>x*Math.PI/180,dl=r(b.lat-a.lat),dg=r(b.lng-a.lng);
    const h=Math.sin(dl/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.sqrt(h));},
  node(id){return this.nodes.find(n=>n.id===id)},
  edge(id){return this.edges.find(e=>e.id===id)},
  async build(state){                       // load from IndexedDB (works offline), fall back to bundled data
    this.nodes=await DB.getAll('nodes');const roads=await DB.getAll('roads');
    if(!this.nodes.length){this.nodes=this.AREA.nodes;}
    const rd=roads.length?roads:this.AREA.edges.map(e=>({id:e[0]+'-'+e[1],a:e[0],b:e[1],vuln:e[2]}));
    this.edges=rd.map(r=>({...r,dist:this.km(this.node(r.a),this.node(r.b))*1.3,risk:0,blocked:false}));  // 1.3 = road winding factor
    this.apply(state);
  },
  apply(state){                             // ask the ML module for each road's risk
    this.edges.forEach(e=>{
      e.blocked=state.blocked.includes(e.id);
      const near=state.landslides.some(id=>{const h=this.edge(id);return h&&h.id!==e.id&&[h.a,h.b].some(n=>n===e.a||n===e.b)});
      e.risk=e.blocked?100:RiskModel.predict({...state.cond,vuln:e.vuln,nearHazard:near});
    });
  },
  nearest(lat,lng){let best=null;this.nodes.forEach(n=>{const d=this.km({lat,lng},n);if(!best||d<best.km)best={node:n,km:d}});return best;},
  name(e){return this.node(e.a).name+' ↔ '+this.node(e.b).name}
};
