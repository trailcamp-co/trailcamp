import { useState, useCallback } from 'react';
import type { Location } from '../types';
import type { MapBounds } from '../components/map';

export function useMapInteraction() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [flyToLocation, setFlyToLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);

  const handleLocationClick = useCallback((location: Location) => {
    setSelectedLocation(location);
    setShowRightPanel(true);
    setShowStats(false);
  }, []);

  const handleCloseRightPanel = useCallback(() => {
    setShowRightPanel(false);
    setSelectedLocation(null);
  }, []);

  const handleFlyTo = useCallback((lng: number, lat: number) => {
    setFlyToLocation({ lng, lat });
    setTimeout(() => setFlyToLocation(null), 100);
  }, []);

  const handleToggleStats = useCallback(() => {
    setShowStats(prev => !prev);
    setShowRightPanel(false);
  }, []);

  return {
    selectedLocation,
    showRightPanel,
    showStats,
    setShowStats,
    flyToLocation,
    mapBounds,
    setMapBounds,
    handleLocationClick,
    handleCloseRightPanel,
    handleFlyTo,
    handleToggleStats,
  };
}
