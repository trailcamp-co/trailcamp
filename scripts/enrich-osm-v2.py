#!/usr/bin/env python3
"""
Phase 1: OSM Enrichment — batch-query by node/way ID directly.
Queries 500 IDs at a time via Overpass. ~30-60 min for 121K locations.
"""
import json, re, urllib.request, urllib.parse, time, sys
try:
    import psycopg2
except ImportError:
    import subprocess; subprocess.run([sys.executable,'-m','pip','install','psycopg2-binary','--break-system-packages','-q'])
    import psycopg2

DB_URL = "postgresql://postgres.iagfjotzcuazdowksxwy:beC67JY5HFqTsnHq@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
BATCH = 500
SLEEP = 8

def extract_node_id(source_id):
    if not source_id: return None, None
    m = re.match(r'^osm-[\w]+-[\w]+-(\d+)$', source_id)
    if m: return 'node', int(m.group(1))
    m = re.match(r'^osm-[\w]+-(\d+)$', source_id)
    if m: return 'node', int(m.group(1))
    m = re.match(r'^node/(\d+)$', source_id)
    if m: return 'node', int(m.group(1))
    m = re.match(r'^way/(\d+)$', source_id)
    if m: return 'way', int(m.group(1))
    return None, None

def query_overpass_ids(node_ids, way_ids):
    parts = []
    if node_ids: parts.append('node(id:%s);' % ','.join(str(i) for i in node_ids))
    if way_ids:  parts.append('way(id:%s);'  % ','.join(str(i) for i in way_ids))
    query = '[out:json][timeout:60];(%s);out tags center;' % ' '.join(parts)
    url = "https://overpass-api.de/api/interpreter"
    data = "data=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, data=data.encode(), headers={'Content-Type':'application/x-www-form-urlencoded'})
    resp = urllib.request.urlopen(req, timeout=90)
    return json.loads(resp.read()).get('elements', [])

