#!/usr/bin/env python3
"""
Phase 1: Enrich existing TrailCamp locations with OSM tag data.
Matches by source_id (for OSM-sourced locations) or by proximity (lat/lon).
Updates DB directly.
"""
import json
import urllib.request
import urllib.parse
import time
import sys

try:
    import psycopg2
except ImportError:
    print("Installing psycopg2-binary...")
    import subprocess
    subprocess.run([sys.executable, '-m', 'pip', 'install', 'psycopg2-binary', '--break-system-packages', '-q'])
    import psycopg2

DB_URL = "postgresql://postgres.iagfjotzcuazdowksxwy:beC67JY5HFqTsnHq@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

# First, let's see what columns we need to add
NEW_COLUMNS = {
    # Amenities (boolean-ish)
    'has_toilets': 'INTEGER',
    'toilet_type': 'TEXT',       # flush, pit, composting, portable
    'has_showers': 'INTEGER',
    'has_electric': 'INTEGER',
    'has_wifi': 'INTEGER',
    'has_fire_ring': 'INTEGER',
    'pet_friendly': 'INTEGER',
    'is_reservable': 'INTEGER',
    'is_backcountry': 'INTEGER',
    'tents_allowed': 'INTEGER',
    'rvs_allowed': 'INTEGER',
    
    # Info
    'phone': 'TEXT',
    'website': 'TEXT',
    'email': 'TEXT',
    'operator_name': 'TEXT',
    'brand_name': 'TEXT',
    'elevation_ft': 'INTEGER',
    'fee_info': 'TEXT',          # "free", "$10/night", "yes", "no"  
    'access_type': 'TEXT',       # public, permissive, private, customers
    'surface_type': 'TEXT',      # paved, gravel, dirt, sand, mud
    'num_sites': 'INTEGER',      # campsite capacity
    
    # Trail-specific
    'vehicles_allowed': 'TEXT',  # JSON: {"motorcycle":true,"atv":true,"4wd":true}
    'trail_surface': 'TEXT',     # gravel, dirt, sand, rock
    'route_type': 'TEXT',        # loop, out-and-back, point-to-point
    'sac_scale': 'TEXT',         # T1-T6 hiking difficulty
    'mtb_scale': 'TEXT',         # 0-6 mountain biking difficulty  
    'track_type': 'TEXT',        # grade1-grade5 (road quality)
    
    # Climbing
    'climbing_routes': 'INTEGER',
    'climbing_grade_min': 'TEXT',
    'climbing_grade_max': 'TEXT',
    'climbing_rock_type': 'TEXT',
    
    # Water sports
    'water_body_type': 'TEXT',   # lake, river, stream, ocean
    'rapid_grade': 'TEXT',       # I-V for kayaking
    
    # Enrichment metadata
    'osm_tags_json': 'TEXT',     # Full OSM tags as JSON (for future parsing)
    'enriched_at': 'TIMESTAMP WITH TIME ZONE',
}

def add_columns_if_missing(conn):
    """Add new columns to locations table."""
    cur = conn.cursor()
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'locations'")
    existing = {row[0] for row in cur.fetchall()}
    
    added = 0
    for col, dtype in NEW_COLUMNS.items():
        if col not in existing:
            cur.execute(f'ALTER TABLE locations ADD COLUMN "{col}" {dtype}')
            added += 1
    
    conn.commit()
    print(f"✅ Added {added} new columns (skipped {len(NEW_COLUMNS) - added} existing)")
    return added

def get_locations_by_region(conn, south, west, north, east):
    """Get our locations in a bounding box with their source IDs."""
    cur = conn.cursor()
    cur.execute("""
        SELECT id, name, latitude, longitude, category, source, source_id, enriched_at
        FROM locations 
        WHERE latitude BETWEEN %s AND %s 
        AND longitude BETWEEN %s AND %s
        AND enriched_at IS NULL
    """, (south, north, west, east))
    return cur.fetchall()

