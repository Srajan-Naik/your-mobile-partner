import { Link } from "react-router-dom";
import { FileText, AlertTriangle, Clock, CheckCircle, FileSearch } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLostItems, ITEM_CATEGORIES } from "@/hooks/use-lost-items";
import { useRealtimeNotifications, useRealtimeConversations } from "@/hooks/use-realtime";
import { format } from "date-fns";

export default function PassengerDashboard() {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const { data: allReports, isLoading } = useLostItems();

  // Enable real-time updates
  useRealtimeNotifications();
  useRealtimeConversations();

  // Calculate stats
  const activeCount = allReports?.filter((r) => r.status === "active").length || 0;
  const resolvedCount = allReports?.filter((r) => r.status === "resolved").length || 0;
  const recentReports = allReports?.slice(0, 3) || [];

  const getCategoryIcon = (category: string) => {
    return ITEM_CATEGORIES.find((c) => c.value === category)?.icon || "📦";
  };

  const stats = [
    { label: t("activeReports"), value: activeCount, icon: Clock, color: "text-primary" },
    { label: t("resolved"), value: resolvedCount, icon: CheckCircle, color: "text-success" },
  ];

  return (
    <Layout userType="passenger" userName={user?.name || "Passenger"} onLogout={signOut}>
      <div className="p-4 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {t("welcomeBack")}{user?.name ? `, ${user.name}` : ""}!
          </h1>
          <p className="text-muted-foreground mt-1">{t("lostSomething")}</p>
        </div>

        {/* Quick Action */}
        <Button asChild className="w-full h-14 text-base font-medium gap-2">
          <Link to="/report-item">
            <FileText className="h-5 w-5" />
            {t("reportLostItem")}
          </Link>
        </Button>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {isLoading ? (
            <>
              <LoadingSkeleton className="h-20 rounded-lg" />
              <LoadingSkeleton className="h-20 rounded-lg" />
            </>
          ) : (
            stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Recent Reports */}
        {recentReports.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-semibold">{t("recentReports")}</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/my-reports">{t("viewAll")}</Link>
              </Button>
            </div>
            <div className="space-y-2">
              {recentReports.map((report) => (
                <Link key={report.id} to={`/report/${report.id}`}>
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-xl">
                        {getCategoryIcon(report.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{report.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(report.lost_date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <FileSearch className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Emergency */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="font-medium text-sm">{t("emergencyContacts")}</p>
                <p className="text-xs text-muted-foreground">{t("quickAccessHelp")}</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/emergency">{t("view")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
