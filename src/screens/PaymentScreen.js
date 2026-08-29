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
import axios from 'axios';

function PaymentScreen({ route }) {
  const { accounts, username, password } = route.params;

  const [fromAccount, setFromAccount] = useState(null);
  const [toAccount, setToAccount] = useState(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const [success, setSuccess] = useState(false);

  const numericAmount = parseFloat(amount);
  const amountValid = !isNaN(numericAmount) && numericAmount > 0;
  const differentAccounts =
    fromAccount && toAccount && fromAccount.id !== toAccount.id;
  const canSend =
    fromAccount && toAccount && amountValid && differentAccounts && !sending;

  const sendPayment = () => {
    setSending(true);
    setStatus('');
    axios
      .post('http://10.0.2.2:4000/obp/payment', {
        username: username,
        password: password,
        fromBankId: fromAccount.bank,
        fromAccountId: fromAccount.id,
        toBankId: toAccount.bank,
        toAccountId: toAccount.id,
        amount: amount,
        currency: fromAccount.currency,
        description: description || 'PiggyBank transfer',
      })
      .then((response) => {
        const data = response.data;
        setSending(false);
        if (data.success && data.status === 'COMPLETED') {
          setSuccess(true);
          const txnId =
            data.transactionIds && data.transactionIds.length > 0
              ? data.transactionIds[0]
              : 'n/a';
          setStatus('Payment completed. Transaction ID: ' + txnId);
        } else {
          setSuccess(false);
          setStatus('Payment status: ' + (data.status || 'unknown'));
        }
      })
      .catch((error) => {
        setSending(false);
        setSuccess(false);
        const detail = error.response
          ? JSON.stringify(error.response.data)
          : error.message;
        setStatus('Payment failed. ' + detail);
      });
  };

  const renderAccountOption = (item, selectedAccount, onSelect) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.accountOption,
        selectedAccount &&
          selectedAccount.id === item.id &&
          styles.accountOptionSelected,
      ]}
      onPress={() => onSelect(item)}
    >
      <Text style={styles.accountOptionName}>{item.name}</Text>
      <Text style={styles.accountOptionBalance}>
        {item.balance} {item.currency}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Make a Payment</Text>
      <Text style={styles.subtitle}>Transfer between your accounts</Text>

      <Text style={styles.sectionLabel}>From</Text>
      {accounts.map((item) =>
        renderAccountOption(item, fromAccount, setFromAccount)
      )}

      <Text style={styles.sectionLabel}>To</Text>
      {accounts.map((item) =>
        renderAccountOption(item, toAccount, setToAccount)
      )}

      <Text style={styles.sectionLabel}>
        Amount{fromAccount ? ' (' + fromAccount.currency + ')' : ''}
      </Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.sectionLabel}>Description (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="What's this for?"
        value={description}
        onChangeText={setDescription}
      />

      {fromAccount && toAccount && !differentAccounts && (
        <Text style={styles.warning}>
          Source and destination must be different accounts.
        </Text>
      )}

      <TouchableOpacity
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        onPress={sendPayment}
        disabled={!canSend}
      >
        {sending ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.sendText}>Send Payment</Text>
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
  sectionLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 20,
    marginBottom: 8,
  },
  accountOption: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  accountOptionSelected: {
    borderColor: '#2e7d32',
    borderWidth: 2,
    backgroundColor: '#e8f5e9',
  },
  accountOptionName: { fontSize: 16, fontWeight: 'bold', color: '#333333' },
  accountOptionBalance: { fontSize: 14, color: '#2e7d32', marginTop: 4 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
  },
  warning: { color: '#c62828', fontSize: 14, marginTop: 16 },
  sendButton: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
    marginTop: 28,
  },
  sendButtonDisabled: { backgroundColor: '#cccccc' },
  sendText: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  status: { fontSize: 14, marginTop: 20, textAlign: 'center' },
  statusSuccess: { color: '#2e7d32' },
  statusError: { color: '#c62828' },
});

export default PaymentScreen;