def query_overpass_region(south, west, north, east):
    """Query Overpass for all useful POIs in a bounding box."""
    query = f"""
[out:json][timeout:120];
(
  node["tourism"~"camp_site|caravan_site|viewpoint|wilderness_hut|picnic_site|information"]({south},{west},{north},{east});
  node["amenity"~"fuel|parking|drinking_water|toilets|waste_disposal|sanitary_dump_station|shower"]({south},{west},{north},{east});
  node["leisure"~"fishing|swimming_area|marina|slipway|firepit"]({south},{west},{north},{east});
  node["sport"~"climbing|fishing|kayak|canoe|swimming"]({south},{west},{north},{east});
  node["highway"="trailhead"]({south},{west},{north},{east});
  node["natural"~"beach|spring|hot_spring|cave_entrance|peak"]({south},{west},{north},{east});
  way["highway"~"path|track|bridleway"]["name"]({south},{west},{north},{east});
);
out tags center;
"""
    url = "https://overpass-api.de/api/interpreter"
    data = f"data={urllib.parse.quote(query)}"
    req = urllib.request.Request(url, data=data.encode(), headers={'Content-Type': 'application/x-www-form-urlencoded'})
    resp = urllib.request.urlopen(req, timeout=180)
    return json.loads(resp.read())

def haversine_km(lat1, lon1, lat2, lon2):
    """Distance in km between two points."""
    import math
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.asin(min(1, math.sqrt(a)))

