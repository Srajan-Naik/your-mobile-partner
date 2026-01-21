import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Phone, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type UserType = "passenger" | "driver";

export default function Signup() {
  const navigate = useNavigate();
  const { signup, isLoading } = useAuth();
  
  const [userType, setUserType] = useState<UserType>("passenger");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");

  const passwordStrength = () => {
    if (password.length === 0) return { strength: 0, label: "" };
    if (password.length < 6) return { strength: 1, label: "Weak" };
    if (password.length < 10) return { strength: 2, label: "Medium" };
    if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 3, label: "Strong" };
    }
    return { strength: 2, label: "Medium" };
  };

  const { strength, label } = passwordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!phone || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!termsAccepted) {
      setError("Please accept the terms and conditions");
      return;
    }

    try {
      await signup(phone, password, userType);
      navigate("/verify-phone");
    } catch (err) {
      setError("Failed to create account. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex flex-col items-center pt-10 pb-6 px-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary mb-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7 text-primary-foreground"
          >
            <path d="M7 13 L12 7 L17 13" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
        </div>
        <h1 className="font-heading text-2xl font-bold">Create account</h1>
        <p className="text-muted-foreground mt-1 text-sm">Join AutoConnect today</p>
      </div>

      {/* User Type Toggle */}
      <div className="px-6 mb-6">
        <div className="flex rounded-lg bg-muted p-1">
          {(["passenger", "driver"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setUserType(type)}
              className={cn(
                "flex-1 rounded-md py-2.5 text-sm font-medium transition-all",
                userType === type
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {type === "passenger" ? "I'm a Passenger" : "I'm a Driver"}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 px-6 space-y-4">
        <FormField label="Phone Number" required>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pl-10"
            />
          </div>
        </FormField>

        <FormField label="Password" required>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      level <= strength
                        ? strength === 1
                          ? "bg-destructive"
                          : strength === 2
                          ? "bg-yellow-500"
                          : "bg-success"
                        : "bg-muted"
                    )}
                  />
                ))}
              </div>
              <p className={cn(
                "text-xs",
                strength === 1 && "text-destructive",
                strength === 2 && "text-yellow-600",
                strength === 3 && "text-success"
              )}>
                {label}
              </p>
            </div>
          )}
        </FormField>

        <FormField label="Confirm Password" required>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pr-10"
            />
            {confirmPassword && password === confirmPassword && (
              <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-success" />
            )}
          </div>
        </FormField>

        <div className="flex items-start gap-3 pt-2">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
          />
          <label htmlFor="terms" className="text-sm leading-tight text-muted-foreground">
            I agree to the{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </label>
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <Button
          type="submit"
          className="w-full h-12 text-base font-medium"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner size="sm" /> : "Create Account"}
        </Button>
      </form>

      {/* Footer */}
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
