import { z } from "zod";

// Phone number validation - must be in international format
export const phoneSchema = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .max(15, "Phone number must be at most 15 digits")
  .regex(/^\+?[1-9]\d{9,14}$/, "Please enter a valid phone number");

// Password validation with strength requirements
export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(72, "Password must be at most 72 characters");

// Strong password for better security
export const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

// Login form schema
export const loginSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
});

// Signup form schema
export const signupSchema = z
  .object({
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    userType: z.enum(["passenger", "driver"]),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms and conditions" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// OTP validation
export const otpSchema = z
  .string()
  .length(6, "OTP must be 6 digits")
  .regex(/^\d{6}$/, "OTP must contain only numbers");

// Types
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;

// Password strength calculator
export function calculatePasswordStrength(password: string): {
  score: number;
  label: "weak" | "medium" | "strong" | "";
  color: string;
} {
  if (!password) {
    return { score: 0, label: "", color: "" };
  }

  let score = 0;

  // Length checks
  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  // Normalize to 1-3 scale
  const normalizedScore = Math.min(3, Math.ceil(score / 2.5));

  const labels: Record<number, { label: "weak" | "medium" | "strong"; color: string }> = {
    1: { label: "weak", color: "destructive" },
    2: { label: "medium", color: "yellow-500" },
    3: { label: "strong", color: "success" },
  };

  return {
    score: normalizedScore,
    ...(labels[normalizedScore] || { label: "", color: "" }),
  };
}

// Format phone number for display
export function formatPhoneDisplay(phone: string): string {
  // Remove all non-digits except +
  const cleaned = phone.replace(/[^\d+]/g, "");
  
  // If it starts with country code, format accordingly
  if (cleaned.startsWith("+91")) {
    const number = cleaned.slice(3);
    if (number.length === 10) {
      return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
    }
  }
  
  return cleaned;
}

// Normalize phone number for API
export function normalizePhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");
  
  // If it starts with 91 and has 12 digits, add +
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }
  
  // If it has 10 digits, assume Indian number
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  
  // Otherwise, just add + if not present
  return phone.startsWith("+") ? phone : `+${digits}`;
}
