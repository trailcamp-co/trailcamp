#!/usr/bin/env python3
"""Download public land boundaries from BLM SMA Feature Service per agency."""
import urllib.request
import json
import os
import time

BASE = "https://gis.blm.gov/arcgis/rest/services/lands/BLM_Natl_SMA_LimitedScale/MapServer/1/query"
OUT_DIR = "/Users/nicosstrnad/Projects/trailcamp/data/padus"
os.makedirs(OUT_DIR, exist_ok=True)

# Key agencies for outdoor recreation
AGENCIES = {
    'BLM': 'Bureau of Land Management',
    'USFS': 'US Forest Service',
    'NPS': 'National Park Service',
    'FWS': 'Fish & Wildlife Service',
    'ST': 'State Lands',
    'USBR': 'Bureau of Reclamation',
    'BIA': 'Bureau of Indian Affairs',
    'DOD': 'Dept of Defense',
}

all_features = []

for code, name in AGENCIES.items():
    outfile = os.path.join(OUT_DIR, f"sma-{code.lower()}.geojson")
    if os.path.exists(outfile):
        print(f"  ✓ {code} already downloaded")
        with open(outfile) as f:
            d = json.load(f)
            for feat in d.get('features', []):
                feat['properties']['agency'] = code
                all_features.append(feat)
        continue

    print(f"Downloading {code} ({name})...")
    url = f"{BASE}?where=ADMIN_AGENCY_CODE='{code}'&outFields=ADMIN_AGENCY_CODE,ADMIN_UNIT_NAME&outSR=4326&f=geojson&resultRecordCount=10000"
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'TrailCamp/1.0'})
        resp = urllib.request.urlopen(req, timeout=120)
        data = json.loads(resp.read())
        
        features = data.get('features', [])
        print(f"  → {len(features)} features, ", end='')
        
        # Tag each feature with agency code
        for feat in features:
            feat['properties']['agency'] = code
        all_features.extend(features)
        
        # Save individual file
        with open(outfile, 'w') as f:
            json.dump(data, f)
        size = os.path.getsize(outfile)
        print(f"{size / 1024 / 1024:.1f} MB")
        
        time.sleep(2)  # Be nice to their server
    except Exception as e:
        print(f"  ✗ Error: {e}")
        continue

# Combine into single GeoJSON
combined = {
    "type": "FeatureCollection",
    "features": all_features
}
combined_file = os.path.join(OUT_DIR, "sma-combined.geojson")
with open(combined_file, 'w') as f:
    json.dump(combined, f)
total_size = os.path.getsize(combined_file) / 1024 / 1024
print(f"\n✅ Combined: {len(all_features)} features, {total_size:.1f} MB → {combined_file}")
