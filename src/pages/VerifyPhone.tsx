import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const OTP_LENGTH = 6;

export default function VerifyPhone() {
  const navigate = useNavigate();
  const { verifyPhone, user, isLoading } = useAuth();
  
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    // Countdown timer for resend
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (index === OTP_LENGTH - 1 && value) {
      const fullOtp = newOtp.join("");
      if (fullOtp.length === OTP_LENGTH) {
        handleVerify(fullOtp);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    const newOtp = [...otp];
    
    pasted.split("").forEach((char, i) => {
      if (i < OTP_LENGTH) {
        newOtp[i] = char;
      }
    });
    
    setOtp(newOtp);
    
    if (pasted.length === OTP_LENGTH) {
      handleVerify(pasted);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  const handleVerify = async (code: string) => {
    setError("");
    setIsVerifying(true);
    
    try {
      const success = await verifyPhone(code);
      if (success) {
        const redirectPath = user?.userType === "driver" 
          ? "/driver/verification" 
          : "/passenger/dashboard";
        navigate(redirectPath);
      } else {
        setError("Invalid verification code. Please try again.");
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = () => {
    // TODO: Implement resend OTP
    setResendTimer(30);
    setError("");
    setOtp(Array(OTP_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length === OTP_LENGTH) {
      handleVerify(code);
    } else {
      setError("Please enter the complete verification code");
    }
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
          <h2 className="font-heading text-xl font-semibold mb-2">Enter verification code</h2>
          <p className="text-sm text-muted-foreground">
            We've sent a 6-digit code to{" "}
            <span className="font-medium text-foreground">{user?.phone || "your phone"}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* OTP Input */}
          <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="h-14 w-11 rounded-lg border-2 border-input bg-background text-center text-xl font-semibold transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                disabled={isVerifying || isLoading}
              />
            ))}
          </div>

          {error && (
            <p className="text-sm text-destructive text-center mb-4">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            disabled={isVerifying || isLoading || otp.join("").length !== OTP_LENGTH}
          >
            {isVerifying ? <LoadingSpinner size="sm" /> : "Verify"}
          </Button>
        </form>

        {/* Resend */}
        <div className="mt-6 text-center">
          {resendTimer > 0 ? (
            <p className="text-sm text-muted-foreground">
              Resend code in <span className="font-medium text-foreground">{resendTimer}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-sm font-medium text-primary hover:underline"
            >
              Resend verification code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
