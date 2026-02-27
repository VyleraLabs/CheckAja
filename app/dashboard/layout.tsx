import { auth } from "@/auth";
import { Role } from "@prisma/client";
import Link from "next/link";
import {
    LayoutDashboard,
    ShieldAlert,
    Users,
    LogOut,
    Settings
} from "lucide-react";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const user = session?.user;
    const isSuperAdmin = user?.role === Role.SUPERADMIN;

    const navItems = [
        { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { label: "Audit Logs", href: "/dashboard/audit-logs", icon: ShieldAlert },
    ];

    if (isSuperAdmin) {
        navItems.push({ label: "User Management", href: "/dashboard/users", icon: Users });
    }

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar Navigation */}
            <aside className="w-64 border-r bg-card flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold tracking-tight flex items-center">
                        <Settings className="w-5 h-5 mr-2 text-primary" />
                        JHL Secure
                    </h2>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                        >
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t mt-auto">
                    <div className="flex items-center space-x-3 px-3 py-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {user?.name?.[0] || user?.email?.[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{user?.name || "Dashboard User"}</p>
                            <p className="text-[10px] text-muted-foreground truncate italic uppercase font-bold tracking-wider">
                                {user?.role}
                            </p>
                        </div>
                    </div>
                    <button className="flex w-full items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-slate-50/30">
                {children}
            </main>
        </div>
    );
}
