/**
 * Mixin exports for easy importing
 * All mixins are Vue 2 compatible
 */

export {
  web3Mixin,
  uiMixin,
  formValidationMixin,
  loadingMixin,
  responsiveMixin,
  scrollMixin,
  utilityMixin
} from './common';

// Re-export all mixins as a single object for convenience
export const mixins = {
  web3Mixin: require('./common').web3Mixin,
  uiMixin: require('./common').uiMixin,
  formValidationMixin: require('./common').formValidationMixin,
  loadingMixin: require('./common').loadingMixin,
  responsiveMixin: require('./common').responsiveMixin,
  scrollMixin: require('./common').scrollMixin,
  utilityMixin: require('./common').utilityMixin
};