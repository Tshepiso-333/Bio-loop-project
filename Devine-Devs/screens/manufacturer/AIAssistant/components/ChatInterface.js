// screens/manufacturer/AIAssistant/components/ChatInterface.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useManufacturerContext } from '../../../../src/contexts/ManufacturerContext';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { generateUniqueId } from '../utils/helpers';
import { STARTER_PROMPTS } from '../utils/constants';

// ─── CONFIG ───────────────────────────────────────────────────────────────

const AI_CHAT_URL =
  'https://dhgveofhbvxqhpywapel.supabase.co/functions/v1/ai-chat';

const AI_TIMEOUT_MS = 7000;

// ─── LOCAL FALLBACK RESPONDER ─────────────────────────────────────────────

const buildResponder = (ctx) => (question) => {
  const q = (question || '').toLowerCase();

  if (
    q.includes('inventory') ||
    q.includes('stock') ||
    q.includes('how much oil') ||
    q.includes('oil do i have')
  ) {
    const change = ctx.stockChange
      ? ` ${ctx.stockChange >= 0 ? 'up' : 'down'} ${Math.abs(ctx.stockChange)}% from last week.`
      : '';
    return (
      `You currently have ${ctx.currentStock.toLocaleString()} L of waste oil in stock,${change}\n\n` +
      `• Tanks on record: ${ctx.tanks.length}\n` +
      `• This week's collected volume: ${ctx.thisWeekVolume.toLocaleString()} L\n\n` +
      `Would you like a breakdown by quality grade?`
    );
  }

  if (q.includes('quality') || q.includes('grade') || q.includes('forecast')) {
    return (
      `Here's your 7-day quality forecast:\n\n` +
      `• Grade A: ${ctx.gradeA}% — premium feedstock\n` +
      `• Grade B: ${ctx.gradeB}% — standard quality\n` +
      `• Grade C: ${ctx.gradeC}% — additional processing required\n\n` +
      `Grade A is best suited for biodiesel production. Grade C is recommended for industrial use.`
    );
  }

  if (
    q.includes('financ') ||
    q.includes('money') ||
    q.includes('revenue') ||
    q.includes('margin') ||
    q.includes('profit')
  ) {
    return (
      `Based on your current stock of ${ctx.currentStock.toLocaleString()} L:\n\n` +
      `• Estimated biodiesel output: ${ctx.estBiodiesel.toLocaleString()} L (90% conversion)\n` +
      `• Estimated revenue: R${ctx.estRevenue.toLocaleString()} (at R20/L)\n` +
      `• Estimated margin: R${ctx.estMargin.toLocaleString()}\n\n` +
      `Open the Finance tab for a full cost breakdown.`
    );
  }

  if (
    q.includes('deliver') ||
    q.includes('pickup') ||
    q.includes('supplier') ||
    q.includes('restaurant')
  ) {
    return (
      `You have ${ctx.activeDeliveries} active deliver${
        ctx.activeDeliveries === 1 ? 'y' : 'ies'
      } in progress across ${ctx.activeSuppliers} supplier${
        ctx.activeSuppliers === 1 ? '' : 's'
      }.\n\n` +
      `Head to Suppliers to see who's on the way.`
    );
  }

  if (q.includes('alert') || q.includes('notification')) {
    return `Check the Alerts tab — alerts are grouped into "Requires action" and "Updates".`;
  }

  if (q.includes('help') || q.includes('what can you')) {
    return (
      `I can help with:\n\n` +
      `• Inventory — stock and tank levels\n` +
      `• Quality — Grade A/B/C mix\n` +
      `• Deliveries — active pickups\n` +
      `• Finance — output, revenue, margin`
    );
  }

  return `I'm having a little trouble reaching my knowledge base right now. In the meantime, try asking about your inventory, quality, deliveries, or finances.`;
};

// ─── AI CALL WITH TIMEOUT + FALLBACK ─────────────────────────────────────

