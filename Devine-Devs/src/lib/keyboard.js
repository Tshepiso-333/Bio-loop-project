import { Keyboard, Platform } from 'react-native';

// "Tap outside to close the keyboard" for screens that wrap a form in
// TouchableWithoutFeedback. On web this must be a no-op: react-native-web's
// Keyboard.dismiss() blurs the focused element, and because the wrapper
// receives the very tap that focused an input, every field was blurred the
// instant it got focus — nothing could be typed on the login screen.
// Browsers already close the on-screen keyboard on an outside tap.
export const dismissKeyboard = Platform.OS === 'web' ? undefined : Keyboard.dismiss;
