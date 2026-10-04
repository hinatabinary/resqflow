"""AI/ML MODULE (SIMULATED). Predicts a 0-100 risk score per road.
A logistic model with hand-set weights stands in for a trained model.
It does NOT find routes - that is routing.py."""
import math

W = dict(bias=-2.5, rain=.015, soil=.012, vibration=.010, flood=.015,
         traffic=.006, severity=.012, vuln=.012, near_hazard=1.0)

def predict(f):
    z = (W["bias"] + W["rain"] * f["rain"] + W["soil"] * f["soil"] + W["vibration"] * f["vibration"]
         + W["flood"] * f["flood"] + W["traffic"] * f["traffic"] + W["severity"] * f["severity"]
         + W["vuln"] * f["vuln"] + (W["near_hazard"] if f.get("near_hazard") else 0))
    return round(100 / (1 + math.exp(-z)))          # sigmoid -> 0..100

def label(score):
    return "HIGH" if score >= 70 else "MEDIUM" if score >= 40 else "LOW"
