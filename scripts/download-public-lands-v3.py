#!/usr/bin/env python3
"""Retry failed regions with smaller bounding boxes."""
import urllib.request
import json
import os
import time

BASE = "https://gis.blm.gov/arcgis/rest/services/lands/BLM_Natl_SMA_LimitedScale/MapServer/1/query"
OUT_DIR = "/Users/nicosstrnad/Projects/trailcamp/data/padus"

# Agencies that had 500 errors on large regions — retry with smaller boxes
RETRY = {
    'BLM': [
        # Split western CONUS into much smaller boxes
        (-125, 45, -121, 49), (-121, 45, -117, 49), (-117, 45, -113, 49), (-113, 45, -109, 49), (-109, 45, -104, 49),
        (-125, 41, -121, 45), (-121, 41, -117, 45), (-117, 41, -113, 45), (-113, 41, -109, 45), (-109, 41, -104, 45),
        (-125, 37, -121, 41), (-121, 37, -117, 41), (-117, 37, -113, 41), (-113, 37, -109, 41), (-109, 37, -104, 41),
        (-125, 32, -121, 37), (-121, 32, -117, 37), (-117, 32, -113, 37), (-113, 32, -109, 37), (-109, 32, -104, 37),
        (-104, 32, -95, 40), (-104, 40, -95, 49),  # plains
    ],
    'USFS': [
        (-125, 45, -119, 49), (-119, 45, -113, 49), (-113, 45, -104, 49),
        (-113, 37, -104, 45),
        (-104, 25, -95, 36), (-95, 25, -82, 36),
        (-180, 55, -150, 72), (-150, 55, -130, 72),
    ],
    'NPS': [
        (-104, 40, -95, 49), (-95, 36, -82, 49),
        (-180, 55, -165, 72), (-165, 55, -150, 72), (-150, 55, -130, 72),
    ],
    'FWS': [
        (-125, 42, -116, 49),
        (-104, 25, -95, 36), (-95, 25, -82, 36),
        (-82, 36, -66, 49),
        (-150, 55, -130, 72),
    ],
    'ST': [
        (-116, 42, -104, 49), (-116, 32, -104, 42),
        (-104, 25, -95, 40),
        (-95, 36, -82, 49), (-95, 24, -82, 36),
        (-82, 36, -66, 49),
    ],
    'BIA': [
        (-116, 42, -104, 49),
        (-104, 40, -95, 49),
        (-95, 24, -82, 36),
        (-180, 55, -130, 72),
    ],
    'DOD': [
        (-125, 32, -116, 42),
        (-104, 40, -95, 49),
        (-82, 36, -66, 49),
    ],
}

for agency, boxes in RETRY.items():
    cache_file = os.path.join(OUT_DIR, f"sma-{agency.lower()}.geojson")
    
    # Load existing data
    existing = {"type": "FeatureCollection", "features": []}
    if os.path.exists(cache_file):
        with open(cache_file) as f:
            existing = json.load(f)
    
    seen_ids = set()
    for feat in existing['features']:
        oid = feat['properties'].get('OBJECTID', id(feat))
        seen_ids.add(oid)
    
    orig_count = len(existing['features'])
    print(f"\n=== {agency} (retry, {orig_count} existing) ===")
    
    for xmin, ymin, xmax, ymax in boxes:
        bbox = f"{xmin},{ymin},{xmax},{ymax}"
        url = (
            f"{BASE}?where=ADMIN_AGENCY_CODE='{agency}'"
            f"&geometry={bbox}&geometryType=esriGeometryEnvelope&inSR=4326"
            f"&outFields=ADMIN_AGENCY_CODE,ADMIN_UNIT_NAME,OBJECTID"
            f"&outSR=4326&f=geojson&resultRecordCount=5000"
        )
        
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'TrailCamp/1.0'})
            resp = urllib.request.urlopen(req, timeout=120)
            data = json.loads(resp.read())
            features = data.get('features', [])
            
            new = 0
            for feat in features:
                oid = feat['properties'].get('OBJECTID', id(feat))
                if oid not in seen_ids:
                    seen_ids.add(oid)
                    feat['properties']['agency'] = agency
                    existing['features'].append(feat)
                    new += 1
            
            if new > 0:
                print(f"  ({xmin},{ymin})-({xmax},{ymax}): +{new}")
            time.sleep(1.5)
        except Exception as e:
            err = str(e)[:50]
            print(f"  ({xmin},{ymin})-({xmax},{ymax}): ✗ {err}")
            time.sleep(3)
    
    added = len(existing['features']) - orig_count
    if added > 0:
        with open(cache_file, 'w') as f:
            json.dump(existing, f)
        size = os.path.getsize(cache_file) / 1024 / 1024
        print(f"  → +{added} new, total {len(existing['features'])} features, {size:.1f} MB")

# Recombine all
all_features = []
for agency in ['BLM', 'USFS', 'NPS', 'FWS', 'ST', 'USBR', 'BIA', 'DOD']:
    cf = os.path.join(OUT_DIR, f"sma-{agency.lower()}.geojson")
    if os.path.exists(cf):
        with open(cf) as f:
            d = json.load(f)
            for feat in d['features']:
                if 'agency' not in feat.get('properties', {}):
                    feat['properties']['agency'] = agency
                all_features.append(feat)

combined_file = os.path.join(OUT_DIR, "sma-combined.geojson")
with open(combined_file, 'w') as f:
    json.dump({"type": "FeatureCollection", "features": all_features}, f)
size = os.path.getsize(combined_file) / 1024 / 1024
print(f"\n✅ Combined: {len(all_features)} features, {size:.1f} MB")
