import {
  getActivePrograms,
  getAllPrograms,
  getProgramById,
  createProgram,
  editProgram,
  changeProgramStatus,
  deleteProgram,
} from "../services/ProgramService.js";

export async function listProgram(req, res, next) {
  try {
    const programs = await getActivePrograms();
    res.set("Cache-Control", "public, max-age=120");
    res.status(200).json({ ok: true, programs });
  } catch (err) {
    next(err);
  }
}

export async function listAllProgram(req, res, next) {
  try {
    const programs = await getAllPrograms();
    res.status(200).json({ ok: true, programs });
  } catch (err) {
    next(err);
  }
}

export async function getProgram(req, res, next) {
  try {
    const program = await getProgramById(req.params.id);
    res.status(200).json({ ok: true, program });
  } catch (err) {
    next(err);
  }
}

export async function createProgramHandler(req, res, next) {
  try {
    const { label, category, price, duration, description, active } = req.body;
    const program = await createProgram({
      label,
      category,
      price,
      duration,
      description,
      active,
    });
    res.status(201).json({ ok: true, program });
  } catch (err) {
    next(err);
  }
}

export async function editProgramHandler(req, res, next) {
  try {
    const { label, category, price, duration, description, active } = req.body;
    const program = await editProgram(req.params.id, {
      label,
      category,
      price,
      duration,
      description,
      active,
    });
    res.status(200).json({ ok: true, program });
  } catch (err) {
    next(err);
  }
}

export async function changeProgramStatusHandler(req, res, next) {
  try {
    const { active } = req.body;
    const program = await changeProgramStatus(req.params.id, active);
    res.status(200).json({ ok: true, program });
  } catch (err) {
    next(err);
  }
}

export async function deleteProgramHandler(req, res, next) {
  try {
    await deleteProgram(req.params.id);
    res.status(200).json({ ok: true, message: "Program deleted" });
  } catch (err) {
    next(err);
  }
}