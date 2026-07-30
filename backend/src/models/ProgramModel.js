import mongoose from "mongoose";

const MODES = ["Online", "Onsite", "Hybrid"];

const schema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, "Program label is required"],
      trim: true,
      unique: true,
      minlength: [2, "Program label is too short"],
      maxlength: [150, "Program label is too long"],
    },
    category: {
      type: String,
      required: [true, "Program category is required"],
      trim: true,
      minlength: [2, "Program category is too short"],
      maxlength: [100, "Program category is too long"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [1, "Price must be greater than 0"],
    },
    duration: {
      type: String,
      trim: true,
      maxlength: [50, "Duration text is too long"],
      default: "",
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description is too long"],
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const ProgramModel = mongoose.model("Program", schema);
export const PROGRAM_MODES = MODES;