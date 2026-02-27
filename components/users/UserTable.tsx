"use client";

import { Role } from "@prisma/client";
import { removeUser } from "@/actions/user";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface UserTableProps {
    users: any[];
}

export default function UserTable({ users }: UserTableProps) {
    async function handleDelete(userId: string) {
        if (!confirm("Are you sure you want to revoke access for this user?")) return;

        try {
            await removeUser(userId);
            toast.success("User removed successfully.");
        } catch (error: any) {
            toast.error(error.message || "Failed to remove user.");
        }
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
                <thead>
                    <tr className="border-b bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                        <th className="p-4">User Email</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Assignment</th>
                        <th className="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {users.map((user) => (
                        <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-4 font-medium">{user.email}</td>
                            <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${user.role === Role.SUPERADMIN ? "bg-purple-100 text-purple-700 border-purple-200" :
                                        user.role === Role.ADMIN ? "bg-blue-100 text-blue-700 border-blue-200" :
                                            "bg-slate-100 text-slate-700 border-slate-200"
                                    }`}>
                                    {user.role}
                                </span>
                            </td>
                            <td className="p-4 text-muted-foreground">
                                {user.role === Role.SUPERADMIN ? "Global Access" :
                                    user.role === Role.ADMIN ? (user.businessUnit?.name || "Unassigned BU") :
                                        (user.location?.name || "Unassigned Location")}
                            </td>
                            <td className="p-4 text-right">
                                <button
                                    onClick={() => handleDelete(user.id)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors p-1 rounded"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
