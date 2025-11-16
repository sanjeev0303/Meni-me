import Image from "next/image";
import Link from "next/link";
import { getStorefrontCollections } from "@/lib/storefront/catalog";
import { formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ArrowRight, Layers3 } from "lucide-react";

export const revalidate = 60;

const CollectionsLandingPage = async () => {
  const collections = await getStorefrontCollections();

  const rootCollections = collections.filter((collection) => !collection.parent);
  const nestedCollections = collections.filter((collection) => collection.parent);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-0">
      <header className="flex flex-col gap-6 border-b border-slate-200 pb-12">
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.4em] text-slate-400">
          <Layers3 className="h-4 w-4" />
          <span>Shop by collection</span>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900 sm:text-5xl">
              Find your next wardrobe icon
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-600">
              Explore our edit of wardrobe staples and seasonal standouts. Every collection is curated by
              the Hub Fashiion team to make styling effortless.
            </p>
          </div>
          <div className="flex items-end justify-start gap-3">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link href="/product" className="inline-flex items-center gap-2">
                Browse all products
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full border-slate-300 px-6">
              <Link href="/" className="inline-flex items-center gap-2">
                Back to home
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mt-12 space-y-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rootCollections.map((collection) => {
            const image = collection.image;

            return (
              <Link
                key={collection.id}
                href={`/collections/${collection.slug}`}
                className="group relative flex aspect-3/4 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative h-full w-full flex-1 overflow-hidden">
                  {image ? (
                    <Image
                      src={image.url}
                      alt={collection.name}
                      fill
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 28vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-slate-200 via-slate-100 to-slate-300">
                      <span className="text-lg font-semibold uppercase tracking-[0.4em] text-slate-500">
                        {collection.name}
                      </span>
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                </div>

                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-6 text-white">
                  <h2 className="text-2xl font-semibold uppercase tracking-[0.3em]">{collection.name}</h2>
                  {typeof collection.productCount === "number" ? (
                    <p className="text-sm uppercase tracking-[0.4em] text-white/70">
                      {formatNumber(collection.productCount)} styles
                    </p>
                  ) : null}
                </div>
              </Link>
            );
          })}

          {rootCollections.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 p-12 text-center text-slate-500">
              No collections available yet. Check back soon for fresh drops.
            </div>
          ) : null}
        </div>

        {nestedCollections.length ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-500">
                Sub-collections
              </h3>
              <span className="text-xs uppercase tracking-[0.4em] text-slate-400">
                {formatNumber(nestedCollections.length)} collections
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {nestedCollections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.slug}`}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                        {collection.parent?.name ?? "Collection"}
                      </p>
                      <h4 className="text-lg font-semibold text-slate-900">{collection.name}</h4>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1" />
                  </div>
                  {collection.description ? (
                    <p className="text-sm text-slate-500 line-clamp-2">{collection.description}</p>
                  ) : null}
                  {typeof collection.productCount === "number" ? (
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                      {formatNumber(collection.productCount)} styles
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default CollectionsLandingPage;
