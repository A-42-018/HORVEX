// All UI copy lives here (roadmap §11) so a Bangla table can be added later
// without touching components. Interpolated strings are small functions.
// Group by area; add keys as features are built.

const en = {
  common: {
    close: "Close",
    loading: "Loading",
    viewAll: "View all",
    optional: "optional",
  },
  price: {
    current: "Price",
    sale: "Sale price",
    regular: "Regular price",
    off: (percent) => `${percent}% off`,
  },
  rating: {
    label: (value, count) =>
      `Rated ${value} out of 5${count != null ? `, ${count} ${count === 1 ? "review" : "reviews"}` : ""}`,
  },
  badge: {
    new: "New",
    limited: "Limited",
    soldOut: "Sold out",
  },
  product: {
    addToCart: "Add to bag",
    added: "Added to bag",
    chooseOptions: "Choose options",
    maxQty: "Maximum quantity in bag",
    bagFull: "Your bag is full",
    wishlistAdd: (name) => `Add ${name} to wishlist`,
    wishlistRemove: (name) => `Remove ${name} from wishlist`,
  },
  data: {
    loadError: "We couldn't load this right now.",
    retry: "Try again",
    noProducts: "No watches here yet.",
  },
  form: {
    required: "This field is required",
    invalidPhone: "Enter a valid Bangladeshi mobile number (01XXX-XXXXXX)",
    selectPlaceholder: "Select an option",
  },
  admin: {
    title: "Admin",
    checking: "Checking your session",
    signOut: "Sign out",
    roles: { owner: "Owner", manager: "Manager", staff: "Staff" },
    login: {
      title: "Sign in to HORVEX admin",
      intro: "For store staff only.",
      email: "Email",
      password: "Password",
      submit: "Sign in",
      forgot: "Forgot your password? Ask the store owner to reset it from the Supabase dashboard.",
      errors: {
        invalid_credentials: "That email and password don't match. Check them and try again.",
        email_not_confirmed: "This account hasn't been confirmed yet. Ask the store owner to confirm it.",
        over_request_rate_limit: "Too many attempts. Wait a few minutes and try again.",
        not_admin: "This account doesn't have admin access.",
        not_configured: "The store's database isn't configured.",
        fallback: "We couldn't sign you in. Check your connection and try again.",
      },
    },
    denied: {
      title: "No admin access",
      body: "You're signed in, but this account isn't on the staff list. Ask the store owner to add you.",
    },
    forbidden: {
      title: "Not available for your role",
      body: (role) => `${role} accounts can't open this page. Ask the store owner if you need access.`,
      back: "Back to dashboard",
    },
    sessionError: {
      title: "We couldn't check your access",
      body: "Check your connection and try again.",
      retry: "Try again",
    },
  },
};

export const strings = en;
