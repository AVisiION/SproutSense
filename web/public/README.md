# SproutSense Image Assets

This folder contains all the image assets for the SproutSense landing page and social media integration.

## Files

### Favicons & Icons
- **favicon.svg** - Browser tab icon (64×64 optimized)
- **apple-touch-icon.svg** - iOS home screen icon (180×180)
- **safari-pinned-tab.svg** - Safari pinned tab icon (16×16 monochrome)

### Social Media Sharing
- **og-image.svg** - Open Graph image for Facebook, LinkedIn (1200×630)
- **twitter-card.svg** - Twitter card image (1200×675)

### Hero Section
- **hero-setup.svg** - Main hero image showing IoT plant setup with ESP32, sensors, and plant pot (800×600)

## Design System

All images follow the SproutSense brand guidelines:

**Colors:**
- Primary Green: `#22c55e` (plant health, growth)
- Teal: `#14b8a6` (IoT sensors, technology)
- Cyan: `#22d3ee` (data, connectivity)
- Leaf Green: `#4ade80` (accent, highlights)
- Dark Background: `#050d14` to `#0f2535` (professional, tech-focused)

## Customization

These SVG files can be customized in any vector graphics editor:
- Adobe Illustrator
- Figma
- Inkscape (free)

### Replacing with Photos

If you prefer to use real photographs instead of SVG illustrations:

1. Take high-quality photos of your physical IoT setup
2. Recommended dimensions:
   - Hero image: 1600×1200 px (4:3)
   - OG image: 1200×630 px (1.91:1)
   - Twitter card: 1200×675 px (16:9)
3. Optimize images:
   ```bash
   # Using ImageMagick
   convert input.jpg -quality 85 -strip output.jpg
   
   # Using WebP for better compression
   cwebp -q 85 input.jpg -o output.webp
   ```
4. Replace the SVG files with `.jpg`, `.png`, or `.webp` versions
5. Update references in `/index.html` to match new file extensions

## SEO Impact

These images are crucial for:
- **Social Media Sharing** - og-image.svg and twitter-card.svg display when sharing links on Facebook, LinkedIn, Twitter
- **Search Appearance** - Proper Open Graph tags improve link previews
- **Professional Presentation** - Shows visitors the physical IoT setup immediately

## Validation

Test social media previews:
- **Facebook/LinkedIn**: https://developers.facebook.com/tools/debug/
- **Twitter**: https://cards-dev.twitter.com/validator
- **Open Graph**: https://www.opengraph.xyz/

Simply paste your deployed URL (e.g., https://sproutsense-iot.netlify.app/) to see how the images appear.
