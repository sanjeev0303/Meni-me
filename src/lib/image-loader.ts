import type { ImageLoaderProps } from "next/image";

const isAbsoluteUrl = (src: string) => /^https?:\/\//.test(src);

const DEFAULT_QUALITY = 75;

const applyWidthAndQuality = (url: URL, width?: number, quality?: number) => {
  if (width) {
    url.searchParams.set("w", width.toString());
  }

  if (quality) {
    url.searchParams.set("q", quality.toString());
  } else if (!url.searchParams.has("q")) {
    url.searchParams.set("q", DEFAULT_QUALITY.toString());
  }
};

export default function imageLoader({ src, width, quality }: ImageLoaderProps) {
  if (!isAbsoluteUrl(src)) {
    const url = new URL(src, "http://localhost");
    applyWidthAndQuality(url, width, quality);
    return `${url.pathname}${url.search}`;
  }

  try {
    const url = new URL(src);

    if (!url.hostname.endsWith("imagekit.io")) {
      applyWidthAndQuality(url, width, quality);

      return url.toString();
    }

    const transforms: string[] = [];

    if (width) {
      transforms.push(`w-${width}`);
    }

    if (quality) {
      transforms.push(`q-${quality}`);
    }

    if (transforms.length > 0) {
      const existing = url.searchParams.get("tr");
      const transformValue = transforms.join(",");
      url.searchParams.set("tr", existing ? `${existing}:${transformValue}` : transformValue);
    }

    return url.toString();
  } catch (error) {
    console.warn("[image-loader] Failed to construct URL for src", src, error);
    return src;
  }
}
