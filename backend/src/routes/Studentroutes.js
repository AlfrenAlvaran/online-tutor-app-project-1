import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteStudentHandler,
  editStudentHandler,
  getStudentHandler,
  issueEnrollmentHandler,
  listAllStudentsHandler,
  markSessionFinishedHandler,
} from "../controllers/Studentcontroller.js";
import {
  issueEnrollmentSchema,
  markSessionFinishedSchema,
} from "../schemas/Studentschema.js";
import { updateProgramSchema } from "../schemas/programSchema.js";
import { validateBody } from "../middlewares/validate.js";

const studentRouter = Router();

// Admin-only
studentRouter.get(
  "/all",
  protect,
  authorize("admin"),
  asyncHandler(listAllStudentsHandler),
);

studentRouter.get(
  "/:id",
  protect,
  authorize("admin"),
  asyncHandler(getStudentHandler),
);

studentRouter.post(
  "/add",
  protect,
  authorize("admin"),
  validateBody(issueEnrollmentSchema),
  asyncHandler(issueEnrollmentHandler),
);

studentRouter.patch(
  "/:id",
  protect,
  authorize("admin"),
  validateBody(updateProgramSchema),
  asyncHandler(editStudentHandler),
);

studentRouter.patch(
  "/:id/session-finished",
  protect,
  authorize("admin"),
  validateBody(markSessionFinishedSchema),
  asyncHandler(markSessionFinishedHandler),
);

studentRouter.delete(
  "/:id",
  protect,
  authorize("admin"),
  asyncHandler(deleteStudentHandler),
);

export default studentRouter;
