"""GRAPH ENGINE - nodes, edges (distance, risk, blocked)."""
import math
from . import risk_model

NODES = {
    "A": ("Start - Central", 13.0827, 80.2707, ""), "B": ("Junction B", 13.0900, 80.2600, ""),
    "C": ("Junction C", 13.0950, 80.2800, ""), "D": ("Junction D", 13.0750, 80.2800, ""),
    "E": ("Junction E", 13.1000, 80.2900, ""), "F": ("Junction F", 13.1050, 80.2650, ""),
    "S1": ("Shelter - School", 13.1150, 80.2750, "shelter"), "S2": ("Shelter - Stadium", 13.0650, 80.2900, "shelter"),
    "H1": ("Hospital", 13.0700, 80.2500, "hospital")}
ROADS = [("A", "B", 30), ("B", "F", 40), ("F", "S1", 35), ("A", "C", 25), ("C", "S1", 30), ("C", "E", 50),
         ("E", "S1", 45), ("A", "D", 20), ("D", "S2", 60), ("D", "E", 45), ("A", "H1", 55), ("H1", "D", 40)]
DEFAULT_COND = dict(rain=5, soil=30, vibration=5, flood=0, traffic=30, severity=0)

def km(a, b):
    r = math.radians
    dl, dg = r(b[1] - a[1]), r(b[2] - a[2])
    h = math.sin(dl / 2) ** 2 + math.cos(r(a[1])) * math.cos(r(b[1])) * math.sin(dg / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(h))

class Graph:
    def __init__(self, state=None):
        s = state or {}
        self.cond = {**DEFAULT_COND, **s.get("cond", {})}
        blocked, slides = set(s.get("blocked", [])), s.get("landslides", [])
        self.edges = []
        for a, b, vuln in ROADS:
            eid = f"{a}-{b}"
            near = any(l != eid and (set(l.split("-")) & {a, b}) for l in slides)   # touches a landslide road
            risk = 100 if eid in blocked else risk_model.predict({**self.cond, "vuln": vuln, "near_hazard": near})
            self.edges.append(dict(id=eid, a=a, b=b, vuln=vuln, blocked=eid in blocked, risk=risk,
                                   dist=km(NODES[a], NODES[b]) * 1.3))     # 1.3 = road winding factor

    def shelters(self):
        return [k for k, v in NODES.items() if v[3] == "shelter"]
