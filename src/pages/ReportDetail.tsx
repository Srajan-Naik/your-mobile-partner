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
import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { useLostItem, useDeleteLostItem, getImageUrl, ITEM_CATEGORIES, STATUS_CONFIG } from "@/hooks/use-lost-items";
import { cn } from "@/lib/utils";

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
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
          <p className="text-lg font-medium">Report not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            The report you're looking for doesn't exist or has been deleted.
          </p>
          <Button asChild className="mt-4">
            <Link to="/my-reports">Back to Reports</Link>
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
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
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
                alt={`${report.title} - Image ${currentImageIndex + 1}`}
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
                  Item Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{categoryInfo.label}</p>
                </div>
                {report.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
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
                  When & Where
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Lost Date</p>
                    <p className="font-medium">
                      {format(new Date(report.lost_date), "EEEE, MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
                {report.lost_location_address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
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
                    Auto Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.auto_number && (
                    <div className="flex items-start gap-3">
                      <Car className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Registration Number</p>
                        <p className="font-medium font-mono">{report.auto_number}</p>
                      </div>
                    </div>
                  )}
                  {report.route_description && (
                    <div className="flex items-start gap-3">
                      <Route className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Route</p>
                        <p>{report.route_description}</p>
                      </div>
                    </div>
                  )}
                  {report.driver_description && (
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Driver Description</p>
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
                <CardTitle className="text-base">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Report Created</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(report.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                  {report.status === "matched" && (
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-yellow-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Driver Matched</p>
                        <p className="text-xs text-muted-foreground">
                          A driver has responded to your report
                        </p>
                      </div>
                    </div>
                  )}
                  {report.status === "resolved" && (
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-success" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Resolved</p>
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
              <Card className="border-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-primary">Driver Contact</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    A driver has found your item! Contact them to arrange pickup.
                  </p>
                  <div className="flex gap-2">
                    <Button className="flex-1">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
                  Edit
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex-1">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Report?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your
                      lost item report and all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
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
