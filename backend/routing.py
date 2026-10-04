"""ROUTING ALGORITHM (not AI/ML). Dijkstra, or A* with a distance heuristic.
Cost = distance weight + risk weight. Blocked roads are never used."""
import heapq
from .graph import NODES, km

def cost(e):
    return e["dist"] * (1 + 3 * e["risk"] / 100) + (5 if e["risk"] >= 80 else 0)

def find(g, src, dst, algo="dijkstra", banned=()):
    h = (lambda n: km(NODES[n], NODES[dst])) if algo == "astar" else (lambda n: 0)
    best, prev, pq = {src: 0}, {}, [(h(src), src)]
    while pq:
        _, u = heapq.heappop(pq)
        if u == dst:
            break
        for e in g.edges:
            if e["blocked"] or e["id"] in banned or u not in (e["a"], e["b"]):
                continue
            v = e["b"] if e["a"] == u else e["a"]
            d = best[u] + cost(e)
            if d < best.get(v, float("inf")):
                best[v], prev[v] = d, (u, e)
                heapq.heappush(pq, (d + h(v), v))
    if dst not in best:
        return None
    path, edges, n = [dst], [], dst
    while n != src:
        n, e = prev[n]
        path.insert(0, n); edges.insert(0, e)
    return dict(path=path, edges=[e["id"] for e in edges], dist=sum(e["dist"] for e in edges),
                time=sum(e["dist"] / (30 * (1 - .5 * e["risk"] / 100)) * 60 for e in edges),
                max_risk=max(e["risk"] for e in edges), cost=best[dst])

def alternatives(g, src, dst, algo, best):
    seen, out = {tuple(best["path"])}, []
    for eid in best["edges"]:                     # ban each edge of the best route in turn
        r = find(g, src, dst, algo, banned=(eid,))
        if r and tuple(r["path"]) not in seen:
            seen.add(tuple(r["path"])); out.append(r)
    return sorted(out, key=lambda r: r["cost"])[:2]

def nearest_shelter(g, src, algo="dijkstra"):
    routes = [(find(g, src, s, algo), s) for s in g.shelters()]
    routes = [(r, s) for r, s in routes if r]
    return min(routes, key=lambda x: x[0]["cost"], default=None)
