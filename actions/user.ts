"use server";

import { PrismaClient, Role } from "@prisma/client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

async function ensureSuperAdmin() {
    const session = await auth();
    if (session?.user?.role !== Role.SUPERADMIN) {
        throw new Error("Forbidden: Unauthorized access to User Management Actions");
    }
}

export async function addUser(formData: {
    email: string;
    role: Role;
    businessUnitId?: string;
    locationId?: string;
}) {
    await ensureSuperAdmin();

    const user = await prisma.user.create({
        data: {
            email: formData.email,
            role: formData.role,
            businessUnitId: formData.role === Role.ADMIN ? formData.businessUnitId : null,
            locationId: formData.role === Role.BRANCH_ADMIN ? formData.locationId : null,
        },
    });

    revalidatePath("/dashboard/users");
    return { success: true, user };
}

export async function removeUser(userId: string) {
    await ensureSuperAdmin();

    // Prevent deleting your own account
    const session = await auth();
    if (session?.user?.id === userId) {
        throw new Error("Cannot remove your own account.");
    }

    await prisma.user.delete({
        where: { id: userId },
    });

    revalidatePath("/dashboard/users");
    return { success: true };
}
