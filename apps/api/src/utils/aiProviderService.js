/**
 * Multi-AI Provider Service with Fallback
 * Supports Gemini, OpenAI, Grok, and free API fallbacks
 */

import config from '../config/config.js';

class AIProviderService {
  constructor() {
    this.providers = {
      gemini: {
        name: 'Gemini',
        apiKeyField: config.API_KEYS.GEMINI,
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
        model: 'gemini-1.5-flash',
        timeout: 10000
      },
      openai: {
        name: 'OpenAI',
        apiKeyField: config.API_KEYS.OPENAI,
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-3.5-turbo',
        timeout: 15000
      },
      grok: {
        name: 'Grok',
        apiKeyField: config.API_KEYS.GROK,
        endpoint: 'https://api.x.ai/v1/chat/completions',
        model: 'grok-beta',
        timeout: 12000
      }
    };

    this.fallbackOrder = config.AI.PROVIDERS.FALLBACK_ORDER || ['openai', 'grok'];
    this.retryAttempts = config.AI.PROVIDERS.RETRY_ATTEMPTS || 3;
  }

  /**
   * Get AI response with automatic provider fallback
   */
  async getRecommendation(prompt, preferredProvider = 'gemini') {
    let lastError = null;
    const providersToTry = this.buildProviderList(preferredProvider);

    for (const providerName of providersToTry) {
      try {
        const recommendation = await this.callProvider(providerName, prompt);
        return {
          provider: providerName,
          response: recommendation,
          success: true
        };
      } catch (error) {
        lastError = error;
        console.warn(`AI provider ${providerName} failed:`, error.message);
        // Continue to next provider
      }
    }

    // If all providers fail, return a fallback response
    console.error('All AI providers failed:', lastError);
    return {
      provider: 'fallback',
      response: this.generateFallbackRecommendation(prompt),
      success: false,
      error: lastError?.message
    };
  }

  /**
   * Get disease recommendation with AI integration
   */
  async getDiseaseRecommendation(diseaseData, sensorData) {
    const prompt = this.buildDiseasePrompt(diseaseData, sensorData);
    return this.getRecommendation(prompt);
  }

  /**
   * Get plant care tips
   */
  async getPlantTips(sensorData, configData) {
    const prompt = this.buildTipsPrompt(sensorData, configData);
    return this.getRecommendation(prompt);
  }

  /**
   * Build provider list in order of preference
   */
  buildProviderList(preferred) {
    const list = [preferred];
    
    for (const provider of this.fallbackOrder) {
      if (provider !== preferred) {
        list.push(provider);
      }
    }

    return list;
  }

  /**
   * Call specific AI provider
   */
  async callProvider(providerName, prompt) {
    const provider = this.providers[providerName];
    if (!provider) {
      throw new Error(`Unknown provider: ${providerName}`);
    }

    // Check if API key is available
    if (!provider.apiKeyField && providerName !== 'free-api') {
      throw new Error(`API key not configured for ${providerName}`);
    }

    try {
      switch (providerName) {
        case 'gemini':
          return await this.callGemini(prompt, provider);
        case 'openai':
          return await this.callOpenAI(prompt, provider);
        case 'grok':
          return await this.callGrok(prompt, provider);
        case 'free-api':
          return await this.callFreeAPI(prompt);
        default:
          throw new Error(`Unknown provider: ${providerName}`);
      }
    } catch (error) {
      throw new Error(`${providerName} call failed: ${error.message}`);
    }
  }

