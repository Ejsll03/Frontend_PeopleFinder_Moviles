import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, Animated, Image, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { io } from 'socket.io-client/dist/socket.io.js';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors as BaseColors, Fonts, Radius, Shadows, useThemeMode } from '../theme';

let Colors = BaseColors;

function normalizeId(value) {
  if (!value) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    if (value.$oid) return String(value.$oid);
    if (value._id) return normalizeId(value._id);
    if (value.id) return normalizeId(value.id);
    if (typeof value.toString === 'function') {
      const parsed = value.toString();
      if (parsed && parsed !== '[object Object]') return parsed;
    }
  }
  return '';
}

function resolveMediaUrl(imagePath, apiBaseUrl) {
  if (!imagePath) return '';
  if (String(imagePath).startsWith('http://') || String(imagePath).startsWith('https://')) {
    return String(imagePath);
  }
  if (!apiBaseUrl) return String(imagePath);
  return `${apiBaseUrl}${imagePath}`;
}

function initialsFromName(name = '', fallback = 'U') {
  const normalized = String(name || '').trim();
  if (!normalized) return fallback;
  const parts = normalized.split(' ').filter(Boolean);
  if (!parts.length) return fallback;
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || fallback;
}

function formatLastSeen(lastSeenAt) {
  if (!lastSeenAt) return 'Última vez recientemente';

  const parsed = new Date(lastSeenAt);
  if (Number.isNaN(parsed.getTime())) return 'Última vez recientemente';

  const diffMs = Date.now() - parsed.getTime();
  const diffMin = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMin < 60) {
    return `Última vez hace ${diffMin} minuto${diffMin === 1 ? '' : 's'}`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `Última vez hace ${diffHours} hora${diffHours === 1 ? '' : 's'}`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `Última vez hace ${diffDays} día${diffDays === 1 ? '' : 's'}`;
}

function buildPresenceSubtitle(contact) {
  if (!contact) return '';

  const showOnlineStatus = contact.showOnlineStatus !== false;
  const showLastSeen = contact.showLastSeen !== false;

  if (showOnlineStatus && contact.isOnline) {
    return 'En línea';
  }

  if (showLastSeen) {
    return formatLastSeen(contact.lastSeenAt);
  }

  return 'Última vez recientemente';
}

// ─── Chats del sidebar ────────────────────────────────────────────────────────
const CHATS = [];

// ─── Mensajes iniciales de muestra ────────────────────────────────────────────
const INITIAL_MESSAGES = [];

