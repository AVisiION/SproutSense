#!/usr/bin/env python3
"""
Training Data Organizer for Edge Impulse
Organizes collected images into class folders and prepares for upload

Usage:
    python prepare_dataset.py --input training_images/ --output organized_dataset/
"""

import os
import sys
import shutil
import argparse
from pathlib import Path
from collections import defaultdict

# Disease classes for SproutSense
DISEASE_CLASSES = [
    'healthy',
    'leaf_spot',
    'powdery_mildew',
    'rust',
    'bacterial_blight',
    'viral_mosaic',
    'nutrient_deficiency',
    'pest_damage',
    'unknown'
]

class DatasetOrganizer:
    def __init__(self, input_dir, output_dir):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.image_count = defaultdict(int)
        
    def create_folder_structure(self):
        """Create disease class folders"""
        print("Creating folder structure...")
        
        for disease_class in DISEASE_CLASSES:
            class_dir = self.output_dir / disease_class
            class_dir.mkdir(parents=True, exist_ok=True)
            print(f"  ✅ Created: {class_dir}")
        
        print()
    
    def manual_organization_mode(self):
        """Interactive mode to manually label images"""
        print("\n" + "="*60)
        print("MANUAL ORGANIZATION MODE")
        print("="*60)
        print("\nAvailable classes:")
        for idx, cls in enumerate(DISEASE_CLASSES, 1):
            print(f"  {idx}. {cls}")
        print(f"  0. Skip this image")
        print(f"  q. Quit")
        print()
        
        # Get all images from input directory
        image_files = list(self.input_dir.glob("*.jpg")) + list(self.input_dir.glob("*.jpeg"))
        image_files.sort()
        
        print(f"Found {len(image_files)} images to organize\n")
        
        for img_file in image_files:
            print(f"\nImage: {img_file.name}")
            print(f"Full path: {img_file}")
            
            # Get user input
            while True:
                choice = input("Select class (1-9, 0=skip, q=quit): ").strip().lower()
                
                if choice == 'q':
                    print("\n✅ Organization stopped by user")
                    self.print_summary()
                    return
                
                if choice == '0':
                    print("  ⏭️  Skipped")
                    break
                
                try:
                    choice_num = int(choice)
                    if 1 <= choice_num <= len(DISEASE_CLASSES):
                        # Copy image to appropriate folder
                        disease_class = DISEASE_CLASSES[choice_num - 1]
                        dest_dir = self.output_dir / disease_class
                        dest_file = dest_dir / img_file.name
                        
                        shutil.copy2(img_file, dest_file)
                        self.image_count[disease_class] += 1
                        
                        print(f"  ✅ Copied to: {disease_class}/")
                        break
                    else:
                        print("  ❌ Invalid number. Try again.")
                except ValueError:
                    print("  ❌ Invalid input. Try again.")
        
        print("\n✅ All images processed!")
        self.print_summary()
    
    def auto_organization_mode(self, class_name):
        """Automatically move all images to specified class folder"""
        print(f"\nAUTO ORGANIZATION MODE: Moving all images to '{class_name}'/")
        
        if class_name not in DISEASE_CLASSES:
            print(f"❌ Error: Invalid class name '{class_name}'")
            print(f"Valid classes: {', '.join(DISEASE_CLASSES)}")
            return
        
        # Get all images
        image_files = list(self.input_dir.glob("*.jpg")) + list(self.input_dir.glob("*.jpeg"))
        
        # Copy to class folder
        dest_dir = self.output_dir / class_name
        
        for img_file in image_files:
            dest_file = dest_dir / img_file.name
            shutil.copy2(img_file, dest_file)
            self.image_count[class_name] += 1
            print(f"  ✅ Moved: {img_file.name}")
        
        print(f"\n✅ Moved {len(image_files)} images to {class_name}/")
        self.print_summary()
    
    def print_summary(self):
        """Print dataset statistics"""
        print("\n" + "="*60)
        print("DATASET SUMMARY")
        print("="*60)
        
        total = 0
        for disease_class in DISEASE_CLASSES:
            count = self.image_count[disease_class]
            if count > 0:
                print(f"  {disease_class:25s}: {count:4d} images")
                total += count
        
        print(f"  {'TOTAL':25s}: {total:4d} images")
        print("="*60)
        
        # Check for class imbalance
        if total > 0:
            counts = [self.image_count[cls] for cls in DISEASE_CLASSES if self.image_count[cls] > 0]
            if counts:
                min_count = min(counts)
                max_count = max(counts)
                imbalance_ratio = max_count / min_count if min_count > 0 else float('inf')
                
                print(f"\n📊 Dataset Balance:")
                print(f"   Min samples: {min_count}")
                print(f"   Max samples: {max_count}")
                print(f"   Imbalance ratio: {imbalance_ratio:.2f}x")
                
                if imbalance_ratio > 3:
                    print(f"   ⚠️  Warning: High class imbalance!")
                    print(f"   Recommendation: Collect more samples for underrepresented classes")
                else:
                    print(f"   ✅ Good balance!")
        
        print(f"\n📁 Output directory: {self.output_dir}")
        print(f"\n📝 Next steps:")
        print(f"   1. Review images in each class folder")
        print(f"   2. Remove any mislabeled or poor quality images")
        print(f"   3. Upload to Edge Impulse Studio:")
        print(f"      - Go to Data Acquisition")
        print(f"      - Click 'Upload Data'")
        print(f"      - Select folder for each class")
        print(f"      - Edge Impulse will auto-split train/test (80/20)")

def main():
    parser = argparse.ArgumentParser(description="Organize training images for Edge Impulse")
    parser.add_argument('--input', '-i', required=True, help='Input directory with raw images')
    parser.add_argument('--output', '-o', required=True, help='Output directory for organized dataset')
    parser.add_argument('--class', '-c', dest='class_name', help='Auto-organize all images to this class')
    parser.add_argument('--list-classes', action='store_true', help='List available disease classes')
    
    args = parser.parse_args()
    
    # List classes and exit
    if args.list_classes:
        print("\nAvailable disease classes:")
        for idx, cls in enumerate(DISEASE_CLASSES, 1):
            print(f"  {idx}. {cls}")
        return
    
    # Check input directory
    if not os.path.exists(args.input):
        print(f"❌ Error: Input directory not found: {args.input}")
        sys.exit(1)
    
    # Create organizer
    organizer = DatasetOrganizer(args.input, args.output)
    organizer.create_folder_structure()
    
    # Choose mode
    if args.class_name:
        # Auto mode - move all to specified class
        organizer.auto_organization_mode(args.class_name)
    else:
        # Manual mode - interactively label each image
        organizer.manual_organization_mode()

if __name__ == "__main__":
    main()
