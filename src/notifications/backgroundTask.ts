import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// ─── Grace Period ─────────────────────────────────────────
// When the app transitions from background → active, we do one
// silent sync (no notifications) to baseline state, then allow
// subsequent polls to fire notifications normally.
let _gracePeriodActive = false;

export function activateGracePeriod() {
  _gracePeriodActive = true;
}

export function deactivateGracePeriod() {
  _gracePeriodActive = false;
}

// ─── Notification Helpers ────────────────────────────────

async function sendNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      channelId: 'matches-channel',
    },
  });
}

export async function sendTestNotification() {
  await sendNotification(
    '🔔 Prueba de Notificación',
    '¡Las notificaciones del Mundial 2026 están configuradas y listas!'
  );
}

// ─── Concurrency Lock Helpers ───────────────────────────

const LOCK_KEY = 'background_fetch_lock';
const LOCK_TIMEOUT = 10000; // 10 seconds

async function acquireLock(): Promise<boolean> {
  try {
    const lock = await AsyncStorage.getItem(LOCK_KEY);
    const now = Date.now();
    if (lock) {
      const lockTime = parseInt(lock, 10);
      if (now - lockTime < LOCK_TIMEOUT) {
        return false;
      }
    }
    await AsyncStorage.setItem(LOCK_KEY, now.toString());
    return true;
  } catch {
    return false;
  }
}

async function releaseLock(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LOCK_KEY);
  } catch {}
}

// ─── State Diffing Logic ─────────────────────────────────

function extractMatchState(event: ESPNEvent): StoredMatchState | null {
  const comp = event.competitions[0];
  if (!comp) return null;

  const { home, away } = getHomeAway(comp);
  const currentStatus = comp.status.type.name as MatchStatusName;
  const homeName = home.team.shortDisplayName || home.team.name;
  const awayName = away.team.shortDisplayName || away.team.name;
  const homeScore = home.score ?? '0';
  const awayScore = away.score ?? '0';

  const currentGoals = (comp.details ?? [])
    .filter((d) => d.scoringPlay && !d.shootout)
    .map((d) => ({
      clock: d.clock.displayValue,
      teamId: d.team.id,
      playerName: d.athletesInvolved?.[0]?.shortName ?? 'Desconocido',
    }));

  return {
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
}

async function processEvent(event: ESPNEvent) {
  const currentState = extractMatchState(event);
  if (!currentState) return;

  const comp = event.competitions[0];
  const { home, away } = getHomeAway(comp);
  const homeName = currentState.homeTeamName;
  const awayName = currentState.awayTeamName;
  const homeScore = currentState.homeScore;
  const awayScore = currentState.awayScore;
  const currentStatus = currentState.statusName;

  const homeFlag = getTeamFlagEmoji(home.team.abbreviation);
  const awayFlag = getTeamFlagEmoji(away.team.abbreviation);
  const scoreStr = `${homeFlag} ${homeName} ${homeScore} - ${awayScore} ${awayName} ${awayFlag}`;

  const prevState = await getMatchState(event.id);

  if (!prevState) {
    // First time we see this event — only notify if it's live
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

  // Direct transition from scheduled to finished/final (e.g. app was closed during the match)
  if (
    prevStatus === 'STATUS_SCHEDULED' &&
    (currentStatus === 'STATUS_FULL_TIME' || currentStatus === 'STATUS_FINAL')
  ) {
    await sendNotification(
      `🏁 Partido finalizado: ${scoreStr}`,
      `Resultado final: ${homeName} ${homeScore} - ${awayScore} ${awayName}`
    );
    await saveMatchState(event.id, currentState);
    return; // Skip goal notifications since match is over and we just notified the final result
  }

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
    await saveMatchState(event.id, currentState);
    return; // Skip separate goal notifications since final result is sent in the finish notification
  }

  // ── Detect goal changes (only if match is live/in progress) ───
  if (isLiveStatus(currentStatus)) {
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
  }

  await saveMatchState(event.id, currentState);
}

// ─── Foreground State Sync (Without Notifications) ───────
// Called on first fetch after app becomes active to silently
// baseline state and avoid batched stale notification bursts.
export async function syncMatchStatesWithoutNotifications(events: ESPNEvent[]) {
  const relevant = events.filter(
    (e) =>
      isLiveStatus(e.status.type.name) ||
      e.status.type.state === 'pre'
  );

  for (const event of relevant) {
    const currentState = extractMatchState(event);
    if (currentState) {
      await saveMatchState(event.id, currentState);
    }
  }
}

// ─── Foreground Polling (With Notifications) ─────────────
// Called by React Query on subsequent refetches while app is open.
// Sends live notifications but respects the grace period.
export async function syncMatchStatesWithNotifications(events: ESPNEvent[]) {
  if (_gracePeriodActive) {
    // First poll after app reopen — silently baseline, then disable grace period
    await syncMatchStatesWithoutNotifications(events);
    _gracePeriodActive = false;
    return;
  }

  const relevant = events.filter(
    (e) =>
      isLiveStatus(e.status.type.name) ||
      e.status.type.state === 'pre'
  );

  for (const event of relevant) {
    await processEvent(event);
  }
}

// ─── Background Task Definition ─────────────────────────

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  // If the app is active in the foreground, we let the normal app state updates
  // handle scoreboard fetches and state caching to avoid spam/redundancy.
  if (AppState.currentState === 'active') {
    return BackgroundFetch.BackgroundFetchResult.NoData;
  }

  const hasLock = await acquireLock();
  if (!hasLock) {
    return BackgroundFetch.BackgroundFetchResult.NoData;
  }

  try {
    const data = await fetchScoreboard();
    const events = data.events ?? [];

    const relevant = events.filter(
      (e) =>
        isLiveStatus(e.status.type.name) ||
        e.status.type.state === 'pre'
    );

    // Run sequentially to prevent concurrent AsyncStorage writes and duplicate trigger races
    for (const event of relevant) {
      await processEvent(event);
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (err) {
    console.error('Error in background fetch task:', err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  } finally {
    await releaseLock();
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
      // Android WorkManager enforces a minimum of ~15 minutes regardless of
      // what value is set here. Setting 30s was being silently ignored by the OS.
      // The real-time polling while the app is foregrounded is handled by
      // React Query (useScoreboard) which is not affected by this limit.
      minimumInterval: 900, // 15 minutes
      stopOnTerminate: false, // keep task registered when app is closed by system
      startOnBoot: true,    // re-register after device reboot
    });
  }
}

export async function unregisterBackgroundFetchTask() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
  if (isRegistered) {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
  }
}
