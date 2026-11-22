"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crest, crestFromApi } from "@/features/crest";
import { PageState } from "@/features/journey/components/ui";
import { apiErrorList } from "@/lib/api-error";
import { Plus, Trash2 } from "@/components/icons/rpg-icons";
import { getAgenda, saveAgenda } from "../services/agenda-service";
import type { Agenda, AgendaIncursionInput, AgendaWrite } from "../schemas/agenda";

type DraftIncursion = {
  key: string;
  id: number | null;
  title: string;
  date: string; // "" = data a definir
  languages: Record<number, string>; // group_id → linguagem
};

let sequence = 0;
const newKey = () => `inc-${++sequence}`;

function toDraft(agenda: Agenda): DraftIncursion[] {
  return agenda.incursions.map((incursion) => ({
    key: newKey(),
    id: incursion.id,
    title: incursion.title,
    date: incursion.date ?? "",
    languages: Object.fromEntries(
      incursion.participations.map((part) => [part.group_id, part.language]),
    ),
  }));
}

/**
 * Edição da agenda em **matriz sem botões de remover equipe**: as linhas
 * são as equipes ativas (com brasão) vindas do backend e as colunas são
 * as incursões (título/data no cabeçalho, com excluir e adicionar). A
 * participação é a célula: linguagem preenchida = participa, vazia = não
 * participa (ADR-023).
 */
export function TeacherAgenda() {
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [draft, setDraft] = useState<DraftIncursion[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getAgenda().then(
      (data) => {
        if (active) {
          setAgenda(data);
          setDraft(toDraft(data));
          setStatus("ready");
          setErrors([]);
        }
      },
      () => {
        if (active) setStatus("error");
      },
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  const reload = () => {
    setMessage("");
    setErrors([]);
    setStatus("loading");
    setAttempt((value) => value + 1);
  };

  const patchIncursion = (index: number, patch: Partial<DraftIncursion>) => {
    setMessage("");
    setDraft((previous) =>
      previous.map((incursion, i) => (i === index ? { ...incursion, ...patch } : incursion)),
    );
  };

  const setLanguage = (groupId: number, index: number, value: string) => {
    setMessage("");
    setDraft((previous) =>
      previous.map((incursion, i) =>
        i === index
          ? { ...incursion, languages: { ...incursion.languages, [groupId]: value } }
          : incursion,
      ),
    );
  };

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!agenda) return;
    setErrors([]);
    setMessage("");
    setSaving(true);
    const payload: AgendaWrite = {
      incursions: draft.map(
        (incursion, index): AgendaIncursionInput => ({
          ...(incursion.id !== null ? { id: incursion.id } : {}),
          number: index + 1,
          title: incursion.title,
          date: incursion.date || null,
          participations: Object.entries(incursion.languages)
            .filter(([, language]) => language.trim())
            .map(([groupId, language]) => ({
              group_id: Number(groupId),
              language: language.trim(),
            })),
        }),
      ),
    };
    saveAgenda(payload).then(
      (data) => {
        setAgenda(data);
        setDraft(toDraft(data));
        setMessage("Agenda salva.");
      },
      (error: unknown) => {
        setErrors(apiErrorList(error, "Não foi possível salvar a agenda."));
      },
    ).finally(() => setSaving(false));
  }

  if (status !== "ready" || !agenda) {
    return (
      <PageState status={status} retry={reload}>
        {null}
      </PageState>
    );
  }

  return (
    <section aria-labelledby="teacher-agenda-title" className="space-y-5">
      <div>
        <h1 id="teacher-agenda-title" className="text-[1.85rem] leading-tight">
          Agenda de incursões
        </h1>
        <p className="mt-2 font-reading text-muted-foreground">
          As equipes ativas participam ao preencher a linguagem de cada incursão — deixe a
          célula em branco para a equipe não participar. Para tirar uma equipe da agenda,
          desative-a na tela de Grupos.
        </p>
      </div>

      {errors.length > 0 && (
        <ul
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {errors.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}

      <form onSubmit={submit}>
        <fieldset disabled={saving} className="min-w-0 space-y-4">
          <div
            className="overflow-x-auto rounded-md border border-border"
            role="region"
            aria-label="Matriz da agenda por equipe e incursão"
            tabIndex={0}
          >
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead className="bg-sidebar">
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 z-10 border-b border-r border-border bg-sidebar px-3 py-3 text-left font-medium"
                  >
                    Equipe
                  </th>
                  {draft.map((incursion, index) => (
                    <th
                      key={incursion.key}
                      scope="col"
                      className="min-w-48 border-b border-l border-border px-3 py-2 text-left font-normal"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-display text-xs uppercase tracking-widest text-accent">
                          Inc. {index + 1}
                        </span>
                        <button
                          type="button"
                          aria-label={`Excluir incursão ${index + 1}`}
                          onClick={() =>
                            setDraft((previous) =>
                              previous.filter((_, i) => i !== index),
                            )
                          }
                          className="ml-auto rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <Input
                        aria-label={`Título da incursão ${index + 1}`}
                        placeholder="Título da incursão"
                        maxLength={100}
                        className="mt-1.5 h-9 bg-background"
                        value={incursion.title}
                        onChange={(event) => patchIncursion(index, { title: event.target.value })}
                      />
                      <Input
                        aria-label={`Data da incursão ${index + 1}`}
                        type="date"
                        className="mt-1.5 h-9 bg-background"
                        value={incursion.date}
                        onChange={(event) => patchIncursion(index, { date: event.target.value })}
                      />
                    </th>
                  ))}
                  <th scope="col" className="border-b border-l border-border px-3 py-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDraft((previous) => [
                          ...previous,
                          { key: newKey(), id: null, title: "", date: "", languages: {} },
                        ])
                      }
                    >
                      <Plus /> Incursão
                    </Button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {agenda.groups.map((group) => (
                  <tr key={group.id} className="border-t border-border align-top">
                    <th
                      scope="row"
                      className="sticky left-0 border-r border-border bg-background px-3 py-2 text-left font-normal"
                    >
                      <span className="flex items-center gap-2">
                        <Crest spec={crestFromApi(group)} size={22} className="shrink-0" />
                        <span className="truncate font-medium">{group.name}</span>
                      </span>
                      <span className="mt-1 block text-xs font-normal text-muted-foreground">
                        {group.members.length}{" "}
                        {group.members.length === 1 ? "aventureiro" : "aventureiros"}
                      </span>
                    </th>
                    {draft.map((incursion, index) => (
                      <td key={incursion.key} className="border-l border-border px-3 py-2">
                        <Input
                          aria-label={`Linguagem de ${group.name} na incursão ${index + 1}`}
                          placeholder="Linguagem"
                          maxLength={100}
                          value={incursion.languages[group.id] ?? ""}
                          onChange={(event) =>
                            setLanguage(group.id, index, event.target.value)
                          }
                        />
                      </td>
                    ))}
                    <td className="border-l border-border" />
                  </tr>
                ))}
                {agenda.groups.length === 0 && (
                  <tr>
                    <td
                      colSpan={2 + draft.length}
                      className="px-4 py-8 text-center font-reading text-sm text-muted-foreground"
                    >
                      Nenhuma equipe ativa. Cadastre equipes na tela de Grupos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando…" : "Salvar agenda"}
            </Button>
            <Button type="button" variant="outline" onClick={reload} disabled={saving}>
              Recarregar
            </Button>
            {message && (
              <p role="status" className="text-sm text-muted-foreground">
                {message}
              </p>
            )}
          </div>
        </fieldset>
      </form>
    </section>
  );
}
