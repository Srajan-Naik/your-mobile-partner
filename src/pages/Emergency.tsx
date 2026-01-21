import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Shield, Car, AlertTriangle, ExternalLink } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

const EMERGENCY_CONTACTS = [
  {
    name: "Police Emergency",
    number: "100",
    description: "For immediate police assistance",
    icon: Shield,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  {
    name: "Women Helpline",
    number: "1091",
    description: "24/7 women safety helpline",
    icon: Phone,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    name: "Transport Authority",
    number: "1800-180-1947",
    description: "Regional Transport Office helpline",
    icon: Car,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    name: "AutoConnect Support",
    number: "+91-1800-XXX-XXXX",
    description: "24/7 app support (toll-free)",
    icon: Phone,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

export default function Emergency() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

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
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-heading text-xl font-bold">Emergency Contacts</h1>
        </div>

        {/* Alert */}
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            If you're in immediate danger, call <strong>100</strong> for police assistance.
          </AlertDescription>
        </Alert>

        {/* Emergency Numbers */}
        <div className="space-y-3">
          {EMERGENCY_CONTACTS.map((contact) => (
            <Card key={contact.name} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center">
                  <div className="flex-1 p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${contact.bgColor}`}>
                        <contact.icon className={`h-6 w-6 ${contact.color}`} />
                      </div>
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {contact.description}
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
            <h3 className="font-medium mb-3">Safety Tips</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Always meet in public, well-lit places when retrieving items
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Verify the driver's identity through the app before meeting
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Share your live location with a trusted contact
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Report any suspicious behavior immediately
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
          Call Police (100)
        </Button>
      </div>
    </Layout>
  );
}
