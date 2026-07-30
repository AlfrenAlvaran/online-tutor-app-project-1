import mongoose from "mongoose";
import { PROGRAM_MODES } from "./ProgramModel.js";
const SCHEDULE_PREFERENCES = ["morning", "afternoon", "evening", "weekend"];
const ATTENDING_SCHOOL_OPTIONS = ["yes", "no"];
const STATUSES = ["pending", "completed"];

const isCompleted = function () {
  return this.status === "completed";
};
const schema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: [true, "Enrollment token is required"],
      unique: true,
      trim: true,
    },

    // Snapshot of who the inquiry is for, set when the pass is first issued.
    name: {
      type: String,
      required: [true, "Child's name is required"],
      trim: true,
      minlength: [2, "Name is too short"],
      maxlength: [150, "Name is too long"],
    },
    // Carried over from the originating inquiry, used to create this
    // student's login account once the enrollment form is completed.
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: [true, "Program is required"],
    },
    mode: {
      type: String,
      enum: {
        values: PROGRAM_MODES,
        message: "{VALUE} is not a valid mode",
      },
      required: [true, "Mode is required"],
    },

    status: {
      type: String,
      enum: STATUSES,
      default: "pending",
    },
    completedAt: {
      type: Date,
      default: null,
    },

    // Guardian-supplied fields, filled in when the enrollment form is submitted.
    birthdate: {
      type: Date,
      required: [isCompleted, "Child's birthdate is required"],
      default: null,
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, "Address is too long"],
      required: [isCompleted, "Home address is required"],
      default: "",
    },
    guardianName: {
      type: String,
      trim: true,
      maxlength: [150, "Guardian name is too long"],
      required: [isCompleted, "Guardian name is required"],
      default: "",
    },
    guardianContact: {
      type: String,
      trim: true,
      maxlength: [150, "Guardian contact is too long"],
      required: [isCompleted, "Guardian contact is required"],
      default: "",
    },
    schedulePreference: {
      type: String,
      enum: {
        values: [...SCHEDULE_PREFERENCES, ""],
        message: "{VALUE} is not a valid schedule preference",
      },
      default: "",
    },
    attendingSchool: {
      type: String,
      enum: {
        values: [...ATTENDING_SCHOOL_OPTIONS, ""],
        message: "{VALUE} is not a valid attending-school option",
      },
      default: "",
    },
    currentSchool: {
      type: String,
      trim: true,
      maxlength: [150, "Current school name is too long"],
      required: [
        function () {
          return isCompleted.call(this) && this.attendingSchool === "yes";
        },
        "Current school name is required when attending school",
      ],
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, "Notes are too long"],
      default: "",
    },

    // Post-enrollment tracking: has the child finished the program/session
    // they enrolled into? Independent of `status`, which only tracks whether
    // the enrollment *form* was completed.
    sessionFinished: {
      type: Boolean,
      default: false,
    },
    sessionFinishedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export const StudentModel = mongoose.model("student", schema);
export const ENROLLMENT_STATUSES = STATUSES;
export const SCHEDULE_PREFERENCES_LIST = SCHEDULE_PREFERENCES;
export const ATTENDING_SCHOOL_OPTIONS_LIST = ATTENDING_SCHOOL_OPTIONS;