import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  HelpCircle,
  MessageCircle,
  Phone,
  AlertTriangle,
  ChevronRight,
  Send,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGoBack } from "@/hooks/use-go-back";
import { toast } from "sonner";

export default function Support() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [feedbackType, setFeedbackType] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const FAQ_ITEMS = [
    {
      question: t("faqReportItem"),
      answer: t("faqReportItemAnswer"),
    },
    {
      question: t("faqMatching"),
      answer: t("faqMatchingAnswer"),
    },
    {
      question: t("faqFee"),
      answer: t("faqFeeAnswer"),
    },
    {
      question: t("faqDriverVerification"),
      answer: t("faqDriverVerificationAnswer"),
    },
    {
      question: t("faqCantFind"),
      answer: t("faqCantFindAnswer"),
    },
    {
      question: t("faqSendTip"),
      answer: t("faqSendTipAnswer"),
    },
  ];

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackType || !feedbackMessage.trim()) {
      toast.error(t("error"));
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success(t("success") + "!");
    setFeedbackType("");
    setFeedbackMessage("");
    setIsSubmitting(false);
  };

  return (
    <Layout
      userType={user?.userType || "passenger"}
      userName={user?.name || ""}
      onLogout={signOut}
    >
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-heading text-xl font-bold">{t("helpAndSupport")}</h1>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="p-4 text-center">
              <MessageCircle className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-medium text-sm">{t("liveChat")}</p>
              <p className="text-xs text-muted-foreground">{t("chatWithSupport")}</p>
            </CardContent>
          </Card>

          <Link to="/emergency">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors h-full">
              <CardContent className="p-4 text-center">
                <Phone className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="font-medium text-sm">{t("emergency")}</p>
                <p className="text-xs text-muted-foreground">{t("quickContacts")}</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              {t("faq")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Accordion type="single" collapsible className="px-4">
              {FAQ_ITEMS.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-sm">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Feedback Form */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("sendFeedback")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="feedbackType">{t("feedbackType")}</Label>
                <Select value={feedbackType} onValueChange={setFeedbackType}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectFeedbackType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">{t("bugReport")}</SelectItem>
                    <SelectItem value="feature">{t("featureRequest")}</SelectItem>
                    <SelectItem value="general">{t("generalFeedback")}</SelectItem>
                    <SelectItem value="complaint">{t("complaint")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{t("message")}</Label>
                <Textarea
                  id="message"
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder={t("tellUsWhatsOnMind")}
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? t("sendingFeedback") : t("sendFeedbackBtn")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Report Abuse */}
        <Card className="border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{t("reportAbuse")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("reportSuspiciousActivity")}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
