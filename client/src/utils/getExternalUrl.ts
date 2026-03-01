import type { Location } from '../types';

export function getExternalUrl(location: Location): { url: string; label: string } | null {
  // Use the external_links field (validated URLs stored in DB)
  if (location.external_links) {
    try {
      const parsed = JSON.parse(location.external_links);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].url) {
        return { url: parsed[0].url, label: parsed[0].label || 'Visit Website' };
      }
    } catch {
      // Plain URL string
      if (location.external_links.startsWith('http')) {
        const isRecGov = location.external_links.includes('recreation.gov');
        return {
          url: location.external_links,
          label: isRecGov ? 'Book / Reserve' : 'Visit Website',
        };
      }
    }
  }

  return null;
}
