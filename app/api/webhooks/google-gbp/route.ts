import { NextRequest, NextResponse } from "next";
import { Client } from "@upstash/qstash";

const qstash = new Client({
    token: process.env.QSTASH_TOKEN!,
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Verify it's a Pub/Sub message format
        if (!body.message || !body.message.data) {
            return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
        }

        // Google Cloud Pub/Sub sends data as a Base64-encoded string
        const decodedDataString = Buffer.from(body.message.data, 'base64').toString('utf-8');
        const updateData = JSON.parse(decodedDataString);

        // If the message contains a location identifier
        if (updateData.locationName) {
            // PUBLISH TO QSTASH: This decouples the processing from the request.
            // QStash will call our /api/jobs/auto-revert endpoint with retries.
            await qstash.publishJSON({
                url: `${process.env.NEXT_PUBLIC_APP_URL}/api/jobs/auto-revert`,
                body: {
                    locationName: updateData.locationName,
                },
            });

            console.log(`Enqueued auto-revert check for ${updateData.locationName}`);
        }

        // Immediately ACK the message to Google
        return NextResponse.json({ success: true, message: "Webhook accepted and queued" }, { status: 200 });

    } catch (error) {
        console.error("Error processing Webhook:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
