#!/usr/bin/env python3
"""
TrailCamp Hobby Location Importer
Imports locations from OpenStreetMap via Overpass API for all hobby categories.
Usage: python3 import-hobbies.py <hobby> [--dry-run]

Hobbies: hiking, mtb, fishing, boating, kayaking, hunting, horseback, climbing, swimming, offroad
"""

import sys, json, time, urllib.request, urllib.parse, psycopg2, math

DB_URL = "postgresql://postgres.iagfjotzcuazdowksxwy:beC67JY5HFqTsnHq@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# US split into regions (Overpass can't handle full US in one query)
US_REGIONS = [
    ("NE-North",      "42.0,-82.0,47.5,-66.9"),
    ("NE-South",      "37.0,-82.0,42.0,-66.9"),
    ("SE-East",       "24.4,-83.0,37.0,-75.0"),
    ("SE-West",       "24.4,-91.5,37.0,-83.0"),
    ("MW-North",      "42.0,-97.5,49.4,-80.5"),
    ("MW-South",      "36.0,-97.5,42.0,-80.5"),
    ("SC-East",       "25.8,-97.0,37.0,-88.0"),
    ("SC-West",       "25.8,-106.6,37.0,-97.0"),
    ("MW-North-RM",   "42.0,-112.0,49.0,-102.0"),
    ("MW-South-RM",   "31.3,-112.0,42.0,-102.0"),
    ("MW-West-RM",    "31.3,-117.0,49.0,-112.0"),
    ("PAC-North",     "42.0,-125.0,49.0,-114.0"),
    ("PAC-South",     "32.5,-125.0,42.0,-114.0"),
    ("Alaska",        "51.0,-180.0,71.5,-130.0"),
    ("Hawaii",        "18.9,-160.3,22.3,-154.8"),
]

# US bounding box (continental + Alaska + Hawaii handled separately)
US_BBOX = "24.396308,-125.0,49.384358,-66.93457"  # south,west,north,east

