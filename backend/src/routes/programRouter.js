import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createProgramHandler,
  editProgramHandler,
  changeProgramStatusHandler,
  deleteProgramHandler,
  getProgram,
  listAllProgram,
  listProgram,
} from "../controllers/ProgramController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { validateBody } from "../middlewares/validate.js";
import {
  createProgramSchema,
  updateProgramSchema,
} from "../schemas/programSchema.js";

const programRouter = Router();

// Public
programRouter.get("/program-list", asyncHandler(listProgram));

// Admin-only
programRouter.get(
  "/all",
  protect,
  authorize("admin"),
  asyncHandler(listAllProgram),
);

programRouter.post(
  "/add",
  protect,
  authorize("admin"),
  validateBody(createProgramSchema),
  asyncHandler(createProgramHandler),
);

programRouter.get(
  "/:id",
  protect,
  authorize("admin"),
  asyncHandler(getProgram),
);

programRouter.patch(
  "/:id",
  protect,
  authorize("admin"),
  validateBody(updateProgramSchema),
  asyncHandler(editProgramHandler),
);

programRouter.patch(
  "/:id/status",
  protect,
  authorize("admin"),
  asyncHandler(changeProgramStatusHandler),
);

programRouter.delete(
  "/:id",
  protect,
  authorize("admin"),
  asyncHandler(deleteProgramHandler),
);

export default programRouter;