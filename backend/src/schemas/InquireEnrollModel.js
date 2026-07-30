import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    age: { type: Number },
    program: { type: String, required: true, trim: true },
    mode: { type: String, required: true, trim: true },
    message: { type: String, trim: true },

    status: {
      type: String,
      enum: ["new", "contacted", "enrolled", "closed"],
      default: "new",
    },

    emailSent: { type: Boolean, default: false },
    emailError: { type: String, default: null },
    emailAttempts: { type: Number, default: 0 },
    lastEmailAttemptAt: { type: Date, default: null },

    // Hashed, single-use token that lets the applicant reach the public
    // "complete your enrollment" form after an admin confirms them.
    // `select: false` so it never leaks out on a normal find().
    enrollmentToken: { type: String, select: false, default: undefined },
    enrollmentTokenExpires: { type: Date, select: false, default: undefined },

    formCompleted: { type: Boolean, default: false },
    formCompletedAt: { type: Date, default: null },

    // Whatever the applicant fills in on the public completion form.
    // Adjust these fields to match what you actually need to collect.
    enrollmentDetails: {
      birthdate: Date,
      address: String,
      guardianName: String,
      guardianContact: String,
      schedulePreference: String,
      notes: String,
    },
  },
  {
    timestamps: true,
  },
);

schema.index({ email: 1, phone: 1, createdAt: -1 });
schema.index({ emailSent: 1 });
schema.index({ status: 1, createdAt: -1 });

export default mongoose.model("InquireEnroll", schema);