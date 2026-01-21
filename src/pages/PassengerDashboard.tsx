import { Link } from "react-router-dom";
import { FileText, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

export default function PassengerDashboard() {
  const { user, signOut } = useAuth();

  const stats = [
    { label: "Active Reports", value: 2, icon: Clock, color: "text-primary" },
    { label: "Resolved", value: 5, icon: CheckCircle, color: "text-success" },
  ];

  return (
    <Layout userType="passenger" userName={user?.name || "Passenger"} onLogout={signOut}>
      <div className="p-4 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="font-heading text-2xl font-bold">
            Welcome back{user?.name ? `, ${user.name}` : ""}!
          </h1>
          <p className="text-muted-foreground mt-1">Lost something? We'll help you find it.</p>
        </div>

        {/* Quick Action */}
        <Button asChild className="w-full h-14 text-base font-medium gap-2">
          <Link to="/report-item">
            <FileText className="h-5 w-5" />
            Report Lost Item
          </Link>
        </Button>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Emergency */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="font-medium text-sm">Emergency Contacts</p>
                <p className="text-xs text-muted-foreground">Quick access to help</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/emergency">View</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
