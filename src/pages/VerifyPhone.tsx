import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "sonner";
import { formatPhoneDisplay } from "@/lib/validations/auth";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function VerifyPhone() {
  const navigate = useNavigate();
  const { verifyOtp, resendOtp, pendingPhone, user, isLoading, profile } = useAuth();

  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const phone = pendingPhone || user?.phone || "";

  // Redirect if already verified
  useEffect(() => {
    if (user?.isVerified) {
      const redirectPath =
        profile?.user_type === "driver"
          ? "/driver/verification"
          : "/passenger/dashboard";
      navigate(redirectPath, { replace: true });
    }
  }, [user?.isVerified, profile?.user_type, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Handle OTP change
  const handleOtpChange = (value: string) => {
    setOtp(value);

    // Auto-submit when complete
    if (value.length === OTP_LENGTH) {
      handleVerify(value);
    }
  };

  // Verify OTP
  const handleVerify = async (code: string) => {
    if (code.length !== OTP_LENGTH) {
      toast.error("Please enter the complete verification code");
      return;
    }

    if (!phone) {
      toast.error("Phone number not found. Please try signing up again.");
      navigate("/signup");
      return;
    }

    setIsVerifying(true);

    try {
      const { error, success } = await verifyOtp(phone, code);

      if (success) {
        toast.success("Phone verified successfully!");
        const redirectPath =
          profile?.user_type === "driver"
            ? "/driver/verification"
            : "/passenger/dashboard";
        navigate(redirectPath, { replace: true });
      } else {
        toast.error(error || "Invalid verification code. Please try again.");
        setOtp("");
      }
    } catch (err) {
      toast.error("Verification failed. Please try again.");
      setOtp("");
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (!phone) {
      toast.error("Phone number not found.");
      return;
    }

    setIsResending(true);

    try {
      const { error } = await resendOtp(phone);

      if (error) {
        toast.error(error);
      } else {
        toast.success("Verification code sent!");
        setResendTimer(RESEND_COOLDOWN);
        setOtp("");
      }
    } catch (err) {
      toast.error("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(otp);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-heading text-lg font-semibold">Verify Phone</h1>
      </header>

      {/* Content */}
      <div className="flex-1 px-6 pt-8">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-primary"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>
          <h2 className="font-heading text-xl font-semibold mb-2">
            Enter verification code
          </h2>
          <p className="text-sm text-muted-foreground">
            We've sent a 6-digit code to{" "}
            <span className="font-medium text-foreground">
              {phone ? formatPhoneDisplay(phone) : "your phone"}
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* OTP Input */}
          <div className="flex justify-center mb-6">
            <InputOTP
              value={otp}
              onChange={handleOtpChange}
              maxLength={OTP_LENGTH}
              disabled={isVerifying || isLoading}
            >
              <InputOTPGroup>
                {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="h-14 w-11 text-xl font-semibold"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            disabled={isVerifying || isLoading || otp.length !== OTP_LENGTH}
          >
            {isVerifying ? <LoadingSpinner size="sm" /> : "Verify"}
          </Button>
        </form>

        {/* Resend */}
        <div className="mt-6 text-center">
          {resendTimer > 0 ? (
            <p className="text-sm text-muted-foreground">
              Resend code in{" "}
              <span className="font-medium text-foreground">{resendTimer}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
            >
              {isResending ? "Sending..." : "Resend verification code"}
            </button>
          )}
        </div>

        {/* Debug info for development */}
        {import.meta.env.DEV && (
          <div className="mt-8 p-4 bg-muted rounded-lg text-xs text-muted-foreground">
            <p className="font-medium mb-1">Debug Info (dev only):</p>
            <p>Phone: {phone || "not set"}</p>
            <p>Pending: {pendingPhone || "none"}</p>
            <p className="mt-2 text-yellow-600">
              Note: Phone auth requires Supabase phone provider setup. For testing,
              use the Supabase dashboard to manually verify users.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
