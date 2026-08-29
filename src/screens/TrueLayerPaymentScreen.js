import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';

function TrueLayerPaymentScreen() {
  // form fields (prefilled with TrueLayer's sandbox test beneficiary values)
  const [amount, setAmount] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('Test Merchant');
  const [sortCode, setSortCode] = useState('123456');
  const [accountNumber, setAccountNumber] = useState('12345678');
  const [reference, setReference] = useState('PiggyBank');

  const [loading, setLoading] = useState(false);
  const [hppUrl, setHppUrl] = useState('');
  const [returnUri, setReturnUri] = useState('');
  const [status, setStatus] = useState('');
  const [success, setSuccess] = useState(false);

  const amountValid = !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;
  const canSend =
    amountValid && beneficiaryName && sortCode && accountNumber && !loading;

  const createPayment = () => {
    setLoading(true);
    setStatus('');
    setSuccess(false);
    axios
      .post('http://10.0.2.2:4000/tl/payment', {
        amount: amount,
        beneficiaryName: beneficiaryName,
        sortCode: sortCode,
        accountNumber: accountNumber,
        reference: reference,
      })
      .then((response) => {
        setLoading(false);
        if (response.data.success && response.data.hppUrl) {
          setReturnUri(response.data.returnUri);
          setHppUrl(response.data.hppUrl); // this switches the screen to WebView mode
        } else {
          setStatus('Could not create the payment.');
        }
      })
      .catch((error) => {
        setLoading(false);
        const detail = error.response
          ? JSON.stringify(error.response.data)
          : error.message;
        setStatus('Payment failed. ' + detail);
      });
  };

  // Watch the WebView. When the hosted page redirects back to our return_uri,
  // the authorisation flow is over.
  const onNavChange = (navState) => {
    const url = navState.url || '';
    if (returnUri && url.indexOf('localhost:3000/callback') !== -1) {
      setHppUrl(''); // leave WebView mode, back to the form/result view
      if (url.indexOf('tl_hpp_abandoned') !== -1) {
        setSuccess(false);
        setStatus('Payment was cancelled on the bank screen.');
      } else {
        setSuccess(true);
        setStatus(
          'Payment authorised. You can confirm it in the TrueLayer Console under Payments.'
        );
      }
    }
  };

  // WebView mode: show the hosted payment page
  if (hppUrl) {
    return (
      <WebView
        source={{ uri: hppUrl }}
        onNavigationStateChange={onNavChange}
        startInLoadingState={true}
      />
    );
  }

  // Form mode
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>TrueLayer Payment</Text>
      <Text style={styles.subtitle}>Pay a beneficiary via open banking</Text>

      <Text style={styles.label}>Amount (GBP)</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.label}>Beneficiary name</Text>
      <TextInput
        style={styles.input}
        value={beneficiaryName}
        onChangeText={setBeneficiaryName}
      />

      <Text style={styles.label}>Sort code</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={sortCode}
        onChangeText={setSortCode}
      />

      <Text style={styles.label}>Account number</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={accountNumber}
        onChangeText={setAccountNumber}
      />

      <Text style={styles.label}>Reference</Text>
      <TextInput
        style={styles.input}
        value={reference}
        onChangeText={setReference}
      />

      <TouchableOpacity
        style={[styles.button, !canSend && styles.buttonDisabled]}
        onPress={createPayment}
        disabled={!canSend}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Pay with TrueLayer</Text>
        )}
      </TouchableOpacity>

      {status !== '' && (
        <Text
          style={[
            styles.status,
            success ? styles.statusSuccess : styles.statusError,
          ]}
        >
          {status}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 24, paddingTop: 40, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2e7d32' },
  subtitle: { fontSize: 14, color: '#666666', marginTop: 4, marginBottom: 8 },
  label: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 18,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
    marginTop: 28,
  },
  buttonDisabled: { backgroundColor: '#cccccc' },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  status: { fontSize: 14, marginTop: 20, textAlign: 'center' },
  statusSuccess: { color: '#2e7d32' },
  statusError: { color: '#c62828' },
});

export default TrueLayerPaymentScreen;