"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
  ChevronDown,
  Settings,
  Bell,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { signOut, useSession } from "@/lib/auth-client";
import { MENUITEMS } from "@/app/admin/_constants/nav-links";


type NavbarProps = {
  initialCartCount?: number;
  initialWishlistSize?: number; // Renamed from initialWishlistCount
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
    const second =
      tokens.length > 1 ? tokens[tokens.length - 1]?.[0] ?? "" : "";
    return (first + second).toUpperCase();
  }

  if (fallback && fallback.length > 0) {
    return fallback[0]?.toUpperCase() ?? "";
  }

  return "";
};

const resolveUserAvatarUrl = (user: unknown): string | null => {
  if (!user || typeof user !== "object") {
    return null;
  }

  const record = user as Record<string, unknown>;
  const candidateKeys = [
    "image",
    "imageUrl",
    "avatarUrl",
    "profileImage",
    "photoURL",
    "picture",
  ] as const;

  for (const key of candidateKeys) {
    const value = record[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  const avatar = record.avatar;
  if (avatar && typeof avatar === "object") {
    const url = (avatar as Record<string, unknown>).url;
    if (typeof url === "string") {
      const trimmed = url.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  const profile = record.profile;
  if (profile && typeof profile === "object") {
    const profileRecord = profile as Record<string, unknown>;
    const value = profileRecord.image ?? profileRecord.picture ?? profileRecord.photoURL;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  return null;
};

export const Navbar = ({
  initialCartCount,
  initialWishlistSize,
}: NavbarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedMobileItems, setExpandedMobileItems] = useState<Set<string>>(
    new Set()
  );
  const [isMobile, setIsMobile] = useState(false);
  const [dropdownTimeout, setDropdownTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [isSigningOut, startSignOut] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");

  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);
  const actionsMenuButtonRef = useRef<HTMLButtonElement | null>(null);

  const { data: session } = useSession();
  const user = session?.user;

  const isAdmin = Boolean(user && "role" in user && user.role === "ADMIN");

  // Use initialWishlistSize for the memoized initial counts
  const normalizedInitialCounts = useMemo(() => {
    return {
      cartCount: Math.max(0, initialCartCount ?? 0),
      wishlistCount: Math.max(0, initialWishlistSize ?? 0),
    } satisfies CommerceCounts;
  }, [initialCartCount, initialWishlistSize]);

  useEffect(() => {
    queryClient.setQueryData<CommerceCounts>(
      commerceCountsQueryKey,
      normalizedInitialCounts
    );
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

  const cartCount = Math.max(
    0,
    commerceCounts?.cartCount ?? normalizedInitialCounts.cartCount
  );
  const wishlistCount = Math.max(
    0,
    commerceCounts?.wishlistCount ?? normalizedInitialCounts.wishlistCount
  );

  const userInitials = useMemo(
    () => getInitials(user?.name, user?.email),
    [user?.name, user?.email]
  );

  const userAvatar = useMemo(() => resolveUserAvatarUrl(user), [user]);

  useEffect(() => {
    const handleResize = () => {
      // Medium screens (768px-1023px) and desktop will show nav items but wrap appropriately
      const mobile = window.innerWidth < 768;
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
    if (!isActionsMenuOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }

      if (
        actionsMenuRef.current?.contains(target) ||
        actionsMenuButtonRef.current?.contains(target)
      ) {
        return;
      }

      setIsActionsMenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isActionsMenuOpen]);

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
    setIsSearchOpen(false);
  };

  const toggleSearch = () => {
    setIsSearchOpen((prev) => !prev);
    setIsMenuOpen(false);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  const toggleMobileExpand = (label: string) => {
    setExpandedMobileItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const handleToggleUserMenu = () => {
    setIsUserMenuOpen((prev) => !prev);
  };

  const handleToggleActionsMenu = () => {
    setIsActionsMenuOpen((prev) => !prev);
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
            Welcome to Levi&apos;s
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
        <div className="rounded-2xl bg-gray-50 p-3 text-xs uppercase tracking-[0.35em] text-gray-500">
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
    <header className="sticky top-0 left-0 right-0 z-50 w-full bg-white">
      {/* Mobile Navbar (< 768px) */}
      <nav className="border-b border-gray-200 flex items-center justify-between px-4 py-3 sm:px-4 sm:py-3 md:hidden">
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="inline-flex items-center justify-center rounded-full border border-gray-200 p-2.5 transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X size={24} className="text-gray-900" />
            ) : (
              <Menu size={24} className="text-gray-900" />
            )}
          </button>

          <SheetContent
            side="left"
            className="w-[70%] max-w-sm p-0 flex flex-col overflow-hidden"
          >
            <SheetHeader className="border-b border-gray-200 px-4 py-4 ">
              <SheetTitle className="sr-only">Site navigation menu</SheetTitle>
              <SheetDescription className="sr-only">
                Browse product categories, account links, and quick actions.
              </SheetDescription>
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center gap-0">
                  <div className="relative h-8 w-12">
                    <Image
                      src="/menime-logo.png"
                      alt="Menime logo"
                      fill
                      sizes="48px"
                      className="object-contain"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-gray-900 uppercase tracking-[0.15em]">
                    Mani-Me
                  </span>
                </div>
                <SheetClose />
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {/* Welcome Message */}
              <div className="flex items-center gap-3 px-4 pb-4 mb-4 pt-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-900 text-white text-sm font-bold">
                  W
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Welcome!</p>
                  <p className="text-xs text-gray-600">
                    Have a seamless shopping experience.
                  </p>
                </div>
              </div>

              {/* Login/Signup Button */}
              <Link
                href="/sign-in"
                className="block w-full rounded-lg bg-red-600 px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.3em] text-white mb-6 mx-4 hover:bg-red-700 transition"
                onClick={() => setIsMenuOpen(false)}
              >
                Login / Sign up
              </Link>

              {/* Menu Items */}
              <div className="px-4">
                {MENUITEMS.map((item) => {
                  const isExpanded = expandedMobileItems.has(item.label);
                  const hasSubmenu =
                    (item.type === "simple" &&
                      item.sublinks &&
                      item.sublinks.length > 0) ||
                    item.type === "mega";

                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={item.href}
                          className={`flex-1 block border-b border-gray-100 py-3 sm:py-4 text-xs sm:text-xs font-bold uppercase tracking-[0.4em] transition-colors duration-150 ${
                            item.isSale
                              ? "text-red-600"
                              : "text-gray-900 hover:text-red-600"
                          } active:bg-gray-50`}
                          onClick={() => {
                            if (!hasSubmenu) {
                              setIsMenuOpen(false);
                            }
                          }}
                        >
                          {item.label}
                        </Link>
                        {hasSubmenu && (
                          <button
                            type="button"
                            onClick={() => toggleMobileExpand(item.label)}
                            className="border-b border-gray-100 py-3 sm:py-4 px-2 text-gray-700 transition-colors duration-150 hover:text-red-600 active:bg-gray-50"
                            aria-label={
                              isExpanded
                                ? `Collapse ${item.label}`
                                : `Expand ${item.label}`
                            }
                            aria-expanded={isExpanded}
                          >
                            <ChevronDown
                              size={20}
                              className={`transition-transform duration-300 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        )}
                      </div>

                      {/* Simple Menu Sublinks */}
                      {isExpanded &&
                      item.type === "simple" &&
                      item.sublinks &&
                      item.sublinks.length > 0 ? (
                        <div className="bg-gray-50 py-2 animate-in slide-in-from-top-2 duration-300">
                          {item.sublinks.map((sublink) => (
                            <Link
                              key={sublink.label}
                              href={sublink.href}
                              className="block px-4 py-3 sm:py-4 text-xs text-gray-600 transition-colors duration-150 hover:text-red-600 hover:bg-gray-100 active:bg-gray-200 rounded"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {sublink.label}
                            </Link>
                          ))}
                        </div>
                      ) : null}

                      {/* Mega Menu - All Columns Visible */}
                      {isExpanded && item.type === "mega" ? (
                        <div className="space-y-4 bg-gray-50 py-4 px-4 animate-in slide-in-from-top-2 duration-300">
                          {item.columns.map((column) => (
                            <div key={column.title}>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gray-500 mb-3">
                                {column.title}
                              </p>
                              <ul className="space-y-1">
                                {column.links.map((link) => (
                                  <li key={link.label}>
                                    <Link
                                      href={link.href}
                                      className="block text-xs text-gray-600 transition-colors duration-150 hover:text-red-600 hover:bg-gray-100 active:bg-gray-200 px-3 py-2.5 sm:py-3 rounded"
                                      onClick={() => setIsMenuOpen(false)}
                                    >
                                      {link.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {/* Contact Us Section */}
              <div className="border-t border-gray-200 mt-4 pt-4 px-4">
                <button className="flex items-center gap-3 text-gray-900 font-bold text-xs uppercase tracking-[0.3em] hover:text-red-600 transition">
                  <span>☎</span>
                  Contact Us
                </button>
              </div>

              {/* Additional Help Section */}
              <div className="border-t border-gray-200 mt-4 pt-4 pb-6 px-4">
                <button className="flex items-center gap-3 text-gray-900 font-bold text-xs uppercase tracking-[0.3em] hover:text-red-600 transition">
                  <span>?</span>
                  Help & Support
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Center: Logo with Company Name */}
        <Link
          href="/"
          className="flex flex-col items-center gap-0"
          aria-label="Menime home"
        >
          <div className="relative h-8 w-12 sm:h-9 sm:w-14">
            <Image
              src="/menime-logo.png"
              alt="Menime logo"
              fill
              sizes="(max-width: 640px) 48px, 56px"
              className="object-contain"
              priority
            />
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-gray-900 uppercase tracking-[0.15em]">
            Mani-Me
          </span>
        </Link>

        {/* Right: Action Icons with User Button */}
        <div className="flex items-center gap-2">
          {/* Search Icon */}
          <button
            onClick={toggleSearch}
            className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 transition-colors duration-200 hover:text-red-600 hover:border-red-300 active:bg-gray-50"
            aria-label="Toggle search"
          >
            <Search size={20} className="text-gray-900" />
          </button>

          {/* Notifications/Offers Icon */}
          <button className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 transition-colors duration-200 hover:text-red-600 hover:border-red-300 active:bg-gray-50 relative">
            <Bell size={20} className="text-gray-900" />
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white">
              1
            </span>
          </button>

          {/* Wishlist Icon */}
          <Link
            href="/wishlist"
            className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 transition-colors duration-200 hover:text-red-600 hover:border-red-300 active:bg-gray-50 relative"
          >
            <Heart size={20} className="text-gray-900" />
            {wishlistCount > 0 ? (
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white">
                {wishlistCount}
              </span>
            ) : null}
          </Link>

          {/* Cart Icon */}
          <Link
            href="/cart"
            className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 transition-colors duration-200 hover:text-red-600 hover:border-red-300 active:bg-gray-50 relative"
          >
            <ShoppingBag size={20} className="text-gray-900" />
            {cartCount > 0 ? (
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white">
                {cartCount}
              </span>
            ) : null}
          </Link>

          <button
            ref={userMenuButtonRef}
            type="button"
            onClick={handleToggleUserMenu}
            className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 bg-white text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100"
            aria-label="Account menu"
          >
            {user ? (
              userAvatar ? (
                <span className="relative flex h-8 w-8 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                  <Image
                    src={userAvatar || "/placeholder.svg"}
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
              <User size={20} className="text-gray-900" />
            )}
          </button>

          {isUserMenuOpen ? (
            <div
              ref={userMenuRef}
              className="absolute right-0 top-20 mt-3 w-64 rounded-lg border border-gray-200 bg-white shadow-xl z-50"
            >
              {renderUserMenuContent()}
            </div>
          ) : null}
        </div>
      </nav>

      {isSearchOpen && isMobile ? (
        <div className="fixed inset-0 top-24 z-40 bg-white border-t border-gray-200 overflow-y-auto md:hidden">
          <div className="px-4 py-4">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit}>
              <div className="flex items-center gap-2 border-b border-gray-200 pb-4 mb-6">
                <Search size={20} className="text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Tell us what you are looking for"
                  className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder-gray-400"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="submit"
                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                  >
                    Search
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </form>

            {/* Popular Trending Section */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.35em] text-gray-900 mb-4">
                  Popular Trending Now
                </h3>

                {/* Category Filters Sidebar */}
                <div className="flex gap-4 mb-6">
                  <div className="w-20">
                    <div className="space-y-2 text-xs">
                      {["Shirts", "Sweaters", "Jackets", "T-Shirts"].map(
                        (cat) => (
                          <div
                            key={cat}
                            className="text-gray-600 cursor-pointer hover:text-gray-900"
                          >
                            {cat}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Product Grid */}
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="bg-gray-200 rounded aspect-square flex items-end justify-start p-2"
                      >
                        <div className="text-white text-xs font-bold">
                          Men&apos;s 511
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* The previous implementation of the mobile menu is removed */}

      {/* Medium & Desktop Navigation (≥ 768px) */}
      <nav className="hidden md:block border-b border-gray-200 relative">
        <div className="flex items-start justify-between gap-4 lg:gap-8 px-4 md:px-6 lg:px-8 py-4">
          {/* Logo with Company Name */}
          <Link
            href="/"
            className="flex flex-col items-center gap-0"
            aria-label="Menime home"
          >
            <div className="relative h-8 w-12">
              <Image
                src="/menime-logo.png"
                alt="Menime logo"
                fill
                sizes="48px"
                className="object-contain"
                priority
              />
            </div>
            <span className="text-[10px] font-bold text-gray-900 uppercase tracking-[0.15em]">
              Mani-Me
            </span>
          </Link>

          <div className="hidden w-full lg:flex lg:flex-1 lg:items-center lg:justify-center lg:gap-8">
            {MENUITEMS.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => handleMouseEnter(item.label)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href={item.href}
                  className={`relative pb-1 text-xs font-bold uppercase tracking-[0.4em] transition-colors duration-200 ${
                    item.isSale
                      ? "text-red-600 hover:text-red-700"
                      : "text-gray-900 hover:text-red-600"
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
                                <li key={link.label}>
                                  <Link
                                    href={link.href}
                                    className="text-sm text-gray-700 transition-colors duration-150 hover:text-red-600"
                                  >
                                    {link.label}
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
                                src={item.image || "/placeholder.svg"}
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

          <div className="flex items-center gap-3 md:gap-4 lg:gap-6">
            {/* Search Input - hidden on medium, visible on large */}
            <form onSubmit={handleSearchSubmit} className="hidden lg:flex">
              <div className="flex items-center gap-2 border-b-2 border-gray-300 px-2 py-1 text-xs text-gray-600 transition-colors duration-200 hover:border-gray-400 focus-within:border-red-600 focus-within:text-gray-900">
                <Search size={18} className="text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Tell us what you are looking for"
                  className="w-56 bg-transparent text-xs text-gray-900 outline-none placeholder-gray-400"
                />
              </div>
            </form>

            {/* Search Icon - visible on medium only */}
            <button
              onClick={toggleSearch}
              className="inline-flex lg:hidden items-center justify-center rounded-full border border-gray-200 transition-colors duration-200 hover:text-red-600 hover:border-red-300 active:bg-gray-50 p-2"
              aria-label="Toggle search"
            >
              <Search size={18} className="text-gray-900" />
            </button>

            <Link
              href="/wishlist"
              className="inline-flex items-center justify-center rounded-full border border-gray-200 transition-colors duration-200 hover:text-red-600 hover:border-red-300 active:bg-gray-50 p-2 relative"
            >
              <Heart size={20} className="text-gray-900" />
              {wishlistCount > 0 ? (
                <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                  {wishlistCount}
                </span>
              ) : null}
            </Link>

            <Link
              href="/cart"
              className="inline-flex items-center justify-center rounded-full border border-gray-200 transition-colors duration-200 hover:text-red-600 hover:border-red-300 active:bg-gray-50 p-2 relative"
            >
              <ShoppingBag size={20} className="text-gray-900" />
              {cartCount > 0 ? (
                <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              ) : null}
            </Link>

            {/* User Account Menu */}
            <div className="relative">
              <button
                ref={userMenuButtonRef}
                type="button"
                onClick={handleToggleUserMenu}
                className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100 p-2"
                aria-label="Account menu"
              >
                <span className="sr-only">
                  {user ? "Open account menu" : "Open login menu"}
                </span>
                {user ? (
                  userAvatar ? (
                    <span className="relative flex h-8 w-8 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                      <Image
                        src={userAvatar || "/placeholder.svg"}
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
                  className="fixed left-0 right-0 top-0 bottom-0 z-40 flex flex-col overflow-y-auto bg-white border-t border-gray-200 md:absolute md:top-full md:left-auto md:right-0 md:bottom-auto md:mt-3 md:w-64 md:rounded-3xl md:border md:border-gray-200 md:border-t-0 md:bg-white md:shadow-xl"
                >
                  <div className="md:hidden flex items-center justify-between sticky top-0 bg-white border-b border-gray-200 px-4 py-4 z-10">
                    <h2 className="text-sm font-bold text-gray-900">Account</h2>
                    <button
                      onClick={() => setIsUserMenuOpen(false)}
                      className="inline-flex items-center justify-center h-8 w-8 text-gray-600 hover:text-gray-900 transition"
                      aria-label="Close account menu"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {renderUserMenuContent()}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
