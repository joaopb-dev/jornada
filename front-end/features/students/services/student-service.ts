import { api } from "@/lib/api";
import { studentSchema, type Student, type StudentWrite } from "../schemas/student";

const endpoint = "/students/";

/** `GET /api/students/` — leitura pública, ordenada por nome. */
export async function getStudents(signal?: AbortSignal): Promise<Student[]> {
  const { data } = await api.get(endpoint, { signal });
  return studentSchema.array().parse(data);
}

/** `POST /api/students/` — cria; matrícula única de 6 dígitos (regra do servidor). */
export async function createStudent(payload: StudentWrite): Promise<Student> {
  const { data } = await api.post(endpoint, payload);
  return studentSchema.parse(data);
}

/** `PATCH /api/students/{id}/` — altera só o que foi enviado. */
export async function updateStudent(
  id: number,
  payload: Partial<StudentWrite> & { group?: number | null },
): Promise<Student> {
  const { data } = await api.patch(`${endpoint}${id}/`, payload);
  return studentSchema.parse(data);
}

/** `DELETE /api/students/{id}/` */
export async function deleteStudent(id: number): Promise<void> {
  await api.delete(`${endpoint}${id}/`);
}

export const studentService = {
  list: getStudents,
  create: createStudent,
  update: updateStudent,
  remove: deleteStudent,
};
