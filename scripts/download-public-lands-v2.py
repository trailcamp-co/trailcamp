#!/usr/bin/env python3
"""Download public land boundaries by querying in regional bounding boxes."""
import urllib.request
import json
import os
import time

BASE = "https://gis.blm.gov/arcgis/rest/services/lands/BLM_Natl_SMA_LimitedScale/MapServer/1/query"
OUT_DIR = "/Users/nicosstrnad/Projects/trailcamp/data/padus"
os.makedirs(OUT_DIR, exist_ok=True)

AGENCIES = ['BLM', 'USFS', 'NPS', 'FWS', 'ST', 'USBR', 'BIA', 'DOD']

# US regions as bounding boxes (lon_min, lat_min, lon_max, lat_max)
REGIONS = {
    'pacific_nw': (-125, 42, -116, 49),
    'pacific_sw': (-125, 32, -116, 42),
    'mountain_nw': (-116, 42, -104, 49),
    'mountain_sw': (-116, 32, -104, 42),
    'plains_n': (-104, 40, -95, 49),
    'plains_s': (-104, 25, -95, 40),
    'midwest': (-95, 36, -82, 49),
    'southeast': (-95, 24, -75, 36),
    'northeast': (-82, 36, -66, 49),
    'alaska_w': (-180, 50, -150, 72),
    'alaska_e': (-150, 50, -130, 72),
}

all_features = []
seen_ids = set()

for agency in AGENCIES:
    agency_features = []
    cache_file = os.path.join(OUT_DIR, f"sma-{agency.lower()}.geojson")
    
    if os.path.exists(cache_file) and os.path.getsize(cache_file) > 1000:
        print(f"  ✓ {agency} cached")
        with open(cache_file) as f:
            d = json.load(f)
            for feat in d.get('features', []):
                feat['properties']['agency'] = agency
                all_features.append(feat)
        continue

    print(f"\n=== {agency} ===")
    
    for region_name, (xmin, ymin, xmax, ymax) in REGIONS.items():
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
                key = f"{agency}-{oid}"
                if key not in seen_ids:
                    seen_ids.add(key)
                    feat['properties']['agency'] = agency
                    agency_features.append(feat)
                    new += 1
            
            if new > 0:
                print(f"  {region_name}: +{new} features")
            time.sleep(1)
        except Exception as e:
            print(f"  {region_name}: ✗ {e}")
            time.sleep(3)
    
    # Save per-agency
    if agency_features:
        with open(cache_file, 'w') as f:
            json.dump({"type": "FeatureCollection", "features": agency_features}, f)
        size = os.path.getsize(cache_file) / 1024 / 1024
        print(f"  → Total: {len(agency_features)} features, {size:.1f} MB")
        all_features.extend(agency_features)

# Combine
combined_file = os.path.join(OUT_DIR, "sma-combined.geojson")
with open(combined_file, 'w') as f:
    json.dump({"type": "FeatureCollection", "features": all_features}, f)
total_size = os.path.getsize(combined_file) / 1024 / 1024
print(f"\n✅ DONE: {len(all_features)} features, {total_size:.1f} MB")
