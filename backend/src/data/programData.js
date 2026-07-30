import { ProgramModel } from "../models/ProgramModel.js";

function toPlainProgram(p) {
  return {
    id: p._id.toString(),
    label: p.label,
    category: p.category,

    price: p.price,
    duration: p.duration,
    description: p.description,

    active: p.active,
  };
}

export async function fetchActiveProgramsFromDB() {
  const programs = await ProgramModel.find({ active: true }).sort({ label: 1 });
  return programs.map(toPlainProgram);
}

export async function fetchAllProgramsFromDB() {
  const programs = await ProgramModel.find().sort({ label: 1 });
  return programs.map(toPlainProgram);
}

export async function fetchProgramByIdFromDB(id) {
  const program = await ProgramModel.findById(id);
  return program ? toPlainProgram(program) : null;
}

export async function findProgramByLabelFromDB(label, excludeId) {
  const query = { label };
  if (excludeId) query._id = { $ne: excludeId };

  const program = await ProgramModel.findOne(query);
  return program ? toPlainProgram(program) : null;
}

export async function insertProgramToDB(payload) {
  const program = await ProgramModel.create(payload);
  return toPlainProgram(program);
}

export async function updateProgramInDB(id, updates) {
  const allowed = [
    "label",
    "category",
   
    "price",
    "duration",
    "description",
    "active",
  ];
  const payload = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) payload[key] = updates[key];
  }

  const program = await ProgramModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return program ? toPlainProgram(program) : null;
}

export async function deleteProgramFromDB(id) {
  const program = await ProgramModel.findByIdAndDelete(id);
  return program ? toPlainProgram(program) : null;
}
