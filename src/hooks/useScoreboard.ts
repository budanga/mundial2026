import { useQuery } from '@tanstack/react-query';
import { fetchScoreboard, ESPNScoreboardResponse, isLiveStatus } from '../api/espn';
import { cacheScoreboard, getCachedScoreboard } from '../utils/storageUtils';
import { isWithinMinutes } from '../utils/dateUtils';
import { syncMatchStatesWithNotifications } from '../notifications/backgroundTask';

function computeRefetchInterval(data: ESPNScoreboardResponse | undefined): number | false {
  if (!data) return 60_000;

  const events = data.events ?? [];

  const hasLive = events.some((e) => isLiveStatus(e.status.type.name));
  if (hasLive) return 30_000; // 30 seconds

  const hasUpcoming = events.some((e) =>
    e.status.type.state === 'pre' && isWithinMinutes(e.date, 60)
  );
  if (hasUpcoming) return 60_000; // 1 minute

  return 300_000; // 5 minutes
}

export function useScoreboard() {
  return useQuery<ESPNScoreboardResponse>({
    queryKey: ['scoreboard'],
    queryFn: async () => {
      try {
        const data = await fetchScoreboard();
        await cacheScoreboard(data);
        if (data.events) {
          await syncMatchStatesWithNotifications(data.events).catch(console.error);
        }
        return data;
      } catch (err) {
        // fallback to cached data
        const cached = await getCachedScoreboard();
        if (cached) {
          return JSON.parse(cached) as ESPNScoreboardResponse;
        }
        throw err;
      }
    },
    refetchInterval: (query) => computeRefetchInterval(query.state.data),
    staleTime: 0,
  });
}