def extract_enrichment_from_tags(tags, category):
    """Convert OSM tags to our DB column values."""
    updates = {}
    
    # Description
    desc = tags.get('description', '')
    if desc and len(desc) > 5:
        updates['description'] = desc
    
    # Contact
    if 'website' in tags: updates['website'] = tags['website']
    elif 'url' in tags: updates['website'] = tags['url']
    if 'phone' in tags: updates['phone'] = tags['phone']
    if 'email' in tags: updates['email'] = tags['email']
    
    # Operator / Brand
    if 'operator' in tags: updates['operator_name'] = tags['operator']
    if 'brand' in tags: updates['brand_name'] = tags['brand']
    
    # Elevation
    if 'ele' in tags:
        try:
            ele_m = float(tags['ele'])
            updates['elevation_ft'] = int(ele_m * 3.281)
        except: pass
    
    # Fee
    fee = tags.get('fee', '')
    fee_amount = tags.get('fee:amount', tags.get('charge', ''))
    if fee_amount:
        updates['fee_info'] = fee_amount
    elif fee:
        updates['fee_info'] = fee
    
    # Access
    if 'access' in tags: updates['access_type'] = tags['access']
    
    # Hours
    if 'opening_hours' in tags: updates['hours'] = tags['opening_hours']
    
    # Surface
    surface = tags.get('surface', '')
    if surface: updates['surface_type'] = surface
    
    # Toilets
    if 'toilets:disposal' in tags:
        updates['has_toilets'] = 1
        updates['toilet_type'] = tags['toilets:disposal']
    elif tags.get('toilets') == 'yes' or tags.get('amenity') == 'toilets':
        updates['has_toilets'] = 1
    
    # Drinking water
    if tags.get('drinking_water') == 'yes':
        updates['water_available'] = 1
    
    # Showers
    if tags.get('shower') == 'yes' or tags.get('amenity') == 'shower':
        updates['has_showers'] = 1
    
    # Electric
    if tags.get('power_supply') and tags['power_supply'] != 'no':
        updates['has_electric'] = 1
    
    # Wifi
    if tags.get('internet_access') and tags['internet_access'] != 'no':
        updates['has_wifi'] = 1
    
    # Fire
    if tags.get('openfire') == 'yes' or tags.get('fireplace') == 'yes' or tags.get('fire') == 'yes':
        updates['has_fire_ring'] = 1
    
    # Pets
    if tags.get('dog') == 'yes' or tags.get('pets') == 'yes':
        updates['pet_friendly'] = 1
    
    # Reservable
    if tags.get('reservation'):
        updates['is_reservable'] = 1 if tags['reservation'] in ('yes', 'required', 'recommended') else 0
    
    # Backcountry
    if tags.get('backcountry') == 'yes':
        updates['is_backcountry'] = 1
    
    # Tents / RVs
    if tags.get('tents') == 'yes': updates['tents_allowed'] = 1
    if tags.get('caravans') == 'yes': updates['rvs_allowed'] = 1
    
    # Capacity
    if 'capacity' in tags:
        try: updates['num_sites'] = int(tags['capacity'])
        except: pass
    
    # Trail difficulty
    if 'sac_scale' in tags: updates['sac_scale'] = tags['sac_scale']
    if 'mtb:scale' in tags: updates['mtb_scale'] = tags['mtb:scale']
    if 'tracktype' in tags: updates['track_type'] = tags['tracktype']
    
    # Vehicles allowed
    vehicles = {}
    if tags.get('motorcycle') in ('yes', 'designated'): vehicles['motorcycle'] = True
    if tags.get('atv') in ('yes', 'designated'): vehicles['atv'] = True
    if tags.get('4wd_only') == 'yes': vehicles['4wd'] = True
    if tags.get('horse') in ('yes', 'designated'): vehicles['horse'] = True
    if tags.get('bicycle') in ('yes', 'designated'): vehicles['bicycle'] = True
    if vehicles:
        updates['vehicles_allowed'] = json.dumps(vehicles)
    
    # Trail distance
    for key in ('distance', 'length'):
        if key in tags:
            try:
                val = tags[key].replace(' km', '').replace(' mi', '').replace('km', '').replace('mi', '')
                dist = float(val)
                if 'mi' in tags[key]:
                    updates['distance_miles'] = dist
                else:
                    updates['distance_miles'] = round(dist * 0.621, 1)
            except: pass
    
    # Climbing
    if 'climbing:routes' in tags:
        try: updates['climbing_routes'] = int(tags['climbing:routes'])
        except: pass
    if 'climbing:grade:yds_class' in tags: updates['climbing_grade_min'] = tags['climbing:grade:yds_class']
    if 'climbing:rock' in tags: updates['climbing_rock_type'] = tags['climbing:rock']
    
    # Water body type
    for key in ('natural', 'water', 'waterway'):
        if key in tags and tags[key] in ('lake', 'river', 'stream', 'pond', 'reservoir', 'ocean', 'bay'):
            updates['water_body_type'] = tags[key]
            break
    
    # Rapid grade
    if 'whitewater:rapid_grade' in tags:
        updates['rapid_grade'] = tags['whitewater:rapid_grade']
    
    # Cost per night from fee info
    if 'fee_info' in updates and updates['fee_info'] not in ('yes', 'no'):
        try:
            cost_str = updates['fee_info'].replace('$', '').replace('/night', '').strip()
            cost = float(cost_str)
            updates['cost_per_night'] = cost
        except: pass
    
    # Store full tags as JSON for future use
    updates['osm_tags_json'] = json.dumps(tags)
    
    return updates

def match_and_update(conn, our_locations, osm_elements):
    """Match OSM elements to our locations and update DB."""
    cur = conn.cursor()
    
    # Build spatial index of OSM elements
    osm_by_id = {}
    osm_by_coords = []
    for el in osm_elements:
        osm_id = f"node/{el['id']}" if el['type'] == 'node' else f"way/{el['id']}"
        osm_by_id[osm_id] = el
        
        lat = el.get('lat', el.get('center', {}).get('lat'))
        lon = el.get('lon', el.get('center', {}).get('lon'))
        if lat and lon:
            osm_by_coords.append((lat, lon, el))
    
    matched = 0
    updated = 0
    
    for loc_id, name, lat, lon, category, source, source_id, enriched_at in our_locations:
        if enriched_at:
            continue
            
        # Try matching by source_id first (exact match)
        osm_el = None
        if source_id and source_id in osm_by_id:
            osm_el = osm_by_id[source_id]
        
        # Fallback: match by proximity (within 100m) + name similarity
        if not osm_el:
            best_dist = 0.1  # 100m max
            for olat, olon, oel in osm_by_coords:
                d = haversine_km(lat, lon, olat, olon)
                if d < best_dist:
                    oname = oel.get('tags', {}).get('name', '')
                    if oname and name and (oname.lower() in name.lower() or name.lower() in oname.lower()):
                        best_dist = d
                        osm_el = oel
        
        if osm_el:
            matched += 1
            tags = osm_el.get('tags', {})
            updates = extract_enrichment_from_tags(tags, category)
            
            if updates:
                # Build UPDATE query
                set_parts = []
                values = []
                for col, val in updates.items():
                    set_parts.append(f'"{col}" = %s')
                    values.append(val)
                
                set_parts.append('"enriched_at" = NOW()')
                values.append(loc_id)
                
                sql = f"UPDATE locations SET {', '.join(set_parts)} WHERE id = %s"
                cur.execute(sql, values)
                updated += 1
    
    conn.commit()
    return matched, updated

