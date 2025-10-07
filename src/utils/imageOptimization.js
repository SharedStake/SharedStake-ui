// Image Optimization Utilities

export const imageOptimization = {
  // Generate optimized image URLs
  generateImageUrl: (imageName, options = {}) => {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://sharedstake.org' 
      : 'http://localhost:8080'
    
    const { width, height, format = 'webp', quality = 80 } = options
    
    // For now, return the original URL
    // In production, you might want to use a CDN or image optimization service
    return `${baseUrl}/images/${imageName}`
  },

  // Generate responsive image srcset
  generateSrcSet: (imageName, sizes = [320, 640, 1024, 1200]) => {
    return sizes
      .map(size => `${imageOptimization.generateImageUrl(imageName, { width: size })} ${size}w`)
      .join(', ')
  },

  // Get optimal image size based on container
  getOptimalSize: (containerWidth, devicePixelRatio = 1) => {
    const targetWidth = containerWidth * devicePixelRatio
    
    // Common breakpoints
    const sizes = [320, 640, 768, 1024, 1200, 1920]
    
    return sizes.find(size => size >= targetWidth) || sizes[sizes.length - 1]
  },

  // Lazy loading configuration
  lazyLoadingConfig: {
    rootMargin: '50px 0px',
    threshold: 0.1
  },

  // Image formats priority (for modern browsers)
  getPreferredFormat: () => {
    if (typeof window === 'undefined') return 'jpg'
    
    const canvas = document.createElement('canvas')
    const webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
    const avifSupported = canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0
    
    if (avifSupported) return 'avif'
    if (webpSupported) return 'webp'
    return 'jpg'
  },

  // Generate alt text based on context
  generateAltText: (imageName, context = {}) => {
    const altTextMap = {
      // Logo images
      'logo-white.svg': 'SharedStake logo - Ethereum liquid staking platform',
      'logo-red.svg': 'SharedStake logo red variant - Ethereum staking rewards',
      'logo.png': 'SharedStake logo - Liquid staking platform',
      
      // Token images
      'vEth2.png': 'vETH2 token - SharedStake liquid staking token representing staked ETH',
      'eth.png': 'Ethereum ETH token logo',
      'vEth2_1.png': 'vETH2 token large - SharedStake liquid staking token',
      'vEth2_200.png': 'vETH2 token medium - SharedStake staking token',
      
      // Social media images
      'og-image.jpg': 'SharedStake Ethereum liquid staking platform - Earn 4-8% APR rewards',
      'twitter-card.jpg': 'SharedStake liquid staking - Start staking ETH with 0.01 ETH minimum',
      
      // Blog post images
      'blog-ethereum-staking-guide-2024.jpg': 'Ethereum staking guide 2024 - How to stake ETH and earn rewards',
      'blog-understanding-liquid-staking-benefits.jpg': 'Liquid staking benefits guide - Complete overview of Ethereum staking advantages',
      'blog-defi-integration-opportunities.jpg': 'DeFi integration strategies - Maximize vETH2 yields across protocols',
      'blog-security-audit-results-certik.jpg': 'SharedStake security audit results - CertiK partnership delivers enterprise-grade protection',
      'blog-sharedstake-v2-launch-announcement.jpg': 'SharedStake V2 launch announcement with new features and improvements',
      'blog-how-we-updated-sharedstake-ui-with-ai.jpg': 'AI-powered UI transformation showing before and after improvements',
      'blog-ethereum-node-made-simple-eth2-quickstart.jpg': 'Ethereum node setup process simplified with eth2-quickstart tool',
      
      // Protocol images
      'curve.png': 'Curve Finance protocol logo - DeFi liquidity pool platform',
      'uniswap.png': 'Uniswap protocol logo - Decentralized exchange platform',
      'aave.png': 'Aave protocol logo - DeFi lending platform',
      'compound.png': 'Compound protocol logo - DeFi lending platform',
      
      // Social icons
      'twitter.svg': 'Twitter social media icon - Follow SharedStake on Twitter',
      'discord.svg': 'Discord social media icon - Join SharedStake Discord community',
      'github.svg': 'GitHub social media icon - View SharedStake source code',
      'reddit.svg': 'Reddit social media icon - Join SharedStake Reddit community',
      
      // UI elements
      'arrow.svg': 'Arrow icon - Navigation or direction indicator',
      'loading.svg': 'Loading spinner - Content is loading',
      'info-icon.png': 'Information icon - Additional details available',
      'balance.svg': 'Balance icon - Account balance indicator',
      'diamond.svg': 'Diamond icon - Premium feature indicator',
      'discount.svg': 'Discount icon - Special offer available',
      'download.svg': 'Download icon - Download file or resource',
      'link.svg': 'Link icon - External link indicator',
      'reward.svg': 'Reward icon - Staking rewards indicator',
      'harvest.svg': 'Harvest icon - Claim rewards action',
      'ruler.svg': 'Ruler icon - Measurement or scale indicator',
      'saddle.svg': 'Saddle icon - Saddle Finance protocol logo',
      'roadmap.png': 'Roadmap image - SharedStake development timeline',
      'tokenomics.png': 'Tokenomics diagram - SharedStake token distribution and economics'
    }
    
    // Return specific alt text if available, otherwise generate generic one
    if (altTextMap[imageName]) {
      return altTextMap[imageName]
    }
    
    // Generate generic alt text based on image name
    const nameWithoutExt = imageName.replace(/\.[^/.]+$/, '')
    const words = nameWithoutExt.split(/[-_]/)
    const capitalizedWords = words.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    )
    
    return `${capitalizedWords.join(' ')} - SharedStake related image`
  },

  // Preload critical images
  preloadImage: (imageUrl) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = imageUrl
    document.head.appendChild(link)
  },

  // Preload hero images
  preloadHeroImages: () => {
    const heroImages = [
      '/images/og-image.jpg',
      '/images/logo-white.svg',
      '/images/vEth2.png'
    ]
    
    heroImages.forEach(imageUrl => {
      imageOptimization.preloadImage(imageUrl)
    })
  },

  // Check if image exists
  checkImageExists: (imageUrl) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = imageUrl
    })
  },

  // Fallback image URL
  getFallbackImage: () => {
    return '/images/logo-white.svg'
  }
}

// Export default
export default imageOptimization