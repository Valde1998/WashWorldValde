import type {
  ApiMessage,
  Dashboard,
  ForgotPasswordPayload,
  Location,
  LoginPayload,
  Plan,
  ResetPasswordPayload,
  Session,
  SignupPayload,
  UpdateProfilePayload,
  User,
  Wash,
} from "@/types/app";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

const ENDPOINTS = {
  dashboard: "/api/dashboard",
  locations: "/api/locations",
  login: "/api/login",
  me: "/api/me",
  plans: "/api/plans",
  forgotPassword: "/api/forgot-password",
  resetPassword: "/api/reset-password",
  signup: "/api/sign-up",
  washHistory: "/api/wash-history",
} as const;

type RequestOptions = RequestInit & {
  token?: string | null;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
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
    throw new ApiError(responseErrorMessage(data), response.status);
  }

  return data as T;
}

export function getDashboard() {
  return request<Dashboard>(ENDPOINTS.dashboard);
}

export function getLocations() {
  return request<Location[]>(ENDPOINTS.locations);
}

export function getPlans() {
  return request<Plan[]>(ENDPOINTS.plans);
}

export function login(payload: LoginPayload) {
  return request<Session>(ENDPOINTS.login, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function signup(payload: SignupPayload) {
  return request<Session>(ENDPOINTS.signup, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function forgotPassword(payload: ForgotPasswordPayload) {
  return request<ApiMessage>(ENDPOINTS.forgotPassword, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function resetPassword(payload: ResetPasswordPayload) {
  return request<ApiMessage>(ENDPOINTS.resetPassword, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMe(token: string) {
  return request<User>(ENDPOINTS.me, { token });
}

export function updateMe(token: string, payload: UpdateProfilePayload) {
  return request<User>(ENDPOINTS.me, {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}

export function getWashes(token: string) {
  return request<Wash[]>(ENDPOINTS.washHistory, { token });
}

export function createWash(token: string, locationId: number, washType: string) {
  return request<{ message: string }>(ENDPOINTS.washHistory, {
    method: "POST",
    token,
    body: JSON.stringify({
      location_id: locationId,
      wash_type: washType,
    }),
  });
}
