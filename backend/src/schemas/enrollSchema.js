import { z } from "zod";

const MODE_OPTIONS = ["Online", "In-person", "Hybrid"];

export const enrollSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Full name is too short")
      .regex(/^[\p{L}\s.'-]+$/u, "Full name contains invalid characters"),

    phone: z
      .string()
      .trim()
      .min(11, "Contact number is too short")
      .regex(/^[0-9+\s]+$/, "Contact number contains invalid characters"),

    email: z.string().trim().toLowerCase().email("Invalid email address"),

    age: z.coerce
      .number()
      .int()
      .min(3)
      .max(99)
      .optional()
      .or(z.literal("").transform(() => undefined)),

    program: z.string().trim().min(1, "Please select a program"),

    mode: z.enum(MODE_OPTIONS, {
      errorMap: () => ({ message: "Please select a valid mode" }),
    }),

    message: z
      .string()
      .trim()
      .max(1000, "Message is too long")
      .optional()
      .default(""),

    website: z.string().max(0, "Bot detected").optional().default(""),
  })
  .strict();

const STATUS_OPTIONS = ["new", "contacted", "enrolled", "closed"];

export const updateStatusSchema = z
  .object({
    status: z.enum(STATUS_OPTIONS, {
      errorMap: () => ({ message: "Please provide a valid status" }),
    }),
  })
  .strict();

export const completeEnrollmentSchema = z
  .object({
    birthdate: z.coerce.date({
      errorMap: () => ({ message: "Please provide a valid birthdate" }),
    }),

    address: z
      .string()
      .trim()
      .min(5, "Address is too short")
      .max(300, "Address is too long"),

    guardianName: z
      .string()
      .trim()
      .min(2, "Guardian name is too short")
      .regex(/^[\p{L}\s.'-]+$/u, "Guardian name contains invalid characters"),

    guardianContact: z.string().trim().min(7, "Guardian contact is too short"),
    // relaxed regex below — see note

    schedulePreference: z.string().trim().max(200).optional().default(""),

    attendingSchool: z.enum(["yes", "no", ""]).optional().default(""),

    currentSchool: z
      .string()
      .trim()
      .max(150, "Current school name is too long")
      .optional()
      .default(""),

    notes: z
      .string()
      .trim()
      .max(1000, "Notes are too long")
      .optional()
      .default(""),
  })
  .strict()
  .refine(
    (data) => data.attendingSchool !== "yes" || data.currentSchool.length > 0,
    {
      message: "Current school name is required when attending school",
      path: ["currentSchool"],
    },
  );
