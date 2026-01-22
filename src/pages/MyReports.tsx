import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLostItems, ITEM_CATEGORIES, STATUS_CONFIG, type ReportStatus } from "@/hooks/use-lost-items";
import { cn } from "@/lib/utils";

export default function MyReports() {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ReportStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const STATUS_TABS: { value: ReportStatus | "all"; label: string; icon: React.ElementType }[] = [
    { value: "all", label: t("all"), icon: Filter },
    { value: "active", label: t("active"), icon: Clock },
    { value: "matched", label: t("matched"), icon: AlertCircle },
    { value: "resolved", label: t("resolved"), icon: CheckCircle },
  ];

  const { data: reports, isLoading, error } = useLostItems(
    activeTab === "all" ? undefined : activeTab
  );

  // Filter by search query
  const filteredReports = reports?.filter((report) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      report.title.toLowerCase().includes(query) ||
      report.description?.toLowerCase().includes(query) ||
      report.auto_number?.toLowerCase().includes(query)
    );
  });

  const getCategoryIcon = (category: string) => {
    return ITEM_CATEGORIES.find((c) => c.value === category)?.icon || "📦";
  };

  return (
    <Layout userType="passenger" userName={user?.name || "Passenger"} onLogout={signOut}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 space-y-4 border-b">
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-xl font-bold">{t("myReports")}</h1>
            <Button asChild size="sm">
              <Link to="/report-item">{t("newReport")}</Link>
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchReports")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportStatus | "all")}>
          <div className="px-4 pt-2 border-b overflow-x-auto">
            <TabsList className="w-full justify-start bg-transparent p-0 h-auto">
              {STATUS_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-4 py-2"
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="flex-1 overflow-auto p-4 m-0">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <LoadingSkeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <XCircle className="h-12 w-12 text-destructive mb-4" />
                <p className="text-muted-foreground">{t("failedToLoad")}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>
                  {t("tryAgain")}
                </Button>
              </div>
            ) : filteredReports?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium">{t("noReportsFound")}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery
                    ? t("tryDifferentSearch")
                    : activeTab === "all"
                    ? t("startByReporting")
                    : `${t("noReportsFound")}`}
                </p>
                {!searchQuery && activeTab === "all" && (
                  <Button asChild className="mt-4">
                    <Link to="/report-item">{t("reportLostItem")}</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReports?.map((report) => (
                  <Link key={report.id} to={`/report/${report.id}`}>
                    <Card className="hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          {/* Category Icon */}
                          <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-2xl">
                            {getCategoryIcon(report.category)}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-medium truncate">{report.title}</h3>
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "flex-shrink-0 text-xs",
                                  STATUS_CONFIG[report.status].color
                                )}
                              >
                                {STATUS_CONFIG[report.status].label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                              {report.description || t("noDescription")}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>
                                {t("lost")}: {format(new Date(report.lost_date), "MMM d, yyyy")}
                              </span>
                              {report.auto_number && (
                                <span>{t("auto")}: {report.auto_number}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
