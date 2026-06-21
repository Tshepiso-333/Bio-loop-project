// Swipeable onboarding container.
// - Native left/right paging via a horizontal FlatList (pagingEnabled).
// - Segmented progress, "Skip" + "Next", switching to "Get started" on the last slide.
// - Responsive across phone sizes via useWindowDimensions (re-measures on rotate).
// - Calls onDone() when the user skips or finishes; the gate persists the flag.

import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { SLIDES } from '../../src/onboarding/slides';
import OnboardingSlide from '../../src/onboarding/components/OnboardingSlide';
import {
  ONB_COLORS,
  ONB_TYPE,
  ONB_SPACING,
  ONB_BUTTON_SHADOW,
} from '../../src/onboarding/onboardingTokens';

function ArrowIcon() {
  return (
    <Svg width={17} height={14} viewBox="0 0 17 14">
      <Path
        d="M1 7h13M9 2l6 5-6 5"
        fill="none"
        stroke={ONB_COLORS.white}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function OnboardingScreen({ onDone }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);

  const total = SLIDES.length;
  const isLast = index === total - 1;

  const onViewRef = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setIndex(viewableItems[0].index);
    }
  });
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const goNext = useCallback(() => {
    if (isLast) {
      onDone?.();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  }, [index, isLast, onDone]);

  const renderItem = useCallback(
    ({ item, index: i }) => (
      <OnboardingSlide
        slide={item}
        index={i}
        total={total}
        width={width}
        topInset={insets.top}
      />
    ),
    [total, width, insets.top]
  );

  return (
    <LinearGradient
      colors={ONB_COLORS.bgGradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.root}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <FlatList
        ref={listRef}
        style={styles.list}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
      />

      {/* Footer: Skip + Next / Get started */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + ONB_SPACING.footerInset,
            maxWidth: ONB_SPACING.contentMaxWidth,
          },
        ]}
      >
        {isLast ? (
          <Pressable
            onPress={goNext}
            style={({ pressed }) => [
              styles.primaryButton,
              styles.primaryButtonFull,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Get started"
          >
            <Text style={styles.buttonText}>Get started</Text>
            <ArrowIcon />
          </Pressable>
        ) : (
          <View style={styles.footerRow}>
            <Pressable
              onPress={() => onDone?.()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Skip onboarding"
            >
              <Text style={styles.skip}>Skip</Text>
            </Pressable>

            <Pressable
              onPress={goNext}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Next slide"
            >
              <Text style={styles.buttonText}>Next</Text>
              <ArrowIcon />
            </Pressable>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  // In normal flow (not absolute) so it occupies its own region below the
  // slide content — the slide can never overlap it. paddingBottom carries the
  // safe-area inset so text stays clear of the bottom edge.
  footer: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: ONB_SPACING.screenPadding,
    paddingTop: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skip: {
    fontFamily: ONB_TYPE.skip.weight,
    fontSize: ONB_TYPE.skip.size,
    color: ONB_COLORS.skip,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ONB_COLORS.primary,
    paddingVertical: ONB_SPACING.buttonPaddingV,
    paddingHorizontal: ONB_SPACING.buttonPaddingH,
    borderRadius: ONB_SPACING.buttonRadius,
    ...ONB_BUTTON_SHADOW,
  },
  primaryButtonFull: {
    alignSelf: 'stretch',
    paddingVertical: ONB_SPACING.buttonPaddingV + 1,
  },
  pressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontFamily: ONB_TYPE.button.weight,
    fontSize: ONB_TYPE.button.size,
    color: ONB_COLORS.white,
  },
});
