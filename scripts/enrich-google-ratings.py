#!/usr/bin/env python3
"""
Batch Google Places API enrichment - rating + review count.
Cost: $5/1000. Google $200/month free = 40K free/month.
Usage: python3 enrich-google-ratings.py [max_requests]
"""
import json, urllib.request, time, sys
try:
    import psycopg2
except ImportError:
    import subprocess; subprocess.run([sys.executable,'-m','pip','install','psycopg2-binary','--break-system-packages','-q'])
    import psycopg2

DB_URL = "postgresql://postgres.iagfjotzcuazdowksxwy:beC67JY5HFqTsnHq@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
GOOGLE_API_KEY = "AIzaSyADHrco6XC-wI-D07zdSwdavr7KXOgdSjk"
SLEEP = 0.05
MAX_REQUESTS = int(sys.argv[1]) if len(sys.argv) > 1 else 40000

def search_place(name, city, state, lat, lon):
    query = f"{name} {city or ''} {state or ''}".strip()
    body = json.dumps({
        "textQuery": query,
        "locationBias": {"circle": {"center": {"latitude": lat, "longitude": lon}, "radius": 5000.0}},
        "maxResultCount": 1
    }).encode()
    req = urllib.request.Request(
        "https://places.googleapis.com/v1/places:searchText",
        data=body,
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_API_KEY,
            "X-Goog-FieldMask": "places.rating,places.userRatingCount,places.id,places.googleMapsUri"
        }
    )
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read())
        places = data.get("places", [])
        if not places: return None
        p = places[0]
        return {
            "google_rating": p.get("rating"),
            "google_review_count": p.get("userRatingCount"),
            "google_place_id": p.get("id"),
            "google_maps_url": p.get("googleMapsUri"),
        }
    except:
        return None

def main():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    # Add columns
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='locations'")
    existing = {r[0] for r in cur.fetchall()}
    for col, dtype in {'google_rating':'REAL','google_review_count':'INTEGER','google_place_id':'TEXT','google_maps_url':'TEXT','google_enriched_at':'TIMESTAMP WITH TIME ZONE'}.items():
        if col not in existing:
            cur.execute(f'ALTER TABLE locations ADD COLUMN "{col}" {dtype}')
    conn.commit()

    # Priority: named campgrounds first, then trails, skip water/dump/generic
    cur.execute("""
        SELECT id, name, city, state, latitude, longitude, category
        FROM locations
        WHERE google_enriched_at IS NULL
        AND name IS NOT NULL AND name != '' AND name !~ '^#\d+' AND LENGTH(name) > 3
        AND category NOT IN ('water', 'dump')
        ORDER BY 
            CASE 
                WHEN category = 'campsite' AND sub_type = 'campground' THEN 1
                WHEN category = 'campsite' AND sub_type = 'parking' THEN 2
                WHEN category IN ('hiking', 'riding', 'climbing', 'fishing') THEN 3
                WHEN category IN ('mtb', 'offroad', 'horseback', 'boating', 'kayaking', 'swimming', 'hunting') THEN 4
                WHEN category = 'campsite' AND sub_type = 'boondocking' THEN 5
                WHEN category = 'scenic' THEN 6
                ELSE 7
            END, id
        LIMIT %s
    """, (MAX_REQUESTS,))
    rows = cur.fetchall()
    print(f"Locations to query: {len(rows):,}")

    updated = 0; no_result = 0

    for i, (db_id, name, city, state, lat, lon, cat) in enumerate(rows):
        if i % 500 == 0 and i > 0:
            conn.commit()
            print(f"  {i:>6,}/{len(rows):,}  rated: {updated:,}  no_result: {no_result:,}  ~${i*5/1000:.0f}")

        result = search_place(name, city, state, lat, lon)
        if result and result.get("google_rating"):
            cur.execute("""UPDATE locations SET google_rating=%s, google_review_count=%s, 
                google_place_id=%s, google_maps_url=%s, google_enriched_at=NOW() WHERE id=%s""",
                (result["google_rating"], result["google_review_count"], result["google_place_id"], result["google_maps_url"], db_id))
            updated += 1
        else:
            cur.execute("UPDATE locations SET google_enriched_at=NOW() WHERE id=%s", (db_id,))
            no_result += 1
        time.sleep(SLEEP)

    conn.commit()

    cur.execute("SELECT COUNT(*) FROM locations WHERE google_rating IS NOT NULL")
    with_rating = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM locations")
    total = cur.fetchone()[0]
    print(f"\nDONE: {updated:,} rated, {no_result:,} no listing")
    print(f"Total with Google rating: {with_rating:,}/{total:,}")
    print(f"Cost: ~${len(rows)*5/1000:.0f} (first $200/mo free)")

    cur.execute("""SELECT ROUND(google_rating::numeric,0) as s, COUNT(*), ROUND(AVG(google_review_count)::numeric,0)
        FROM locations WHERE google_rating IS NOT NULL GROUP BY s ORDER BY s""")
    print("\nRating distribution:")
    for stars, count, avg_rev in cur.fetchall():
        print(f"  {int(stars)} stars: {count:,} locations (avg {int(avg_rev)} reviews)")
    conn.close()

if __name__ == '__main__':
    main()
