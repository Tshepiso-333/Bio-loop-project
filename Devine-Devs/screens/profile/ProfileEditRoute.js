import React from 'react';
import ProfileEditScreen from '../../src/components/profile/ProfileEditScreen';

export default function ProfileEditRoute({ navigation }) {
  return (
    <ProfileEditScreen
      mode="edit"
      onDone={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }}
    />
  );
}
