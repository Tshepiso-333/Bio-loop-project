// Reusable single-slide layout: progress bars, illustration, title, body.
// Purely presentational — paging and footer live in OnboardingScreen.
// Sizing is driven by `width` (the page width) so the slide is responsive.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ProgressBars from './ProgressBars';
import { ONB_COLORS, ONB_TYPE, ONB_SPACING } from '../onboardingTokens';

export default function OnboardingSlide({
  slide,
  index,
  total,
  width,
  topInset,
}) {
  // Derived responsive scale. The bundle is designed at a ~288px-wide frame;
  // we scale gently with the real page width and clamp so phones and tablets
  // both look right.
  const contentWidth = Math.min(width, ONB_SPACING.contentMaxWidth);
  const scale = Math.max(0.92, Math.min(contentWidth / 288, 1.4));
  const illustrationSize = Math.min(contentWidth * 0.62, 260);

  const titleSize = Math.round(ONB_TYPE.title.size * scale);
  const bodySize = Math.round(ONB_TYPE.body.size * scale);

  const { Illustration } = slide;

  return (
    <View style={[styles.page, { width }]}>
      <View style={[styles.inner, { maxWidth: ONB_SPACING.contentMaxWidth }]}>
        <View style={{ paddingTop: topInset + 12 }}>
          <ProgressBars count={total} activeIndex={index} />
        </View>

        <View style={styles.illustrationWrap}>
          <Illustration size={illustrationSize} />
        </View>

        <View style={styles.textWrap}>
          <Text
            style={[
              styles.title,
              {
                fontSize: titleSize,
                lineHeight: titleSize * 1.22,
              },
            ]}
          >
            {slide.title}
          </Text>
          <Text
            style={[
              styles.body,
              {
                fontSize: bodySize,
                lineHeight: bodySize * 1.55,
              },
            ]}
          >
            {slide.body}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: ONB_SPACING.screenPadding,
  },
  inner: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  illustrationWrap: {
    flex: 1,
    minHeight: 0, // allow shrinking on short screens so text is never pushed off
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  textWrap: {
    // Own region directly above the (in-flow) footer; spacing keeps it clear.
    paddingBottom: 12,
  },
  title: {
    fontFamily: ONB_TYPE.title.weight,
    color: ONB_COLORS.title,
    letterSpacing: ONB_TYPE.title.letterSpacing,
    marginBottom: 8,
  },
  body: {
    fontFamily: ONB_TYPE.body.weight,
    color: ONB_COLORS.body,
  },
});