def main():
    conn = psycopg2.connect(DB_URL)
    
    # Step 1: Add new columns
    add_columns_if_missing(conn)
    
    # Step 2: Process by region
    regions = [
        ('pacific_nw', 42, -125, 49, -116),
        ('pacific_sw', 32, -125, 42, -116),
        ('mountain_nw', 42, -116, 49, -104),
        ('mountain_sw', 32, -116, 42, -104),
        ('plains_n', 40, -104, 49, -95),
        ('plains_s', 25, -104, 40, -95),
        ('midwest_n', 40, -95, 49, -82),
        ('midwest_s', 30, -95, 40, -82),
        ('east_n', 37, -82, 49, -66),
        ('east_s', 24, -82, 37, -66),
    ]
    
    total_matched = 0
    total_updated = 0
    
    for name, south, west, north, east in regions:
        # Get our locations in this region
        our_locs = get_locations_by_region(conn, south, west, north, east)
        if not our_locs:
            print(f"\n{name}: no unenriched locations")
            continue
        
        print(f"\n=== {name}: {len(our_locs)} locations to enrich ===")
        
        try:
            result = query_overpass_region(south, west, north, east)
            osm_elements = result.get('elements', [])
            print(f"  OSM: {len(osm_elements)} elements")
            
            matched, updated = match_and_update(conn, our_locs, osm_elements)
            total_matched += matched
            total_updated += updated
            print(f"  Matched: {matched}, Updated: {updated}")
            
            time.sleep(15)  # Rate limit
        except Exception as e:
            print(f"  ✗ Error: {str(e)[:100]}")
            time.sleep(30)
    
    print(f"\n{'='*50}")
    print(f"✅ DONE: {total_matched} matched, {total_updated} updated")
    
    # Show enrichment stats
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM locations WHERE enriched_at IS NOT NULL")
    enriched = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM locations")
    total = cur.fetchone()[0]
    print(f"   Enriched: {enriched}/{total} ({100*enriched//total}%)")
    
    cur.execute("""
        SELECT 
            COUNT(*) FILTER (WHERE description IS NOT NULL AND description != '') as has_desc,
            COUNT(*) FILTER (WHERE website IS NOT NULL) as has_web,
            COUNT(*) FILTER (WHERE operator_name IS NOT NULL) as has_operator,
            COUNT(*) FILTER (WHERE has_toilets = 1) as has_toilets,
            COUNT(*) FILTER (WHERE fee_info IS NOT NULL) as has_fee,
            COUNT(*) FILTER (WHERE elevation_ft IS NOT NULL) as has_ele,
            COUNT(*) FILTER (WHERE vehicles_allowed IS NOT NULL) as has_vehicles,
            COUNT(*) FILTER (WHERE sac_scale IS NOT NULL) as has_sac,
            COUNT(*) FILTER (WHERE climbing_routes IS NOT NULL) as has_climbing
        FROM locations WHERE enriched_at IS NOT NULL
    """)
    row = cur.fetchone()
    print(f"\n   Fields populated:")
    labels = ['description', 'website', 'operator', 'toilets', 'fee', 'elevation', 'vehicles', 'sac_scale', 'climbing']
    for label, val in zip(labels, row):
        print(f"     {label:15s}: {val}")
    
    conn.close()

if __name__ == '__main__':
    main()
