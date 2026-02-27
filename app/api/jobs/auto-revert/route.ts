import { NextRequest, NextResponse } from "next";
import { Receiver } from "@upstash/qstash";
import { processLocationUpdate } from "@/lib/auto-revert";

const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

export async function POST(req: NextRequest) {
    try {
        // 1. Verify the QStash signature to ensure only QStash can trigger this
        const signature = req.headers.get("upstash-signature");
        if (!signature) {
            return NextResponse.json({ error: "Missing signature" }, { status: 401 });
        }

        // Clone the request as verify expects the raw body
        const bodyText = await req.text();
        const isValid = await receiver.verify({
            signature,
            body: bodyText,
        });

        if (!isValid) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        // 2. Parse the body and trigger the processing logic
        const { locationName } = JSON.parse(bodyText);

        if (!locationName) {
            return NextResponse.json({ error: "Missing locationName" }, { status: 400 });
        }

        await processLocationUpdate(locationName);

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error("Queue worker job failed:", error);
        // Returning 500 triggers QStash retries
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
