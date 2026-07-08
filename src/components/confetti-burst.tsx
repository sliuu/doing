import { useCallback, useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { CATEGORY_COLORS } from '@/db/categories';
import { Colors } from '@/constants/theme';

/**
 * Completion celebration state for a screen: call `celebrate(pos)` when a task is
 * completed (success haptic + confetti at the tap position), render `burst` via
 * <ConfettiBurst/> at the screen root.
 */
export function useCelebration() {
  const [burst, setBurst] = useState<{ x: number; y: number; id: number } | null>(null);

  const celebrate = useCallback((pos: { x: number; y: number }) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBurst({ ...pos, id: Date.now() });
  }, []);

  const clearBurst = useCallback(() => setBurst(null), []);

  return { burst, celebrate, clearBurst };
}

const NUM_PIECES = 18;
const DURATION_MS = 850;
const PIECE_COLORS = [...CATEGORY_COLORS, Colors.primary, Colors.text];

interface Piece {
  dx: number; // horizontal drift over the burst
  dy: number; // initial vertical kick (negative = up)
  rotate: string;
  color: string;
  size: number;
}

function makePieces(): Piece[] {
  return Array.from({ length: NUM_PIECES }, (_, i) => {
    const angle = (Math.PI * 2 * i) / NUM_PIECES + (Math.random() - 0.5) * 0.6;
    const speed = 50 + Math.random() * 80;
    return {
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed - 70, // bias the burst upward
      rotate: `${Math.round((Math.random() - 0.5) * 540)}deg`,
      color: PIECE_COLORS[i % PIECE_COLORS.length],
      size: 5 + Math.random() * 4,
    };
  });
}

/**
 * A short one-shot confetti pop at (x, y) in screen coordinates — rendered as a
 * full-screen, touch-transparent overlay. Mount it with a fresh `key` per burst;
 * it animates once and calls `onDone` so the parent can unmount it.
 */
export function ConfettiBurst({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const [pieces] = useState(makePieces);
  // useState (not useRef) so the Animated.Value is created once and readable during
  // render — React Compiler forbids reading ref.current while rendering.
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: DURATION_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) onDone();
    });
    return () => animation.stop();
  }, [progress, onDone]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: x - piece.size / 2,
            top: y - piece.size / 2,
            width: piece.size,
            height: piece.size,
            borderRadius: piece.size / 3,
            backgroundColor: piece.color,
            opacity: progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, piece.dx] }) },
              {
                // Out fast, then gravity pulls the piece back down past its start.
                translateY: progress.interpolate({
                  inputRange: [0, 0.45, 1],
                  outputRange: [0, piece.dy, piece.dy + 130],
                }),
              },
              { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', piece.rotate] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}
