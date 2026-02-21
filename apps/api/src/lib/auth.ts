import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { env } from "@/config/env";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.FRONTEND_URL],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Non-blocking P1
    sendResetPassword: async ({ user, url }) => {
      // TODO: integrate email provider — log to console in dev
      console.log(`Password reset link for ${user.email}: ${url}`);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60, // 1h
    sendVerificationEmail: async ({ user, url }) => {
      // TODO: integrate email provider — log to console in dev
      console.log(`Verification link for ${user.email}: ${url}`);
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Refresh after 1 day
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  user: {
    additionalFields: {
      username: { type: "string", required: false },
      role: { type: "string", defaultValue: "user" },
      onboardingCompleted: { type: "boolean", defaultValue: false },
    },
  },
});

export type Auth = typeof auth;
