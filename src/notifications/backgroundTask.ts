import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import {
  fetchScoreboard,
  ESPNEvent,
  ESPNCompetition,
  isLiveStatus,
  getHomeAway,
  MatchStatusName,
  StoredMatchState,
} from '../api/espn';
import { getMatchState, saveMatchState } from '../utils/storageUtils';
import { getTeamFlagEmoji } from '../utils/flagUtils';

export const BACKGROUND_FETCH_TASK = 'MUNDIAL2026_BACKGROUND_FETCH';

// ─── Notification Helpers ────────────────────────────────

async function sendNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null, // immediate
  });
}

// ─── State Diffing Logic ─────────────────────────────────

async function processEvent(event: ESPNEvent) {
  const comp: ESPNCompetition = event.competitions[0];
  if (!comp) return;

  const { home, away } = getHomeAway(comp);
  const currentStatus = comp.status.type.name as MatchStatusName;
  const homeName = home.team.shortDisplayName || home.team.name;
  const awayName = away.team.shortDisplayName || away.team.name;
  const homeScore = home.score ?? '0';
  const awayScore = away.score ?? '0';
  const homeFlag = getTeamFlagEmoji(home.team.abbreviation);
  const awayFlag = getTeamFlagEmoji(away.team.abbreviation);
  const scoreStr = `${homeFlag} ${homeName} ${homeScore} - ${awayScore} ${awayName} ${awayFlag}`;

  const currentGoals = (comp.details ?? [])
    .filter((d) => d.scoringPlay && !d.shootout)
    .map((d) => ({
      clock: d.clock.displayValue,
      teamId: d.team.id,
      playerName: d.athletesInvolved?.[0]?.shortName ?? 'Desconocido',
    }));

  const currentState: StoredMatchState = {
    eventId: event.id,
    statusName: currentStatus,
    homeScore,
    awayScore,
    homeTeamName: homeName,
    awayTeamName: awayName,
    homeTeamId: home.team.id,
    awayTeamId: away.team.id,
    goalDetails: currentGoals,
    timestamp: Date.now(),
  };

  const prevState = await getMatchState(event.id);

  if (!prevState) {
    // First time we see this event — only notify if it's live or just started
    if (isLiveStatus(currentStatus)) {
      await sendNotification(
        `⚽ ¡Empezó el partido ${homeName} vs ${awayName}!`,
        `Sigue la acción en vivo • ${scoreStr}`
      );
    }
    await saveMatchState(event.id, currentState);
    return;
  }

  const prevStatus = prevState.statusName;

  // ── Detect status transitions ──────────────────────────

  if (prevStatus === 'STATUS_SCHEDULED' && currentStatus === 'STATUS_IN_PROGRESS') {
    await sendNotification(
      `⚽ ¡Pitazo inicial! ${homeName} vs ${awayName}`,
      '¡El partido ha comenzado!'
    );
  }

  if (prevStatus !== 'STATUS_HALFTIME' && currentStatus === 'STATUS_HALFTIME') {
    await sendNotification(
      `⏸ Entretiempo: ${scoreStr}`,
      `${homeName} ${homeScore} - ${awayScore} ${awayName}`
    );
  }

  if (prevStatus === 'STATUS_HALFTIME' && currentStatus === 'STATUS_IN_PROGRESS') {
    await sendNotification(
      `▶️ Empezó el segundo tiempo: ${homeName} vs ${awayName}`,
      `Marcador actual: ${scoreStr}`
    );
  }

  if (prevStatus !== 'STATUS_EXTRA_TIME' && currentStatus === 'STATUS_EXTRA_TIME') {
    await sendNotification(
      `⚡ ¡Tiempo extra! ${homeName} vs ${awayName}`,
      `Marcador tras los 90 mins: ${scoreStr}`
    );
  }

  if (prevStatus !== 'STATUS_PENALTIES' && currentStatus === 'STATUS_PENALTIES') {
    await sendNotification(
      `🎯 ¡Definición por penales! ${homeName} vs ${awayName}`,
      `Marcador tras el alargue: ${scoreStr}`
    );
  }

  if (
    (prevStatus === 'STATUS_IN_PROGRESS' ||
      prevStatus === 'STATUS_EXTRA_TIME' ||
      prevStatus === 'STATUS_PENALTIES' ||
      prevStatus === 'STATUS_HALFTIME') &&
    (currentStatus === 'STATUS_FULL_TIME' || currentStatus === 'STATUS_FINAL')
  ) {
    await sendNotification(
      `🏁 Fin del partido: ${scoreStr}`,
      `Marcador final: ${homeName} ${homeScore} - ${awayScore} ${awayName}`
    );
  }

  // ── Detect goal changes ────────────────────────────────

  const prevHomeScore = parseInt(prevState.homeScore, 10);
  const prevAwayScore = parseInt(prevState.awayScore, 10);
  const currHomeScore = parseInt(homeScore, 10);
  const currAwayScore = parseInt(awayScore, 10);

  // Home team goal
  if (currHomeScore > prevHomeScore) {
    await sendNotification(
      `⚽ ¡GOL DE ${homeName.toUpperCase()}!`,
      scoreStr
    );
  }

  // Away team goal
  if (currAwayScore > prevAwayScore) {
    await sendNotification(
      `⚽ ¡GOL DE ${awayName.toUpperCase()}!`,
      scoreStr
    );
  }

  // Home goal disallowed (score dropped)
  if (currHomeScore < prevHomeScore) {
    await sendNotification(
      `❌ ¡Gol anulado a ${homeName.toUpperCase()}!`,
      `El marcador sigue: ${scoreStr}`
    );
  }

  // Away goal disallowed
  if (currAwayScore < prevAwayScore) {
    await sendNotification(
      `❌ ¡Gol anulado a ${awayName.toUpperCase()}!`,
      `El marcador sigue: ${scoreStr}`
    );
  }

  await saveMatchState(event.id, currentState);
}

// ─── Background Task Definition ─────────────────────────

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const data = await fetchScoreboard();
    const events = data.events ?? [];

    // Only process live or recently-started matches
    const relevant = events.filter(
      (e) =>
        isLiveStatus(e.status.type.name) ||
        e.status.type.state === 'pre' // also track upcoming to detect kick-off
    );

    await Promise.all(relevant.map(processEvent));

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ─── Registration ────────────────────────────────────────

export async function registerBackgroundFetchTask() {
  const status = await BackgroundFetch.getStatusAsync();
  const isAvailable = status === BackgroundFetch.BackgroundFetchStatus.Available;
  if (!isAvailable) return;

  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
  if (!isRegistered) {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 30, // seconds (iOS may throttle this)
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }
}

export async function unregisterBackgroundFetchTask() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
  if (isRegistered) {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
  }
}
