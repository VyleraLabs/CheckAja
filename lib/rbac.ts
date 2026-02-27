import { Role } from "@prisma/client";
import { auth } from "@/auth";

/**
 * Gets the current authenticated user from the session
 */
export const getCurrentUser = async () => {
    const session = await auth();
    return session?.user;
};

/**
 * Checks if a role is SUPERADMIN (Holding Company level)
 */
export const isSuperAdmin = (role?: Role) => {
    return role === Role.SUPERADMIN;
};

/**
 * Checks if a role is at least ADMIN (Business Unit level)
 * Note: SUPERADMIN naturally inherits ADMIN privileges
 */
export const isAdmin = (role?: Role) => {
    return role === Role.ADMIN || role === Role.SUPERADMIN;
};

/**
 * Checks if a role is at least BRANCH_ADMIN (Local Branch level)
 * Note: Both ADMIN and SUPERADMIN inherit these privileges
 */
export const isBranchAdmin = (role?: Role) => {
    return role === Role.BRANCH_ADMIN || role === Role.ADMIN || role === Role.SUPERADMIN;
};

/**
 * Server-side wrapper: Ensures current session has SUPERADMIN access
 * Throws an error if unauthorized.
 */
export const requireSuperAdmin = async () => {
    const user = await getCurrentUser();
    if (!user || !isSuperAdmin(user.role)) {
        throw new Error("Unauthorized: SuperAdmin access required");
    }
    return user;
};

/**
 * Server-side wrapper: Ensures current session has at least ADMIN access
 * Throws an error if unauthorized.
 */
export const requireAdmin = async () => {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
        throw new Error("Unauthorized: Admin access required");
    }
    return user;
};

/**
 * Server-side wrapper: Ensures current session has at least BRANCH_ADMIN access
 * Throws an error if unauthorized.
 */
export const requireBranchAdmin = async () => {
    const user = await getCurrentUser();
    if (!user || !isBranchAdmin(user.role)) {
        throw new Error("Unauthorized: BranchAdmin access required");
    }
    return user;
};
