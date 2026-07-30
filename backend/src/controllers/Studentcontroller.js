import {
  listAllStudents,
  getStudentById,
  issueEnrollment,
  updateStudent,
  markSessionFinished,
  deleteStudent,
} from "../services/StudentService.js";

export async function listAllStudentsHandler(req, res, next) {
  try {
    const students = await listAllStudents();
    res.status(200).json({ ok: true, students });
  } catch (err) {
    next(err);
  }
}

export async function getStudentHandler(req, res, next) {
  try {
    const student = await getStudentById(req.params.id);
    res.status(200).json({ ok: true, student });
  } catch (err) {
    next(err);
  }
}

export async function issueEnrollmentHandler(req, res, next) {
  try {
    const { name, program, mode } = req.body;
    const student = await issueEnrollment({ name, program, mode });
    res.status(201).json({ ok: true, student });
  } catch (err) {
    next(err);
  }
}

export async function editStudentHandler(req, res, next) {
  try {
    const student = await updateStudent(req.params.id, req.body);
    res.status(200).json({ ok: true, student });
  } catch (err) {
    next(err);
  }
}

export async function markSessionFinishedHandler(req, res, next) {
  try {
    const { sessionFinished, sessionFinishedAt } = req.body;
    const student = await markSessionFinished(req.params.id, {
      sessionFinished,
      sessionFinishedAt,
    });
    res.status(200).json({ ok: true, student });
  } catch (err) {
    next(err);
  }
}

export async function deleteStudentHandler(req, res, next) {
  try {
    await deleteStudent(req.params.id);
    res.status(200).json({ ok: true, message: "Student record deleted" });
  } catch (err) {
    next(err);
  }
}