HOBBY_CONFIGS = {
    "hiking": {
        "category": "hiking",
        "queries": [
            '[out:json][timeout:300];(relation["route"="hiking"]["name"]({bbox});way["highway"="path"]["sac_scale"]["name"]({bbox});way["highway"="footway"]["name"]["sac_scale"]({bbox});relation["route"="foot"]["name"]({bbox}););out center tags;',
        ],
        "sub_type_map": {
            "sac_scale": {
                "hiking": "Easy Trail",
                "mountain_hiking": "Moderate Trail",
                "demanding_mountain_hiking": "Difficult Trail",
                "alpine_hiking": "Alpine Trail",
                "demanding_alpine_hiking": "Expert Alpine",
                "difficult_alpine_hiking": "Extreme Alpine",
            }
        },
        "extract_fields": lambda tags: {
            "difficulty": _sac_to_difficulty(tags.get("sac_scale", "")),
            "distance_miles": _km_to_miles(tags.get("distance", tags.get("length", ""))),
            "elevation_gain_ft": _m_to_ft(tags.get("ascent", tags.get("ele", ""))),
            "trail_types": json.dumps([t for t in [tags.get("surface", ""), tags.get("trail_visibility", "")] if t]),
            "sub_type": tags.get("sac_scale", "Trail"),
            "best_season": _extract_season(tags),
        }
    },
    "mtb": {
        "category": "mtb",
        "queries": [
            '[out:json][timeout:300];(relation["route"="mtb"]["name"]({bbox});way["mtb:scale"]["name"]({bbox});node["sport"~"cycling|mountain_biking"]["name"]({bbox});way["sport"~"cycling|mountain_biking"]["name"]({bbox}););out center tags;',
        ],
        "extract_fields": lambda tags: {
            "difficulty": _mtb_to_difficulty(tags.get("mtb:scale", tags.get("mtb:scale:imba", ""))),
            "distance_miles": _km_to_miles(tags.get("distance", tags.get("length", ""))),
            "sub_type": "Mountain Biking",
            "trail_types": json.dumps(["Mountain Biking"]),
        }
    },
    "fishing": {
        "category": "fishing",
        "queries": [
            '[out:json][timeout:300];(node["leisure"="fishing"]["name"]({bbox});way["leisure"="fishing"]["name"]({bbox});node["sport"="fishing"]["name"]({bbox});way["sport"="fishing"]["name"]({bbox});node["fishing"~"yes|designated|permitted"]["name"]({bbox}););out center tags;',
        ],
        "extract_fields": lambda tags: {
            "sub_type": _fishing_subtype(tags),
            "permit_required": 1 if tags.get("fee") == "yes" else 0,
            "water_available": 1,
        }
    },
    "boating": {
        "category": "boating",
        "queries": [
            '[out:json][timeout:300];(node["leisure"="slipway"]["name"]({bbox});way["leisure"="slipway"]["name"]({bbox});node["leisure"="marina"]["name"]({bbox});way["leisure"="marina"]["name"]({bbox});node["seamark:type"="small_craft_facility"]["name"]({bbox}););out center tags;',
            # Unnamed boat ramps (slipways are often unnamed but useful)
            '[out:json][timeout:300];(node["leisure"="slipway"]({bbox});way["leisure"="slipway"]({bbox}););out center tags;',
        ],
        "extract_fields": lambda tags: {
            "sub_type": "Marina" if tags.get("leisure") == "marina" else "Boat Ramp",
            "water_available": 1,
            "hours": tags.get("opening_hours", None),
        }
    },
    "kayaking": {
        "category": "kayaking",
        "queries": [
            '[out:json][timeout:300];(node["sport"~"canoe|kayak"]["name"]({bbox});way["sport"~"canoe|kayak"]["name"]({bbox});node["canoe"~"put_in|egress|portage"]["name"]({bbox});relation["route"="canoe"]["name"]({bbox});node["whitewater"~"put_in|egress"]["name"]({bbox}););out center tags;',
            # Unnamed put-ins
            '[out:json][timeout:300];(node["canoe"~"put_in|egress"]({bbox});node["whitewater"~"put_in|egress"]({bbox}););out center tags;',
        ],
        "extract_fields": lambda tags: {
            "sub_type": _kayak_subtype(tags),
            "difficulty": tags.get("whitewater:rapid_grade", tags.get("rapids", None)),
            "water_available": 1,
            "distance_miles": _km_to_miles(tags.get("distance", "")),
        }
    },
    "hunting": {
        "category": "hunting",
        "queries": [
            '[out:json][timeout:300];(node["hunting"~"yes|designated"]["name"]({bbox});way["hunting"~"yes|designated"]["name"]({bbox});relation["hunting"~"yes|designated"]["name"]({bbox});way["leisure"="hunting_stand"]["name"]({bbox});node["sport"="shooting"]["name"]({bbox});way["sport"="shooting"]["name"]({bbox}););out center tags;',
        ],
        "extract_fields": lambda tags: {
            "sub_type": "Shooting Range" if tags.get("sport") == "shooting" else "Public Hunting Land",
            "permit_required": 1,
            "best_season": _extract_season(tags),
        }
    },
    "horseback": {
        "category": "horseback",
        "queries": [
            '[out:json][timeout:300];(way["highway"="bridleway"]["name"]({bbox});way["horse"="designated"]["name"]({bbox});relation["route"="horse"]["name"]({bbox});node["sport"="equestrian"]["name"]({bbox});way["sport"="equestrian"]["name"]({bbox}););out center tags;',
        ],
        "extract_fields": lambda tags: {
            "sub_type": "Equestrian Trail",
            "difficulty": _horse_difficulty(tags),
            "distance_miles": _km_to_miles(tags.get("distance", tags.get("length", ""))),
        }
    },
    "climbing": {
        "category": "climbing",
        "queries": [
            '[out:json][timeout:300];(node["sport"="climbing"]["name"]({bbox});way["sport"="climbing"]["name"]({bbox});node["climbing"~"sport|boulder|trad|ice"]["name"]({bbox});way["natural"="cliff"]["climbing"]["name"]({bbox}););out center tags;',
        ],
        "extract_fields": lambda tags: {
            "sub_type": _climbing_subtype(tags),
            "difficulty": tags.get("climbing:grade:yds", tags.get("climbing:grade:french", None)),
        }
    },
    "swimming": {
        "category": "swimming",
        "queries": [
            '[out:json][timeout:300];(node["sport"="swimming"]["name"]({bbox});way["sport"="swimming"]["name"]({bbox});node["leisure"="swimming_area"]["name"]({bbox});way["leisure"="swimming_area"]["name"]({bbox});node["leisure"="beach_resort"]["name"]({bbox});way["natural"="beach"]["name"]["swimming"]({bbox}););out center tags;',
        ],
        "extract_fields": lambda tags: {
            "sub_type": "Beach" if tags.get("natural") == "beach" else "Swimming Area",
            "water_available": 1,
            "hours": tags.get("opening_hours", None),
        }
    },
    "offroad": {
        "category": "offroad",
        "queries": [
            '[out:json][timeout:300];(way["highway"="track"]["4wd_only"~"yes|recommended"]["name"]({bbox});way["highway"="track"]["tracktype"~"grade4|grade5"]["name"]({bbox});node["sport"="4wd"]["name"]({bbox});way["sport"="4wd"]["name"]({bbox}););out center tags;',
        ],
        "extract_fields": lambda tags: {
            "sub_type": "4x4 Trail",
            "difficulty": _offroad_difficulty(tags),
            "distance_miles": _km_to_miles(tags.get("distance", tags.get("length", ""))),
            "trail_types": json.dumps(["4x4", "Off-Road"]),
        }
    },
}

