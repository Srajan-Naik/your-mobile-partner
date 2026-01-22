import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ITEM_CATEGORIES } from "@/hooks/use-lost-items";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LostItem } from "@/hooks/use-lost-items";
import { useRealtimeLostItems } from "@/hooks/use-realtime";

export default function DriverReports() {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  // Enable real-time updates for new reports
  useRealtimeLostItems();

  // Fetch active reports for drivers
  const { data: reports, isLoading } = useQuery({
    queryKey: ["driver-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lost_items")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as LostItem[];
    },
  });

  // Filter by search
  const filteredReports = reports?.filter((report) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      report.title.toLowerCase().includes(query) ||
      report.description?.toLowerCase().includes(query) ||
      report.lost_location_address?.toLowerCase().includes(query)
    );
  });

  const getCategoryIcon = (category: string) => {
    return ITEM_CATEGORIES.find((c) => c.value === category)?.icon || "📦";
  };

  return (
    <Layout userType="driver" userName={user?.name || "Driver"} onLogout={signOut}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 space-y-4 border-b">
          <h1 className="font-heading text-xl font-bold">{t("availableReportsTitle")}</h1>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchByItemOrLocation")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              {t("allCategories")}
            </Button>
            <Button variant="outline" size="sm">
              <MapPin className="h-4 w-4 mr-2" />
              {t("nearby")}
            </Button>
            <Button variant="outline" size="sm">
              <Clock className="h-4 w-4 mr-2" />
              {t("recent")}
            </Button>
          </div>
        </div>

        {/* Reports List */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <LoadingSkeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredReports?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium">{t("noActiveReportsFound")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery
                  ? t("tryDifferentSearch")
                  : t("checkBackLater")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports?.map((report) => (
                <Link key={report.id} to={`/driver/report/${report.id}`}>
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {/* Category Icon */}
                        <div className="flex-shrink-0 h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                          {getCategoryIcon(report.category)}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium">{report.title}</h3>
                            <Badge variant="secondary" className="flex-shrink-0">
                              {t("new")}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {report.description || t("noDescriptionProvided")}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(report.lost_date), "MMM d")}
                            </span>
                            {report.lost_location_address && (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{report.lost_location_address}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action hint */}
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-primary font-medium">
                          {t("tapToViewDetails")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
