// GPS works without internet but needs hardware + user permission.
const GPS={pos:null,status:'📍 GPS: starting',
  start(cb){
    if(!navigator.geolocation){this.status='📍 GPS unavailable';cb&&cb();return}
    navigator.geolocation.watchPosition(p=>{this.pos={lat:p.coords.latitude,lng:p.coords.longitude};this.status='📍 GPS on';cb&&cb()},
      ()=>{this.pos=null;this.status='📍 Location unavailable';cb&&cb()},
      {enableHighAccuracy:true,maximumAge:document.body.classList.contains('lowbat')?60000:5000});  // fewer updates on low battery
  }};
