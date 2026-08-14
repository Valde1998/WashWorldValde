import type {
  ApiMessage,
  Dashboard,
  ForgotPasswordPayload,
  Location,
  LoginPayload,
  Plan,
  ResetPasswordPayload,
  Session,
  SignupDetailsPayload,
  SignupPayload,
  UpdateProfilePayload,
  User,
  VerificationChallenge,
  VerifyEmailPayload,
  Wash,
} from "@/types/app";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

type RequestOptions = RequestInit & {
  token?: string | null;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data: unknown = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Noget gik galt";
}

export function verificationEmailFromError(error: unknown) {
  if (!(error instanceof ApiError) || typeof error.data !== "object" || error.data === null) {
    return "";
  }

  const data = error.data as { verification_required?: unknown; email?: unknown };
  if (data.verification_required !== true || typeof data.email !== "string") return "";

  return data.email;
}

function responseErrorMessage(data: unknown) {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return "Serveren svarede ikke som forventet";
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  // Hvis brugeren er logget ind, sender vi token med til backend.
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  // Her sendes requesten fra frontend til Flask-backend.
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(responseErrorMessage(data), response.status, data);
  }

  return data as T;
}

export function getDashboard() {
  return request<Dashboard>("/api/dashboard");
}

export function getLocations() {
  return request<Location[]>("/api/locations");
}

export function getPlans() {
  return request<Plan[]>("/api/plans");
}

export function login(payload: LoginPayload) {
  return request<Session>("/api/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function signup(payload: SignupPayload) {
  return request<VerificationChallenge>("/api/sign-up", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function validateSignup(payload: SignupDetailsPayload) {
  return request<ApiMessage>("/api/sign-up/validate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function verifyEmail(payload: VerifyEmailPayload) {
  return request<Session>("/api/verify-email", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function resendVerification(email: string) {
  return request<ApiMessage>("/api/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function forgotPassword(payload: ForgotPasswordPayload) {
  return request<ApiMessage>("/api/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function resetPassword(payload: ResetPasswordPayload) {
  return request<ApiMessage>("/api/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMe(token: string) {
  return request<User>("/api/me", { token });
}

export function updateMe(token: string, payload: UpdateProfilePayload) {
  return request<User>("/api/me", {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}

export function getWashes(token: string) {
  return request<Wash[]>("/api/wash-history", { token });
}

export function createWash(token: string, locationId: number, washType: string) {
  return request<{ message: string }>("/api/wash-history", {
    method: "POST",
    token,
    body: JSON.stringify({
      location_id: locationId,
      wash_type: washType,
    }),
  });
}