def tags_to_updates(tags, category):
    u = {}
    d = tags.get('description','').strip()
    if len(d) > 10: u['description'] = d[:2000]
    w = tags.get('website') or tags.get('url')
    if w: u['website'] = w[:500]
    p = tags.get('phone') or tags.get('contact:phone')
    if p: u['phone'] = p[:50]
    if tags.get('operator'): u['operator_name'] = tags['operator'][:200]
    if tags.get('brand'):    u['brand_name']    = tags['brand'][:200]
    if tags.get('opening_hours'): u['hours'] = tags['opening_hours'][:200]
    if tags.get('ele'):
        try: u['elevation_ft'] = int(float(tags['ele']) * 3.281)
        except: pass
    amt = tags.get('fee:amount') or tags.get('charge')
    fee = tags.get('fee','')
    if amt: u['fee_info'] = str(amt)[:100]
    elif fee: u['fee_info'] = fee[:100]
    fi = u.get('fee_info','')
    if fi and fi not in ('yes','no','free'):
        try:
            cost = float(re.sub(r'[^\d.]','',fi))
            if 0 < cost < 500: u['cost_per_night'] = cost
        except: pass
    if tags.get('access'): u['access_type'] = tags['access'][:50]
    if tags.get('surface'): u['surface_type'] = tags['surface'][:50]
    if tags.get('toilets:disposal'): u['has_toilets']=1; u['toilet_type']=tags['toilets:disposal'][:50]
    elif tags.get('toilets')=='yes' or tags.get('amenity')=='toilets': u['has_toilets']=1
    if tags.get('drinking_water')=='yes': u['water_available']=1
    if tags.get('shower')=='yes': u['has_showers']=1
    ps=tags.get('power_supply','')
    if ps and ps!='no': u['has_electric']=1
    ia=tags.get('internet_access','')
    if ia and ia!='no': u['has_wifi']=1
    if tags.get('openfire')=='yes' or tags.get('fireplace')=='yes': u['has_fire_ring']=1
    if tags.get('dog')=='yes' or tags.get('pets')=='yes': u['pet_friendly']=1
    res=tags.get('reservation','')
    if res: u['is_reservable']=1 if res in ('yes','required','recommended') else 0
    if tags.get('backcountry')=='yes': u['is_backcountry']=1
    if tags.get('tents')=='yes': u['tents_allowed']=1
    if tags.get('caravans')=='yes': u['rvs_allowed']=1
    if tags.get('capacity'):
        try: u['num_sites']=int(tags['capacity'])
        except: pass
    if tags.get('maxlength'):
        try: u['max_vehicle_length']=int(float(re.sub(r'[^\d.]','',tags['maxlength'])))
        except: pass
    if tags.get('maxstay'):
        try: u['stay_limit_days']=int(re.sub(r'[^\d]','',tags['maxstay'])[:6])
        except: pass
    if tags.get('sac_scale'): u['sac_scale']=tags['sac_scale']
    if tags.get('mtb:scale'): u['mtb_scale']=tags['mtb:scale']
    if tags.get('tracktype'): u['track_type']=tags['tracktype']
    if 'sac_scale' in u and category=='hiking':
        m={'hiking':'easy','mountain_hiking':'easy','demanding_mountain_hiking':'moderate','alpine_hiking':'hard','demanding_alpine_hiking':'hard','difficult_alpine_hiking':'expert'}
        if u['sac_scale'] in m: u['difficulty']=m[u['sac_scale']]
    if 'mtb_scale' in u and category in ('mountain_biking','riding'):
        lvl=int(u.get('mtb_scale','0') or 0)
        u['difficulty']=['easy','easy','moderate','moderate','hard','hard','expert'][min(lvl,6)]
    vehicles={}
    if tags.get('motorcycle') in ('yes','designated'): vehicles['motorcycle']=True
    if tags.get('atv') in ('yes','designated'): vehicles['atv']=True
    if tags.get('4wd_only')=='yes': vehicles['4wd']=True
    if tags.get('horse') in ('yes','designated'): vehicles['horse']=True
    if tags.get('bicycle') in ('yes','designated'): vehicles['bicycle']=True
    if vehicles: u['vehicles_allowed']=json.dumps(vehicles)
    for key in ('distance','length'):
        val=tags.get(key,'')
        if val:
            try:
                km=float(re.sub(r'[^\d.]','',val))
                miles=km*(0.621 if 'mi' not in val else 1)
                if 0.1<miles<10000: u['distance_miles']=round(miles,1)
                break
            except: pass
    for key in ('ascent','climb'):
        if tags.get(key):
            try: u['elevation_gain_ft']=int(float(re.sub(r'[^\d.]','',tags[key]))*3.281); break
            except: pass
    if tags.get('climbing:routes'):
        try: u['climbing_routes']=int(tags['climbing:routes'])
        except: pass
    if tags.get('climbing:grade:yds_class'): u['climbing_grade_min']=tags['climbing:grade:yds_class']
    if tags.get('climbing:rock'): u['climbing_rock_type']=tags['climbing:rock']
    for k in ('natural','water','waterway'):
        if tags.get(k) in ('lake','river','stream','pond','reservoir','ocean','bay'):
            u['water_body_type']=tags[k]; break
    if tags.get('whitewater:rapid_grade'): u['rapid_grade']=tags['whitewater:rapid_grade']
    u['osm_tags_json']=json.dumps(tags)[:5000]
    return u

def add_columns(conn):
    cur=conn.cursor()
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='locations'")
    existing={r[0] for r in cur.fetchall()}
    new_cols={'has_toilets':'INTEGER','toilet_type':'TEXT','has_showers':'INTEGER','has_electric':'INTEGER',
              'has_wifi':'INTEGER','has_fire_ring':'INTEGER','pet_friendly':'INTEGER','is_reservable':'INTEGER',
              'is_backcountry':'INTEGER','tents_allowed':'INTEGER','rvs_allowed':'INTEGER','phone':'TEXT',
              'website':'TEXT','email':'TEXT','operator_name':'TEXT','brand_name':'TEXT','elevation_ft':'INTEGER',
              'fee_info':'TEXT','access_type':'TEXT','surface_type':'TEXT','num_sites':'INTEGER',
              'vehicles_allowed':'TEXT','route_type':'TEXT','sac_scale':'TEXT','mtb_scale':'TEXT',
              'track_type':'TEXT','climbing_routes':'INTEGER','climbing_grade_min':'TEXT',
              'climbing_grade_max':'TEXT','climbing_rock_type':'TEXT','water_body_type':'TEXT',
              'rapid_grade':'TEXT','osm_tags_json':'TEXT','enriched_at':'TIMESTAMP WITH TIME ZONE'}
    added=0
    for col,dtype in new_cols.items():
        if col not in existing:
            cur.execute('ALTER TABLE locations ADD COLUMN "%s" %s' % (col, dtype))
            added+=1
    conn.commit()
    print(f"DB ready — {added} columns added")

