// screens/manufacturer/AIAssistant/AIAssistantScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ConversationList from './components/ConversationList';
import ChatInterface from './components/ChatInterface';
import { generateUniqueId } from './utils/helpers';

const AIAssistantScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [currentView, setCurrentView] = useState('list');
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [slideAnim] = useState(new Animated.Value(0));
  const [searchQuery, setSearchQuery] = useState('');
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const filteredConversations = searchQuery.trim()
    ? conversations.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.messages?.some((m) =>
            m.text?.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : conversations;

  const startNewConversation = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      const newConversation = {
        id: generateUniqueId(),
        title: 'New conversation',
        messages: [],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };
      setCurrentConversation(newConversation);
      setConversations((prev) => [newConversation, ...prev]);
      animateToChat();
    });
  };

  const openConversation = (conversation) => {
    setCurrentConversation(conversation);
    animateToChat();
  };

  const animateToChat = () => {
    setCurrentView('chat');
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const animateToList = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start(() => setCurrentView('list'));
  };

  const updateConversation = (updated) => {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === updated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [updated, ...prev];
    });
    setCurrentConversation(updated);
  };

  const deleteConversation = (id) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
  };

  const listTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -400],
  });

  const chatTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  return (
    <View style={styles.container}>
      {currentView === 'list' && (
        <Animated.View
          style={[
            styles.fullScreen,
            { transform: [{ translateX: listTranslateX }] },
          ]}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.headerGradient, { paddingTop: insets.top + 12 }]}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerAvatarWrap}>
                <Image
                  source={require('../../../assets/BioLoop_Logo.png')}
                  style={styles.headerAvatar}
                />
                <View style={styles.onlineDot} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>BioLoop Assistant</Text>
                <Text style={styles.headerSubtitle}>Online • Ready to help</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.listBody}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                style={styles.newChatButton}
                onPress={startNewConversation}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.newChatGradient}
                >
                  <Ionicons name="sparkles-outline" size={20} color="#fff" />
                  <Text style={styles.newChatText}>Start a new conversation</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.searchWrap}>
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search conversations…"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ConversationList
            conversations={filteredConversations}
            onSelectConversation={openConversation}
            onDeleteConversation={deleteConversation}
            insets={insets}
            isLoading={false}
            onRefresh={() => {}}
          />
        </Animated.View>
      )}

      {currentView === 'chat' && (
        <Animated.View
          style={[
            styles.fullScreen,
            { transform: [{ translateX: chatTranslateX }] },
          ]}
        >
          <ChatInterface
            conversation={currentConversation}
            onBack={animateToList}
            onUpdateConversation={updateConversation}
            insets={insets}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  fullScreen: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  headerGradient: { paddingBottom: 14 },
  headerContent: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatarWrap: { position: 'relative' },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#fff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7EE92D',
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 11, color: '#fff', opacity: 0.9, marginTop: 2 },
  listBody: { paddingHorizontal: 20, paddingTop: 16 },
  newChatButton: { borderRadius: 16, overflow: 'hidden', marginBottom: 14 },
  newChatGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  newChatText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827', paddingVertical: 4 },
});

export default AIAssistantScreen;