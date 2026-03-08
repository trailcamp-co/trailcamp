#!/usr/bin/env python3
"""Verify agent-curated riding locations. Brave Search + keyword matching."""

import json, os, time, urllib.request, urllib.parse, traceback

BRAVE_API_KEY = os.environ.get("BRAVE_SEARCH_API_KEY", "BSAHTZ0T7HlpxlO_cAtEvRAJ9dpYOOK")
API_BASE = "http://localhost:3001/api"

LEGIT_KW = ['ohv','orv','off-highway vehicle','off-road vehicle','atv trail','dirt bike',
    'motorcycle trail','motocross','mx track','moto trail','motorized trail','motorized use',
    'motorized vehicle','motor vehicle use map','mvum','utv','side by side','dual sport',
    'enduro','adventure riding','ohv area','ohv trail','orv area','orv trail','atv area',
    'svra','state vehicular recreation','off-road park','riding area','dirtbike','quad',
    'four wheeler','open to motorized','motorcycle riding','motorcycle allowed','designated motorized']

WRONG_KW = ['no motorized','non-motorized','nonmotorized','no motor vehicles','hiking only',
    'hikers only','mountain bike only','mtb only','bicycles only','no atvs','no dirt bikes',
    'no motorcycles','motorized vehicles prohibited','closed to motorized',
    'motorized vehicles are not','not open to motorized']

PARK_KW = ['county park','state park','city park','nature preserve','nature center',
    'botanical','arboretum','wildlife refuge']


def brave_search(query, retries=3):
    url = "https://api.search.brave.com/res/v1/web/search?" + urllib.parse.urlencode({"q": query, "count": 5})
    req = urllib.request.Request(url, headers={"Accept": "application/json", "X-Subscription-Token": BRAVE_API_KEY})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read())
                results = data.get("web", {}).get("results", [])
                text = " ".join(r.get("title","") + " " + r.get("description","") for r in results)
                return text.lower(), len(results)
        except Exception as e:
            if attempt < retries - 1:
                wait = (attempt + 1) * 5
                print(f"    Retry {attempt+1} after {wait}s: {e}", flush=True)
                time.sleep(wait)
            else:
                return f"ERROR: {e}", 0
    return "ERROR: exhausted retries", 0


def classify(name, state, desc, search_text, result_count):
    combined = (search_text + " " + (desc or "")).lower()
    legit = sum(1 for k in LEGIT_KW if k in combined)
    wrong = sum(1 for k in WRONG_KW if k in combined)
    
    if wrong >= 2: return "wrong", f"wrong={wrong}, legit={legit}"
    if wrong >= 1 and legit == 0: return "wrong", f"wrong={wrong}, legit={legit}"
    if legit >= 2: return "legit", f"legit={legit}"
    if legit == 1 and wrong == 0: return "legit", f"legit={legit}"
    if any(k in combined for k in PARK_KW) and legit == 0: return "wrong", "park/no motorized"
    if result_count == 0: return "unclear", "no results"
    return "unclear", f"legit={legit}, wrong={wrong}"


def main():
    print("Fetching riding locations...", flush=True)
    with urllib.request.urlopen(f"{API_BASE}/locations?category=riding", timeout=30) as resp:
        all_riding = json.loads(resp.read())
    
    targets = [d for d in all_riding if d.get("source") == "agent-curated" and not d.get("sub_type")]
    print(f"Found {len(targets)} to verify\n", flush=True)
    
    results = {"legit": [], "wrong": [], "unclear": []}
    report_path = "/Users/nicosstrnad/Projects/trailcamp/scripts/riding-verification-report.json"
    
    for i, loc in enumerate(targets):
        name, state, loc_id = loc["name"], loc.get("state",""), loc["id"]
        desc = loc.get("description","") or ""
        
        query = f"{name} {state} OHV motorized dirt bike"
        search_text, count = brave_search(query)
        
        if search_text.startswith("ERROR"):
            print(f"  [{i+1}/{len(targets)}] ⚠️  {name} ({state}) — {search_text}", flush=True)
            results["unclear"].append({"id": loc_id, "name": name, "state": state, "reason": search_text})
        else:
            cat, reason = classify(name, state, desc, search_text, count)
            results[cat].append({"id": loc_id, "name": name, "state": state, "reason": reason})
            icon = {"legit":"✅","wrong":"❌","unclear":"❓"}[cat]
            print(f"  [{i+1}/{len(targets)}] {icon} {name} ({state}) — {cat}: {reason}", flush=True)
        
        # Save progress every 50
        if (i + 1) % 50 == 0:
            with open(report_path, "w") as f:
                json.dump(results, f, indent=2)
            print(f"  --- Progress saved ({i+1}/{len(targets)}) ---", flush=True)
        
        time.sleep(1.5)  # Conservative rate limit
    
    with open(report_path, "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n{'='*60}", flush=True)
    print(f"✅ Legit: {len(results['legit'])}", flush=True)
    print(f"❌ Wrong: {len(results['wrong'])}", flush=True)
    print(f"❓ Unclear: {len(results['unclear'])}", flush=True)
    print(f"\nReport: {report_path}", flush=True)
    
    if results["wrong"]:
        print(f"\nRECOMMENDED FOR DELETION:", flush=True)
        for loc in sorted(results["wrong"], key=lambda x: x.get("state","") + x["name"]):
            print(f"  ID:{loc['id']} [{loc.get('state','??')}] {loc['name']} — {loc['reason']}", flush=True)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        traceback.print_exc()
