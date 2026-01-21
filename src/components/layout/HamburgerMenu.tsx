import {
  AlertTriangle,
  FileText,
  HelpCircle,
  LogOut,
  Settings,
  User,
  Phone,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MenuItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  variant?: "default" | "destructive";
}

const quickActions: MenuItemProps[] = [
  { icon: FileText, label: "Report Lost Item", path: "/report-item" },
  { icon: Phone, label: "Emergency Contacts", path: "/emergency" },
];

const menuItems: MenuItemProps[] = [
  { icon: User, label: "Profile", path: "/profile" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: HelpCircle, label: "Help & Support", path: "/support" },
  { icon: AlertTriangle, label: "Report Abuse", path: "/report-abuse" },
];

interface HamburgerMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName?: string;
  userEmail?: string;
  userType?: "passenger" | "driver";
  onLogout?: () => void;
}

export function HamburgerMenu({
  open,
  onOpenChange,
  userName = "User",
  userEmail = "",
  userType = "passenger",
  onLogout,
}: HamburgerMenuProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <User className="h-6 w-6" />
            </div>
            <div className="flex flex-col items-start">
              <SheetTitle className="text-lg">{userName}</SheetTitle>
              {userEmail && (
                <span className="text-sm text-muted-foreground">{userEmail}</span>
              )}
              <span className="mt-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                {userType}
              </span>
            </div>
          </div>
        </SheetHeader>

        <Separator />

        {/* Quick Actions */}
        <div className="p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quick Actions
          </h3>
          <div className="space-y-1">
            {quickActions.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                )}
                activeClassName="bg-accent text-accent-foreground"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        <Separator />

        {/* Main Menu */}
        <div className="p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Account
          </h3>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                )}
                activeClassName="bg-accent text-accent-foreground"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        <Separator />

        {/* Logout */}
        <div className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              onLogout?.();
              onOpenChange(false);
            }}
          >
            <LogOut className="h-5 w-5" />
            Log out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
