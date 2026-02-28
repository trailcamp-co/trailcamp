export interface TripTemplate {
  name: string;
  description: string;
  emoji: string;
  estimatedDays: number;
  season: string;
  difficulty: string;
  stops: Array<{
    query: string; // search query to find the location
    nights: number;
  }>;
}

export const TRIP_TEMPLATES: TripTemplate[] = [
  {
    name: 'Moab Red Rock Adventure',
    description: 'Epic Utah slickrock and camping loop',
    emoji: '🏜️',
    estimatedDays: 7,
    season: 'Mar-Nov',
    difficulty: 'Moderate-Hard',
    stops: [
      { query: 'Klondike Bluffs', nights: 2 },
      { query: 'Gemini Bridges', nights: 1 },
      { query: 'Behind the Rocks', nights: 2 },
      { query: 'Castle Valley', nights: 2 },
    ],
  },
  {
    name: 'Eastern Sierra Loop',
    description: 'High altitude California mountain riding',
    emoji: '⛰️',
    estimatedDays: 10,
    season: 'Jun-Sep',
    difficulty: 'Hard',
    stops: [
      { query: 'Mammoth Lakes', nights: 2 },
      { query: 'Alabama Hills', nights: 2 },
      { query: 'Bishop OHV', nights: 2 },
      { query: 'Benton Crossing', nights: 2 },
      { query: 'June Lake', nights: 2 },
    ],
  },
  {
    name: 'Colorado High Country',
    description: 'Alpine passes and mountain towns',
    emoji: '🏔️',
    estimatedDays: 14,
    season: 'Jul-Sep',
    difficulty: 'Expert',
    stops: [
      { query: 'Taylor Park', nights: 3 },
      { query: 'Ophir Pass', nights: 2 },
      { query: 'Black Bear Pass', nights: 2 },
      { query: 'Alpine Loop', nights: 3 },
      { query: 'Engineer Pass', nights: 2 },
      { query: 'Crested Butte', nights: 2 },
    ],
  },
  {
    name: 'Southwest Desert Tour',
    description: 'Arizona and New Mexico desert riding',
    emoji: '🌵',
    estimatedDays: 12,
    season: 'Oct-Apr',
    difficulty: 'Moderate',
    stops: [
      { query: 'Wickenburg', nights: 2 },
      { query: 'Box Canyon', nights: 2 },
      { query: 'Sedona', nights: 2 },
      { query: 'Flagstaff', nights: 2 },
      { query: 'Holbrook', nights: 2 },
      { query: 'Silver City', nights: 2 },
    ],
  },
  {
    name: 'Pacific Northwest Explorer',
    description: 'Washington and Oregon mountains',
    emoji: '🌲',
    estimatedDays: 10,
    season: 'Jun-Sep',
    difficulty: 'Moderate',
    stops: [
      { query: 'Gifford Pinchot', nights: 2 },
      { query: 'Mt St Helens', nights: 2 },
      { query: 'Tillamook', nights: 2 },
      { query: 'Deschutes', nights: 2 },
      { query: 'Bend', nights: 2 },
    ],
  },
];
