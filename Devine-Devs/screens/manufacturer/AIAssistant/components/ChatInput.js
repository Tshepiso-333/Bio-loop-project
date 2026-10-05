// screens/manufacturer/AIAssistant/components/ChatInput.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ChatInput = ({ onSendMessage, disabled }) => {
  const [inputText, setInputText] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const sendScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || disabled) return;

    Animated.sequence([
      Animated.timing(sendScale, {
        toValue: 0.85,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(sendScale, {
        toValue: 1,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start();

    setInputText('');
    setInputHeight(40);
    onSendMessage(text);
  };

  const handleContentSizeChange = (event) => {
    const h = Math.min(
      Math.max(event.nativeEvent.contentSize.height, 40),
      120
    );
    setInputHeight(h);
  };

  const canSend = inputText.trim().length > 0 && !disabled;

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: keyboardVisible ? 10 : 20 },
      ]}
    >
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.textInput, { height: Math.max(40, inputHeight) }]}
          placeholder="Ask about inventory, quality, finance…"
          placeholderTextColor="#9ca3af"
          value={inputText}
          onChangeText={setInputText}
          multiline
          onContentSizeChange={handleContentSizeChange}
          editable={!disabled}
          maxLength={1000}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={handleSend}
        />

        <Animated.View style={{ transform: [{ scale: sendScale }] }}>
          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                canSend ? ['#10b981', '#059669'] : ['#d1d5db', '#9ca3af']
              }
              style={styles.sendGradient}
            >
              <Ionicons name="arrow-up" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    maxHeight: 120,
    color: '#111827',
  },
  sendButton: { borderRadius: 22, overflow: 'hidden' },
  sendButtonDisabled: { opacity: 0.5 },
  sendGradient: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatInput;