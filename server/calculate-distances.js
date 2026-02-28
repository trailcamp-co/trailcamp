#!/usr/bin/env node
// Route Distance Calculator for TrailCamp
// Calculates driving distances between coordinates or trip stops

import Database from 'better-sqlite3';
import https from 'https';

const db = new Database('./trailcamp.db');

// Simple as-the-crow-flies distance (Haversine formula)
function straightLineDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2, method = 'straight') {
  if (method === 'straight') {
    return straightLineDistance(lat1, lon1, lat2, lon2);
  }
  // Could add Mapbox API here if API key is available
  return straightLineDistance(lat1, lon1, lat2, lon2);
}

// Calculate distances for a trip
function calculateTripDistances(tripId) {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
  
  if (!trip) {
    throw new Error(`Trip ${tripId} not found`);
  }
  
  const stops = db.prepare(`
    SELECT 
      ts.id as stop_id,
      ts.sort_order as stop_order,
      l.id as location_id,
      l.name,
      l.latitude,
      l.longitude
    FROM trip_stops ts
    JOIN locations l ON ts.location_id = l.id
    WHERE ts.trip_id = ?
    ORDER BY ts.sort_order
  `).all(tripId);
  
  if (stops.length === 0) {
    return {
      trip_id: tripId,
      trip_name: trip.name,
      stops: [],
      segments: [],
      total_distance: 0
    };
  }
  
  const segments = [];
  let totalDistance = 0;
  
  for (let i = 0; i < stops.length - 1; i++) {
    const from = stops[i];
    const to = stops[i + 1];
    
    const distance = calculateDistance(
      from.latitude,
      from.longitude,
      to.latitude,
      to.longitude
    );
    
    segments.push({
      from: from.name,
      to: to.name,
      distance: Math.round(distance * 10) / 10,
      from_coords: [from.latitude, from.longitude],
      to_coords: [to.latitude, to.longitude]
    });
    
    totalDistance += distance;
  }
  
  return {
    trip_id: tripId,
    trip_name: trip.name,
    stops: stops.map(s => ({
      order: s.stop_order,
      name: s.name,
      coords: [s.latitude, s.longitude]
    })),
    segments,
    total_distance: Math.round(totalDistance * 10) / 10
  };
}

// Calculate distance between two locations by ID
function calculateLocationDistance(id1, id2) {
  const loc1 = db.prepare('SELECT * FROM locations WHERE id = ?').get(id1);
  const loc2 = db.prepare('SELECT * FROM locations WHERE id = ?').get(id2);
  
  if (!loc1) throw new Error(`Location ${id1} not found`);
  if (!loc2) throw new Error(`Location ${id2} not found`);
  
  const distance = calculateDistance(
    loc1.latitude,
    loc1.longitude,
    loc2.latitude,
    loc2.longitude
  );
  
  return {
    from: { id: loc1.id, name: loc1.name, coords: [loc1.latitude, loc1.longitude] },
    to: { id: loc2.id, name: loc2.name, coords: [loc2.latitude, loc2.longitude] },
    distance: Math.round(distance * 10) / 10
  };
}

// Calculate distances for all trips
function calculateAllTrips() {
  const trips = db.prepare('SELECT id FROM trips').all();
  
  const results = trips.map(trip => calculateTripDistances(trip.id));
  
  return {
    total_trips: trips.length,
    trips: results
  };
}

// CLI
const args = process.argv.slice(2);

if (args.includes('--help') || args.length === 0) {
  console.log(`
TrailCamp Route Distance Calculator

Usage:
  node calculate-distances.js --trip <id>           Calculate distances for a trip
  node calculate-distances.js --between <id1> <id2> Distance between two locations
  node calculate-distances.js --all-trips           Calculate all trip distances
  node calculate-distances.js --help                Show this help

Options:
  --trip <id>           Trip ID to analyze
  --between <id1> <id2> Calculate distance between two location IDs
  --all-trips           Calculate distances for all trips
  --json                Output as JSON

Examples:
  node calculate-distances.js --trip 1
  node calculate-distances.js --between 100 200
  node calculate-distances.js --all-trips

Notes:
  - Uses straight-line (as-the-crow-flies) distance
  - Actual driving distance will be longer
  - For accurate driving routes, integrate Mapbox/Google Directions API
  `);
  process.exit(0);
}

const jsonOutput = args.includes('--json');

try {
  let result;
  
  if (args.includes('--trip')) {
    const tripId = parseInt(args[args.indexOf('--trip') + 1]);
    result = calculateTripDistances(tripId);
    
    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`\nTrip: ${result.trip_name} (ID: ${result.trip_id})`);
      console.log('='.repeat(60));
      console.log(`\nStops: ${result.stops.length}`);
      
      if (result.segments.length > 0) {
        console.log('\nRoute Segments:');
        console.log('─'.repeat(60));
        
        for (let i = 0; i < result.segments.length; i++) {
          const seg = result.segments[i];
          console.log(`${i + 1}. ${seg.from}`);
          console.log(`   ↓ ${seg.distance} miles`);
        }
        console.log(`${result.segments.length + 1}. ${result.segments[result.segments.length - 1].to}`);
        
        console.log('\n' + '='.repeat(60));
        console.log(`Total Distance: ${result.total_distance} miles (straight-line)`);
        console.log(`Estimated Driving: ${Math.round(result.total_distance * 1.3)} miles (+30% for roads)`);
        console.log('='.repeat(60) + '\n');
      } else {
        console.log('\nNo route segments (trip has 0-1 stops)\n');
      }
    }
  } else if (args.includes('--between')) {
    const id1 = parseInt(args[args.indexOf('--between') + 1]);
    const id2 = parseInt(args[args.indexOf('--between') + 2]);
    result = calculateLocationDistance(id1, id2);
    
    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`\nDistance Between Locations`);
      console.log('='.repeat(60));
      console.log(`From: ${result.from.name} (ID: ${result.from.id})`);
      console.log(`To:   ${result.to.name} (ID: ${result.to.id})`);
      console.log('─'.repeat(60));
      console.log(`Straight-line: ${result.distance} miles`);
      console.log(`Est. driving:  ${Math.round(result.distance * 1.3)} miles (+30%)`);
      console.log('='.repeat(60) + '\n');
    }
  } else if (args.includes('--all-trips')) {
    result = calculateAllTrips();
    
    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`\nAll Trips Distance Summary`);
      console.log('='.repeat(60));
      console.log(`Total trips: ${result.total_trips}\n`);
      
      for (const trip of result.trips) {
        if (trip.segments.length > 0) {
          console.log(`${trip.trip_name} (ID: ${trip.trip_id})`);
          console.log(`  Stops: ${trip.stops.length}`);
          console.log(`  Distance: ${trip.total_distance} miles (straight-line)`);
          console.log(`  Est. driving: ${Math.round(trip.total_distance * 1.3)} miles\n`);
        } else {
          console.log(`${trip.trip_name} (ID: ${trip.trip_id})`);
          console.log(`  No route (${trip.stops.length} stops)\n`);
        }
      }
      
      const totalDistance = result.trips.reduce((sum, t) => sum + t.total_distance, 0);
      console.log('─'.repeat(60));
      console.log(`Combined distance: ${Math.round(totalDistance)} miles (straight-line)`);
      console.log('='.repeat(60) + '\n');
    }
  }
} catch (err) {
  console.error(`\n✗ Error: ${err.message}\n`);
  process.exit(1);
} finally {
  db.close();
}
