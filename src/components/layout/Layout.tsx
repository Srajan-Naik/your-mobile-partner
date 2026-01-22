import * as React from "react";
import { Header } from "./Header";
import { BottomTabBar } from "./BottomTabBar";
import { HamburgerMenu } from "./HamburgerMenu";

interface LayoutProps {
  children: React.ReactNode;
  userType?: "passenger" | "driver";
  userName?: string;
  userEmail?: string;
  notificationCount?: number;
  showBottomNav?: boolean;
  showHeader?: boolean;
  onLogout?: () => void;
}

const Layout = React.forwardRef<HTMLDivElement, LayoutProps>(
  (
    {
      children,
      userType = "passenger",
      userName,
      userEmail,
      notificationCount = 0,
      showBottomNav = true,
      showHeader = true,
      onLogout,
    },
    ref
  ) => {
    const [menuOpen, setMenuOpen] = React.useState(false);

    return (
      <div ref={ref} className="flex min-h-screen flex-col bg-background">
        {showHeader && (
          <Header
            onMenuClick={() => setMenuOpen(true)}
            notificationCount={notificationCount}
          />
        )}

        <HamburgerMenu
          open={menuOpen}
          onOpenChange={setMenuOpen}
          userName={userName}
          userEmail={userEmail}
          userType={userType}
          onLogout={onLogout}
        />

        <main className={`flex-1 ${showBottomNav ? "pb-20" : ""}`}>
          {children}
        </main>

        {showBottomNav && <BottomTabBar userType={userType} />}
      </div>
    );
  }
);
Layout.displayName = "Layout";

export { Layout };
