import Link from "next/link";
import { getFeaturedProducts, getStorefrontCollections } from "@/lib/storefront/catalog";
import StorefrontProductCard from "@/components/storefront/product-card";
import { Button } from "@/components/ui/button";

export const revalidate = 60;

type ProductsPageProps = {
	searchParams: Promise<{
		search?: string;
		sort?: string;
		onSale?: string;
		gender?: string;
	}>;
};

const ProductsPage = async ({ searchParams }: ProductsPageProps) => {
	const params = await searchParams;
	const search = params.search ?? "";
	const sort = params.sort ?? "";
	const onSale = params.onSale === "true";
	const gender = params.gender ?? "";

	const [products, collections] = await Promise.all([
		getFeaturedProducts({ limit: 24 }),
		getStorefrontCollections(),
	]);

	// Filter products based on search and parameters
	let filteredProducts = products;

	if (search.trim().length > 0) {
		const searchLower = search.toLowerCase();
		filteredProducts = filteredProducts.filter(
			(p) =>
				p.name.toLowerCase().includes(searchLower) ||
				p.description?.toLowerCase().includes(searchLower) ||
				p.collections.some((c) => c.name.toLowerCase().includes(searchLower))
		);
	}

	if (onSale) {
		filteredProducts = filteredProducts.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price);
	}

	if (sort === "newest") {
		filteredProducts = [...filteredProducts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	}

	if (gender.trim().length > 0) {
		const genderLower = gender.toLowerCase();
		filteredProducts = filteredProducts.filter((p) =>
			p.collections.some((c) => c.name.toLowerCase().includes(genderLower))
		);
	}

	const hasProducts = filteredProducts.length > 0;
	const featuredCollections = collections.filter((collection) => !collection.parent).slice(0, 6);

	return (
		<div className="flex min-h-screen flex-col bg-white">
			<section className="relative overflow-hidden bg-linear-to-br from-slate-900 via-slate-800 to-black py-24 text-white">
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.15),transparent_55%)]" />
				<div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6">
					<div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
						<div className="max-w-2xl space-y-4">
							<p className="text-xs uppercase tracking-[0.4em] text-slate-300">The Hub Edit</p>
							<h1 className="text-3xl font-semibold text-white md:text-5xl">Discover pieces crafted for the spotlight</h1>
							<p className="text-base text-slate-200 md:text-lg">
								Statement silhouettes, modern essentials, and runway-inspired staples designed to move with
								you. Explore curated drops refreshed weekly.
							</p>
						</div>
						<div className="flex gap-3">
							<Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white hover:text-slate-900">
								<Link href="/collections">Shop by collection</Link>
							</Button>
							<Button asChild className="bg-white text-slate-900 hover:bg-slate-100">
								<Link href="#catalog">Browse catalog</Link>
							</Button>
						</div>
					</div>

					{featuredCollections.length ? (
						<div className="flex flex-wrap items-center gap-3">
							{featuredCollections.map((collection) => (
								<Link
									key={collection.id}
									href={`/collections/${collection.slug}`}
									className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:border-white hover:bg-white hover:text-slate-900"
								>
									{collection.name}
								</Link>
							))}
						</div>
					) : null}
				</div>
			</section>

			<section id="catalog" className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
				{/* Active filters display */}
				{(search || sort || onSale || gender) && (
					<div className="mb-8 flex items-center justify-between">
						<div className="space-y-2">
							<p className="text-sm font-medium text-slate-700">Active Filters:</p>
							<div className="flex flex-wrap gap-2">
								{search && (
									<div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
										<span>Search: &ldquo;{search}&rdquo;</span>
										<Link href="/products" className="ml-1 font-bold hover:text-slate-900">×</Link>
									</div>
								)}
								{sort === "newest" && (
									<div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
										<span>Newest</span>
										<Link href="/products" className="ml-1 font-bold hover:text-slate-900">×</Link>
									</div>
								)}
								{onSale && (
									<div className="flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-sm text-red-700">
										<span>On Sale</span>
										<Link href="/products" className="ml-1 font-bold hover:text-red-900">×</Link>
									</div>
								)}
								{gender && (
									<div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
										<span className="capitalize">{gender}&rsquo;s Collection</span>
										<Link href="/products" className="ml-1 font-bold hover:text-slate-900">×</Link>
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{hasProducts ? (
					<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
						{filteredProducts.map((product) => (
							<StorefrontProductCard key={product.id} product={product} />
						))}
					</div>
				) : (
					<div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-center">
						<h2 className="text-xl font-semibold text-slate-900">
							{search ? "No products found" : "No products yet"}
						</h2>
						<p className="mt-2 max-w-md text-sm text-slate-500">
							{search
								? `We couldn&apos;t find any products matching &ldquo;${search}&rdquo;. Try a different search term.`
								: "All collections are currently being curated. Check back soon for the latest drops from Hub Fashiion."}
						</p>
						{(search || sort || onSale || gender) && (
							<Link href="/products" className="mt-6 text-blue-600 hover:underline">
								Clear filters
							</Link>
						)}
					</div>
				)}
			</section>
		</div>
	);
};

export default ProductsPage;