# ─── Helper Functions ─────────────────────────────────────────────────────────

def _km_to_miles(val):
    if not val: return None
    try:
        num = float(str(val).replace("km", "").replace("mi", "").strip())
        if "mi" in str(val): return round(num, 1)
        return round(num * 0.621371, 1)
    except: return None

def _m_to_ft(val):
    if not val: return None
    try: return int(float(val) * 3.28084)
    except: return None

def _sac_to_difficulty(sac):
    return {"hiking": "Easy", "mountain_hiking": "Moderate", "demanding_mountain_hiking": "Difficult",
            "alpine_hiking": "Expert", "demanding_alpine_hiking": "Expert", "difficult_alpine_hiking": "Extreme"
    }.get(sac, None)

def _mtb_to_difficulty(scale):
    if not scale: return None
    try:
        n = int(scale[0]) if scale else 0
        return {0: "Easy", 1: "Easy", 2: "Moderate", 3: "Difficult", 4: "Expert", 5: "Extreme"}.get(n, None)
    except: return None

def _fishing_subtype(tags):
    if tags.get("waterway") == "river" or "river" in tags.get("name", "").lower(): return "River Fishing"
    if tags.get("natural") == "water" or "lake" in tags.get("name", "").lower(): return "Lake Fishing"
    if "pier" in tags.get("name", "").lower() or "surf" in tags.get("name", "").lower(): return "Shore Fishing"
    return "Fishing Spot"

def _kayak_subtype(tags):
    if tags.get("canoe") == "put_in" or tags.get("whitewater") == "put_in": return "Put-In"
    if tags.get("canoe") == "egress" or tags.get("whitewater") == "egress": return "Take-Out"
    if tags.get("canoe") == "portage": return "Portage"
    if tags.get("whitewater:rapid_grade"): return "Whitewater"
    return "Paddle Access"

def _climbing_subtype(tags):
    c = tags.get("climbing", tags.get("climbing:sport", ""))
    if "boulder" in c: return "Bouldering"
    if "ice" in c: return "Ice Climbing"
    if "trad" in c: return "Trad Climbing"
    if "sport" in c: return "Sport Climbing"
    return "Climbing Area"

def _horse_difficulty(tags):
    surface = tags.get("surface", "")
    if surface in ("paved", "asphalt", "concrete"): return "Easy"
    if surface in ("gravel", "fine_gravel", "compacted"): return "Moderate"
    if surface in ("dirt", "ground", "earth", "mud"): return "Moderate"
    return None

def _offroad_difficulty(tags):
    tt = tags.get("tracktype", "")
    fwd = tags.get("4wd_only", "")
    if tt == "grade5" or fwd == "yes": return "Difficult"
    if tt == "grade4": return "Moderate"
    if tt == "grade3": return "Easy"
    return "Moderate"