def main():
    conn=psycopg2.connect(DB_URL)
    add_columns(conn)
    cur=conn.cursor()

    cur.execute("SELECT id,source_id,category FROM locations WHERE source='osm' AND source_id IS NOT NULL AND enriched_at IS NULL ORDER BY id")
    rows=cur.fetchall()
    print(f"Locations to enrich: {len(rows):,}")

    id_map={}
    for db_id,source_id,category in rows:
        t,oid=extract_node_id(source_id)
        if t and oid: id_map[(t,oid)]=(db_id,category)

    node_ids=[oid for (t,oid) in id_map if t=='node']
    way_ids =[oid for (t,oid) in id_map if t=='way']
    print(f"Nodes: {len(node_ids):,}   Ways: {len(way_ids):,}")

    total_updated=0; total_batches=0; errors=0

    def run_batch(nbatch, wbatch):
        nonlocal total_updated, errors
        try:
            elements=query_overpass_ids(nbatch, wbatch)
        except Exception as e:
            print(f"  ERROR: {str(e)[:80]}"); errors+=1; time.sleep(30); return
        for el in elements:
            key=(el['type'],el['id'])
            if key not in id_map: continue
            db_id,category=id_map[key]
            u=tags_to_updates(el.get('tags',{}),category)
            cols=list(u.keys()); vals=list(u.values())
            set_clause=', '.join('"%s"=%%s' % c for c in cols)+', enriched_at=NOW()'
            cur.execute('UPDATE locations SET %s WHERE id=%%s' % set_clause, vals+[db_id])
            total_updated+=1
        conn.commit()

    for i in range(0,len(node_ids),BATCH):
        batch=node_ids[i:i+BATCH]
        run_batch(batch,[])
        total_batches+=1
        pct=min(100,int(100*(i+BATCH)/max(len(node_ids),1)))
        print(f"  nodes {i+BATCH:>7,}/{len(node_ids):,} ({pct}%)  updated: {total_updated:,}")
        time.sleep(SLEEP*2 if total_batches%5==0 else SLEEP)

    for i in range(0,len(way_ids),BATCH):
        batch=way_ids[i:i+BATCH]
        run_batch([],batch)
        total_batches+=1
        print(f"  ways  {i+BATCH:>7,}/{len(way_ids):,}  updated: {total_updated:,}")
        time.sleep(SLEEP)

    cur.execute("SELECT COUNT(*) FROM locations WHERE enriched_at IS NOT NULL")
    enriched=cur.fetchone()[0]
    print(f"\nDONE: {total_updated:,} updated | {errors} errors | {enriched:,} total enriched")

    cur.execute("""
        SELECT
          SUM(CASE WHEN description      IS NOT NULL AND description!='' THEN 1 ELSE 0 END),
          SUM(CASE WHEN website          IS NOT NULL THEN 1 ELSE 0 END),
          SUM(CASE WHEN operator_name    IS NOT NULL THEN 1 ELSE 0 END),
          SUM(CASE WHEN has_toilets=1    THEN 1 ELSE 0 END),
          SUM(CASE WHEN fee_info         IS NOT NULL THEN 1 ELSE 0 END),
          SUM(CASE WHEN elevation_ft     IS NOT NULL THEN 1 ELSE 0 END),
          SUM(CASE WHEN vehicles_allowed IS NOT NULL THEN 1 ELSE 0 END),
          SUM(CASE WHEN sac_scale        IS NOT NULL THEN 1 ELSE 0 END),
          SUM(CASE WHEN mtb_scale        IS NOT NULL THEN 1 ELSE 0 END),
          SUM(CASE WHEN climbing_routes  IS NOT NULL THEN 1 ELSE 0 END),
          SUM(CASE WHEN distance_miles   IS NOT NULL THEN 1 ELSE 0 END),
          SUM(CASE WHEN cost_per_night   IS NOT NULL THEN 1 ELSE 0 END)
        FROM locations
    """)
    labels=['description','website','operator','toilets','fee','elevation','vehicles','sac_scale','mtb_scale','climbing_routes','distance_mi','cost/night']
    row=cur.fetchone()
    print("\nField coverage:")
    for label,val in zip(labels,row):
        print(f"  {label:20s}: {val or 0:>7,}")
    conn.close()

if __name__=='__main__':
    main()
