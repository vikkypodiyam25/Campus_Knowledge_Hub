export const isValidEmail = (email) => {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const isValidUrl = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateRequired = (value, fieldName = 'This field') => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateEmail = (email) => {
  if (!email || !String(email).trim()) {
    return 'Email address is required';
  }
  if (!isValidEmail(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const validatePassword = (password, minLength = 6) => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters long`;
  }
  return null;
};

export const validateForm = (fields, rules) => {
  const errors = {};
  for (const [field, ruleSet] of Object.entries(rules)) {
    const value = fields[field];
    for (const rule of ruleSet) {
      const error = rule(value, field);
      if (error) {
        errors[field] = error;
        break; // Only show first error per field
      }
    }
  }
  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};
