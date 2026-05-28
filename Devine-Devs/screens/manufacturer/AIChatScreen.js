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
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';

const AIChatScreen = ({ navigation }) => {
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

  // Mock data for responses
  const currentStock = 24580;
  const thisWeekVolume = 11500;

  const getAIResponse = (question) => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('production') || lowerQuestion.includes('schedule')) {
      return "Based on current forecasts, we recommend scheduling production runs for Mondays and Thursdays when Grade A supply peaks at 58%. Next optimal window: Thursday, 8:00 AM. Would you like me to add this to your calendar?";
    } 
    else if (lowerQuestion.includes('quality') || lowerQuestion.includes('grade')) {
      return "Current quality distribution: Grade A (58% from Golden Dragon & Spice Junction), Grade B (32% from Bella Italia), Grade C (10% from various vendors). Grade A quality has improved by 6% over the last 4 months. Would you like specific recommendations for improving Grade C quality?";
    } 
    else if (lowerQuestion.includes('inventory') || lowerQuestion.includes('stock')) {
      return `Current inventory: ${currentStock.toLocaleString()}L total. Tank A: 82% full (Grade A - 14,256L), Tank B: 45% full (Grade B - 7,866L), Tank C: 94% full (Grade C - 2,458L). Tank C requires attention within 24 hours. Should I schedule a transfer?`;
    } 
    else if (lowerQuestion.includes('forecast') || lowerQuestion.includes('prediction')) {
      return "7-day forecast: 12,450L (↑8%). 14-day: 25,890L (↑12%). 30-day: 53,200L (↑15%). Grade A expected to reach 56% in 30 days. Peak collection expected on Thursdays. Would you like me to prepare a detailed report?";
    } 
    else if (lowerQuestion.includes('supplier') || lowerQuestion.includes('restaurant')) {
      return "Top performing suppliers this month: 1. Golden Dragon (2,450L - Grade A), 2. Spice Junction (1,670L - Grade A), 3. Bella Italia (1,890L - Grade B). Golden Dragon has 98% reliability rating. Would you like to see full supplier analytics?";
    } 
    else if (lowerQuestion.includes('sustainability') || lowerQuestion.includes('esg') || lowerQuestion.includes('carbon')) {
      return "Year-to-date impact: 184.5 tonnes CO₂ avoided, 24,580L waste oil diverted, 845 trees equivalent planted. Your operations have displaced 18,920L of fossil diesel. Excellent progress! 🌱";
    }
    else if (lowerQuestion.includes('alert') || lowerQuestion.includes('notification')) {
      return "You have 3 unread alerts: 1) Tank C at 94% capacity, 2) Grade A stock below 30%, 3) Golden Dragon delivery arriving in 30 minutes. Would you like to review these now?";
    }
    else if (lowerQuestion.includes('help')) {
      return "I can help you with:\n• Production scheduling\n• Quality forecasts and analysis\n• Inventory management\n• Supplier performance\n• Sustainability metrics\n• Delivery tracking\n\nWhat would you like to know?";
    }
    else {
      return "I can help you manage your biodiesel manufacturing operations. You can ask me about production schedules, quality forecasts, inventory levels, supplier performance, or sustainability metrics. What specific information do you need?";
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

  // Header Component
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
    <SafeAreaView style={styles.container}>
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
    </SafeAreaView>
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