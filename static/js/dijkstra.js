// ROUTING ALGORITHM (not AI/ML). Dijkstra, or A* when a heuristic is used.
// Edge cost = distance weight + risk weight. Blocked roads are never used.
const Router={
  cost:e=>e.dist*(1+3*e.risk/100)+(e.risk>=80?5:0),   // risky roads "feel" longer
  find(g,src,dst,algo='dijkstra',banned=[]){
    const h=n=>algo==='astar'?g.km(g.node(n),g.node(dst)):0;   // A* heuristic (admissible)
    const dist={},prev={},open=new Set([src]),done=new Set();
    g.nodes.forEach(n=>dist[n.id]=Infinity);dist[src]=0;
    while(open.size){
      let u=null;open.forEach(n=>{if(u===null||dist[n]+h(n)<dist[u]+h(u))u=n});
      if(u===dst)break;open.delete(u);done.add(u);
      g.edges.forEach(e=>{
        if(e.blocked||banned.includes(e.id)||(e.a!==u&&e.b!==u))return;
        const v=e.a===u?e.b:e.a;if(done.has(v))return;
        const d=dist[u]+this.cost(e);if(d<dist[v]){dist[v]=d;prev[v]={u,e};open.add(v);}
      });
    }
    if(dist[dst]===Infinity)return null;
    const path=[dst],edges=[];for(let n=dst;n!==src;n=prev[n].u){path.unshift(prev[n].u);edges.unshift(prev[n].e);}
    const km=edges.reduce((s,e)=>s+e.dist,0),max=Math.max(...edges.map(e=>e.risk),0);
    const time=edges.reduce((s,e)=>s+e.dist/(30*(1-.5*e.risk/100))*60,0);  // 30 km/h, slower on risky roads
    return {path,edges,dist:km,time,maxRisk:max,cost:dist[dst]};
  },
  alternatives(g,src,dst,algo,best){       // ban each edge of the best route in turn
    const seen={[best.path.join()]:1},out=[];
    best.edges.forEach(e=>{const r=this.find(g,src,dst,algo,[e.id]);if(r&&!seen[r.path.join()]){seen[r.path.join()]=1;out.push(r)}});
    return out.sort((a,b)=>a.cost-b.cost).slice(0,2);
  },
  nearestShelter(g,src,algo){let best=null;
    g.nodes.filter(n=>n.type==='shelter').forEach(s=>{const r=this.find(g,src,s.id,algo);if(r&&(!best||r.cost<best.route.cost))best={shelter:s,route:r}});return best;}
};
