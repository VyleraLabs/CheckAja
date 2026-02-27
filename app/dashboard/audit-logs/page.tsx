import { getAuthorizedAuditLogs } from "@/lib/data-fetching";
import { format } from "date-fns";

export default async function AuditLogsPage() {
    const logs = await getAuthorizedAuditLogs();

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
                <p className="text-muted-foreground mt-1">
                    Monitor system actions, sync events, and security interventions.
                </p>
            </div>

            <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b bg-muted/50 text-muted-foreground uppercase text-xs font-semibold">
                                <th className="p-4">Timestamp</th>
                                <th className="p-4">Location</th>
                                <th className="p-4">Action Type</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                        No audit logs recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-4 whitespace-nowrap">
                                            {format(new Date(log.timestamp), "MMM d, yyyy HH:mm:ss")}
                                        </td>
                                        <td className="p-4 font-medium">
                                            {log.location?.name || "Unknown"}
                                        </td>
                                        <td className="p-4">
                                            <span className="font-mono text-xs font-semibold">
                                                {log.actionType}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <ActionStatusBadge type={log.actionType} />
                                        </td>
                                        <td className="p-4 text-right">
                                            {/* In a real app, this would open a modal with JSON diff */}
                                            <button className="text-primary hover:underline font-medium">
                                                Inspect Diff
                                            </button>
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

function ActionStatusBadge({ type }: { type: string }) {
    let styles = "bg-muted text-muted-foreground border-muted-foreground/20";

    if (type === "AUTO_REVERT_SUCCESS") {
        styles = "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400";
    } else if (type === "AUTO_REVERT_FAILED" || type === "UNAUTHORIZED_EDIT_DETECTED") {
        styles = "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400";
    } else if (type === "ADMIN_MANUAL_UPDATE") {
        styles = "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400";
    }

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tighter ${styles}`}>
            {type.includes("SUCCESS") ? "Resolved" : type.includes("FAILED") ? "Action Required" : "Logged"}
        </span>
    );
}
