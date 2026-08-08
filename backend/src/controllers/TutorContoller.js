import {
  createTutorSchema,
  tutorIdSchema,
  updateTutorSchema,
} from "../schemas/tutorSchema.js";
import * as TutorService from "../services/tutorService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const fetchAllTutors = asyncHandler(async (req, res) => {
  const tutors = await TutorService.listAllTutors();
  return res.status(200).json({ success: true, data: tutors });
});

export const createTutor = asyncHandler(async (req, res) => {
  const parsed = createTutorSchema.safeParse(req.body);
  if (!parsed) {
    return res.status(400).json({
      success: false,
      message: "Invalid tutor data",
      error: parsed.error.flatten().fieldErrors,
    });
  }

  const result = await TutorService.createTutor(parsed.data);
  if (result === "duplicate_email") {
    return res.status(409).json({
      success: false,
      message: "A tutor with this email already exist.",
    });
  }
  return res.status(201).json({ success: true, data: result });
});

export const updateTutor = asyncHandler(async (req, res) => {
  const idCheck = tutorIdSchema.safeParse(req.body);
  if (!idCheck.success) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid tutor id" });
  }

  const parsed = updateTutorSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid tutor data",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const result = await TutorService.updateTutor(idCheck.data.id, parsed.data);
  if (result === "duplicate_email") {
    return res.status(409).json({
      success: false,
      message: "A tutor with this email already exists.",
    });
  }
  if (!result) {
    return res
      .status(404)
      .json({ success: false, message: "Tutor not found." });
  }

  return res.status(200).json({ success: true, data: result });
});

export const deleteTutor = asyncHandler(async (req, res) => {
  const idCheck = tutorIdSchema.safeParse(req.params);
  if (!idCheck.success) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid tutor id" });
  }

  const result = await TutorService.deleteTutor(idCheck.data.id);
  if (!result) {
    return res
      .status(404)
      .json({ success: false, message: "Tutor not found." });
  }

  return res.status(200).json({ success: true, message: "Tutor deleted." });
});
