// screens/manufacturer/AIAssistant/AIAssistantScreen.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Image,
  FlatList,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConversationCard from './components/ConversationCard';
import ChatInterface from './components/ChatInterface';
import { generateUniqueId } from './utils/helpers';

const { width: screenWidth } = Dimensions.get('window');

// ─── THEME ───────────────────────────────────────────────────────────────────

const T = {
  primary: '#15643E',
  primaryMid: '#2E8B5A',
  primaryLight: '#47C14B',
  paleGreen: '#E7F1EB',
  page: '#F7F4EE',
  card: '#FFFFFF',
  ink: '#2E2E2E',
  body: '#6B6B6B',
  muted: '#9B9B9B',
  border: '#E8E8E8',
  divider: '#F3F4F6',
  white: '#FFFFFF',
};

const S = { screenPadding: 18 };

// ─── STARTER PROMPTS ─────────────────────────────────────────────────────────

const STARTER_PROMPTS = [
  {
    id: 'inventory',
    icon: 'water-outline',
    label: 'Inventory',
    title: 'How much oil do I have?',
    color: '#2E8B5A',
  },
  {
    id: 'quality',
    icon: 'shield-checkmark-outline',
    label: 'Quality',
    title: 'What is my quality forecast?',
    color: '#f59e0b',
  },
  {
    id: 'finance',
    icon: 'cash-outline',
    label: 'Finance',
    title: 'Give me my financial summary',
    color: '#2563EB',
  },
  {
    id: 'deliveries',
    icon: 'car-outline',
    label: 'Deliveries',
    title: 'What deliveries are active?',
    color: '#7C3AED',
  },
];

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

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

  const startNewConversation = (initialPrompt = null) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.96,
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
        title: initialPrompt ? initialPrompt.slice(0, 40) : 'New conversation',
        messages: [],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        pendingPrompt: initialPrompt || null,
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

  // ─── HEADER COMPONENT (rendered inside FlatList's ListHeaderComponent) ───
  //
  // NOTE: this is passed to FlatList via `ListHeaderComponent`, NOT wrapped
  // in a ScrollView. The FlatList is the ONLY vertical scroller on the
  // screen, so no VirtualizedList nesting warning occurs.

  const ListHeader = () => (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      {/* Hero greeting card */}
      <View style={styles.heroCard}>
        <View style={styles.heroIconWrap}>
          <Image
            source={require('../../../assets/BioLoop_Logo.png')}
            style={styles.heroLogo}
            resizeMode="cover"
          />
          <View style={styles.heroOnlineDot} />
        </View>
        <Text style={styles.heroTitle}>Hi there 👋</Text>
        <Text style={styles.heroSubtitle}>
          Ask me anything about your inventory, quality, deliveries, or finances.
        </Text>

        <TouchableOpacity
          style={styles.heroCta}
          onPress={() => startNewConversation()}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[T.primaryLight, T.primaryMid]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCtaGradient}
          >
            <Ionicons name="sparkles" size={18} color={T.white} />
            <Text style={styles.heroCtaText}>Start a new conversation</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Quick prompt tiles */}
      <Text style={styles.sectionTitle}>Quick questions</Text>
      <View style={styles.quickGrid}>
        {STARTER_PROMPTS.map((prompt) => (
          <TouchableOpacity
            key={prompt.id}
            style={styles.quickTile}
            onPress={() => startNewConversation(prompt.title)}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.quickTileIconWrap,
                { backgroundColor: `${prompt.color}15` },
              ]}
            >
              <Ionicons name={prompt.icon} size={24} color={prompt.color} />
            </View>
            <Text style={styles.quickTileLabel}>{prompt.label}</Text>
            <Text style={styles.quickTileTitle} numberOfLines={2}>
              {prompt.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent chats header + search */}
      {conversations.length > 0 ? (
        <>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent chats</Text>
            <Text style={styles.recentCount}>{conversations.length} total</Text>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={T.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search conversations…"
              placeholderTextColor={T.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={T.muted} />
              </TouchableOpacity>
            )}
          </View>
        </>
      ) : null}
    </Animated.View>
  );

  // ─── EMPTY STATE (shown when there are no conversations) ─────────────────

  const ListEmpty = () => {
    if (conversations.length === 0) return null;
    // We have conversations but the search returned nothing
    return (
      <View style={styles.emptySearch}>
        <Ionicons name="search-outline" size={26} color={T.primaryLight} />
        <Text style={styles.emptySearchTitle}>No matches</Text>
        <Text style={styles.emptySearchText}>
          Try a different search term.
        </Text>
      </View>
    );
  };

  // ─── LIST VIEW ───────────────────────────────────────────────────────────

  const ListView = () => (
    <View style={styles.listContainer}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Soft gradient wash */}
      <LinearGradient
        colors={['rgba(71, 193, 75, 0.22)', 'transparent']}
        style={[styles.gradientOverlay, { height: insets.top + 120 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.brandRow}>
            <View style={styles.logoIcon}>
              <Image
                source={require('../../../assets/BioLoop_Logo.png')}
                style={styles.logo}
                resizeMode="cover"
              />
            </View>
            <View style={styles.appNameContainer}>
              <Text style={styles.appName}>
                <Text style={styles.bioText}>Bio</Text>
                <Text style={styles.loopText}>Loop</Text>
              </Text>
              <View style={styles.tagline}>
                <Text style={styles.taglineText}>AI Assistant</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => startNewConversation()}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={22} color={T.ink} />
          </TouchableOpacity>
        </View>
      </View>

      {/* THE ONLY SCROLLER: a single FlatList with everything inside. */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationCard
            conversation={item}
            onPress={() => openConversation(item)}
            onDelete={() => deleteConversation(item.id)}
          />
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );

  // ─── RENDER ──────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {currentView === 'list' && (
        <Animated.View
          style={[
            styles.fullScreen,
            { transform: [{ translateX: listTranslateX }] },
          ]}
        >
          <ListView />
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

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.page },
  fullScreen: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  listContainer: { flex: 1, backgroundColor: T.page },

  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: S.screenPadding,
    paddingBottom: 20,
    zIndex: 1,
  },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
