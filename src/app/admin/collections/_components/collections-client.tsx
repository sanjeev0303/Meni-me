"use client";

import { useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ImageKitUpload, { type ImageKitUploadValue } from "@/components/ui/imagekit-upload";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { Plus, RefreshCcw, Trash2 } from "lucide-react";

const imageItemSchema = z.object({
  url: z.string().url(),
  fileId: z.string().min(1),
  name: z.string().optional(),
  size: z.number().optional(),
  thumbnailUrl: z.string().optional().nullable(),
});

const collectionFormSchema = z.object({
  name: z.string().min(1, "Required"),
  slug: z
    .string()
    .min(1, "Required")
    .regex(/^[a-z0-9-_]+$/, "Lowercase, numbers, hyphens and underscores only"),
  description: z.string().optional(),
  parentId: z.string().optional(),
  isPublished: z.boolean(),
  image: imageItemSchema.nullable().optional(),
});

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return res.json();
};

type CollectionImageResponse = {
  url: string;
  fileId: string;
  name?: string | null;
  thumbnailUrl?: string | null;
};

type CollectionResponse = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  parent: { id: string; name: string } | null;
  isPublished: boolean;
  imageUrl: string | null;
  imageFileId: string | null;
  image: CollectionImageResponse | null;
  createdAt: string;
};

const mapCollectionToForm = (collection: CollectionResponse) => ({
  name: collection.name,
  slug: collection.slug,
  description: collection.description ?? "",
  parentId: collection.parentId ?? "",
  isPublished: collection.isPublished,
  image:
    collection.image?.url && collection.image?.fileId
      ? {
          url: collection.image.url,
          fileId: collection.image.fileId,
          name: collection.image.name ?? undefined,
          thumbnailUrl: collection.image.thumbnailUrl ?? undefined,
        }
      : collection.imageUrl && collection.imageFileId
        ? {
            url: collection.imageUrl,
            fileId: collection.imageFileId,
          }
        : null,
});

type CollectionFormValues = z.infer<typeof collectionFormSchema>;

const defaultValues: CollectionFormValues = {
  name: "",
  slug: "",
  description: "",
  parentId: "",
  isPublished: true,
  image: null,
};

type CollectionsClientProps = {
  initialCollections?: CollectionResponse[];
};

