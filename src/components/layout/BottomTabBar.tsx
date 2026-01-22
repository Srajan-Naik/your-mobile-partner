import { Home, FileText, MessageCircle, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface TabItem {
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  path: string;
}

const passengerTabs: TabItem[] = [
  { icon: Home, labelKey: "home", path: "/passenger/dashboard" },
  { icon: FileText, labelKey: "reports", path: "/my-reports" },
  { icon: MessageCircle, labelKey: "chat", path: "/conversations" },
  { icon: User, labelKey: "profile", path: "/profile" },
];

const driverTabs: TabItem[] = [
  { icon: Home, labelKey: "home", path: "/driver/dashboard" },
  { icon: FileText, labelKey: "reports", path: "/driver/reports" },
  { icon: MessageCircle, labelKey: "chat", path: "/conversations" },
  { icon: User, labelKey: "profile", path: "/profile" },
];

interface BottomTabBarProps {
  userType?: "passenger" | "driver";
}

export function BottomTabBar({ userType = "passenger" }: BottomTabBarProps) {
  const { t } = useLanguage();
  const tabs = userType === "driver" ? driverTabs : passengerTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-bottom">
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-muted-foreground transition-colors hover:text-foreground"
            )}
            activeClassName="text-primary"
          >
            {({ isActive }) => (
              <>
                <tab.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                <span className={cn("text-xs font-medium", isActive && "text-primary")}>
                  {t(tab.labelKey)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
