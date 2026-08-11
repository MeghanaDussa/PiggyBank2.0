import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const CLIENT_ID = 'sandbox-piggybank-957d8b';
const REDIRECT_URI = 'https://console.truelayer.com/redirect-page';
const AUTH_URL =
  `https://auth.truelayer-sandbox.com/?response_type=code` +
  `&client_id=${CLIENT_ID}` +
  `&redirect_uri=${REDIRECT_URI}` +
  `&scope=info%20accounts%20balance%20transactions` +
  `&providers=uk-cs-mock`;

function TrueLayerAuthScreen({ navigation }) {
  const handleNavigation = (navState) => {
    const { url } = navState;

    if (url.startsWith(REDIRECT_URI) && url.includes('code=')) {
      const code = url.split('code=')[1].split('&')[0];

      navigation.replace('Dashboard', {
        provider: 'truelayer',
        code: code,
      });
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: AUTH_URL }}
        onNavigationStateChange={handleNavigation}
        startInLoadingState={true}
        renderLoading={() => (
          <ActivityIndicator size="large" color="#2e7d32" style={styles.loader} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { position: 'absolute', top: '50%', left: '50%' },
});

export default TrueLayerAuthScreen;