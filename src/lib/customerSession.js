// Where the customer auth client (services/customerAuth.js) keeps its session.
// Lets checkout tell whether a customer is signed in without loading auth-js.
export const CUSTOMER_AUTH_KEY = "wristory-customer-auth";

export function hasStoredCustomerSession() {
  try {
    return Boolean(localStorage.getItem(CUSTOMER_AUTH_KEY));
  } catch {
    return false;
  }
}
