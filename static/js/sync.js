// Local changes go into the syncQueue; when internet returns they are "uploaded".
// Uploads to the Python server (server.py) via /api/sync.
const Sync={
  queue(type,data){return DB.put('syncQueue',{id:Date.now()+'-'+Math.random(),type,data,at:Date.now(),done:false})},
  async run(){
    if(!App.online())return;
    const q=(await DB.getAll('syncQueue')).filter(x=>!x.done);
    try{                                   // upload local reports, download shared blocked roads
      const r=await fetch('/api/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({queue:q})});
      const d=await r.json();
      d.blocked.forEach(id=>{if(!App.state.blocked.includes(id))App.state.blocked.push(id)});
      for(const i of q){i.done=true;await DB.put('syncQueue',i)}
      App.state.lastSync=Date.now();
    }catch(e){return}                      // server unreachable: keep the queue for later
    App.recalc();App.status();App.changed();
  },
  async label(){
    const pending=(await DB.getAll('syncQueue')).filter(x=>!x.done).length;
    const m=Math.round((Date.now()-App.state.lastSync)/60000);
    return pending?`⏳ ${pending} change(s) waiting to sync`:`✓ Synced · Last updated ${m<1?'just now':m+' min ago'}`;
  }
};
