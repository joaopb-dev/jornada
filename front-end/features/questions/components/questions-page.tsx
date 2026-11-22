"use client";

import { QuestionForm } from "./question-form";
import { deleteQuestion, getQuestions } from "@/features/questions/services/question-service";


import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Confirm, EmptyState, PageHeader, PageState, Scroll } from "@/features/journey/components/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import type { Question } from "@/features/questions";
import { CheckCircle2, Circle, Pencil, Plus, Trash2 } from "@/components/icons/rpg-icons";
import { useState } from "react";
import { toast } from "sonner";



function Perguntas() {
  const { data, status, refresh, retry } = useApiQuery(getQuestions);
  const questions = data ?? [];
  const [editing, setEditing] = useState<Question | "new" | null>(null);
  const [del, setDel] = useState<Question | null>(null);

  return (
    <PageState status={status} retry={retry}>
      <PageHeader title="Perguntas" description="Cada acerto vale um ponto de recurso, até cinco por grupo." action={<Button onClick={() => setEditing("new")}><Plus /> Nova pergunta</Button>} />
      {questions.length === 0 ? (
        <EmptyState title="Nenhuma pergunta no banco" hint="Cadastre perguntas fechadas com a alternativa correta." />
      ) : (
        <div className="space-y-4">
          {questions.map((q, n) => (
            <Scroll key={q.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-reading text-base"><span className="mr-2 font-display text-sm text-muted-foreground">{n + 1}.</span>{q.text}</p>
                  {(q.language || q.boss_name) && (
                    <p className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {q.language && <span>{q.language}</span>}
                      {q.boss_name && <span className="rounded bg-parchment px-1.5 py-0.5 text-parchment-foreground">banco do chefe {q.boss_name}</span>}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0">
                  <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => setEditing(q)}><Pencil /></Button>
                  <Button variant="ghost" size="icon" aria-label="Excluir" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDel(q)}><Trash2 /></Button>
                </div>
              </div>
              <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {q.choices.map((o, i) => (
                  <li key={o.id ?? i} className={cn("flex items-center gap-2 rounded-md border px-3 py-2 text-sm", o.is_correct ? "border-success/50 bg-accent text-accent-foreground" : "border-border")}>
                    {o.is_correct ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4 text-muted-foreground" />} {o.text}
                  </li>
                ))}
              </ul>
            </Scroll>
          ))}
        </div>
      )}
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-display text-xl">{editing === "new" ? "Nova pergunta" : "Editar pergunta"}</SheetTitle>
            <SheetDescription className="font-reading">Marque ao menos uma alternativa correta.</SheetDescription>
          </SheetHeader>
          {editing && <QuestionForm key={editing === "new" ? "n" : editing.id} initial={editing === "new" ? null : editing} onDone={() => { setEditing(null); refresh(); }} />}
        </SheetContent>
      </Sheet>
      <Confirm open={!!del} onOpenChange={(o) => !o && setDel(null)} title="Excluir pergunta?" description="Ela deixará de aparecer nas próximas missões." confirmLabel="Excluir" destructive
        onConfirm={() => {
          if (!del) return;
          deleteQuestion(del.id).then(
            () => { toast.success("Pergunta removida."); setDel(null); refresh(); },
            (error: unknown) => { toast.error(apiErrorMessage(error, "Não foi possível remover a pergunta.")); },
          );
        }} />
    </PageState>
  );
}



export { Perguntas as QuestionsPage };
