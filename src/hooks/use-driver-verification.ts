import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DriverVerification {
  id: string;
  user_id: string;
  license_number: string | null;
  license_storage_path: string | null;
  vehicle_registration_number: string | null;
  vehicle_registration_storage_path: string | null;
  photo_verification_storage_path: string | null;
  status: "pending" | "submitted" | "approved" | "rejected";
  admin_notes: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useDriverVerification() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["driver-verification", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("driver_verifications")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as DriverVerification | null;
    },
    enabled: !!user?.id,
  });
}

export function useCreateOrUpdateDriverVerification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<DriverVerification>) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Check if verification exists
      const { data: existing } = await supabase
        .from("driver_verifications")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existing) {
        // Update
        const { data: updated, error } = await supabase
          .from("driver_verifications")
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        return updated;
      } else {
        // Insert
        const { data: created, error } = await supabase
          .from("driver_verifications")
          .insert({
            user_id: user.id,
            ...data,
          })
          .select()
          .single();

        if (error) throw error;
        return created;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-verification"] });
    },
    onError: (error) => {
      toast.error("Failed to update verification");
      console.error(error);
    },
  });
}

export function useSubmitVerification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("driver_verifications")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-verification"] });
      toast.success("Verification submitted for review!");
    },
    onError: (error) => {
      toast.error("Failed to submit verification");
      console.error(error);
    },
  });
}

export function useUploadVerificationDocument() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      file,
      documentType,
    }: {
      file: File;
      documentType: "license" | "vehicle_registration" | "photo";
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${documentType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("driver-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      return fileName;
    },
    onError: (error) => {
      toast.error("Failed to upload document");
      console.error(error);
    },
  });
}

export function getVerificationDocumentUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from("driver-documents")
    .getPublicUrl(storagePath);
  return data.publicUrl;
}
