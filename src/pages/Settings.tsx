import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  ArrowLeft,
  Moon,
  Sun,
  MapPin,
  Globe,
  Shield,
  LogOut,
  ChevronRight,
  Smartphone,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const [locationServices, setLocationServices] = useState(true);

  const isDarkMode = theme === "dark";

  const handleDarkModeChange = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
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
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-heading text-xl font-bold">{t("settings")}</h1>
        </div>

        {/* Location Services */}
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{t("locationServices")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("locationServicesDesc")}
                  </p>
                </div>
              </div>
              <Switch
                checked={locationServices}
                onCheckedChange={setLocationServices}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  {isDarkMode ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{t("darkMode")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("darkModeDesc")}
                  </p>
                </div>
              </div>
              <Switch checked={isDarkMode} onCheckedChange={handleDarkModeChange} />
            </div>

            <Separator />

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{t("language")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("languageDesc")}
                  </p>
                </div>
              </div>
              <Select value={language} onValueChange={(val) => setLanguage(val as "en" | "kn")}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="kn">ಕನ್ನಡ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardContent className="p-0">
            <button
              className="flex items-center justify-between p-4 w-full hover:bg-muted/50 transition-colors"
              onClick={() => {}}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">{t("privacySettings")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("privacySettingsDesc")}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">AutoConnect</p>
                <p className="text-sm text-muted-foreground">{t("appVersion")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t("logOut")}
        </Button>
      </div>
    </Layout>
  );
}