// ─── Burbuja de mensaje ────────────────────────────────────────────────────────
function MessageBubble({ message }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 120, friction: 8 }),
    ]).start();
  }, []);

  if (message.type === 'image') {
    return (
      <Animated.View style={[styles.msgRow, message.sent && styles.msgRowSent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {!message.sent && (
          <View style={[styles.msgAvSmall, { backgroundColor: 'rgba(124,58,237,0.25)' }]}>
            {message.avatarUrl
              ? <Image source={{ uri: message.avatarUrl }} style={styles.msgAvatarImage} />
              : <Text style={[styles.msgAvText, { color: Colors.purple }]}>{message.initials || 'U'}</Text>
            }
          </View>
        )}
        <View style={[styles.imgBubble, message.sent && styles.imgBubbleSent]}>
          {message.uri ? (
            <Image source={{ uri: message.uri }} style={styles.imgPreview} />
          ) : (
            <LinearGradient colors={['rgba(124,58,237,0.3)', 'rgba(6,182,212,0.3)']} style={styles.imgPlaceholder}>
              <Ionicons name="image-outline" size={32} color="#fff" />
            </LinearGradient>
          )}
          <Text style={styles.imgName}>{message.fileName} · {message.size}</Text>
          <Text style={styles.msgTime}>{message.time}</Text>
        </View>
        {message.sent && (
          <View style={[styles.msgAvSmall, { backgroundColor: 'rgba(236,72,153,0.25)' }]}>
            {message.avatarUrl
              ? <Image source={{ uri: message.avatarUrl }} style={styles.msgAvatarImage} />
              : <Text style={[styles.msgAvText, { color: Colors.pink }]}>{message.initials || 'YO'}</Text>
            }
          </View>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.msgRow, message.sent && styles.msgRowSent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {!message.sent && (
        <View style={[styles.msgAvSmall, { backgroundColor: 'rgba(124,58,237,0.25)' }]}>
          {message.avatarUrl
            ? <Image source={{ uri: message.avatarUrl }} style={styles.msgAvatarImage} />
            : <Text style={[styles.msgAvText, { color: Colors.purple }]}>{message.initials || 'U'}</Text>
          }
        </View>
      )}
      <View style={{ maxWidth: '68%' }}>
        <View style={[styles.bubble, message.sent ? styles.bubbleSent : styles.bubbleRecv]}>
          {message.sent && <LinearGradient colors={[Colors.accent, '#9333EA']} style={StyleSheet.absoluteFill} borderRadius={message.sent ? undefined : 0} />}
          <Text style={styles.bubbleText}>{message.text}</Text>
        </View>
        <View style={[styles.timeRow, message.sent && styles.timeRowSent]}>
          <Text style={styles.msgTime}>{message.time}</Text>
          {message.sent && message.status === 'pending' && (
            <MaterialCommunityIcons name="clock-time-three-outline" size={12} color={Colors.textMuted} />
          )}
          {message.sent && message.status === 'sent' && (
            <MaterialCommunityIcons name="check" size={12} color={Colors.textMuted} />
          )}
          {message.sent && message.status === 'read' && (
            <MaterialCommunityIcons name="check-all" size={12} color={Colors.purple} />
          )}
        </View>
      </View>
      {message.sent && (
        <View style={[styles.msgAvSmall, { backgroundColor: 'rgba(236,72,153,0.25)' }]}>
          {message.avatarUrl
            ? <Image source={{ uri: message.avatarUrl }} style={styles.msgAvatarImage} />
            : <Text style={[styles.msgAvText, { color: Colors.pink }]}>{message.initials || 'YO'}</Text>
          }
        </View>
      )}
    </Animated.View>
  );
}

// ─── Indicador de escritura ────────────────────────────────────────────────────
function TypingIndicator() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    dots.forEach((dot, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: -6, duration: 350, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 350, useNativeDriver: true }),
          Animated.delay(500),
        ])
      ).start();
    });
  }, []);
  return (
    <View style={styles.typingRow}>
      <View style={[styles.msgAvSmall, { backgroundColor: 'rgba(124,58,237,0.25)' }]}>
        <Text style={[styles.msgAvText, { color: Colors.purple }]}>JS</Text>
      </View>
      <View style={styles.typingBubble}>
        {dots.map((dot, i) => (
          <Animated.View key={i} style={[styles.typingDot, { transform: [{ translateY: dot }] }]} />
        ))}
      </View>
    </View>
  );
}

// ─── Item del sidebar ──────────────────────────────────────────────────────────
function ChatItem({ chat, active, onPress }) {
  const pulseAnim = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    if (!chat.online) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [chat.online]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}
      style={[styles.chatItem, active && styles.chatItemActive]}>
      <View style={{ position: 'relative' }}>
        <View style={[styles.chatItemAv, { backgroundColor: `${chat.color}33` }]}>
          {chat.avatarUrl
            ? <Image source={{ uri: chat.avatarUrl }} style={styles.chatAvatarImage} />
            : <Text style={[styles.chatItemAvText, { color: chat.accent }]}>{chat.initials}</Text>
          }
        </View>
        {chat.online && <Animated.View style={[styles.onlineDot, { opacity: pulseAnim }]} />}
      </View>
      <View style={styles.chatItemInfo}>
        <Text style={styles.chatItemName} numberOfLines={1}>{chat.name}</Text>
        <Text style={styles.chatItemLast} numberOfLines={1}>{chat.lastMsg}</Text>
      </View>
      <View style={styles.chatItemMeta}>
        <Text style={styles.chatItemTime}>{chat.time}</Text>
        {chat.unread > 0 && (
          <LinearGradient colors={[Colors.accent, Colors.accentPink]} style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{chat.unread}</Text>
          </LinearGradient>
        )}
      </View>
    </TouchableOpacity>
  );
}

function colorForId(id = '') {
  const palette = [
    { color: '#7C3AED', accent: '#C4B5FD' },
    { color: '#0EA5E9', accent: '#67E8F9' },
    { color: '#EC4899', accent: '#F9A8D4' },
    { color: '#22C55E', accent: '#86EFAC' },
  ];

  const raw = String(id || 'x');
  const total = raw.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return palette[total % palette.length];
}

