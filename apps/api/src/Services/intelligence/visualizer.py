import sys
import json
import pandas as pd
import matplotlib.pyplot as plt
import os

def generate_trend_chart(data, output_path):
    """
    Generates a trend chart for soil moisture and temperature.
    """
    if not data:
        return False

    df = pd.DataFrame(data)
    
    # Ensure numeric types and handle dates
    df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
    for col in ['soilMoisture', 'temperature']:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    df = df.dropna().sort_values('timestamp')

    if df.empty:
        return False

    # Create plot
    plt.style.use('dark_background')
    fig, ax1 = plt.subplots(figsize=(10, 5), dpi=100)

    # Glass-like styling
    fig.patch.set_facecolor('#050f0b')
    ax1.set_facecolor('#050f0b')
    
    color_moisture = '#18bcaf'
    ax1.set_xlabel('Time', color='#9ca3af', fontweight='bold')
    ax1.set_ylabel('Moisture (%)', color=color_moisture, fontweight='bold')
    ax1.plot(df['timestamp'], df['soilMoisture'], color=color_moisture, linewidth=2, label='Moisture')
    ax1.tick_params(axis='y', labelcolor=color_moisture)
    ax1.grid(True, alpha=0.1)

    ax2 = ax1.twinx()
    color_temp = '#3a8f3e'
    ax2.set_ylabel('Temp (°C)', color=color_temp, fontweight='bold')
    ax2.plot(df['timestamp'], df['temperature'], color=color_temp, linewidth=2, linestyle='--', label='Temp')
    ax2.tick_params(axis='y', labelcolor=color_temp)

    plt.title('SproutSense Health Trends', color='white', pad=20, fontweight='800')
    
    # Remove borders
    ax1.spines['top'].set_visible(False)
    ax1.spines['right'].set_visible(False)
    ax1.spines['left'].set_visible(False)
    ax2.spines['top'].set_visible(False)
    ax2.spines['left'].set_visible(False)

    plt.tight_layout()
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    plt.savefig(output_path, facecolor=fig.get_facecolor(), transparent=True)
    plt.close()
    return True

if __name__ == "__main__":
    try:
        # Expected arguments: <input_json_path> <output_png_path>
        if len(sys.argv) < 3:
            sys.exit(1)
            
        input_path = sys.argv[1]
        output_path = sys.argv[2]
        
        with open(input_path, 'r') as f:
            data = json.load(f)
            
        success = generate_trend_chart(data, output_path)
        if success:
            print("Success")
        else:
            print("Insufficient data")
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)
