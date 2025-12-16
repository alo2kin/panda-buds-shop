import { Product } from "@/types/product";

// Import white product images
import white1 from "@/assets/products/white-1.png";
import white2 from "@/assets/products/white-2.png";
import white3 from "@/assets/products/white-3.png";
import white4 from "@/assets/products/white-4.png";

// Placeholder images - replace with actual product images
export const products: Product[] = [
  {
    id: "panda-buds-black",
    name: "Panda Buds Classic",
    description: "Elegantne crne bežične slušalice sa panda dizajnom. Kristalno čist zvuk i udobnost za svakodnevnu upotrebu.",
    price: 2400,
    images: [
      "/placeholder.svg",
      "/placeholder.svg",
      "/placeholder.svg",
      "/placeholder.svg",
    ],
    color: "Crna",
    colorHex: "#1a1a1a",
  },
  {
    id: "panda-buds-white",
    name: "Panda Buds Snow",
    description: "Čiste bele bežične slušalice sa prepoznatljivim panda likom. Savršen spoj stila i kvaliteta zvuka.",
    price: 2400,
    images: [white1, white2, white3, white4],
    color: "Bela",
    colorHex: "#f5f5f5",
  },
  {
    id: "panda-buds-pink",
    name: "Panda Buds Blossom",
    description: "Roze bežične slušalice sa slatkim panda motivom. Idealne za one koji vole da se ističu.",
    price: 2400,
    images: [
      "/placeholder.svg",
      "/placeholder.svg",
      "/placeholder.svg",
      "/placeholder.svg",
    ],
    color: "Roze",
    colorHex: "#f8a5c2",
  },
  {
    id: "panda-buds-green",
    name: "Panda Buds Bamboo",
    description: "Bamboo zelene bežične slušalice inspirisane prirodom. Ekološki dizajn za ljubitelje prirode.",
    price: 2400,
    images: [
      "/placeholder.svg",
      "/placeholder.svg",
      "/placeholder.svg",
      "/placeholder.svg",
    ],
    color: "Zelena",
    colorHex: "#4ade80",
  },
];

export const SHIPPING_COST = 350;
export const WARRANTY_YEARS = 2;
