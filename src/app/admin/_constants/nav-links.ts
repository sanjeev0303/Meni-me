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
  links: string[];
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
          "Jeans",
          "Chinos & Pants",
          "T-Shirts",
          "Shirts",
          "Polos",
          "Shorts",
          "Cargo",
          "Jackets",
          "Sweaters",
          "Sweatshirts",
          "Must Have",
        ],
      },
      {
        title: "SHOP JEANS BY FIT",
        links: ["Baggy", "Loose", "Relaxed", "Straight", "Slim", "Skinny", "Bootcut"],
      },
      {
        title: "JEANS BY STYLE",
        links: [
          "568™ Loose Fit",
          "578™ Baggy Fit",
          "555™ Relaxed Fit",
          "501® Original Straight Fit",
          "511™ Slim Fit",
          "512™ Slim Tapered",
          "513™ Slim Straight",
          "550™ Relaxed Fit",
          "505™ Straight Fit",
          "541™ Athletic Tapered Fit",
        ],
      },
      {
        title: "T-SHIRTS & SHIRTS",
        links: [
          "T-Shirts",
          "Oversized T-Shirts",
          "Shirts",
          "Polo Shirts",
          "Linen Shirts",
          "Oxford Shirts",
          "Denim Shirts",
          "Striped Shirts",
          "Corduroy Shirts",
        ],
      },
      {
        title: "FOOTWEAR & ACCESSORIES",
        links: ["Belts", "Casual Shoes", "Wallets"],
      },
    ],
    image: "/men-denim-fashion.jpg",
  },
  {
    label: "WOMEN",
    href: "#",
    type: "mega",
    columns: [
      {
        title: "CLOTHING",
        links: [
          "Jeans",
          "T-Shirts",
          "Tops",
          "Shirts",
          "Jackets",
          "Shorts",
          "Dresses",
          "Skirts",
          "Pants & Trousers",
          "Joggers",
          "Jumpsuits",
          "Corset Tops",
          "Sweatshirts",
          "Sweaters",
          "Must Have",
        ],
      },
      {
        title: "SHOP JEANS BY FIT",
        links: ["Baggy", "Skinny", "Flare", "Loose", "Straight", "High Rise", "Wide Leg"],
      },
      {
        title: "JEANS BY STYLE",
        links: [
          "725™ High Rise Bootcut",
          "Ribcage Straight",
          "311™ Shaping Skinny",
          "312™ Shaping Slim",
          "501® Original",
          "710™ Super Skinny",
          "711™ Skinny",
          "715™ Bootcut",
          "721™ High Rise Skinny",
          "724™ High Rise Straight",
        ],
      },
      {
        title: "FOOTWEAR & ACCESSORIES",
        links: ["Slip-Ons", "Hats", "Casual Shoes", "Wallets"],
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
