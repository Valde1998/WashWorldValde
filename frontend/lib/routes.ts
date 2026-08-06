export type AuthScreen =
  | "welcome"
  | "login"
  | "signup"
  | "plans"
  | "payment"
  | "verify"
  | "forgot"
  | "sent"
  | "reset";

export type AppTab = "home" | "activity" | "qr" | "locations" | "profile";

export const AUTH_SCREEN_ROUTES: Record<AuthScreen, string> = {
  welcome: "/",
  login: "/login",
  signup: "/opret-bruger",
  plans: "/medlemskab",
  payment: "/betaling",
  verify: "/bekraeft-email",
  forgot: "/glemt-adgangskode",
  sent: "/email-sendt",
  reset: "/nulstil-adgangskode",
};

export const APP_TAB_ROUTES: Record<AppTab, string> = {
  home: "/hjem",
  activity: "/aktivitet",
  qr: "/qr-kode",
  locations: "/vaskehaller",
  profile: "/profil",
};

export function authScreenForPath(pathname: string) {
  const entry = Object.entries(AUTH_SCREEN_ROUTES).find(([, path]) => path === pathname);
  return (entry?.[0] as AuthScreen | undefined) ?? null;
}

export function appTabForPath(pathname: string) {
  if (pathname === APP_TAB_ROUTES.locations || pathname.startsWith(`${APP_TAB_ROUTES.locations}/`)) {
    return "locations" as const;
  }

  const entry = Object.entries(APP_TAB_ROUTES).find(([, path]) => path === pathname);
  return (entry?.[0] as AppTab | undefined) ?? null;
}

export function locationSlugForPath(pathname: string) {
  const prefix = `${APP_TAB_ROUTES.locations}/`;
  if (!pathname.startsWith(prefix)) return null;

  try {
    return decodeURIComponent(pathname.slice(prefix.length)) || null;
  } catch {
    return null;
  }
}