  /**
   * Call Gemini API
   */
  async callGemini(prompt, provider) {
    const response = await fetch(
      `${provider.endpoint}?key=${provider.apiKeyField}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        }),
        timeout: provider.timeout
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini returned ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  /**
   * Call OpenAI API
   */
  async callOpenAI(prompt, provider) {
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKeyField}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7
      }),
      timeout: provider.timeout
    });

    if (!response.ok) {
      throw new Error(`OpenAI returned ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Call Grok API
   */
  async callGrok(prompt, provider) {
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKeyField}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7
      }),
      timeout: provider.timeout
    });

    if (!response.ok) {
      throw new Error(`Grok returned ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Call free API service (open-meteo or similar)
   */
  async callFreeAPI(prompt) {
    // This is a fallback mechanism that generates structured response
    // without requiring API keys
    return this.generateStructuredResponse(prompt);
  }

  /**
   * Build disease recommendation prompt
   */
  buildDiseasePrompt(diseaseData, sensorData) {
    return `
You are an expert plant pathologist and agricultural advisor. Based on the following disease detection and sensor data, provide specific treatment recommendations.

DISEASE DETECTED:
- Type: ${diseaseData.detectedDisease}
- Confidence: ${(diseaseData.confidence * 100).toFixed(1)}%
- Plant Growth Stage: ${diseaseData.growthStage || 'unknown'}
${diseaseData.plantHealth ? `- Overall Health Score: ${diseaseData.plantHealth.overallScore}/100` : ''}

CURRENT ENVIRONMENTAL CONDITIONS:
- Soil Moisture: ${sensorData.soilMoisture}%
- Temperature: ${sensorData.temperature}°C
- Humidity: ${sensorData.humidity}%
- Light Level: ${sensorData.light} lux
- Soil pH: ${sensorData.pH}

Please provide:
1. Severity assessment (low/medium/high/critical)
2. Immediate action required (if any)
3. Treatment recommendations (organic and chemical options if applicable)
4. Environmental adjustments needed
5. Timeline for recovery
6. Preventive measures for future

Keep response concise and actionable.`;
  }

  /**
   * Build plant tips prompt
   */
  buildTipsPrompt(sensorData, configData) {
    return `
You are an expert plant care advisor. Based on current environmental conditions and plant configuration, provide helpful tips and optimization suggestions.

CURRENT CONDITIONS:
- Soil Moisture: ${sensorData.soilMoisture}%
- Temperature: ${sensorData.temperature}°C
- Humidity: ${sensorData.humidity}%
- Light: ${sensorData.light} lux
- pH: ${sensorData.pH}

PLANT INFORMATION:
- Growth Stage: ${configData.plantGrowth?.stage || 'unknown'}
- Watering Cycles (Today): ${sensorData.wateringCyclesCount || 0}

Please provide:
1. Current plant status (healthy/needs attention/critical)
2. Top 3 actionable tips for today
3. One optimization suggestion
4. Any environmental concerns to monitor

Keep response friendly, concise and practical.`;
  }

  /**
   * Generate fallback response without AI
   */
  generateFallbackRecommendation(prompt) {
    if (prompt.includes('disease')) {
      return {
        severity: 'unknown',
        message: 'Unable to connect to AI service. Common practice: Isolate affected plant, improve air circulation, reduce humidity.',
        actions: [
          'Monitor plant closely for symptom progression',
          'Increase air circulation around plant',
          'Avoid wetting leaves',
          'Consider organic fungicide if condition worsens'
        ]
      };
    }

    return {
      status: 'healthy',
      tips: [
        'Monitor soil moisture regularly',
        'Ensure adequate light exposure',
        'Maintain optimal humidity levels',
        'Continue current watering schedule'
      ],
      recommendations: [
        'Check soil pH monthly',
        'Provide proper drainage',
        'Observe plant growth patterns'
      ]
    };
  }

  /**
   * Generate structured response from prompt
   */
  generateStructuredResponse(prompt) {
    // Extract key information from prompt to generate a structured response
    const hasDisease = prompt.includes('DISEASE');
    
    if (hasDisease) {
      return {
        severity: 'medium',
        treatment: 'Unable to provide AI recommendation. Consult professional plant pathologist.',
        actions: [
          'Document symptoms with photos',
          'Isolate plant from others',
          'Research specific disease treatment',
          'Monitor daily for changes'
        ]
      };
    }

    return {
      tips: [
        'Maintain consistent watering schedule',
        'Ensure 12+ hours of light daily',
        'Keep relative humidity 40-70%',
        'Fertilize based on growth stage'
      ]
    };
  }

  /**
   * Check provider health
   */
  async checkProviderHealth(providerName) {
    try {
      const testPrompt = 'Hello, are you working?';
      await this.callProvider(providerName, testPrompt);
      return { status: 'healthy', provider: providerName };
    } catch (error) {
      return {
        status: 'unavailable',
        provider: providerName,
        error: error.message
      };
    }
  }

  /**
   * Check all providers
   */
  async checkAllProvidersHealth() {
    const results = [];
    
    for (const providerName of Object.keys(this.providers)) {
      const health = await this.checkProviderHealth(providerName);
      results.push(health);
    }

    return {
      timestamp: new Date(),
      providers: results,
      primaryProvider: results[0]?.status === 'healthy' ? results[0].provider : null
    };
  }
}

export default new AIProviderService();
