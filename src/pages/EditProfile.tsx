import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGoBack } from "@/hooks/use-go-back";
import { toast } from "sonner";

export default function EditProfile() {
  const navigate = useNavigate();
  const goBack = useGoBack("/profile");
  const { user, profile, updateProfile, signOut } = useAuth();
  const { t } = useLanguage();

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [bio, setBio] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await updateProfile({
        display_name: displayName || null,
      });

      if (error) {
        toast.error(error);
        return;
      }

      toast.success(t("success"));
      navigate("/profile");
    } catch (err) {
      toast.error(t("error"));
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="font-heading text-xl font-bold">{t("editProfile")}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <Card>
            <CardContent className="p-6 flex flex-col items-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.avatarUrl || undefined} />
                  <AvatarFallback className="text-3xl">
                    {displayName?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="icon"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {t("tapToChangePhoto")}
              </p>
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">{t("displayName")}</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("enterYourName")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("phoneNumber")}</Label>
                <Input
                  id="phone"
                  value={profile?.phone || user?.phone || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  {t("phoneCannotChange")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("emailOptional")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("enterYourEmail")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">{t("bioOptional")}</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t("tellAboutYourself")}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-medium">{t("emergencyContact")}</h3>
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">{t("phoneNumber")}</Label>
                <Input
                  id="emergencyContact"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder={t("emergencyContactNumber")}
                />
                <p className="text-xs text-muted-foreground">
                  {t("usedInEmergencies")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("saveChanges")}
          </Button>
        </form>
      </div>
    </Layout>
  );
}
