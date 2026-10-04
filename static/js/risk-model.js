// AI/ML MODULE (SIMULATED). Predicts a 0-100 risk score per road.
// A logistic model with hand-set weights stands in for a trained model (e.g. Random Forest).
// It does NOT do routing – that is js/dijkstra.js.
const RiskModel={
  W:{bias:-2.5,rain:.015,soil:.012,vibration:.010,flood:.015,traffic:.006,severity:.012,vuln:.012,nearHazard:1.0},
  predict(f){
    const w=this.W;
    const z=w.bias+w.rain*f.rain+w.soil*f.soil+w.vibration*f.vibration+w.flood*f.flood+
            w.traffic*f.traffic+w.severity*f.severity+w.vuln*f.vuln+(f.nearHazard?w.nearHazard:0);
    return Math.round(100/(1+Math.exp(-z)));           // sigmoid -> 0..100
  },
  label:s=>s>=70?'HIGH':s>=40?'MEDIUM':'LOW',
  color:s=>s>=70?'#c1121f':s>=40?'#e0a100':'#1b7f3b'
};
