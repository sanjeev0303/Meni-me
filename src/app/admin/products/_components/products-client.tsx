"use client";

import { useMemo, useState } from "react";
import { useForm, type SubmitHandler, type Resolver } from "react-hook-form";
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
import { formatCurrency } from "@/lib/format";
import { Plus, RefreshCcw, Trash2, X } from "lucide-react";

const mediaItemSchema = z.object({
  url: z.string().url(),
  fileId: z.string().min(1),
  name: z.string().optional(),
  size: z.number().optional(),
  thumbnailUrl: z.string().optional().nullable(),
});

const productFormSchema = z.object({
  name: z.string().min(1, "Required"),
  slug: z
    .string()
    .min(1, "Required")
    .regex(/^[a-z0-9-]+$/, "Lowercase, numbers and hyphen only"),
  description: z.string().optional(),
  sku: z.string().optional(),
  price: z.coerce.number().min(0, "Invalid"),
  compareAtPrice: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0),
  media: z.array(mediaItemSchema).default([]),
  isPublished: z.boolean().default(true),
  collectionIds: z.array(z.string()).default([]),
  sizeOptions: z.array(z.string().min(1)).default([]),
  colorOptions: z.array(z.string().min(1)).default([]),
});

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return res.json();
};

type ProductMediaResponse = {
  url: string;
  fileId: string;
  name?: string | null;
  thumbnailUrl?: string | null;
};

type ProductResponse = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  media: ProductMediaResponse[];
  mediaUrls: string[];
  mediaFileIds?: string[];
  isPublished: boolean;
  collections: { id: string; name: string; slug: string }[];
  sizeOptions: string[];
  colorOptions: string[];
  createdAt: string;
};

type CollectionResponse = {
  id: string;
  name: string;
  slug: string;
};

export type { ProductResponse, CollectionResponse };

const mapProductToForm = (product: ProductResponse) => {
  const media: ImageKitUploadValue[] = product.media?.length
    ? product.media.map((item) => ({
        url: item.url,
        fileId: item.fileId,
        name: item.name ?? undefined,
        thumbnailUrl: item.thumbnailUrl ?? undefined,
      }))
    : product.mediaUrls
        .map((url, index) => {
          const fileId = product.mediaFileIds?.[index];
          if (!fileId) return null;
          return { url, fileId } satisfies ImageKitUploadValue;
        })
        .filter((item): item is ImageKitUploadValue => item !== null);

  return {
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    sku: product.sku ?? "",
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? undefined,
    stock: product.stock,
    media,
    isPublished: product.isPublished,
    collectionIds: product.collections.map((collection) => collection.id),
    sizeOptions: product.sizeOptions ?? [],
    colorOptions: product.colorOptions ?? [],
  } satisfies ProductFormValues;
};

type ProductFormValues = z.infer<typeof productFormSchema>;

const defaultValues: ProductFormValues = {
  name: "",
  slug: "",
  description: "",
  sku: "",
  price: 0,
  compareAtPrice: undefined,
  stock: 0,
  media: [],
  isPublished: true,
  collectionIds: [],
  sizeOptions: [],
  colorOptions: [],
};

type ProductsClientProps = {
  initialProducts?: ProductResponse[];
  initialCollections?: CollectionResponse[];
};

