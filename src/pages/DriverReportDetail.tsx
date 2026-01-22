import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Car,
  User,
  Route,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGoBack } from "@/hooks/use-go-back";
import { getImageUrl, ITEM_CATEGORIES, STATUS_CONFIG } from "@/hooks/use-lost-items";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LostItemWithImages } from "@/hooks/use-lost-items";
import { toast } from "sonner";

export default function DriverReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goBack = useGoBack("/driver/reports");
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const queryClient = useQueryClient();

  // Fetch the report for drivers
  const { data: report, isLoading, error } = useQuery({
    queryKey: ["driver-report", id],
    queryFn: async () => {
      if (!id) throw new Error("No report ID");

      const { data, error } = await supabase
        .from("lost_items")
        .select("*")
        .eq("id", id)
        .eq("status", "active")
        .eq("is_draft", false)
        .single();

      if (error) throw error;

      // Fetch images separately
      const { data: images } = await supabase
        .from("lost_item_images")
        .select("*")
        .eq("lost_item_id", id)
        .order("display_order", { ascending: true });

      return { ...data, images: images || [] } as LostItemWithImages;
    },
    enabled: !!id,
  });

  // Create conversation mutation
  const createConversation = useMutation({
    mutationFn: async () => {
      if (!report || !user) throw new Error("Missing data");

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("lost_item_id", report.id)
        .eq("driver_id", user.id)
        .single();

      if (existing) {
        return existing.id;
      }

      // Create new conversation
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          lost_item_id: report.id,
          passenger_id: report.user_id,
          driver_id: user.id,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: (conversationId) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      navigate(`/chat/${conversationId}`);
    },
    onError: (error) => {
      toast.error(t("errorCreatingConversation"));
      console.error("Error creating conversation:", error);
    },
  });

  const getCategoryInfo = (category: string) => {
    return ITEM_CATEGORIES.find((c) => c.value === category) || { icon: "📦", label: "Other" };
  };

  if (isLoading) {
    return (
      <Layout userType="driver" userName={user?.name || "Driver"} onLogout={signOut}>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error || !report) {
    return (
      <Layout userType="driver" userName={user?.name || "Driver"} onLogout={signOut}>
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <p className="text-lg font-medium">{t("reportNotFound")}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("reportNotFoundDesc")}
          </p>
          <Button onClick={() => navigate("/driver/reports")} className="mt-4">
            {t("backToReports")}
          </Button>
        </div>
      </Layout>
    );
  }

  const categoryInfo = getCategoryInfo(report.category);
  const statusConfig = STATUS_CONFIG[report.status];
  const hasImages = report.images && report.images.length > 0;

  return (
    <Layout userType="driver" userName={user?.name || "Driver"} onLogout={signOut}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-heading text-lg font-semibold line-clamp-1">
              {report.title}
            </h1>
            <Badge className={cn("mt-1", statusConfig.color)}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {/* Image Gallery */}
          {hasImages && (
            <div className="relative aspect-video bg-muted">
              <img
                src={getImageUrl(report.images[currentImageIndex].storage_path)}
                alt={report.title}
                className="w-full h-full object-contain"
              />
              {report.images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setCurrentImageIndex((i) =>
                        i === 0 ? report.images.length - 1 : i - 1
                      )
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentImageIndex((i) =>
                        i === report.images.length - 1 ? 0 : i + 1
                      )
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {report.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-colors",
                          index === currentImageIndex
                            ? "bg-white"
                            : "bg-white/50"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="p-4 space-y-6">
            {/* Item Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-xl">{categoryInfo.icon}</span>
                  {t("itemDetailsTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("category")}</p>
                  <p className="font-medium">{categoryInfo.label}</p>
                </div>
                {report.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t("description")}</p>
                    <p className="whitespace-pre-wrap">{report.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* When & Where */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t("whenAndWhere")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("lostDate")}</p>
                    <p className="font-medium">
                      {format(new Date(report.lost_date), "EEEE, MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
                {report.lost_location_address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("location")}</p>
                      <p className="font-medium">{report.lost_location_address}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Auto Details */}
            {(report.auto_number || report.route_description || report.driver_description) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    {t("autoDetailsTitle")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.auto_number && (
                    <div className="flex items-start gap-3">
                      <Car className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t("registrationNumber")}</p>
                        <p className="font-medium font-mono">{report.auto_number}</p>
                      </div>
                    </div>
                  )}
                  {report.route_description && (
                    <div className="flex items-start gap-3">
                      <Route className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t("route")}</p>
                        <p>{report.route_description}</p>
                      </div>
                    </div>
                  )}
                  {report.driver_description && (
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t("driverDescription")}</p>
                        <p>{report.driver_description}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Posted Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("postedInfo")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t("postedOn")} {format(new Date(report.created_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Action - Respond */}
        <div className="p-4 border-t bg-background">
          <Button
            className="w-full"
            size="lg"
            onClick={() => createConversation.mutate()}
            disabled={createConversation.isPending}
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            {createConversation.isPending ? t("connecting") : t("respondToReport")}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {t("respondToReportDesc")}
          </p>
        </div>
      </div>
    </Layout>
  );
}
