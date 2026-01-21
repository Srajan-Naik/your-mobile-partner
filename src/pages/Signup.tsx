import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Phone, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
  signupSchema,
  type SignupFormData,
  calculatePasswordStrength,
  normalizePhone,
} from "@/lib/validations/auth";
import { toast } from "sonner";

type UserType = "passenger" | "driver";

export default function Signup() {
  const navigate = useNavigate();
  const { signUp, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      phone: "",
      password: "",
      confirmPassword: "",
      userType: "passenger",
      termsAccepted: false as any, // Will be validated as literal true
    },
  });

  const password = form.watch("password");
  const confirmPassword = form.watch("confirmPassword");
  const userType = form.watch("userType");
  const { score, label, color } = calculatePasswordStrength(password);

  const onSubmit = async (data: SignupFormData) => {
    const normalizedPhone = normalizePhone(data.phone);
    const { error } = await signUp(normalizedPhone, data.password, data.userType);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success("Account created! Please verify your phone number.");
    navigate("/verify-phone");
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
              onClick={() => form.setValue("userType", type)}
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 px-6 space-y-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="+91 98765 43210"
                      className="pl-10"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={cn(
                            "h-1 flex-1 rounded-full transition-colors",
                            level <= score
                              ? score === 1
                                ? "bg-destructive"
                                : score === 2
                                ? "bg-yellow-500"
                                : "bg-success"
                              : "bg-muted"
                          )}
                        />
                      ))}
                    </div>
                    <p
                      className={cn(
                        "text-xs capitalize",
                        score === 1 && "text-destructive",
                        score === 2 && "text-yellow-600",
                        score === 3 && "text-success"
                      )}
                    >
                      {label}
                    </p>
                  </div>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      className="pr-10"
                      {...field}
                    />
                    {confirmPassword && password === confirmPassword && (
                      <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-success" />
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="termsAccepted"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-3 pt-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <label className="text-sm leading-tight text-muted-foreground">
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
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner size="sm" /> : "Create Account"}
          </Button>
        </form>
      </Form>

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
