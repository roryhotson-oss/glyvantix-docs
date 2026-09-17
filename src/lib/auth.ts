import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

function canonicalUrl() {
  return process.env.NEXTAUTH_URL?.replace(/\/$/, '') || '';
}

export const authOptions: NextAuthOptions = {
  providers:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : [],
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user }) {
      return Boolean(user.email);
    },
    // When a canonical NEXTAUTH_URL is configured, normalise the post-auth
    // redirect onto that origin. This keeps Google OAuth callbacks consistent
    // once docs.glyvantix.co.uk becomes the live domain and avoids redirect
    // mismatches between the *.vercel.app preview and the custom domain.
    async redirect({ url }) {
      const base = canonicalUrl();
      if (!base) return url;
      const target = url.startsWith('/') ? `${base}${url}` : url;
      try {
        const parsed = new URL(target);
        return `${base}${parsed.pathname}${parsed.search}`;
      } catch {
        return base;
      }
    },
  },
};