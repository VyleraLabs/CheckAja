import { getAuthorizedLocations } from "@/lib/data-fetching";
import Link from "next/link";
import { SyncStatus } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";

export default async function DashboardPage() {
    const locations = await getAuthorizedLocations();

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">GBP Security Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage and secure your Google Business Profiles.
                    </p>
                </div>
            </div>

            <div className="bg-card border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b bg-muted/50 text-muted-foreground uppercase text-xs font-semibold">
                                <th className="p-4">Location Name</th>
                                <th className="p-4">Business Unit</th>
                                <th className="p-4">Phone</th>
                                <th className="p-4">Website</th>
                                <th className="p-4">Sync Status</th>
                                <th className="p-4">Last Checked</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {locations.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                        No locations found.
                                    </td>
                                </tr>
                            ) : (
                                locations.map((loc) => (
                                    <tr key={loc.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-4 font-medium">{loc.name}</td>
                                        <td className="p-4 text-muted-foreground">
                                            {loc.businessUnit?.name || "N/A"}
                                        </td>
                                        <td className="p-4">{loc.primaryPhone || "—"}</td>
                                        <td className="p-4 truncate max-w-[200px]" title={loc.websiteUri || ""}>
                                            {loc.websiteUri || "—"}
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={loc.syncStatus} />
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground">
                                            {loc.lastCheckedAt
                                                ? formatDistanceToNow(new Date(loc.lastCheckedAt), { addSuffix: true })
                                                : "Never"}
                                        </td>
                                        <td className="p-4 text-right">
                                            <Link
                                                href={`/dashboard/locations/${loc.id}`}
                                                className="text-primary hover:underline font-medium text-sm"
                                            >
                                                Manage
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: SyncStatus }) {
    const isHealthy = status === SyncStatus.HEALTHY;

    return (
        <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
      ${isHealthy
                ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                : "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 animate-pulse"
            }
    `}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isHealthy ? "bg-green-500" : "bg-red-500"}`} />
            {status}
        </span>
    );
}
