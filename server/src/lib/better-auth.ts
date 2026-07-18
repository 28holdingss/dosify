import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { expo } from '@better-auth/expo';
import { prisma } from './prisma.js';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? `http://localhost:${process.env.PORT ?? 3001}`,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      onboardingCompleted: {
        type: 'boolean',
        defaultValue: false,
        input: false,
      },
    },
  },
  plugins: [expo()],
  trustedOrigins: [
    'dosify://',
    'dosify://*',
    // Expo Go / dev-client URLs during development
    'exp://',
    'exp://**',
    // Web dev server
    'http://localhost:8081',
    ...(process.env.WEB_APP_URL ? [process.env.WEB_APP_URL] : []),
  ],
  advanced: {
    // Web app and API run on different origins (8081 vs 3001), so session
    // cookies must be cross-site. Chrome treats localhost as a secure context.
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: true,
    },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
