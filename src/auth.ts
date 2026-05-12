import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

declare module "next-auth" {
  interface Session {
    user: {
      handle: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        // GitHub profile has `login` as the username
        token.handle = (profile as { login: string }).login;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.handle = token.handle as string;
      return session;
    },
  },
  pages: {
    signIn: "/join",
  },
});
