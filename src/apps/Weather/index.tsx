import React, { useState, useEffect } from 'react';
import { 
  Sun, CloudRain, Cloud, CloudLightning, Wind, Droplets, 
  Compass, Eye, Thermometer, Search, MapPin 
} from 'lucide-react';

interface CityData {
  name: string;
  country: string;
  lat: number;
  lon: number;
  temp: number;
  condition: string;
  high: number;
  low: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
}

const PRESET_CITIES: CityData[] = [
  { name: 'San Francisco', country: 'United States', lat: 37.77, lon: -122.41, temp: 64, condition: 'Partly Cloudy', high: 68, low: 52, humidity: 76, windSpeed: 12, uvIndex: 5 },
  { name: 'New York', country: 'United States', lat: 40.71, lon: -74.00, temp: 72, condition: 'Sunny', high: 75, low: 58, humidity: 55, windSpeed: 8, uvIndex: 6 },
  { name: 'London', country: 'United Kingdom', lat: 51.50, lon: -0.12, temp: 58, condition: 'Showers', high: 62, low: 48, humidity: 82, windSpeed: 15, uvIndex: 3 },
  { name: 'Tokyo', country: 'Japan', lat: 35.67, lon: 139.65, temp: 69, condition: 'Clear', high: 73, low: 57, humidity: 62, windSpeed: 9, uvIndex: 7 },
  { name: 'Paris', country: 'France', lat: 48.85, lon: 2.35, temp: 61, condition: 'Mostly Sunny', high: 66, low: 49, humidity: 68, windSpeed: 11, uvIndex: 4 },
];

