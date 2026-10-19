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
};

export const strings = en;
