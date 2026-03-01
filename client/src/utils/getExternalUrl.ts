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
        const isGoogle = location.external_links.includes('google.com/search');
        return {
          url: location.external_links,
          label: isRecGov ? 'Book / Reserve' : isGoogle ? 'Search Online' : 'Visit Website',
        };
      }
    }
  }

  // Fallback: Google search for campsites with city/state info
  if (location.category === 'campsite' && (location.city || location.state)) {
    const parts = [location.name, location.city, location.state].filter(Boolean);
    const query = encodeURIComponent(parts.join(', '));
    return {
      url: `https://www.google.com/search?q=${query}`,
      label: 'Search Online',
    };
  }

  return null;
}
