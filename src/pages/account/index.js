// Customer account pages (C6b): one lazy chunk, loaded only on /account routes,
// which also carries the customer auth client (services/customerAuth.js).
export { default as AccountHome } from "./AccountHome";
export { default as Login } from "./Login";
export { default as Register } from "./Register";
export { default as ForgotPassword } from "./ForgotPassword";
export { default as ResetPassword } from "./ResetPassword";
