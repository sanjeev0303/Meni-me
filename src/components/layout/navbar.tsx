"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { signOut, useSession } from "@/lib/auth-client";

type MenuSublink = {
  label: string;
  href: string;
};

type MegaMenuColumn = {
  title: string;
  links: string[];
};

type MenuItem =
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

const menuItems: MenuItem[] = [
  {
    label: "SALE",
    href: "#",
    type: "simple",
    isSale: true,
    sublinks: [
      { label: "MEN", href: "#" },
      { label: "WOMEN", href: "#" },
      { label: "FOOTWEAR", href: "#" },
      { label: "BELTS & WALLETS", href: "#" },
    ],
  },
  {
    label: "MEN",
    href: "#",
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

type NavbarProps = {
  initialCartCount?: number;
  initialWishlistCount?: number;
};

type CommerceCounts = {
  cartCount: number;
  wishlistCount: number;
};

const commerceCountsQueryKey = ["commerce-counts"] as const;

const getInitials = (name?: string | null, fallback?: string | null) => {
  if (name && name.trim().length > 0) {
    const tokens = name.trim().split(/\s+/);
    const first = tokens[0]?.[0] ?? "";
    const second = tokens.length > 1 ? tokens[tokens.length - 1]?.[0] ?? "" : "";
    return (first + second).toUpperCase();
  }

  if (fallback && fallback.length > 0) {
    return fallback[0]?.toUpperCase() ?? "";
  }

  return "";
};

export const Navbar = ({ initialCartCount, initialWishlistCount }: NavbarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [dropdownTimeout, setDropdownTimeout] =
    useState<ReturnType<typeof setTimeout> | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSigningOut, startSignOut] = useTransition();

  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement | null>(null);

  const { data: session } = useSession();
  const user = session?.user;

  // Check if user has admin role - better-auth includes custom fields in session
  const isAdmin = Boolean(user && 'role' in user && user.role === "ADMIN");

  // Debug logging (remove after testing)
  useEffect(() => {
    if (user) {
      console.log("User session data:", { user, hasRole: 'role' in user, role: 'role' in user ? user.role : 'not found' });
    }
  }, [user]);

  const normalizedInitialCounts = useMemo(() => {
    return {
      cartCount: Math.max(0, initialCartCount ?? 0),
      wishlistCount: Math.max(0, initialWishlistCount ?? 0),
    } satisfies CommerceCounts;
  }, [initialCartCount, initialWishlistCount]);

  useEffect(() => {
    queryClient.setQueryData<CommerceCounts>(commerceCountsQueryKey, normalizedInitialCounts);
  }, [normalizedInitialCounts, queryClient]);

  const { data: commerceCounts } = useQuery<CommerceCounts>({
    queryKey: commerceCountsQueryKey,
    queryFn: async () => {
      const response = await fetch("/api/storefront/commerce-counts", {
        method: "GET",
        cache: "no-store",
      });

      if (response.status === 401) {
        return { cartCount: 0, wishlistCount: 0 } satisfies CommerceCounts;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch commerce counts");
      }

      const payload = (await response.json()) as Partial<CommerceCounts>;

      return {
        cartCount: Math.max(0, Number(payload.cartCount) || 0),
        wishlistCount: Math.max(0, Number(payload.wishlistCount) || 0),
      } satisfies CommerceCounts;
    },
    initialData: normalizedInitialCounts,
    enabled: Boolean(user),
    staleTime: 30_000,
    retry: false,
  });

  const cartCount = Math.max(0, commerceCounts?.cartCount ?? normalizedInitialCounts.cartCount);
  const wishlistCount = Math.max(0, commerceCounts?.wishlistCount ?? normalizedInitialCounts.wishlistCount);

  const userInitials = useMemo(
    () => getInitials(user?.name, user?.email),
    [user?.name, user?.email],
  );

  const userAvatar = useMemo(() => {
    if (!user || typeof user.image !== "string") {
      return null;
    }

    const trimmed = user.image.trim();
    return trimmed.length > 0 ? trimmed : null;
  }, [user]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isUserMenuOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }

      if (
        userMenuRef.current?.contains(target) ||
        userMenuButtonRef.current?.contains(target)
      ) {
        return;
      }

      setIsUserMenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isUserMenuOpen]);

  useEffect(() => {
    return () => {
      if (dropdownTimeout) {
        clearTimeout(dropdownTimeout);
      }
    };
  }, [dropdownTimeout]);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const handleMouseEnter = (label: string) => {
    if (isMobile) {
      return;
    }

    if (dropdownTimeout) {
      clearTimeout(dropdownTimeout);
    }

    setActiveDropdown(label);
  };

  const handleMouseLeave = () => {
    if (isMobile) {
      return;
    }

    if (dropdownTimeout) {
      clearTimeout(dropdownTimeout);
    }

    const timeout = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);

    setDropdownTimeout(timeout);
  };

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleToggleUserMenu = () => {
    setIsUserMenuOpen((prev) => !prev);
  };

  const handleSignOut = () => {
    startSignOut(async () => {
      await signOut();
      queryClient.setQueryData<CommerceCounts>(commerceCountsQueryKey, {
        cartCount: 0,
        wishlistCount: 0,
      });
      setIsMenuOpen(false);
      setIsUserMenuOpen(false);
      router.refresh();
    });
  };

  const renderUserMenuContent = () => {
    if (!user) {
      return (
        <div className="flex flex-col gap-2 p-4 text-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
            Welcome to Hub Fashiion
          </p>
          <Link
            href="/sign-in"
            className="rounded-full bg-gray-900 px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-gray-800"
            onClick={() => setIsUserMenuOpen(false)}
          >
            Log in / Join
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full border border-gray-200 px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-gray-700 transition hover:bg-gray-100"
            onClick={() => setIsUserMenuOpen(false)}
          >
            Create account
          </Link>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1 p-4 text-sm">
        <div className="rounded-2xl bg-gray-50 p-3 text-xs uppercase tracking-[0.3em] text-gray-500">
          Hello, {user.name ?? user.email ?? "Explorer"}
        </div>
        <Link
          href="/profile"
          className="rounded-lg px-3 py-2 text-gray-700 transition hover:bg-gray-100"
          onClick={() => setIsUserMenuOpen(false)}
        >
          Profile
        </Link>
        <Link
          href="/orders"
          className="rounded-lg px-3 py-2 text-gray-700 transition hover:bg-gray-100"
          onClick={() => setIsUserMenuOpen(false)}
        >
          Orders
        </Link>
        <Link
          href="/wishlist"
          className="rounded-lg px-3 py-2 text-gray-700 transition hover:bg-gray-100"
          onClick={() => setIsUserMenuOpen(false)}
        >
          Wishlist
        </Link>
        <Link
          href="/cart"
          className="rounded-lg px-3 py-2 text-gray-700 transition hover:bg-gray-100"
          onClick={() => setIsUserMenuOpen(false)}
        >
          Cart
        </Link>
        {isAdmin ? (
          <Link
            href="/admin/dashboard"
            className="rounded-lg px-3 py-2 text-gray-700 transition hover:bg-gray-100"
            onClick={() => setIsUserMenuOpen(false)}
          >
            Admin dashboard
          </Link>
        ) : null}
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-2 inline-flex items-center justify-center rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-700 transition hover:bg-gray-100"
          disabled={isSigningOut}
        >
          {isSigningOut ? "Signing out…" : "Log out"}
        </button>
      </div>
    );
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">

      <nav className="flex flex-wrap items-center gap-4 px-4 py-4 lg:h-20 lg:flex-nowrap lg:gap-8 lg:px-8">
        <div className="flex w-full items-center justify-between lg:w-auto">
          <Link
            href="/"
            className="flex flex-col items-center justify-center text-center"
            aria-label="Meni-me home"
          >
            <span className="relative flex h-6 w-16 items-center justify-center overflow-hidden bg-white">
              <Image src="/menime-logo.png" alt="Meni-me logo" fill sizes="96px" className="object-contain" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-900 sm:text-sm">
              Meni-me
            </span>
          </Link>

          <button
            type="button"
            onClick={toggleMenu}
            className="inline-flex items-center justify-center rounded-full border border-gray-200 p-2 transition-colors duration-200 hover:border-gray-400 hover:text-red-600 lg:hidden"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} className="text-gray-900" /> : <Menu size={24} className="text-gray-900" />}
          </button>
        </div>

        <div className="order-3 hidden w-full lg:order-2 lg:flex lg:flex-1 lg:items-center lg:justify-center lg:gap-8">
          {menuItems.map((item) => (
            <div
              key={item.label}
              className="relative"
              onMouseEnter={() => handleMouseEnter(item.label)}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                href={item.href}
                className={`relative pb-1 text-xs font-bold uppercase tracking-[0.4em] transition-colors duration-200 ${
                  item.isSale ? "text-red-600 hover:text-red-700" : "text-gray-900 hover:text-red-600"
                }`}
              >
                {item.label}
                <span
                  className={`absolute bottom-0 left-0 h-0.5 bg-red-600 transition-all duration-300 ${
                    activeDropdown === item.label ? "w-full" : "w-0"
                  }`}
                />
              </Link>

              {activeDropdown === item.label && item.type === "mega" ? (
                <div className="fixed left-0 right-0 top-22 bg-white shadow-lg lg:top-20">
                  <div className="mx-auto max-w-7xl px-8 py-12">
                    <div className="grid gap-12 md:grid-cols-3 lg:grid-cols-5">
                      {item.columns.map((column) => (
                        <div key={column.title}>
                          <h3 className="mb-6 border-b border-gray-200 pb-2 text-xs font-bold uppercase tracking-[0.4em] text-gray-900">
                            {column.title}
                          </h3>
                          <ul className="space-y-3">
                            {column.links.map((link) => (
                              <li key={link}>
                                <Link
                                  href="#"
                                  className="text-sm text-gray-700 transition-colors duration-150 hover:text-red-600"
                                >
                                  {link}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      {item.image ? (
                        <div className="hidden justify-end lg:flex">
                          <div className="relative h-64 w-48 overflow-hidden rounded-lg bg-linear-to-br from-gray-200 to-gray-300">
                            <Image
                              src={item.image}
                              alt={`${item.label} collection`}
                              fill
                              sizes="192px"
                              className="object-cover"
                              priority
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {activeDropdown === item.label &&
              item.type === "simple" &&
              item.sublinks &&
              item.sublinks.length > 0 ? (
                <div className="fixed left-0 right-0 top-22 bg-white shadow-lg lg:top-20">
                  <div className="mx-auto max-w-7xl px-8 py-8">
                    <ul className="space-y-4">
                      {item.sublinks.map((sublink) => (
                        <li key={sublink.label}>
                          <Link
                            href={sublink.href}
                            className="block text-sm text-gray-700 transition-colors duration-150 hover:text-red-600"
                          >
                            {sublink.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="order-2 flex w-full items-center justify-end gap-3 lg:order-3 lg:w-auto lg:gap-6">
          <div className="hidden items-center gap-2 border-b border-gray-300 px-2 py-1 text-xs text-gray-600 transition-colors duration-200 hover:border-gray-400 focus-within:border-gray-600 md:flex">
            <Search size={18} className="text-gray-500" />
            <input
              type="text"
              placeholder="Tell us what you are looking for"
              className="w-48 bg-transparent text-xs text-gray-900 outline-none placeholder-gray-400"
            />
          </div>

          <Link href="/wishlist" className="relative p-2 transition-colors duration-200 hover:text-red-600">
            <Heart size={20} className="text-gray-900" />
            {wishlistCount > 0 ? (
              <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                {wishlistCount}
              </span>
            ) : null}
          </Link>

          <Link href="/cart" className="relative p-2 transition-colors duration-200 hover:text-red-600">
            <ShoppingBag size={20} className="text-gray-900" />
            {cartCount > 0 ? (
              <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            ) : null}
          </Link>
          <div className="relative">
            <button
              ref={userMenuButtonRef}
              type="button"
              onClick={handleToggleUserMenu}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
            >
              <span className="sr-only">{user ? "Open account menu" : "Open login menu"}</span>
              {user ? (
                userAvatar ? (
                  <span className="relative flex h-8 w-8 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                    <Image
                      src={userAvatar}
                      alt={user.name ?? user.email ?? "User avatar"}
                      width={32}
                      height={32}
                      sizes="32px"
                      className="h-full w-full object-cover"
                      priority
                    />
                  </span>
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-[11px] font-semibold uppercase tracking-widest text-white">
                    {userInitials || <User className="h-4 w-4" />}
                  </span>
                )
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900/10 text-gray-900">
                  <User className="h-4 w-4" />
                </span>
              )}
            </button>

            {isUserMenuOpen ? (
              <div
                ref={userMenuRef}
                className="absolute right-0 top-full mt-3 w-64 rounded-3xl border border-gray-200 bg-white shadow-xl"
              >
                {renderUserMenuContent()}
              </div>
            ) : null}
          </div>
        </div>
      </nav>

      {isMenuOpen && isMobile ? (
        <div className="fixed inset-0 top-21 z-40 overflow-y-auto border-t border-gray-200 bg-white lg:hidden">
          <div className="space-y-1 px-4 py-4">
            {menuItems.map((item) => (
              <div key={item.label}>
                <Link
                  href={item.href}
                  className={`block border-b border-gray-100 py-3 text-xs font-bold uppercase tracking-[0.4em] transition-colors ${
                    item.isSale ? "text-red-600" : "text-gray-900 hover:text-red-600"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>

                {item.type === "simple" && item.sublinks && item.sublinks.length > 0 ? (
                  <div className="bg-gray-50 pl-4 py-2">
                    {item.sublinks.map((sublink) => (
                      <Link
                        key={sublink.label}
                        href={sublink.href}
                        className="block py-2 text-xs text-gray-600 transition-colors hover:text-red-600"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {sublink.label}
                      </Link>
                    ))}
                  </div>
                ) : null}

                {item.type === "mega" ? (
                  <div className="space-y-4 bg-gray-50 py-4 pl-4 pr-2">
                    {item.columns.map((column) => (
                      <div key={column.title}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gray-500">
                          {column.title}
                        </p>
                        <ul className="mt-2 space-y-2">
                          {column.links.map((link) => (
                            <li key={link}>
                              <Link
                                href="#"
                                className="text-xs text-gray-600 transition-colors hover:text-red-600"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                {link}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="sticky bottom-0 border-t border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2 rounded border border-gray-200 bg-gray-50 px-3 py-2">
              <Search size={16} className="text-gray-500" />
              <input
                type="text"
                placeholder="Search"
                className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder-gray-400"
              />
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              {isAdmin ? (
                <Link
                  href="/admin/dashboard"
                  className="block rounded-full bg-gray-900 px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-gray-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
              ) : null}
              {user ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-700 transition hover:bg-gray-100"
                  disabled={isSigningOut}
                >
                  {isSigningOut ? "Signing out…" : "Log out"}
                </button>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="block rounded-full border border-gray-200 px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-gray-700 transition hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Log in / Join
                  </Link>
                  <Link
                    href="/sign-up"
                    className="block rounded-full border border-gray-200 px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.3em] text-gray-700 transition hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Create account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
};

export default Navbar;
