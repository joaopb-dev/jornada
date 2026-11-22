"use client";

import { TeamForm } from "./team-form";
import { deleteGroup, getGroups, setGroupMembers } from "@/features/groups/services/group-service";
import { getStudents } from "@/features/students/services/student-service";
import { Crest, crestFromApi } from "@/features/crest";


import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Confirm, EmptyState, PageHeader, PageState, Scroll, selectClass } from "@/features/journey/components/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiErrorMessage } from "@/lib/api-error";
import type { Group } from "@/features/groups";
import { Pencil, Plus, Trash2 } from "@/components/icons/rpg-icons";
import { useState } from "react";
import { toast } from "sonner";



function Grupos() {
  const groupsQuery = useApiQuery(getGroups);
  const studentsQuery = useApiQuery(getStudents);
  const queries = [groupsQuery, studentsQuery];
  // Membros moram em `students[].group` (o `set-members` é quem grava):
  // as duas queries precisam estar prontas antes de renderizar.
  const status = queries.some((q) => q.status === "error")
    ? "error"
    : queries.some((q) => q.status === "loading")
      ? "loading"
      : "ready";
  const retry = () => queries.forEach((q) => q.retry());
  const groups = groupsQuery.data ?? [];
  const students = studentsQuery.data ?? [];
  const membersOf = (group: Group) => students.filter((s) => s.group === group.id);
  const unassigned = students.filter((s) => s.group === null);
  const refresh = () => { groupsQuery.refresh(); studentsQuery.refresh(); };
  const [editing, setEditing] = useState<Group | "new" | null>(null);
  const [del, setDel] = useState<Group | null>(null);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState("");
  const assigningStudent = students.find((student) => student.id === assigning);

  return (
    <PageState status={status} retry={retry}>
      <PageHeader title="Grupos" description="Organize grupos e seus aventureiros." action={<Button onClick={() => setEditing("new")}><Plus /> Novo grupo</Button>} />
      {groups.length === 0 ? (
        <EmptyState title="Nenhum grupo formado" hint="Reúna aventureiros em grupos para partir em missões." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((t) => {
            const membros = membersOf(t);
            return (
              <Scroll key={t.id} className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <Crest spec={crestFromApi(t)} size={38} className="mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <h3 className="text-lg break-words">{t.name}</h3>
                      <p className="text-xs text-muted-foreground">{membros.length} membros</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Letra</p>
                    <p className="font-display text-base font-semibold">{t.letter || "Não informada"}</p>
                  </div>
                </div>
                <ul className="space-y-1.5 border-t border-border pt-3 text-sm">
                  {membros.map((m) => (
                    <li key={m.id} className="break-words">
                      <span>{m.name}</span><span className="text-muted-foreground"> · Matrícula {m.matricula}</span>
                    </li>
                  ))}
                  {membros.length === 0 && <li className="font-reading text-muted-foreground">Sem membros.</li>}
                </ul>
                <div className="mt-auto flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setEditing(t)}><Pencil /> Editar</Button>
                  <Button variant="ghost" size="icon" aria-label="Excluir" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDel(t)}><Trash2 /></Button>
                </div>
              </Scroll>
            );
          })}
        </div>
      )}
      <section aria-labelledby="unassigned-title" className="mt-8">
        <h2 id="unassigned-title" className="text-xl">Aventureiros sem grupo</h2>
        {unassigned.length === 0 ? (
          <p className="mt-3 font-reading text-sm text-muted-foreground">Nenhum aventureiro sem grupo.</p>
        ) : (
          <Scroll className="mt-3 p-0">
            <ul className="divide-y divide-border">
              {unassigned.map((student) => (
                <li key={student.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <span className="min-w-0 break-words"><span className="font-medium">{student.name}</span><span className="text-sm text-muted-foreground"> · Matrícula {student.matricula}</span></span>
                  <Button type="button" variant="outline" disabled={groups.length === 0} onClick={() => { setSelectedTeam(""); setAssigning(student.id); }} aria-label={`Adicionar ${student.name} a um grupo`}>Adicionar ao grupo</Button>
                </li>
              ))}
            </ul>
          </Scroll>
        )}
        {unassigned.length > 0 && groups.length === 0 && <p className="mt-2 text-sm text-muted-foreground">Crie um grupo para adicionar aventureiros.</p>}
      </section>
      <Sheet open={assigning !== null} onOpenChange={(open) => { if (!open) { setAssigning(null); setSelectedTeam(""); } }}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-display text-xl">Adicionar ao grupo</SheetTitle>
            <SheetDescription className="font-reading">Escolha um grupo para {assigningStudent?.name}.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <label htmlFor="assign-team" className="block text-sm font-medium">Grupo</label>
            <select id="assign-team" className={selectClass} value={selectedTeam} onChange={(event) => setSelectedTeam(event.target.value)}>
              <option value="">Selecione um grupo…</option>
              {groups.map((team) => <option key={team.id} value={team.id}>{team.name}{team.letter ? ` (${team.letter})` : ""}</option>)}
            </select>
            <Button type="button" disabled={!selectedTeam || !assigningStudent} onClick={() => {
              const target = groups.find((item) => item.id === Number(selectedTeam));
              if (!target || !assigningStudent) return;
              const ids = [...membersOf(target).map((s) => s.id), assigningStudent.id];
              setGroupMembers(target.id, ids).then(
                () => {
                  toast.success("Aventureiro adicionado ao grupo.");
                  setAssigning(null);
                  setSelectedTeam("");
                  refresh();
                },
                (error: unknown) => { toast.error(apiErrorMessage(error, "Não foi possível adicionar o aventureiro.")); },
              );
            }}>Adicionar</Button>
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-display text-xl">{editing === "new" ? "Novo grupo" : "Editar grupo"}</SheetTitle>
            <SheetDescription className="font-reading">Membros e pontos extras da equipe.</SheetDescription>
          </SheetHeader>
          {editing && <TeamForm key={editing === "new" ? "n" : editing.id} initial={editing === "new" ? null : editing} students={students} groups={groups} onDone={() => { setEditing(null); refresh(); }} />}
        </SheetContent>
      </Sheet>
      <Confirm open={!!del} onOpenChange={(o) => !o && setDel(null)} title="Excluir grupo?" description={`O grupo ${del?.name} será desfeito. Os aventureiros continuam na guilda.`} confirmLabel="Excluir" destructive
        onConfirm={() => {
          if (!del) return;
          deleteGroup(del.id).then(
            () => { toast.success("Grupo desfeito."); setDel(null); refresh(); },
            (error: unknown) => { toast.error(apiErrorMessage(error, "Não foi possível excluir o grupo.")); },
          );
        }} />
    </PageState>
  );
}



export { Grupos as GroupsPage };
