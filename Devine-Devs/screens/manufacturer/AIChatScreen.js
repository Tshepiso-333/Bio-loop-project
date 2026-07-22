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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useManufacturerContext } from '../../src/contexts/ManufacturerContext';

const AIChatScreen = ({ navigation }) => {
  const { inventory, tanks = [], forecasts = [], pickups = [] } = useManufacturerContext();
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { 
      id: 1, 
      text: "Hello! I'm your AI assistant. How can I help you with your biodiesel manufacturing today?", 
      isUser: false, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      typing: false,
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef();

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Use real data from context for responses
  const currentStock = inventory?.current_stock_liters ?? 0;
  const thisWeekVolume = forecasts?.[0]?.total_volume_liters ?? 0;

  const getAIResponse = (question) => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('production') || lowerQuestion.includes('schedule')) {
      return "Production scheduling requires data not yet available. Please check back once historical data is loaded.";
    } 
    else if (lowerQuestion.includes('quality') || lowerQuestion.includes('grade')) {
      const sevenDayForecast = forecasts?.find(f => f.period_days === 7);
      return sevenDayForecast ? `Current quality forecast: Grade A (${sevenDayForecast.grade_a_pct ?? 0}%), Grade B (${sevenDayForecast.grade_b_pct ?? 0}%), Grade C (${sevenDayForecast.grade_c_pct ?? 0}%).` : "Quality data not yet available.";
    } 
    else if (lowerQuestion.includes('inventory') || lowerQuestion.includes('stock')) {
      return `Current inventory: ${currentStock.toLocaleString()}L. Tank data: ${(tanks || []).length} tanks recorded.`;
    } 
    else if (lowerQuestion.includes('forecast') || lowerQuestion.includes('prediction')) {
      return `7-day forecast: ${thisWeekVolume.toLocaleString()}L.`;
    } 
    else if (lowerQuestion.includes('supplier') || lowerQuestion.includes('restaurant')) {
      return `${(pickups || []).length} upcoming deliveries from suppliers.`;
    } 
    else if (lowerQuestion.includes('alert') || lowerQuestion.includes('notification')) {
      return "Alerts are loading. Please check back in a moment.";
    }
    else if (lowerQuestion.includes('help')) {
      return "I can help you with manufacturing data. What would you like to know?";
    }
    else {
      return "I can help you manage your biodiesel manufacturing. Ask me about inventory, forecasts, or deliveries.";
    }
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;
    
    const userMessage = {
      id: chatMessages.length + 1,
      text: chatMessage,
      isUser: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatMessage('');
    setIsTyping(true);
    
    // Simulate AI thinking
    setTimeout(() => {
      const aiResponse = {
        id: chatMessages.length + 2,
        text: getAIResponse(chatMessage),
        isUser: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  // Quick suggestion chips
  const suggestionChips = [
    { id: 1, text: "Production schedule", query: "What's the production schedule?" },
    { id: 2, text: "Quality forecast", query: "Quality forecast for next week" },
    { id: 3, text: "Inventory levels", query: "Current inventory levels" },
    { id: 4, text: "Supplier performance", query: "How are my suppliers performing?" },
    { id: 5, text: "Sustainability", query: "Show me sustainability metrics" },
    { id: 6, text: "Alerts", query: "Show me my alerts" },
  ];

  // Header Component - Updated to fill to the top
  const Header = () => (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />
      <LinearGradient
        colors={['#10b981', '#059669', '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
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
              <Text style={styles.headerTitle}>AI Assistant</Text>
              <Text style={styles.headerSubtitle}>Online • Ready to help</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </>
  );

  // Typing indicator component
  const TypingIndicator = () => (
    <View style={styles.typingContainer}>
      <View style={styles.aiBubble}>
        <View style={styles.typingDots}>
          <View style={styles.typingDot} />
          <View style={[styles.typingDot, styles.typingDotDelay]} />
          <View style={[styles.typingDot, styles.typingDotDelayLong]} />
        </View>
        <Text style={styles.typingText}>AI is thinking...</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesScrollView}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {chatMessages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageWrapper,
                message.isUser ? styles.userMessageWrapper : styles.aiMessageWrapper
              ]}
            >
              {!message.isUser && (
                <View style={styles.aiIconContainer}>
                  <Image 
                    source={require('../../assets/BioLoop_Logo.png')} 
                    style={styles.aiIcon}
                  />
                </View>
              )}
              
              <View
                style={[
                  styles.messageBubble,
                  message.isUser ? styles.userBubble : styles.aiBubble
                ]}
              >
                <Text style={message.isUser ? styles.userMessageText : styles.aiMessageText}>
                  {message.text}
                </Text>
                <Text style={styles.messageTime}>{message.time}</Text>
              </View>
              
              {message.isUser && (
                <View style={styles.userIconContainer}>
                  <Text style={styles.userIcon}>KB</Text>
                </View>
              )}
            </View>
          ))}
          
          {isTyping && <TypingIndicator />}
        </ScrollView>
        
        {/* Suggestion Chips - Only show when there are few messages */}
        {chatMessages.length < 3 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.suggestionsScroll}
            contentContainerStyle={styles.suggestionsContainer}
          >
            {suggestionChips.map((chip) => (
              <TouchableOpacity
                key={chip.id}
                style={styles.suggestionChip}
                onPress={() => setChatMessage(chip.query)}
              >
                <Text style={styles.suggestionChipText}>{chip.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        
        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Ask me about production, quality, forecasts..."
              placeholderTextColor="#9ca3af"
              value={chatMessage}
              onChangeText={setChatMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[styles.sendButton, !chatMessage.trim() && styles.sendButtonDisabled]}
              onPress={sendChatMessage}
              disabled={!chatMessage.trim()}
            >
              <LinearGradient
                colors={chatMessage.trim() ? ['#10b981', '#059669'] : ['#d1d5db', '#9ca3af']}
                style={styles.sendGradient}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputHint}>
            <Text style={styles.inputHintText}>
              AI can help with production, quality, inventory, and more
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 48,
    paddingBottom: 12,
  },
  headerContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiAvatarContainer: {
    position: 'relative',
  },
  aiAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#fff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7EE92D',
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  keyboardView: {
    flex: 1,
  },
  messagesScrollView: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
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
  },
  aiIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  userIconContainer: {
    marginLeft: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userIcon: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#10b981',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  userMessageText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 20,
  },
  aiMessageText: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'right',
  },
  typingContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    opacity: 0.6,
  },
  typingDotDelay: {
    opacity: 0.4,
  },
  typingDotDelayLong: {
    opacity: 0.2,
  },
  typingText: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  suggestionsScroll: {
    maxHeight: 50,
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionChipText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'flex-end',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 100,
    color: '#111827',
  },
  sendButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  inputHint: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  inputHintText: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default AIChatScreen;