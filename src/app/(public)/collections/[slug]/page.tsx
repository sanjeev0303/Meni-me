import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import StorefrontProductCard from "@/components/storefront/product-card";
import { Button } from "@/components/ui/button";
import { getCollectionWithProductsBySlug } from "@/lib/storefront/catalog";
import type { Metadata } from "next";

export const revalidate = 60;

type CollectionPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const buildMetadata = async (slug: string) => {
  const data = await getCollectionWithProductsBySlug(slug);

  if (!data) {
    return null;
  }

  const { collection } = data;

  const description = collection.description
    ? collection.description
    : `Discover curated ${collection.name} pieces from Hub Fashiion.`;

  return {
    title: `${collection.name} · Hub Fashiion`,
    description,
  } satisfies Metadata;
};

export const generateMetadata = async ({ params }: CollectionPageProps): Promise<Metadata> => {
  const { slug } = await params;
  return (await buildMetadata(slug)) ?? {};
};

const CollectionPage = async ({ params }: CollectionPageProps) => {
  const { slug } = await params;
  const data = await getCollectionWithProductsBySlug(slug);

  if (!data) {
    notFound();
  }

  const { collection, children, products } = data;
  const heroImage = collection.image;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-0">
      <nav className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-slate-400">
        <Link href="/collections" className="hover:text-slate-900">
          Collections
        </Link>
        <ArrowRight className="h-3 w-3" />
        <span className="text-slate-500">{collection.name}</span>
      </nav>

      <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200">
        <div className="grid min-h-80 gap-0 overflow-hidden bg-white lg:grid-cols-[1.2fr_1fr]">
          <div className="relative overflow-hidden">
            {heroImage ? (
              <Image
                src={heroImage.url}
                alt={collection.name}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-slate-200 via-slate-100 to-slate-300">
                <span className="text-lg font-semibold uppercase tracking-[0.4em] text-slate-500">
                  {collection.name}
                </span>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
          </div>
          <div className="flex flex-col justify-between gap-6 p-8">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                {collection.parent ? collection.parent.name : "Collection"}
              </p>
              <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900">
                {collection.name}
              </h1>
              {collection.description ? (
                <p className="text-sm leading-relaxed text-slate-600">{collection.description}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link href={"#products"}>
                  Explore collection
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full border-slate-300">
                <Link href="/collections" className="inline-flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Shop all collections
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {children.length ? (
        <section className="mt-12 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-500">
              Sub-collections
            </h2>
            <span className="text-xs uppercase tracking-[0.4em] text-slate-400">
              {children.length} options
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/collections/${child.slug}`}
                className="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                      {child.parent?.name ?? collection.name}
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900">{child.name}</h3>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1" />
                </div>
                {child.description ? (
                  <p className="text-sm text-slate-500 line-clamp-2">{child.description}</p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section id="products" className="mt-16 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-500">
              Featured pieces
            </h2>
            <p className="text-base text-slate-600">
              {products.length ? "Hand-picked looks ready to wear." : "Check back soon for new arrivals."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href="/product">View all products</Link>
            </Button>
          </div>
        </div>

        {products.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <StorefrontProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 p-12 text-center text-slate-500">
            No products in this collection yet. Add favorites to your wishlist and be the first to know when they drop.
          </div>
        )}
      </section>
    </div>
  );
};

export default CollectionPage;
