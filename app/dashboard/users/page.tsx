import { getDashboardUsers, getManagementMetadata } from "@/lib/data-fetching";
import AddUserForm from "@/components/users/AddUserForm";
import UserTable from "@/components/users/UserTable";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function UsersPage() {
    const session = await auth();

    // Guard: Only SuperAdmins can access user management
    if (session?.user.role !== Role.SUPERADMIN) {
        redirect("/dashboard");
    }

    const [users, metadata] = await Promise.all([
        getDashboardUsers(),
        getManagementMetadata(),
    ]);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mb-12">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Whitelist personnel and manage access tiers across the JHL Group.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left: User List */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
                        <UserTable users={users} />
                    </div>
                </div>

                {/* Right: Add User Form */}
                <div className="lg:col-span-4 sticky top-8">
                    <div className="bg-card border rounded-lg p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">Whitelist New User</h2>
                        <AddUserForm
                            businessUnits={metadata.businessUnits}
                            locations={metadata.locations}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
