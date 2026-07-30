import mongoose from "mongoose";
import { ENV } from "../libs/environments.js";
import { ProgramModel } from "../models/ProgramModel.js";

async function seed() {
  await mongoose.connect(ENV.mongoose);
  console.log("Connected to DB");

  const existing = await ProgramModel.countDocuments();
  if (existing > 0) {
    console.log(`Already has ${existing} program(s), skipping seed.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const programs = await ProgramModel.insertMany([
    { label: "Elementary Tutoring" },
    { label: "High School Tutoring" },
    { label: "College Prep / SAT" },
    { label: "Test Review" },
    { label: "Language Lessons" },
  ]);

  console.log(`Seeded ${programs.length} programs:`);
  programs.forEach((p) => console.log(`  - ${p.label}`));

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});