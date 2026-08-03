import type {
  Dashboard,
  Location,
  LoginPayload,
  Plan,
  Session,
  SignupPayload,
  UpdateProfilePayload,
  User,
  Wash,
} from "@/types/app";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

type RequestOptions = RequestInit & {
  token?: string | null;
};

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
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.error ?? "Serveren svarede ikke som forventet");
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
  return request<Session>("/api/signup", {
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
  return request<Wash[]>("/api/washes", { token });
}

export function createWash(token: string, locationId: number, washType: string) {
  return request<{ message: string }>("/api/washes", {
    method: "POST",
    token,
    body: JSON.stringify({
      location_id: locationId,
      wash_type: washType,
    }),
  });
}
