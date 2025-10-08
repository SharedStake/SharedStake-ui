#!/usr/bin/env node

/**
 * Image Optimization Script for SharedStake
 * 
 * This script optimizes images in the public/images directory
 * to improve performance and reduce bundle size.
 */

const fs = require('fs');
const path = require('path');

// Image optimization configuration
const config = {
  // Source and destination directories
  sourceDir: path.join(__dirname, '../public/images'),
  outputDir: path.join(__dirname, '../public/images/optimized'),
  
  // Optimization settings
  optimization: {
    // PNG optimization
    png: {
      quality: 80,
      maxWidth: 1200,
      maxHeight: 1200
    },
    
    // JPEG optimization
    jpg: {
      quality: 85,
      maxWidth: 1200,
      maxHeight: 1200
    },
    
    // WebP conversion
    webp: {
      quality: 80,
      maxWidth: 1200,
      maxHeight: 1200
    }
  },
  
  // Critical images that need immediate optimization
  criticalImages: [
    'vEth2_1.png',      // 1.44 MiB - CRITICAL
    'roadmap.png',      // 350 KiB - HIGH
    'tokenomics.png',   // 298 KiB - HIGH
    'logo-white.svg',   // Keep as SVG
    'logo-red.svg',     // Keep as SVG
    'eth.png',          // Medium priority
    'vEth2.png'         // Medium priority
  ],
  
  // Images to convert to WebP
  webpConversion: [
    'vEth2_1.png',
    'roadmap.png',
    'tokenomics.png',
    'eth.png',
    'vEth2.png'
  ]
};

/**
 * Get file size in human readable format
 */
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  const bytes = stats.size;
  
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Analyze current image sizes
 */
function analyzeImages() {
  console.log('🔍 Analyzing current image sizes...\n');
  
  const images = fs.readdirSync(config.sourceDir);
  const imageFiles = images.filter(file => 
    /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(file)
  );
  
  const analysis = {
    totalFiles: imageFiles.length,
    totalSize: 0,
    largeImages: [],
    criticalImages: []
  };
  
  imageFiles.forEach(file => {
    const filePath = path.join(config.sourceDir, file);
    const size = fs.statSync(filePath).size;
    const sizeFormatted = getFileSize(filePath);
    
    analysis.totalSize += size;
    
    // Identify large images (> 100 KB)
    if (size > 100 * 1024) {
      analysis.largeImages.push({
        file,
        size: sizeFormatted,
        bytes: size
      });
    }
    
    // Identify critical images
    if (config.criticalImages.includes(file)) {
      analysis.criticalImages.push({
        file,
        size: sizeFormatted,
        bytes: size
      });
    }
  });
  
  console.log(`📊 Analysis Results:`);
  console.log(`   Total images: ${analysis.totalFiles}`);
  const totalSizeFormatted = analysis.totalSize > 0 ? 
    (analysis.totalSize / 1024 / 1024).toFixed(2) + ' MB' : '0 Bytes';
  console.log(`   Total size: ${totalSizeFormatted}`);
  console.log(`   Large images (>100KB): ${analysis.largeImages.length}`);
  console.log(`   Critical images: ${analysis.criticalImages.length}\n`);
  
  if (analysis.largeImages.length > 0) {
    console.log('🚨 Large Images (>100KB):');
    analysis.largeImages
      .sort((a, b) => b.bytes - a.bytes)
      .forEach(img => {
        console.log(`   ${img.file}: ${img.size}`);
      });
    console.log('');
  }
  
  if (analysis.criticalImages.length > 0) {
    console.log('⚡ Critical Images (High Priority):');
    analysis.criticalImages
      .sort((a, b) => b.bytes - a.bytes)
      .forEach(img => {
        console.log(`   ${img.file}: ${img.size}`);
      });
    console.log('');
  }
  
  return analysis;
}

/**
 * Generate optimization recommendations
 */
function generateRecommendations(analysis) {
  console.log('💡 Optimization Recommendations:\n');
  
  // Critical images
  const criticalLarge = analysis.criticalImages.filter(img => img.bytes > 100 * 1024);
  if (criticalLarge.length > 0) {
    console.log('🚨 CRITICAL - Optimize these images immediately:');
    criticalLarge.forEach(img => {
      const targetSize = Math.round(img.bytes * 0.2); // 80% reduction
      const targetSizeFormatted = (targetSize / 1024).toFixed(1) + ' KB';
      console.log(`   ${img.file}: ${img.size} → Target: ${targetSizeFormatted}`);
    });
    console.log('');
  }
  
  // WebP conversion recommendations
  console.log('🔄 Convert to WebP format:');
  config.webpConversion.forEach(file => {
    const filePath = path.join(config.sourceDir, file);
    if (fs.existsSync(filePath)) {
      const size = getFileSize(filePath);
      const estimatedWebPSize = Math.round(fs.statSync(filePath).size * 0.7); // 30% reduction
      const estimatedSizeFormatted = (estimatedWebPSize / 1024).toFixed(1) + ' KB';
      console.log(`   ${file}: ${size} → ~${estimatedSizeFormatted} (WebP)`);
    }
  });
  console.log('');
  
  // General recommendations
  console.log('📋 General Recommendations:');
  console.log('   1. Compress PNG images with quality 80-85%');
  console.log('   2. Convert large images to WebP format');
  console.log('   3. Resize images to actual display dimensions');
  console.log('   4. Use responsive images with srcset');
  console.log('   5. Implement lazy loading for below-the-fold images');
  console.log('');
}

