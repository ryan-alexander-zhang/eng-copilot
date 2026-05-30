export const MIN_PASSWORD_LENGTH = 8;

export function hasMinimumPasswordLength(value: string) {
  return value.trim().length >= MIN_PASSWORD_LENGTH;
}

export function hasPasswordUppercase(value: string) {
  return /[A-Z]/.test(value);
}

export function hasPasswordNumber(value: string) {
  return /\d/.test(value);
}

export function getPasswordValidationState(value: string) {
  return {
    hasMinimumLength: hasMinimumPasswordLength(value),
    hasNumber: hasPasswordNumber(value),
    hasUppercase: hasPasswordUppercase(value),
  };
}

export function isPasswordPolicyValid(value: string) {
  const state = getPasswordValidationState(value);

  return state.hasMinimumLength && state.hasNumber && state.hasUppercase;
}
