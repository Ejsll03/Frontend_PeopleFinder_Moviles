import React, { useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Platform,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler'; // npm: react-native-gesture-handler
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Shadows } from '../theme';

const { width: W, height: H } = Dimensions.get('window');
const SWIPE_THRESHOLD = W * 0.28;
const ROTATION_FACTOR = 12;

// ─── Datos de muestra ────────────────────────────────────────────────────────
const PROFILES = [
  { id: '1', initials: 'JS', name: 'Juan Sebastián', age: 26, city: 'CDMX', distance: '2km', job: 'Diseñador UX', compatibility: 87, tags: ['Música', 'Café', 'Diseño'], colors: ['#6D28D9', '#2d0a5e', '#0f1a3d'], accent: '#A78BFA' },
  { id: '2', initials: 'CR', name: 'Camila Reyes', age: 24, city: 'CDMX', distance: '5km', job: 'Artista', compatibility: 92, tags: ['Arte', 'Viajes', 'Café'], colors: ['#9D174D', '#1a0533', '#0d2b3d'], accent: '#F472B6' },
  { id: '3', initials: 'MR', name: 'Miguel Rodríguez', age: 28, city: 'CDMX', distance: '8km', job: 'Desarrollador', compatibility: 78, tags: ['Gaming', 'Tech', 'Música'], colors: ['#065F46', '#0d2b3d', '#1a0533'], accent: '#6EE7B7' },
  { id: '4', initials: 'LP', name: 'Lucía Pérez', age: 25, city: 'CDMX', distance: '3km', job: 'Fotógrafa', compatibility: 81, tags: ['Foto', 'Viajes', 'Arte'], colors: ['#92400E', '#1a0533', '#2d1a0a'], accent: '#FCD34D' },
];

// ─── Indicador de compatibilidad ─────────────────────────────────────────────
function CompatBar({ value }) {
  const fillAnim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(fillAnim, { toValue: value / 100, duration: 800, delay: 200, useNativeDriver: false }).start();
  }, [value]);
  const width = fillAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={compatStyles.row}>
      <View style={compatStyles.track}>
        <Animated.View style={[compatStyles.fill, { width }]}>
          <LinearGradient colors={[Colors.accent, Colors.accentCyan]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        </Animated.View>
      </View>
      <Text style={compatStyles.pct}>{value}% compatible</Text>
    </View>
  );
}
const compatStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  track: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
  pct: { fontFamily: Fonts.sans, fontSize: 10, color: Colors.textMuted },
});

