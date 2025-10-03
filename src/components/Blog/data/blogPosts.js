// Blog posts data store
export const blogPosts = [
  {
    id: '1',
    slug: 'sharedstake-v2-launch-announcement',
    title: 'SharedStake V2 Launch: The Future of Ethereum Liquid Staking',
    excerpt: 'We\'re excited to announce the launch of SharedStake V2, bringing enhanced security, better UX, and improved yield opportunities to the Ethereum liquid staking ecosystem.',
    content: `
      <h2>Introducing SharedStake V2</h2>
      <p>After months of development and rigorous testing, we're thrilled to announce the launch of SharedStake V2. This major upgrade brings significant improvements to our liquid staking protocol, making it more secure, user-friendly, and profitable for our community.</p>
      
      <h3>Key Features of V2</h3>
      <ul>
        <li><strong>Enhanced Security:</strong> New smart contracts with improved security measures and formal verification</li>
        <li><strong>Better UX:</strong> Streamlined interface with faster transaction processing</li>
        <li><strong>Improved Yields:</strong> Optimized staking strategies for maximum returns</li>
        <li><strong>Cross-Chain Support:</strong> Expanded support for multiple networks</li>
      </ul>
      
      <h3>What This Means for Users</h3>
      <p>Existing users will be able to seamlessly migrate their staked ETH to V2, with no additional fees. New users can start staking with as little as 0.1 ETH, making liquid staking more accessible than ever.</p>
      
      <p>We're committed to maintaining the highest standards of security and transparency. All V2 contracts have undergone extensive auditing and are ready for production use.</p>
    `,
    author: 'SharedStake Team',
    publishDate: '2024-01-15',
    tags: ['announcement', 'v2', 'ethereum', 'staking'],
    featured: true,
    meta: {
      description: 'SharedStake V2 launch announcement with enhanced security, better UX, and improved yield opportunities for Ethereum liquid staking.',
      keywords: 'sharedstake, v2, ethereum, liquid staking, defi, announcement'
    }
  },
  {
    id: '5',
    slug: 'how-we-updated-sharedstake-ui-with-ai',
    title: 'How We Updated the SharedStake UI — with AI, Fast',
    excerpt: 'A focused recap of how we partnered with AI to harden security, modernize web3, and ship a faster, cleaner UI — production-ready.',
    content: `
      <h2>What We Shipped</h2>
      <ul>
        <li><strong>Security First:</strong> 100% elimination of critical vulnerabilities, production logs gated.</li>
        <li><strong>Web3 Modernization:</strong> Complete migration to ethers.js v6 and @web3-onboard.</li>
        <li><strong>Performance:</strong> ~40–51% bundle size reduction, large image optimization, better code-splitting.</li>
        <li><strong>Reliability:</strong> Clean builds, zero lint errors, consistent Node 18 + Vue CLI 5 stack.</li>
      </ul>

      <h2>How We Did It (Human × AI)</h2>
      <ul>
        <li><strong>Guided Refactors:</strong> AI proposed safe edits; humans reviewed and merged.</li>
        <li><strong>Typed Value Discipline:</strong> Fixed BigInt/BN mixing, explicit conversions, consistent comparisons.</li>
        <li><strong>Config Hygiene:</strong> Pinned versions, removed unused deps, enforced reproducible installs.</li>
        <li><strong>DX & Docs:</strong> Clear LLM docs: status, plan, and implementation notes for rapid onboarding.</li>
      </ul>

      <h2>Results</h2>
      <ul>
        <li><strong>Security:</strong> A+ posture; audit items resolved and documented.</li>
        <li><strong>Speed:</strong> Smaller bundles and faster navigation via lazy routes.</li>
        <li><strong>Maintainability:</strong> DRY patterns, consistent error handling, modular utils.</li>
      </ul>

      <h2>What’s Next</h2>
      <ul>
        <li>Optional modernization: Vue 3 + Tailwind 3/4 + PostCSS 8.</li>
        <li>Testing + monitoring: Vitest, Vue Test Utils, Playwright, analytics.</li>
      </ul>

      <p><em>This post was co-authored with AI. Humans set direction and standards; AI accelerated safe changes and documentation.</em></p>
    `,
    author: 'SharedStake Team',
    publishDate: '2025-10-02',
    tags: ['announcement', 'engineering', 'security', 'performance', 'ai'],
    featured: true,
    meta: {
      description: 'Concise recap of our AI-assisted UI upgrades: security hardening, ethers.js migration, bundle optimization, and production readiness.',
      keywords: 'sharedstake, ai, ethers.js, security, performance, vue, defi'
    }
  },
  {
    id: '2',
    slug: 'understanding-liquid-staking-benefits',
    title: 'Understanding Liquid Staking: Benefits and Opportunities',
    excerpt: 'Explore the advantages of liquid staking and how it revolutionizes the way we participate in Ethereum 2.0 validation.',
    content: `
      <h2>What is Liquid Staking?</h2>
      <p>Liquid staking is a revolutionary approach to Ethereum 2.0 staking that allows users to stake their ETH while maintaining liquidity. Unlike traditional staking, liquid staking provides users with tradeable tokens representing their staked position.</p>
      
      <h3>Key Benefits</h3>
      <ul>
        <li><strong>Liquidity:</strong> Access to your staked funds without waiting for the unlock period</li>
        <li><strong>Flexibility:</strong> Trade, lend, or use staked assets in DeFi protocols</li>
        <li><strong>Compound Returns:</strong> Reinvest rewards automatically for better yields</li>
        <li><strong>Lower Barriers:</strong> Stake any amount, not just 32 ETH minimums</li>
      </ul>
      
      <h3>How SharedStake Works</h3>
      <p>When you stake ETH with SharedStake, you receive vETH2 tokens that represent your staked position. These tokens can be used across the DeFi ecosystem while your underlying ETH continues to earn staking rewards.</p>
      
      <p>Our protocol automatically manages validator operations, ensuring optimal performance and security for all participants.</p>
    `,
    author: 'SharedStake Team',
    publishDate: '2024-01-10',
    tags: ['education', 'liquid-staking', 'ethereum', 'defi'],
    featured: false,
    meta: {
      description: 'Learn about liquid staking benefits and how SharedStake revolutionizes Ethereum 2.0 participation.',
      keywords: 'liquid staking, ethereum, defi, staking rewards, veth2'
    }
  },
  {
    id: '3',
    slug: 'security-audit-results-certik',
    title: 'Security Audit Results: CertiK Partnership and Findings',
    excerpt: 'Our comprehensive security audit with CertiK has been completed. Here are the results and our commitment to security.',
    content: `
      <h2>Security First Approach</h2>
      <p>At SharedStake, security is our top priority. We've partnered with CertiK, one of the leading blockchain security firms, to conduct a comprehensive audit of our smart contracts and protocol.</p>
      
      <h3>Audit Results</h3>
      <p>The audit covered all critical components of our protocol, including:</p>
      <ul>
        <li>Staking contract security</li>
        <li>Reward distribution mechanisms</li>
        <li>Validator management systems</li>
        <li>Emergency pause functionality</li>
      </ul>
      
      <h3>Key Findings</h3>
      <p>CertiK identified several areas for improvement, all of which have been addressed in our V2 launch. The audit confirmed that our core protocol is secure and ready for production use.</p>
      
      <p>We're committed to maintaining the highest security standards and will continue regular audits as we develop new features.</p>
    `,
    author: 'SharedStake Team',
    publishDate: '2024-01-05',
    tags: ['security', 'audit', 'certik', 'safety'],
    featured: false,
    meta: {
      description: 'SharedStake security audit results with CertiK partnership and commitment to protocol safety.',
      keywords: 'security audit, certik, blockchain security, smart contracts, safety'
    }
  },
  {
    id: '4',
    slug: 'defi-integration-opportunities',
    title: 'DeFi Integration: Maximizing Your Staking Rewards',
    excerpt: 'Discover how to use your vETH2 tokens across the DeFi ecosystem to maximize returns and unlock additional opportunities.',
    content: `
      <h2>DeFi Integration Opportunities</h2>
      <p>One of the key advantages of liquid staking is the ability to use your staked assets across the broader DeFi ecosystem. With vETH2 tokens, you can participate in various DeFi protocols while still earning staking rewards.</p>
      
      <h3>Popular Integration Strategies</h3>
      <ul>
        <li><strong>Lending:</strong> Use vETH2 as collateral in lending protocols</li>
        <li><strong>Liquidity Pools:</strong> Provide liquidity for additional yield</li>
        <li><strong>Yield Farming:</strong> Stake vETH2 in yield farming strategies</li>
        <li><strong>Cross-Chain:</strong> Bridge vETH2 to other networks</li>
      </ul>
      
      <h3>Risk Management</h3>
      <p>While DeFi integration offers additional opportunities, it's important to understand the risks involved. Always do your own research and never risk more than you can afford to lose.</p>
      
      <p>We're working on partnerships with leading DeFi protocols to make integration seamless and secure for our users.</p>
    `,
    author: 'SharedStake Team',
    publishDate: '2024-01-01',
    tags: ['defi', 'integration', 'yield-farming', 'liquidity'],
    featured: false,
    meta: {
      description: 'Learn how to integrate vETH2 tokens with DeFi protocols to maximize staking rewards and unlock additional opportunities.',
      keywords: 'defi integration, veth2, yield farming, liquidity pools, staking rewards'
    }
  }
];

// Helper functions for blog data management
export const getBlogPostBySlug = (slug) => {
  return blogPosts.find(post => post.slug === slug);
};

export const getFeaturedPosts = () => {
  return blogPosts.filter(post => post.featured);
};

export const getPostsByTag = (tag) => {
  return blogPosts.filter(post => post.tags.includes(tag));
};

export const getAllTags = () => {
  const tags = new Set();
  blogPosts.forEach(post => {
    post.tags.forEach(tag => tags.add(tag));
  });
  return Array.from(tags);
};