def _extract_season(tags):
    s = tags.get("opening_hours", "")
    if "Sep" in s or "Oct" in s or "Nov" in s: return "Fall"
    if "Jun" in s or "Jul" in s or "Aug" in s: return "Summer"
    return None

def _get_center(element):
    """Extract lat/lon from an OSM element (node, way with center, relation with center)."""
    if element.get("type") == "node":
        return element.get("lat"), element.get("lon")
    center = element.get("center", {})
    return center.get("lat"), center.get("lon")

def _generate_name(tags, element_type):
    """Generate a name for unnamed features."""
    name = tags.get("name", "")
    if name: return name
    # For unnamed slipways/put-ins, use nearby info
    ref = tags.get("ref", "")
    water = tags.get("waterway", tags.get("water", ""))
    if ref: return f"Boat Ramp {ref}"
    if water: return f"Access Point ({water})"
    return None  # Skip truly unnamed features

def _dedup_distance(lat1, lon1, lat2, lon2):
    """Haversine distance in meters for dedup."""
    R = 6371000
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

# ─── Main Import Logic ────────────────────────────────────────────────────────

def query_overpass(query):
    """Query Overpass API with retries."""
    data = urllib.parse.urlencode({"data": query}).encode()
    for attempt in range(3):
        try:
            req = urllib.request.Request(OVERPASS_URL, data=data, headers={"User-Agent": "TrailCamp/1.0"})
            with urllib.request.urlopen(req, timeout=360) as resp:
                return json.loads(resp.read())
        except Exception as e:
            print(f"  ⚠️ Overpass attempt {attempt+1} failed: {e}", flush=True)
            if attempt < 2:
                wait = (attempt + 1) * 30
                print(f"  Retrying in {wait}s...", flush=True)
                time.sleep(wait)
    return None