function mapChatToItem(chat, currentUserId, apiBaseUrl) {
  const participants = Array.isArray(chat?.participants) ? chat.participants : [];
  const other =
    participants.find(
      (participant) => normalizeId(participant?._id || participant?.id) !== normalizeId(currentUserId)
    ) || participants[0] || null;
  const fullName = (other?.fullName || other?.username || 'Chat').trim();
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'CH';
  const scheme = colorForId(chat?._id);

  return {
    id: normalizeId(chat?._id || chat?.id),
    userId: normalizeId(other?._id || other?.id),
    name: fullName,
    lastMsg: chat?.lastMessage || 'Sin mensajes todavía',
    time: chat?.lastMessageAt
      ? new Date(chat.lastMessageAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
      : '',
    unread: Number(chat?.unreadCount || 0),
    online: false,
    color: scheme.color,
    accent: scheme.accent,
    initials,
    avatarUrl: resolveMediaUrl(other?.profileImage, apiBaseUrl),
    isOnline: Boolean(other?.isOnline),
    lastSeenAt: other?.lastSeenAt || null,
    showOnlineStatus: other?.privacySettings?.showOnlineStatus !== false,
    showLastSeen: other?.privacySettings?.showLastSeen !== false,
  };
}

function mapMessageToItem(message, currentUserId, apiBaseUrl, currentUserAvatarUrl = '', currentUserInitials = 'YO') {
  const senderId = normalizeId(message?.sender?._id || message?.sender?.id || message?.sender);
  const isSent = senderId === normalizeId(currentUserId);
  const date = message?.createdAt ? new Date(message.createdAt) : new Date();
  const senderName = String(message?.sender?.fullName || message?.sender?.username || '').trim();

  const readBy = Array.isArray(message?.readBy) ? message.readBy : [];
  const isReadByOthers = readBy.some((id) => normalizeId(id) !== normalizeId(currentUserId));

  return {
    id: normalizeId(message?._id || message?.id) || `${Date.now()}`,
    text: message?.text || '',
    sent: isSent,
    time: date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
    type: message?.type || (message?.imageUrl ? 'image' : 'text'),
    uri: message?.imageUrl || '',
    fileName: 'imagen.jpg',
    size: '',
    status: isSent ? (isReadByOthers ? 'read' : 'sent') : 'read',
    avatarUrl: isSent
      ? currentUserAvatarUrl
      : resolveMediaUrl(message?.sender?.profileImage, apiBaseUrl),
    initials: isSent ? currentUserInitials : initialsFromName(senderName, 'U'),
  };
}

// ─── Screen principal ──────────────────────────────────────────────────────────
export default function ChatScreen({ route, apiBaseUrl, currentUser }) {
  const { colors, mode } = useThemeMode();
  Colors = colors;
  styles = React.useMemo(() => createStyles(colors), [colors]);
  const pageGradient = mode === 'light' ? ['#F7F7FB', '#EEF2FF', '#F7F7FB'] : [Colors.bg, '#0d0818', Colors.bg];

  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chats, setChats] = useState(CHATS);
  const [activeChat, setActiveChat] = useState(null);
  const [loadingChats, setLoadingChats] = useState(false);
  const [connected, setConnected] = useState(false);
  const flatRef = useRef(null);
  const socketRef = useRef(null);
  const currentUserId = currentUser?.id || currentUser?._id || '';
  const currentUserAvatarUrl = resolveMediaUrl(currentUser?.profileImage, apiBaseUrl);
  const currentUserInitials = initialsFromName(currentUser?.fullName || currentUser?.username, 'YO');

  const loadChats = useCallback(async () => {
    if (!apiBaseUrl) return;

    try {
      setLoadingChats(true);
      const response = await fetch(`${apiBaseUrl}/chats`, {
        method: 'GET',
        credentials: 'include',
      });
      const payload = await response.json();

      if (!response.ok) {
        return;
      }

      const mapped = Array.isArray(payload)
        ? payload.map((chat) => mapChatToItem(chat, currentUserId, apiBaseUrl))
        : [];
      setChats(mapped);
    } catch (_error) {
      // Ignorado: mantenemos UI local aunque falle red.
    } finally {
      setLoadingChats(false);
    }
  }, [apiBaseUrl, currentUserId]);

  const ensureChatAndOpen = useCallback(async () => {
    if (!apiBaseUrl) return;

    const openChatId = route?.params?.openChatId;
    const openWithUserId = route?.params?.openWithUserId;

    if (!openChatId && !openWithUserId) return;

    if (openChatId) {
      setActiveChat(openChatId);
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/chats`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: openWithUserId }),
      });
      const payload = await response.json();

      if (!response.ok) {
        if (payload?.error) {
          Alert.alert('No se pudo abrir chat', payload.error);
        }
        return;
      }

      const nextChat = mapChatToItem(payload, currentUserId, apiBaseUrl);
      setChats((prev) => {
        const withoutCurrent = prev.filter((item) => item.id !== nextChat.id);
        return [nextChat, ...withoutCurrent];
      });
      setActiveChat(nextChat.id);
    } catch (_error) {
      Alert.alert('Error de conexión', 'No se pudo abrir la conversación.');
    }
  }, [apiBaseUrl, route?.params?.openChatId, route?.params?.openWithUserId, currentUserId]);

  const loadMessages = useCallback(async () => {
    if (!apiBaseUrl || !activeChat) {
      setMessages([]);
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/chats/${activeChat}/messages`, {
        method: 'GET',
        credentials: 'include',
      });
      const payload = await response.json();
      if (!response.ok) return;

      const mapped = Array.isArray(payload)
        ? payload.map((message) => mapMessageToItem(message, currentUserId, apiBaseUrl, currentUserAvatarUrl, currentUserInitials))
        : [];
      setMessages(mapped);
    } catch (_error) {
      // Ignorado: mantenemos mensajes actuales.
    }
  }, [apiBaseUrl, activeChat, currentUserId, currentUserAvatarUrl, currentUserInitials]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    ensureChatAndOpen();
  }, [ensureChatAndOpen]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!apiBaseUrl || !currentUserId) return undefined;

    const socket = io(apiBaseUrl, {
      transports: ['websocket'],
      withCredentials: true,
      auth: { userId: currentUserId },
      reconnection: true,
    });
    socketRef.current = socket;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onChatError = (payload) => {
      if (payload?.message) {
        Alert.alert('Chat', payload.message);
      }
    };
    const onNewMessage = ({ chatId, message, clientMessageId }) => {
      if (!message) return;

      const mappedMessage = mapMessageToItem(message, currentUserId, apiBaseUrl, currentUserAvatarUrl, currentUserInitials);
      const messageChatId = normalizeId(chatId || message?.chat);

      setChats((prev) =>
        prev.map((chat) =>
          normalizeId(chat.id) === messageChatId
            ? {
                ...chat,
                lastMsg: mappedMessage.type === 'image' ? '[Imagen]' : mappedMessage.text,
                unread:
                  !mappedMessage.sent && normalizeId(activeChat) !== messageChatId
                    ? Number(chat.unread || 0) + 1
                    : Number(chat.unread || 0),
              }
            : chat
        )
      );

      if (normalizeId(activeChat) !== messageChatId) return;

      setMessages((prev) => {
        const findPendingFallbackIndex = () => {
          // Fallback para casos de carrera donde el ACK llega antes de que el estado local se asiente.
          return prev.findIndex((item) =>
            item.sent &&
            item.status === 'pending' &&
            item.type === mappedMessage.type &&
            item.text === mappedMessage.text
          );
        };

        if (clientMessageId) {
          const pendingIndex = prev.findIndex(
            (item) => item.clientMessageId === clientMessageId || item.id === clientMessageId
          );

          if (pendingIndex !== -1) {
            const next = [...prev];
            next[pendingIndex] = {
              ...mappedMessage,
              status: mappedMessage.status === 'read' ? 'read' : 'sent',
            };
            return next;
          }

          if (mappedMessage.sent) {
            const fallbackIndex = findPendingFallbackIndex();
            if (fallbackIndex !== -1) {
              const next = [...prev];
              next[fallbackIndex] = {
                ...mappedMessage,
                status: mappedMessage.status === 'read' ? 'read' : 'sent',
              };
              return next;
            }
          }
        }

        if (mappedMessage.sent) {
          // Si es nuestro mensaje y no pudimos reconciliarlo, evitamos duplicarlo.
          return prev;
        }

        if (prev.some((item) => item.id === mappedMessage.id)) {
          return prev;
        }
        return [...prev, mappedMessage];
      });
    };

    const onChatUpdated = ({ chatId, lastMessage, lastMessageAt }) => {
      const updatedChatId = normalizeId(chatId);
      if (!updatedChatId) return;

      let found = false;

      setChats((prev) => {
        const next = prev.map((chat) => {
          if (normalizeId(chat.id) !== updatedChatId) return chat;
          found = true;
          return {
            ...chat,
            lastMsg: lastMessage || chat.lastMsg,
            time: lastMessageAt
              ? new Date(lastMessageAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
              : chat.time,
            unread:
              normalizeId(activeChat) !== updatedChatId
                ? Number(chat.unread || 0) + 1
                : 0,
          };
        });

        return next;
      });

      if (!found) {
        loadChats();
      }
    };

    const onChatRead = ({ chatId, readerId, messageIds = [] }) => {
      const normalizedChatId = normalizeId(chatId);
      const isCurrentUserReader = normalizeId(readerId) === normalizeId(currentUserId);

      if (isCurrentUserReader) {
        setChats((prev) =>
          prev.map((chat) =>
            normalizeId(chat.id) === normalizedChatId
              ? { ...chat, unread: 0 }
              : chat
          )
        );
        return;
      }

      if (normalizedChatId !== normalizeId(activeChat)) return;

      const readSet = new Set((Array.isArray(messageIds) ? messageIds : []).map((id) => normalizeId(id)));

      setMessages((prev) =>
        prev.map((item) =>
          item.sent
            ? {
                ...item,
                status: readSet.size === 0 || readSet.has(normalizeId(item.id)) ? 'read' : item.status,
              }
            : item
        )
      );
    };

    const onPresenceUpdate = ({ userId, isOnline, lastSeenAt }) => {
      const normalizedUserId = normalizeId(userId);
      if (!normalizedUserId) return;

      setChats((prev) =>
        prev.map((chat) =>
          normalizeId(chat.userId) === normalizedUserId
            ? {
                ...chat,
                isOnline: Boolean(isOnline),
                lastSeenAt: lastSeenAt || chat.lastSeenAt,
              }
            : chat
        )
      );
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('chat_error', onChatError);
    socket.on('new_message', onNewMessage);
    socket.on('chat_updated', onChatUpdated);
    socket.on('chat_read', onChatRead);
    socket.on('user_presence_update', onPresenceUpdate);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat_error', onChatError);
      socket.off('new_message', onNewMessage);
      socket.off('chat_updated', onChatUpdated);
      socket.off('chat_read', onChatRead);
      socket.off('user_presence_update', onPresenceUpdate);
      socket.disconnect();
    };
  }, [apiBaseUrl, currentUserId, activeChat, loadChats, currentUserAvatarUrl, currentUserInitials]);

  useEffect(() => {
    if (!activeChat || !socketRef.current) return;
    socketRef.current.emit('join_chat', { chatId: activeChat });
    socketRef.current.emit('mark_chat_read', { chatId: activeChat });
    setChats((prev) =>
      prev.map((chat) =>
        normalizeId(chat.id) === normalizeId(activeChat)
          ? { ...chat, unread: 0 }
          : chat
      )
    );
  }, [activeChat]);

  useEffect(() => {
    if (!activeChat || !apiBaseUrl) return;

    const markAsRead = async () => {
      try {
        socketRef.current?.emit('mark_chat_read', { chatId: activeChat });
        await fetch(`${apiBaseUrl}/chats/${activeChat}/read`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch (_error) {
        // Ignorado: el flujo principal del chat sigue funcionando.
      }
    };

    markAsRead();
  }, [activeChat, apiBaseUrl, messages.length]);

  const sendMessage = useCallback(() => {
    if (!activeChat || !socketRef.current) return;
    if (!input.trim()) return;

    const clientMessageId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const pendingMessage = {
      id: clientMessageId,
      clientMessageId,
      text: input.trim(),
      sent: true,
      time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      status: 'pending',
      avatarUrl: currentUserAvatarUrl,
      initials: currentUserInitials,
    };

    setMessages((prev) => [...prev, pendingMessage]);

    socketRef.current.emit('send_message', {
      chatId: activeChat,
      text: input.trim(),
      clientMessageId,
    });

    setInput('');
  }, [activeChat, input, currentUserAvatarUrl, currentUserInitials]);

  const sendImage = async () => {
    if (!activeChat) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) {
      const asset = result.assets[0];
      const newMsg = {
        id: Date.now().toString(), uri: asset.uri, sent: true,
        time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
        type: 'image', fileName: asset.fileName || 'imagen.jpg', size: `${(asset.fileSize / 1024 / 1024).toFixed(1)} MB`,
        avatarUrl: currentUserAvatarUrl,
        initials: currentUserInitials,
      };
      setMessages(prev => [...prev, newMsg]);
      // send({ type: 'image', uri: asset.uri }); // WebSocket real
    }
  };

  useEffect(() => {
    if (!messages.length) return;
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isTyping]);

  const activeContact = chats.find(c => c.id === activeChat);
  const hasActiveChat = Boolean(activeContact);
  const activeContactSubtitle = buildPresenceSubtitle(activeContact);

  const renderChatsList = () => (
    <View style={styles.fullPane}>
      <View style={styles.sideHead}>
        <Text style={styles.sideTitle}>Mensajes</Text>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput style={styles.searchInput} placeholder="Buscar..." placeholderTextColor={Colors.textMuted} />
        </View>
      </View>

      <FlatList
        data={chats}
        keyExtractor={c => c.id}
        renderItem={({ item }) => (
          <ChatItem chat={item} active={item.id === activeChat} onPress={() => setActiveChat(item.id)} />
        )}
        ListEmptyComponent={(
          <View style={styles.emptyListWrap}>
            <MaterialCommunityIcons name="chat-outline" size={22} color={Colors.textMuted} />
            <Text style={styles.emptyListTitle}>Sin chats por ahora</Text>
            <Text style={styles.emptyListSub}>{loadingChats ? 'Cargando...' : 'Cuando tengas matches, aparecerán aquí.'}</Text>
          </View>
        )}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const renderActiveChat = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.fullPane}>
      {/* Header */}
      <View style={styles.chatHead}>
        <TouchableOpacity style={styles.headBtn} onPress={() => setActiveChat(null)}>
          <Ionicons name="arrow-back" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
        <View style={{ position: 'relative' }}>
          <View style={[styles.headAv, { backgroundColor: `${activeContact?.color}33` }]}> 
            {activeContact?.avatarUrl
              ? <Image source={{ uri: activeContact.avatarUrl }} style={styles.headAvatarImage} />
              : <Text style={[styles.headAvText, { color: activeContact?.accent }]}>{activeContact?.initials}</Text>
            }
          </View>
          {activeContact?.online && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.headInfo}>
          <Text style={styles.headName}>{activeContact?.name}</Text>
          <View style={styles.headStatus}>
            <View style={[styles.statusDot, !(activeContact?.showOnlineStatus && activeContact?.isOnline) && styles.statusDotMuted]} />
            <Text style={styles.headStatusText}>{activeContactSubtitle || (connected ? 'Conectado en tiempo real' : 'Reconectando...')}</Text>
          </View>
        </View>
      </View>

      {/* Mensajes */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={styles.msgsList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<View style={styles.dateSep}><Text style={styles.dateSepText}>Hoy</Text></View>}
        ListFooterComponent={isTyping ? <TypingIndicator /> : null}
      />

      {/* Barra de input */}
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={sendImage}>
          <Ionicons name="camera-outline" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.inputField}
            value={input}
            onChangeText={setInput}
            placeholder="Escribe algo..."
            placeholderTextColor={Colors.textMuted}
            multiline
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity>
            <Ionicons name="happy-outline" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={sendMessage} activeOpacity={0.8}>
          <LinearGradient
            colors={[Colors.accent, Colors.accentPink]}
            style={[styles.sendBtn, Shadows.glow(Colors.accent, 12, 0.4)]}
          >
            <Ionicons name="send" size={16} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={pageGradient} style={StyleSheet.absoluteFill} />
      {!hasActiveChat ? renderChatsList() : renderActiveChat()}
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  fullPane: { flex: 1, paddingTop: 56 },
  sideHead: { padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sideTitle: { fontFamily: Fonts.display, fontSize: 18, color: Colors.text, marginBottom: 10 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 10, paddingVertical: 8 },
  searchIcon: { fontSize: 13, color: Colors.textMuted },
  searchInput: { flex: 1, fontFamily: Fonts.sans, fontSize: 12, color: Colors.text },
  emptyListWrap: { alignItems: 'center', paddingHorizontal: 18, paddingTop: 26 },
  emptyListTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 12, color: 'rgba(255,255,255,0.72)', marginTop: 8 },
  emptyListSub: { fontFamily: Fonts.sans, fontSize: 10, color: Colors.textMuted, marginTop: 4, textAlign: 'center', lineHeight: 14 },
  chatItem: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, marginHorizontal: 8, marginBottom: 2, borderRadius: 14 },
  chatItemActive: { backgroundColor: 'rgba(124,58,237,0.12)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)' },
  chatItemAv: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  chatAvatarImage: { width: '100%', height: '100%', borderRadius: 19 },
  chatItemAvText: { fontFamily: Fonts.display, fontSize: 12, fontWeight: '700' },
  chatItemInfo: { flex: 1, minWidth: 0 },
  chatItemName: { fontFamily: Fonts.sansSemiBold, fontSize: 12, color: Colors.text },
  chatItemLast: { fontFamily: Fonts.sans, fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  chatItemMeta: { alignItems: 'flex-end', gap: 4 },
  chatItemTime: { fontFamily: Fonts.sans, fontSize: 9, color: 'rgba(255,255,255,0.25)' },
  unreadBadge: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  unreadText: { fontFamily: Fonts.sansSemiBold, fontSize: 9, color: Colors.text },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.green, position: 'absolute', bottom: 0, right: 0, borderWidth: 2, borderColor: Colors.card },
  emptyChatWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  emptyChatCard: { width: '100%', borderRadius: 18, borderWidth: 1, borderColor: Colors.border, paddingVertical: 28, paddingHorizontal: 18, alignItems: 'center' },
  emptyChatTitle: { fontFamily: Fonts.display, fontSize: 19, color: Colors.text, marginTop: 10, textAlign: 'center' },
  emptyChatSub: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.textMuted, marginTop: 8, textAlign: 'center', lineHeight: 18 },
  chatHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headAv: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headAvatarImage: { width: '100%', height: '100%', borderRadius: 20 },
  headAvText: { fontFamily: Fonts.display, fontSize: 13, fontWeight: '700' },
  headInfo: { flex: 1 },
  headName: { fontFamily: Fonts.display, fontSize: 14, color: Colors.text, },
  headStatus: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.green },
  statusDotMuted: { backgroundColor: Colors.textMuted },
  headStatusText: { fontFamily: Fonts.sans, fontSize: 11, color: Colors.green },
  wsChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(74,222,128,0.08)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  wsDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.green },
  wsText: { fontFamily: Fonts.sansSemiBold, fontSize: 9, color: 'rgba(74,222,128,0.8)', letterSpacing: 0.5 },
  headBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  msgsList: { padding: 14, paddingBottom: 8, gap: 10 },
  dateSep: { alignItems: 'center', paddingVertical: 6 },
  dateSepText: { fontFamily: Fonts.sansMedium, fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: 1, textTransform: 'uppercase' },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 7, marginBottom: 2 },
  msgRowSent: { flexDirection: 'row-reverse' },
  msgAvSmall: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  msgAvatarImage: { width: '100%', height: '100%', borderRadius: 12 },
  msgAvText: { fontFamily: Fonts.display, fontSize: 8, fontWeight: '700' },
  bubble: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  bubbleSent: { borderRadius: 16, borderBottomRightRadius: 4 },
  bubbleRecv: { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, borderBottomLeftRadius: 4 },
  bubbleText: { fontFamily: Fonts.sans, fontSize: 13, color: Colors.text, lineHeight: 19, position: 'relative', zIndex: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  timeRowSent: { justifyContent: 'flex-end' },
  msgTime: { fontFamily: Fonts.sans, fontSize: 9, color: 'rgba(255,255,255,0.3)' },
  readTicks: { fontFamily: Fonts.sans, fontSize: 10, color: Colors.purple },
  imgBubble: { maxWidth: '68%' },
  imgBubbleSent: { alignItems: 'flex-end' },
  imgPreview: { width: 160, height: 110, borderRadius: 14 },
  imgPlaceholder: { width: 160, height: 110, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  imgName: { fontFamily: Fonts.sans, fontSize: 9, color: Colors.textMuted, marginTop: 4 },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingBottom: 10 },
  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border, paddingBottom: Platform.OS === 'ios' ? 28 : 10 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  inputField: { flex: 1, fontFamily: Fonts.sans, fontSize: 13, color: Colors.text, maxHeight: 80 },
  sendBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});

let styles = createStyles(BaseColors);
