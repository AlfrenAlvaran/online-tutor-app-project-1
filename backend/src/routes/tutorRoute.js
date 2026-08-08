import { Router } from "express";
import {
  createTutor,
  deleteTutor,
  fetchAllTutors,
  updateTutor,
} from "../controllers/TutorContoller.js";
import { adminWriteLimiter } from "../middlewares/rateLimiter.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { protect } from "../middlewares/authMiddleware.js";

const tutorRouter = Router();

tutorRouter.get("/", fetchAllTutors);

tutorRouter.post(
  "/add",
  adminWriteLimiter,
  protect,
  authorize("admin"),
  createTutor,
);
tutorRouter.patch(
  "/:id",
  adminWriteLimiter,
  protect,
  authorize("admin"),
  updateTutor,
);

tutorRouter.delete(
  "/:id",
  adminWriteLimiter,
  protect,
  authorize("admin"),
  deleteTutor,
);

export default tutorRouter;
