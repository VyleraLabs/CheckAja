"use server";

import { PrismaClient, ActionType } from "@prisma/client";
import { getCurrentUser, isSuperAdmin, isAdmin, isBranchAdmin } from "@/lib/rbac";
import { getMyBusinessBusinessInformationApi } from "@/lib/google-business";

const prisma = new PrismaClient();

export async function updateLocationSSOT(
    locationId: string,
    updates: { primaryPhone?: string; websiteUri?: string }
) {
    // 1. Authorization Check (Strict RBAC Implementation)
    const user = await getCurrentUser();
    if (!user) {
        throw new Error("Unauthorized: Please log in.");
    }

    const existingLocation = await prisma.location.findUnique({
        where: { id: locationId }
    });

    if (!existingLocation) {
        throw new Error("Location not found.");
    }

    let isAuthorized = false;

    if (isSuperAdmin(user.role)) {
        isAuthorized = true; // SUPERADMIN can update any location
    } else if (isAdmin(user.role)) {
        // ADMIN can only update locations where the businessUnitId matches their own
        if (existingLocation.businessUnitId === user.businessUnitId) {
            isAuthorized = true;
        }
    } else if (isBranchAdmin(user.role)) {
        // BRANCH_ADMIN can only update their assigned location
        if (existingLocation.id === user.locationId) {
            isAuthorized = true;
        }
    }

    if (!isAuthorized) {
        throw new Error("Forbidden: You do not have permission to edit this location.");
    }

    // Ensure there are actually updates to apply
    if (!updates.primaryPhone && !updates.websiteUri) {
        return { success: true, message: "No updates provided." };
    }

    // 2. Execution: Update the record in the Prisma DB
    const oldDataSnapshot = {
        primaryPhone: existingLocation.primaryPhone,
        websiteUri: existingLocation.websiteUri,
    };

    const updatedLocation = await prisma.location.update({
        where: { id: locationId },
        data: {
            primaryPhone: updates.primaryPhone ?? existingLocation.primaryPhone,
            websiteUri: updates.websiteUri ?? existingLocation.websiteUri,
        }
    });

    const newDataSnapshot = {
        primaryPhone: updatedLocation.primaryPhone,
        websiteUri: updatedLocation.websiteUri,
    };

    try {
        // 3. API Sync: Trigger PATCH request to Google Business Information API
        const businessInformationApi = getMyBusinessBusinessInformationApi();

        // The Location name acts as the resource ID in Google API (e.g., locations/123456)
        const googleLocationName = existingLocation.googleLocationId;

        // Prepare the update payload and dynamically construct the updateMask
        const requestBody: any = {};
        const updateMasks: string[] = [];

        if (updates.primaryPhone !== undefined) {
            requestBody.phoneNumbers = { primaryPhone: updates.primaryPhone };
            updateMasks.push("phoneNumbers");
        }

        if (updates.websiteUri !== undefined) {
            requestBody.websiteUri = updates.websiteUri;
            updateMasks.push("websiteUri");
        }

        // Attempt pushing instantly to the Live Google Profile
        await businessInformationApi.locations.patch({
            name: googleLocationName,
            updateMask: updateMasks.join(","),
            requestBody: requestBody,
        });

    } catch (error) {
        console.error("Failed to sync change to Google Business API:", error);

        // In an enterprise system, you may want to rollback or enqueue a retry, 
        // but we will throw here so the UI knows the external API sync failed.
        throw new Error("Database updated, but failed to sync changes to Google Business Profile.");
    }

    // 4. Audit: Log the action in the AuditLog table
    await prisma.auditLog.create({
        data: {
            locationId: updatedLocation.id,
            actionType: ActionType.ADMIN_MANUAL_UPDATE,
            previousData: oldDataSnapshot,
            newData: newDataSnapshot,
        }
    });

    return {
        success: true,
        location: updatedLocation
    };
}
