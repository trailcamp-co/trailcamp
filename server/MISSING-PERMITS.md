# Missing Permit Information Report

*Generated: 2026-02-28*

## Summary

- **Total locations analyzed:** 5585
- **Missing permit_info (flag set):** 18
- **Likely needs permit (flag not set):** 305
- **Vague permit info:** 0

---

## 1. Locations with permit_required but Missing Details

These locations have `permit_required = 1` but are missing `permit_info` text:

| ID | Name | Category | Sub-Type |
|----|------|----------|----------|
| 6126 | Beasley Knob OHV — Cohutta WMA | riding | dirt-bike |
| 6128 | Redlands OHV — Lafayette | riding | dirt-bike |
| 6129 | Big Scrub OHV — Ocala National Forest | riding | dirt-bike |
| 6131 | Tosohatchee WMA — Christmas | riding | dirt-bike |
| 6133 | Forks Area Trail — Sumter National Forest | riding | dirt-bike |
| 6135 | Hanging Rock State Park Area Trails | riding | dirt-bike |
| 6137 | Stoney Creek ATV Park — Unicoi | riding | dirt-bike |
| 6138 | Chuck Swan WMA OHV — Jacksboro | riding | dirt-bike |
| 6140 | Kingdom Come State Park Area | riding | dirt-bike |
| 6156 | River Road — Big Bend Ranch SP | riding | dirt-bike |
| 6157 | Old Ore Road — Big Bend National Park | riding | dirt-bike |
| 6161 | Hill Country State Natural Area — Bandera | riding | dirt-bike |
| 6165 | Sam Houston NF — Double Lake Area | riding | dirt-bike |
| 6181 | Green Ridge State Forest OHV — MD | riding | dirt-bike |
| 6182 | Potomac State Forest Trails — MD | riding | dirt-bike |
| 6189 | Finger Lakes National Forest Trails — NY | riding | dirt-bike |
| 6191 | Going-to-the-Sun Road — Glacier NP | riding | dirt-bike |
| 6198 | Trail Ridge Road — Rocky Mountain NP | riding | dirt-bike |

**Action Required:** Add specific permit information for these 18 locations.

**Example SQL:**
```sql
UPDATE locations SET permit_info = 'Specific permit details here' WHERE id = <location_id>;
```

---

## 2. Locations Likely Requiring Permits (Flag Not Set)

Based on name patterns, these locations likely require permits but `permit_required` is not set:


### OHV Park/Area (16 locations)

| ID | Name | Category | Suggested Permit |
|----|------|----------|------------------|
| 3 | Boulders OHV Area Camping | campsite | OHV registration |
| 2711 | Juniper Dunes OHV Area | campsite | OHV registration |
| 6042 | Cinder Hills OHV Area — Flagstaff | campsite | OHV registration |
| 5670 | Turkey Bay OHV Area | riding | OHV registration |
| 5752 | Raystown OHV Area | riding | OHV registration |
| 5853 | Tellico OHV Area | riding | OHV registration |
| 5856 | Enoree OHV Area | riding | OHV registration |
| 5858 | Bricks OHV Area | riding | OHV registration |
| 5860 | Cohutta OHV Area | riding | OHV registration |
| 5864 | Royal Blue OHV Area | riding | OHV registration |
| 5933 | Gilbert OHV Park | riding | OHV registration |
| 6213 | Seven Springs OHV Area | riding | OHV registration |
| 4841 | Boulders OHV Area | riding | OHV registration |
| 4897 | Badlands OHV Area | riding | OHV registration |
| 4933 | Knolls OHV Area | riding | OHV registration |
| 5012 | Humbug OHV Area | riding | OHV registration |

### Wilderness Area (22 locations)

| ID | Name | Category | Suggested Permit |
|----|------|----------|------------------|
| 137 | South Maricopa Mountains Wilderness Area | campsite | Wilderness permit |
| 404 | Yolla Bolly-Middle Eel Wilderness | campsite | Wilderness permit |
| 2320 | Paiute Wilderness Area | campsite | Wilderness permit |
| 2424 | Mount Trumbull Wilderness Area | campsite | Wilderness permit |
| 6172 | Cloud Peak Wilderness Access — Buffalo | campsite | Wilderness permit |
| 163 | Kofa Wilderness | campsite | Wilderness permit |
| 206 | North Maricopa Mountains Wilderness Area | campsite | Wilderness permit |
| 522 | San Mateo Wilderness South Area | campsite | Wilderness permit |
| 2314 | Mount Logan Wilderness Area | campsite | Wilderness permit |
| 2339 | Sids Mountain Wilderness - The Wedge | campsite | Wilderness permit |
| 5921 | 100 Mile Wilderness — ME | riding | Wilderness permit |
| 5042 | Shoshone NF — Washakie Wilderness Edge | riding | Wilderness permit |
| 5115 | Sipsey Wilderness Edge — Bankhead NF | riding | Wilderness permit |
| 5233 | Four Peaks Wilderness Edge | riding | Wilderness permit |
| 5363 | Wheeler Peak Wilderness Edge — Taos | riding | Wilderness permit |
| 5379 | Arc Dome Wilderness Edge — Toiyabe Range | riding | Wilderness permit |
| 5467 | Four Peaks Wilderness Edge | riding | Wilderness permit |
| 5545 | Lassen NF — Caribou Wilderness Edge | riding | Wilderness permit |
| 5577 | Cloud Peak Wilderness Edge — Bighorns | riding | Wilderness permit |
| 5578 | Bob Marshall Wilderness Edge — Augusta | riding | Wilderness permit |

