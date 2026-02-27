import { PrismaClient } from "@prisma/client";
import {
    getMyBusinessAccountManagementApi,
    getMyBusinessBusinessInformationApi
} from "@/lib/google-business";

const prisma = new PrismaClient();

export async function syncLocations() {
    console.log("Starting Google Business Profile Sync...");

    try {
        const accountManagementApi = getMyBusinessAccountManagementApi();
        const businessInformationApi = getMyBusinessBusinessInformationApi();

        // 1. Fetch all Accounts / Location Groups the Service Account has access to
        const accountsResponse = await accountManagementApi.accounts.list();
        const accounts = accountsResponse.data.accounts || [];

        console.log(`Found ${accounts.length} Google Accounts to sync.`);

        for (const account of accounts) {
            if (!account.name || !account.accountName) continue;

            const accountId = account.name.split('/').pop();
            if (!accountId) continue;

            // 2. Upsert the Account into Prisma as a BusinessUnit
            const businessUnit = await prisma.businessUnit.upsert({
                where: { id: accountId }, // Using Google's account ID as our BusinessUnit ID for direct mapping
                update: { name: account.accountName },
                create: {
                    id: accountId,
                    name: account.accountName,
                }
            });
            console.log(`Upserted Business Unit: ${businessUnit.name}`);

            // 3. Fetch all Locations under this specific Account
            let locationPageToken = undefined;
            do {
                const locationsResponse = await businessInformationApi.accounts.locations.list({
                    parent: account.name,
                    readMask: "name,title,storeCode,phoneNumbers,websiteUri,storefrontAddress",
                    pageToken: locationPageToken
                });

                const locations = locationsResponse.data.locations || [];
                locationPageToken = locationsResponse.data.nextPageToken;

                for (const loc of locations) {
                    if (!loc.name) continue;

                    // Standardize Location fields based on the Prisma schema requirements
                    const primaryPhone = loc.phoneNumbers?.primaryPhone || undefined;
                    const websiteUri = loc.websiteUri || undefined;

                    let addressString = undefined;
                    if (loc.storefrontAddress) {
                        const { addressLines, locality, administrativeArea, postalCode } = loc.storefrontAddress;
                        const addressParts = [...(addressLines || []), locality, administrativeArea, postalCode].filter(Boolean);
                        addressString = addressParts.join(', ');
                    }

                    // 4. Upsert the Location into Prisma linking it as the SSOT
                    await prisma.location.upsert({
                        where: { googleLocationId: loc.name }, // e.g. "locations/123456789"
                        update: {
                            name: loc.title || "Unknown Location",
                            primaryPhone,
                            websiteUri,
                            address: addressString,
                            lastCheckedAt: new Date(),
                            syncStatus: "HEALTHY",
                            // We do not overwrite additionalPhones here unless we specifically fetch and merge them
                        },
                        create: {
                            googleLocationId: loc.name,
                            name: loc.title || "Unknown Location",
                            primaryPhone,
                            websiteUri,
                            address: addressString,
                            businessUnitId: businessUnit.id,
                            syncStatus: "HEALTHY",
                            lastCheckedAt: new Date()
                        }
                    });

                    console.log(`  -> Synced Location: ${loc.title}`);
                }
            } while (locationPageToken);
        }

        console.log("Sync completed successfully!");

    } catch (error) {
        console.error("Error during GBP sync:", error);
        throw error;
    }
}