// ─── Tarjeta de perfil individual ────────────────────────────────────────────
function ProfileCard({ profile, onSwipeLeft, onSwipeRight, isTop, style }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const rotate = translateX.interpolate({ inputRange: [-W, 0, W], outputRange: [`-${ROTATION_FACTOR}deg`, '0deg', `${ROTATION_FACTOR}deg`] });
  const yesOpacity = translateX.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const noOpacity = translateX.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = useCallback(({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      const { translationX } = nativeEvent;
      if (translationX > SWIPE_THRESHOLD) {
        Animated.timing(translateX, { toValue: W * 1.5, duration: 320, useNativeDriver: true }).start(() => onSwipeRight());
      } else if (translationX < -SWIPE_THRESHOLD) {
        Animated.timing(translateX, { toValue: -W * 1.5, duration: 320, useNativeDriver: true }).start(() => onSwipeLeft());
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 80, friction: 8 }).start();
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 8 }).start();
      }
    }
  }, [onSwipeLeft, onSwipeRight]);

  return (
    <Animated.View style={[cardStyles.wrapper, style, isTop && { transform: [{ translateX }, { translateY }, { rotate }] }]}>
      <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange} enabled={isTop}>
        <Animated.View style={cardStyles.card}>
          {/* Fondo mesh */}
          <LinearGradient colors={profile.colors} style={StyleSheet.absoluteFill} />

          {/* Orbes internos */}
          <View style={[cardStyles.innerOrb, { width: 180, height: 180, top: -40, left: -40, backgroundColor: `${profile.accent}33` }]} />
          <View style={[cardStyles.innerOrb, { width: 140, height: 140, bottom: 60, right: -20, backgroundColor: `${profile.accent}22` }]} />

          {/* Gradiente negro inferior */}
          <LinearGradient colors={['transparent', 'transparent', 'rgba(0,0,0,0.92)']} style={[StyleSheet.absoluteFill, { top: '30%' }]} />

          {/* Avatar top-right */}
          <View style={cardStyles.avatarWrap}>
            <View style={[cardStyles.onlineRing, { borderColor: `${Colors.green}80` }]} />
            <View style={[cardStyles.avatar, { backgroundColor: `${profile.accent}33` }]}>
              <Text style={[cardStyles.avatarText, { color: profile.accent }]}>{profile.initials}</Text>
            </View>
          </View>

          {/* Labels de swipe */}
          {isTop && (
            <>
              <Animated.View style={[cardStyles.swipeLabel, cardStyles.swipeLabelYes, { opacity: yesOpacity }]}>
                <Text style={cardStyles.swipeLabelText}>ME GUSTA</Text>
              </Animated.View>
              <Animated.View style={[cardStyles.swipeLabel, cardStyles.swipeLabelNo, { opacity: noOpacity }]}>
                <Text style={cardStyles.swipeLabelText}>PASAR</Text>
              </Animated.View>
            </>
          )}

          {/* Info inferior */}
          <View style={cardStyles.info}>
            <View style={cardStyles.nameRow}>
              <Text style={cardStyles.name}>{profile.name}</Text>
              <View style={cardStyles.ageBadge}><Text style={cardStyles.ageBadgeText}>{profile.age}</Text></View>
            </View>
            <Text style={cardStyles.meta}>◎ {profile.city} · {profile.distance} · {profile.job}</Text>
            <View style={cardStyles.tags}>
              {profile.tags.map(tag => (
                <View key={tag} style={cardStyles.tag}><Text style={cardStyles.tagText}>{tag}</Text></View>
              ))}
            </View>
            <CompatBar value={profile.compatibility} />
          </View>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  wrapper: { position: 'absolute', width: '100%', height: '100%' },
  card: { flex: 1, borderRadius: Radius.xl, overflow: 'hidden' },
  innerOrb: { position: 'absolute', borderRadius: 999 },
  avatarWrap: { position: 'absolute', top: 18, right: 18, zIndex: 5 },
  onlineRing: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 2, top: -6, left: -6, zIndex: 0 },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  avatarText: { fontFamily: Fonts.display, fontSize: 14, fontWeight: '700' },
  swipeLabel: { position: 'absolute', top: 28, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 10, zIndex: 10 },
  swipeLabelYes: { left: 18, backgroundColor: 'rgba(74,222,128,0.9)', transform: [{ rotate: '-20deg' }] },
  swipeLabelNo: { right: 18, backgroundColor: 'rgba(239,68,68,0.9)', transform: [{ rotate: '20deg' }] },
  swipeLabelText: { fontFamily: Fonts.display, fontSize: 13, color: '#fff', letterSpacing: 0.5 },
  info: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 6 },
  name: { fontFamily: Fonts.display, fontSize: 26, color: '#fff', letterSpacing: -0.5 },
  ageBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  ageBadgeText: { fontFamily: Fonts.sansSemiBold, fontSize: 12, color: '#fff' },
  meta: { fontFamily: Fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 },
  tags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontFamily: Fonts.sansMedium, fontSize: 11, color: 'rgba(255,255,255,0.85)' },
});

// ─── Botón de acción ──────────────────────────────────────────────────────────
function ActionBtn({ onPress, size = 56, children, bg, border: bc, glowColor }) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.88, duration: 100, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 6 }),
    ]).start();
    onPress?.();
  };
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity onPress={press} activeOpacity={0.9}
        style={[styles.actionBtn, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, borderColor: bc, ...Shadows.glow(glowColor, 16, 0.3) }]}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Screen principal ─────────────────────────────────────────────────────────
