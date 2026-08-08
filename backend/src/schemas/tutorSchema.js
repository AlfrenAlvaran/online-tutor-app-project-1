import { z } from "zod";

const SAFE_TEXT = /^[^<>{}$`]*$/;

function stripUnsafe(value) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
}

const noInjection = (schema) =>
  schema.refine(
    (val) => typeof val === "string" && !/^\s*\{.*\}\s*$/.test(val),
    { message: "Invalid characters or structure in input" },
  );

export const createTutorSchema = z
  .object({
    name: noInjection(
      z
        .string()
        .trim()
        .min(2, "Tutor name is too short")
        .max(150, "Tutor name is too long")
        .regex(SAFE_TEXT, "Name contains invalid characters"),
    ),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(150, "Email is too long")
      .refine(
        (val) => !/[<>{}$`]/.test(val),
        "Email contains invalid characters",
      )
      .pipe(z.string().email("Invalid email address")),

    profession: noInjection(
      z
        .string()
        .trim()
        .min(2, "Profession is too short")
        .max(100, "Profession is too long")
        .regex(SAFE_TEXT, "Profession contains invalid characters"),
    ),

    bio: z
      .string()
      .trim()
      .max(2000, "Bio is too long")
      .transform(stripUnsafe)
      .refine((val) => val.length <= 2000, "Bio is too long")
      .default(""),
  })
  .strict();

export const updateTutorSchema = createTutorSchema
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update",
  });

export const tutorIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid tutor id"),
});
