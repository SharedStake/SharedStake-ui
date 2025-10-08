#!/usr/bin/env node

/**
 * Image Performance Optimization Script for SharedStake
 * 
 * This script analyzes and optimizes images for better SEO and performance.
 * It identifies large images, suggests optimizations, and provides recommendations.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Image optimization configuration
const optimizationConfig = {
  // Size thresholds (in bytes)
  thresholds: {
    critical: 100 * 1024,    // 100KB - Critical for performance
    warning: 500 * 1024,     // 500KB - Warning threshold
    max: 1000 * 1024         // 1MB - Maximum recommended size
  },
  
  // Recommended dimensions
  dimensions: {
    hero: { width: 1200, height: 630 },
    blog: { width: 800, height: 400 },
    thumbnail: { width: 300, height: 200 },
    icon: { width: 64, height: 64 }
  },
  
  // Supported formats
  formats: {
    modern: ['webp', 'avif'],
    fallback: ['jpg', 'png']
  }
};

class ImageOptimizer {
  constructor() {
    this.results = {
      analyzed: 0,
      optimized: 0,
      critical: [],
      warnings: [],
      recommendations: []
    };
  }

  // Analyze image file
  analyzeImage(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const name = path.basename(filePath);
      
      const analysis = {
        path: filePath,
        name: name,
        size: stats.size,
        extension: ext,
        sizeKB: Math.round(stats.size / 1024),
        sizeMB: Math.round(stats.size / (1024 * 1024) * 100) / 100,
        status: this.getSizeStatus(stats.size),
        recommendations: []
      };
      
      // Add specific recommendations
      this.addRecommendations(analysis);
      
      this.results.analyzed++;
      
      if (analysis.status === 'critical') {
        this.results.critical.push(analysis);
      } else if (analysis.status === 'warning') {
        this.results.warnings.push(analysis);
      }
      
      return analysis;
    } catch (error) {
      console.error(`Error analyzing ${filePath}:`, error.message);
      return null;
    }
  }

  // Determine size status
  getSizeStatus(size) {
    if (size > optimizationConfig.thresholds.max) {
      return 'critical';
    } else if (size > optimizationConfig.thresholds.warning) {
      return 'warning';
    } else if (size > optimizationConfig.thresholds.critical) {
      return 'needs-optimization';
    } else {
      return 'good';
    }
  }

  // Add optimization recommendations
  addRecommendations(analysis) {
    const { size, extension, name } = analysis;
    
    // Size-based recommendations
    if (size > optimizationConfig.thresholds.max) {
      analysis.recommendations.push({
        type: 'size',
        priority: 'critical',
        message: `Reduce file size by 80-90% (currently ${analysis.sizeMB}MB)`,
        action: 'Compress image and convert to WebP format'
      });
    } else if (size > optimizationConfig.thresholds.warning) {
      analysis.recommendations.push({
        type: 'size',
        priority: 'high',
        message: `Reduce file size by 50-70% (currently ${analysis.sizeKB}KB)`,
        action: 'Optimize compression and consider WebP conversion'
      });
    }
    
    // Format-based recommendations
    if (extension === '.png' && size > optimizationConfig.thresholds.critical) {
      analysis.recommendations.push({
        type: 'format',
        priority: 'medium',
        message: 'Convert PNG to WebP for better compression',
        action: 'Use WebP format with 80-85% quality'
      });
    }
    
    if (extension === '.jpg' || extension === '.jpeg') {
      analysis.recommendations.push({
        type: 'format',
        priority: 'low',
        message: 'Consider WebP format for better compression',
        action: 'Convert to WebP with 80-85% quality'
      });
    }
    
    // Name-based recommendations
    if (name.includes(' ') || name.includes('_')) {
      analysis.recommendations.push({
        type: 'naming',
        priority: 'low',
        message: 'Use SEO-friendly filename',
        action: 'Replace spaces and underscores with hyphens'
      });
    }
    
    // Specific image recommendations
    if (name.includes('og-image') || name.includes('twitter-card')) {
      analysis.recommendations.push({
        type: 'social',
        priority: 'high',
        message: 'Optimize for social sharing',
        action: 'Ensure 1200x630px dimensions and <100KB size'
      });
    }
    
    if (name.includes('favicon') || name.includes('icon')) {
      analysis.recommendations.push({
        type: 'icon',
        priority: 'medium',
        message: 'Optimize icon for web performance',
        action: 'Use ICO format for favicon, PNG for other icons'
      });
    }
  }

  // Analyze all images in directory
  analyzeDirectory(dirPath) {
    console.log(`\n🔍 Analyzing images in ${dirPath}...`);
    
    if (!fs.existsSync(dirPath)) {
      console.log(`   ❌ Directory not found: ${dirPath}`);
      return;
    }
    
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    const imageFiles = files.filter(file => 
      file.isFile() && /\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/i.test(file.name)
    );
    
    console.log(`   📁 Found ${imageFiles.length} image files`);
    
    imageFiles.forEach(file => {
      const filePath = path.join(dirPath, file.name);
      const analysis = this.analyzeImage(filePath);
      
      if (analysis) {
        this.printImageAnalysis(analysis);
      }
    });
  }

  // Print image analysis
  printImageAnalysis(analysis) {
    const statusIcon = {
      'good': '✅',
      'needs-optimization': '🟡',
      'warning': '⚠️',
      'critical': '🚨'
    };
    
    console.log(`\n   ${statusIcon[analysis.status]} ${analysis.name}`);
    console.log(`      Size: ${analysis.sizeKB}KB (${analysis.sizeMB}MB)`);
    console.log(`      Format: ${analysis.extension.toUpperCase()}`);
    console.log(`      Status: ${analysis.status.toUpperCase()}`);
    
    if (analysis.recommendations.length > 0) {
      console.log(`      Recommendations:`);
      analysis.recommendations.forEach(rec => {
        const priorityIcon = {
          'critical': '🔴',
          'high': '🟠',
          'medium': '🟡',
          'low': '🟢'
        };
        console.log(`        ${priorityIcon[rec.priority]} ${rec.message}`);
        console.log(`           Action: ${rec.action}`);
      });
    }
  }

  // Generate optimization report
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMAGE OPTIMIZATION REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📈 Summary:`);
    console.log(`   📁 Images Analyzed: ${this.results.analyzed}`);
    console.log(`   🚨 Critical Issues: ${this.results.critical.length}`);
    console.log(`   ⚠️  Warnings: ${this.results.warnings.length}`);
    
    // Critical issues
    if (this.results.critical.length > 0) {
      console.log(`\n🚨 CRITICAL ISSUES (Fix Immediately):`);
      this.results.critical.forEach((img, index) => {
        console.log(`\n${index + 1}. ${img.name}`);
        console.log(`   Size: ${img.sizeMB}MB (${img.sizeKB}KB)`);
        console.log(`   Impact: High - Affects page load speed significantly`);
        img.recommendations.forEach(rec => {
          if (rec.priority === 'critical') {
            console.log(`   🔴 ${rec.message}`);
            console.log(`      Action: ${rec.action}`);
          }
        });
      });
    }
    
    // Warnings
    if (this.results.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (Fix Soon):`);
      this.results.warnings.forEach((img, index) => {
        console.log(`\n${index + 1}. ${img.name}`);
        console.log(`   Size: ${img.sizeKB}KB`);
        console.log(`   Impact: Medium - Affects performance`);
        img.recommendations.forEach(rec => {
          if (rec.priority === 'high') {
            console.log(`   🟠 ${rec.message}`);
            console.log(`      Action: ${rec.action}`);
          }
        });
      });
    }
    
    // General recommendations
    console.log(`\n📋 GENERAL RECOMMENDATIONS:`);
    console.log(`   1. Convert all images to WebP format for better compression`);
    console.log(`   2. Implement responsive images with srcset`);
    console.log(`   3. Use lazy loading for images below the fold`);
    console.log(`   4. Optimize images for different screen sizes`);
    console.log(`   5. Consider using a CDN for image delivery`);
    
    // Performance impact
    const totalSize = this.results.critical.reduce((sum, img) => sum + img.size, 0) +
                     this.results.warnings.reduce((sum, img) => sum + img.size, 0);
    const totalSizeMB = Math.round(totalSize / (1024 * 1024) * 100) / 100;
    
    if (totalSizeMB > 0) {
      console.log(`\n⚡ PERFORMANCE IMPACT:`);
      console.log(`   Total size of problematic images: ${totalSizeMB}MB`);
      console.log(`   Estimated load time impact: +${Math.round(totalSizeMB * 2)}s on 3G`);
      console.log(`   Potential savings: ${Math.round(totalSizeMB * 0.7 * 100) / 100}MB (70% reduction)`);
    }
    
    console.log(`\n🚀 NEXT STEPS:`);
    console.log(`   1. Fix critical issues immediately`);
    console.log(`   2. Optimize warning-level images within 1 week`);
    console.log(`   3. Implement WebP conversion for all images`);
    console.log(`   4. Set up automated image optimization in build process`);
    console.log(`   5. Monitor Core Web Vitals for improvements`);
    
    console.log('\n' + '='.repeat(60));
    
    return this.results;
  }

  // Run optimization analysis
  async run() {
    console.log('🖼️  Starting Image Performance Analysis...\n');
    
    // Analyze main images directory
    this.analyzeDirectory('/workspace/public/images');
    
    // Analyze blog images if they exist
    const blogImagesPath = '/workspace/public/images/blog';
    if (fs.existsSync(blogImagesPath)) {
      this.analyzeDirectory(blogImagesPath);
    }
    
    // Generate report
    return this.generateReport();
  }
}

// Run analysis if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const optimizer = new ImageOptimizer();
  optimizer.run().then(report => {
    const hasCriticalIssues = report.critical.length > 0;
    process.exit(hasCriticalIssues ? 1 : 0);
  });
}

export default ImageOptimizer;