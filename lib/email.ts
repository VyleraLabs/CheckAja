import nodemailer from "nodemailer";
import { PrismaClient, Role, Location } from "@prisma/client";

const prisma = new PrismaClient();

// Configure the SMTP transport (ensure these env vars are set)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // App Password
    },
});

export async function sendSecurityAlertEmail(
    location: Location,
    changes: { previous: any; revertedTo: any }
) {
    try {
        // 1. RBAC Routing: Determine Who Needs to Know
        // We notify:
        // a) The specific BRANCH_ADMIN assigned to this location.
        // b) The ADMIN(s) assigned to this Business Unit.
        // c) All SUPERADMINs globally.

        const targetUsers = await prisma.user.findMany({
            where: {
                OR: [
                    { role: Role.SUPERADMIN },
                    {
                        role: Role.ADMIN,
                        businessUnitId: location.businessUnitId,
                    },
                    {
                        role: Role.BRANCH_ADMIN,
                        locationId: location.id,
                    },
                ],
            },
            select: { email: true, name: true, role: true },
        });

        if (targetUsers.length === 0) {
            console.warn(`No target users found to notify for Location: ${location.name}`);
            return;
        }

        // Prepare receiver string (e.g., "admin1@jhl.com, admin2@jhl.com")
        const toAddresses = targetUsers.map((u) => u.email).join(", ");

        // 2. Draft the HTML Email Body
        const htmlBody = `
      <h2>🚨 Security Alert: Unauthorized Edit Prevented</h2>
      <p>An unauthorized public edit was detected on the Google Business Profile for <strong>${location.name}</strong>.</p>
      
      <h3>What Happened?</h3>
      <p>Our autonomous background check detected a mismatch between Google's live profile and our Single Source of Truth (SSOT). Our system immediately auto-reverted the changes back to your approved settings to protect the brand.</p>

      <h3>Diff Summary</h3>
      <ul>
        <li><strong>Attempted Change (Rejected):</strong><br/> <pre>${JSON.stringify(changes.previous, null, 2)}</pre></li>
        <li><strong>Restored Value (SSOT):</strong><br/> <pre>${JSON.stringify(changes.revertedTo, null, 2)}</pre></li>
      </ul>

      <p>Please log in to the JHL Security Dashboard to review the Audit Log.</p>
      <br/>
      <p><em>- Your GBP Security Agent</em></p>
    `;

        // 3. Dispatch Email
        await transporter.sendMail({
            from: `"JHL Security Agent" <${process.env.SMTP_USER}>`,
            to: toAddresses,
            subject: `🚨 Unauthorized Edit Reverted for ${location.name}`,
            html: htmlBody,
        });

        console.log(`Security alert email dispatched successfully to ${targetUsers.length} administrators.`);

    } catch (error) {
        console.error("Failed to parse and send security alert email:", error);
    }
}
