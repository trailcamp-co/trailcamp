#!/usr/bin/env python3
"""
Phase 1: Re-query OSM for all available tags on our existing locations.
Enriches locations with description, amenities, difficulty, vehicles, etc.
"""
import json
import urllib.request
import urllib.parse
import time
import sys

DB_URL = "postgresql://postgres.iagfjotzcuazdowksxwy:beC67JY5HFqTsnHq@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

# Tags we want to extract from OSM for each category
DESIRED_TAGS = {
    # Universal
    'description', 'note', 'website', 'url', 'phone', 'email',
    'opening_hours', 'fee', 'fee:amount', 'charge',
    'access', 'operator', 'brand', 'ele', 'wheelchair',
    
    # Camping/Boondocking
    'drinking_water', 'toilets', 'toilets:disposal', 'shower',
    'power_supply', 'internet_access', 'fireplace', 'fire',
    'bbq', 'dog', 'pets', 'capacity', 'capacity:tents', 'capacity:caravans',
    'maxlength', 'maxstay', 'reservation', 'tents', 'caravans',
    'surface', 'lit', 'backcountry',
    
    # Trails (hiking/biking/riding)
    'sac_scale', 'mtb:scale', 'mtb:scale:imba', 'mtb:type',
    'trail_visibility', 'tracktype', 'incline',
    'distance', 'length', 'ascent', 'descent',
    'motorcycle', 'atv', 'vehicle', '4wd_only', 'horse', 'bicycle',
    'foot', 'oneway', 'roundtrip',
    
    # Fishing/Water
    'fish', 'species', 'water', 'natural', 'waterway',
    'sport', 'leisure',
    
    # Climbing
    'climbing:routes', 'climbing:grade:yds', 'climbing:grade:french',
    'climbing:grade:uiaa', 'climbing:rock', 'climbing:bolted',
    'climbing:length', 'height',
    
    # Kayaking
    'whitewater:rapid_grade', 'canoe', 'rapids',
    
    # Swimming
    'lifeguard', 'changing_room', 'supervised',
    
    # Overnight parking
    'fuel', 'fuel:diesel', 'shop', 'restaurant', 'amenity',
    'hgv', 'capacity:hgv', 'truck',
    'laundry', 'compressed_air',
    
    # Dump/Water stations  
    'sanitary_dump_station', 'water_point',
}

def query_overpass(bbox, tags_filter=""):
    """Query Overpass for nodes/ways with our desired tags in a bounding box."""
    south, west, north, east = bbox
    
    # Query all nodes and ways in the bbox that are tourism/amenity/leisure/sport related
    query = f"""
[out:json][timeout:120];
(
  node["tourism"~"camp_site|caravan_site|viewpoint|picnic_site|wilderness_hut|information"]({south},{west},{north},{east});
  node["amenity"~"fuel|parking|drinking_water|toilets|waste_disposal|sanitary_dump_station|shower"]({south},{west},{north},{east});
  node["leisure"~"fishing|swimming_area|marina|slipway|firepit"]({south},{west},{north},{east});
  node["sport"~"climbing|fishing|kayak|canoe|swimming|surfing|scuba_diving"]({south},{west},{north},{east});
  node["highway"="trailhead"]({south},{west},{north},{east});
  way["highway"~"path|track|bridleway"]["name"]({south},{west},{north},{east});
  node["natural"~"beach|spring|hot_spring|cave_entrance|peak"]({south},{west},{north},{east});
);
out tags center;
"""
    
    url = "https://overpass-api.de/api/interpreter"
    data = f"data={urllib.parse.quote(query)}"
    req = urllib.request.Request(url, data=data.encode(), 
                                 headers={'Content-Type': 'application/x-www-form-urlencoded'})
    resp = urllib.request.urlopen(req, timeout=180)
    return json.loads(resp.read())

def extract_enrichment(element):
    """Extract useful tags from an OSM element."""
    tags = element.get('tags', {})
    enriched = {}
    
    for tag in DESIRED_TAGS:
        if tag in tags:
            enriched[tag] = tags[tag]
    
    # Also grab the name for matching
    if 'name' in tags:
        enriched['osm_name'] = tags['name']
    
    # Get coordinates
    if element['type'] == 'node':
        enriched['lat'] = element['lat']
        enriched['lon'] = element['lon']
    elif 'center' in element:
        enriched['lat'] = element['center']['lat']
        enriched['lon'] = element['center']['lon']
    
    return enriched

def main():
    # US bounding boxes (split into regions to avoid timeout)
    regions = {
        'west': (32, -125, 49, -104),
        'central': (25, -104, 49, -85),
        'east': (24, -85, 49, -66),
        'alaska_w': (51, -180, 72, -150),
        'alaska_e': (51, -150, 72, -130),
    }
    
    all_elements = []
    
    for name, bbox in regions.items():
        print(f"\n=== Querying {name} ({bbox}) ===")
        try:
            result = query_overpass(bbox)
            elements = result.get('elements', [])
            print(f"  → {len(elements)} elements")
            
            enriched_count = 0
            for el in elements:
                enrichment = extract_enrichment(el)
                if len(enrichment) > 2:  # Has useful tags beyond just coords
                    all_elements.append(enrichment)
                    enriched_count += 1
            
            print(f"  → {enriched_count} with useful tags")
            time.sleep(15)  # Be nice to Overpass
            
        except Exception as e:
            print(f"  ✗ Error: {e}")
            time.sleep(30)
    
    # Save raw enrichment data
    outfile = "/Users/nicosstrnad/Projects/trailcamp/data/osm-enrichment.json"
    with open(outfile, 'w') as f:
        json.dump(all_elements, f)
    print(f"\n✅ Saved {len(all_elements)} enriched elements to {outfile}")
    
    # Show tag distribution
    tag_counts = {}
    for el in all_elements:
        for key in el:
            if key not in ('lat', 'lon', 'osm_name'):
                tag_counts[key] = tag_counts.get(key, 0) + 1
    
    print(f"\nTag distribution (top 30):")
    for tag, count in sorted(tag_counts.items(), key=lambda x: -x[1])[:30]:
        print(f"  {count:6d}  {tag}")

if __name__ == '__main__':
    main()
