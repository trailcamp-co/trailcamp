#!/usr/bin/env python3
"""
Phase 2: Enrich recreation.gov locations with RIDB API amenity/facility details.
Free API, no key needed for basic access. ~20 min for 4K locations.
"""
import json, re, urllib.request, time, sys
try:
    import psycopg2
except ImportError:
    import subprocess; subprocess.run([sys.executable,'-m','pip','install','psycopg2-binary','--break-system-packages','-q'])
    import psycopg2

DB_URL = "postgresql://postgres.iagfjotzcuazdowksxwy:beC67JY5HFqTsnHq@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

def fetch_facility(fac_id):
    """Fetch facility details from RIDB."""
    url = f"https://ridb.recreation.gov/api/v1/facilities/{fac_id}?full=true"
    req = urllib.request.Request(url, headers={'accept':'application/json'})
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return json.loads(resp.read())
    except:
        return None

def fetch_facility_attributes(fac_id):
    """Fetch amenity attributes for a facility."""
    url = f"https://ridb.recreation.gov/api/v1/facilities/{fac_id}/attributes"
    req = urllib.request.Request(url, headers={'accept':'application/json'})
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return json.loads(resp.read()).get('RECDATA', [])
    except:
        return []

def main():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    # Get rec.gov locations not yet enriched  
    cur.execute("""
        SELECT id, source_id, name FROM locations 
        WHERE source='recreation_gov' AND enriched_at IS NULL
        ORDER BY id
    """)
    rows = cur.fetchall()
    print(f"Recreation.gov locations to enrich: {len(rows)}")

    updated = 0
    errors = 0
    
    for i, (db_id, source_id, name) in enumerate(rows):
        if i % 100 == 0 and i > 0:
            print(f"  Progress: {i}/{len(rows)}, updated: {updated}")
            conn.commit()
        
        # Extract facility ID from source_id like "rec-234378"
        m = re.match(r'^rec-(\d+)$', source_id or '')
        if not m:
            cur.execute("UPDATE locations SET enriched_at=NOW() WHERE id=%s", (db_id,))
            continue
        fac_id = m.group(1)
        
        # Fetch attributes
        attrs = fetch_facility_attributes(fac_id)
        if not attrs:
            # Try full facility
            fac = fetch_facility(fac_id)
            if fac:
                attrs_dict = {}
                # Check if facility has useful info
                if fac.get('FacilityUseFeeDescription'):
                    attrs_dict['fee_info'] = fac['FacilityUseFeeDescription'][:200]
                if fac.get('FacilityPhone'):
                    attrs_dict['phone'] = fac['FacilityPhone'][:50]
                if fac.get('FacilityEmail'):
                    attrs_dict['email'] = fac['FacilityEmail'][:100]
                if fac.get('Reservable'):
                    attrs_dict['is_reservable'] = 1
                if attrs_dict:
                    cols = list(attrs_dict.keys())
                    vals = list(attrs_dict.values())
                    set_clause = ', '.join('"%s"=%%s' % c for c in cols) + ', enriched_at=NOW()'
                    cur.execute('UPDATE locations SET %s WHERE id=%%s' % set_clause, vals + [db_id])
                    updated += 1
                else:
                    cur.execute("UPDATE locations SET enriched_at=NOW() WHERE id=%s", (db_id,))
            else:
                cur.execute("UPDATE locations SET enriched_at=NOW() WHERE id=%s", (db_id,))
                errors += 1
            time.sleep(0.3)
            continue
        
        # Parse attributes into our columns
        u = {}
        for attr in attrs:
            name_lower = (attr.get('AttributeName','') or '').lower()
            val = attr.get('AttributeValue','')
            if not val or val.lower() in ('n/a','none','unknown'):
                continue
            
            if 'toilet' in name_lower or 'restroom' in name_lower:
                u['has_toilets'] = 1
                u['toilet_type'] = val[:50]
            elif 'shower' in name_lower:
                u['has_showers'] = 1 if val.lower() not in ('no','none') else 0
            elif 'electric' in name_lower or 'hookup' in name_lower:
                u['has_electric'] = 1 if val.lower() not in ('no','none') else 0
            elif 'wifi' in name_lower or 'internet' in name_lower:
                u['has_wifi'] = 1 if val.lower() not in ('no','none') else 0
            elif 'fire' in name_lower or 'grill' in name_lower:
                u['has_fire_ring'] = 1
            elif 'pet' in name_lower or 'dog' in name_lower:
                u['pet_friendly'] = 1 if val.lower() not in ('no','none') else 0
            elif 'water' in name_lower and 'drink' in name_lower:
                u['water_available'] = 1
            elif 'site' in name_lower and ('num' in name_lower or 'count' in name_lower or 'total' in name_lower):
                try: u['num_sites'] = int(val)
                except: pass
            elif 'max' in name_lower and ('length' in name_lower or 'rv' in name_lower or 'vehicle' in name_lower):
                try: u['max_vehicle_length'] = int(float(re.sub(r'[^\d.]','',val)))
                except: pass
            elif 'elevation' in name_lower:
                try: u['elevation_ft'] = int(float(re.sub(r'[^\d.]','',val)))
                except: pass
            elif 'tent' in name_lower:
                u['tents_allowed'] = 1 if val.lower() not in ('no','none') else 0
            elif 'rv' in name_lower or 'trailer' in name_lower:
                u['rvs_allowed'] = 1 if val.lower() not in ('no','none') else 0
            elif 'reserv' in name_lower:
                u['is_reservable'] = 1 if val.lower() not in ('no','none') else 0
            elif 'fee' in name_lower or 'cost' in name_lower or 'price' in name_lower:
                u['fee_info'] = val[:100]
            elif 'season' in name_lower:
                u['season'] = val[:100]
            elif 'stay' in name_lower and 'limit' in name_lower:
                try: u['stay_limit_days'] = int(re.sub(r'[^\d]','',val)[:5])
                except: pass
        
        if u:
            cols = list(u.keys())
            vals = list(u.values())
            set_clause = ', '.join('"%s"=%%s' % c for c in cols) + ', enriched_at=NOW()'
            cur.execute('UPDATE locations SET %s WHERE id=%%s' % set_clause, vals + [db_id])
            updated += 1
        else:
            cur.execute("UPDATE locations SET enriched_at=NOW() WHERE id=%s", (db_id,))
        
        time.sleep(0.3)
    
    conn.commit()
    print(f"\nDONE: {updated} updated, {errors} errors out of {len(rows)}")
    conn.close()

if __name__ == '__main__':
    main()
