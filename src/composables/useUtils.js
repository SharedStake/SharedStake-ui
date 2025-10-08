/**
 * Vue 2 compatible composable for common utility functions
 * Provides various helper functions for common operations
 */
export function useUtils() {
  // Helper function to generate unique ID
  const generateId = (prefix = 'id') => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Helper function to sleep/delay
  const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to format time duration
  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // Helper function to format relative time
  const formatRelativeTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  // Helper function to capitalize first letter
  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Helper function to capitalize all words
  const capitalizeWords = (str) => {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  };

  // Helper function to convert camelCase to kebab-case
  const camelToKebab = (str) => {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  };

  // Helper function to convert kebab-case to camelCase
  const kebabToCamel = (str) => {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  };

  // Helper function to convert snake_case to camelCase
  const snakeToCamel = (str) => {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
  };

  // Helper function to convert camelCase to snake_case
  const camelToSnake = (str) => {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
  };

  // Helper function to generate random string
  const randomString = (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Helper function to generate random number
  const randomNumber = (min = 0, max = 100) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // Helper function to shuffle array
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Helper function to remove duplicates from array
  const removeDuplicates = (array, key = null) => {
    if (!key) {
      return [...new Set(array)];
    }
    
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  };

  // Helper function to chunk array
  const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  // Helper function to flatten array
  const flattenArray = (array) => {
    return array.reduce((flat, item) => {
      return flat.concat(Array.isArray(item) ? flattenArray(item) : item);
    }, []);
  };

  // Helper function to get nested object value
  const getNestedValue = (obj, path, defaultValue = null) => {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined || !(key in result)) {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result;
  };

  // Helper function to set nested object value
  const setNestedValue = (obj, path, value) => {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;
    
    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
  };

  // Helper function to merge objects deeply
  const deepMerge = (target, source) => {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  };

  return {
    generateId,
    sleep,
    formatFileSize,
    formatDuration,
    formatRelativeTime,
    capitalize,
    capitalizeWords,
    camelToKebab,
    kebabToCamel,
    snakeToCamel,
    camelToSnake,
    randomString,
    randomNumber,
    shuffleArray,
    removeDuplicates,
    chunkArray,
    flattenArray,
    getNestedValue,
    setNestedValue,
    deepMerge
  };
}