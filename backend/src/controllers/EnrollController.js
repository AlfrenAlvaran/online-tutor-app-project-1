import { ENV } from "../libs/environments.js";
import { AppError } from "../middlewares/errorHandler.js";
import InquireEnrollModel from "../schemas/InquireEnrollModel.js";
import { ProgramModel } from "../models/ProgramModel.js";
import { isDuplicateSubmission } from "../services/cacheService.js";
import {
  sendEnrollmentEmails,
  sendEnrollmentConfirmationEmail,
} from "../services/emailService.js";
import { isValidProgramLabel } from "../services/ProgramService.js";
import { logger } from "../utils/logger.js";
import {
  issueEnrollment,
  completeEnrollmentByToken,
  getEnrollmentInfoByToken,
} from "../services/Studentservice.js";

const VALID_STATUSES = ["new", "contacted", "enrolled", "closed"];

function serializeInquiry(inquiry) {
  return {
    id: inquiry._id.toString(),
    name: inquiry.name,
    phone: inquiry.phone,
    email: inquiry.email,
    age: inquiry.age,
    program: inquiry.program,
    mode: inquiry.mode,
    message: inquiry.message,
    status: inquiry.status,
    emailSent: inquiry.emailSent,
    emailError: inquiry.emailError,
    studentId: inquiry.studentId ? inquiry.studentId.toString() : null,
    createdAt: inquiry.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Public: applicant submits the initial inquiry form
// ---------------------------------------------------------------------------
export async function submitEnrollment(req, res) {
  const data = req.body;
  if (data.website && data.website.length > 0) {
    // honeypot field — silently accept and drop
    return res.status(200).json({ ok: true });
  }

  const valid = await isValidProgramLabel(data.program);
  if (!valid) {
    throw new AppError("Selected program is not currently available", 400);
  }

  if (isDuplicateSubmission(data.email, data.phone)) {
    throw new AppError(
      "We already received a request from you recently. Our team will be in touch shortly.",
      429,
    );
  }

  let enrollment;
  try {
    enrollment = await InquireEnrollModel.create({
      name: data.name,
      phone: data.phone,
      email: data.email,
      age: data.age,
      program: data.program,
      mode: data.mode,
      message: data.message,
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to save enrollment inquiry");
    throw new AppError(
      "Could not process your request. Please try again shortly",
      500,
    );
  }

  try {
    await sendEnrollmentEmails(data);
    enrollment.emailSent = true;
  } catch (error) {
    logger.error(
      { err: error, enrollmentId: enrollment._id },
      "Failed to send enrolment emails",
    );
    enrollment.emailError = error.message || "Unknown error";
  } finally {
    enrollment.emailAttempts += 1;
    enrollment.lastEmailAttemptAt = new Date();
    await enrollment.save();
  }

  return res.status(200).json({ ok: true, id: enrollment._id });
}

// ---------------------------------------------------------------------------
// Admin: list inquiries (filter by status, search by name/email/phone)
// ---------------------------------------------------------------------------
export async function inquireEnrollList(req, res) {
  const { status, search, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status && VALID_STATUSES.includes(status)) {
    filter.status = status;
  }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

  const [inquiries, total] = await Promise.all([
    InquireEnrollModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    InquireEnrollModel.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: inquiries.map(serializeInquiry),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    },
  });
}

// ---------------------------------------------------------------------------
// Admin: change status. Moving INTO "enrolled" creates the real StudentModel
// record (which mints its own pass token) and emails the applicant a link to
// the public completion form. Guarded by `studentId` so re-saving an
// already-enrolled record, or toggling status back and forth, never spawns
// a duplicate student record or re-sends a new link.
// ---------------------------------------------------------------------------
export async function updateInquiryStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    throw new AppError("Invalid status value", 400);
  }

  const inquiry = await InquireEnrollModel.findById(id);
  if (!inquiry) {
    throw new AppError("Inquiry not found", 404);
  }

  const enteringEnrolled =
    status === "enrolled" && inquiry.status !== "enrolled";
  inquiry.status = status;

  let enrollmentLinkSent = false;

  if (enteringEnrolled && !inquiry.studentId) {
    const program = await ProgramModel.findOne({ label: inquiry.program });
    if (!program) {
      throw new AppError(
        "Could not match this inquiry's program to an active program record.",
        400,
      );
    }

    let student;
    try {
      student = await issueEnrollment({
        name: inquiry.name,
        program: program._id,
        mode: inquiry.mode,
        email: inquiry.email,
      });
    } catch (error) {
      logger.error(
        { err: error, inquiryId: inquiry._id },
        "Failed to create student record for enrolled inquiry",
      );
      throw new AppError(
        "Could not create the student enrollment record.",
        500,
      );
    }

    inquiry.studentId = student.id;
    await inquiry.save();

    const enrollmentLink = `${ENV.frontend}/enroll/${student.token}`;

    try {
      await sendEnrollmentConfirmationEmail(inquiry, enrollmentLink);
      inquiry.emailSent = true;
      enrollmentLinkSent = true;
    } catch (error) {
      logger.error(
        { err: error, enrollmentId: inquiry._id },
        "Failed to send enrollment confirmation link",
      );
      inquiry.emailError = error.message || "Unknown error";
    } finally {
      inquiry.emailAttempts += 1;
      inquiry.lastEmailAttemptAt = new Date();
      await inquiry.save();
    }
  } else {
    await inquiry.save();
  }

  return res.status(200).json({
    success: true,
    data: serializeInquiry(inquiry),
    enrollmentLinkSent,
  });
}

// ---------------------------------------------------------------------------
// Public: applicant opens the emailed link — fetch just enough to render
// the form. Reads from StudentModel via the pass token.
// ---------------------------------------------------------------------------
export async function getPublicEnrollmentInfo(req, res) {
  const { token } = req.params;

  const student = await getEnrollmentInfoByToken(token);
  if (!student) {
    throw new AppError("This enrollment link is invalid or has expired.", 404);
  }
  if (student.status === "completed") {
    throw new AppError("This enrollment has already been completed.", 409);
  }

  return res.status(200).json({
    success: true,
    data: {
      name: student.name,
      program: student.program?.label ?? student.program,
      mode: student.mode,
    },
  });
}

// ---------------------------------------------------------------------------
// Public: applicant submits the completion form. Writes directly onto the
// StudentModel record identified by the pass token.
// ---------------------------------------------------------------------------
export async function completePublicEnrollment(req, res) {
  const { token } = req.params;

  const result = await completeEnrollmentByToken(token, req.body);

  if (result === "not_found") {
    throw new AppError("This enrollment link is invalid or has expired.", 404);
  }
  if (result === "already_completed") {
    throw new AppError("This enrollment has already been completed.", 409);
  }

  return res.status(200).json({
    success: true,
    message: "Enrollment completed. Welcome aboard!",
  });
}
