import InquireEnrollModel from "../schemas/InquireEnrollModel";

export async function inquireEnrollListData() {
  const inquiries = await InquireEnrollModel.find();
  return inquiries.map((inquire) => ({
    id: inquire._id.toString(),
    name: inquire.name,
    age: inquire,
    mode: inquire.mode,
    status: inquire.status,
  }));
}
