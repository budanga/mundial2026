import { useQuery } from '@tanstack/react-query';
import { fetchMatchSummary, ESPNSummaryResponse, MatchStatusName } from '../api/espn';

export function useMatchSummary(eventId: string, statusName: MatchStatusName) {
  const isLive = [
    'STATUS_IN_PROGRESS',
    'STATUS_HALFTIME',
    'STATUS_EXTRA_TIME',
    'STATUS_EXTRA_TIME_HALFTIME',
    'STATUS_PENALTIES',
  ].includes(statusName);

  return useQuery<ESPNSummaryResponse>({
    queryKey: ['matchSummary', eventId],
    queryFn: () => fetchMatchSummary(eventId),
    enabled: !!eventId,
    refetchInterval: isLive ? 30_000 : false,
    staleTime: isLive ? 0 : 60_000,
  });
}
