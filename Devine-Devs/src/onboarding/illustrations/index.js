// Onboarding illustrations, rebuilt 1:1 from the Claude Design bundle's inline
// SVGs using react-native-svg. Each accepts a `size` prop (rendered width/height
// in px); the internal 200x220 viewBox keeps proportions identical to the bundle.

import React from 'react';
import Svg, {
  Ellipse,
  Path,
  G,
  Rect,
  Circle,
  Text as SvgText,
} from 'react-native-svg';
import { ONB_COLORS } from '../onboardingTokens';

const VB_W = 200;
const VB_H = 220;

// Shared base: pale green disc + soft ground shadow.
function Base({ shadowRx = 70 }) {
  return (
    <>
      <Ellipse cx={100} cy={118} rx={92} ry={92} fill={ONB_COLORS.illustrationBg} />
      <Ellipse cx={100} cy={200} rx={shadowRx} ry={9} fill={ONB_COLORS.primary} opacity={0.06} />
    </>
  );
}

function Frame({ size, children }) {
  const height = (size * VB_H) / VB_W;
  return (
    <Svg width={size} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
      {children}
    </Svg>
  );
}

// 01 — Welcome: recycle ring + droplet + leaf
export function WelcomeIllustration({ size = 200 }) {
  return (
    <Frame size={size}>
      <Base shadowRx={70} />
      <G fill="none" stroke={ONB_COLORS.accent} strokeWidth={9} strokeLinecap="round">
        <Path d="M100 44 a64 64 0 0 1 55.4 32" />
        <Path d="M155.4 158 a64 64 0 0 1 -110.8 0" />
        <Path d="M44.6 76 a64 64 0 0 1 27.7 -27.2" />
      </G>
      <G fill={ONB_COLORS.accent}>
        <Path d="M150 70 l14 8 -14 8 z" />
        <Path d="M44 168 l-2 -16 14 8 z" />
        <Path d="M60 38 l4 16 -16 -4 z" />
      </G>
      <Path
        d="M100 78 C100 78 138 124 138 148 a38 38 0 1 1 -76 0 C62 124 100 78 100 78 Z"
        fill={ONB_COLORS.primary}
      />
      <Path
        d="M86 150 a14 14 0 0 0 14 14"
        fill="none"
        stroke={ONB_COLORS.white}
        strokeWidth={5}
        strokeLinecap="round"
        opacity={0.85}
      />
      <Path
        d="M100 120 c-14 -6 -18 -22 -10 -34 c10 8 16 22 10 34 z"
        fill={ONB_COLORS.accentSoft}
      />
    </Frame>
  );
}

// 02 — Monitor: IoT tank with fill level + signal waves
export function MonitorIllustration({ size = 200 }) {
  return (
    <Frame size={size}>
      <Base shadowRx={68} />
      <Rect x={64} y={58} width={72} height={120} rx={18} fill={ONB_COLORS.white} stroke={ONB_COLORS.primary} strokeWidth={5} />
      <Path d="M69 124 h62 v36 a14 14 0 0 1 -14 14 H83 a14 14 0 0 1 -14 -14 Z" fill={ONB_COLORS.primary} />
      <Path d="M69 124 q15 -8 31 0 t31 0 v6 q-15 8 -31 0 t-31 0 Z" fill={ONB_COLORS.primaryMid} />
      <Rect x={80} y={48} width={40} height={16} rx={6} fill={ONB_COLORS.primary} />
      <G fill="none" stroke={ONB_COLORS.accent} strokeWidth={5} strokeLinecap="round">
        <Path d="M146 86 a26 26 0 0 1 0 36" />
        <Path d="M156 76 a40 40 0 0 1 0 56" />
      </G>
      <Circle cx={138} cy={104} r={5} fill={ONB_COLORS.primary} />
      <Circle cx={100} cy={104} r={5} fill={ONB_COLORS.white} />
      <SvgText x={100} y={200} textAnchor="middle" fontSize={13} fontWeight="700" fill={ONB_COLORS.primary}>
        68% · Grade A
      </SvgText>
    </Frame>
  );
}

// 03 — Routes: dashed route, pins, delivery truck
export function RoutesIllustration({ size = 200 }) {
  return (
    <Frame size={size}>
      <Base shadowRx={68} />
      <Path
        d="M48 158 C70 150 70 110 96 104 S150 96 150 64"
        fill="none"
        stroke={ONB_COLORS.accent}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray="2 11"
      />
      <Circle cx={48} cy={158} r={9} fill={ONB_COLORS.white} stroke={ONB_COLORS.primary} strokeWidth={5} />
      <Path
        d="M150 40 c-13 0 -23 10 -23 23 c0 17 23 33 23 33 s23 -16 23 -33 c0 -13 -10 -23 -23 -23 z"
        fill={ONB_COLORS.primary}
      />
      <Circle cx={150} cy={63} r={8} fill={ONB_COLORS.white} />
      <G translateX={70} translateY={116}>
        <Rect x={0} y={0} width={34} height={22} rx={4} fill={ONB_COLORS.primary} />
        <Path d="M34 6 h12 l8 9 v7 h-20 z" fill={ONB_COLORS.primaryMid} />
        <Rect x={37} y={8} width={11} height={7} rx={1.5} fill={ONB_COLORS.mint} />
        <Circle cx={10} cy={24} r={6} fill={ONB_COLORS.title} />
        <Circle cx={10} cy={24} r={2.5} fill={ONB_COLORS.white} />
        <Circle cx={44} cy={24} r={6} fill={ONB_COLORS.title} />
        <Circle cx={44} cy={24} r={2.5} fill={ONB_COLORS.white} />
      </G>
    </Frame>
  );
}

// 04 — Payout: dashboard card with bar chart + coin
export function PayoutIllustration({ size = 200 }) {
  return (
    <Frame size={size}>
      <Base shadowRx={68} />
      <Rect x={44} y={64} width={112} height={84} rx={12} fill={ONB_COLORS.white} stroke={ONB_COLORS.primary} strokeWidth={4} />
      <Rect x={56} y={76} width={36} height={6} rx={3} fill={ONB_COLORS.mint} />
      <G fill={ONB_COLORS.primary}>
        <Rect x={58} y={126} width={11} height={14} rx={2} />
        <Rect x={76} y={116} width={11} height={24} rx={2} />
        <Rect x={94} y={104} width={11} height={36} rx={2} />
      </G>
      <Rect x={112} y={120} width={32} height={20} rx={6} fill={ONB_COLORS.primaryMid} />
      <Circle cx={146} cy={80} r={26} fill={ONB_COLORS.primary} />
      <Circle cx={146} cy={80} r={26} fill="none" stroke={ONB_COLORS.accentSoft} strokeWidth={3} strokeDasharray="3 6" />
      <Path
        d="M146 68 v24 M140 73 a6 6 0 0 1 12 0 a6 6 0 0 1 -12 6 a6 6 0 0 0 12 -6"
        fill="none"
        stroke={ONB_COLORS.white}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </Frame>
  );
}