*... and 2 more*

### State Recreation Area (149 locations)

| ID | Name | Category | Suggested Permit |
|----|------|----------|------------------|
| 975 | Oh Be Joyful Recreation Area | campsite | Day-use or camping permit |
| 1199 | Wolf Flats Recreation Area | campsite | Day-use or camping permit |
| 1513 | Muchwater Dispersed Campground and Recreation Area | campsite | Day-use or camping permit |
| 1713 | Peninsula Dispersed Campground and Recreation Area | campsite | Day-use or camping permit |
| 3693 | Comers Rock Recreation Area | campsite | Day-use or camping permit |
| 4640 | White Mountains National Recreation Area - Alaska Cabins | campsite | Day-use or camping permit |
| 5710 | Sand Mountain Recreation Area | campsite | Day-use or camping permit |
| 120 | Lynx Lake Recreation Area | campsite | Day-use or camping permit |
| 149 | Woods Canyon Lake Recreation Area | campsite | Day-use or camping permit |
| 164 | TIMBER CAMP RECREATION AREA and GROUP CAMPGROUNDS | campsite | Day-use or camping permit |
| 175 | East Fork Recreation Area | campsite | Day-use or camping permit |
| 180 | Granite Basin Recreation Area | campsite | Day-use or camping permit |
| 194 | SABINO CANYON RECREATION AREA CACTUS RAMADA 1 | campsite | Day-use or camping permit |
| 202 | SABINO CANYON RECREATION AREA CACTUS RAMADA 2 | campsite | Day-use or camping permit |
| 227 | Big Lake Recreation Area | campsite | Day-use or camping permit |
| 244 | Fool Hollow Lake Recreation Area Campground | campsite | Day-use or camping permit |
| 336 | Trinity Unit - National Recreation Area | campsite | Day-use or camping permit |
| 337 | Lake Arrowhead - Green Valley Lake Recreation Area | campsite | Day-use or camping permit |
| 389 | Chowchilla Recreation Area Day Use | campsite | Day-use or camping permit |
| 452 | Huntington Lake Recreation Area | campsite | Day-use or camping permit |

*... and 129 more*

### National Forest OHV (94 locations)

| ID | Name | Category | Suggested Permit |
|----|------|----------|------------------|
| 3759 | Uwharrie National Forest | campsite | OHV permit or trail pass |
| 6041 | Kaibab National Forest Dispersed — Jacob Lake | campsite | OHV permit or trail pass |
| 6045 | Gila National Forest Dispersed — Mimbres | campsite | OHV permit or trail pass |
| 6047 | Cibola National Forest — Datil | campsite | OHV permit or trail pass |
| 257 | Rock Creek (Sierra National Forest, CA) | campsite | OHV permit or trail pass |
| 575 | Big Meadow (Stanislaus National Forest) | campsite | OHV permit or trail pass |
| 611 | East Fork Campground – Inyo National Forest (CA) | campsite | OHV permit or trail pass |
| 624 | Rock Creek Lake Group Camp (Inyo National Forest, CA) | campsite | OHV permit or trail pass |
| 688 | Rock Creek Lake (Inyo National Forest, CA) | campsite | OHV permit or trail pass |
| 716 | Bear River Group Campground (Eldorado National Forest, CA) | campsite | OHV permit or trail pass |
| 948 | Aspen Glade (Rio Grande National Forest, CO) | campsite | OHV permit or trail pass |
| 1055 | Aspen Leaf Cabin (Uncompahgre National Forest, Co) | campsite | OHV permit or trail pass |
| 1205 | Antelope (Boise National Forest, ID) | campsite | OHV permit or trail pass |
| 1279 | Bald Mountain Lookout (Nez Perce-Clearwater National Forests, ID) | campsite | OHV permit or trail pass |
| 1291 | Barber Flat Cabin (Boise National Forest, ID) | campsite | OHV permit or trail pass |
| 1308 | Sawtooth National Forest - Grandjean Campground | campsite | OHV permit or trail pass |
| 1325 | Barneys Campground (Boise National Forest, ID) | campsite | OHV permit or trail pass |
| 1443 | Bear Creek Bunkhouse (Beaverhead-Deerlodge National Forest, MT) | campsite | OHV permit or trail pass |
| 1654 | Bear Creek Cabin (Beaverhead-Deerlodge National Forest, MT) | campsite | OHV permit or trail pass |
| 1780 | Aspen Group Area (Lincoln National Forest, NM) | campsite | OHV permit or trail pass |

