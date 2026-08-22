import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Keyboard,
} from 'react-native';
import { ESPNEvent, getHomeAway, isLiveStatus, isFinishedStatus } from '../api/espn';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';
import { formatLocalTime } from '../utils/dateUtils';
import { LiveBadge } from './LiveBadge';
import { savePrediction, Prediction } from '../utils/storageUtils';
import { translateTeamName } from '../utils/flagUtils';

function formatGroupNote(note: string): string {
  if (!note) return '';
  const groupMatch = note.match(/Group\s+([A-L])/i);
  if (groupMatch) {
    return `Grupo ${groupMatch[1].toUpperCase()}`;
  }
  
  let lower = note.toLowerCase();
  if (lower.includes('round of 32')) return 'Ronda de 32';
  if (lower.includes('round of 16')) return 'Octavos de Final';
  if (lower.includes('quarterfinal')) return 'Cuartos de Final';
  if (lower.includes('semifinal')) return 'Semifinales';
  if (lower.includes('third place')) return 'Tercer Puesto';
  if (lower.includes('final')) return 'Final';
  
  return note.replace(/FIFA World Cup,/gi, '').trim();
}

function formatVenueNameAndCity(venueName: string, city: string): string {
  let cleanStadium = venueName ?? '';
  let cleanCity = city ?? '';

  cleanStadium = cleanStadium.replace(/GEHA Field at\s+/gi, '');

  if (!cleanStadium) return cleanCity;
  if (!cleanCity) return cleanStadium;

  return `${cleanStadium}, ${cleanCity}`;
}

interface MatchCardProps {
  event: ESPNEvent;
  prediction: Prediction | null;
  onPredictionSaved: () => void;
  onStartEdit?: (y: number, height: number) => void;
  isEditing: boolean;
  onCancelEdit?: () => void;
  onConfirmAndNext?: (homeScore: number, awayScore: number) => void;
  onLayout?: (y: number, height: number) => void;
  onRegisterHomeRef?: (ref: any) => void;
}

