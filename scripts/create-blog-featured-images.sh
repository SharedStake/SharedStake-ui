#!/bin/bash

# Create blog featured images for each blog post
# This script creates featured images for all blog posts

cd /workspace/public/images

echo "🎨 Creating blog featured images for SharedStake..."

# Blog post slugs and their featured image names
declare -A blog_images=(
    ["ethereum-staking-guide-2024"]="blog-ethereum-staking-guide-2024.jpg"
    ["understanding-liquid-staking-benefits"]="blog-understanding-liquid-staking-benefits.jpg"
    ["defi-integration-opportunities"]="blog-defi-integration-opportunities.jpg"
    ["security-audit-results-certik"]="blog-security-audit-results-certik.jpg"
    ["sharedstake-v2-launch-announcement"]="blog-sharedstake-v2-launch-announcement.jpg"
    ["how-we-updated-sharedstake-ui-with-ai"]="blog-how-we-updated-sharedstake-ui-with-ai.jpg"
    ["eth2-quickstart-introduction"]="blog-ethereum-node-made-simple-eth2-quickstart.jpg"
)

# Create featured images for each blog post
for slug in "${!blog_images[@]}"; do
    image_name="${blog_images[$slug]}"
    
    echo "Creating $image_name..."
    
    # Create a unique image for each blog post with different colors and text
    case $slug in
        "ethereum-staking-guide-2024")
            convert -size 1200x630 xc:'#1a1a1a' \
                -fill '#E20050' -pointsize 60 -gravity center \
                -annotate +0-80 'Ethereum Staking Guide 2024' \
                -fill '#E48CAB' -pointsize 32 -gravity center \
                -annotate +0-20 'Complete Guide to Staking ETH' \
                -fill '#cccccc' -pointsize 24 -gravity center \
                -annotate +0+40 'Learn how to stake ETH and earn 4-8% APR' \
                -fill '#E20050' -pointsize 28 -gravity center \
                -annotate +0+100 'Start Staking Today' \
                "$image_name"
            ;;
        "understanding-liquid-staking-benefits")
            convert -size 1200x630 xc:'#1a1a1a' \
                -fill '#E20050' -pointsize 60 -gravity center \
                -annotate +0-80 'Liquid Staking Benefits' \
                -fill '#E48CAB' -pointsize 32 -gravity center \
                -annotate +0-20 'Stake ETH While Maintaining Liquidity' \
                -fill '#cccccc' -pointsize 24 -gravity center \
                -annotate +0+40 'No 32 ETH minimum • Full liquidity • DeFi integration' \
                -fill '#E20050' -pointsize 28 -gravity center \
                -annotate +0+100 'Discover Liquid Staking' \
                "$image_name"
            ;;
        "defi-integration-opportunities")
            convert -size 1200x630 xc:'#1a1a1a' \
                -fill '#E20050' -pointsize 60 -gravity center \
                -annotate +0-80 'DeFi Integration Opportunities' \
                -fill '#E48CAB' -pointsize 32 -gravity center \
                -annotate +0-20 'Maximize Your Staking Rewards' \
                -fill '#cccccc' -pointsize 24 -gravity center \
                -annotate +0+40 'Use vEth2 across DeFi protocols' \
                -fill '#E20050' -pointsize 28 -gravity center \
                -annotate +0+100 'Explore DeFi Integration' \
                "$image_name"
            ;;
        "security-audit-results-certik")
            convert -size 1200x630 xc:'#1a1a1a' \
                -fill '#E20050' -pointsize 60 -gravity center \
                -annotate +0-80 'Security Audit Results' \
                -fill '#E48CAB' -pointsize 32 -gravity center \
                -annotate +0-20 'Certik Security Audit Complete' \
                -fill '#cccccc' -pointsize 24 -gravity center \
                -annotate +0+40 '95/100 security score • All issues resolved' \
                -fill '#E20050' -pointsize 28 -gravity center \
                -annotate +0+100 'View Audit Report' \
                "$image_name"
            ;;
        "sharedstake-v2-launch-announcement")
            convert -size 1200x630 xc:'#1a1a1a' \
                -fill '#E20050' -pointsize 60 -gravity center \
                -annotate +0-80 'SharedStake V2 Launch' \
                -fill '#E48CAB' -pointsize 32 -gravity center \
                -annotate +0-20 'Next Generation Liquid Staking' \
                -fill '#cccccc' -pointsize 24 -gravity center \
                -annotate +0+40 'Enhanced features • Better rewards • Improved UX' \
                -fill '#E20050' -pointsize 28 -gravity center \
                -annotate +0+100 'Try V2 Now' \
                "$image_name"
            ;;
        "how-we-updated-sharedstake-ui-with-ai")
            convert -size 1200x630 xc:'#1a1a1a' \
                -fill '#E20050' -pointsize 60 -gravity center \
                -annotate +0-80 'AI-Powered UI Updates' \
                -fill '#E48CAB' -pointsize 32 -gravity center \
                -annotate +0-20 'How We Enhanced SharedStake with AI' \
                -fill '#cccccc' -pointsize 24 -gravity center \
                -annotate +0+40 'Smarter interface • Better user experience' \
                -fill '#E20050' -pointsize 28 -gravity center \
                -annotate +0+100 'Experience the Updates' \
                "$image_name"
            ;;
        "eth2-quickstart-introduction")
            convert -size 1200x630 xc:'#1a1a1a' \
                -fill '#E20050' -pointsize 60 -gravity center \
                -annotate +0-80 'Ethereum Node Quickstart' \
                -fill '#E48CAB' -pointsize 32 -gravity center \
                -annotate +0-20 'Run Your Own Ethereum Node' \
                -fill '#cccccc' -pointsize 24 -gravity center \
                -annotate +0+40 'Complete guide to setting up an ETH2 node' \
                -fill '#E20050' -pointsize 28 -gravity center \
                -annotate +0+100 'Start Your Node' \
                "$image_name"
            ;;
    esac
done

echo "✅ All blog featured images created successfully!"
echo ""
echo "📊 File sizes:"
ls -la blog-*.jpg

echo ""
echo "🎯 Blog featured images created:"
for slug in "${!blog_images[@]}"; do
    echo "  - ${blog_images[$slug]} (1200x630px) - $slug"
done