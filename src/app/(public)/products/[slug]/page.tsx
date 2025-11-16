import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cache } from "react";

import {
  getFeaturedProducts,
  getStorefrontProductBySlug,
  type StorefrontProduct,
} from "@/lib/storefront/catalog";
import { formatNumber } from "@/lib/format";
import ProductGallery from "../_components/product-gallery";
import ProductPurchasePanel from "../_components/product-purchase-panel";
import StorefrontProductCard from "@/components/storefront/product-card";
import ProductReviews from "../_components/product-reviews";

export const revalidate = 60;

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const getProductCached = cache(async (slug: string) => getStorefrontProductBySlug(slug));

const buildMetadata = async (slug: string): Promise<Metadata | null> => {
  const data = await getProductCached(slug);
  if (!data) {
    return null;
  }

  return {
    title: `${data.product.name} | Meni-me`,
    description: data.product.description ?? "Discover tailored silhouettes and modern staples crafted for the Meni-me collective.",
    openGraph: {
      title: data.product.name,
      description:
        data.product.description ?? "Discover tailored silhouettes and modern staples crafted for the Meni-me collective.",
      images: data.product.media.map((image) => ({
        url: image.url,
      })),
    },
  } satisfies Metadata;
};

export const generateMetadata = async ({ params }: ProductPageProps): Promise<Metadata> => {
  const { slug } = await params;

  return (await buildMetadata(slug)) ?? {};
};

const getRelatedProducts = async (product: StorefrontProduct) => {
  const related = await getFeaturedProducts({ limit: 8 });
  const filtered = related.filter((item) => item.id !== product.id);

  const collections = new Set(product.collections.map((collection) => collection.id));

  const prioritized = filtered
    .sort((a, b) => {
      const aMatches = a.collections.some((collection) => collections.has(collection.id));
      const bMatches = b.collections.some((collection) => collections.has(collection.id));

      if (aMatches === bMatches) {
        return 0;
      }

      return aMatches ? -1 : 1;
    })
    .slice(0, 3);

  return prioritized;
};

const formatDate = (value: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
};

const ProductPage = async ({ params }: ProductPageProps) => {
  const { slug } = await params;

  const data = await getProductCached(slug);

  if (!data) {
    notFound();
  }

  const { product, reviews, averageRating, reviewCount, distribution } = data;
  const related = await getRelatedProducts(product);

  const description = product.description ??
    "Elevate your wardrobe with our studio-edited essentials and showstopping statements — crafted for all the moments you live in.";

  const initialReviewBundle = {
    averageRating,
    reviewCount,
    reviews: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title ?? null,
      comment: review.comment ?? null,
      createdAt: review.createdAt.toISOString(),
      user: {
        id: review.user?.id ?? "guest",
        name: review.user?.name ?? "Anonymous",
        image: review.user?.image ?? null,
      },
    })),
    userReview: null,
    distribution: distribution.map((entry) => ({
      rating: entry.rating,
      count: entry.count,
      percentage: entry.percentage,
    })),
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <ProductGallery title={product.name} images={product.media} />

          <div className="flex flex-col gap-10">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Meni-me exclusive</p>
                <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">{product.name}</h1>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-600">
                {averageRating ? (
                  <span className="flex items-center gap-2">
                    <span className="text-base font-semibold text-slate-900">{averageRating.toFixed(1)}</span>
                    <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Rated by clients</span>
                  </span>
                ) : (
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">New arrival</span>
                )}
                {product.stock > 0 ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {formatNumber(product.stock)} pieces available
                  </span>
                ) : (
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">Sold out</span>
                )}
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Drop date · {formatDate(product.createdAt)}
                </span>
              </div>

              <p className="max-w-xl text-base text-slate-600">{description}</p>

              {product.collections.length ? (
                <div className="flex flex-wrap gap-3">
                  {product.collections.map((collection) => (
                    <Link
                      key={collection.id}
                      href={`/collections/${collection.slug}`}
                      className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium uppercase tracking-[0.3em] text-slate-600 transition hover:border-slate-900 hover:text-slate-900"
                    >
                      {collection.name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            <ProductPurchasePanel
              productId={product.id}
              productName={product.name}
              price={product.price}
              compareAtPrice={product.compareAtPrice}
              stock={product.stock}
              sku={product.sku}
            />
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50/60 py-16">
        <div className="mx-auto w-full max-w-6xl px-6">
          <ProductReviews
            productId={product.id}
            productName={product.name}
            initialData={initialReviewBundle}
          />
        </div>
      </section>

      {related.length ? (
        <section className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Curated for you</h2>
              <p className="text-sm text-slate-600">Stylist-approved matches that pair effortlessly with this look.</p>
            </div>
            <Link
              href="/products"
              className="text-sm font-medium text-slate-900 underline-offset-4 hover:underline"
            >
              View full catalog
            </Link>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <StorefrontProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default ProductPage;
