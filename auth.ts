import NextAuth, { type DefaultSession } from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaClient, Role } from "@prisma/client"

const prisma = new PrismaClient()

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: Role
            businessUnitId: string | null
            locationId: string | null
        } & DefaultSession["user"]
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async signIn({ user }) {
            if (!user.email) return false;

            // Whitelist approach: Check if user exists in the database
            const existingUser = await prisma.user.findUnique({
                where: { email: user.email },
            });

            // If user doesn't exist, reject sign in
            if (!existingUser) {
                return false;
            }

            return true;
        },
        async jwt({ token, user }) {
            // On initial sign in
            if (user?.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: user.email }
                });

                if (dbUser) {
                    token.id = dbUser.id;
                    token.role = dbUser.role;
                    token.businessUnitId = dbUser.businessUnitId;
                    token.locationId = dbUser.locationId;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as Role;
                session.user.businessUnitId = token.businessUnitId as string | null;
                session.user.locationId = token.locationId as string | null;
            }
            return session;
        }
    },
    pages: {
        signIn: "/login",
        error: "/unauthorized", // Redirect here if signIn returns false
    }
})
