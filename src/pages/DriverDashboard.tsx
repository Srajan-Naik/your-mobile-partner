import { Link } from "react-router-dom";
import { FileSearch, DollarSign, Star, ToggleLeft, ToggleRight } from "lucide-react";
import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

export default function DriverDashboard() {
  const { user, signOut } = useAuth();
  const [isOnline, setIsOnline] = useState(false);

  return (
    <Layout userType="driver" userName={user?.name || "Driver"} onLogout={signOut}>
      <div className="p-4 space-y-6">
        {/* Header with Online Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Driver Dashboard</h1>
            <Badge variant={isOnline ? "default" : "secondary"} className="mt-1">
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOnline(!isOnline)}
            className="h-12 w-12"
          >
            {isOnline ? (
              <ToggleRight className="h-8 w-8 text-success" />
            ) : (
              <ToggleLeft className="h-8 w-8 text-muted-foreground" />
            )}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10 text-success">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">₹1,250</p>
                <p className="text-xs text-muted-foreground">This Month</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">4.8</p>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Browse Reports */}
        <Button asChild variant="outline" className="w-full h-14 text-base font-medium gap-2">
          <Link to="/driver/reports">
            <FileSearch className="h-5 w-5" />
            Browse Lost Item Reports
          </Link>
        </Button>
      </div>
    </Layout>
  );
}
