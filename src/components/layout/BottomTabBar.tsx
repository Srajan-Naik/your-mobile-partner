import { Home, FileText, MessageCircle, User, MoreHorizontal } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

interface TabItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

const passengerTabs: TabItem[] = [
  { icon: Home, label: "Home", path: "/passenger/dashboard" },
  { icon: FileText, label: "Reports", path: "/my-reports" },
  { icon: MessageCircle, label: "Chat", path: "/chat" },
  { icon: User, label: "Profile", path: "/profile" },
  { icon: MoreHorizontal, label: "More", path: "/more" },
];

const driverTabs: TabItem[] = [
  { icon: Home, label: "Home", path: "/driver/dashboard" },
  { icon: FileText, label: "Reports", path: "/driver/reports" },
  { icon: MessageCircle, label: "Chat", path: "/chat" },
  { icon: User, label: "Profile", path: "/profile" },
  { icon: MoreHorizontal, label: "More", path: "/more" },
];

interface BottomTabBarProps {
  userType?: "passenger" | "driver";
}

export function BottomTabBar({ userType = "passenger" }: BottomTabBarProps) {
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
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
