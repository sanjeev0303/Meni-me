import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import Navbar from "@/components/layout/navbar";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getUserCommerceCounts } from "@/server/storefront-service";
import Footer from "@/components/layout/footer";
import { ToastProvider } from "@/components/providers/toast-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meni-me - Fashion & Style",
  description: "Discover tailored silhouettes and modern staples at Meni-me",
  icons: {
    icon: {
      url: "/menime-logo.png",
      type: "image/png",
      sizes: "16x16",
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();
  const userId = typeof currentUser?.id === "string" ? currentUser.id : null;

  let initialCartCount: number | undefined;
  let initialWishlistCount: number | undefined;

  if (userId) {
    const counts = await getUserCommerceCounts(userId);
    initialCartCount = counts.cartCount;
    initialWishlistCount = counts.wishlistCount;
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <ToastProvider>
            <div className="flex min-h-screen flex-col bg-white">
              <Navbar
                initialCartCount={initialCartCount}
                initialWishlistSize={initialWishlistCount}
              />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
