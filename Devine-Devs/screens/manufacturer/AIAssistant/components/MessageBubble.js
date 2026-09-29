// screens/manufacturer/AIAssistant/components/MessageBubble.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { formatMessageTime } from '../utils/helpers';

const { width: screenWidth } = Dimensions.get('window');

const MessageBubble = ({ message, isFirstInGroup, bounceAnim }) => {
  const isUser = message.sender === 'user';
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (!bounceAnim) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    }
  }, []);

  const animationStyle = bounceAnim
    ? { transform: [{ scale: bounceAnim }] }
    : { transform: [{ scale: scaleAnim }] };

  return (
    <Animated.View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.aiContainer,
        animationStyle,
      ]}
    >
      {!isUser && isFirstInGroup && (
        <View style={styles.avatarContainer}>
          <Image
            source={require('../../../../assets/BioLoop_Logo.png')}
            style={styles.aiAvatar}
          />
        </View>
      )}

      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.aiBubble,
        ]}
      >
        <Text style={isUser ? styles.userText : styles.aiText}>
          {message.text}
        </Text>
        <Text
          style={[
            styles.timestamp,
            isUser ? styles.userTimestamp : styles.aiTimestamp,
          ]}
        >
          {formatMessageTime(message.timestamp)}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    paddingHorizontal: 8,
  },
  userContainer: { alignItems: 'flex-end' },
  aiContainer: { alignItems: 'flex-start', flexDirection: 'row' },
  avatarContainer: { marginRight: 6, marginTop: 4 },
  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bubble: {
    maxWidth: screenWidth * 0.75,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: { backgroundColor: '#10b981' },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userText: { fontSize: 15, lineHeight: 21, color: '#FFFFFF' },
  aiText: { fontSize: 15, lineHeight: 21, color: '#111827' },
  timestamp: { fontSize: 10, marginTop: 4 },
  userTimestamp: { color: 'rgba(255,255,255,0.75)', textAlign: 'right' },
  aiTimestamp: { color: '#9CA3AF' },
});

export default MessageBubble;