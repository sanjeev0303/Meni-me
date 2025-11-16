import "dotenv/config";
import { defineConfig } from "prisma/config";

const sanitizeDatabaseUrl = (rawUrl?: string) => {
  if (!rawUrl) {
    return "postgresql://dummy:dummy@localhost:5432/dummy";
  }

  try {
    const parsed = new URL(rawUrl);

    if (parsed.searchParams.has("channel_binding")) {
      parsed.searchParams.delete("channel_binding");
      return parsed.toString();
    }

    return rawUrl;
  } catch {
    return rawUrl;
  }
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: sanitizeDatabaseUrl(process.env.DATABASE_URL),
  },
});
