import { google } from "googleapis";

// Define the scopes required for Google My Business APIs
const SCOPES = [
    "https://www.googleapis.com/auth/business.manage",
];

/**
 * Initializes and returns an authenticated Google API auth client
 * using the Service Account credentials from environment variables.
 */
export const getGoogleAuthClient = () => {
    // Ensure we have the required credentials
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
        throw new Error("Missing Google Service Account credentials in environment variables.");
    }

    // Handle newline characters that might be escaped in the env variable
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n');

    return new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: privateKey,
        scopes: SCOPES,
    });
};

/**
 * Returns an authenticated instance of the My Business Account Management API.
 * Used for fetching Accounts/Location Groups.
 */
export const getMyBusinessAccountManagementApi = () => {
    const auth = getGoogleAuthClient();
    return google.mybusinessaccountmanagement({
        version: 'v1',
        auth,
    });
};

/**
 * Returns an authenticated instance of the My Business Business Information API.
 * Used for fetching Location details and updating Locations.
 */
export const getMyBusinessBusinessInformationApi = () => {
    const auth = getGoogleAuthClient();
    return google.mybusinessbusinessinformation({
        version: 'v1',
        auth,
    });
};
