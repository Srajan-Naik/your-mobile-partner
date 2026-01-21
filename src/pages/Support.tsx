import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  HelpCircle,
  MessageCircle,
  Phone,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Send,
  ExternalLink,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";

const FAQ_ITEMS = [
  {
    question: "How do I report a lost item?",
    answer:
      "Tap the 'Report Lost Item' button on your dashboard. Fill in the item details, location where you lost it, and any information about the auto-rickshaw. Add photos if possible to help drivers identify your item.",
  },
  {
    question: "How does the matching work?",
    answer:
      "Our system matches your lost item report with verified drivers in the area. When a driver responds, you'll receive a notification and can chat with them directly to verify and arrange the return.",
  },
  {
    question: "Is there a fee for using AutoConnect?",
    answer:
      "AutoConnect is free to use. However, we encourage passengers to tip drivers who return their lost items as a token of appreciation.",
  },
  {
    question: "How are drivers verified?",
    answer:
      "Drivers must submit their driver's license, vehicle registration, and a photo for identity verification. Our team reviews these documents before approving drivers on the platform.",
  },
  {
    question: "What if I can't find my item?",
    answer:
      "If no driver responds within 48 hours, your report will remain active but marked as expired. You can also report the loss to local authorities using the emergency contacts in the app.",
  },
  {
    question: "How do I send a tip to a driver?",
    answer:
      "After your item is returned and the conversation is marked as resolved, you'll have the option to rate the driver and send a tip as a thank you.",
  },
];

export default function Support() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [feedbackType, setFeedbackType] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackType || !feedbackMessage.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Thank you for your feedback!");
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
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-heading text-xl font-bold">Help & Support</h1>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="p-4 text-center">
              <MessageCircle className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-medium text-sm">Live Chat</p>
              <p className="text-xs text-muted-foreground">Chat with support</p>
            </CardContent>
          </Card>

          <Link to="/emergency">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors h-full">
              <CardContent className="p-4 text-center">
                <Phone className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="font-medium text-sm">Emergency</p>
                <p className="text-xs text-muted-foreground">Quick contacts</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Frequently Asked Questions
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
            <CardTitle className="text-base">Send Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="feedbackType">Type</Label>
                <Select value={feedbackType} onValueChange={setFeedbackType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select feedback type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Bug Report</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="general">General Feedback</SelectItem>
                    <SelectItem value="complaint">Complaint</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Tell us what's on your mind..."
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "Sending..." : "Send Feedback"}
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
                <p className="font-medium">Report Abuse</p>
                <p className="text-sm text-muted-foreground">
                  Report suspicious activity or harassment
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