/**
 * Generate alt text recommendations
 */
function generateAltTextRecommendations() {
  console.log('🏷️ Alt Text Recommendations:\n');
  
  const altTextMap = {
    'vEth2_1.png': 'vETH2 token large - SharedStake liquid staking token representing staked ETH',
    'vEth2.png': 'vETH2 token - SharedStake liquid staking token',
    'eth.png': 'Ethereum ETH token logo',
    'roadmap.png': 'SharedStake development roadmap showing project timeline and milestones',
    'tokenomics.png': 'SharedStake tokenomics diagram showing token distribution and economics',
    'logo-white.svg': 'SharedStake logo white - Ethereum liquid staking platform',
    'logo-red.svg': 'SharedStake logo red - Ethereum staking rewards platform',
    'balance.svg': 'Balance icon - Account balance indicator for staking rewards',
    'diamond.svg': 'Diamond icon - Premium feature indicator',
    'discount.svg': 'Discount icon - Special offer available',
    'download.svg': 'Download icon - Download file or resource',
    'link.svg': 'Link icon - External link indicator',
    'reward.svg': 'Reward icon - Staking rewards indicator',
    'harvest.svg': 'Harvest icon - Claim rewards action',
    'ruler.svg': 'Ruler icon - Measurement or scale indicator',
    'saddle.svg': 'Saddle icon - Saddle Finance protocol logo',
    'twitter.svg': 'Twitter social media icon - Follow SharedStake on Twitter',
    'discord.svg': 'Discord social media icon - Join SharedStake Discord community',
    'github.svg': 'GitHub social media icon - View SharedStake source code',
    'reddit.svg': 'Reddit social media icon - Join SharedStake Reddit community'
  };
  
  console.log('📝 Recommended Alt Text for Images:');
  Object.entries(altTextMap).forEach(([file, altText]) => {
    const filePath = path.join(config.sourceDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`   ${file}: "${altText}"`);
    }
  });
  console.log('');
}

/**
 * Generate optimization commands
 */
function generateOptimizationCommands() {
  console.log('🛠️ Optimization Commands:\n');
  
  console.log('📦 Install optimization tools:');
  console.log('   npm install --save-dev imagemin imagemin-webp imagemin-pngquant imagemin-mozjpeg');
  console.log('');
  
  console.log('🖼️ Manual optimization (using online tools):');
  console.log('   1. Squoosh.app - Google\'s image optimization tool');
  console.log('   2. TinyPNG.com - PNG and JPEG compression');
  console.log('   3. Convertio.co - Convert to WebP format');
  console.log('');
  
  console.log('⚡ Quick fixes for critical images:');
  console.log('   1. vEth2_1.png (1.44MB) → Compress to <100KB');
  console.log('   2. roadmap.png (350KB) → Compress to <50KB');
  console.log('   3. tokenomics.png (298KB) → Compress to <50KB');
  console.log('');
  
  console.log('🔄 WebP conversion:');
  config.webpConversion.forEach(file => {
    console.log(`   ${file} → ${file.replace(/\.(png|jpg|jpeg)$/i, '.webp')}`);
  });
  console.log('');
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 SharedStake Image Optimization Analysis\n');
  console.log('=' .repeat(50));
  
  try {
    // Analyze current state
    const analysis = analyzeImages();
    
    // Generate recommendations
    generateRecommendations(analysis);
    
    // Generate alt text recommendations
    generateAltTextRecommendations();
    
    // Generate optimization commands
    generateOptimizationCommands();
    
    console.log('✅ Analysis complete!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Optimize critical images (vEth2_1.png, roadmap.png, tokenomics.png)');
    console.log('   2. Convert images to WebP format');
    console.log('   3. Add alt text to all images');
    console.log('   4. Implement lazy loading');
    console.log('   5. Test performance improvements');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
    process.exit(1);
  }
}

// Run the analysis
if (require.main === module) {
  main();
}

module.exports = {
  analyzeImages,
  generateRecommendations,
  generateAltTextRecommendations,
  config
};