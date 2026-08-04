export type Dashboard = {
  totals: {
    locations: number;
    plans: number;
    users: number;
    washes: number;
    average_queue: number | null;
  };
  washes_per_day: Array<{
    day: string;
    washes: number;
  }>;
};

export type Location = {
  location_id: number;
  name: string;
  city: string;
  address: string;
  opening_hours: string;
  queue_minutes: number;
  image: string;
};

export type Plan = {
  plan_id: number;
  name: string;
  description: string;
  monthly_price: number;
  single_wash_price: number;
};

export type User = {
  user_id: string;
  first_name: string;
  email: string;
  license_plate: string;
  phone: string;
  location_id: number;
  location_name: string;
  location_city: string;
  plan_id: number;
  plan_name: string;
  monthly_price: number;
};

export type Wash = {
  wash_id: string;
  wash_type: string;
  washed_at: string;
  location_name: string;
  location_city: string;
  is_optimistic?: boolean;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type SignupPayload = LoginPayload & {
  first_name: string;
  license_plate: string;
  phone: string;
  location_id: number;
  plan_id: number;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  reset_key: string;
  password: string;
};

export type UpdateProfilePayload = {
  first_name: string;
  license_plate: string;
  phone: string;
  location_id: number;
  plan_id: number;
};

export type Session = {
  token: string;
  user: User;
};

export type ApiMessage = {
  message: string;
};
