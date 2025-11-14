import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";

const baseURL =
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

type MinimalGoogleProfile = {
    name?: string | null;
    given_name?: string | null;
    family_name?: string | null;
    email?: string | null;
    picture?: string | null;
};

const normalizeGoogleProfile = (profile: MinimalGoogleProfile) => {
    const toCleanString = (value: unknown) =>
        typeof value === "string" && value.trim().length > 0
            ? value.trim()
            : undefined;

    const email = toCleanString(profile.email);
    const givenName = toCleanString(profile.given_name);
    const familyName = toCleanString(profile.family_name);
    const fullName =
        toCleanString(profile.name) ??
        [givenName, familyName].filter(Boolean).join(" ") ??
        (email ? email.split("@")[0] : undefined);

    const image = toCleanString(profile.picture);

    return {
        name: fullName && fullName.length > 0 ? fullName : "Google User",
        ...(image ? { image } : {}),
    };
};

const googleProvider =
    googleClientId && googleClientSecret
        ? {
              clientId: googleClientId,
              clientSecret: googleClientSecret,
              scope: ["openid", "email", "profile"],
              mapProfileToUser: normalizeGoogleProfile,
          }
        : undefined;

if (!googleProvider && process.env.NODE_ENV !== "production") {
    console.warn(
        "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable it.",
    );
}

export const auth = betterAuth({
    baseURL,
    secret:
        process.env.BETTER_AUTH_SECRET ??
        process.env.AUTH_SECRET ??
        "insecure-development-secret",
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    ...(googleProvider
        ? {
              socialProviders: {
                  google: googleProvider,
              },
          }
        : {}),
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: true,
                defaultValue: "CUSTOMER",
            },
        },
    },
    plugins: [nextCookies()],
});
