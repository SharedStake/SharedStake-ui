#!/bin/bash

# Create social sharing images for SharedStake
# This script creates og-image.jpg, twitter-card.jpg, and favicon files

cd /workspace/public/images

echo "🎨 Creating SharedStake social sharing images..."

# Create a simple colored background for the images
# We'll use ImageMagick to create the images with text and colors

# Create og-image.jpg (1200x630px)
echo "Creating og-image.jpg..."
convert -size 1200x630 xc:'#1a1a1a' \
    -fill '#E20050' -pointsize 72 -font Arial-Bold -gravity center \
    -annotate +0-100 'SharedStake' \
    -fill '#E48CAB' -pointsize 36 -font Arial \
    -annotate +0-20 'Ethereum Liquid Staking Platform' \
    -fill '#cccccc' -pointsize 24 -font Arial \
    -annotate +0+60 '4-8% APR • No 32 ETH Minimum • Full Liquidity' \
    -fill '#E20050' -pointsize 28 -font Arial-Bold \
    -annotate +0+120 'Start Staking Today' \
    og-image.jpg

# Create twitter-card.jpg (1200x630px) - similar but optimized for Twitter
echo "Creating twitter-card.jpg..."
convert -size 1200x630 xc:'#1a1a1a' \
    -fill '#E20050' -pointsize 80 -font Arial-Bold -gravity center \
    -annotate +0-80 'SharedStake' \
    -fill '#E48CAB' -pointsize 40 -font Arial \
    -annotate +0+0 'Ethereum Liquid Staking Platform' \
    -fill '#cccccc' -pointsize 28 -font Arial \
    -annotate +0+60 '4-8% APR • No 32 ETH Minimum • Full Liquidity' \
    -fill '#E20050' -pointsize 32 -font Arial-Bold \
    -annotate +0+120 'Start Staking Today' \
    twitter-card.jpg

# Create favicon files
echo "Creating favicon files..."

# Create 32x32 favicon
convert -size 32x32 xc:'#E20050' \
    -fill white -pointsize 20 -font Arial-Bold -gravity center \
    -annotate +0+0 'S' \
    favicon-32x32.png

# Create 16x16 favicon
convert -size 16x16 xc:'#E20050' \
    -fill white -pointsize 12 -font Arial-Bold -gravity center \
    -annotate +0+0 'S' \
    favicon-16x16.png

# Create 180x180 apple touch icon
convert -size 180x180 xc:'#E20050' \
    -fill white -pointsize 120 -font Arial-Bold -gravity center \
    -annotate +0+0 'S' \
    apple-touch-icon.png

# Create favicon.ico (convert from 32x32)
convert favicon-32x32.png favicon.ico

echo "✅ All social sharing images created successfully!"
echo ""
echo "📊 File sizes:"
ls -la og-image.jpg twitter-card.jpg favicon.ico favicon-*.png apple-touch-icon.png

echo ""
echo "🎯 Images created:"
echo "  - og-image.jpg (1200x630px) - Open Graph social sharing"
echo "  - twitter-card.jpg (1200x630px) - Twitter card image"
echo "  - favicon.ico (32x32px) - Browser favicon"
echo "  - favicon-16x16.png (16x16px) - Small favicon"
echo "  - favicon-32x32.png (32x32px) - Standard favicon"
echo "  - apple-touch-icon.png (180x180px) - iOS home screen icon"