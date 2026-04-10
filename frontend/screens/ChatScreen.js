import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, Animated, Image, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors as BaseColors, Fonts, Radius, Shadows, useThemeMode } from '../theme';

let Colors = BaseColors;

// ─── WebSocket Hook ───────────────────────────────────────────────────────────
// Reemplaza WS_URL con tu servidor real (ej: 'ws://tuapp.com/chat')
const WS_URL = 'ws://localhost:3001';

function useWebSocket(roomId, userId, onMessage) {
  const ws = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    ws.current = new WebSocket(`${WS_URL}?room=${roomId}&user=${userId}`);

    ws.current.onopen = () => {
      console.log('[WS] Conectado');
      setConnected(true);
    };
    ws.current.onmessage = (e) => {
      try { onMessage(JSON.parse(e.data)); } catch (_) {}
    };
    ws.current.onerror = () => setConnected(false);
    ws.current.onclose = () => {
      setConnected(false);
      // Auto-reconectar después de 3s
      setTimeout(() => ws.current?.readyState === WebSocket.CLOSED, 3000);
    };

    return () => ws.current?.close();
  }, [roomId, userId]);

  const send = useCallback((data) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  return { connected, send };
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
        {!message.sent && <View style={[styles.msgAvSmall, { backgroundColor: 'rgba(124,58,237,0.25)' }]}><Text style={[styles.msgAvText, { color: Colors.purple }]}>JS</Text></View>}
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
        {message.sent && <View style={[styles.msgAvSmall, { backgroundColor: 'rgba(236,72,153,0.25)' }]}><Text style={[styles.msgAvText, { color: Colors.pink }]}>TÚ</Text></View>}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.msgRow, message.sent && styles.msgRowSent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {!message.sent && <View style={[styles.msgAvSmall, { backgroundColor: 'rgba(124,58,237,0.25)' }]}><Text style={[styles.msgAvText, { color: Colors.purple }]}>JS</Text></View>}
      <View style={{ maxWidth: '68%' }}>
        <View style={[styles.bubble, message.sent ? styles.bubbleSent : styles.bubbleRecv]}>
          {message.sent && <LinearGradient colors={[Colors.accent, '#9333EA']} style={StyleSheet.absoluteFill} borderRadius={message.sent ? undefined : 0} />}
          <Text style={styles.bubbleText}>{message.text}</Text>
        </View>
        <View style={[styles.timeRow, message.sent && styles.timeRowSent]}>
          <Text style={styles.msgTime}>{message.time}</Text>
          {message.sent && message.read && (
            <MaterialCommunityIcons name="check-all" size={12} color={Colors.purple} />
          )}
        </View>
      </View>
      {message.sent && <View style={[styles.msgAvSmall, { backgroundColor: 'rgba(236,72,153,0.25)' }]}><Text style={[styles.msgAvText, { color: Colors.pink }]}>TÚ</Text></View>}
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
          <Text style={[styles.chatItemAvText, { color: chat.accent }]}>{chat.initials}</Text>
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

// ─── Screen principal ──────────────────────────────────────────────────────────
export default function ChatScreen() {
  const { colors, mode } = useThemeMode();
  Colors = colors;
  styles = React.useMemo(() => createStyles(colors), [colors]);
  const pageGradient = mode === 'light' ? ['#F7F7FB', '#EEF2FF', '#F7F7FB'] : [Colors.bg, '#0d0818', Colors.bg];

  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeChat, setActiveChat] = useState(CHATS[0]?.id || null);
  const flatRef = useRef(null);
  const currentUser = 'user_me';

  // WebSocket real — descomenta cuando tengas tu servidor
  // const { connected, send } = useWebSocket(`chat_${activeChat}`, currentUser, (msg) => {
  //   if (msg.type === 'message') {
  //     setMessages(prev => [...prev, { id: Date.now().toString(), ...msg, sent: false }]);
  //   } else if (msg.type === 'typing') {
  //     setIsTyping(msg.isTyping);
  //   }
  // });

  const sendMessage = useCallback(() => {
    if (!activeChat) return;
    if (!input.trim()) return;
    const newMsg = {
      id: Date.now().toString(),
      text: input.trim(),
      sent: true, time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
      type: 'text', read: false,
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    // send({ type: 'message', text: newMsg.text }); // WebSocket real

  }, [activeChat, input]);

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
      };
      setMessages(prev => [...prev, newMsg]);
      // send({ type: 'image', uri: asset.uri }); // WebSocket real
    }
  };

  useEffect(() => {
    if (!messages.length) return;
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isTyping]);

  const activeContact = CHATS.find(c => c.id === activeChat);
  const hasActiveChat = Boolean(activeContact);

  return (
    <View style={styles.container}>
      <LinearGradient colors={pageGradient} style={StyleSheet.absoluteFill} />

      <View style={styles.layout}>
        {/* Sidebar */}
        <View style={styles.sidebar}>
          <View style={styles.sideHead}>
            <Text style={styles.sideTitle}>Mensajes</Text>
            <View style={styles.searchWrap}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput style={styles.searchInput} placeholder="Buscar..." placeholderTextColor={Colors.textMuted} />
            </View>
          </View>
          <FlatList
            data={CHATS}
            keyExtractor={c => c.id}
            renderItem={({ item }) => (
              <ChatItem chat={item} active={item.id === activeChat} onPress={() => setActiveChat(item.id)} />
            )}
            ListEmptyComponent={(
              <View style={styles.emptyListWrap}>
                <MaterialCommunityIcons name="chat-outline" size={22} color="rgba(255,255,255,0.28)" />
                <Text style={styles.emptyListTitle}>Sin chats por ahora</Text>
                <Text style={styles.emptyListSub}>Cuando tengas matches, aparecerán aquí.</Text>
              </View>
            )}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Panel de chat */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.mainChat}>
          {!hasActiveChat ? (
            <View style={styles.emptyChatWrap}>
              <LinearGradient colors={["rgba(124,58,237,0.15)", "rgba(236,72,153,0.08)"]} style={styles.emptyChatCard}>
                <Ionicons name="chatbubbles-outline" size={34} color="rgba(255,255,255,0.7)" />
                <Text style={styles.emptyChatTitle}>Aún no tienes conversaciones</Text>
                <Text style={styles.emptyChatSub}>Haz match con alguien para empezar tu primer chat.</Text>
              </LinearGradient>
            </View>
          ) : (
            <>
          {/* Header */}
          <View style={styles.chatHead}>
            <View style={{ position: 'relative' }}>
              <View style={[styles.headAv, { backgroundColor: `${activeContact?.color}33` }]}>
                <Text style={[styles.headAvText, { color: activeContact?.accent }]}>{activeContact?.initials}</Text>
              </View>
              {activeContact?.online && <View style={styles.onlineDot} />}
            </View>
            <View style={styles.headInfo}>
              <Text style={styles.headName}>{activeContact?.name}</Text>
              <View style={styles.headStatus}>
                <View style={styles.statusDot} />
                <Text style={styles.headStatusText}>En línea ahora</Text>
              </View>
            </View>
            <View style={styles.wsChip}>
              <View style={styles.wsDot} />
              <Text style={styles.wsText}>WS LIVE</Text>
            </View>
            <TouchableOpacity style={styles.headBtn}><Text style={{ color: Colors.textMuted, fontSize: 13 }}>⋯</Text></TouchableOpacity>
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
            </>
          )}
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  layout: { flex: 1, flexDirection: 'row', paddingTop: 56 },
  sidebar: { width: 200, borderRightWidth: 1, borderRightColor: Colors.border },
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
  chatItemAvText: { fontFamily: Fonts.display, fontSize: 12, fontWeight: '700' },
  chatItemInfo: { flex: 1, minWidth: 0 },
  chatItemName: { fontFamily: Fonts.sansSemiBold, fontSize: 12, color: Colors.text },
  chatItemLast: { fontFamily: Fonts.sans, fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  chatItemMeta: { alignItems: 'flex-end', gap: 4 },
  chatItemTime: { fontFamily: Fonts.sans, fontSize: 9, color: 'rgba(255,255,255,0.25)' },
  unreadBadge: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  unreadText: { fontFamily: Fonts.sansSemiBold, fontSize: 9, color: Colors.text },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.green, position: 'absolute', bottom: 0, right: 0, borderWidth: 2, borderColor: Colors.card },
  mainChat: { flex: 1 },
  emptyChatWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  emptyChatCard: { width: '100%', borderRadius: 18, borderWidth: 1, borderColor: Colors.border, paddingVertical: 28, paddingHorizontal: 18, alignItems: 'center' },
  emptyChatTitle: { fontFamily: Fonts.display, fontSize: 19, color: Colors.text, marginTop: 10, textAlign: 'center' },
  emptyChatSub: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.textMuted, marginTop: 8, textAlign: 'center', lineHeight: 18 },
  chatHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headAv: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headAvText: { fontFamily: Fonts.display, fontSize: 13, fontWeight: '700' },
  headInfo: { flex: 1 },
  headName: { fontFamily: Fonts.display, fontSize: 14, color: Colors.text, },
  headStatus: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.green },
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