export const WeatherApp: React.FC<{ windowId: string }> = () => {
  const [selectedCity, setSelectedCity] = useState<CityData>(PRESET_CITIES[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<CityData[]>([]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    const matches = PRESET_CITIES.filter((c) =>
      c.name.toLowerCase().includes(q.toLowerCase())
    );
    setSearchResults(matches);
  };

  const getWeatherIcon = (condition: string, size = 32) => {
    const lower = condition.toLowerCase();
    if (lower.includes('rain') || lower.includes('shower')) return <CloudRain size={size} className="text-blue-400" />;
    if (lower.includes('cloud')) return <Cloud size={size} className="text-neutral-300" />;
    if (lower.includes('storm')) return <CloudLightning size={size} className="text-amber-400" />;
    return <Sun size={size} className="text-yellow-400 animate-pulse" />;
  };

  const hourlyForecast = [
    { time: 'Now', temp: selectedCity.temp, condition: selectedCity.condition },
    { time: '11 AM', temp: selectedCity.temp + 1, condition: 'Sunny' },
    { time: '12 PM', temp: selectedCity.temp + 3, condition: 'Sunny' },
    { time: '1 PM', temp: selectedCity.temp + 4, condition: 'Partly Cloudy' },
    { time: '2 PM', temp: selectedCity.temp + 4, condition: 'Partly Cloudy' },
    { time: '3 PM', temp: selectedCity.temp + 2, condition: 'Showers' },
    { time: '4 PM', temp: selectedCity.temp + 1, condition: 'Partly Cloudy' },
    { time: '5 PM', temp: selectedCity.temp - 1, condition: 'Clear' },
  ];

  const dailyForecast = [
    { day: 'Today', high: selectedCity.high, low: selectedCity.low, condition: selectedCity.condition },
    { day: 'Wed', high: selectedCity.high + 2, low: selectedCity.low + 1, condition: 'Sunny' },
    { day: 'Thu', high: selectedCity.high - 1, low: selectedCity.low - 2, condition: 'Partly Cloudy' },
    { day: 'Fri', high: selectedCity.high - 3, low: selectedCity.low - 1, condition: 'Showers' },
    { day: 'Sat', high: selectedCity.high + 1, low: selectedCity.low, condition: 'Sunny' },
    { day: 'Sun', high: selectedCity.high + 3, low: selectedCity.low + 2, condition: 'Clear' },
    { day: 'Mon', high: selectedCity.high + 2, low: selectedCity.low + 1, condition: 'Sunny' },
  ];

  return (
    <div className="flex h-full w-full bg-gradient-to-b from-sky-600 via-sky-700 to-indigo-900 text-white select-none overflow-y-auto">
      <div className="mx-auto flex w-full max-w-2xl flex-col p-6 space-y-6">
        {/* City Search Bar */}
        <div className="relative">
          <div className="flex items-center rounded-xl bg-white/15 px-3 py-1.5 backdrop-blur-md border border-white/20">
            <Search size={14} className="text-white/70 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for a city..."
              className="w-full bg-transparent text-xs text-white placeholder-white/60 outline-none"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="absolute top-10 left-0 right-0 z-50 rounded-xl border border-white/20 bg-neutral-900/95 backdrop-blur-xl p-2 shadow-2xl space-y-1">
              {searchResults.map((c) => (
                <div
                  key={c.name}
                  onClick={() => {
                    setSelectedCity(c);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 cursor-pointer text-xs"
                >
                  <span className="font-medium">{c.name}, {c.country}</span>
                  <span className="tabular-nums font-semibold">{c.temp}°F</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hero Weather Info */}
        <div className="text-center space-y-1 drop-shadow-md">
          <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-white/80">
            <MapPin size={13} />
            <span>{selectedCity.name}</span>
          </div>
          <div className="text-6xl font-light tracking-tighter tabular-nums py-1">
            {selectedCity.temp}°
          </div>
          <div className="text-sm font-medium text-white/90">{selectedCity.condition}</div>
          <div className="text-xs text-white/70 tabular-nums">
            H: {selectedCity.high}°  L: {selectedCity.low}°
          </div>
        </div>

        {/* Hourly Forecast Carousel */}
        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md shadow-lg space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
            Hourly Forecast
          </div>
          <div className="flex items-center justify-between overflow-x-auto gap-4 py-1">
            {hourlyForecast.map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-2 min-w-[50px] text-xs">
                <span className="text-white/70 text-[11px]">{h.time}</span>
                {getWeatherIcon(h.condition, 20)}
                <span className="font-semibold tabular-nums">{h.temp}°</span>
              </div>
            ))}
          </div>
        </div>

        {/* 7-Day Forecast */}
        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md shadow-lg space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
            7-Day Forecast
          </div>
          <div className="divide-y divide-white/10 text-xs">
            {dailyForecast.map((d, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <span className="w-16 font-medium text-white/90">{d.day}</span>
                <div className="flex items-center justify-center w-10">
                  {getWeatherIcon(d.condition, 16)}
                </div>
                <div className="flex items-center gap-3 text-right">
                  <span className="text-white/60 tabular-nums">{d.low}°</span>
                  <div className="h-1.5 w-24 rounded-full bg-white/20 overflow-hidden relative">
                    <div className="absolute inset-y-0 bg-amber-400 rounded-full w-2/3 left-1/6" />
                  </div>
                  <span className="font-semibold tabular-nums w-6">{d.high}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-md space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] text-white/60 uppercase font-semibold">
              <Droplets size={12} />
              <span>Humidity</span>
            </div>
            <div className="text-xl font-bold tabular-nums">{selectedCity.humidity}%</div>
            <p className="text-[10px] text-white/60">The dew point is 50° right now.</p>
          </div>

          <div className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-md space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] text-white/60 uppercase font-semibold">
              <Wind size={12} />
              <span>Wind</span>
            </div>
            <div className="text-xl font-bold tabular-nums">{selectedCity.windSpeed} mph</div>
            <p className="text-[10px] text-white/60">Breezy from the NW.</p>
          </div>

          <div className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-md space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] text-white/60 uppercase font-semibold">
              <Sun size={12} />
              <span>UV Index</span>
            </div>
            <div className="text-xl font-bold tabular-nums">{selectedCity.uvIndex} Moderate</div>
            <p className="text-[10px] text-white/60">Protection recommended till 4 PM.</p>
          </div>

          <div className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-md space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] text-white/60 uppercase font-semibold">
              <Eye size={12} />
              <span>Visibility</span>
            </div>
            <div className="text-xl font-bold tabular-nums">10 mi</div>
            <p className="text-[10px] text-white/60">Perfect clarity today.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
