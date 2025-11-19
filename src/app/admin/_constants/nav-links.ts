import {
  LayoutDashboard,
  PackageSearch,
  Tags,
  Users2,
  ShoppingCart,
  BarChart3,
} from "lucide-react";

export const ADMIN_NAV_LINKS = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: PackageSearch,
  },
  {
    label: "Collections",
    href: "/admin/collections",
    icon: Tags,
  },
  {
    label: "Customers",
    href: "/admin/customer",
    icon: Users2,
  },
  {
    label: "Orders",
    href: "/admin/order",
    icon: ShoppingCart,
  },
  {
    label: "Reports",
    href: "/admin/report",
    icon: BarChart3,
  },
] as const;




export type MenuSublink = {
  label: string;
  href: string;
};

export type MegaMenuColumn = {
  title: string;
  links: MenuSublink[];
};

export type MenuItem =
  | {
      label: string;
      href: string;
      type: "simple";
      sublinks?: MenuSublink[];
      isSale?: boolean;
    }
  | {
      label: string;
      href: string;
      type: "mega";
      columns: MegaMenuColumn[];
      image?: string;
      isSale?: boolean;
    };

export const MENUITEMS: MenuItem[] = [
  {
    label: "SALE",
    href: "/collections/sale",
    type: "simple",
    isSale: true,
    sublinks: [
      { label: "MEN", href: "/collections/sale-men" },
      { label: "WOMEN", href: "/collections/sale-women" },
      { label: "FOOTWEAR", href: "#" },
      { label: "BELTS & WALLETS", href: "#" },
    ],
  },
  {
    label: "MEN",
    href: "collections/men",
    type: "mega",
    columns: [
      {
        title: "CLOTHING",
        links: [
          { label: "Jeans", href: "/collections/men-jeans" },
          { label: "Chinos & Pants", href: "/collections/men-chinos-pants" },
          { label: "T-Shirts", href: "/collections/men-tshirts" },
          { label: "Shirts", href: "/collections/men-shirts" },
          { label: "Polos", href: "/collections/men-polos" },
          { label: "Shorts", href: "/collections/men-shorts" },
          { label: "Cargo", href: "/collections/men-cargo" },
          { label: "Jackets", href: "/collections/men-jackets" },
          { label: "Sweaters", href: "/collections/men-sweaters" },
          { label: "Sweatshirts", href: "/collections/men-sweatshirts" },
          { label: "Must Have", href: "/collections/men-must-have" },
        ],
      },
      {
        title: "SHOP JEANS BY FIT",
        links: [
          { label: "Baggy", href: "/collections/men-jeans-baggy" },
          { label: "Loose", href: "/collections/men-jeans-loose" },
          { label: "Relaxed", href: "/collections/men-jeans-relaxed" },
          { label: "Straight", href: "/collections/men-jeans-straight" },
          { label: "Slim", href: "/collections/men-jeans-slim" },
          { label: "Skinny", href: "/collections/men-jeans-skinny" },
          { label: "Bootcut", href: "/collections/men-jeans-bootcut" },
        ],
      },
      {
        title: "JEANS BY STYLE",
        links: [
          { label: "568™ Loose Fit", href: "/collections/men-568-loose-fit" },
          { label: "578™ Baggy Fit", href: "/collections/men-578-baggy-fit" },
          { label: "555™ Relaxed Fit", href: "/collections/men-555-relaxed-fit" },
          { label: "501® Original Straight Fit", href: "/collections/men-501-original" },
          { label: "511™ Slim Fit", href: "/collections/men-511-slim-fit" },
          { label: "512™ Slim Tapered", href: "/collections/men-512-slim-tapered" },
          { label: "513™ Slim Straight", href: "/collections/men-513-slim-straight" },
          { label: "550™ Relaxed Fit", href: "/collections/men-550-relaxed-fit" },
          { label: "505™ Straight Fit", href: "/collections/men-505-straight-fit" },
          { label: "541™ Athletic Tapered Fit", href: "/collections/men-541-athletic-tapered" },
        ],
      },
      {
        title: "T-SHIRTS & SHIRTS",
        links: [
          { label: "T-Shirts", href: "/collections/men-tshirts" },
          { label: "Oversized T-Shirts", href: "/collections/men-oversized-tshirts" },
          { label: "Shirts", href: "/collections/men-shirts" },
          { label: "Polo Shirts", href: "/collections/men-polo-shirts" },
          { label: "Linen Shirts", href: "/collections/men-linen-shirts" },
          { label: "Oxford Shirts", href: "/collections/men-oxford-shirts" },
          { label: "Denim Shirts", href: "/collections/men-denim-shirts" },
          { label: "Striped Shirts", href: "/collections/men-striped-shirts" },
          { label: "Corduroy Shirts", href: "/collections/men-corduroy-shirts" },
        ],
      },
      {
        title: "FOOTWEAR & ACCESSORIES",
        links: [
          { label: "Belts", href: "/collections/men-belts" },
          { label: "Casual Shoes", href: "/collections/men-casual-shoes" },
          { label: "Wallets", href: "/collections/men-wallets" },
        ],
      },
    ],
    image: "/men-denim-fashion.jpg",
  },
  {
    label: "WOMEN",
    href: "/collections/women",
    type: "mega",
    columns: [
      {
        title: "CLOTHING",
        links: [
          { label: "Jeans", href: "/collections/women-jeans" },
          { label: "T-Shirts", href: "/collections/women-tshirts" },
          { label: "Tops", href: "/collections/women-tops" },
          { label: "Shirts", href: "/collections/women-shirt" },
          { label: "Jackets", href: "/collections/women-jackets" },
          { label: "Shorts", href: "/collections/women-shorts" },
          { label: "Dresses", href: "/collections/women-dresses" },
          { label: "Skirts", href: "/collections/women-skirts" },
          { label: "Pants & Trousers", href: "/collections/women-pants-trousers" },
          { label: "Joggers", href: "/collections/women-joggers" },
          { label: "Jumpsuits", href: "/collections/women-jumpsuits" },
          { label: "Corset Tops", href: "/collections/women-corset-tops" },
          { label: "Sweatshirts", href: "/collections/women-sweatshirts" },
          { label: "Sweaters", href: "/collections/women-sweaters" },
          { label: "Must Have", href: "/collections/women-must-have" },
        ],
      },
      {
        title: "SHOP JEANS BY FIT",
        links: [
          { label: "Baggy", href: "/collections/women-jeans-baggy" },
          { label: "Skinny", href: "/collections/women-jeans-skinny" },
          { label: "Flare", href: "/collections/women-jeans-flare" },
          { label: "Loose", href: "/collections/women-jeans-loose" },
          { label: "Straight", href: "/collections/women-jeans-straight" },
          { label: "High Rise", href: "/collections/women-jeans-high-rise" },
          { label: "Wide Leg", href: "/collections/women-jeans-wide-leg" },
        ],
      },
      {
        title: "JEANS BY STYLE",
        links: [
          { label: "725™ High Rise Bootcut", href: "/collections/women-725-high-rise-bootcut" },
          { label: "Ribcage Straight", href: "/collections/women-ribcage-straight" },
          { label: "311™ Shaping Skinny", href: "/collections/women-311-shaping-skinny" },
          { label: "312™ Shaping Slim", href: "/collections/women-312-shaping-slim" },
          { label: "501® Original", href: "/collections/women-501-original" },
          { label: "710™ Super Skinny", href: "/collections/women-710-super-skinny" },
          { label: "711™ Skinny", href: "/collections/women-711-skinny" },
          { label: "715™ Bootcut", href: "/collections/women-715-bootcut" },
          { label: "721™ High Rise Skinny", href: "/collections/women-721-high-rise-skinny" },
          { label: "724™ High Rise Straight", href: "/collections/women-724-high-rise-straight" },
        ],
      },
      {
        title: "FOOTWEAR & ACCESSORIES",
        links: [
          { label: "Slip-Ons", href: "/collections/women-slip-ons" },
          { label: "Hats", href: "/collections/women-hats" },
          { label: "Casual Shoes", href: "/collections/women-casual-shoes" },
          { label: "Wallets", href: "/collections/women-wallets" },
        ],
      },
    ],
    image: "/women-denim-fashion.jpg",
  },
  {
    label: "NEW ARRIVALS",
    href: "#",
    type: "simple",
    sublinks: [
      { label: "EASY IN LEVI'S LOOSE FITS", href: "#" },
      { label: "MEN", href: "#" },
      { label: "WOMEN", href: "#" },
      { label: "ONLINE EXCLUSIVE", href: "#" },
    ],
  },
  {
    label: "FEATURED COLLECTIONS",
    href: "#",
    type: "simple",
    sublinks: [
      { label: "WINTER EDITS", href: "#" },
      { label: "PREMIUM COLLECTION", href: "#" },
      { label: "PERFORMANCE ESSENTIALS", href: "#" },
      { label: "EASY IN LEVIS", href: "#" },
    ],
  },
];
