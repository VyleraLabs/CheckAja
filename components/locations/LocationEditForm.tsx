"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Location } from "@prisma/client";
import { updateLocationSSOT } from "@/actions/location";
import { Toaster, toast } from "sonner";
import { Loader2, Save } from "lucide-react";

const locationSchema = z.object({
    primaryPhone: z.string().min(5, "Phone number is too short").optional().or(z.literal("")),
    websiteUri: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type FormData = z.infer<typeof locationSchema>;

interface LocationEditFormProps {
    location: Location;
}

export default function LocationEditForm({ location }: LocationEditFormProps) {
    const [isPending, setIsPending] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm<FormData>({
        resolver: zodResolver(locationSchema),
        defaultValues: {
            primaryPhone: location.primaryPhone || "",
            websiteUri: location.websiteUri || "",
        },
    });

    async function onSubmit(data: FormData) {
        setIsPending(true);

        try {
            const result = await updateLocationSSOT(location.id, data);

            if (result.success) {
                toast.success("Location updated and synced with Google Profile successfully!");
            } else {
                toast.error("Failed to update location.");
            }
        } catch (error: any) {
            toast.error(error.message || "An unexpected error occurred during sync.");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <>
            <Toaster position="top-right" richColors />
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Primary Phone Number
                        </label>
                        <input
                            {...register("primaryPhone")}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="+62 123 4567 890"
                            disabled={isPending}
                        />
                        {errors.primaryPhone && (
                            <p className="text-xs font-medium text-red-500">{errors.primaryPhone.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Website URI
                        </label>
                        <input
                            {...register("websiteUri")}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="https://jhlgroup.co.id"
                            disabled={isPending}
                        />
                        {errors.websiteUri && (
                            <p className="text-xs font-medium text-red-500">{errors.websiteUri.message}</p>
                        )}
                        <p className="text-[0.8rem] text-muted-foreground">
                            This will update the live Google Profile instantly.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t">
                    <button
                        type="submit"
                        disabled={isPending || !isDirty}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full md:w-auto min-w-[140px]"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </>
    );
}
