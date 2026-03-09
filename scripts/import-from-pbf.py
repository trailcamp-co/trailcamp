#!/usr/bin/env python3
"""
TrailCamp Hobby Importer — Local PBF edition.
Reads a Geofabrik .osm.pbf file and imports locations directly. No API calls.
Usage: python3 import-from-pbf.py <hobby|all> [--dry-run]
"""
import sys, json, math, os, psycopg2, osmium

DB_URL = "postgresql://postgres.iagfjotzcuazdowksxwy:beC67JY5HFqTsnHq@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
PBF_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "us-latest.osm.pbf")

HOBBY_MATCHERS = {
    "mtb": {
        "category": "mtb",
        "match": lambda tags: (
            tags.get("route") == "mtb" or
            "mtb:scale" in tags or
            "mountain_biking" in tags.get("sport", "") or
            (tags.get("sport","") == "cycling" and tags.get("highway") in ("path","track"))
        ),
        "needs_name": True,
        "extract": lambda tags: {
            "sub_type": "Mountain Biking",
            "difficulty": _mtb_diff(tags.get("mtb:scale", tags.get("mtb:scale:imba",""))),
            "distance_miles": _km2mi(tags.get("distance", tags.get("length",""))),
            "trail_types": json.dumps(["Mountain Biking"]),
        }
    },
    "fishing": {
        "category": "fishing",
        "match": lambda tags: (
            tags.get("leisure") == "fishing" or
            tags.get("sport") == "fishing" or
            tags.get("fishing") in ("yes","designated","permitted","trout","bass","public")
        ),
        "needs_name": True,
        "extract": lambda tags: {
            "sub_type": _fishing_sub(tags),
            "permit_required": 1 if tags.get("fee") == "yes" else 0,
            "water_available": 1,
        }
    },
    "boating": {
        "category": "boating",
        "match": lambda tags: (
            tags.get("leisure") in ("slipway","marina") or
            tags.get("seamark:type") == "small_craft_facility"
        ),
        "needs_name": False,
        "extract": lambda tags: {
            "sub_type": "Marina" if tags.get("leisure") == "marina" else "Boat Ramp",
            "water_available": 1,
            "hours": tags.get("opening_hours"),
        }
    },
    "kayaking": {
        "category": "kayaking",
        "match": lambda tags: (
            "canoe" in tags.get("sport","") or
            "kayak" in tags.get("sport","") or
            tags.get("canoe") in ("put_in","egress","portage","yes") or
            tags.get("whitewater") in ("put_in","egress","rapid") or
            tags.get("route") == "canoe"
        ),
        "needs_name": False,
        "extract": lambda tags: {
            "sub_type": _kayak_sub(tags),
            "difficulty": tags.get("whitewater:rapid_grade", tags.get("whitewater:rapid_name")),
            "water_available": 1,
            "distance_miles": _km2mi(tags.get("distance","")),
        }
    },
    "hunting": {
        "category": "hunting",
        "match": lambda tags: (
            tags.get("hunting") in ("yes","designated") or
            tags.get("leisure") == "hunting_stand" or
            (tags.get("sport") == "shooting" and tags.get("leisure") in ("sports_centre","pitch"))
        ),
        "needs_name": True,
        "extract": lambda tags: {
            "sub_type": "Shooting Range" if tags.get("sport") == "shooting" else "Public Hunting Land",
            "permit_required": 1,
        }
    },
    "horseback": {
        "category": "horseback",
        "match": lambda tags: (
            tags.get("highway") == "bridleway" or
            tags.get("horse") in ("designated","yes") or
            tags.get("route") == "horse" or
            tags.get("sport") == "equestrian"
        ),
        "needs_name": True,
        "extract": lambda tags: {
            "sub_type": "Equestrian Trail",
            "difficulty": _horse_diff(tags),
            "distance_miles": _km2mi(tags.get("distance", tags.get("length",""))),
        }
    },
    "climbing": {
        "category": "climbing",
        "match": lambda tags: (
            tags.get("sport") == "climbing" or
            ("climbing" in tags and tags.get("natural") == "cliff") or
            tags.get("climbing") in ("sport","boulder","trad","ice","crag")
        ),
        "needs_name": True,
        "extract": lambda tags: {
            "sub_type": _climb_sub(tags),
            "difficulty": tags.get("climbing:grade:yds", tags.get("climbing:grade:french")),
        }
    },
    "swimming": {
        "category": "swimming",
        "match": lambda tags: (
            tags.get("sport") == "swimming" or
            tags.get("leisure") in ("swimming_area","beach_resort") or
            (tags.get("natural") == "beach" and tags.get("swimming") in ("yes","designated"))
        ),
        "needs_name": True,
        "extract": lambda tags: {
            "sub_type": "Beach" if tags.get("natural") == "beach" else "Swimming Area",
            "water_available": 1,
            "hours": tags.get("opening_hours"),
        }
    },
    "offroad": {
        "category": "offroad",
        "match": lambda tags: (
            (tags.get("highway") == "track" and tags.get("4wd_only") in ("yes","recommended")) or
            (tags.get("highway") == "track" and tags.get("tracktype") in ("grade4","grade5")) or
            tags.get("sport") == "4wd" or
            tags.get("sport") == "off_road_racing"
        ),
        "needs_name": True,
        "extract": lambda tags: {
            "sub_type": "4x4 Trail",
            "difficulty": _offroad_diff(tags),
            "distance_miles": _km2mi(tags.get("distance", tags.get("length",""))),
            "trail_types": json.dumps(["4x4","Off-Road"]),
        }
    },
}

