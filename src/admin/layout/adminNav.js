import {
  Boxes,
  Layers,
  LayoutDashboard,
  Megaphone,
  PanelsTopLeft,
  ReceiptText,
  Settings,
  ShieldCheck,
  Star,
  Tag,
  Truck,
  History,
  Users,
  Watch,
} from "lucide-react";

// Single source for the sidebar, the "More" sheet and the mobile bottom bar.
// `minRole` mirrors AdminApp's route gates (roadmap §10).
export const NAV_GROUPS = [
  {
    id: "sell",
    items: [
      { id: "dashboard", to: "/admin", end: true, icon: LayoutDashboard, minRole: "staff" },
      { id: "orders", to: "/admin/orders", icon: ReceiptText, minRole: "staff" },
      { id: "products", to: "/admin/products", icon: Watch, minRole: "manager" },
      { id: "categories", to: "/admin/categories", icon: Boxes, minRole: "manager" },
      { id: "collections", to: "/admin/collections", icon: Layers, minRole: "manager" },
      { id: "customers", to: "/admin/customers", icon: Users, minRole: "staff" },
      { id: "reviews", to: "/admin/reviews", icon: Star, minRole: "manager" },
    ],
  },
  {
    id: "storefront",
    items: [
      { id: "homepage", to: "/admin/homepage", icon: PanelsTopLeft, minRole: "manager" },
      { id: "content", to: "/admin/content", icon: Megaphone, minRole: "manager" },
    ],
  },
  {
    id: "store",
    items: [
      { id: "coupons", to: "/admin/coupons", icon: Tag, minRole: "manager" },
      { id: "delivery", to: "/admin/delivery", icon: Truck, minRole: "manager" },
      { id: "settings", to: "/admin/settings", icon: Settings, minRole: "owner" },
      { id: "users", to: "/admin/users", icon: ShieldCheck, minRole: "owner" },
      { id: "activity", to: "/admin/activity", icon: History, minRole: "manager" },
    ],
  },
];

// Pinned to the mobile bottom bar (first four the role may open) + "More".
export const BOTTOM_BAR_IDS = ["dashboard", "orders", "products", "customers"];
