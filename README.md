# ResQFlow – AI-Powered Disaster Evacuation (college prototype)

## Run it (recommended: with the Python server)
    python server.py
Open http://localhost:8000  (Python 3.8+, no pip install needed)

## Run it without Python (front-end only)
Open the `static` folder in VS Code, right-click `index.html` -> "Open with Live Server".
Everything works except syncing blockage reports between devices.

## Terminal demo of AI vs routing
    python cli_demo.py

## Folder layout
    ResQFlow/
    ├── server.py             web server + API (/api/graph, /risk, /route, /sync, /reset)
    ├── cli_demo.py           terminal demo
    ├── backend/
    │   ├── risk_model.py     AI/ML (simulated): predicts road risk 0-100
    │   ├── graph.py          road graph (distance, risk, blocked)
    │   └── routing.py        Dijkstra / A*: finds the safest route
    ├── data/reports.json     shared road-blockage reports
    └── static/               the PWA (offline-first)
        ├── index.html, style.css, app.js, manifest.json, service-worker.js
        ├── pages/            map, route, contacts, sos, prepare, guide
        ├── js/               graph, dijkstra, risk-model, offline-db, gps, sync
        └── assets/icons/

## Demo order (Home page -> Demo Mode)
1 Normal -> 2 Heavy Rain -> 3 Simulate Landslide -> 5 Disable Internet (offline mode)

## Notes
- AI/ML risk values are SIMULATED (hand-set logistic model). Dijkstra/A* is a graph algorithm, not AI/ML.
- The Chennai road network is a small made-up demo graph. Not a certified emergency system.
- Open the app once online so the service worker can cache Leaflet and map tiles for offline use.
- Risk-model weights exist in backend/risk_model.py and static/js/risk-model.js; change both together.
