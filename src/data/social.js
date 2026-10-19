import {
  ShirtIcon,
  DressIcon,
  WatchIcon,
  ShoeIcon,
  SparkleIcon,
  StarIcon,
} from "../components/layout/icons";

// Placeholder feed — no image assets in the project, so each "post" is a
// tinted icon panel (same convention as CategoryShowcase/ProductCard).
// Shape is backend-ready: swapping in a real Instagram Graph API response
// only requires mapping { id, image, permalink } onto these fields.
const social = [
  { id: "post-1", icon: ShirtIcon },
  { id: "post-2", icon: DressIcon },
  { id: "post-3", icon: WatchIcon },
  { id: "post-4", icon: ShoeIcon },
  { id: "post-5", icon: SparkleIcon },
  { id: "post-6", icon: StarIcon },
];

export default social;
