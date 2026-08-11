import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

function LoginScreen({ navigation }) {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const providers = ['obp', 'truelayer', 'yapily'];
  const labels = { obp: 'OBP Sandbox', truelayer: 'TrueLayer', yapily: 'Yapily' };

  const canContinue =
    selectedProvider === 'obp'
      ? username !== '' && password !== ''
      : selectedProvider !== null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PiggyBank</Text>
      <Text style={styles.subtitle}>Choose how to connect</Text>

      {providers.map((p) => (
        <TouchableOpacity
          key={p}
          style={[
            styles.providerButton,
            selectedProvider === p && styles.providerButtonSelected,
          ]}
          onPress={() => setSelectedProvider(p)}
        >
          <Text style={styles.providerText}>{labels[p]}</Text>
        </TouchableOpacity>
      ))}

      {selectedProvider === 'obp' && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry={true}
            value={password}
            onChangeText={setPassword}
          />
        </View>
      )}

      <TouchableOpacity
        style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
        onPress={() => {
  if (selectedProvider === 'truelayer') {
    navigation.navigate('TrueLayerAuth');
  } else {
    navigation.navigate('Dashboard', {
      provider: selectedProvider,
      username: username,
      password: password,
    });
  }
}}
        disabled={!canContinue}
      >
        <Text style={styles.continueText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff', padding: 24 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#2e7d32' },
  subtitle: { fontSize: 16, color: '#666666', marginTop: 8, marginBottom: 32 },
  providerButton: { width: '100%', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#cccccc', marginBottom: 12, alignItems: 'center' },
  providerButtonSelected: { borderColor: '#2e7d32', borderWidth: 2, backgroundColor: '#e8f5e9' },
  providerText: { fontSize: 16, color: '#333333' },
  form: { width: '100%', marginBottom: 12 },
  input: { width: '100%', borderWidth: 1, borderColor: '#cccccc', borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 16 },
  continueButton: { width: '100%', padding: 16, borderRadius: 8, backgroundColor: '#2e7d32', alignItems: 'center', marginTop: 12 },
  continueButtonDisabled: { backgroundColor: '#cccccc' },
  continueText: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
});

export default LoginScreen;