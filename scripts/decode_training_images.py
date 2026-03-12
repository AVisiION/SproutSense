#!/usr/bin/env python3
"""
Edge Impulse Training Data Decoder
Decodes base64 images captured from ESP32-CAM for Edge Impulse training

Usage:
    python decode_training_images.py serial_output.txt output_folder/

Serial output format:
    [DATA_IMAGE_START]
    <base64 data>
    [DATA_IMAGE_END]
"""

import sys
import os
import re
import base64
from pathlib import Path

def decode_images_from_serial(input_file, output_dir):
    """
    Extract and decode base64 images from ESP32-CAM serial output
    
    Args:
        input_file: Path to text file containing serial monitor output
        output_dir: Directory to save decoded JPEG images
    """
    # Create output directory if it doesn't exist
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Read serial output
    with open(input_file, 'r') as f:
        content = f.read()
    
    # Find all images between markers
    pattern = r'\[DATA_IMAGE_START\](.*?)\[DATA_IMAGE_END\]'
    matches = re.findall(pattern, content, re.DOTALL)
    
    print(f"Found {len(matches)} images in serial output")
    
    # Decode each image
    for idx, base64_data in enumerate(matches, start=1):
        # Remove whitespace and newlines
        base64_data = ''.join(base64_data.split())
        
        try:
            # Decode base64 to binary
            image_binary = base64.b64decode(base64_data)
            
            # Generate filename
            output_file = output_path / f"training_image_{idx:03d}.jpg"
            
            # Write to file
            with open(output_file, 'wb') as f:
                f.write(image_binary)
            
            print(f"✅ Decoded: {output_file} ({len(image_binary)} bytes)")
            
        except Exception as e:
            print(f"❌ Failed to decode image #{idx}: {e}")
    
    print(f"\n✅ Decoded {len(matches)} images to {output_dir}")
    print(f"\nNext steps:")
    print(f"1. Manually review and label images")
    print(f"2. Organize into folders by disease class:")
    print(f"   {output_dir}/healthy/")
    print(f"   {output_dir}/leaf_spot/")
    print(f"   {output_dir}/powdery_mildew/")
    print(f"   etc.")
    print(f"3. Upload to Edge Impulse Studio")

def main():
    if len(sys.argv) < 3:
        print("Usage: python decode_training_images.py <input_serial.txt> <output_folder>")
        print("\nExample:")
        print("  python decode_training_images.py serial_output.txt training_images/")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_dir = sys.argv[2]
    
    if not os.path.exists(input_file):
        print(f"❌ Error: Input file not found: {input_file}")
        sys.exit(1)
    
    decode_images_from_serial(input_file, output_dir)

if __name__ == "__main__":
    main()
