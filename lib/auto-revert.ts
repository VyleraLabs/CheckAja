import { PrismaClient, ActionType, SyncStatus } from "@prisma/client";
import { getMyBusinessBusinessInformationApi } from "@/lib/google-business";
import { sendSecurityAlertEmail } from "@/lib/email";

const prisma = new PrismaClient();

export async function processLocationUpdate(googleLocationName: string) {
    console.log(`Processing auto-revert check for ${googleLocationName}`);

    // 1. Fetch our Single Source of Truth (SSOT) Location
    const ssotLocation = await prisma.location.findUnique({
        where: { googleLocationId: googleLocationName },
    });

    if (!ssotLocation) {
        console.warn(`Location ${googleLocationName} not found in SSOT Database. Ignoring.`);
        return;
    }

    // 2. Fetch the incoming LIVE data from Google My Business API
    const businessInformationApi = getMyBusinessBusinessInformationApi();
    const liveLocationResponse = await businessInformationApi.locations.get({
        name: googleLocationName,
        readMask: "name,title,phoneNumbers,websiteUri,storefrontAddress",
    });

    const liveData = liveLocationResponse.data;

    // 3. Compare Incoming Live Data vs SSOT Data
    const livePrimaryPhone = liveData.phoneNumbers?.primaryPhone || undefined;
    const liveWebsiteUri = liveData.websiteUri || undefined;

    const isPhoneCompromised = ssotLocation.primaryPhone !== null
        && ssotLocation.primaryPhone !== livePrimaryPhone;

    const isWebsiteCompromised = ssotLocation.websiteUri !== null
        && ssotLocation.websiteUri !== liveWebsiteUri;

    if (isPhoneCompromised || isWebsiteCompromised) {
        console.warn(`Unauthorized public edit detected for ${ssotLocation.name}! Reverting...`);

        // Prepare the exact rollback payload based on our DB
        const requestBody: any = {};
        const updateMasks: string[] = [];

        if (isPhoneCompromised && ssotLocation.primaryPhone) {
            requestBody.phoneNumbers = { primaryPhone: ssotLocation.primaryPhone };
            updateMasks.push("phoneNumbers");
        }

        if (isWebsiteCompromised && ssotLocation.websiteUri) {
            requestBody.websiteUri = ssotLocation.websiteUri;
            updateMasks.push("websiteUri");
        }

        try {
            // 4. Fire the PATCH request to instantly revert the change on Google GBP
            await businessInformationApi.locations.patch({
                name: googleLocationName,
                updateMask: updateMasks.join(","),
                requestBody: requestBody,
            });

            // 5. Update DB sync status & Log the successful Auto-Revert
            await prisma.location.update({
                where: { id: ssotLocation.id },
                data: { syncStatus: SyncStatus.HEALTHY },
            });

            await prisma.auditLog.create({
                data: {
                    locationId: ssotLocation.id,
                    actionType: ActionType.AUTO_REVERT_SUCCESS,
                    previousData: { phone: livePrimaryPhone, website: liveWebsiteUri },
                    newData: { phone: ssotLocation.primaryPhone, website: ssotLocation.websiteUri },
                }
            });

            // 6. Trigger security email alerts
            await sendSecurityAlertEmail(ssotLocation, {
                previous: { phone: livePrimaryPhone, website: liveWebsiteUri },
                revertedTo: { phone: ssotLocation.primaryPhone, website: ssotLocation.websiteUri }
            });

            console.log(`Successfully auto-reverted GBP profile for ${ssotLocation.name}`);

        } catch (error) {
            console.error(`Failed to auto-revert GBP profile for ${ssotLocation.name}`, error);

            // Log the failed revert attempt causing a COMPROMISED state
            await prisma.location.update({
                where: { id: ssotLocation.id },
                data: { syncStatus: SyncStatus.COMPROMISED },
            });

            await prisma.auditLog.create({
                data: {
                    locationId: ssotLocation.id,
                    actionType: ActionType.AUTO_REVERT_FAILED,
                    previousData: { phone: livePrimaryPhone, website: liveWebsiteUri },
                    newData: { phone: ssotLocation.primaryPhone, website: ssotLocation.websiteUri },
                }
            });
        }
    } else {
        // If no discrepancies found between Live and SSOT, nothing to revert.
        console.log(`SSOT and Live Google Profile match securely for ${ssotLocation.name}`);
    }
}
