"""Terminal demo: shows AI/ML (risk) and Graph algorithm (route) as separate steps."""
from backend import graph, routing, risk_model

def show(title, state):
    g = graph.Graph(state)
    print(f"\n== {title} ==")
    for e in g.edges[:4]:
        print(f"  Road {e['id']}: risk {e['risk']}% {risk_model.label(e['risk'])}{' BLOCKED' if e['blocked'] else ''}")
    r = routing.find(g, "A", "S1")
    print("  Route:", " -> ".join(r["path"]) if r else "none", f"| {r['dist']:.1f} km, {r['time']:.0f} min, risk {risk_model.label(r['max_risk'])}" if r else "")
    return r

r = show("Normal", {})
rain = {"cond": dict(rain=60, soil=70, flood=20, severity=30, traffic=50)}
show("Heavy rain", rain)
slide = r["edges"][1]
show(f"Landslide on {slide}", {**rain, "blocked": [slide], "landslides": [slide]})