async function askAiOrNull({ question, context, history }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const res = await fetch(AI_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context, history }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn('[AI chat] non-OK response:', res.status);
      return null;
    }

    const data = await res.json();
    const answer = (data?.answer ?? '').toString().trim();
    return answer || null;
  } catch (err) {
    console.warn('[AI chat] falling back to local:', err?.message ?? err);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── CHAT INTERFACE ───────────────────────────────────────────────────────

const ChatInterface = ({
  conversation,
  onBack,
  onUpdateConversation,
  insets,
}) => {
  const manufacturerCtx = useManufacturerContext();
  const [messages, setMessages] = useState(
    Array.isArray(conversation?.messages) ? conversation.messages : []
  );
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Live context object sent to Gemini
  const aiContext = {
    currentStock: manufacturerCtx.inventory?.current_stock_liters ?? 0,
    stockChange: manufacturerCtx.inventory?.stock_change_pct ?? 0,
    thisWeekVolume: manufacturerCtx.forecasts?.[0]?.total_volume_liters ?? 0,
    tanksCount: (manufacturerCtx.tanks ?? []).length,
    gradeA:
      manufacturerCtx.forecasts?.find((f) => f.period_days === 7)?.grade_a_pct ??
      0,
    gradeB:
      manufacturerCtx.forecasts?.find((f) => f.period_days === 7)?.grade_b_pct ??
      0,
    gradeC:
      manufacturerCtx.forecasts?.find((f) => f.period_days === 7)?.grade_c_pct ??
      0,
    activeDeliveries: (manufacturerCtx.pickups ?? []).filter((p) =>
      [
        'in_transit',
        'arrival',
        'in_progress',
        'collected',
        'arrived_manufacturer',
      ].includes(p.status)
    ).length,
    activeSuppliers: (manufacturerCtx.assignedRestaurants ?? []).length,
    estBiodiesel: Math.round(
      (manufacturerCtx.inventory?.current_stock_liters ?? 0) * 0.9
    ),
    estRevenue: Math.round(
      (manufacturerCtx.inventory?.current_stock_liters ?? 0) * 0.9 * 20
    ),
    estMargin: Math.round(
      (manufacturerCtx.inventory?.current_stock_liters ?? 0) * 0.9 * 20 -
        (manufacturerCtx.inventory?.current_stock_liters ?? 0) * 3.5 -
        (manufacturerCtx.inventory?.current_stock_liters ?? 0) * 0.9 * 4.44
    ),
  };

  const responder = useCallback(buildResponder(aiContext), [manufacturerCtx]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, []);

  const scrollToEnd = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 80);
  };

  const sendMessage = async (text) => {
    const cleanText = (text ?? '').trim();
    if (!cleanText || isTyping) return;

    // Defensive: always operate on a safe array
    const safeMessages = Array.isArray(messages) ? messages : [];

    const userMessage = {
      id: generateUniqueId(),
      text: cleanText,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    const nextMessages = [...safeMessages, userMessage];
    setMessages(nextMessages);
    setIsTyping(true);
    scrollToEnd();

    // Persist user message
    onUpdateConversation?.({
      ...(conversation || {}),
      id: conversation?.id,
      title:
        safeMessages.length === 0
          ? cleanText.slice(0, 40)
          : conversation?.title || cleanText.slice(0, 40),
      messages: nextMessages,
      lastModified: new Date().toISOString(),
    });

    // Build history safely
    const history = safeMessages
      .slice(-6)
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text ?? '',
      }));

    // Ask Gemini; fall back to local responder
    const aiReply = await askAiOrNull({
      question: cleanText,
      context: aiContext,
      history,
    });

    const replyText = aiReply || responder(cleanText);

    bounceAnim.setValue(0);
    const aiMessage = {
      id: generateUniqueId(),
      text: replyText,
      sender: 'ai',
      timestamp: new Date().toISOString(),
    };

    const finalMessages = [...nextMessages, aiMessage];
    setMessages(finalMessages);
    setIsTyping(false);

    Animated.spring(bounceAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 6,
    }).start();

    // Persist AI reply
    onUpdateConversation?.({
      ...(conversation || {}),
      id: conversation?.id,
      title:
        safeMessages.length === 0
          ? cleanText.slice(0, 40)
          : conversation?.title || cleanText.slice(0, 40),
      messages: finalMessages,
      lastModified: new Date().toISOString(),
    });

    scrollToEnd();
  };

  const handleBack = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => onBack?.());
  };

  const renderMessage = ({ item, index }) => {
    const isFirstInGroup =
      index === 0 || messages[index - 1]?.sender !== item.sender;

    return (
      <MessageBubble
        message={item}
        isFirstInGroup={isFirstInGroup}
        bounceAnim={
          index === messages.length - 1 && item.sender === 'ai'
            ? bounceAnim
            : null
        }
      />
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    return (
      <View style={styles.typingRow}>
        <Image
          source={require('../../../../assets/BioLoop_Logo.png')}
          style={styles.typingAvatar}
        />
        <View style={styles.typingBubble}>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, { opacity: 0.9 }]} />
            <View style={[styles.typingDot, { opacity: 0.6 }]} />
            <View style={[styles.typingDot, { opacity: 0.3 }]} />
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconCircle}>
        <Image
          source={require('../../../../assets/BioLoop_Logo.png')}
          style={styles.emptyLogo}
        />
      </View>
      <Text style={styles.emptyTitle}>Ask me anything</Text>
      <Text style={styles.emptyDescription}>
        I can help with your inventory, quality, deliveries and finances.
      </Text>

      <View style={styles.suggestionsWrap}>
        {STARTER_PROMPTS.map((prompt) => (
          <TouchableOpacity
            key={prompt.id}
            style={styles.suggestionChip}
            onPress={() => sendMessage(prompt.label)}
            activeOpacity={0.85}
          >
            <Text style={styles.suggestionText}>{prompt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['#10b981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.headerAvatarWrap}>
              <Image
                source={require('../../../../assets/BioLoop_Logo.png')}
                style={styles.headerAvatar}
              />
              <View style={styles.onlineDot} />
            </View>
            <View>
              <Text style={styles.headerTitle}>BioLoop Assistant</Text>
              <Text style={styles.headerSubtitle}>
                {isTyping ? 'Thinking…' : 'Online'}
              </Text>
            </View>
          </View>

          <View style={{ width: 38 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderTypingIndicator}
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 && styles.emptyList,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
        />

        <ChatInput onSendMessage={sendMessage} disabled={isTyping} />
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingBottom: 14 },
  headerRow: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatarWrap: { position: 'relative' },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#7EE92D',
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 11, color: '#fff', opacity: 0.9, marginTop: 1 },
  chatContainer: { flex: 1 },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyLogo: { width: 60, height: 60, borderRadius: 30 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  suggestionsWrap: { width: '100%', gap: 10 },
  suggestionChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  suggestionText: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '600',
    textAlign: 'center',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  typingAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  typingBubble: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  typingDots: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
});

export default ChatInterface;