const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,63}$/;

export function isValidEmail(value: string) {
  const email = value.trim();
  return email.length <= 120 && !email.includes("..") && EMAIL_PATTERN.test(email);
}