def _km2mi(v):
    if not v: return None
    try:
        n = float(str(v).replace("km","").replace("mi","").strip())
        return round(n * 0.621371, 1) if "mi" not in str(v) else round(n, 1)
    except: return None

def _mtb_diff(s):
    if not s: return None
    try: return {0:"Easy",1:"Easy",2:"Moderate",3:"Difficult",4:"Expert",5:"Extreme"}.get(int(s[0]))
    except: return None

def _fishing_sub(t):
    n = t.get("name","").lower()
    if "river" in n or t.get("waterway")=="river": return "River Fishing"
    if "lake" in n or t.get("natural")=="water": return "Lake Fishing"
    if "pier" in n or "surf" in n: return "Shore Fishing"
    return "Fishing Spot"

def _kayak_sub(t):
    if t.get("canoe")=="put_in" or t.get("whitewater")=="put_in": return "Put-In"
    if t.get("canoe")=="egress" or t.get("whitewater")=="egress": return "Take-Out"
    if t.get("canoe")=="portage": return "Portage"
    if t.get("whitewater:rapid_grade"): return "Whitewater"
    return "Paddle Access"

def _climb_sub(t):
    c = t.get("climbing", t.get("climbing:sport",""))
    if "boulder" in c: return "Bouldering"
    if "ice" in c: return "Ice Climbing"
    if "trad" in c: return "Trad Climbing"
    if "sport" in c: return "Sport Climbing"
    return "Climbing Area"

def _horse_diff(t):
    s = t.get("surface","")
    if s in ("paved","asphalt","concrete"): return "Easy"
    if s in ("gravel","fine_gravel","compacted"): return "Moderate"
    return None

def _offroad_diff(t):
    if t.get("tracktype")=="grade5" or t.get("4wd_only")=="yes": return "Difficult"
    if t.get("tracktype")=="grade4": return "Moderate"
    return "Moderate"