const CollectionsClient = ({ initialCollections }: CollectionsClientProps) => {
  const queryClient = useQueryClient();
  const [selectedCollection, setSelectedCollection] = useState<CollectionResponse | null>(null);

  const normalizeSlugInput = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/[-_]+/g, (match) => match[0])
      .replace(/^[-_]|[-_]$|\s+/g, "");

  const { data: collections = [], isFetching: collectionsLoading } = useQuery({
    queryKey: ["admin", "collections"],
    queryFn: () => fetcher<CollectionResponse[]>("/api/admin/collections"),
    initialData: initialCollections,
  });

  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CollectionFormValues) => {
      const { image, ...rest } = payload;

      const response = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rest,
          description: rest.description?.trim() ? rest.description.trim() : null,
          parentId: rest.parentId ? rest.parentId : null,
          image: image ? { url: image.url, fileId: image.fileId } : null,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: "Unable to create collection" }));
        throw new Error(body.message ?? "Unable to create collection");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "collections"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: CollectionFormValues) => {
      if (!selectedCollection) return;

      const { image, ...rest } = payload;

      const response = await fetch(`/api/admin/collections/${selectedCollection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rest,
          description: rest.description?.trim() ? rest.description.trim() : null,
          parentId: rest.parentId ? rest.parentId : null,
          image: image ? { url: image.url, fileId: image.fileId } : null,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: "Unable to update collection" }));
        throw new Error(body.message ?? "Unable to update collection");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setSelectedCollection(data);
      queryClient.invalidateQueries({ queryKey: ["admin", "collections"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCollection) return;

      const response = await fetch(`/api/admin/collections/${selectedCollection.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: "Unable to delete collection" }));
        throw new Error(body.message ?? "Unable to delete collection");
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "collections"] });
      resetForm();
    },
  });

  function resetForm() {
    form.reset(defaultValues);
    setSelectedCollection(null);
    createMutation.reset();
    updateMutation.reset();
    deleteMutation.reset();
  }

  const mutationError =
    (createMutation.error as Error | undefined) ||
    (updateMutation.error as Error | undefined) ||
    (deleteMutation.error as Error | undefined);

  const enrichedCollections = useMemo(() => {
    return collections.map((collection) => ({
      ...collection,
      childCount: collections.filter((item) => item.parentId === collection.id).length,
    }));
  }, [collections]);

  const onSubmit: SubmitHandler<CollectionFormValues> = (values) => {
    if (selectedCollection) {
      return updateMutation.mutate(values);
    }

    return createMutation.mutate(values);
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[1.3fr_1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Collection library</h2>
            <p className="text-sm text-slate-500">
              {collectionsLoading ? "Loading collections…" : `${formatNumber(collections.length)} total groups`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin", "collections"] })}>
              <RefreshCcw className="mr-1 h-4 w-4" /> Refresh
            </Button>
            <Button size="sm" onClick={resetForm}>
              <Plus className="mr-1 h-4 w-4" /> New collection
            </Button>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Collection</th>
                <th className="px-4 py-3">Parent</th>
                <th className="px-4 py-3">Children</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrichedCollections.map((collection) => {
                const isSelected = selectedCollection?.id === collection.id;
                return (
                  <tr
                    key={collection.id}
                    className={cn("cursor-pointer transition hover:bg-slate-50", isSelected ? "bg-slate-900/5" : "")}
                    onClick={() => {
                      setSelectedCollection(collection);
                      form.reset(mapCollectionToForm(collection));
                    }}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{collection.name}</p>
                      <p className="text-xs text-slate-500">/{collection.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {collection.parent ? collection.parent.name : "Root"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{collection.childCount}</td>
                    <td className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      {collection.isPublished ? "Published" : "Draft"}
                    </td>
                  </tr>
                );
              })}
              {enrichedCollections.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                    {collectionsLoading ? "Loading collections…" : "No collections yet. Create your first grouping."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {selectedCollection ? "Update collection" : "Create collection"}
              </h2>
              <p className="text-sm text-slate-500">Organize products by publishing curated collections.</p>
            </div>
            {selectedCollection ? (
              <Button
                variant="destructive"
                size="icon"
                className="rounded-full"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
                aria-label="Delete collection"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          <Form {...form}>
            <form className="mt-6 space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              {mutationError ? (
                <p className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-600">{mutationError.message}</p>
              ) : null}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Summer essentials" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="summer-essentials"
                        {...field}
                        onChange={(event) => field.onChange(normalizeSlugInput(event.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Used in collection URLs.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Tell buyers what lives here." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collection image</FormLabel>
                    <FormDescription>Appears on storefront collection headers and promotions.</FormDescription>
                    <FormControl>
                      <ImageKitUpload
                        value={field.value ? [field.value as ImageKitUploadValue] : []}
                        onChange={(next) => field.onChange(next[0] ?? null)}
                        multiple={false}
                        maxFiles={1}
                        folder="/collections"
                        emptyHint="Use high-resolution imagery for best results"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent collection</FormLabel>
                    <FormControl>
                      <select
                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value)}
                      >
                        <option value="">No parent</option>
                        {collections
                          .filter((option) => option.id !== selectedCollection?.id)
                          .map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                      </select>
                    </FormControl>
                    <FormDescription>Nest collections for navigational clarity.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                    <div>
                      <FormLabel className="text-sm font-semibold">Publish collection</FormLabel>
                      <FormDescription>Draft collections stay hidden from shoppers.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm} disabled={createMutation.isPending || updateMutation.isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {selectedCollection ? "Save changes" : "Create collection"}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {selectedCollection ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Insights</h3>
            <dl className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <dt>Created</dt>
                <dd>{new Date(selectedCollection.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Status</dt>
                <dd>{selectedCollection.isPublished ? "Published" : "Draft"}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CollectionsClient;
export type { CollectionResponse };
