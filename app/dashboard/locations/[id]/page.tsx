import { getAuthorizedLocation } from "@/lib/data-fetching";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import LocationEditForm from "@/components/locations/LocationEditForm";

interface LocationPageProps {
    params: {
        id: string;
    };
}

export default async function LocationPage({ params }: LocationPageProps) {
    const { id } = params;
    const location = await getAuthorizedLocation(id);

    if (!location) {
        notFound();
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Dashboard
                </Link>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{location.name}</h1>
                        <p className="text-muted-foreground mt-1">
                            {location.businessUnit?.name || "Independent"} &bull; {location.googleLocationId}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`
                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                ${location.syncStatus === "HEALTHY"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-red-100 text-red-800 border-red-200 animate-pulse"
                            }
              `}>
                            {location.syncStatus}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid gap-8">
                <div className="bg-card border rounded-lg p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-6">Manage Location SSOT</h2>
                    <LocationEditForm location={location} />
                </div>

                <div className="bg-muted/30 border rounded-lg p-6">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                        Location Information
                    </h3>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6 text-sm">
                        <div>
                            <dt className="text-muted-foreground mb-1">Address</dt>
                            <dd className="font-medium">{location.address || "No address provided"}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground mb-1">Google Location ID</dt>
                            <dd className="font-medium font-mono text-xs">{location.googleLocationId}</dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    );
}
