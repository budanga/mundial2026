import { useQuery } from '@tanstack/react-query';
import { fetchStandings, ESPNStandingsResponse } from '../api/espn';

export function useStandings() {
  return useQuery<ESPNStandingsResponse>({
    queryKey: ['standings'],
    queryFn: fetchStandings,
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: 1,
  });
}