*... and 74 more*

### Wildlife Management Area (11 locations)

| ID | Name | Category | Suggested Permit |
|----|------|----------|------------------|
| 5894 | NF Dispersed — Boise NF — Lowman | campsite | Access permit (hunting license often required) |
| 1057 | Snowmass Area | campsite | Access permit (hunting license often required) |
| 1368 | Lowman Ranger District and Office | campsite | Access permit (hunting license often required) |
| 3349 | PLOWMAN CREEK | campsite | Access permit (hunting license often required) |
| 4166 | Bowman Lake Area | campsite | Access permit (hunting license often required) |
| 4184 | BOWMAN BRIDGE | campsite | Access permit (hunting license often required) |
| 5112 | Chattahoochee NF — Cohutta WMA | riding | Access permit (hunting license often required) |
| 5180 | Black Warrior WMA — AL | riding | Access permit (hunting license often required) |
| 5477 | Pottersville OHV — Cohutta WMA GA | riding | Access permit (hunting license often required) |
| 5497 | River Creek WMA — Ellijay GA | riding | Access permit (hunting license often required) |
| 5989 | Victory Basin WMA — Victory | riding | Access permit (hunting license often required) |

### National Park (10 locations)

| ID | Name | Category | Suggested Permit |
|----|------|----------|------------------|
| 788 | Dorst Creek Campground-Sequoia and Kings Canyon National Park | campsite | Entrance fee or backcountry permit |
| 855 | Lodgepole Campground-Sequoia and Kings Canyon National Park | campsite | Entrance fee or backcountry permit |
| 1022 | Rocky Mountain National Park Moraine Park Campground | campsite | Entrance fee or backcountry permit |
| 1042 | Rocky Mountain National Park Glacier Basin Campground | campsite | Entrance fee or backcountry permit |
| 1089 | Rocky Mountain National Park Aspenglen Campground | campsite | Entrance fee or backcountry permit |
| 2268 | Canyonlands National Park Needles District Campground | campsite | Entrance fee or backcountry permit |
| 3932 | BIG CREEK CAMPGROUND (GREAT SMOKY MOUNTAINS NATIONAL PARK) | campsite | Entrance fee or backcountry permit |
| 4313 | CUYAHOGA VALLEY NATIONAL PARK PICNIC SHELTERS | campsite | Entrance fee or backcountry permit |
| 4639 | Kenai Fjords National Park Cabins | campsite | Entrance fee or backcountry permit |
| 4651 | Haleakalā National Park (Cabin Permits) | campsite | Entrance fee or backcountry permit |

### State Park OHV (2 locations)

| ID | Name | Category | Suggested Permit |
|----|------|----------|------------------|
| 5934 | Iron Range OHV State Park | riding | State OHV registration |
| 5111 | South Mountains State Park OHV | riding | State OHV registration |

### BLM Special Area (1 locations)

| ID | Name | Category | Suggested Permit |
|----|------|----------|------------------|
| 5063 | Medford BLM OHV | riding | BLM permit or recreation pass |

**Action Required:** Review these 305 locations and set permit_required flag + details.

**Example SQL:**
```sql
UPDATE locations 
SET permit_required = 1, 
    permit_info = 'Specific permit type and requirements'
WHERE id = <location_id>;
```

---

## 3. Vague Permit Information

These locations have a permit flag and info, but the info is too vague:

✅ All permit info is reasonably specific.

---

## Permit Data Quality

### Current Coverage

- Locations with `permit_required = 1`: 375
- Locations with `permit_info` text: 358
- Riding locations: 1215 total
- Campsite locations: 4370 total

**Riding locations with permits:** 31% of riding locations have permit flags

### Common Permit Types

Based on analysis, common permit requirements:

1. **OHV Registration** - State-specific off-highway vehicle registration (CA, AZ, UT, etc.)
2. **National Forest Trail Pass** - Required for some NF OHV areas
3. **State Park Day-Use Pass** - Entry fee for state parks
4. **Wilderness Permit** - Required for designated wilderness areas
5. **BLM Recreation Pass** - Some BLM areas require permits
6. **Backcountry Permit** - National Parks backcountry camping

### Data Improvement Recommendations

1. **HIGH PRIORITY:** Add permit_info for 18 locations with permit flag set
2. **MEDIUM PRIORITY:** Review 305 locations likely needing permits

---

*Report generated by find-missing-permits.js*
