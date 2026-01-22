import { Link } from "react-router-dom";
import {
  User,
  Phone,
  Mail,
  Shield,
  Star,
  Edit,
  ChevronRight,
  FileText,
  Award,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserAverageRating } from "@/hooks/use-reviews";
import { useDriverVerification } from "@/hooks/use-driver-verification";
import { useLostItems } from "@/hooks/use-lost-items";

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const { t } = useLanguage();
  const { data: rating } = useUserAverageRating(user?.id);
  const { data: verification } = useDriverVerification();
  const { data: reports } = useLostItems();

  const isDriver = user?.userType === "driver";
  const resolvedCount = reports?.filter((r) => r.status === "resolved").length || 0;
  const totalCount = reports?.length || 0;

  const getVerificationBadge = () => {
    if (!isDriver) return null;
    
    switch (verification?.status) {
      case "approved":
        return <Badge className="bg-success">{t("verified")}</Badge>;
      case "submitted":
        return <Badge variant="secondary">{t("underReview")}</Badge>;
      case "rejected":
        return <Badge variant="destructive">{t("rejected")}</Badge>;
      default:
        return <Badge variant="outline">{t("notVerified")}</Badge>;
    }
  };

  return (
    <Layout
      userType={user?.userType || "passenger"}
      userName={user?.name || ""}
      onLogout={signOut}
    >
      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.avatarUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-heading text-xl font-bold">
                    {profile?.display_name || "User"}
                  </h1>
                  {getVerificationBadge()}
                </div>

                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                  <Badge variant="outline" className="text-xs">
                    {isDriver ? t("driver") : t("passenger")}
                  </Badge>
                </div>

                {rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{rating.average.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">
                      ({rating.count} {t("reviews")})
                    </span>
                  </div>
                )}
              </div>

              <Button variant="ghost" size="icon" asChild>
                <Link to="/profile/edit">
                  <Edit className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{totalCount}</p>
              <p className="text-xs text-muted-foreground">
                {isDriver ? t("itemsReturned") : t("reportsFiled")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{resolvedCount}</p>
              <p className="text-xs text-muted-foreground">{t("resolved")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Info */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="font-medium">{t("contactInformation")}</h2>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("phone")}</p>
                  <p className="font-medium">{profile?.phone || user?.phone || t("notSet")}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("email")}</p>
                  <p className="font-medium">{user?.email || t("notSet")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardContent className="p-0">
            {isDriver && (
              <>
                <Link
                  to="/driver/verification"
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">{t("verificationStatus")}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
                <Separator />
              </>
            )}

            <Link
              to={isDriver ? "/driver/reports" : "/my-reports"}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium">
                  {isDriver ? t("availableReports") : t("myReports")}
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>

            <Separator />

            <Link
              to="/rewards"
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Award className="h-4 w-4 text-success" />
                </div>
                <span className="font-medium">{t("rewardsAndTips")}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
