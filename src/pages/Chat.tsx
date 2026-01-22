import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Send, Image, MapPin, Phone, ArrowLeft, MoreVertical } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useConversation,
  useMessages,
  useSendMessage,
  useMarkMessagesRead,
  Message,
} from "@/hooks/use-conversations";
import { useRealtimeMessages } from "@/hooks/use-realtime";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";

export default function Chat() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversation, isLoading: conversationLoading } = useConversation(conversationId);
  const { data: messages, isLoading: messagesLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const markRead = useMarkMessagesRead();

  // Enable real-time message updates
  useRealtimeMessages(conversationId);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (conversationId) {
      markRead.mutate(conversationId);
    }
  }, [conversationId, messages]);

  const handleSend = () => {
    if (!message.trim() || !conversationId) return;

    sendMessage.mutate({
      conversationId,
      content: message.trim(),
      messageType: "text",
    });
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageDate = (date: Date) => {
    if (isToday(date)) return t("today");
    if (isYesterday(date)) return t("yesterday");
    return format(date, "MMMM d, yyyy");
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";

    messages.forEach((msg) => {
      const msgDate = formatMessageDate(new Date(msg.created_at));
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  if (conversationLoading) {
    return (
      <Layout userType={user?.userType || "passenger"} userName={user?.name || ""} onLogout={signOut}>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!conversation) {
    return (
      <Layout userType={user?.userType || "passenger"} userName={user?.name || ""} onLogout={signOut}>
        <div className="p-4 text-center">
          <p className="text-muted-foreground">{t("conversationNotFound")}</p>
          <Button asChild variant="link">
            <Link to="/conversations">{t("backToConversations")}</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const otherUserName = conversation.other_user_profile?.display_name || "User";
  const messageGroups = groupMessagesByDate(messages || []);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/conversations">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>

        <Avatar className="h-10 w-10">
          <AvatarImage src={conversation.other_user_profile?.avatar_url || undefined} />
          <AvatarFallback>{otherUserName[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{otherUserName}</p>
          <p className="text-xs text-muted-foreground truncate">
            {conversation.lost_item?.title}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            const phone = conversation.other_user_profile?.phone;
            if (phone) {
              window.location.href = `tel:${phone}`;
            }
          }}
          disabled={!conversation.other_user_profile?.phone}
          title={conversation.other_user_profile?.phone ? t("callUser") : t("phoneNotAvailable")}
        >
          <Phone className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            <DropdownMenuItem asChild>
              <Link to={`/report/${conversation.lost_item_id}`}>{t("viewReport")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>{t("reportIssue")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Lost Item Context Card */}
        <Card className="p-3 bg-muted/50">
          <p className="text-sm text-muted-foreground">
            {t("conversationAbout")}{" "}
            <Link to={`/report/${conversation.lost_item_id}`} className="text-primary hover:underline">
              {conversation.lost_item?.title}
            </Link>
          </p>
        </Card>

        {messagesLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : messages?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{t("noMessagesYet")}</p>
            <p className="text-sm">{t("startConversation")}</p>
          </div>
        ) : (
          messageGroups.map((group) => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center gap-2 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{group.date}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Messages */}
              <div className="space-y-2">
                {group.messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2",
                          isOwn
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        )}
                      >
                        {msg.message_type === "text" && (
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        )}
                        {msg.message_type === "location" && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm">{t("sharedLocation")}</span>
                          </div>
                        )}
                        {msg.message_type === "image" && (
                          <div className="flex items-center gap-2">
                            <Image className="h-4 w-4" />
                            <span className="text-sm">{t("sharedImage")}</span>
                          </div>
                        )}
                        <p
                          className={cn(
                            "text-xs mt-1",
                            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}
                        >
                          {format(new Date(msg.created_at), "h:mm a")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-card safe-bottom">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0">
            <Image className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="shrink-0">
            <MapPin className="h-5 w-5" />
          </Button>
          <Input
            placeholder={t("typeMessage")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim() || sendMessage.isPending}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
