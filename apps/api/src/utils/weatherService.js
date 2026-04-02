/**
 * Weather Integration Service
 * Supports multiple providers with automatic fallback
 */

import config from '../config/config.js';

class WeatherService {
  constructor() {
    this.providers = [
      {
        name: 'openweathermap',
        url: 'https://api.openweathermap.org/data/2.5/weather',
        apiKey: config.API_KEYS.OPENWEATHER
      },
      {
        name: 'open-meteo',
        url: 'https://api.open-meteo.com/v1/forecast',
        apiKey: null // No key required
      },
      {
        name: 'weatherapi',
        url: 'https://api.weatherapi.com/v1/current.json',
        apiKey: config.API_KEYS.WEATHERAPI
      }
    ];
    
    this.cacheExpiry = 10 * 60 * 1000; // 10 minutes
    this.cache = null;
    this.cacheTime = null;
  }

  /**
   * Get weather data with automatic fallback
   */
  async getWeather(latitude, longitude, provider = null) {
    try {
      // Check cache
      if (this.isCached()) {
        return this.cache;
      }

      let providers = provider 
        ? this.providers.filter(p => p.name === provider)
        : this.providers;

      let weatherData = null;
      let lastError = null;

      // Try each provider in order
      for (const providerConfig of providers) {
        try {
          if (!providerConfig.apiKey && providerConfig.name !== 'open-meteo') {
            continue; // Skip if no API key
          }

          weatherData = await this.fetchFromProvider(providerConfig, latitude, longitude);
          if (weatherData) {
            this.cache = weatherData;
            this.cacheTime = Date.now();
            return weatherData;
          }
        } catch (error) {
          lastError = error;
          console.warn(`Weather provider ${providerConfig.name} failed:`, error.message);
          continue;
        }
      }

      throw lastError || new Error('All weather providers failed');
    } catch (error) {
      console.error('Weather service error:', error);
      return this.getDefaultWeatherData();
    }
  }

