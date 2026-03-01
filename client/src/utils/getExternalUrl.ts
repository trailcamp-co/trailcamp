import type { Location } from '../types';

export function getExternalUrl(location: Location): { url: string; label: string } | null {
  // Recreation.gov campground link
  if (location.source === 'recreation_gov' && location.source_id?.startsWith('rec-')) {
    return {
      url: 'https://www.recreation.gov/camping/campgrounds/' + location.source_id.replace('rec-', ''),
      label: 'Book / Reserve',
    };
  }

  // Existing external_links field
  if (location.external_links) {
    try {
      const parsed = JSON.parse(location.external_links);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].url) {
        return { url: parsed[0].url, label: parsed[0].label || 'Visit Website' };
      }
    } catch {
      // Plain URL string
      if (location.external_links.startsWith('http')) {
        return { url: location.external_links, label: 'Visit Website' };
      }
    }
  }

  return null;
}
