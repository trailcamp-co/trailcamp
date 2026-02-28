import { useState, useCallback } from 'react';
import type { WeatherData } from '../types';
import { WEATHER_CODES } from '../types';

export function useWeather() {
  const [weatherCache, setWeatherCache] = useState<Record<string, WeatherData>>({});

  const fetchWeather = useCallback(async (lat: number, lng: number, date: string): Promise<WeatherData | null> => {
    const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)},${date}`;

    const cached = weatherCache[cacheKey];
    if (cached) return cached;

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=America/Denver&start_date=${date}&end_date=${date}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.daily && data.daily.temperature_2m_max && data.daily.temperature_2m_max.length > 0) {
        const weathercode = data.daily.weathercode[0];
        const codeInfo = WEATHER_CODES[weathercode] || { icon: '?', label: 'Unknown' };
        const weather: WeatherData = {
          date,
          high: Math.round(data.daily.temperature_2m_max[0] * 9 / 5 + 32),
          low: Math.round(data.daily.temperature_2m_min[0] * 9 / 5 + 32),
          precipitation: data.daily.precipitation_sum[0],
          weathercode,
          icon: codeInfo.icon,
          label: codeInfo.label,
        };

        setWeatherCache(prev => ({ ...prev, [cacheKey]: weather }));
        return weather;
      }
      return null;
    } catch {
      return null;
    }
  }, [weatherCache]);

  return { weatherCache, fetchWeather };
}
