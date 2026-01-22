import { Link } from "react-router-dom";
import {
  Bell,
  MessageCircle,
  Users,
  Gift,
  AlertCircle,
  Trash2,
  CheckCheck,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useClearAllNotifications,
  Notification,
} from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export default function Notifications() {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();
  const clearAll = useClearAllNotifications();

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "match":
        return <Users className="h-5 w-5 text-primary" />;
      case "message":
        return <MessageCircle className="h-5 w-5 text-primary" />;
      case "reward":
        return <Gift className="h-5 w-5 text-success" />;
      case "system":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markRead.mutate(notification.id);
    }
  };

  return (
    <Layout
      userType={user?.userType || "passenger"}
      userName={user?.name || ""}
      onLogout={signOut}
    >
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold">{t("notifications")}</h1>
          {notifications && notifications.length > 0 && (
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  {t("readAll")}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearAll.mutate()}
                disabled={clearAll.isPending}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {t("clear")}
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <LoadingSkeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : notifications?.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-1">{t("noNotifications")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("allCaughtUp")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications?.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
                onDelete={() => deleteNotification.mutate(notification.id)}
                icon={getNotificationIcon(notification.type)}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

interface NotificationCardProps {
  notification: Notification;
  onClick: () => void;
  onDelete: () => void;
  icon: React.ReactNode;
}

function NotificationCard({
  notification,
  onClick,
  onDelete,
  icon,
}: NotificationCardProps) {
  const content = (
    <Card
      className={cn(
        "transition-colors",
        !notification.is_read && "bg-primary/5 border-primary/20"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-muted shrink-0">{icon}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p
                className={cn(
                  "font-medium",
                  !notification.is_read && "text-primary"
                )}
              >
                {notification.title}
              </p>
              {!notification.is_read && (
                <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {notification.body}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (notification.action_url) {
    return (
      <Link to={notification.action_url} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return <div onClick={onClick}>{content}</div>;
}
