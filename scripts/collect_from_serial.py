#!/usr/bin/env python3
"""
ESP32-CAM Serial Data Collector
Automatically collects training images from ESP32-CAM via serial port

Usage:
    python collect_from_serial.py --port COM3 --output training_images/ --count 100

Requires:
    pip install pyserial
"""

import serial
import sys
import argparse
import os
import base64
from pathlib import Path
from datetime import datetime

class SerialImageCollector:
    def __init__(self, port, baudrate=115200, output_dir="training_images"):
        self.port = port
        self.baudrate = baudrate
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.images_collected = 0
        self.current_image_data = ""
        self.collecting = False
        
    def connect(self):
        """Connect to ESP32-CAM via serial"""
        print(f"Connecting to {self.port} at {self.baudrate} baud...")
        try:
            self.ser = serial.Serial(self.port, self.baudrate, timeout=1)
            print("✅ Connected successfully")
            return True
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            return False
    
    def collect_images(self, max_images=100):
        """Collect images from serial stream"""
        print(f"\nCollecting up to {max_images} images...")
        print("Press Ctrl+C to stop\n")
        
        try:
            while self.images_collected < max_images:
                line = self.ser.readline().decode('utf-8', errors='ignore').strip()
                
                if not line:
                    continue
                
                # Print non-image lines for debugging
                if not self.collecting and not line.startswith("[DATA_IMAGE_"):
                    print(f"[ESP32] {line}")
                
                # Detect image start
                if "[DATA_IMAGE_START]" in line:
                    self.collecting = True
                    self.current_image_data = ""
                    print(f"📷 Receiving image #{self.images_collected + 1}...", end="", flush=True)
                    continue
                
                # Detect image end
                if "[DATA_IMAGE_END]" in line:
                    self.collecting = False
                    self.save_image(self.current_image_data)
                    continue
                
                # Collect base64 data
                if self.collecting:
                    self.current_image_data += line
        
        except KeyboardInterrupt:
            print("\n\n⚠️  Collection interrupted by user")
        
        finally:
            self.ser.close()
            print(f"\n✅ Collection complete: {self.images_collected} images saved")
            print(f"📁 Output directory: {self.output_dir}")
    
    def save_image(self, base64_data):
        """Decode and save base64 image data"""
        try:
            # Remove any whitespace
            base64_data = ''.join(base64_data.split())
            
            # Decode base64
            image_binary = base64.b64decode(base64_data)
            
            # Generate filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"image_{self.images_collected + 1:03d}_{timestamp}.jpg"
            filepath = self.output_dir / filename
            
            # Save to file
            with open(filepath, 'wb') as f:
                f.write(image_binary)
            
            self.images_collected += 1
            print(f" ✅ Saved: {filename} ({len(image_binary)} bytes)")
            
        except Exception as e:
            print(f" ❌ Failed: {e}")

def main():
    parser = argparse.ArgumentParser(description="Collect training images from ESP32-CAM")
    parser.add_argument('--port', '-p', required=True, help='Serial port (e.g., COM3, /dev/ttyUSB0)')
    parser.add_argument('--baudrate', '-b', type=int, default=115200, help='Baud rate (default: 115200)')
    parser.add_argument('--output', '-o', default='training_images', help='Output directory')
    parser.add_argument('--count', '-c', type=int, default=100, help='Maximum images to collect')
    
    args = parser.parse_args()
    
    # Create collector
    collector = SerialImageCollector(args.port, args.baudrate, args.output)
    
    # Connect and collect
    if collector.connect():
        collector.collect_images(args.count)
        
        print("\n📝 Next steps:")
        print(f"1. Review images in: {args.output}/")
        print(f"2. Organize into disease class folders:")
        print(f"   {args.output}/healthy/")
        print(f"   {args.output}/leaf_spot/")
        print(f"   {args.output}/powdery_mildew/")
        print(f"   etc.")
        print(f"3. Upload to Edge Impulse Studio")
        print(f"4. Train your model")

if __name__ == "__main__":
    # Check if pyserial is installed
    try:
        import serial
    except ImportError:
        print("❌ Error: pyserial not installed")
        print("Install with: pip install pyserial")
        sys.exit(1)
    
    main()