export default function SwipeScreen({ navigation }) {
  const [profiles, setProfiles] = React.useState(PROFILES);
  const [lastAction, setLastAction] = React.useState(null);

  const handleSwipeLeft = useCallback(() => {
    setProfiles(p => p.slice(1));
    setLastAction('skip');
    setTimeout(() => setLastAction(null), 1500);
  }, []);

  const handleSwipeRight = useCallback(() => {
    setProfiles(p => p.slice(1));
    setLastAction('like');
    setTimeout(() => setLastAction(null), 1500);
  }, []);

  const triggerSwipe = (dir) => {
    if (profiles.length === 0) return;
    if (dir === 'right') handleSwipeRight();
    else handleSwipeLeft();
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.bg, '#0d0818', Colors.bg]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.topbar}>
        <View>
          <Text style={styles.topTitle}>Descubrir</Text>
          <Text style={styles.topSub}>▲ {profiles.length} personas cerca</Text>
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options-outline" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Stack de tarjetas */}
      <View style={styles.stackArea}>
        {profiles.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="sparkles-outline" size={44} color={Colors.purple} style={styles.emptyEmoji} />
            <Text style={styles.emptyTitle}>Has visto a todos</Text>
            <Text style={styles.emptySub}>Vuelve mañana para nuevas personas</Text>
          </View>
        ) : (
          profiles.slice(0, 3).reverse().map((profile, idx, arr) => {
            const position = arr.length - 1 - idx;
            const isTop = position === arr.length - 1;
            const scale = 1 - (position * 0.035);
            const translateY = position * 10;
            const opacity = 0.5 + position * 0.25;
            return (
              <ProfileCard
                key={profile.id}
                profile={profile}
                isTop={isTop}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                style={!isTop ? { transform: [{ scale }, { translateY: -translateY }], opacity } : {}}
              />
            );
          })
        )}
      </View>

      {/* Botones de acción */}
      <View style={styles.actionsRow}>
        <ActionBtn onPress={() => triggerSwipe('left')} size={56} bg="rgba(239,68,68,0.12)" bc="rgba(239,68,68,0.3)" glowColor="#EF4444">
          <Ionicons name="close" size={24} color={Colors.red} />
        </ActionBtn>

        <ActionBtn onPress={() => {}} size={40} bg="rgba(234,179,8,0.12)" bc="rgba(234,179,8,0.3)" glowColor="#FCD34D">
          <Ionicons name="star" size={18} color={Colors.yellow} />
        </ActionBtn>

        <ActionBtn onPress={() => triggerSwipe('right')} size={72} bg={undefined} bc="transparent" glowColor={Colors.accent}>
          <LinearGradient colors={[Colors.accent, Colors.accentPink]} style={[StyleSheet.absoluteFill, { borderRadius: 36 }]} />
          <Ionicons name="heart" size={30} color="#fff" style={{ zIndex: 1 }} />
        </ActionBtn>

        <ActionBtn onPress={() => {}} size={40} bg="rgba(6,182,212,0.12)" bc="rgba(6,182,212,0.3)" glowColor={Colors.accentCyan}>
          <Ionicons name="arrow-undo" size={16} color={Colors.cyan} />
        </ActionBtn>

        <ActionBtn onPress={() => navigation?.navigate('Chats')} size={56} bg="rgba(124,58,237,0.12)" bc="rgba(124,58,237,0.3)" glowColor={Colors.accent}>
          <MaterialCommunityIcons name="account-group-outline" size={20} color={Colors.purple} />
        </ActionBtn>
      </View>

      {/* Hint */}
      <View style={styles.hint}>
        <Text style={styles.hintText}>← pasar   ·   desliza   ·   aceptar →</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 56, paddingBottom: 12 },
  topTitle: { fontFamily: Fonts.display, fontSize: 24, color: '#fff', letterSpacing: -0.5 },
  topSub: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  filterBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  stackArea: { flex: 1, marginHorizontal: 20, marginBottom: 12 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontFamily: Fonts.display, fontSize: 20, color: '#fff', marginBottom: 6 },
  emptySub: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.textMuted },
  actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 20, paddingBottom: 10 },
  actionBtn: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, overflow: 'hidden' },
  hint: { alignItems: 'center', paddingBottom: Platform?.OS === 'ios' ? 36 : 20, paddingTop: 6 },
  hintText: { fontFamily: Fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.18)', letterSpacing: 0.5 },
});
