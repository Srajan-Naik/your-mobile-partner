import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ItemCategory = 
  | "electronics"
  | "documents"
  | "wallet"
  | "bag"
  | "jewelry"
  | "clothing"
  | "keys"
  | "other";

export type ReportStatus = 
  | "active"
  | "matched"
  | "resolved"
  | "expired"
  | "cancelled";

export interface LostItem {
  id: string;
  user_id: string;
  category: ItemCategory;
  title: string;
  description: string | null;
  lost_date: string;
  lost_location_address: string | null;
  lost_location_lat: number | null;
  lost_location_lng: number | null;
  auto_number: string | null;
  route_description: string | null;
  driver_description: string | null;
  status: ReportStatus;
  matched_driver_id: string | null;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
}

export interface LostItemImage {
  id: string;
  lost_item_id: string;
  storage_path: string;
  display_order: number;
  created_at: string;
}

export interface LostItemWithImages extends LostItem {
  images: LostItemImage[];
}

export interface CreateLostItemInput {
  category: ItemCategory;
  title: string;
  description?: string;
  lost_date: Date;
  lost_location_address?: string;
  lost_location_lat?: number;
  lost_location_lng?: number;
  auto_number?: string;
  route_description?: string;
  driver_description?: string;
  is_draft?: boolean;
}

export interface UpdateLostItemInput extends Partial<CreateLostItemInput> {
  status?: ReportStatus;
}

// Fetch user's lost item reports
export function useLostItems(status?: ReportStatus) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["lost-items", user?.id, status],
    queryFn: async () => {
      let query = supabase
        .from("lost_items")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as LostItem[];
    },
    enabled: !!user?.id,
  });
}

// Fetch a single lost item with images
export function useLostItem(id: string | undefined) {
  return useQuery({
    queryKey: ["lost-item", id],
    queryFn: async () => {
      if (!id) throw new Error("No item ID provided");

      const { data: item, error: itemError } = await supabase
        .from("lost_items")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (itemError) throw itemError;
      if (!item) throw new Error("Item not found");

      const { data: images, error: imagesError } = await supabase
        .from("lost_item_images")
        .select("*")
        .eq("lost_item_id", id)
        .order("display_order", { ascending: true });

      if (imagesError) throw imagesError;

      return {
        ...item,
        images: images || [],
      } as LostItemWithImages;
    },
    enabled: !!id,
  });
}

// Create a new lost item report
export function useCreateLostItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateLostItemInput) => {
      const { data, error } = await supabase
        .from("lost_items")
        .insert({
          user_id: user!.id,
          category: input.category,
          title: input.title,
          description: input.description || null,
          lost_date: input.lost_date.toISOString(),
          lost_location_address: input.lost_location_address || null,
          lost_location_lat: input.lost_location_lat || null,
          lost_location_lng: input.lost_location_lng || null,
          auto_number: input.auto_number || null,
          route_description: input.route_description || null,
          driver_description: input.driver_description || null,
          is_draft: input.is_draft || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as LostItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lost-items"] });
      toast.success("Report created successfully!");
    },
    onError: (error) => {
      console.error("Create lost item error:", error);
      toast.error("Failed to create report");
    },
  });
}

// Update a lost item report
export function useUpdateLostItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateLostItemInput & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      
      if (input.category) updateData.category = input.category;
      if (input.title) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description || null;
      if (input.lost_date) updateData.lost_date = input.lost_date.toISOString();
      if (input.lost_location_address !== undefined) updateData.lost_location_address = input.lost_location_address || null;
      if (input.lost_location_lat !== undefined) updateData.lost_location_lat = input.lost_location_lat || null;
      if (input.lost_location_lng !== undefined) updateData.lost_location_lng = input.lost_location_lng || null;
      if (input.auto_number !== undefined) updateData.auto_number = input.auto_number || null;
      if (input.route_description !== undefined) updateData.route_description = input.route_description || null;
      if (input.driver_description !== undefined) updateData.driver_description = input.driver_description || null;
      if (input.is_draft !== undefined) updateData.is_draft = input.is_draft;
      if (input.status) updateData.status = input.status;

      const { data, error } = await supabase
        .from("lost_items")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as LostItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["lost-items"] });
      queryClient.invalidateQueries({ queryKey: ["lost-item", data.id] });
      toast.success("Report updated successfully!");
    },
    onError: (error) => {
      console.error("Update lost item error:", error);
      toast.error("Failed to update report");
    },
  });
}

// Delete a lost item report
export function useDeleteLostItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("lost_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lost-items"] });
      toast.success("Report deleted successfully!");
    },
    onError: (error) => {
      console.error("Delete lost item error:", error);
      toast.error("Failed to delete report");
    },
  });
}

// Upload image for a lost item
export function useUploadLostItemImage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lostItemId,
      file,
      displayOrder = 0,
    }: {
      lostItemId: string;
      file: File;
      displayOrder?: number;
    }) => {
      // Upload to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user!.id}/${lostItemId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("lost-item-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save reference in database
      const { data, error: dbError } = await supabase
        .from("lost_item_images")
        .insert({
          lost_item_id: lostItemId,
          storage_path: fileName,
          display_order: displayOrder,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      return data as LostItemImage;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lost-item", variables.lostItemId] });
    },
    onError: (error) => {
      console.error("Upload image error:", error);
      toast.error("Failed to upload image");
    },
  });
}

// Delete image from a lost item
export function useDeleteLostItemImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, storagePath, lostItemId }: { id: string; storagePath: string; lostItemId: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("lost-item-images")
        .remove([storagePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("lost_item_images")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      return lostItemId;
    },
    onSuccess: (lostItemId) => {
      queryClient.invalidateQueries({ queryKey: ["lost-item", lostItemId] });
    },
    onError: (error) => {
      console.error("Delete image error:", error);
      toast.error("Failed to delete image");
    },
  });
}

// Get public URL for an image
export function getImageUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from("lost-item-images")
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

// Category display helpers
export const ITEM_CATEGORIES: { value: ItemCategory; label: string; icon: string }[] = [
  { value: "electronics", label: "Electronics", icon: "📱" },
  { value: "documents", label: "Documents", icon: "📄" },
  { value: "wallet", label: "Wallet", icon: "👛" },
  { value: "bag", label: "Bag", icon: "👜" },
  { value: "jewelry", label: "Jewelry", icon: "💍" },
  { value: "clothing", label: "Clothing", icon: "👕" },
  { value: "keys", label: "Keys", icon: "🔑" },
  { value: "other", label: "Other", icon: "📦" },
];

export const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-primary text-primary-foreground" },
  matched: { label: "Matched", color: "bg-yellow-500 text-white" },
  resolved: { label: "Resolved", color: "bg-success text-white" },
  expired: { label: "Expired", color: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelled", color: "bg-destructive text-destructive-foreground" },
};
