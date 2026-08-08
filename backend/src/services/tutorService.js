import TutorModel from "../models/TutorModel.js";



function toPlainTutor(t) {
  return {
    id: t._id.toString(),
    name: t.name,
    email: t.email,
    profession: t.profession,
    bio: t.bio,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

export async function listAllTutors() {
  const tutors = await TutorModel.find().sort({ createdAt: -1 });
  return tutors.map(toPlainTutor);
}

export async function getTutorById(id) {
  const tutor = await TutorModel.findById(id);
  return tutor ? toPlainTutor(tutor) : null;
}

export async function createTutor({ name, email, profession, bio }) {
  const existing = await TutorModel.findOne({ email });
  if (existing) return "duplicate_email";

  const tutor = await TutorModel.create({ name, email, profession, bio });
  return toPlainTutor(tutor);
}

export async function updateTutor(id, updates) {
  const allowed = ["name", "email", "profession", "bio"];
  const payload = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) payload[key] = updates[key];
  }

  if (payload.email) {
    const existing = await TutorModel.findOne({
      email: payload.email,
      _id: { $ne: id },
    });
    if (existing) return "duplicate_email";
  }

  const tutor = await TutorModel.findByIdAndDelete(id, payload, {
    new: true,
    runValidators: true,
  });

  return tutor ? toPlainTutor(tutor) : null;
}

export async function deleteTutor(id) {
  const tutor = await TutorModel.findByIdAndDelete(id);
  return tutor ? toPlainTutor(tutor) : null;
}