const ProductsClient = ({ initialProducts, initialCollections }: ProductsClientProps) => {
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);
  const [sizeDraft, setSizeDraft] = useState("");
  const [colorDraft, setColorDraft] = useState("");

  const { data: products = [], isFetching: productsLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => fetcher<ProductResponse[]>("/api/admin/products"),
    initialData: initialProducts,
  });

  const { data: collections = [], isFetching: collectionLoading } = useQuery({
    queryKey: ["admin", "collections"],
    queryFn: () => fetcher<CollectionResponse[]>("/api/admin/collections"),
    initialData: initialCollections,
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as Resolver<ProductFormValues>,
    defaultValues,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: ProductFormValues) => {
      const mediaPayload = (payload.media ?? []).map((item) => ({
        url: item.url,
        fileId: item.fileId,
      }));

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          media: mediaPayload,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: "Unable to create product" }));
        throw new Error(body.message ?? "Unable to create product");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: ProductFormValues) => {
      if (!selectedProduct) return;

      const mediaPayload = (payload.media ?? []).map((item) => ({
        url: item.url,
        fileId: item.fileId,
      }));

      const response = await fetch(`/api/admin/products/${selectedProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          media: mediaPayload,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: "Unable to update product" }));
        throw new Error(body.message ?? "Unable to update product");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setSelectedProduct(data);
      form.reset(mapProductToForm(data));
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct) return;

      const response = await fetch(`/api/admin/products/${selectedProduct.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: "Unable to delete product" }));
        throw new Error(body.message ?? "Unable to delete product");
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      resetForm();
    },
  });

  function resetForm() {
    form.reset(defaultValues);
    setSelectedProduct(null);
    setSizeDraft("");
    setColorDraft("");
    createMutation.reset();
    updateMutation.reset();
    deleteMutation.reset();
  }

  const isSubmitting =
    form.formState.isSubmitting || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const mutationError =
    (createMutation.error as Error | undefined) ||
    (updateMutation.error as Error | undefined) ||
    (deleteMutation.error as Error | undefined);

  const productRows = useMemo(() => {
    return products.map((product) => ({
      product,
      collectionsLabel: product.collections.map((collection) => collection.name).join(", "),
    }));
  }, [products]);

  const onSubmit: SubmitHandler<ProductFormValues> = (values) => {
    if (selectedProduct) {
      return updateMutation.mutate(values);
    }

    return createMutation.mutate(values);
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[1.4fr_1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Product catalog</h2>
            <p className="text-sm text-slate-500">{productRows.length} products live in store</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin", "products"] })}>
              <RefreshCcw className="mr-1 h-4 w-4" /> Refresh
            </Button>
            <Button size="sm" onClick={resetForm}>
              <Plus className="mr-1 h-4 w-4" /> New product
            </Button>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Inventory</th>
                <th className="px-4 py-3">Collections</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productRows.map(({ product, collectionsLabel }) => {
                const isSelected = selectedProduct?.id === product.id;
                return (
                  <tr
                    key={product.id}
                    className={cn(
                      "cursor-pointer transition hover:bg-slate-50",
                      isSelected ? "bg-slate-900/5" : "",
                    )}
                    onClick={() => {
                      setSelectedProduct(product);
                      setSizeDraft("");
                      setColorDraft("");
                      form.reset(mapProductToForm(product));
                    }}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500">SKU {product.sku ?? "N/A"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(product.price)}</p>
                      {product.compareAtPrice ? (
                        <p className="text-xs text-rose-500">Was {formatCurrency(product.compareAtPrice)}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{product.stock} in stock</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{collectionsLabel || "—"}</td>
                    <td className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      {product.isPublished ? "Published" : "Draft"}
                    </td>
                  </tr>
                );
              })}
              {productRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    {productsLoading ? "Loading products..." : "No products available. Start by creating one."}
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
                {selectedProduct ? "Update product" : "Create product"}
              </h2>
              <p className="text-sm text-slate-500">All fields sync instantly with your storefront.</p>
            </div>
            {selectedProduct ? (
              <Button
                variant="destructive"
                size="icon"
                className="rounded-full"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
                aria-label="Delete product"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          <Form {...form}>
            <form className="mt-6 space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              {mutationError ? (
                <p className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-600">
                  {mutationError.message}
                </p>
              ) : null}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Essential denim jacket" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="essential-denim-jacket" {...field} />
                      </FormControl>
                      <FormDescription>Used in product URLs.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="SKU-01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="compareAtPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compare at price</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available units</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
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
                      <Textarea rows={4} placeholder="Fabric, fit, and styling details" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="media"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product images</FormLabel>
                    <FormDescription>Upload up to 8 images. The first image appears as the primary thumbnail.</FormDescription>
                    <FormControl>
                      <ImageKitUpload
                        value={(field.value ?? []) as ImageKitUploadValue[]}
                        onChange={(next) => field.onChange(next)}
                        maxFiles={8}
                        folder="/products"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sizeOptions"
                render={({ field }) => {
                  const values = field.value ?? [];
                  const addSize = () => {
                    const value = sizeDraft.trim();
                    if (!value) return;
                    if (values.some((option) => option.toLowerCase() === value.toLowerCase())) {
                      setSizeDraft("");
                      return;
                    }
                    field.onChange([...values, value]);
                    setSizeDraft("");
                  };

                  return (
                    <FormItem>
                      <FormLabel>Available sizes</FormLabel>
                      <FormDescription>Provide size options shoppers can pick from (e.g. XS, S, M, L).</FormDescription>
                      <div className="flex gap-2">
                        <Input
                          value={sizeDraft}
                          placeholder="Add size"
                          onChange={(event) => setSizeDraft(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              addSize();
                            }
                          }}
                        />
                        <Button type="button" variant="outline" onClick={addSize}>
                          Add
                        </Button>
                      </div>
                      {values.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {values.map((option) => (
                            <span
                              key={option}
                              className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                            >
                              {option}
                              <button
                                type="button"
                                className="text-slate-500 transition hover:text-slate-700"
                                onClick={() => field.onChange(values.filter((item) => item !== option))}
                                aria-label={`Remove size ${option}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="colorOptions"
                render={({ field }) => {
                  const values = field.value ?? [];
                  const addColor = () => {
                    const value = colorDraft.trim();
                    if (!value) return;
                    if (values.some((option) => option.toLowerCase() === value.toLowerCase())) {
                      setColorDraft("");
                      return;
                    }
                    field.onChange([...values, value]);
                    setColorDraft("");
                  };

                  return (
                    <FormItem>
                      <FormLabel>Available colors</FormLabel>
                      <FormDescription>List color variants available for this product.</FormDescription>
                      <div className="flex gap-2">
                        <Input
                          value={colorDraft}
                          placeholder="Add color"
                          onChange={(event) => setColorDraft(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              addColor();
                            }
                          }}
                        />
                        <Button type="button" variant="outline" onClick={addColor}>
                          Add
                        </Button>
                      </div>
                      {values.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {values.map((option) => (
                            <span
                              key={option}
                              className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                            >
                              {option}
                              <button
                                type="button"
                                className="text-slate-500 transition hover:text-slate-700"
                                onClick={() => field.onChange(values.filter((item) => item !== option))}
                                aria-label={`Remove color ${option}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="collectionIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collections</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {collectionLoading && collections.length === 0 ? (
                        <p className="text-sm text-slate-500">Loading collections…</p>
                      ) : null}
                      {collections.map((collection) => {
                        const checked = field.value?.includes(collection.id) ?? false;
                        return (
                          <label
                            key={collection.id}
                            className={cn(
                              "flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm transition",
                              checked ? "bg-slate-900 text-white" : "hover:bg-slate-100",
                            )}
                          >
                            <span>{collection.name}</span>
                            <input
                              type="checkbox"
                              className="size-4 accent-slate-900"
                              checked={checked}
                              onChange={(event) => {
                                if (event.target.checked) {
                                  field.onChange([...(field.value ?? []), collection.id]);
                                } else {
                                  field.onChange(field.value?.filter((id) => id !== collection.id));
                                }
                              }}
                            />
                          </label>
                        );
                      })}
                      {collections.length === 0 && !collectionLoading ? (
                        <p className="col-span-2 text-sm text-slate-500">
                          No collections yet. <span className="underline">Create one in collections tab.</span>
                        </p>
                      ) : null}
                    </div>
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
                      <FormLabel className="text-sm font-semibold">Publish on storefront</FormLabel>
                      <FormDescription>Toggle availability for shoppers.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {selectedProduct ? "Save changes" : "Create product"}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {selectedProduct ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Snapshots</h3>
            <dl className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <dt>Created</dt>
                <dd>{new Date(selectedProduct.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Media assets</dt>
                <dd>{selectedProduct.media?.length ?? selectedProduct.mediaUrls.length}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProductsClient;
