import type { SignupPayload } from "@/types/app";

export type SignupDraft = SignupPayload & { confirm_email: string };

export const EMPTY_SIGNUP: SignupDraft = {
  first_name: "",
  email: "",
  confirm_email: "",
  password: "",
  license_plate: "",
  phone: "",
  location_id: 0,
  plan_id: 0,
};

const TOKEN_KEY = "washworld_token";
const NOTICE_KEY = "washworld_notice";
const SIGNUP_KEY = "washworld_signup";

export function readStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function saveStoredToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function saveStoredNotice(message: string) {
  window.sessionStorage.setItem(NOTICE_KEY, message);
}

export function takeStoredNotice() {
  const message = window.sessionStorage.getItem(NOTICE_KEY);
  window.sessionStorage.removeItem(NOTICE_KEY);
  return message;
}

export function readSignupDraft() {
  const savedSignup = window.sessionStorage.getItem(SIGNUP_KEY);
  if (!savedSignup) return EMPTY_SIGNUP;

  try {
    return { ...EMPTY_SIGNUP, ...JSON.parse(savedSignup) };
  } catch {
    window.sessionStorage.removeItem(SIGNUP_KEY);
    return EMPTY_SIGNUP;
  }
}

export function saveSignupDraft(signup: SignupDraft) {
  window.sessionStorage.setItem(SIGNUP_KEY, JSON.stringify(signup));
}

export function clearSignupDraft() {
  window.sessionStorage.removeItem(SIGNUP_KEY);
}
