import z from "zod";

const MODES = ["Online", "Onsite", "Hybrid"];

export const createProgramSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(2, "Program label is too short")
      .max(150, "Program label is too long"),
    category: z
      .string()
      .trim()
      .min(2, "Program category is too short")
      .max(100, "Program category is too long"),
    price: z.number().min(0, "Price cannot be negative"),
    duration: z
      .string()
      .trim()
      .max(50, "Duration text is too long")
      .optional()
      .default(""),
    description: z
      .string()
      .trim()
      .max(2000, "Description is too long")
      .optional()
      .default(""),
    active: z.boolean().optional().default(true),
  })
  .strict();

export const updateProgramSchema = createProgramSchema
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update",
  });