def import_hobby(hobby_name, dry_run=False):
    config = HOBBY_CONFIGS.get(hobby_name)
    if not config:
        print(f"Unknown hobby: {hobby_name}")
        print(f"Available: {', '.join(HOBBY_CONFIGS.keys())}")
        return

    category = config["category"]
    print(f"\n{'='*60}", flush=True)
    print(f"Importing: {hobby_name} (category: {category})", flush=True)
    print(f"{'='*60}", flush=True)

    # Collect all elements from all queries across all US regions
    all_elements = []
    for region_name, bbox in US_REGIONS:
        for i, query_template in enumerate(config["queries"]):
            query = query_template.replace("{bbox}", bbox)
            print(f"\n  [{region_name}] Query {i+1}/{len(config['queries'])}...", flush=True)
            result = query_overpass(query)
            if not result:
                print(f"  ❌ [{region_name}] Query {i+1} failed", flush=True)
                time.sleep(15)
                continue
            elements = result.get("elements", [])
            print(f"  [{region_name}] Found {len(elements)} elements", flush=True)
            all_elements.extend(elements)
            time.sleep(5)  # Rate limit between queries

    if not all_elements:
        print(f"\n❌ No data found for {hobby_name}", flush=True)
        return

    # Deduplicate by OSM ID
    seen_osm_ids = set()
    unique_elements = []
    for el in all_elements:
        osm_id = f"{el['type']}/{el['id']}"
        if osm_id not in seen_osm_ids:
            seen_osm_ids.add(osm_id)
            unique_elements.append(el)

    print(f"\n  {len(unique_elements)} unique elements after OSM ID dedup", flush=True)

    # Process elements into locations
    locations_to_insert = []
    skipped_no_name = 0
    skipped_no_coords = 0
    
    for el in unique_elements:
        tags = el.get("tags", {})
        lat, lon = _get_center(el)
        
        if not lat or not lon:
            skipped_no_coords += 1
            continue

        name = _generate_name(tags, el["type"])
        if not name:
            skipped_no_name += 1
            continue

        # Extract hobby-specific fields
        fields = config["extract_fields"](tags)
        
        loc = {
            "name": name,
            "description": tags.get("description", tags.get("note", None)),
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "category": category,
            "sub_type": fields.get("sub_type"),
            "source": "osm",
            "source_id": f"{el['type']}/{el['id']}",
            "difficulty": fields.get("difficulty"),
            "distance_miles": fields.get("distance_miles"),
            "elevation_gain_ft": fields.get("elevation_gain_ft"),
            "trail_types": fields.get("trail_types"),
            "best_season": fields.get("best_season"),
            "hours": fields.get("hours"),
            "permit_required": fields.get("permit_required"),
            "water_available": fields.get("water_available"),
            "water_nearby": fields.get("water_nearby"),
            "external_links": json.dumps([tags["website"]]) if tags.get("website") else None,
        }
        locations_to_insert.append(loc)

    print(f"  {len(locations_to_insert)} locations to insert", flush=True)
    print(f"  Skipped: {skipped_no_name} no name, {skipped_no_coords} no coords", flush=True)

    if dry_run:
        print(f"\n  [DRY RUN] Would insert {len(locations_to_insert)} locations", flush=True)
        for loc in locations_to_insert[:10]:
            print(f"    {loc['name']} ({loc['sub_type']}) @ {loc['latitude']},{loc['longitude']}", flush=True)
        return

    # Connect to DB and insert
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    # Get existing source_ids to avoid duplicates
    cur.execute("SELECT source_id FROM locations WHERE source = 'osm' AND category = %s", (category,))
    existing_ids = {row[0] for row in cur.fetchall()}
    print(f"  {len(existing_ids)} existing {category} locations in DB", flush=True)

    # Spatial dedup against ALL existing locations (500m radius)
    cur.execute("SELECT latitude, longitude FROM locations WHERE category = %s", (category,))
    existing_coords = [(float(row[0]), float(row[1])) for row in cur.fetchall()]

    inserted = 0
    skipped_dup = 0
    skipped_spatial = 0

    for loc in locations_to_insert:
        # Skip if source_id exists
        if loc["source_id"] in existing_ids:
            skipped_dup += 1
            continue

        # Spatial dedup (500m)
        too_close = False
        for elat, elon in existing_coords:
            if _dedup_distance(loc["latitude"], loc["longitude"], elat, elon) < 500:
                too_close = True
                break
        if too_close:
            skipped_spatial += 1
            continue

        try:
            cur.execute("""
                INSERT INTO locations (name, description, latitude, longitude, category, sub_type, 
                    source, source_id, difficulty, distance_miles, elevation_gain_ft, trail_types,
                    best_season, hours, permit_required, water_available, water_nearby, external_links,
                    visibility, created_at, updated_at)
                VALUES (%(name)s, %(description)s, %(latitude)s, %(longitude)s, %(category)s, %(sub_type)s,
                    %(source)s, %(source_id)s, %(difficulty)s, %(distance_miles)s, %(elevation_gain_ft)s, %(trail_types)s,
                    %(best_season)s, %(hours)s, %(permit_required)s, %(water_available)s, %(water_nearby)s, %(external_links)s,
                    'public', NOW(), NOW())
            """, loc)
            existing_coords.append((loc["latitude"], loc["longitude"]))
            inserted += 1
        except Exception as e:
            print(f"  ⚠️ Failed to insert {loc['name']}: {e}", flush=True)
            conn.rollback()
            continue

        if inserted % 500 == 0:
            conn.commit()
            print(f"  ... {inserted} inserted so far", flush=True)

    conn.commit()
    cur.close()
    conn.close()

    print(f"\n{'='*60}", flush=True)
    print(f"✅ {hobby_name} import complete!", flush=True)
    print(f"  Inserted: {inserted}", flush=True)
    print(f"  Skipped (duplicate source_id): {skipped_dup}", flush=True)
    print(f"  Skipped (spatial dedup <500m): {skipped_spatial}", flush=True)
    print(f"{'='*60}\n", flush=True)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 import-hobbies.py <hobby> [--dry-run]")
        print(f"Hobbies: {', '.join(HOBBY_CONFIGS.keys())}")
        sys.exit(1)

    hobby = sys.argv[1]
    dry_run = "--dry-run" in sys.argv

    if hobby == "all":
        for h in HOBBY_CONFIGS:
            import_hobby(h, dry_run)
            if not dry_run:
                print("Waiting 60s before next hobby...", flush=True)
                time.sleep(60)
    else:
        import_hobby(hobby, dry_run)
