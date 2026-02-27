import { PrismaClient, Role } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

/**
 * Securely fetches locations based on the current user's role and permissions.
 * This is intended to be called from Server Components.
 */
export async function getAuthorizedLocations() {
    const session = await auth();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const { role, businessUnitId, locationId } = session.user;

    // SUPERADMIN: Can see everything
    if (role === Role.SUPERADMIN) {
        return prisma.location.findMany({
            include: {
                businessUnit: {
                    select: { name: true },
                },
            },
            orderBy: { name: "asc" },
        });
    }

    // ADMIN: Restricted to their Business Unit
    if (role === Role.ADMIN) {
        if (!businessUnitId) return [];
        return prisma.location.findMany({
            where: { businessUnitId },
            include: {
                businessUnit: {
                    select: { name: true },
                },
            },
            orderBy: { name: "asc" },
        });
    }

    // BRANCH_ADMIN: Restricted to their specific Location
    if (role === Role.BRANCH_ADMIN) {
        if (!locationId) return [];
        return prisma.location.findMany({
            where: { id: locationId },
            include: {
                businessUnit: {
                    select: { name: true },
                },
            },
        });
    }

    return [];
}

/**
 * Fetches a single location securely.
 * Validates that the user has permission to view this specific location.
 */
export async function getAuthorizedLocation(id: string) {
    const session = await auth();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const { role, businessUnitId, locationId: userLocationId } = session.user;

    const location = await prisma.location.findUnique({
        where: { id },
        include: {
            businessUnit: {
                select: { name: true },
            },
        },
    });

    if (!location) return null;

    // Role-based access check
    if (role === Role.SUPERADMIN) return location;

    if (role === Role.ADMIN && location.businessUnitId === businessUnitId) {
        return location;
    }

    if (role === Role.BRANCH_ADMIN && location.id === userLocationId) {
        return location;
    }

    return null; // Forbidden
}

/**
 * Securely fetches Audit Logs based on role.
 */
export async function getAuthorizedAuditLogs() {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const { role, businessUnitId, locationId } = session.user;

    const where: any = {};

    if (role === Role.ADMIN) {
        where.location = { businessUnitId };
    } else if (role === Role.BRANCH_ADMIN) {
        where.locationId = locationId;
    }
    // SUPERADMIN has no filter

    return prisma.auditLog.findMany({
        where,
        include: {
            location: {
                select: { name: true },
            },
        },
        orderBy: { timestamp: "desc" },
    });
}

/**
 * Fetches all authorized users for management (SUPERADMIN ONLY).
 */
export async function getDashboardUsers() {
    const session = await auth();
    if (session?.user.role !== Role.SUPERADMIN) {
        throw new Error("Forbidden: Access Restricted to SuperAdmins");
    }

    return prisma.user.findMany({
        include: {
            businessUnit: { select: { name: true } },
            location: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
    });
}

/**
 * Lists metadata for the User Whitelist form.
 */
export async function getManagementMetadata() {
    const [businessUnits, locations] = await Promise.all([
        prisma.businessUnit.findMany({ select: { id: true, name: true } }),
        prisma.location.findMany({ select: { id: true, name: true } }),
    ]);

    return { businessUnits, locations };
}
