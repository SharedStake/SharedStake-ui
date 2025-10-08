/**
 * Vue 2 compatible composable for form validation
 * Provides common validation utilities and patterns
 */
export function useFormValidation() {
  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // URL validation
  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Number validation
  const validateNumber = (value, min = null, max = null) => {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    if (min !== null && num < min) return false;
    if (max !== null && num > max) return false;
    return true;
  };

  // Required field validation
  const validateRequired = (value) => {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  };

  // Minimum length validation
  const validateMinLength = (value, minLength) => {
    return value && value.toString().length >= minLength;
  };

  // Maximum length validation
  const validateMaxLength = (value, maxLength) => {
    return !value || value.toString().length <= maxLength;
  };

  // Token amount validation
  const validateTokenAmount = (amount, balance = null, minAmount = 0) => {
    if (!validateRequired(amount)) return false;
    if (!validateNumber(amount, minAmount)) return false;
    if (balance !== null && parseFloat(amount) > parseFloat(balance)) return false;
    return true;
  };

  // Address validation
  const validateAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Create validation rules object
  const createValidationRules = (rules) => {
    return {
      required: (value) => validateRequired(value) || 'This field is required',
      email: (value) => validateEmail(value) || 'Please enter a valid email',
      url: (value) => validateUrl(value) || 'Please enter a valid URL',
      number: (value, min, max) => validateNumber(value, min, max) || 'Please enter a valid number',
      minLength: (value, min) => validateMinLength(value, min) || `Minimum length is ${min} characters`,
      maxLength: (value, max) => validateMaxLength(value, max) || `Maximum length is ${max} characters`,
      tokenAmount: (value, balance, min) => validateTokenAmount(value, balance, min) || 'Invalid token amount',
      address: (value) => validateAddress(value) || 'Please enter a valid address',
      ...rules
    };
  };

  // Validate form data against rules
  const validateForm = (data, rules) => {
    const errors = {};
    
    for (const [field, value] of Object.entries(data)) {
      if (rules[field]) {
        const rule = rules[field];
        const error = rule(value);
        if (error) {
          errors[field] = error;
        }
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  return {
    validateEmail,
    validateUrl,
    validateNumber,
    validateRequired,
    validateMinLength,
    validateMaxLength,
    validateTokenAmount,
    validateAddress,
    createValidationRules,
    validateForm
  };
}