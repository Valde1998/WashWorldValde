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

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (!response.ok) {
        throw new ApiError("Serveren returnerede et ugyldigt svar", response.status);
      }

      throw new ApiError("Serverens svar kunne ikke læses", response.status);
    }
  }

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
