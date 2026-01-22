import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [locationServices, setLocationServices] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");

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
          <h1 className="font-heading text-xl font-bold">Settings</h1>
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
                  <p className="font-medium">Location Services</p>
                  <p className="text-sm text-muted-foreground">
                    Enable for better item matching
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
                  {darkMode ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark theme
                  </p>
                </div>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>

            <Separator />

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Language</p>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred language
                  </p>
                </div>
              </div>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिंदी</SelectItem>
                  <SelectItem value="ta">தமிழ்</SelectItem>
                  <SelectItem value="te">తెలుగు</SelectItem>
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
                  <p className="font-medium">Privacy Settings</p>
                  <p className="text-sm text-muted-foreground">
                    Manage your data and privacy
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
                <p className="text-sm text-muted-foreground">Version 1.0.0</p>
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
          Log Out
        </Button>
      </div>
    </Layout>
  );
}