def _haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    dlat, dlon = math.radians(lat2-lat1), math.radians(lon2-lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dlon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def _gen_name(tags, category):
    name = tags.get("name","")
    if name: return name
    ref = tags.get("ref","")
    if ref:
        labels = {"boating":"Boat Ramp","kayaking":"Paddle Access"}
        return f"{labels.get(category, category.title())} {ref}"
    water = tags.get("waterway", tags.get("water",""))
    if water and category in ("boating","kayaking"):
        return f"Access Point ({water})"
    return None

class HobbyHandler(osmium.SimpleHandler):
    def __init__(self, matchers_to_run):
        super().__init__()
        self.matchers = matchers_to_run
        self.results = {h: [] for h in matchers_to_run}
        self._count = 0

    def _check(self, tags_obj, lat, lon, osm_type, osm_id):
        if lat is None or lon is None: return
        if not (18.0 < lat < 72.0 and -180.0 < lon < -65.0): return
        tags = {t.k: t.v for t in tags_obj}
        self._count += 1
        if self._count % 5000000 == 0:
            totals = {h: len(v) for h,v in self.results.items()}
            print(f"  ... scanned {self._count/1e6:.0f}M elements, found: {totals}", flush=True)
        for hobby, cfg in self.matchers.items():
            if cfg["match"](tags):
                name = _gen_name(tags, cfg["category"])
                if cfg["needs_name"] and not name: continue
                fields = cfg["extract"](tags)
                self.results[hobby].append({
                    "name": name, "description": tags.get("description", tags.get("note")),
                    "latitude": round(lat, 6), "longitude": round(lon, 6),
                    "category": cfg["category"], "sub_type": fields.get("sub_type"),
                    "source": "osm", "source_id": f"{osm_type}/{osm_id}",
                    "difficulty": fields.get("difficulty"),
                    "distance_miles": fields.get("distance_miles"),
                    "elevation_gain_ft": fields.get("elevation_gain_ft"),
                    "trail_types": fields.get("trail_types"),
                    "best_season": fields.get("best_season"),
                    "hours": fields.get("hours"),
                    "permit_required": fields.get("permit_required"),
                    "water_available": fields.get("water_available"),
                    "external_links": json.dumps([tags["website"]]) if tags.get("website") else None,
                })

    def node(self, n):
        self._check(n.tags, n.location.lat, n.location.lon, "node", n.id)

    def way(self, w):
        try:
            lats = [n.lat for n in w.nodes if n.location.valid()]
            lons = [n.lon for n in w.nodes if n.location.valid()]
            if lats and lons:
                self._check(w.tags, sum(lats)/len(lats), sum(lons)/len(lons), "way", w.id)
        except: pass

    def relation(self, r):
        tags = {t.k: t.v for t in r.tags}
        for hobby, cfg in self.matchers.items():
            if cfg["match"](tags):
                name = _gen_name(tags, cfg["category"])
                if cfg["needs_name"] and not name: continue
                lat, lon = tags.get("lat"), tags.get("lon")
                if lat and lon:
                    try:
                        fields = cfg["extract"](tags)
                        self.results[hobby].append({
                            "name": name, "description": tags.get("description"),
                            "latitude": round(float(lat),6), "longitude": round(float(lon),6),
                            "category": cfg["category"], "sub_type": fields.get("sub_type"),
                            "source": "osm", "source_id": f"relation/{r.id}",
                            "difficulty": fields.get("difficulty"),
                            "distance_miles": fields.get("distance_miles"),
                            "elevation_gain_ft": fields.get("elevation_gain_ft"),
                            "trail_types": fields.get("trail_types"),
                            "hours": fields.get("hours"),
                            "permit_required": fields.get("permit_required"),
                            "water_available": fields.get("water_available"),
                            "external_links": json.dumps([tags["website"]]) if tags.get("website") else None,
                        })
                    except: pass
                break

def insert_locations(locations, category, dry_run=False):
    if not locations:
        print(f"  No {category} locations to insert", flush=True)
        return 0
    seen = set()
    unique = []
    for loc in locations:
        if loc["source_id"] not in seen:
            seen.add(loc["source_id"])
            unique.append(loc)
    print(f"  {len(unique)} unique after source_id dedup (from {len(locations)})", flush=True)
    if dry_run:
        for loc in unique[:10]:
            print(f"    {loc['name']} ({loc['sub_type']}) @ {loc['latitude']},{loc['longitude']}", flush=True)
        return len(unique)
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    cur.execute("SELECT source_id FROM locations WHERE source = 'osm' AND category = %s", (category,))
    existing_ids = {row[0] for row in cur.fetchall()}
    cur.execute("SELECT latitude, longitude FROM locations WHERE category = %s", (category,))
    existing_coords = [(float(r[0]), float(r[1])) for r in cur.fetchall()]
    inserted = skipped_dup = skipped_spatial = 0
    for loc in unique:
        if loc["source_id"] in existing_ids:
            skipped_dup += 1; continue
        too_close = False
        for elat, elon in existing_coords:
            if _haversine(loc["latitude"], loc["longitude"], elat, elon) < 500:
                too_close = True; break
        if too_close:
            skipped_spatial += 1; continue
        try:
            cur.execute("""INSERT INTO locations (name, description, latitude, longitude, category, sub_type,
                source, source_id, difficulty, distance_miles, elevation_gain_ft, trail_types,
                best_season, hours, permit_required, water_available, external_links,
                visibility, created_at, updated_at)
                VALUES (%(name)s, %(description)s, %(latitude)s, %(longitude)s, %(category)s, %(sub_type)s,
                %(source)s, %(source_id)s, %(difficulty)s, %(distance_miles)s, %(elevation_gain_ft)s, %(trail_types)s,
                %(best_season)s, %(hours)s, %(permit_required)s, %(water_available)s, %(external_links)s,
                'public', NOW(), NOW())""", loc)
            existing_coords.append((loc["latitude"], loc["longitude"]))
            inserted += 1
        except Exception as e:
            print(f"  ⚠️ Insert failed: {loc['name']}: {e}", flush=True)
            conn.rollback(); continue
        if inserted % 1000 == 0:
            conn.commit()
            print(f"  ... {inserted} inserted", flush=True)
    conn.commit(); cur.close(); conn.close()
    print(f"  ✅ {category}: {inserted} inserted, {skipped_dup} dup, {skipped_spatial} spatial dedup", flush=True)
    return inserted

def main():
    if len(sys.argv) < 2:
        print(f"Usage: python3 import-from-pbf.py <{'|'.join(HOBBY_MATCHERS.keys())}|all> [--dry-run]")
        sys.exit(1)
    hobby = sys.argv[1]
    dry_run = "--dry-run" in sys.argv
    if not os.path.exists(PBF_PATH):
        print(f"PBF not found: {PBF_PATH}")
        print("Download: curl -L -o data/us-latest.osm.pbf https://download.geofabrik.de/north-america/us-latest.osm.pbf")
        sys.exit(1)
    if hobby == "all":
        matchers = HOBBY_MATCHERS
    elif hobby in HOBBY_MATCHERS:
        matchers = {hobby: HOBBY_MATCHERS[hobby]}
    else:
        print(f"Unknown: {hobby}. Available: {', '.join(HOBBY_MATCHERS.keys())}"); sys.exit(1)

    print(f"\n{'='*60}", flush=True)
    print(f"Scanning PBF for: {', '.join(matchers.keys())}", flush=True)
    print(f"File: {PBF_PATH} ({os.path.getsize(PBF_PATH)/1e9:.1f} GB)", flush=True)
    print(f"{'='*60}\n", flush=True)
    handler = HobbyHandler(matchers)
    handler.apply_file(PBF_PATH, locations=True)
    print(f"\nScan complete! {handler._count/1e6:.0f}M elements scanned", flush=True)
    total = 0
    for h, locs in handler.results.items():
        print(f"\n--- {h}: {len(locs)} matches ---", flush=True)
        total += insert_locations(locs, HOBBY_MATCHERS[h]["category"], dry_run)
    print(f"\n{'='*60}\n🎉 Total inserted: {total}\n{'='*60}", flush=True)

if __name__ == "__main__":
    main()
