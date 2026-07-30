import z from "zod";
import mongoose from "mongoose";
import { PROGRAM_MODES } from "../models/ProgramModel.js";
import {
  SCHEDULE_PREFERENCES_LIST,
  ATTENDING_SCHOOL_OPTIONS_LIST,
} from "../models/StudentModel.js";

const objectId = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid program id",
  });

// -- Admin action: issue a new enrollment pass/token for a program ---------
const issueEnrollmentObject = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Child's name is too short")
    .max(150, "Child's name is too long"),
  program: objectId,
  mode: z.enum(PROGRAM_MODES, {
    errorMap: () => ({
      message: `Mode must be one of: ${PROGRAM_MODES.join(", ")}`,
    }),
  }),
});

export const issueEnrollmentSchema = issueEnrollmentObject.strict();

// -- Public action: guardian completes the enrollment form -----------------
const completeEnrollmentObject = z.object({
  birthdate: z.coerce.date({
    required_error: "Child's birthdate is required",
    invalid_type_error: "Birthdate is invalid",
  }),
  address: z
    .string()
    .trim()
    .min(1, "Home address is required")
    .max(500, "Address is too long"),
  guardianName: z
    .string()
    .trim()
    .min(1, "Guardian name is required")
    .max(150, "Guardian name is too long"),
  guardianContact: z
    .string()
    .trim()
    .min(1, "Guardian contact is required")
    .max(150, "Guardian contact is too long"),
  schedulePreference: z
    .enum([...SCHEDULE_PREFERENCES_LIST, ""])
    .optional()
    .default(""),
  attendingSchool: z
    .enum([...ATTENDING_SCHOOL_OPTIONS_LIST, ""])
    .optional()
    .default(""),
  currentSchool: z
    .string()
    .trim()
    .max(150, "Current school name is too long")
    .optional()
    .default(""),
  notes: z.string().trim().max(2000, "Notes are too long").optional().default(""),
});

export const completeEnrollmentSchema = completeEnrollmentObject
  .strict()
  .refine((data) => data.attendingSchool !== "yes" || data.currentSchool.length > 0, {
    message: "Current school name is required when attending school",
    path: ["currentSchool"],
  });

// -- Admin action: edit an existing student/enrollment record --------------
export const updateStudentSchema = issueEnrollmentObject
  .merge(completeEnrollmentObject)
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update",
  })
  .refine(
    (data) =>
      data.attendingSchool !== "yes" || (data.currentSchool ?? "").length > 0,
    {
      message: "Current school name is required when attending school",
      path: ["currentSchool"],
    },
  );

// -- Admin action: mark whether the child finished the program/session -----
export const markSessionFinishedSchema = z
  .object({
    sessionFinished: z.boolean(),
    sessionFinishedAt: z.coerce.date().optional(),
  })
  .strict();