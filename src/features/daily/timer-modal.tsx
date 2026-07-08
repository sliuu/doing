import { useEffect, useRef } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getLiveDurationSeconds } from '@/db/instances';
import { formatDurationShort, formatTimer } from '@/lib/format';

import { DailyItem, DayMode, effectiveExpectedMinutes } from '@/features/daily/types';
import { PieProgress } from '@/features/daily/pie-progress';
import { DurationPicker } from '@/features/shared/duration-picker';

const ADJUST_STEPS_SECONDS = [-60, 60, 600];
const PIE_SIZE = 200;
const GONG_SOUND = require('../../../assets/sounds/gong.wav');

export function TimerModal({
  item,
  now,
  dayMode,
  onToggleRunning,
  onAdjust,
  onChangeExpectedDuration,
  onComplete,
  onClose,
}: {
  item: DailyItem;
  now: number;
  dayMode: DayMode;
  onToggleRunning: () => void;
  onAdjust: (deltaSeconds: number) => void;
  onChangeExpectedDuration: (totalMinutes: number) => void;
  onComplete: () => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const { task, instance } = item;
  const liveSeconds = getLiveDurationSeconds(instance, now);
  const expectedMinutes = effectiveExpectedMinutes(task.expectedDuration, dayMode);
  const expectedSeconds = expectedMinutes ? expectedMinutes * 60 : null;
  const reachedExpected = expectedSeconds !== null && liveSeconds >= expectedSeconds;
  const isRunning = instance.timerState === 'running';

  const fraction = expectedSeconds ? liveSeconds / expectedSeconds : 0;
  const remainingSeconds = expectedSeconds === null ? liveSeconds : Math.max(0, expectedSeconds - liveSeconds);
  const overtimeSeconds = expectedSeconds === null ? 0 : Math.max(0, liveSeconds - expectedSeconds);

  const gongPlayer = useAudioPlayer(GONG_SOUND);
  // Skip the chime if the modal is opened already past the expected duration — it should only fire on the live transition.
  const hasChimedRef = useRef(reachedExpected);

  useEffect(() => {
    if (reachedExpected && !hasChimedRef.current) {
      hasChimedRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      gongPlayer.seekTo(0);
      gongPlayer.play();
    }
    if (!reachedExpected) {
      hasChimedRef.current = false;
    }
  }, [reachedExpected, gongPlayer]);

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()} style={styles.cardWrapper}>
        <ThemedView style={[styles.card, { backgroundColor: theme.background }]} type="background">
          <View style={styles.headerRow}>
            <ThemedText type="subtitle" style={{ flex: 1 }} numberOfLines={2}>
              {task.title}
            </ThemedText>
            <Pressable
              onPress={onComplete}
              style={[styles.markDoneButton, { backgroundColor: theme.primary }]}>
              <ThemedText type="small" style={{ color: theme.onPrimary }}>
                Mark done
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.targetRow}>
            <ThemedText type="small" themeColor="textSecondary">
              Target
            </ThemedText>
            {isRunning ? (
              <ThemedText type="small">
                {expectedSeconds !== null ? formatDurationShort(expectedSeconds) : 'Not set'}
              </ThemedText>
            ) : (
              <View style={{ flex: 1 }}>
                <DurationPicker totalMinutes={task.expectedDuration ?? 0} onChange={onChangeExpectedDuration} />
              </View>
            )}
          </View>

          {expectedSeconds !== null ? (
            <View style={styles.pieWrap}>
              <PieProgress
                size={PIE_SIZE}
                fraction={fraction}
                color={reachedExpected ? theme.today : theme.primary}
                trackColor={theme.backgroundElement}
              />
              <View style={styles.pieCenter}>
                <ThemedText style={styles.clock} themeColor={reachedExpected ? 'today' : 'text'}>
                  {formatTimer(remainingSeconds)}
                </ThemedText>
              </View>
            </View>
          ) : (
            <ThemedText style={styles.clock} themeColor="text">
              {formatTimer(liveSeconds)}
            </ThemedText>
          )}

          {reachedExpected && (
            <View style={{ alignItems: 'center', gap: 2 }}>
              <ThemedText themeColor="today" style={{ textAlign: 'center' }}>
                expected time reached — keep going if you like
              </ThemedText>
              <ThemedText style={styles.overtimeClock} themeColor="today">
                +{formatTimer(overtimeSeconds)}
              </ThemedText>
            </View>
          )}

          <Pressable
            onPress={onToggleRunning}
            style={[styles.primaryButton, { backgroundColor: isRunning ? theme.backgroundSelected : theme.primary }]}>
            <ThemedText style={{ color: isRunning ? theme.text : theme.onPrimary }}>
              {isRunning ? 'Pause' : 'Start'}
            </ThemedText>
          </Pressable>

          <View style={styles.adjustRow}>
            {ADJUST_STEPS_SECONDS.map((delta) => (
              <Pressable
                key={delta}
                onPress={() => onAdjust(delta)}
                style={[styles.adjustButton, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="small">
                  {delta > 0 ? '+' : ''}
                  {delta / 60}m
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.actionButton}>
              <ThemedText themeColor="textSecondary">Minimize</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  cardWrapper: {
    width: '100%',
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  markDoneButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pieWrap: {
    alignSelf: 'center',
    width: PIE_SIZE,
    height: PIE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clock: {
    fontFamily: Fonts.serif,
    fontSize: 44,
    lineHeight: 52,
    fontWeight: '600',
    textAlign: 'center',
  },
  overtimeClock: {
    fontFamily: Fonts.serif,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  adjustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  adjustButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  actionButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
