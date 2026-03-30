import React, { useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  TouchableOpacity,
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../lib/theme';

const AVATAR_SMALL = 72;
const AVATAR_LARGE_W = 200;
const AVATAR_LARGE_H = 280;
const { width: SW, height: SH } = Dimensions.get('window');

// Default start: bottom-left
const START_X = 16;
const START_Y = SH - 200;

interface FloatingAvatarProps {
  onPress: () => void;
}

export default function FloatingAvatar({ onPress }: FloatingAvatarProps) {
  const [isLarge, setIsLarge] = useState(false);
  const [muted, setMuted] = useState(true);

  // Position
  const pan = useRef(new Animated.ValueXY({ x: START_X, y: START_Y })).current;
  const panOffset = useRef({ x: START_X, y: START_Y });

  // Animated size
  const widthAnim = useRef(new Animated.Value(AVATAR_SMALL)).current;
  const heightAnim = useRef(new Animated.Value(AVATAR_SMALL)).current;
  const borderAnim = useRef(new Animated.Value(radius.full)).current;

  // Pulse ring opacity
  const pulseAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!muted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
    }
  }, [muted]);

  const toggleSize = () => {
    const toW = isLarge ? AVATAR_SMALL : AVATAR_LARGE_W;
    const toH = isLarge ? AVATAR_SMALL : AVATAR_LARGE_H;
    const toBorder = isLarge ? radius.full : radius.xxl;

    Animated.spring(widthAnim, { toValue: toW, useNativeDriver: false, damping: 20, stiffness: 200 }).start();
    Animated.spring(heightAnim, { toValue: toH, useNativeDriver: false, damping: 20, stiffness: 200 }).start();
    Animated.spring(borderAnim, { toValue: toBorder, useNativeDriver: false, damping: 20, stiffness: 200 }).start();

    setIsLarge(!isLarge);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 3 || Math.abs(gs.dy) > 3,
      onPanResponderGrant: () => {
        pan.setOffset({ x: panOffset.current.x, y: panOffset.current.y });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gs) => {
        pan.flattenOffset();
        // Clamp to screen bounds
        const newX = Math.max(0, Math.min(SW - AVATAR_SMALL, panOffset.current.x + gs.dx));
        const newY = Math.max(60, Math.min(SH - AVATAR_SMALL - 80, panOffset.current.y + gs.dy));
        panOffset.current = { x: newX, y: newY };
        Animated.spring(pan, {
          toValue: { x: newX, y: newY },
          useNativeDriver: false,
          damping: 20,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[styles.wrapper, { transform: pan.getTranslateTransform() }]}
      {...panResponder.panHandlers}
    >
      {/* Main avatar body */}
      <Animated.View
        style={[
          styles.avatarBody,
          {
            width: widthAnim,
            height: heightAnim,
            borderRadius: borderAnim,
          },
        ]}
      >
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&h=600' }}
          style={styles.avatarImage}
          resizeMode="cover"
        />

        {/* Overlay tint */}
        <View style={[styles.overlay, { opacity: muted ? 0.05 : 0.15 }]} />

        {/* Listening indicator (large mode) */}
        {isLarge && !muted && (
          <View style={styles.listeningOverlay}>
            <View style={styles.listeningBars}>
              {[1, 2, 3, 4, 5].map((b) => (
                <View key={b} style={[styles.bar, { height: 8 + b * 5 }]} />
              ))}
            </View>
          </View>
        )}

        {/* Tap to open assistant (small mode) */}
        {!isLarge && (
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onPress} />
        )}
      </Animated.View>

      {/* Pulse ring when active */}
      {!isLarge && (
        <Animated.View style={[styles.pulseRing, { opacity: pulseAnim }]} />
      )}

      {/* Mute badge */}
      {!isLarge && (
        <TouchableOpacity
          style={[styles.badge, { backgroundColor: muted ? colors.error : colors.success }]}
          onPress={() => setMuted(!muted)}
        >
          <Ionicons name={muted ? 'mic-off' : 'mic'} size={12} color={colors.white} />
        </TouchableOpacity>
      )}

      {/* Expand / collapse button */}
      <TouchableOpacity style={styles.expandBtn} onPress={toggleSize}>
        <Ionicons
          name={isLarge ? 'contract-outline' : 'expand-outline'}
          size={13}
          color={colors.white}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    zIndex: 999,
  },
  avatarBody: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.onSurface,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
  },
  listeningOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  listeningBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  pulseRing: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: AVATAR_SMALL + 12,
    height: AVATAR_SMALL + 12,
    borderRadius: (AVATAR_SMALL + 12) / 2,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    zIndex: 10,
  },
  expandBtn: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    zIndex: 10,
  },
});
