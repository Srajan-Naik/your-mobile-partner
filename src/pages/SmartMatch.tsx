import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles, Loader2, MapPin, Calendar, ChevronRight, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useSmartMatching, getConfidenceLabel, type MatchResult } from "@/hooks/use-smart-matching";
import { useCreateConversation } from "@/hooks/use-conversations";
import { ITEM_CATEGORIES } from "@/hooks/use-lost-items";
import { cn } from "@/lib/utils";

export default function SmartMatch() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [autoNumber, setAutoNumber] = useState("");
  const [foundDate, setFoundDate] = useState("");
  
  const smartMatch = useSmartMatching();
  const createConversation = useCreateConversation();

  const handleSearch = () => {
    if (!description.trim()) return;
    
    smartMatch.mutate({
      found_item_description: description.trim(),
      auto_number: autoNumber.trim() || undefined,
      found_date: foundDate || undefined,
    });
  };

  const handleRespond = async (match: MatchResult) => {
    const result = await createConversation.mutateAsync({
      lostItemId: match.item.id,
      passengerId: match.item.user_id,
    });
    
    if (result?.id) {
      navigate(`/chat/${result.id}`);
    }
  };

  const getCategoryIcon = (category: string) => {
    return ITEM_CATEGORIES.find((c) => c.value === category)?.icon || "📦";
  };

  return (
    <Layout userType="driver" userName={user?.name || "Driver"} onLogout={signOut}>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold">Smart Match</h1>
            <p className="text-sm text-muted-foreground">
              Describe the item you found to find potential matches
            </p>
          </div>
        </div>

        {/* Search Form */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Item Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the item you found in detail... (e.g., black leather wallet with red stitching, contains some cards)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="autoNumber">Auto Number (if known)</Label>
                <Input
                  id="autoNumber"
                  placeholder="e.g., KA01AB1234"
                  value={autoNumber}
                  onChange={(e) => setAutoNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="foundDate">When Found</Label>
                <Input
                  id="foundDate"
                  type="date"
                  value={foundDate}
                  onChange={(e) => setFoundDate(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleSearch}
              disabled={!description.trim() || smartMatch.isPending}
              className="w-full"
            >
              {smartMatch.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Find Matches
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {smartMatch.data && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                {smartMatch.data.matches_found > 0
                  ? `Found ${smartMatch.data.matches_found} Potential Match${smartMatch.data.matches_found > 1 ? "es" : ""}`
                  : "No Matches Found"}
              </h2>
              <Badge variant="secondary">
                {smartMatch.data.total_items_analyzed} reports analyzed
              </Badge>
            </div>

            {smartMatch.data.matches_found === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">
                  No matching lost item reports found. Try being more specific in your description
                  or check back later for new reports.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/driver/reports")}
                >
                  Browse All Reports
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {smartMatch.data.matches.map((match) => {
                  const confidence = getConfidenceLabel(match.confidence_score);
                  return (
                    <Card key={match.item.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          {/* Category Icon */}
                          <div className="flex-shrink-0 h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                            {getCategoryIcon(match.item.category)}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-medium">{match.item.title}</h3>
                              <Badge
                                variant="outline"
                                className={cn("flex-shrink-0", confidence.color)}
                              >
                                {match.confidence_score}% match
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {match.item.description || "No description provided"}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(match.item.lost_date), "MMM d, yyyy")}
                              </span>
                              {match.item.lost_location_address && (
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{match.item.lost_location_address}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Match Reasons */}
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Why this might be a match:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {match.match_reasons.map((reason, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-xs font-normal"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Action */}
                        <Button
                          onClick={() => handleRespond(match)}
                          disabled={createConversation.isPending}
                          className="w-full mt-3"
                        >
                          {createConversation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              Respond to Owner
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
