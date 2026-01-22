import { useState } from "react";
import { Wallet, ArrowUpRight, ArrowDownLeft, Gift, History } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTransactions, useUserBalance, Transaction } from "@/hooks/use-transactions";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Rewards() {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const { data: balance, isLoading: balanceLoading } = useUserBalance();
  const { data: transactions, isLoading: txLoading } = useTransactions();

  const isDriver = user?.userType === "driver";

  const receivedTips = transactions?.filter(
    (tx) => tx.to_user_id === user?.id && tx.type === "tip"
  ) || [];

  const sentTips = transactions?.filter(
    (tx) => tx.from_user_id === user?.id && tx.type === "tip"
  ) || [];

  return (
    <Layout
      userType={user?.userType || "passenger"}
      userName={user?.name || ""}
      onLogout={signOut}
    >
      <div className="p-4 space-y-6">
        <h1 className="font-heading text-2xl font-bold">{t("rewards")}</h1>

        {/* Balance Card */}
        <Card className="gradient-primary text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-white/20">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-80">
                  {isDriver ? t("totalEarnings") : t("tipsSent")}
                </p>
                {balanceLoading ? (
                  <LoadingSkeleton className="h-8 w-24 bg-white/20" />
                ) : (
                  <p className="text-3xl font-bold">
                    ₹{Math.abs(balance || 0).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {isDriver && (
              <Button variant="secondary" className="w-full">
                {t("withdrawFunds")}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Gift className="h-6 w-6 text-success mx-auto mb-2" />
              <p className="text-xl font-bold">{receivedTips.length}</p>
              <p className="text-xs text-muted-foreground">{t("tipsReceived")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <History className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-xl font-bold">{transactions?.length || 0}</p>
              <p className="text-xs text-muted-foreground">{t("totalTransactions")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("transactionHistory")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="all">
              <TabsList className="w-full justify-start px-4 pt-2">
                <TabsTrigger value="all">{t("all")}</TabsTrigger>
                <TabsTrigger value="received">{t("received")}</TabsTrigger>
                <TabsTrigger value="sent">{t("sent")}</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-0">
                <TransactionList
                  transactions={transactions || []}
                  isLoading={txLoading}
                  userId={user?.id}
                  t={t}
                />
              </TabsContent>

              <TabsContent value="received" className="mt-0">
                <TransactionList
                  transactions={receivedTips}
                  isLoading={txLoading}
                  userId={user?.id}
                  t={t}
                />
              </TabsContent>

              <TabsContent value="sent" className="mt-0">
                <TransactionList
                  transactions={sentTips}
                  isLoading={txLoading}
                  userId={user?.id}
                  t={t}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function TransactionList({
  transactions,
  isLoading,
  userId,
  t,
}: {
  transactions: Transaction[];
  isLoading: boolean;
  userId: string | undefined;
  t: (key: string) => string;
}) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <LoadingSkeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center">
        <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">{t("noTransactionsYet")}</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {transactions.map((tx) => {
        const isReceived = tx.to_user_id === userId;
        return (
          <div key={tx.id} className="flex items-center gap-3 p-4">
            <div
              className={cn(
                "p-2 rounded-full",
                isReceived ? "bg-success/10" : "bg-destructive/10"
              )}
            >
              {isReceived ? (
                <ArrowDownLeft className="h-5 w-5 text-success" />
              ) : (
                <ArrowUpRight className="h-5 w-5 text-destructive" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium">
                {isReceived ? t("tipReceived") : t("tipSent")}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(tx.created_at), "MMM d, yyyy • h:mm a")}
              </p>
            </div>

            <div className="text-right">
              <p
                className={cn(
                  "font-bold",
                  isReceived ? "text-success" : "text-foreground"
                )}
              >
                {isReceived ? "+" : "-"}₹{Number(tx.amount).toLocaleString()}
              </p>
              <Badge
                variant={tx.status === "completed" ? "secondary" : "outline"}
                className="text-xs"
              >
                {tx.status}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}
