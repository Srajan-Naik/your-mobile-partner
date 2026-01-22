import { Link } from "react-router-dom";
import { FileSearch, DollarSign, Star, ToggleLeft, ToggleRight, Loader2, Sparkles } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  useDriverStatus,
  useToggleDriverStatus,
  useDriverPresence,
} from "@/hooks/use-driver-status";
import { useRealtimeNotifications, useRealtimeLostItems } from "@/hooks/use-realtime";
import { useUserAverageRating } from "@/hooks/use-reviews";
import { useUserBalance } from "@/hooks/use-transactions";

export default function DriverDashboard() {
  const { user, signOut } = useAuth();
  const { data: status, isLoading: statusLoading } = useDriverStatus();
  const toggleStatus = useToggleDriverStatus();
  const { data: rating } = useUserAverageRating(user?.id);
  const { data: balance } = useUserBalance();

  // Enable real-time updates
  useRealtimeNotifications();
  useRealtimeLostItems();
  useDriverPresence();

  const isOnline = status?.is_online ?? false;

  const handleToggleStatus = () => {
    toggleStatus.mutate(!isOnline);
  };

  return (
    <Layout userType="driver" userName={user?.name || "Driver"} onLogout={signOut}>
      <div className="p-4 space-y-6">
        {/* Header with Online Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Driver Dashboard</h1>
            <Badge variant={isOnline ? "default" : "secondary"} className="mt-1">
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleStatus}
            disabled={statusLoading || toggleStatus.isPending}
            className="h-12 w-12"
          >
            {toggleStatus.isPending ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : isOnline ? (
              <ToggleRight className="h-8 w-8 text-success" />
            ) : (
              <ToggleLeft className="h-8 w-8 text-muted-foreground" />
            )}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10 text-success">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">₹{balance?.toLocaleString() ?? 0}</p>
                <p className="text-xs text-muted-foreground">Total Earnings</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {rating?.average?.toFixed(1) ?? "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Rating ({rating?.count ?? 0} reviews)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button asChild className="w-full h-14 text-base font-medium gap-2">
            <Link to="/driver/smart-match">
              <Sparkles className="h-5 w-5" />
              Smart Match - Find Item Owner
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full h-14 text-base font-medium gap-2">
            <Link to="/driver/reports">
              <FileSearch className="h-5 w-5" />
              Browse Lost Item Reports
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
