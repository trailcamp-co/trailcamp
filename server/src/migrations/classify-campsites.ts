import { getDb } from '../database';

export function classifyCampsites(): void {
  const db = getDb();

  // Check if migration already ran (if any campsite has a sub_type set by this migration)
  const alreadyRan = db.prepare(
    "SELECT COUNT(*) as count FROM locations WHERE category = 'campsite' AND sub_type IN ('boondocking', 'campground', 'parking', 'other')"
  ).get() as { count: number };

  if (alreadyRan.count > 0) {
    return; // Already classified
  }

  console.log('Running campsite classification migration...');

  const boondockingPatterns = ['dispersed', 'blm', 'boondock', 'primitive', 'free camp', 'wild camp', 'state trust', 'backcountry'];
  const campgroundPatterns = ['campground', 'camp site', 'rv park', 'koa', 'state park camp'];
  const parkingPatterns = ['walmart', 'parking', 'rest area', 'truck stop', 'casino'];

  // Get all campsites without a sub_type
  const campsites = db.prepare(
    "SELECT id, name, description FROM locations WHERE category = 'campsite' AND (sub_type IS NULL OR sub_type = '')"
  ).all() as { id: number; name: string; description: string | null }[];

  const updateStmt = db.prepare('UPDATE locations SET sub_type = ? WHERE id = ?');

  const classify = db.transaction(() => {
    for (const camp of campsites) {
      const searchText = `${camp.name} ${camp.description || ''}`.toLowerCase();

      let subType = 'other';

      if (boondockingPatterns.some(p => searchText.includes(p))) {
        subType = 'boondocking';
      } else if (campgroundPatterns.some(p => searchText.includes(p))) {
        subType = 'campground';
      } else if (parkingPatterns.some(p => searchText.includes(p))) {
        subType = 'parking';
      }

      updateStmt.run(subType, camp.id);
    }
  });

  classify();
  console.log(`Classified ${campsites.length} campsites into sub-types.`);
}
