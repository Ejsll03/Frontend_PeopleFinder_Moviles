import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors as BaseColors, Fonts, Radius, useThemeMode } from '../theme';

let Colors = BaseColors;

function NotificationIcon({ type }) {
  if (type === 'friend_request') {
    return <MaterialCommunityIcons name="account-plus-outline" size={18} color={Colors.purple} />;
  }
  if (type === 'friend_match') {
    return <Ionicons name="people-outline" size={18} color={Colors.green} />;
  }
  if (type === 'message') {
    return <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.cyan} />;
  }
  return <Ionicons name="notifications-outline" size={18} color={Colors.textMuted} />;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function resolveMessageSender(notification) {
  return (
    notification?.data?.senderName ||
    notification?.data?.fromName ||
    notification?.actor?.fullName ||
    notification?.actor?.username ||
    'Usuario'
  );
}

export default function NotificationsScreen({ navigation, route, apiBaseUrl: apiBaseUrlProp }) {
  const { colors, mode } = useThemeMode();
  Colors = colors;
  styles = React.useMemo(() => createStyles(colors), [colors]);
  const pageGradient = mode === 'light' ? ['#F7F7FB', '#EEF2FF', '#F7F7FB'] : [Colors.bg, '#0d0818', Colors.bg];

  const apiBaseUrl = route?.params?.apiBaseUrl || apiBaseUrlProp;
  const [notifications, setNotifications] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [pendingActionId, setPendingActionId] = React.useState(null);

  const loadNotifications = React.useCallback(async (isRefresh = false) => {
    if (!apiBaseUrl) return;

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch(`${apiBaseUrl}/notifications`, {
        method: 'GET',
        credentials: 'include',
      });
      const payload = await response.json();

      if (!response.ok) {
        Alert.alert('Error', payload.error || 'No se pudieron cargar notificaciones.');
        return;
      }

      setNotifications(Array.isArray(payload) ? payload : []);
    } catch (error) {
      Alert.alert('Error de conexión', `No se pudo conectar con ${apiBaseUrl}.`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiBaseUrl]);

  React.useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markOneAsRead = async (id) => {
    try {
      const response = await fetch(`${apiBaseUrl}/notifications/${id}/read`, {
        method: 'PUT',
        credentials: 'include',
      });
      if (!response.ok) return;

      setNotifications((prev) =>
        prev.map((item) =>
          item._id === id
            ? { ...item, isRead: true, readAt: new Date().toISOString() }
            : item
        )
      );
    } catch (_error) {
      // Ignorado: no bloqueamos UX por este error.
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/notifications/read-all`, {
        method: 'PUT',
        credentials: 'include',
      });
      const payload = await response.json();
      if (!response.ok) {
        Alert.alert('Error', payload.error || 'No se pudieron marcar como leídas.');
        return;
      }

      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt || new Date().toISOString(),
        }))
      );
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo actualizar notificaciones.');
    }
  };

  const resolveTargetUserId = (notification) => {
    return (
      notification?.data?.userId ||
      notification?.actor?._id ||
      notification?.actor?.id ||
      ''
    );
  };

  const respondFriendRequest = async (notification, direction) => {
    const targetUserId = resolveTargetUserId(notification);
    if (!targetUserId) {
      Alert.alert('Error', 'No se pudo identificar al usuario de la solicitud.');
      return;
    }

    try {
      setPendingActionId(notification._id);

      const response = await fetch(`${apiBaseUrl}/friends/swipe`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId,
          direction,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        Alert.alert('Error', payload.error || 'No se pudo responder la solicitud.');
        return;
      }

      // Al responder la solicitud, eliminamos la notificación para limpiar la bandeja.
      try {
        await fetch(`${apiBaseUrl}/notifications/${notification._id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
      } catch (_deleteError) {
        // Ignorado: quitamos localmente aunque falle red para mantener UX consistente.
      }

      setNotifications((prev) => prev.filter((item) => item._id !== notification._id));

      if (direction === 'right') {
        Alert.alert('Solicitud aceptada', payload.message || 'Ahora pueden conversar.');
      }
    } catch (_error) {
      Alert.alert('Error de conexión', 'No se pudo responder la solicitud.');
    } finally {
      setPendingActionId(null);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={pageGradient} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={18} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Notificaciones</Text>
        </View>
        <TouchableOpacity onPress={markAllAsRead} style={styles.markBtn}>
          <Text style={styles.markBtnText}>Marcar todo</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.purple} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          onRefresh={() => loadNotifications(true)}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Ionicons name="notifications-off-outline" size={30} color="rgba(255,255,255,0.35)" />
              <Text style={styles.emptyTitle}>Sin notificaciones</Text>
              <Text style={styles.emptySub}>Cuando haya actividad nueva aparecerá aquí.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => !item.isRead && markOneAsRead(item._id)}
              style={[styles.itemCard, !item.isRead && styles.itemCardUnread]}
            >
              <View style={styles.itemIcon}><NotificationIcon type={item.type} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>
                  {item.type === 'message' ? `Nuevo mensaje de ${resolveMessageSender(item)}` : item.title}
                </Text>
                {item.type !== 'message' && !!item.body && <Text style={styles.itemBody}>{item.body}</Text>}
                <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>

                {item.type === 'friend_request' && !item.friendRequestHandled ? (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      onPress={() => respondFriendRequest(item, 'left')}
                      activeOpacity={0.8}
                      disabled={pendingActionId === item._id}
                      style={[styles.actionBtn, styles.rejectBtn, pendingActionId === item._id && styles.actionBtnDisabled]}
                    >
                      <Text style={styles.rejectBtnText}>Rechazar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => respondFriendRequest(item, 'right')}
                      activeOpacity={0.8}
                      disabled={pendingActionId === item._id}
                      style={[styles.actionBtn, styles.acceptBtn, pendingActionId === item._id && styles.actionBtnDisabled]}
                    >
                      <Text style={styles.acceptBtnText}>Aceptar</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

              </View>
              {!item.isRead && <View style={styles.dotUnread} />}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingTop: 56,
    paddingHorizontal: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: { fontFamily: Fonts.display, fontSize: 18, color: Colors.text },
  markBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  markBtnText: { fontFamily: Fonts.sansMedium, fontSize: 12, color: Colors.purple },
  listContent: { padding: 16, paddingBottom: 36, gap: 10 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
  },
  itemCardUnread: {
    borderColor: 'rgba(124,58,237,0.3)',
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  itemIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  itemTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 13, color: Colors.text },
  itemBody: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.textMuted, marginTop: 2, lineHeight: 17 },
  itemDate: { fontFamily: Fonts.sans, fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 6 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: {
    minWidth: 90,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionBtnDisabled: { opacity: 0.6 },
  acceptBtn: {
    backgroundColor: 'rgba(34,197,94,0.16)',
    borderColor: 'rgba(34,197,94,0.4)',
  },
  rejectBtn: {
    backgroundColor: 'rgba(239,68,68,0.14)',
    borderColor: 'rgba(239,68,68,0.4)',
  },
  chatBtn: {
    backgroundColor: 'rgba(6,182,212,0.14)',
    borderColor: 'rgba(6,182,212,0.4)',
  },
  acceptBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 12, color: Colors.green },
  rejectBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 12, color: Colors.red },
  chatBtnText: { fontFamily: Fonts.sansSemiBold, fontSize: 12, color: Colors.cyan },
  dotUnread: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.purple, marginTop: 6 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 14, color: Colors.text, marginTop: 10 },
  emptySub: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
});

let styles = createStyles(BaseColors);
