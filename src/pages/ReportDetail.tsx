import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Car,
  User,
  Route,
  Edit,
  Trash2,
  MessageCircle,
  Phone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGoBack } from "@/hooks/use-go-back";
import { useLostItem, useDeleteLostItem, getImageUrl, ITEM_CATEGORIES, STATUS_CONFIG } from "@/hooks/use-lost-items";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// Component to show matched driver contact
function MatchedDriverContact({ reportId, driverId }: { reportId: string; driverId: string }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [driverPhone, setDriverPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user?.id) return;
      
      // Find conversation for this report
      const { data: conv } = await supabase
        .from("conversations")
        .select("id")
        .eq("lost_item_id", reportId)
        .eq("driver_id", driverId)
        .eq("passenger_id", user.id)
        .single();
      
      if (conv) {
        setConversationId(conv.id);
      }
      
      // Get driver's phone
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("user_id", driverId)
        .single();
      
      if (profile) {
        setDriverPhone(profile.phone);
      }
      
      setLoading(false);
    }
    
    fetchData();
  }, [reportId, driverId, user?.id]);

  const handleChat = () => {
    if (conversationId) {
      navigate(`/chat/${conversationId}`);
    }
  };

  const handleCall = () => {
    if (driverPhone) {
      window.location.href = `tel:${driverPhone}`;
    }
  };

  if (loading) {
    return (
      <Card className="border-primary">
        <CardContent className="p-6 flex justify-center">
          <LoadingSpinner size="sm" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-primary">{t("driverContact")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {t("driverFoundItem")}
        </p>
        <div className="flex gap-2">
          <Button 
            className="flex-1" 
            onClick={handleChat}
            disabled={!conversationId}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {t("chat")}
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleCall}
            disabled={!driverPhone}
          >
            <Phone className="h-4 w-4 mr-2" />
            {t("call")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goBack = useGoBack("/my-reports");
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: report, isLoading, error } = useLostItem(id);
  const deleteMutation = useDeleteLostItem();

  const handleDelete = async () => {
    if (!id) return;
    await deleteMutation.mutateAsync(id);
    navigate("/my-reports");
  };

  const getCategoryInfo = (category: string) => {
    return ITEM_CATEGORIES.find((c) => c.value === category) || { icon: "📦", label: "Other" };
  };

  if (isLoading) {
    return (
      <Layout userType="passenger" userName={user?.name || "Passenger"} onLogout={signOut}>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error || !report) {
    return (
      <Layout userType="passenger" userName={user?.name || "Passenger"} onLogout={signOut}>
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <p className="text-lg font-medium">{t("reportNotFound")}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("reportNotFoundDesc")}
          </p>
          <Button asChild className="mt-4">
            <Link to="/my-reports">{t("backToReports")}</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const categoryInfo = getCategoryInfo(report.category);
  const statusConfig = STATUS_CONFIG[report.status];
  const hasImages = report.images && report.images.length > 0;

  return (
    <Layout userType="passenger" userName={user?.name || "Passenger"} onLogout={signOut}>
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

            {/* Status Timeline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("timeline")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t("reportCreated")}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(report.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                  {report.status === "matched" && (
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-yellow-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{t("driverMatched")}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("driverRespondedToReport")}
                        </p>
                      </div>
                    </div>
                  )}
                  {report.status === "resolved" && (
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-success" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{t("resolvedStatus")}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(report.updated_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Matched Driver Contact (if matched) */}
            {report.status === "matched" && report.matched_driver_id && (
              <MatchedDriverContact
                reportId={report.id}
                driverId={report.matched_driver_id}
              />
            )}
          </div>
        </div>

        {/* Footer Actions */}
        {report.status === "active" && (
          <div className="p-4 border-t bg-background">
            <div className="flex gap-3">
              <Button variant="outline" asChild className="flex-1">
                <Link to={`/report/${report.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t("edit")}
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex-1">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("delete")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("deleteReport")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("deleteReportDesc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t("delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
