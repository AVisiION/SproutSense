import sys
import json

def calculate_bio_metrics(temp, humidity, light, soil_moisture):
    """
    Simulates complex plant biological metrics based on basic sensor data.
    """
    # Photosynthesis Efficiency (0-100)
    # Optimal: Temp 22-28C, Light 60-90%, Humidity 50-70%
    temp_factor = max(0, 100 - abs(temp - 25) * 4)
    light_factor = max(0, 100 - abs(light - 75) * 2)
    photo_eff = (temp_factor * 0.4 + light_factor * 0.6)
    
    # Transpiration Rate (0-10)
    # Higher with high temp, low humidity, high light
    transpiration = (temp * 0.2 + light * 0.1 - (humidity * 0.05)) / 2
    transpiration = max(0.1, min(10.0, transpiration))
    
    # Metabolic Rate (0-100)
    metabolic = (temp_factor * 0.5 + (100 - abs(soil_moisture - 60) * 2) * 0.5)
    
    # Nitrogen Uptake Potential
    n_potential = max(0, 100 - abs(soil_moisture - 65) * 3)

    return {
        "photosynthesis_efficiency": round(photo_eff, 1),
        "transpiration_rate": round(transpiration, 2),
        "metabolic_rate": round(metabolic, 1),
        "nitrogen_uptake": round(n_potential, 1)
    }

if __name__ == "__main__":
    try:
        # Example input from CLI or just use defaults for demo
        # In real usage, agent would pass current sensor values
        temp = float(sys.argv[1]) if len(sys.argv) > 1 else 24.5
        hum = float(sys.argv[2]) if len(sys.argv) > 2 else 55.0
        light = float(sys.argv[3]) if len(sys.argv) > 3 else 82.0
        moisture = float(sys.argv[4]) if len(sys.argv) > 4 else 62.0
        
        result = calculate_bio_metrics(temp, hum, light, moisture)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
