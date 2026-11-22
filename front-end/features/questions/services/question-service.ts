import { api } from "@/lib/api";
import { questionSchema, type Question, type QuestionWrite } from "../schemas/question";

const endpoint = "/questions/";

/** `GET /api/questions/` — leitura pública do banco de perguntas. */
export async function getQuestions(signal?: AbortSignal): Promise<Question[]> {
  const { data } = await api.get(endpoint, { signal });
  return questionSchema.array().parse(data);
}

/** `POST /api/questions/` — cria com alternativas aninhadas (replace-all). */
export async function createQuestion(payload: QuestionWrite): Promise<Question> {
  const { data } = await api.post(endpoint, payload);
  return questionSchema.parse(data);
}

/** `PATCH /api/questions/{id}/` — a lista de `choices` substitui as do servidor. */
export async function updateQuestion(id: number, payload: Partial<QuestionWrite>): Promise<Question> {
  const { data } = await api.patch(`${endpoint}${id}/`, payload);
  return questionSchema.parse(data);
}

/** `DELETE /api/questions/{id}/` */
export async function deleteQuestion(id: number): Promise<void> {
  await api.delete(`${endpoint}${id}/`);
}

export const questionService = {
  list: getQuestions,
  create: createQuestion,
  update: updateQuestion,
  remove: deleteQuestion,
};