export function MatchCard({
  event,
  prediction,
  onPredictionSaved,
  onStartEdit,
  isEditing,
  onCancelEdit,
  onConfirmAndNext,
  onLayout,
  onRegisterHomeRef,
}: MatchCardProps) {
  const comp = event.competitions[0];
  const { home, away } = getHomeAway(comp);
  const statusName = comp.status.type.name;
  const isLive = isLiveStatus(statusName);
  const isFinished = isFinishedStatus(statusName);
  const isScheduled = comp.status.type.state === 'pre';

  const [homeInput, setHomeInput] = useState(prediction ? String(prediction.homeScore) : '');
  const [awayInput, setAwayInput] = useState(prediction ? String(prediction.awayScore) : '');
  const [cardY, setCardY] = useState(0);
  const [cardHeight, setCardHeight] = useState(0);
  const [isHomeFocused, setIsHomeFocused] = useState(false);
  const [isAwayFocused, setIsAwayFocused] = useState(false);

  const homeInputRef = useRef<TextInput>(null);
  const awayInputRef = useRef<TextInput>(null);

  useEffect(() => {
    setHomeInput(prediction ? String(prediction.homeScore) : '');
    setAwayInput(prediction ? String(prediction.awayScore) : '');
  }, [prediction]);

  const venueDisplay = formatVenueNameAndCity(
    comp.venue?.fullName ?? comp.venue?.displayName ?? '',
    comp.venue?.address?.city ?? ''
  );
  const groupNote = formatGroupNote(comp.altGameNote ?? '');

  const displayClock = comp.status.displayClock;

  function handleStartEdit() {
    if (onStartEdit) {
      onStartEdit(cardY, cardHeight);
    }
  }

  async function handleConfirm() {
    Keyboard.dismiss();
    const hParsed = parseInt(homeInput.trim(), 10);
    const aParsed = parseInt(awayInput.trim(), 10);
    const h = isNaN(hParsed) ? 0 : hParsed;
    const a = isNaN(aParsed) ? 0 : aParsed;

    if (h < 0 || a < 0) return;

    await savePrediction(event.id, h, a);
    onPredictionSaved();
    if (onConfirmAndNext) {
      onConfirmAndNext(h, a);
    }
  }

  const handleHomeChange = (text: string) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    setHomeInput(cleanText);

    if (cleanText.trim().length > 0) {
      if (awayInput.trim() === '') {
        awayInputRef.current?.focus();
      }
    }
  };

  const handleAwayChange = (text: string) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    setAwayInput(cleanText);
  };

  function renderStatusBadge() {
    if (isEditing) return null;
    if (statusName === 'STATUS_HALFTIME' || statusName === 'STATUS_EXTRA_TIME_HALFTIME') {
      return (
        <View style={styles.liveContainer}>
          <LiveBadge />
          <Text style={styles.liveMinute}>ENTRETIEMPO</Text>
        </View>
      );
    }
    if (isLive) {
      return (
        <View style={styles.liveContainer}>
          <LiveBadge />
          <Text style={styles.liveMinute}>{displayClock}</Text>
        </View>
      );
    }
    if (isFinished) {
      return (
        <View style={[styles.statusBadge, styles.finishedBadge]}>
          <Text style={[styles.statusText, styles.finishedText]}>FINALIZADO</Text>
        </View>
      );
    }
    return null;
  }

  function renderScore() {
    if (isEditing) {
      return (
        <View style={styles.editScoreContainer}>
          <TextInput
            ref={(ref) => {
              homeInputRef.current = ref;
              if (onRegisterHomeRef) {
                onRegisterHomeRef(ref);
              }
            }}
            style={styles.editScoreInput}
            value={homeInput}
            onChangeText={handleHomeChange}
            keyboardType="number-pad"
            maxLength={2}
            placeholder={isHomeFocused ? "" : "0"}
            placeholderTextColor={Colors.textMuted}
            selectionColor={Colors.gold}
            onFocus={() => setIsHomeFocused(true)}
            onBlur={() => setIsHomeFocused(false)}
            autoFocus
          />
          <Text style={styles.editScoreSeparator}>-</Text>
          <TextInput
            ref={awayInputRef}
            style={styles.editScoreInput}
            value={awayInput}
            onChangeText={handleAwayChange}
            keyboardType="number-pad"
            maxLength={2}
            placeholder={isAwayFocused ? "" : "0"}
            placeholderTextColor={Colors.textMuted}
            selectionColor={Colors.gold}
            onFocus={() => setIsAwayFocused(true)}
            onBlur={() => setIsAwayFocused(false)}
          />
        </View>
      );
    }

    if (isLive || isFinished || statusName === 'STATUS_HALFTIME') {
      return (
        <View style={styles.scoreContainer}>
          <Text
            style={[
              styles.score,
              isLive && styles.scoreLive,
              isFinished && styles.scoreFinished,
            ]}
          >
            {home.score}
          </Text>
          <Text style={styles.scoreSeparator}>-</Text>
          <Text
            style={[
              styles.score,
              isLive && styles.scoreLive,
              isFinished && styles.scoreFinished,
            ]}
          >
            {away.score}
          </Text>
        </View>
      );
    }
    if (isScheduled) {
      return (
        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>VS</Text>
        </View>
      );
    }
    return null;
  }

  return (
    <View
      style={styles.card}
      onLayout={(e) => {
        const { y, height } = e.nativeEvent.layout;
        setCardY(y);
        setCardHeight(height);
        if (onLayout) {
          onLayout(y, height);
        }
      }}
    >
      <View style={styles.cardHeader}>
        {groupNote ? (
          <Text style={styles.groupNote}>{groupNote}</Text>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <Text style={styles.cardTime}>{formatLocalTime(event.date)}</Text>
      </View>

      <View style={styles.matchRow}>
        <View style={styles.teamSide}>
          <Image
            source={{ uri: home.team.logo }}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.teamName} numberOfLines={2}>
            {translateTeamName(home.team.shortDisplayName)}
          </Text>
        </View>

        <View style={styles.centerColumn}>
          {renderStatusBadge()}
          {renderScore()}
        </View>

        <View style={[styles.teamSide, styles.teamSideRight]}>
          <Image
            source={{ uri: away.team.logo }}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.teamName, styles.teamNameRight]} numberOfLines={2}>
            {translateTeamName(away.team.shortDisplayName)}
          </Text>
        </View>
      </View>

      {isEditing ? (
        <View style={styles.cardFooterEdit}>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} activeOpacity={0.8}>
            <Text style={styles.confirmButtonText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cardFooter}>
          <View style={styles.venueContainer}>
            {venueDisplay ? (
              <Text style={styles.venue} numberOfLines={1}>
                📍 {venueDisplay}
              </Text>
            ) : null}
          </View>

          <View style={styles.predictionContainer}>
            {prediction ? (
              <TouchableOpacity onPress={handleStartEdit} activeOpacity={0.7}>
                <Text style={styles.predictionText}>
                  Tu predicción: {prediction.homeScore} - {prediction.awayScore}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.predictButton}
                onPress={handleStartEdit}
                activeOpacity={0.7}
              >
                <Text style={styles.predictButtonText}>Pronosticar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  groupNote: {
    color: Colors.gold,
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightSemiBold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    flex: 1,
  },
  cardTime: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightSemiBold,
  },
  vsContainer: {
    backgroundColor: Colors.cardBgAlt,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  vsText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightBold,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  teamSide: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  teamSideRight: {
    alignItems: 'center',
  },
  logo: {
    width: 48,
    height: 48,
  },
  teamName: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
    textAlign: 'center',
  },
  teamNameRight: {
    textAlign: 'center',
  },
  winnerName: {
    color: Colors.goldLight,
  },
  centerColumn: {
    flex: 0,
    minWidth: 90,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  liveContainer: {
    alignItems: 'center',
    gap: 4,
  },
  liveMinute: {
    color: Colors.live,
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
  },
  statusBadge: {
    backgroundColor: Colors.cardBgAlt,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  finishedBadge: {
    borderColor: Colors.finishedDim,
  },
  statusText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightBold,
    letterSpacing: 0.5,
  },
  finishedText: {
    color: Colors.finished,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  score: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeXXL,
    fontWeight: Typography.fontWeightExtraBold,
  },
  scoreLive: {
    color: Colors.textPrimary,
  },
  scoreFinished: {
    color: Colors.textPrimary,
  },
  scoreSeparator: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
  },
  kickoffTime: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
  },
  editScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  editScoreInput: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: Radius.sm,
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
    textAlign: 'center',
    width: 36,
    height: 36,
    padding: 0,
  },
  editScoreSeparator: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightBold,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  cardFooterEdit: {
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  confirmButton: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 6,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
  },
  venueContainer: {
    flex: 1,
  },
  venue: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizeXS,
  },
  predictionContainer: {
    flexShrink: 0,
    alignItems: 'flex-end',
  },
  predictionText: {
    color: Colors.gold,
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
  },
  predictButton: {
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  predictButtonText: {
    color: Colors.gold,
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightBold,
  },
});
