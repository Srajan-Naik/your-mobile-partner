import { useState } from "react";
import { ArrowLeft, AlertTriangle, Send, Shield } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGoBack } from "@/hooks/use-go-back";
import { toast } from "sonner";

export default function ReportAbuse() {
  const goBack = useGoBack();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [abuseType, setAbuseType] = useState("");
  const [description, setDescription] = useState("");
  const [userInvolved, setUserInvolved] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ABUSE_TYPES = [
    { value: "harassment", label: t("harassment") || "Harassment" },
    { value: "fraud", label: t("fraud") || "Fraud / Scam" },
    { value: "inappropriate", label: t("inappropriateBehavior") || "Inappropriate Behavior" },
    { value: "fake_profile", label: t("fakeProfile") || "Fake Profile" },
    { value: "safety", label: t("safetyConcern") || "Safety Concern" },
    { value: "other", label: t("other") || "Other" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!abuseType || !description.trim()) {
      toast.error(t("pleaseFillRequired") || "Please fill in required fields");
      return;
    }

    setIsSubmitting(true);
    // Simulate API call - in production, this would submit to your backend
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success(t("reportSubmitted") || "Report submitted successfully. We will review it shortly.");
    setAbuseType("");
    setDescription("");
    setUserInvolved("");
    setIsSubmitting(false);
  };

  return (
    <Layout
      userType={user?.userType || "passenger"}
      userName={user?.name || ""}
      onLogout={signOut}
    >
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-heading text-xl font-bold">{t("reportAbuse") || "Report Abuse"}</h1>
        </div>

        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">{t("yourSafetyMatters") || "Your Safety Matters"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("reportAbuseInfo") || "Reports are reviewed within 24 hours. For immediate danger, contact local authorities."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Form */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t("submitReport") || "Submit a Report"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="abuse-type">{t("typeOfAbuse") || "Type of Abuse"} *</Label>
                <Select value={abuseType} onValueChange={setAbuseType}>
                  <SelectTrigger id="abuse-type">
                    <SelectValue placeholder={t("selectType") || "Select type..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {ABUSE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-involved">{t("userInvolved") || "User/Driver Involved (if known)"}</Label>
                <Input
                  id="user-involved"
                  placeholder={t("enterNameOrId") || "Enter name or ID..."}
                  value={userInvolved}
                  onChange={(e) => setUserInvolved(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("description")} *</Label>
                <Textarea
                  id="description"
                  placeholder={t("describeIncident") || "Describe the incident in detail..."}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {t("includeDetails") || "Include dates, times, and any relevant details."}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !abuseType || !description.trim()}
              >
                {isSubmitting ? (
                  t("submitting") || "Submitting..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {t("submitReport") || "Submit Report"}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Emergency Notice */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-sm">{t("immediateEmergency") || "Immediate Emergency?"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("callAuthorities") || "If you're in immediate danger, please call local emergency services (100/112) immediately."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
