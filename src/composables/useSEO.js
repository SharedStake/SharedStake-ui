// SEO Composable for Vue 3
import { ref, onMounted, onUnmounted } from 'vue'

export function useSEO() {
  const setMetaTag = (name, content, property = false) => {
    const attribute = property ? 'property' : 'name'
    let meta = document.querySelector(`meta[${attribute}="${name}"]`)
    
    if (meta) {
      meta.setAttribute('content', content)
    } else {
      meta = document.createElement('meta')
      meta.setAttribute(attribute, name)
      meta.setAttribute('content', content)
      document.head.appendChild(meta)
    }
  }

  const setTitle = (title) => {
    document.title = title
  }

  const setCanonical = (url) => {
    let canonical = document.querySelector('link[rel="canonical"]')
    
    if (canonical) {
      canonical.setAttribute('href', url)
    } else {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      canonical.setAttribute('href', url)
      document.head.appendChild(canonical)
    }
  }

  const setStructuredData = (data) => {
    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]')
    if (existingScript) {
      existingScript.remove()
    }

    // Add new structured data
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)
  }

  const setOpenGraph = (data) => {
    const ogTags = {
      'og:title': data.title,
      'og:description': data.description,
      'og:image': data.image,
      'og:url': data.url,
      'og:type': data.type || 'website',
      'og:site_name': data.siteName || 'SharedStake'
    }

    Object.entries(ogTags).forEach(([property, content]) => {
      if (content) {
        setMetaTag(property, content, true)
      }
    })
  }

  const setTwitterCard = (data) => {
    const twitterTags = {
      'twitter:card': 'summary_large_image',
      'twitter:title': data.title,
      'twitter:description': data.description,
      'twitter:image': data.image,
      'twitter:url': data.url,
      'twitter:site': '@sharedstake',
      'twitter:creator': '@sharedstake'
    }

    Object.entries(twitterTags).forEach(([name, content]) => {
      if (content) {
        setMetaTag(name, content)
      }
    })
  }

  const setBlogPostSEO = (post) => {
    const baseUrl = 'https://sharedstake.org'
    const postUrl = `${baseUrl}/blog/${post.slug}`
    const imageUrl = `${baseUrl}/images/blog-${post.slug}.jpg`

    // Set title
    setTitle(`${post.title} - SharedStake Blog`)

    // Set meta description
    setMetaTag('description', post.meta.description)

    // Set keywords
    setMetaTag('keywords', post.meta.keywords)

    // Set canonical URL
    setCanonical(postUrl)

    // Set Open Graph tags
    setOpenGraph({
      title: post.title,
      description: post.meta.description,
      image: imageUrl,
      url: postUrl,
      type: 'article',
      siteName: 'SharedStake'
    })

    // Set Twitter Card tags
    setTwitterCard({
      title: post.title,
      description: post.meta.description,
      image: imageUrl,
      url: postUrl
    })

    // Set article-specific meta tags
    setMetaTag('article:published_time', post.publishDate, true)
    setMetaTag('article:author', post.author, true)
    setMetaTag('article:section', post.tags ? post.tags.join(', ') : 'DeFi', true)
    setMetaTag('article:tag', post.tags ? post.tags.join(', ') : '', true)

    // Set structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.meta.description,
      "image": imageUrl,
      "author": {
        "@type": "Organization",
        "name": post.author,
        "url": baseUrl
      },
      "publisher": {
        "@type": "Organization",
        "name": "SharedStake",
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/logo-white.svg`,
          "width": 200,
          "height": 60
        },
        "url": baseUrl
      },
      "datePublished": post.publishDate,
      "dateModified": post.publishDate,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": postUrl
      },
      "keywords": post.meta.keywords,
      "articleSection": post.tags ? post.tags.join(", ") : "DeFi",
      "wordCount": post.rawContent ? post.rawContent.split(' ').length : 0,
      "inLanguage": "en-US",
      "isPartOf": {
        "@type": "Blog",
        "name": "SharedStake Blog",
        "url": `${baseUrl}/blog`
      }
    }

    setStructuredData(structuredData)
  }

  const setHomePageSEO = () => {
    const baseUrl = 'https://sharedstake.org'
    
    setTitle('SharedStake | Ethereum Liquid Staking Platform | Earn 4-8% APR')
    setMetaTag('description', 'Stake ETH with SharedStake and earn 4-8% APR rewards. No 32 ETH minimum, full liquidity, and DeFi integration. Start staking with as little as 0.01 ETH.')
    setMetaTag('keywords', 'ethereum staking, liquid staking, stake eth, ethereum rewards, defi staking, veth2, ethereum 2.0, staking platform')
    setCanonical(baseUrl)

    setOpenGraph({
      title: 'SharedStake | Ethereum Liquid Staking Platform | Earn 4-8% APR',
      description: 'Stake ETH with SharedStake and earn 4-8% APR rewards. No 32 ETH minimum, full liquidity, and DeFi integration. Start staking with as little as 0.01 ETH.',
      image: `${baseUrl}/images/og-image.jpg`,
      url: baseUrl,
      type: 'website',
      siteName: 'SharedStake'
    })

    setTwitterCard({
      title: 'SharedStake | Ethereum Liquid Staking Platform | Earn 4-8% APR',
      description: 'Stake ETH with SharedStake and earn 4-8% APR rewards. No 32 ETH minimum, full liquidity, and DeFi integration. Start staking with as little as 0.01 ETH.',
      image: `${baseUrl}/images/twitter-card.jpg`,
      url: baseUrl
    })
  }

  return {
    setMetaTag,
    setTitle,
    setCanonical,
    setStructuredData,
    setOpenGraph,
    setTwitterCard,
    setBlogPostSEO,
    setHomePageSEO
  }
}