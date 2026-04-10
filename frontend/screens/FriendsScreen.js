import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors as BaseColors, Fonts, Radius, useThemeMode } from '../theme';

let Colors = BaseColors;

function resolveMediaUrl(imagePath, apiBaseUrl) {
  if (!imagePath) return '';
  if (String(imagePath).startsWith('http://') || String(imagePath).startsWith('https://')) {
    return String(imagePath);
  }
  return `${apiBaseUrl}${imagePath}`;
}

function initialsFromName(name = '', fallback = 'U') {
  const clean = String(name || '').trim();
  if (!clean) return fallback;
  const parts = clean.split(' ').filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || fallback;
}

function normalizeInterest(value = '') {
  return String(value || '').trim().toLowerCase();
}

function FriendAvatar({ friend, size = 44, apiBaseUrl }) {
  const avatarUrl = resolveMediaUrl(friend?.profileImage, apiBaseUrl);
  const initials = initialsFromName(friend?.fullName || friend?.username, 'U');

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {avatarUrl
        ? <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: size / 2 }} />
        : <Text style={styles.avatarText}>{initials}</Text>
      }
    </View>
  );
}

export default function FriendsScreen({ apiBaseUrl, currentUser, navigation }) {
  const { colors, mode } = useThemeMode();
  Colors = colors;
  styles = React.useMemo(() => createStyles(colors), [colors]);
  const pageGradient = mode === 'light' ? ['#F7F7FB', '#EEF2FF', '#F7F7FB'] : [Colors.bg, '#0d0818', Colors.bg];

  const [friends, setFriends] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedFriend, setSelectedFriend] = React.useState(null);
  const currentInterestSet = React.useMemo(() => {
    const source = Array.isArray(currentUser?.interests) ? currentUser.interests : [];
    return new Set(source.map((interest) => normalizeInterest(interest)).filter(Boolean));
  }, [currentUser]);

  const handleOpenFriend = React.useCallback(async (friend) => {
    if (!apiBaseUrl) {
      setSelectedFriend(friend);
      return;
    }

    try {
      const friendId = friend?._id || friend?.id;
      if (!friendId) {
        setSelectedFriend(friend);
        return;
      }

      const response = await fetch(`${apiBaseUrl}/friends/${friendId}`, {
        method: 'GET',
        credentials: 'include',
      });

      const payload = await response.json();
      if (!response.ok) {
        setSelectedFriend(friend);
        return;
      }

      setSelectedFriend(payload || friend);
    } catch (_error) {
      setSelectedFriend(friend);
    }
  }, [apiBaseUrl]);

  const loadFriends = React.useCallback(async (isRefresh = false) => {
    if (!apiBaseUrl) return;

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch(`${apiBaseUrl}/friends`, {
        method: 'GET',
        credentials: 'include',
      });
      const payload = await response.json();
      if (!response.ok) return;

      setFriends(Array.isArray(payload) ? payload : []);
    } catch (_error) {
      // Ignorado: el estado de carga mostrara fallback.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiBaseUrl]);

  React.useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const handleOpenChat = React.useCallback((friend) => {
    const friendId = friend?._id || friend?.id;
    if (!friendId) return;

    navigation?.navigate('Chats', {
      openWithUserId: String(friendId),
    });
  }, [navigation]);

  const handleRemoveFriend = React.useCallback((friend) => {
    const friendId = friend?._id || friend?.id;
    if (!friendId || !apiBaseUrl) return;

    Alert.alert(
      'Eliminar amigo',
      `¿Seguro que quieres eliminar a ${friend?.fullName || friend?.username || 'este amigo'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${apiBaseUrl}/friends/${friendId}`, {
                method: 'DELETE',
                credentials: 'include',
              });
              const payload = await response.json();

              if (!response.ok) {
                Alert.alert('Error', payload?.error || 'No se pudo eliminar la amistad.');
                return;
              }

              setFriends((prev) => prev.filter((item) => String(item._id || item.id) !== String(friendId)));
              setSelectedFriend((prev) => {
                if (!prev) return prev;
                return String(prev._id || prev.id) === String(friendId) ? null : prev;
              });
            } catch (_error) {
              Alert.alert('Error de conexión', 'No se pudo eliminar la amistad.');
            }
          },
        },
      ]
    );
  }, [apiBaseUrl]);

  const renderFriendItem = ({ item }) => (
    <View style={styles.friendItem}>
      <FriendAvatar friend={item} apiBaseUrl={apiBaseUrl} />
      <TouchableOpacity style={{ flex: 1, minWidth: 0 }} activeOpacity={0.8} onPress={() => handleOpenFriend(item)}>
        <Text numberOfLines={1} style={styles.friendName}>{item.fullName || item.username || 'Amigo'}</Text>
        <Text numberOfLines={1} style={styles.friendUser}>@{item.username || 'usuario'}</Text>
      </TouchableOpacity>
      <View style={styles.friendActions}>
        <TouchableOpacity style={[styles.friendBtn, styles.friendBtnChat]} activeOpacity={0.85} onPress={() => handleOpenChat(item)}>
          <Ionicons name="chatbubble-ellipses-outline" size={14} color={Colors.cyan} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.friendBtn, styles.friendBtnDelete]} activeOpacity={0.85} onPress={() => handleRemoveFriend(item)}>
          <Ionicons name="trash-outline" size={14} color={Colors.red} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderList = () => (
    <FlatList
      data={friends}
      keyExtractor={(item, index) => String(item._id || item.id || `${item.username || 'friend'}-${index}`)}
      renderItem={renderFriendItem}
      contentContainerStyle={styles.listContent}
      refreshing={refreshing}
      onRefresh={() => loadFriends(true)}
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Ionicons name="people-outline" size={28} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Aún no tienes amigos</Text>
          <Text style={styles.emptySub}>Cuando aceptes solicitudes, aparecerán aquí.</Text>
        </View>
      }
    />
  );

  const renderDetail = () => {
    if (!selectedFriend) return null;

    const showCity = selectedFriend?.privacySettings?.showCity !== false;
    const cityText = showCity ? (selectedFriend.city || 'Sin ciudad') : 'Ciudad oculta';
    const interests = Array.isArray(selectedFriend?.interests) ? selectedFriend.interests : [];

    return (
      <View style={styles.detailWrap}>
        <View style={styles.detailHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedFriend(null)}>
            <Ionicons name="arrow-back" size={18} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.detailTitle}>Perfil de amigo</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.detailCard}>
          <FriendAvatar friend={selectedFriend} size={76} apiBaseUrl={apiBaseUrl} />
          <Text style={styles.detailName}>{selectedFriend.fullName || selectedFriend.username || 'Amigo'}</Text>
          <Text style={styles.detailUsername}>@{selectedFriend.username || 'usuario'}</Text>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>BIO</Text>
            <Text style={styles.detailValue}>{selectedFriend.bio || 'Sin biografía por ahora.'}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>CIUDAD</Text>
            <Text style={styles.detailValue}>{cityText}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>INTERESES</Text>
            {interests.length > 0 ? (
              <View style={styles.tagsWrap}>
                {interests.map((interest) => (
                  <View
                    key={`${selectedFriend._id}-${interest}`}
                    style={[styles.tag, currentInterestSet.has(normalizeInterest(interest)) && styles.tagCommon]}
                  >
                    <Text style={[styles.tagText, currentInterestSet.has(normalizeInterest(interest)) && styles.tagCommonText]}>{interest}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.detailValue}>Sin intereses configurados.</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={pageGradient} style={StyleSheet.absoluteFill} />
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.purple} />
        </View>
      ) : selectedFriend ? renderDetail() : renderList()}
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingTop: 56 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 14, paddingBottom: 26, gap: 8 },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 12,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(124,58,237,0.18)',
  },
  avatarText: {
    fontFamily: Fonts.display,
    fontSize: 14,
    color: Colors.purple,
    fontWeight: '700',
  },
  friendName: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.text },
  friendUser: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  friendActions: { gap: 6, alignItems: 'flex-end' },
  friendBtn: {
    width: 40,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  friendBtnChat: {
    backgroundColor: 'rgba(6,182,212,0.14)',
    borderColor: 'rgba(6,182,212,0.35)',
  },
  friendBtnDelete: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(239,68,68,0.35)',
  },
  emptyWrap: { alignItems: 'center', marginTop: 70, paddingHorizontal: 20 },
  emptyTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.text, marginTop: 10 },
  emptySub: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.textMuted, marginTop: 6, textAlign: 'center' },
  detailWrap: { flex: 1, paddingHorizontal: 16, paddingBottom: 20 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  detailTitle: { fontFamily: Fonts.display, fontSize: 18, color: Colors.text },
  detailCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 16,
    alignItems: 'center',
  },
  detailName: { fontFamily: Fonts.display, fontSize: 22, color: Colors.text, marginTop: 10 },
  detailUsername: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  detailSection: { width: '100%', marginTop: 16 },
  detailLabel: { fontFamily: Fonts.sansSemiBold, fontSize: 11, color: Colors.textMuted, letterSpacing: 0.6 },
  detailValue: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.text, marginTop: 6, lineHeight: 19 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  tag: {
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: { fontFamily: Fonts.sansMedium, fontSize: 11, color: Colors.purple },
  tagCommon: {
    borderColor: 'rgba(74,222,128,0.45)',
    backgroundColor: 'rgba(74,222,128,0.18)',
  },
  tagCommonText: { color: Colors.green },
});

let styles = createStyles(BaseColors);