logoIcon: {
  width: 40,
  height: 40,
  borderRadius: 20,        // ← full circle (half of width/height)
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 8,
  marginBottom: 4,
  overflow: 'hidden',      // ← clip the child image to the circle
  borderWidth: 2,          // ← soft white ring for polish
  borderColor: T.white,
  shadowColor: T.primary,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 4,
  elevation: 3,
},
  logo: { width: '100%', height: '100%', borderRadius: 12 },
  appNameContainer: { flexDirection: 'column', paddingLeft: 4 },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 30,
    textShadowColor: 'rgba(0,0,0,0.10)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bioText: { color: T.ink, fontWeight: '800' },
  loopText: { color: T.primaryLight, fontWeight: '800' },
  tagline: {
    backgroundColor: 'rgba(71, 193, 75, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  taglineText: {
    fontSize: 9,
    color: T.primaryMid,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  // FlatList content
  scrollContent: {
    paddingHorizontal: S.screenPadding,
    paddingTop: 4,
  },

  // Hero card
  heroCard: {
    backgroundColor: T.card,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: T.border,
  },
  heroIconWrap: { position: 'relative', marginBottom: 12 },
  heroLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: T.paleGreen,
  },
  heroOnlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: T.primaryLight,
    borderWidth: 2.5,
    borderColor: T.white,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: T.ink,
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: T.body,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  heroCta: {
    alignSelf: 'stretch',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  heroCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  heroCtaText: { color: T.white, fontSize: 15, fontWeight: '700' },

  // Section title
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: T.ink,
    marginTop: 22,
    marginBottom: 12,
  },

  // Quick grid
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickTile: {
    width: (screenWidth - S.screenPadding * 2 - 10) / 2,
    backgroundColor: T.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  quickTileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickTileLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: T.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  quickTileTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: T.ink,
    lineHeight: 17,
  },

  // Recent chats header
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 4,
  },
  recentCount: { fontSize: 12, color: T.muted, fontWeight: '600' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: T.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: T.border,
    marginTop: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14, color: T.ink, paddingVertical: 4 },

  // Empty search
  emptySearch: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptySearchTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: T.ink,
    marginTop: 6,
  },
  emptySearchText: { fontSize: 12, color: T.body, textAlign: 'center' },
});

export default AIAssistantScreen;