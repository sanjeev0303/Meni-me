import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth-helpers";
import { clearUserCart } from "@/server/storefront-service";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  type CartRemovalDescriptor = string | { productId: string; selectedSize?: string | null; selectedColor?: string | null };

  let removalItems: CartRemovalDescriptor[] | undefined;

  try {
    const body = await request.json().catch(() => null);
    if (body) {
      if (Array.isArray(body.items)) {
        removalItems = body.items
          .map((entry: unknown): CartRemovalDescriptor | null => {
            if (typeof entry === "string") {
              return entry.trim().length > 0 ? entry.trim() : null;
            }

            if (entry && typeof entry === "object") {
              const productId = typeof (entry as { productId?: unknown }).productId === "string"
                ? ((entry as { productId: string }).productId).trim()
                : "";

              if (!productId) {
                return null;
              }

              const descriptor: Exclude<CartRemovalDescriptor, string> = {
                productId,
              };

              if (Object.prototype.hasOwnProperty.call(entry, "selectedSize")) {
                const value = (entry as { selectedSize?: unknown }).selectedSize;
                descriptor.selectedSize = typeof value === "string"
                  ? value
                  : value === null
                    ? null
                    : undefined;
              }

              if (Object.prototype.hasOwnProperty.call(entry, "selectedColor")) {
                const value = (entry as { selectedColor?: unknown }).selectedColor;
                descriptor.selectedColor = typeof value === "string"
                  ? value
                  : value === null
                    ? null
                    : undefined;
              }

              return descriptor;
            }

            return null;
          })
          .filter((value: CartRemovalDescriptor | null): value is CartRemovalDescriptor => value !== null);
      } else if (Array.isArray(body.productIds)) {
        removalItems = body.productIds
          .filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0)
          .map((value: string) => value.trim());
      }
    }
  } catch (error) {
    console.warn("Failed to parse cart clear payload", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = await clearUserCart(user.id, removalItems);

  return NextResponse.json(result, { status: 200 });
}
