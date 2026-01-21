import { z } from "zod";

export const reportItemSchema = z.object({
  category: z.enum([
    "electronics",
    "documents",
    "wallet",
    "bag",
    "jewelry",
    "clothing",
    "keys",
    "other",
  ]),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  lost_date: z.date({
    required_error: "Please select when you lost the item",
  }),
  lost_location_address: z
    .string()
    .max(255, "Address must be less than 255 characters")
    .optional(),
  auto_number: z
    .string()
    .max(20, "Auto number must be less than 20 characters")
    .optional(),
  route_description: z
    .string()
    .max(500, "Route description must be less than 500 characters")
    .optional(),
  driver_description: z
    .string()
    .max(500, "Driver description must be less than 500 characters")
    .optional(),
});

export type ReportItemFormData = z.infer<typeof reportItemSchema>;

export const FORM_STEPS = [
  { id: 1, title: "Item Details", description: "What did you lose?" },
  { id: 2, title: "When & Where", description: "Time and location details" },
  { id: 3, title: "Auto Details", description: "Auto-rickshaw information" },
  { id: 4, title: "Photos", description: "Add photos of the item" },
] as const;
