'use client';

import type { PersonaDto } from '@heliograph/contracts';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

const personaKeys = {
  all: ['personas'] as const,
  list: (status?: string) => ['personas', 'list', status ?? 'all'] as const,
  detail: (id: string) => ['personas', 'detail', id] as const,
};

/** Cursor-paginated list (rule 4): pages are appended, never re-fetched as a whole. */
export function usePersonaList(status?: PersonaDto['status']) {
  return useInfiniteQuery({
    queryKey: personaKeys.list(status),
    queryFn: ({ pageParam }) =>
      api.persona.list({
        limit: 25,
        ...(pageParam ? { cursor: pageParam } : {}),
        ...(status ? { status } : {}),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.page.nextCursor ?? undefined,
  });
}

export function usePersona(id: string) {
  return useQuery({ queryKey: personaKeys.detail(id), queryFn: () => api.persona.get({ id }) });
}

type UpdateInput = Parameters<typeof api.persona.update>[0];

/** Every mutation writes the returned persona into the detail cache and drops list pages. */
export function usePersonaMutations(id: string) {
  const queryClient = useQueryClient();
  const settle = (persona: PersonaDto) => {
    queryClient.setQueryData(personaKeys.detail(id), persona);
    queryClient.removeQueries({ queryKey: ['personas', 'list'] });
  };
  const update = useMutation({
    mutationFn: (input: Omit<UpdateInput, 'id'>) => api.persona.update({ id, ...input }),
    onSuccess: settle,
  });
  const activate = useMutation({
    mutationFn: () => api.persona.activate({ id }),
    onSuccess: settle,
  });
  const pause = useMutation({ mutationFn: () => api.persona.pause({ id }), onSuccess: settle });
  const archive = useMutation({ mutationFn: () => api.persona.archive({ id }), onSuccess: settle });
  return { update, activate, pause, archive };
}

export function useCreatePersona() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.persona.create>[0]) => api.persona.create(input),
    onSuccess: (persona) => {
      queryClient.setQueryData(personaKeys.detail(persona.id), persona);
      queryClient.removeQueries({ queryKey: ['personas', 'list'] });
    },
  });
}

/** Maps an oRPC/problem error to a domain code when the server sent one. */
export function problemCode(error: unknown): string | null {
  const data = (error as { data?: { problem?: { code?: string } } } | null)?.data;
  return data?.problem?.code ?? null;
}
