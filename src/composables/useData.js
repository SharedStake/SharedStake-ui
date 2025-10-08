/**
 * Vue 2 compatible composable for common data operations
 * Provides utilities for data fetching, caching, and state management
 */
export function useData() {
  // Simple cache implementation
  const createCache = (ttl = 300000) => { // 5 minutes default TTL
    const cache = new Map();
    
    const set = (key, value) => {
      cache.set(key, {
        value,
        timestamp: Date.now()
      });
    };
    
    const get = (key) => {
      const item = cache.get(key);
      if (!item) return null;
      
      if (Date.now() - item.timestamp > ttl) {
        cache.delete(key);
        return null;
      }
      
      return item.value;
    };
    
    const clear = () => {
      cache.clear();
    };
    
    const has = (key) => {
      return get(key) !== null;
    };
    
    return { set, get, clear, has };
  };

  // Helper function to fetch data with caching
  const fetchWithCache = async (key, fetchFn, cache) => {
    // Check cache first
    if (cache && cache.has(key)) {
      return cache.get(key);
    }
    
    try {
      const data = await fetchFn();
      if (cache) {
        cache.set(key, data);
      }
      return data;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  };

  // Helper function to retry failed requests
  const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError;
  };

  // Helper function to format API response
  const formatApiResponse = (response, defaultData = null) => {
    if (response && response.data) {
      return response.data;
    }
    return defaultData;
  };

  // Helper function to handle pagination
  const createPagination = (initialPage = 1, initialLimit = 10) => {
    return {
      page: initialPage,
      limit: initialLimit,
      total: 0,
      totalPages: 0,
      
      setPage(page) {
        this.page = page;
      },
      
      setLimit(limit) {
        this.limit = limit;
        this.page = 1; // Reset to first page when limit changes
      },
      
      setTotal(total) {
        this.total = total;
        this.totalPages = Math.ceil(total / this.limit);
      },
      
      getOffset() {
        return (this.page - 1) * this.limit;
      },
      
      hasNext() {
        return this.page < this.totalPages;
      },
      
      hasPrev() {
        return this.page > 1;
      },
      
      next() {
        if (this.hasNext()) {
          this.page++;
        }
      },
      
      prev() {
        if (this.hasPrev()) {
          this.page--;
        }
      }
    };
  };

  // Helper function to sort data
  const sortData = (data, key, direction = 'asc') => {
    if (!Array.isArray(data)) return data;
    
    return [...data].sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];
      
      // Handle nested properties
      if (typeof aVal === 'object' && aVal !== null) {
        aVal = aVal.toString();
      }
      if (typeof bVal === 'object' && bVal !== null) {
        bVal = bVal.toString();
      }
      
      if (direction === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  };

  // Helper function to filter data
  const filterData = (data, filters) => {
    if (!Array.isArray(data)) return data;
    
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          return true;
        }
        
        const itemValue = item[key];
        if (typeof value === 'string') {
          return itemValue && itemValue.toString().toLowerCase().includes(value.toLowerCase());
        }
        
        return itemValue === value;
      });
    });
  };

  // Helper function to group data
  const groupData = (data, key) => {
    if (!Array.isArray(data)) return {};
    
    return data.reduce((groups, item) => {
      const group = item[key];
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(item);
      return groups;
    }, {});
  };

  // Helper function to deep clone data
  const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
      const cloned = {};
      Object.keys(obj).forEach(key => {
        cloned[key] = deepClone(obj[key]);
      });
      return cloned;
    }
  };

  return {
    createCache,
    fetchWithCache,
    retryRequest,
    formatApiResponse,
    createPagination,
    sortData,
    filterData,
    groupData,
    deepClone
  };
}