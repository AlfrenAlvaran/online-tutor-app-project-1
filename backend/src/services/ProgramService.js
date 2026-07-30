import NodeCache from "node-cache";
import { ENV } from "../libs/environments.js";

import {
  fetchActiveProgramsFromDB,
  fetchAllProgramsFromDB,
  fetchProgramByIdFromDB,
  findProgramByLabelFromDB,
  insertProgramToDB,
  updateProgramInDB,
  deleteProgramFromDB,
} from "../data/programData.js";
import { logger } from "../utils/logger.js";

const CACHE_KEY = "programs:active";

const cache = new NodeCache({
  stdTTL: ENV.dedupeTtlSeconds,
  checkperiod: 60,
  useClones: false,
});

export async function getActivePrograms() {
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  const programs = await fetchActiveProgramsFromDB();
  cache.set(CACHE_KEY, programs);
  return programs;
}

export function invalidateProgramsCache() {
  cache.del(CACHE_KEY);
  logger.info("Programs cache invalidated");
}

export async function isValidProgramLabel(label) {
  const programs = await getActivePrograms();
  return programs.some((p) => p.label === label);
}

export async function getAllPrograms() {
  return fetchAllProgramsFromDB();
}

export async function getProgramById(id) {
  const program = await fetchProgramByIdFromDB(id);
  if (!program) {
    const err = new Error("Program not found");
    err.status = 404;
    throw err;
  }
  return program;
}

export async function createProgram({
  label,
  category,
  price,
  duration,
  description,
  active = true,
}) {
  const existing = await findProgramByLabelFromDB(label);
  if (existing) {
    const err = new Error("Program with this label already exists");
    err.status = 409;
    throw err;
  }

  const program = await insertProgramToDB({
    label,
    category,
    price,
    duration,
    description,
    active,
  });
  invalidateProgramsCache();
  return program;
}

export async function editProgram(id, updates) {
  // If the label is changing, make sure it doesn't collide with another program
  if (updates.label !== undefined) {
    const existing = await findProgramByLabelFromDB(updates.label);
    if (existing && String(existing._id) !== String(id)) {
      const err = new Error("Program with this label already exists");
      err.status = 409;
      throw err;
    }
  }

  const program = await updateProgramInDB(id, updates);
  if (!program) {
    const err = new Error("Program not found");
    err.status = 404;
    throw err;
  }

  invalidateProgramsCache();
  return program;
}

export async function changeProgramStatus(id, active) {
  if (typeof active !== "boolean") {
    const err = new Error("`active` must be a boolean");
    err.status = 400;
    throw err;
  }

  const program = await updateProgramInDB(id, { active });
  if (!program) {
    const err = new Error("Program not found");
    err.status = 404;
    throw err;
  }

  invalidateProgramsCache();
  return program;
}

export async function deleteProgram(id) {
  const program = await deleteProgramFromDB(id);
  if (!program) {
    const err = new Error("Program not found");
    err.status = 404;
    throw err;
  }

  invalidateProgramsCache();
  return program;
}