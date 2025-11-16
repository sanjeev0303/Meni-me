import type { Metadata } from "next";
import { getInternalApiUrl } from "@/lib/internal-api";
import CollectionsClient, { type CollectionResponse } from "./_components/collections-client";

export const metadata: Metadata = {
  title: "Admin • Collections",
  description: "Organize products into curated collections and sections.",
};

export const dynamic = "force-dynamic";

async function getCollections(): Promise<CollectionResponse[]> {
  try {
    const res = await fetch(getInternalApiUrl("/api/admin/collections"), {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) {
      return [];
    }

    return res.json();
  } catch (error) {
    console.error("[ADMIN_COLLECTIONS_PAGE]", error);
    return [];
  }
}

const CollectionsPage = async () => {
  const collections = await getCollections();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Collections</h1>
        <p className="text-sm text-slate-500">Curate collection groups to guide shoppers through your store.</p>
      </div>
      <CollectionsClient initialCollections={collections} />
    </div>
  );
};

export default CollectionsPage;
