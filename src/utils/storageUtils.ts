import AsyncStorage from '@react-native-async-storage/async-storage';
import { StoredMatchState } from '../api/espn';

const KEYS = {
  SCOREBOARD_CACHE: 'scoreboard_cache',
  matchState: (id: string) => `match_state_${id}`,
  prediction: (id: string) => `prediction_${id}`,
};

export interface Prediction {
  homeScore: number;
  awayScore: number;
  savedAt: number;
}

// ─── Scoreboard Cache ───────────────────────────────────

export async function getCachedScoreboard(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEYS.SCOREBOARD_CACHE);
  } catch {
    return null;
  }
}

export async function cacheScoreboard(data: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.SCOREBOARD_CACHE, JSON.stringify(data));
  } catch {}
}

// ─── Match State (for notification diffing) ─────────────

export async function getMatchState(eventId: string): Promise<StoredMatchState | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.matchState(eventId));
    if (!raw) return null;
    return JSON.parse(raw) as StoredMatchState;
  } catch {
    return null;
  }
}

export async function saveMatchState(eventId: string, state: StoredMatchState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.matchState(eventId), JSON.stringify(state));
  } catch {}
}

export async function clearMatchState(eventId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.matchState(eventId));
  } catch {}
}

// ─── Predictions ────────────────────────────────────────

export async function getPrediction(eventId: string): Promise<Prediction | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.prediction(eventId));
    if (!raw) return null;
    return JSON.parse(raw) as Prediction;
  } catch {
    return null;
  }
}

export async function getAllPredictions(): Promise<Record<string, Prediction>> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const predKeys = keys.filter((k) => k.startsWith('prediction_'));
    const pairs = await AsyncStorage.multiGet(predKeys);
    const preds: Record<string, Prediction> = {};
    for (const [key, value] of pairs) {
      if (value) {
        const eventId = key.substring('prediction_'.length);
        preds[eventId] = JSON.parse(value) as Prediction;
      }
    }
    return preds;
  } catch {
    return {};
  }
}

export async function savePrediction(
  eventId: string,
  homeScore: number,
  awayScore: number
): Promise<void> {
  try {
    const pred: Prediction = { homeScore, awayScore, savedAt: Date.now() };
    await AsyncStorage.setItem(KEYS.prediction(eventId), JSON.stringify(pred));
  } catch {}
}

export async function deletePrediction(eventId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.prediction(eventId));
  } catch {}
}