  /**
   * Fetch from specific provider
   */
  async fetchFromProvider(provider, latitude, longitude) {
    const timeout = 10000; // 10 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      let url;
      let params;

      switch (provider.name) {
        case 'openweathermap':
          params = {
            lat: latitude,
            lon: longitude,
            units: 'metric',
            appid: provider.apiKey
          };
          url = `${provider.url}?${new URLSearchParams(params)}`;
          break;

        case 'open-meteo':
          params = {
            latitude,
            longitude,
            current: 'temperature_2m,relative_humidity_2m,weather_code,precipitation,temperature_apparent',
            daily: 'precipitation_sum,temperature_2m_max,temperature_2m_min'
          };
          url = `${provider.url}?${new URLSearchParams(params)}`;
          break;

        case 'weatherapi':
          params = {
            key: provider.apiKey,
            q: `${latitude},${longitude}`,
            aqi: 'yes'
          };
          url = `${provider.url}?${new URLSearchParams(params)}`;
          break;

        default:
          throw new Error(`Unknown provider: ${provider.name}`);
      }

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Provider ${provider.name} returned status ${response.status}`);
      }

      const data = await response.json();
      return this.normalizeWeatherData(data, provider.name);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Normalize weather data from different providers to common format
   */
  normalizeWeatherData(data, providerName) {
    let normalized = {
      source: providerName,
      timestamp: new Date(),
      temperature: null,
      humidity: null,
      pressure: null,
      precipitation: null,
      windSpeed: null,
      uvIndex: null,
      description: null,
      condition: null
    };

    switch (providerName) {
      case 'openweathermap':
        normalized.temperature = data.main.temp;
        normalized.humidity = data.main.humidity;
        normalized.pressure = data.main.pressure;
        normalized.windSpeed = data.wind.speed;
        normalized.precipitation = data.rain?.['1h'] || 0;
        normalized.description = data.weather[0].description;
        normalized.condition = data.weather[0].main;
        normalized.uvIndex = data.uvi || null;
        break;

      case 'open-meteo':
        normalized.temperature = data.current.temperature_2m;
        normalized.humidity = data.current.relative_humidity_2m;
        normalized.precipitation = data.current.precipitation || 0;
        normalized.description = this.getWeatherDescription(data.current.weather_code);
        normalized.condition = this.getWeatherCondition(data.current.weather_code);
        break;

      case 'weatherapi':
        normalized.temperature = data.current.temp_c;
        normalized.humidity = data.current.humidity;
        normalized.pressure = data.current.pressure_mb;
        normalized.windSpeed = data.current.wind_kph / 3.6; // Convert to m/s
        normalized.precipitation = data.current.precip_mm;
        normalized.description = data.current.condition.text;
        normalized.condition = data.current.condition.text;
        normalized.uvIndex = data.current.uv;
        break;
    }

    return normalized;
  }

  /**
   * Get weather description from WMO code (Open-Meteo)
   */
  getWeatherDescription(code) {
    const descriptions = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Foggy with rime',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };

    return descriptions[code] || 'Unknown';
  }

  /**
   * Get weather condition from WMO code
   */
  getWeatherCondition(code) {
    if (code === 0) return 'Clear';
    if (code === 1 || code === 2) return 'Cloudy';
    if (code === 3) return 'Overcast';
    if (code >= 45 && code <= 48) return 'Foggy';
    if (code >= 51 && code <= 67) return 'Rainy';
    if (code >= 71 && code <= 86) return 'Snowy';
    if (code >= 80 && code <= 82) return 'Rain Showers';
    if (code >= 85 && code <= 86) return 'Snow Showers';
    if (code >= 95 && code <= 99) return 'Thunderstorm';
    return 'Unknown';
  }

  /**
   * Check if cache is still valid
   */
  isCached() {
    if (!this.cache || !this.cacheTime) return false;
    return Date.now() - this.cacheTime < this.cacheExpiry;
  }

  /**
   * Get default weather data (fallback)
   */
  getDefaultWeatherData() {
    return {
      source: 'default',
      timestamp: new Date(),
      temperature: 20,
      humidity: 60,
      pressure: 1013,
      precipitation: 0,
      windSpeed: 0,
      uvIndex: null,
      description: 'Weather service unavailable',
      condition: 'Unknown'
    };
  }

  /**
   * Get weather impact on plant health
   */
  getWeatherImpact(weatherData, sensorThresholds) {
    const impacts = [];
    const recommendations = [];

    // High temperature impact
    if (weatherData.temperature > sensorThresholds.temperature.heatStressAlert) {
      impacts.push({
        type: 'high_temperature',
        severity: 'warning',
        message: `High temperature (${weatherData.temperature}°C) - increase watering frequency`
      });
      recommendations.push('Increase irrigation intervals');
      recommendations.push('Provide shade if possible');
      recommendations.push('Improve air circulation');
    }

    // Low temperature impact
    if (weatherData.temperature < sensorThresholds.temperature.freezingRisk) {
      impacts.push({
        type: 'low_temperature',
        severity: 'critical',
        message: `Freezing risk (${weatherData.temperature}°C) - protect plant immediately`
      });
      recommendations.push('Protect from frost');
      recommendations.push('Reduce watering');
      recommendations.push('Move plant to warmer location if possible');
    }

    // High humidity + rainfall impact
    if (weatherData.humidity > sensorThresholds.humidity.moldRisk && weatherData.precipitation > 0) {
      impacts.push({
        type: 'disease_risk',
        severity: 'warning',
        message: 'High humidity with rainfall - fungal disease risk'
      });
      recommendations.push('Improve air circulation');
      recommendations.push('Reduce watering');
      recommendations.push('Monitor for fungal symptoms');
    }

    // Intense sunlight impact
    if (weatherData.uvIndex && weatherData.uvIndex > 8) {
      impacts.push({
        type: 'intense_light',
        severity: 'warning',
        message: `Intense UV (index ${weatherData.uvIndex}) - risk of leaf scorching`
      });
      recommendations.push('Provide partial shade during peak hours');
      recommendations.push('Increase watering');
    }

    return {
      impacts,
      recommendations,
      overallRisk: impacts.some(i => i.severity === 'critical') ? 'high' : 
                   impacts.length > 0 ? 'medium' : 'low'
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache = null;
    this.cacheTime = null;
  }
}

export default new WeatherService();
