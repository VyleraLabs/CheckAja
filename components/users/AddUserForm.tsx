"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Role } from "@prisma/client";
import { addUser } from "@/actions/user";
import { toast, Toaster } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

const userSchema = z.object({
    email: z.string().email("Invalid Google Workspace email"),
    role: z.nativeEnum(Role),
    businessUnitId: z.string().optional(),
    locationId: z.string().optional(),
});

type FormData = z.infer<typeof userSchema>;

interface AddUserFormProps {
    businessUnits: { id: string; name: true }[];
    locations: { id: string; name: true }[];
}

export default function AddUserForm({ businessUnits, locations }: AddUserFormProps) {
    const [isPending, setIsPending] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            role: Role.BRANCH_ADMIN,
        },
    });

    const selectedRole = watch("role");

    async function onSubmit(data: FormData) {
        setIsPending(true);
        try {
            const result = await addUser(data as any);
            if (result.success) {
                toast.success(`User ${data.email} whitelisted successfully.`);
                reset();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to whitelist user.");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Toaster position="top-right" richColors />

            <div className="space-y-2">
                <label className="text-sm font-medium">Google Email</label>
                <input
                    {...register("email")}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="user@jhlgroup.co.id"
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Access Tier</label>
                <select
                    {...register("role")}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                    <option value={Role.SUPERADMIN}>Super Admin (Holding)</option>
                    <option value={Role.ADMIN}>Admin (Business Unit)</option>
                    <option value={Role.BRANCH_ADMIN}>Branch Admin (Local)</option>
                </select>
            </div>

            {selectedRole === Role.ADMIN && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                    <label className="text-sm font-medium">Assigned Business Unit</label>
                    <select
                        {...register("businessUnitId")}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <option value="">Select Business Unit...</option>
                        {businessUnits.map((bu) => (
                            <option key={bu.id} value={bu.id}>{bu.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {selectedRole === Role.BRANCH_ADMIN && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                    <label className="text-sm font-medium">Assigned Location</label>
                    <select
                        {...register("locationId")}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <option value="">Select Location...</option>
                        {locations.map((loc) => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <button
                type="submit"
                disabled={isPending}
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
            >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Whitelist User
            </button>
        </form>
    );
}
