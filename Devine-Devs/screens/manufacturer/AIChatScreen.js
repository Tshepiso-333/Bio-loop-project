// screens/manufacturer/AIChatScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
  Animated,
  Easing,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useManufacturerContext } from '../../src/contexts/ManufacturerContext';

const INITIAL_MESSAGE = { 
  id: '1', 
  text: "Hello! I'm your BioLoop AI Assistant. How can I help you manage your biodiesel manufacturing process today?", 
  isUser: false, 
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  quickReplies: ["Inventory status", "Production schedule", "Quality forecast"]
};

// Animated 3-dot typing indicator
const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (value, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: -6,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createAnimation(dot1, 0);
    const anim2 = createAnimation(dot2, 150);
    const anim3 = createAnimation(dot3, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  return (
    <View style={styles.aiMessageWrapper}>
      <View style={styles.aiIconContainer}>
        <Image 
          source={require('../../assets/BioLoop_Logo.png')} 
          style={styles.aiIcon}
        />
      </View>
      <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
        <View style={styles.typingDotsContainer}>
          <Animated.View style={[styles.animatedDot, { transform: [{ translateY: dot1 }] }]} />
          <Animated.View style={[styles.animatedDot, { transform: [{ translateY: dot2 }] }]} />
          <Animated.View style={[styles.animatedDot, { transform: [{ translateY: dot3 }] }]} />
        </View>
      </View>
    </View>
  );
};

const AIChatScreen = ({ navigation, onBack }) => {
  const { inventory, tanks = [], forecasts = [], pickups = [] } = useManufacturerContext();
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([INITIAL_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef();

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isTyping]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleClearChat = () => {
    setChatMessages([INITIAL_MESSAGE]);
  };

  const currentStock = inventory?.current_stock_liters ?? 14250;
  const thisWeekVolume = forecasts?.[0]?.total_volume_liters ?? 28000;

  const getAIResponse = (question) => {
    const q = question.toLowerCase();

    if (q.includes('production') || q.includes('schedule')) {
      return {
        text: `Your current batch yield is optimized at 94.2%. Next scheduled processing batch is set for tomorrow at 08:00 AM with 5,000L of used cooking oil (UCO).`,
        quickReplies: ["View batch details", "Reschedule batch"]
      };
    } 
    else if (q.includes('quality') || q.includes('grade')) {
      const sevenDayForecast = forecasts?.find(f => f.period_days === 7);
      const gradeA = sevenDayForecast?.grade_a_pct ?? 82;
      const gradeB = sevenDayForecast?.grade_b_pct ?? 15;
      const gradeC = sevenDayForecast?.grade_c_pct ?? 3;

      return {
        text: `Quality analysis for current output:\n• Grade A (EN 14214 standard): ${gradeA}%\n• Grade B (Blend stock): ${gradeB}%\n• Grade C (Reprocessing required): ${gradeC}%`,
        quickReplies: ["Download Certificate", "Quality specs"]
      };
    } 
    else if (q.includes('inventory') || q.includes('stock')) {
      const tankCount = (tanks || []).length || 4;
      return {
        text: `Current inventory holds ${currentStock.toLocaleString()} Liters across ${tankCount} active storage tanks.\n\nTank 1 (Raw UCO): 85% capacity\nTank 2 (Biodiesel B100): 62% capacity`,
        quickReplies: ["Tank status", "Order feedstock"]
      };
    } 
    else if (q.includes('forecast') || q.includes('prediction')) {
      return {
        text: `7-Day projected collection volume is ${thisWeekVolume.toLocaleString()} Liters based on current supplier pickup schedules.`,
        quickReplies: ["Supplier breakdown", "Monthly view"]
      };
    } 
    else if (q.includes('supplier') || q.includes('restaurant') || q.includes('pickup')) {
      const pickupCount = (pickups || []).length || 6;
      return {
        text: `You have ${pickupCount} upcoming supplier pickups scheduled for today. Top performing partner: Metro Diner Group (+12% volume).`,
        quickReplies: ["View routes", "Contact drivers"]
      };
    } 
    else if (q.includes('sustainability') || q.includes('carbon') || q.includes('co2')) {
      return {
        text: `Sustainability Impact This Month:\n🌱 34.2 Tons of CO2 emissions prevented\n♻️ 18,400L of waste oil diverted from landfills.`,
        quickReplies: ["Export ESG report"]
      };
    }
    else if (q.includes('alert') || q.includes('notification')) {
      return {
        text: `⚠️ 1 Active System Alert:\nTank 3 FFA (Free Fatty Acid) levels elevated by 1.8%. Consider adjusting pre-treatment catalyst dosage.`,
        quickReplies: ["Resolve alert", "View telemetry"]
      };
    }
    else {
      return {
        text: "I can help you monitor and optimize your biodiesel plant operations. Ask me about inventory, quality testing, pickup schedules, or carbon savings.",
        quickReplies: ["Inventory status", "Quality forecast", "Supplier routes"]
      };
    }
  };

  const handleSend = (textToSend) => {
    const messageText = textToSend || chatMessage;
    if (!messageText.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatMessage('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getAIResponse(messageText);
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        quickReplies: response.quickReplies,
        isUser: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const suggestionChips = [
    { id: 1, text: "📦 Inventory levels", query: "Current inventory levels" },
    { id: 2, text: "⚙️ Production schedule", query: "What is my production schedule?" },
    { id: 3, text: "🧪 Quality forecast", query: "Quality forecast for output" },
    { id: 4, text: "🚛 Supplier pickups", query: "Show supplier pickups" },
    { id: 5, text: "🌱 Carbon savings", query: "Show me sustainability metrics" },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F4D30" />
      
      {/* Header */}
      <LinearGradient
        colors={['#15643E', '#0F4D30', '#0B3A24']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => (onBack ? onBack() : navigation.goBack())}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={styles.aiAvatarContainer}>
              <Image 
                source={require('../../assets/BioLoop_Logo.png')} 
                style={styles.aiAvatar}
              />
              <View style={styles.onlineDot} />
            </View>
            <View>
              <Text style={styles.headerTitle}>BioLoop AI</Text>
              <Text style={styles.headerSubtitle}>Plant Intelligence Assistant</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.clearButton} onPress={handleClearChat} activeOpacity={0.7}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Keyboard Avoiding View */}
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
            {/* Scrollable Message List */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesScrollView}
              contentContainerStyle={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={scrollToBottom}
            >
              {chatMessages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageWrapper,
                    msg.isUser ? styles.userMessageWrapper : styles.aiMessageWrapper
                  ]}
                >
                  {!msg.isUser && (
                    <View style={styles.aiIconContainer}>
                      <Image 
                        source={require('../../assets/BioLoop_Logo.png')} 
                        style={styles.aiIcon}
                      />
                    </View>
                  )}
                  
                  <View style={{ maxWidth: '78%' }}>
                    <View
                      style={[
                        styles.messageBubble,
                        msg.isUser ? styles.userBubble : styles.aiBubble
                      ]}
                    >
                      <Text style={msg.isUser ? styles.userMessageText : styles.aiMessageText}>
                        {msg.text}
                      </Text>
                      <Text style={[styles.messageTime, msg.isUser ? styles.userTime : styles.aiTime]}>
                        {msg.time}
                      </Text>
                    </View>

                    {!msg.isUser && msg.quickReplies && (
                      <View style={styles.inlineRepliesContainer}>
                        {msg.quickReplies.map((reply, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={styles.inlineReplyBtn}
                            onPress={() => handleSend(reply)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.inlineReplyText}>{reply}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {msg.isUser && (
                    <View style={styles.userIconContainer}>
                      <Text style={styles.userIconText}>ME</Text>
                    </View>
                  )}
                </View>
              ))}
              
              {isTyping && <TypingIndicator />}
            </ScrollView>

            {/* Quick Suggestion Chips */}
            <View style={styles.suggestionsWrapper}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsContainer}
                keyboardShouldPersistTaps="handled"
              >
                {suggestionChips.map((chip) => (
                  <TouchableOpacity
                    key={chip.id}
                    style={styles.suggestionChip}
                    onPress={() => handleSend(chip.query)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestionChipText}>{chip.text}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Fixed Bottom Input Bar */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Ask about inventory, quality, yield..."
                  placeholderTextColor="#A9B5AD"
                  value={chatMessage}
                  onChangeText={setChatMessage}
                  onFocus={scrollToBottom}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity 
                  style={[styles.sendButton, !chatMessage.trim() && styles.sendButtonDisabled]}
                  onPress={() => handleSend()}
                  disabled={!chatMessage.trim()}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={chatMessage.trim() ? ['#15643E', '#0F4D30'] : ['#C9D4CE', '#A9B5AD']}
                    style={styles.sendGradient}
                  >
                    <Text style={styles.sendButtonText}>Send</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              <Text style={styles.inputHintText}>
                BioLoop AI • Powered by your plant operating data
              </Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F4D30',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 10 : 8,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '600',
    marginTop: -2,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiAvatarContainer: {
    position: 'relative',
  },
  aiAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    backgroundColor: '#fff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34D399',
    borderWidth: 2,
    borderColor: '#0F4D30',
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 10.5,
    color: '#D1FAE5',
    fontWeight: '400',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: '#F4F7F5',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  messagesScrollView: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-end',
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  aiMessageWrapper: {
    justifyContent: 'flex-start',
  },
  aiIconContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  aiIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E4EDE7',
  },
  userIconContainer: {
    marginLeft: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#15643E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  userIconText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#15643E',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E6ECE8',
  },
  userMessageText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 19,
  },
  aiMessageText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  aiTime: {
    color: '#9CA3AF',
  },
  inlineRepliesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  inlineReplyBtn: {
    backgroundColor: '#EBF4F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C3DDD0',
  },
  inlineReplyText: {
    fontSize: 12,
    color: '#15643E',
    fontWeight: '600',
  },
  typingBubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: 60,
  },
  typingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 10,
  },
  animatedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#15643E',
  },
  suggestionsWrapper: {
    borderTopWidth: 1,
    borderTopColor: '#EBF0EC',
    backgroundColor: '#F4F7F5',
    paddingVertical: 6,
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D2E0D8',
  },
  suggestionChipText: {
    fontSize: 12,
    color: '#15643E',
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 14,
    maxHeight: 90,
    color: '#111827',
  },
  sendButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendGradient: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  inputHintText: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
  },
});

export default AIChatScreen;