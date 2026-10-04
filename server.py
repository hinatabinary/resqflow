"""ResQFlow server - standard library only (no pip install needed).
Serves the PWA from ./static and provides a small JSON API:
  GET  /api/graph            nodes + roads
  POST /api/risk             {cond, blocked, landslides}      -> road risk scores (AI/ML module)
  POST /api/route            {start, dest, algo, ...state}    -> best + alternative routes (Dijkstra/A*)
  POST /api/sync             {queue:[road reports]}           -> shared blocked-road list
  POST /api/reset            clears shared reports
Run:  python server.py   then open http://localhost:8000"""
import json, os
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from backend import graph, routing, risk_model

ROOT = os.path.dirname(os.path.abspath(__file__))
STORE = os.path.join(ROOT, "data", "reports.json")
blocked = set(json.load(open(STORE))) if os.path.exists(STORE) else set()

def save():
    json.dump(sorted(blocked), open(STORE, "w"))

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=os.path.join(ROOT, "static"), **k)

    def reply(self, obj, code=200):
        body = json.dumps(obj).encode()
        self.send_response(code); self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)

    def do_GET(self):
        if self.path == "/api/graph":
            return self.reply(dict(nodes=graph.NODES, roads=graph.ROADS))
        super().do_GET()

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        data = json.loads(self.rfile.read(n) or b"{}")
        if self.path == "/api/risk":
            g = graph.Graph(data)
            return self.reply([dict(id=e["id"], risk=e["risk"], label=risk_model.label(e["risk"]), blocked=e["blocked"]) for e in g.edges])
        if self.path == "/api/route":
            g = graph.Graph(data)
            src, dst, algo = data.get("start", "A"), data.get("dest", "S1"), data.get("algo", "dijkstra")
            best = routing.find(g, src, dst, algo)
            return self.reply(dict(best=best, alternatives=routing.alternatives(g, src, dst, algo, best) if best else []))
        if self.path == "/api/sync":
            for item in data.get("queue", []):
                if item.get("type") == "roadReport":
                    d = item["data"]
                    (blocked.add if d["blocked"] else blocked.discard)(d["edge"])
            save()
            return self.reply(dict(blocked=sorted(blocked)))
        if self.path == "/api/reset":
            blocked.clear(); save()
            return self.reply(dict(ok=True))
        self.reply(dict(error="not found"), 404)

if __name__ == "__main__":
    print("ResQFlow running at http://localhost:8000  (Ctrl+C to stop)")
    ThreadingHTTPServer(("", 8000), Handler).serve_forever()
