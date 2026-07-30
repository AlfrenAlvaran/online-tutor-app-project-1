import crypto from "node:crypto";
import { StudentModel } from "../models/StudentModel.js";
import { ProgramModel } from "../models/ProgramModel.js";
import UserModel from "../models/UserModel.js";
import { logger } from "../utils/logger.js";

function toPlainStudent(s) {
  const program =
    s.program && typeof s.program === "object" && "label" in s.program
      ? { id: s.program._id.toString(), label: s.program.label }
      : s.program?.toString?.() ?? s.program;

  return {
    id: s._id.toString(),
    token: s.token,
    name: s.name,
    email: s.email,
    program,
    mode: s.mode,
    status: s.status,
    completedAt: s.completedAt,
    birthdate: s.birthdate,
    address: s.address,
    guardianName: s.guardianName,
    guardianContact: s.guardianContact,
    schedulePreference: s.schedulePreference,
    attendingSchool: s.attendingSchool,
    currentSchool: s.currentSchool,
    notes: s.notes,
    sessionFinished: s.sessionFinished,
    sessionFinishedAt: s.sessionFinishedAt,
  };
}

function generateEnrollmentToken() {
  return crypto.randomBytes(24).toString("hex");
}

// Login password convention: the child's birthdate as yyyy-mm-dd, e.g.
// 2004-10-15. Uses UTC getters since birthdates coerced from a plain
// "YYYY-MM-DD" string parse to UTC midnight — local getters could read
// back as the previous day in negative-offset timezones.
function birthdateToPassword(birthdate) {
  const d = new Date(birthdate);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Admin: issue a fresh enrollment pass for a program. The token is what
// the public /inquire/enroll/:token page is keyed off of. `email` is
// carried over from the originating inquiry and used later to create the
// student's login account once the enrollment form is completed.
export async function issueEnrollment({ name, email, program, mode }) {
  const programDoc = await ProgramModel.findById(program);
  if (!programDoc) {
    const err = new Error("Program not found");
    err.statusCode = 404;
    throw err;
  }

  const student = await StudentModel.create({
    token: generateEnrollmentToken(),
    name,
    email,
    program: programDoc._id,
    mode,
  });

  return toPlainStudent(student);
}

// Public: look up the pass by token. Returns null if the token doesn't exist
// at all; the caller decides what to do with an already-completed status.
export async function getEnrollmentInfoByToken(token) {
  const student = await StudentModel.findOne({ token }).populate(
    "program",
    "label",
  );
  return student ? toPlainStudent(student) : null;
}

// Public: guardian submits the form. Returns a sentinel string for the two
// "can't proceed" cases so the controller can map them to 404 / 409, and
// the plain student record on success. On success, also creates a login
// account for the student — email from the record, password is the
// child's birthdate as yyyy-mm-dd. Account creation failures (e.g. an
// email collision) are logged but never fail the enrollment itself, since
// the enrollment data is already saved and the guardian shouldn't be
// blocked by a login-account issue.
export async function completeEnrollmentByToken(token, payload) {
  const student = await StudentModel.findOne({ token });
  if (!student) return "not_found";
  if (student.status === "completed") return "already_completed";

  const allowed = [
    "birthdate",
    "address",
    "guardianName",
    "guardianContact",
    "schedulePreference",
    "attendingSchool",
    "currentSchool",
    "notes",
  ];
  for (const key of allowed) {
    if (payload[key] !== undefined) student[key] = payload[key];
  }
  student.status = "completed";
  student.completedAt = new Date();

  await student.save();

  try {
    const existingUser = await UserModel.findOne({ email: student.email });
    if (!existingUser) {
      await UserModel.create({
        name: student.name,
        email: student.email,
        password: birthdateToPassword(student.birthdate),
        role: "students",
      });
    } else {
      logger.info(
        { email: student.email, studentId: student._id },
        "User account already exists for this email; skipped creating a new one",
      );
    }
  } catch (error) {
    logger.error(
      { err: error, studentId: student._id },
      "Failed to create user account for completed enrollment",
    );
  }

  return toPlainStudent(student);
}

export async function listAllStudents() {
  const students = await StudentModel.find()
    .populate("program", "label")
    .sort({ createdAt: -1 });
  return students.map(toPlainStudent);
}

export async function getStudentById(id) {
  const student = await StudentModel.findById(id).populate("program", "label");
  return student ? toPlainStudent(student) : null;
}

export async function updateStudent(id, updates) {
  const allowed = [
    "name",
    "program",
    "mode",
    "birthdate",
    "address",
    "guardianName",
    "guardianContact",
    "schedulePreference",
    "attendingSchool",
    "currentSchool",
    "notes",
  ];
  const payload = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) payload[key] = updates[key];
  }

  const student = await StudentModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).populate("program", "label");

  return student ? toPlainStudent(student) : null;
}

// Admin: flip whether the child has finished the program/session. Clearing
// the flag also clears the timestamp so the two stay in sync.
export async function markSessionFinished(id, { sessionFinished, sessionFinishedAt }) {
  const payload = {
    sessionFinished,
    sessionFinishedAt: sessionFinished ? sessionFinishedAt ?? new Date() : null,
  };

  const student = await StudentModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).populate("program", "label");

  return student ? toPlainStudent(student) : null;
}

export async function deleteStudent(id) {
  const student = await StudentModel.findByIdAndDelete(id);
  return student ? toPlainStudent(student) : null;
}