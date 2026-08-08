import mongoose from "mongoose";
import { z } from "zod";
import { SCHEDULE_DAYS, WEEKEND_DAYS } from "../common/index.js";
import { toMinutes } from "../utils/toMinutes.js";
import { da } from "zod/v4/locales";
import { SCHEDULE_PREFERENCES_LIST } from "../models/StudentModel";

const objectId = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid Id",
  });

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const assignStudentObject = z.object({
  tutorId: objectId,
  scheduleDay: z.enum(SCHEDULE_DAYS, {
    errorMap: () => ({
      message: `Day must be one of: ${SCHEDULE_DAYS.join(", ")}`,
    }),
  }),
  scheduleStartTime: z
    .string()
    .trim()
    .regex(TIME_RE, "Start time must be in HH:mm 24-hour format"),
  scheduleEndTime: z
    .string()
    .trim()
    .regex(TIME_RE, "End time must be in HH:mm 24-hour format"),
});

export const assignStudentSchema = assignStudentObject
  .strict()
  .refine((data) => toMinutes(data.scheduleStartTime), {
    message: "End time must be after start time",
    path: ["scheduleEndTime"],
  });

export function assertMatchesSchedulePreference(
  schedulePreference,
  { scheduleDay, scheduleStartTime },
) {
  if (!schedulePreference) return true;

  if (!SCHEDULE_PREFERENCES_LIST.includes(schedulePreference)) return true;

  if (schedulePreference === "weekend") {
    return WEEKEND_DAYS.includes(scheduleDay);
  }

  const statMinutes = toMinutes(scheduleStartTime);
  const RANGES = {
    morning: [0, 12 * 60],
    afternoon: [12 * 60, 17 * 60],
    evening: [17 * 60, 24 * 60],
  };
  const [min, max] = RANGES[schedulePreference];
  return statMinutes >= min && statMinutes < max;
}

export const unassignStudentSchema = z
  .object({
    unassign: z.literal(true),
  })
  .strict();
