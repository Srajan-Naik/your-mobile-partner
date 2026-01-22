import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useConversations } from "@/hooks/use-conversations";
import { useRealtimeConversations, useRealtimeNotifications } from "@/hooks/use-realtime";
import { formatDistanceToNow } from "date-fns";

export default function Conversations() {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const { data: conversations, isLoading } = useConversations();

  // Enable real-time updates
  useRealtimeConversations();
  useRealtimeNotifications();

  const activeConversations = conversations?.filter((c) => c.status === "active") || [];
  const resolvedConversations = conversations?.filter((c) => c.status !== "active") || [];

  return (
    <Layout
      userType={user?.userType || "passenger"}
      userName={user?.name || ""}
      onLogout={signOut}
    >
      <div className="p-4 space-y-6">
        <h1 className="font-heading text-2xl font-bold">{t("messages")}</h1>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <LoadingSkeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : conversations?.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-1">{t("noConversationsYet")}</h3>
            <p className="text-sm text-muted-foreground">
              {user?.userType === "driver"
                ? t("driverRespondPrompt")
                : t("passengerWaitPrompt")}
            </p>
          </div>
        ) : (
          <>
            {/* Active Conversations */}
            {activeConversations.length > 0 && (
              <div>
                <h2 className="font-medium text-sm text-muted-foreground mb-3">
                  {t("activeConversations")} ({activeConversations.length})
                </h2>
                <div className="space-y-2">
                  {activeConversations.map((conv) => (
                    <ConversationCard key={conv.id} conversation={conv} />
                  ))}
                </div>
              </div>
            )}

            {/* Resolved Conversations */}
            {resolvedConversations.length > 0 && (
              <div>
                <h2 className="font-medium text-sm text-muted-foreground mb-3">
                  {t("resolvedConversations")} ({resolvedConversations.length})
                </h2>
                <div className="space-y-2">
                  {resolvedConversations.map((conv) => (
                    <ConversationCard key={conv.id} conversation={conv} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

interface ConversationCardProps {
  conversation: {
    id: string;
    status: string;
    last_message_at: string | null;
    lost_item?: { title: string; category: string } | null;
    other_user_profile?: { display_name: string | null; avatar_url: string | null } | null;
    last_message?: { content: string | null; message_type: string } | null;
    unread_count?: number;
  };
}

function ConversationCard({ conversation }: ConversationCardProps) {
  const { t } = useLanguage();
  const userName = conversation.other_user_profile?.display_name || "User";
  const lastMessage = conversation.last_message;
  const unreadCount = conversation.unread_count || 0;

  const getLastMessagePreview = () => {
    if (!lastMessage) return t("noMessagesPreview");
    if (lastMessage.message_type === "image") return t("photoPreview");
    if (lastMessage.message_type === "location") return t("locationPreview");
    return lastMessage.content || "";
  };

  return (
    <Link to={`/chat/${conversation.id}`}>
      <Card className="hover:bg-muted/50 transition-colors">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={conversation.other_user_profile?.avatar_url || undefined} />
              <AvatarFallback>{userName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-medium truncate">{userName}</p>
              {conversation.last_message_at && (
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(conversation.last_message_at), {
                    addSuffix: false,
                  })}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {conversation.lost_item?.title}
            </p>
            <p
              className={`text-sm truncate ${
                unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"
              }`}
            >
              {getLastMessagePreview()}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
