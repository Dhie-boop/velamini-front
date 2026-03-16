import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prismaVelamini: PrismaClient | undefined };

function isPrismaAccelerateUrl(url: string | undefined): url is string {
  return Boolean(url && (url.startsWith("prisma://") || url.startsWith("prisma+postgres://")));
}

function isPostgresUrl(url: string | undefined): url is string {
  return Boolean(url && (url.startsWith("postgresql://") || url.startsWith("postgres://")));
}

function normalizePostgresConnectionString(url: string): string {
  try {
    const parsedUrl = new URL(url);
    const sslMode = parsedUrl.searchParams.get("sslmode");
    const usesLibpqCompat = parsedUrl.searchParams.get("uselibpqcompat") === "true";

    if (!usesLibpqCompat && ["prefer", "require", "verify-ca"].includes(sslMode ?? "")) {
      parsedUrl.searchParams.set("sslmode", "verify-full");
      return parsedUrl.toString();
    }
  } catch {
    // If URL parsing fails, use the original value and let pg handle validation.
  }

  return url;
}

function makePrisma(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  const accelerateUrl = process.env.PRISMA_ACCELERATE_URL ?? databaseUrl;
  const shouldUseAccelerate = isPrismaAccelerateUrl(accelerateUrl);

  if (shouldUseAccelerate) {
    const client = new PrismaClient({
      log: ["error", "warn"],
      accelerateUrl,
    });

    return client.$extends(withAccelerate()) as unknown as PrismaClient;
  }

  if (isPostgresUrl(databaseUrl)) {
    const pool = new Pool({ connectionString: normalizePostgresConnectionString(databaseUrl) });
    const adapter = new PrismaPg(pool);

    return new PrismaClient({
      log: ["error", "warn"],
      adapter,
    });
  }

  const client = new PrismaClient({
    log: ["error", "warn"],
  });

  return client;
}

export const prisma = globalForPrisma.prismaVelamini ?? makePrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaVelamini = prisma as typeof globalForPrisma.prismaVelamini;
// Re-export for type safety
export * from "@prisma/client";
