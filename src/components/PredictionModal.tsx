import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
} from 'react-native';
import { ESPNEvent, getHomeAway } from '../api/espn';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';
import {
  getPrediction,
  savePrediction,
  deletePrediction,
  Prediction,
} from '../utils/storageUtils';

interface PredictionModalProps {
  event: ESPNEvent | null;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function PredictionModal({ event, visible, onClose, onSaved }: PredictionModalProps) {
  const [homeInput, setHomeInput] = useState('');
  const [awayInput, setAwayInput] = useState('');
  const [existing, setExisting] = useState<Prediction | null>(null);

  useEffect(() => {
    if (!event) return;
    getPrediction(event.id).then((pred) => {
      setExisting(pred);
      setHomeInput(pred ? String(pred.homeScore) : '');
      setAwayInput(pred ? String(pred.awayScore) : '');
    });
  }, [event?.id, visible]);

  if (!event) return null;

  const comp = event.competitions[0];
  const { home, away } = getHomeAway(comp);

  async function handleSave() {
    const hParsed = parseInt(homeInput.trim(), 10);
    const aParsed = parseInt(awayInput.trim(), 10);
    
    // Default to 0 if input is empty
    const h = isNaN(hParsed) ? 0 : hParsed;
    const a = isNaN(aParsed) ? 0 : aParsed;

    if (h < 0 || a < 0) return;

    await savePrediction(event!.id, h, a);
    onSaved();
    onClose();
  }

  async function handleDelete() {
    await deletePrediction(event!.id);
    onSaved();
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.wrapper}
      >
        <View style={styles.overlay}>
          {/* Background dismiss pressable */}
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

          {/* Modal Sheet Container */}
          <View style={styles.container}>
            {/* Header Handle */}
            <View style={styles.handle} />
            <Text style={styles.title}>Tu Predicción</Text>
            <Text style={styles.matchName}>{event.name}</Text>

            {/* Teams & Inputs */}
            <View style={styles.teamsRow}>
              {/* Home */}
              <View style={styles.teamCol}>
                <Image
                  source={{ uri: home.team.logo }}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.teamName}>{home.team.shortDisplayName}</Text>
                <TextInput
                  style={styles.input}
                  value={homeInput}
                  onChangeText={setHomeInput}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  selectionColor={Colors.gold}
                />
              </View>

              <Text style={styles.vs}>vs</Text>

              {/* Away */}
              <View style={styles.teamCol}>
                <Image
                  source={{ uri: away.team.logo }}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.teamName}>{away.team.shortDisplayName}</Text>
                <TextInput
                  style={styles.input}
                  value={awayInput}
                  onChangeText={setAwayInput}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  selectionColor={Colors.gold}
                />
              </View>
            </View>

            {/* Actions */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveButtonText}>💾 Guardar Predicción</Text>
            </TouchableOpacity>

            {existing && (
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>🗑 Eliminar Predicción</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.modalBg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xxl : Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: Radius.round,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.gold,
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  matchName: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeSM,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: Spacing.xl,
  },
  teamCol: {
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  logo: {
    width: 56,
    height: 56,
  },
  teamName: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
    textAlign: 'center',
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 2,
    borderColor: Colors.borderGold,
    borderRadius: Radius.md,
    color: Colors.gold,
    fontSize: Typography.fontSizeXXL,
    fontWeight: Typography.fontWeightBold,
    textAlign: 'center',
    width: 70,
    height: 60,
    paddingHorizontal: Spacing.sm,
  },
  vs: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
    marginHorizontal: Spacing.sm,
  },
  saveButton: {
    backgroundColor: Colors.gold,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  saveButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
  },
  deleteButton: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  deleteButtonText: {
    color: Colors.live,
    fontSize: Typography.fontSizeMD,
  },
  cancelButton: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizeMD,
  },
});

