// Segmented progress indicator from the bundle: the active step is a wide
// filled green pill; the rest are thin equal-width tracks.

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ONB_COLORS } from '../onboardingTokens';

export default function ProgressBars({ count, activeIndex }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => {
        const active = i === activeIndex;
        return (
          <View
            key={i}
            style={[
              styles.segment,
              active ? styles.segmentActive : styles.segmentInactive,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  segment: {
    height: 4,
    borderRadius: 2,
  },
  segmentActive: {
    width: 34,
    backgroundColor: ONB_COLORS.primary,
  },
  segmentInactive: {
    flex: 1,
    backgroundColor: ONB_COLORS.progressTrack,
  },
});
