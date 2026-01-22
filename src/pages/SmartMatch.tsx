import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { Search, Sparkles, Loader2, MapPin, Calendar, ChevronRight, CheckCircle2, Upload, X, Camera, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSmartMatching, getConfidenceLabel, type MatchResult } from "@/hooks/use-smart-matching";
import { useCreateConversation } from "@/hooks/use-conversations";
import { ITEM_CATEGORIES } from "@/hooks/use-lost-items";
import { cn } from "@/lib/utils";

export default function SmartMatch() {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [autoNumber, setAutoNumber] = useState("");
  const [foundDate, setFoundDate] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const maxPhotos = 3;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...photos, ...acceptedFiles].slice(0, maxPhotos);
      setPhotos(newFiles);
    },
    [photos]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: maxPhotos - photos.length,
    disabled: photos.length >= maxPhotos,
  });

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };
  
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
            <h1 className="font-heading text-xl font-bold">{t("smartMatchTitle")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("describeFoundItem")}
            </p>
          </div>
        </div>

        {/* Search Form */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">{t("itemDescriptionRequired")}</Label>
              <Textarea
                id="description"
                placeholder={t("describeFoundItemPlaceholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="autoNumber">{t("autoNumberIfKnown")}</Label>
                <Input
                  id="autoNumber"
                  placeholder="e.g., KA01AB1234"
                  value={autoNumber}
                  onChange={(e) => setAutoNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="foundDate">{t("whenFound")}</Label>
                <Input
                  id="foundDate"
                  type="date"
                  value={foundDate}
                  onChange={(e) => setFoundDate(e.target.value)}
                />
              </div>
            </div>

            {/* Photo Upload Section */}
            <div className="space-y-2">
              <Label>{t("photos") || "Photos"} ({t("optional") || "Optional"})</Label>
              <p className="text-xs text-muted-foreground">
                {t("addPhotosToHelp") || "Add photos of the found item to help with matching"}
              </p>
              
              {photos.length < maxPhotos && (
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50"
                  )}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {isDragActive ? t("dropHere") || "Drop here" : t("dragOrClick") || "Drag & drop or click to upload"}
                  </p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                  disabled={photos.length >= maxPhotos}
                >
                  <Camera className="h-4 w-4 mr-1" />
                  {t("takePhoto") || "Take Photo"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                  disabled={photos.length >= maxPhotos}
                >
                  <ImageIcon className="h-4 w-4 mr-1" />
                  {t("gallery") || "Gallery"}
                </Button>
              </div>

              {/* Photo Previews */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((file, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center">
                {photos.length}/{maxPhotos} {t("photosUploaded") || "photos"}
              </p>
            </div>

            <Button
              onClick={handleSearch}
              disabled={!description.trim() || smartMatch.isPending}
              className="w-full"
            >
              {smartMatch.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("searching")}
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  {t("findMatches")}
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
                  ? `${smartMatch.data.matches_found} ${smartMatch.data.matches_found > 1 ? t("potentialMatches") : t("potentialMatch")}`
                  : t("noMatchesFound")}
              </h2>
              <Badge variant="secondary">
                {smartMatch.data.total_items_analyzed} {t("reportsAnalyzed")}
              </Badge>
            </div>

            {smartMatch.data.matches_found === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">
                  {t("noMatchingReports")}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/driver/reports")}
                >
                  {t("browseAllReports")}
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
                              {match.item.description || t("noDescriptionProvided")}
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
                            {t("whyMatch")}
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
                              {t("respondToOwner")}
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
