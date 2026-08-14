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

export function isMemberRoutePath(pathname: string) {
  return (
    pathname === APP_TAB_ROUTES.home ||
    pathname === APP_TAB_ROUTES.activity ||
    pathname === APP_TAB_ROUTES.qr ||
    pathname === APP_TAB_ROUTES.locations ||
    pathname.startsWith(`${APP_TAB_ROUTES.locations}/`) ||
    pathname === APP_TAB_ROUTES.profile
  );
}
