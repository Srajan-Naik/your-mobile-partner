import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Shield, Car, AlertTriangle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGoBack } from "@/hooks/use-go-back";

export default function Emergency() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();

  const EMERGENCY_CONTACTS = [
    {
      nameKey: "policeEmergency",
      number: "100",
      descKey: "forImmediatePolice",
      icon: Shield,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      nameKey: "womenHelpline",
      number: "1091",
      descKey: "womenHelplineDesc",
      icon: Phone,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      nameKey: "transportAuthority",
      number: "1800-180-1947",
      descKey: "transportAuthorityDesc",
      icon: Car,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      nameKey: "autoConnectSupport",
      number: "+91-1800-XXX-XXXX",
      descKey: "autoConnectSupportDesc",
      icon: Phone,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`;
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
          <h1 className="font-heading text-xl font-bold">{t("emergencyContactsTitle")}</h1>
        </div>

        {/* Alert */}
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t("immeditateDanger")} <strong>100</strong> {t("forPoliceAssistance")}
          </AlertDescription>
        </Alert>

        {/* Emergency Numbers */}
        <div className="space-y-3">
          {EMERGENCY_CONTACTS.map((contact) => (
            <Card key={contact.nameKey} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center">
                  <div className="flex-1 p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${contact.bgColor}`}>
                        <contact.icon className={`h-6 w-6 ${contact.color}`} />
                      </div>
                      <div>
                        <p className="font-medium">{t(contact.nameKey)}</p>
                        <p className="text-sm text-muted-foreground">
                          {t(contact.descKey)}
                        </p>
                        <p className="text-lg font-bold mt-1">{contact.number}</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="h-full rounded-none border-l px-6"
                    onClick={() => handleCall(contact.number)}
                  >
                    <Phone className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Safety Tips */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">{t("safetyTips")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                {t("safetyTip1")}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                {t("safetyTip2")}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                {t("safetyTip3")}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                {t("safetyTip4")}
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Quick Emergency Button */}
        <Button
          variant="destructive"
          size="lg"
          className="w-full h-14"
          onClick={() => handleCall("100")}
        >
          <Phone className="h-5 w-5 mr-2" />
          {t("callPolice")}
        </Button>
      </div>
    </Layout>
  );
}
