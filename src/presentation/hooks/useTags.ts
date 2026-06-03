import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { TagRepository } from '@infra/database/repositories/tag-repository';

export function useTags() {
  const repo = useMemo(() => new TagRepository(), []);
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => repo.findAll(),
    staleTime: Infinity,
  });
}
