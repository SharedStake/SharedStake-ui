/**
 * Composable exports for easy importing
 * All composables are Vue 2 compatible
 */

export { useBlog } from './useBlog';
export { useScrollVisibility } from './useScrollVisibility';
export { useStructuredData } from './useStructuredData';
export { useWeb3 } from './useWeb3';
export { useFormValidation } from './useFormValidation';
export { useUI } from './useUI';
export { useData } from './useData';
export { useUtils } from './useUtils';

// Re-export all composables as a single object for convenience
export const composables = {
  useBlog: require('./useBlog').useBlog,
  useScrollVisibility: require('./useScrollVisibility').useScrollVisibility,
  useStructuredData: require('./useStructuredData').useStructuredData,
  useWeb3: require('./useWeb3').useWeb3,
  useFormValidation: require('./useFormValidation').useFormValidation,
  useUI: require('./useUI').useUI,
  useData: require('./useData').useData,
  useUtils: require('./useUtils').useUtils
};