export function validateName(name: string): string | null {
  if (!name || name.trim().length < 20 || name.trim().length > 60) {
    return 'Name must be between 20 and 60 characters.';
  }
  return null;
}

export function validateAddress(address: string): string | null {
  if (!address || address.trim().length > 400) {
    return 'Address must not exceed 400 characters.';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password || password.length < 8 || password.length > 16) {
    return 'Password must be between 8 and 16 characters.';
  }
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  if (!hasUppercase) {
    return 'Password must include at least one uppercase letter.';
  }
  if (!hasSpecial) {
    return 'Password must include at least one special character.';
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return 'Please enter a valid email address.';
  }
  return null;
}

export interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
  address?: string;
}

export function validateUserFields(data: {
  name?: string;
  email?: string;
  password?: string;
  address?: string;
}): { isValid: boolean; errors: ValidationErrors } {
  const errors: ValidationErrors = {};

  if (data.name !== undefined) {
    const err = validateName(data.name);
    if (err) errors.name = err;
  }
  if (data.email !== undefined) {
    const err = validateEmail(data.email);
    if (err) errors.email = err;
  }
  if (data.password !== undefined) {
    const err = validatePassword(data.password);
    if (err) errors.password = err;
  }
  if (data.address !== undefined) {
    const err = validateAddress(data.address);
    if (err) errors.address = err;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
