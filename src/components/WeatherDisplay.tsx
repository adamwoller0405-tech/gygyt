import React, { useEffect, useState } from 'react';
import { Cloud, Sun, CloudRain, Snowflake, CloudLightning, CloudDrizzle, CloudFog, Loader2 } from 'lucide-react';

interface Props {
  locationName: string;
  dateTime: string;
}

interface WeatherData {
  temp: number;
  code: number;
}

const cache = new Map<string, { data: WeatherData; expiry: number }>();

function getWeatherIcon(code: number) {
  if (code === 0) return { icon: Sun, label: 'Derült' };
  if (code <= 3) return { icon: Cloud, label: 'Felhős' };
  if (code <= 48) return { icon: CloudFog, label: 'Ködös' };
  if (code <= 57) return { icon: CloudDrizzle, label: 'Szlengeső' };
  if (code <= 67) return { icon: CloudRain, label: 'Esős' };
  if (code <= 77) return { icon: Snowflake, label: 'Havas' };
  if (code <= 82) return { icon: CloudRain, label: 'Zápor' };
  if (code <= 86) return { icon: Snowflake, label: 'Hózápor' };
  return { icon: CloudLightning, label: 'Viharos' };
}

export const WeatherDisplay: React.FC<Props> = ({ locationName, dateTime }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!locationName) return;
    const cacheKey = `${locationName}_${dateTime.split('T')[0]}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) { setWeather(cached.data); return; }

    const daysDiff = Math.round((new Date(dateTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 7 || daysDiff < -1) return;

    setLoading(true);
    (async () => {
      try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationName)}&count=1&language=hu&format=json`);
        const geoData = await geoRes.json();
        if (!geoData.results?.[0]) { setLoading(false); return; }
        const { latitude, longitude } = geoData.results[0];
        const date = dateTime.split('T')[0];
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,weathercode&timezone=auto&forecast_days=8`);
        const weatherData = await weatherRes.json();
        const dayIndex = weatherData.daily.time.indexOf(date);
        if (dayIndex === -1) { setLoading(false); return; }
        const result: WeatherData = { temp: Math.round(weatherData.daily.temperature_2m_max[dayIndex]), code: weatherData.daily.weathercode[dayIndex] };
        cache.set(cacheKey, { data: result, expiry: Date.now() + 30 * 60 * 1000 });
        setWeather(result);
      } catch {} finally { setLoading(false); }
    })();
  }, [locationName, dateTime]);

  if (loading) return <Loader2 size={12} className="animate-spin text-neutral-500" />;
  if (!weather) return null;

  const { icon: Icon, label } = getWeatherIcon(weather.code);
  return (
    <span className="inline-flex items-center space-x-1 text-[10px] text-neutral-400 font-bold" title={label}>
      <Icon size={12} className="text-brand-orange" />
      <span>{weather.temp}°C</span>
    </span>
  );
};
