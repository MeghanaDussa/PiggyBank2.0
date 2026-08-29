import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';

const DISPLAY_CURRENCY = 'GBP';

function DashboardScreen({ route, navigation }) {
  const { provider, username, password } = route.params;
  const [accounts, setAccounts] = useState([]);
  const [status, setStatus] = useState('Loading accounts...');
  const [tlToken, setTlToken] = useState('');
  const [total, setTotal] = useState(null);

  const convert = async (amount, from) => {
    try {
      const res = await axios.get(
        `http://10.0.2.2:4000/convert?from=${from}&to=${DISPLAY_CURRENCY}&amount=${amount}`
      );
      return parseFloat(res.data.converted);
    } catch (e) {
      return null;
    }
  };

  const addConversions = async (rawAccounts) => {
    let runningTotal = 0;
    const withConverted = await Promise.all(
      rawAccounts.map(async (acc) => {
        const numericBalance = parseFloat(acc.balance);
        let convertedBalance = null;
        if (!isNaN(numericBalance)) {
          convertedBalance = await convert(numericBalance, acc.currency);
          if (convertedBalance !== null) runningTotal += convertedBalance;
        }
        return { ...acc, convertedBalance };
      })
    );
    setAccounts(withConverted);
    setTotal(runningTotal.toFixed(2));
    setStatus(withConverted.length === 0 ? 'No accounts found' : '');
  };

  useEffect(() => {
    if (route.params.provider === 'truelayer' && route.params.code) {
      axios
        .get(`http://10.0.2.2:4000/tl/flow?code=${route.params.code}`)
        .then(async (response) => {
          setTlToken(response.data.token);
          const mapped = response.data.accounts.results.map((acc) => ({
            id: acc.account_id,
            name: acc.display_name,
            bank: acc.provider.display_name,
            currency: acc.currency,
            balance: acc.balance,
          }));
          addConversions(mapped);
        })
        .catch(() => setStatus('Could not load TrueLayer accounts'));
    } else {
      axios
        .post('http://10.0.2.2:4000/obp/accounts', {
          username: route.params.username,
          password: route.params.password,
        })
        .then((response) => {
          addConversions(response.data);
        })
        .catch(() => setStatus('Could not load accounts'));
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Accounts</Text>
      <Text style={styles.subtitle}>Connected via: {provider}</Text>

      {total !== null && (
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total (in {DISPLAY_CURRENCY})</Text>
          <Text style={styles.totalAmount}>
            {total} {DISPLAY_CURRENCY}
          </Text>
        </View>
      )}

      {provider === 'obp' && accounts.length > 0 && (
        <TouchableOpacity
          style={styles.payButton}
          onPress={() =>
            navigation.navigate('Payment', {
              accounts: accounts,
              username: username,
              password: password,
            })
          }
        >
          <Text style={styles.payButtonText}>Make a payment</Text>
        </TouchableOpacity>
      )}

      {provider === 'truelayer' && (
        <TouchableOpacity
          style={styles.payButton}
          onPress={() => navigation.navigate('TrueLayerPayment')}
        >
          <Text style={styles.payButtonText}>Make a payment</Text>
        </TouchableOpacity>
      )}

      {status !== '' && <Text style={styles.status}>{status}</Text>}

      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('Transactions', {
                provider: provider,
                accountName: item.name,
                bankId: item.bank,
                accountId: item.id,
                username: username,
                password: password,
                token: tlToken,
              })
            }
          >
            <Text style={styles.accountName}>{item.name}</Text>
            <Text style={styles.bankName}>{item.bank}</Text>
            <Text style={styles.balance}>
              {item.balance} {item.currency}
            </Text>
            {item.convertedBalance !== null && item.convertedBalance !== undefined && (
              <Text style={styles.converted}>
                ≈ {item.convertedBalance} {DISPLAY_CURRENCY}
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2e7d32' },
  subtitle: { fontSize: 14, color: '#666666', marginTop: 4, marginBottom: 16 },
  totalCard: {
    backgroundColor: '#2e7d32',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  totalLabel: { fontSize: 14, color: '#d7ecd9' },
  totalAmount: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', marginTop: 4 },
  payButton: {
    borderWidth: 2,
    borderColor: '#2e7d32',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  payButtonText: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32' },
  status: { fontSize: 14, color: '#666666', marginBottom: 12 },
  card: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  accountName: { fontSize: 16, fontWeight: 'bold', color: '#333333' },
  bankName: { fontSize: 13, color: '#888888', marginTop: 2 },
  balance: { fontSize: 20, fontWeight: 'bold', color: '#2e7d32', marginTop: 8 },
  converted: { fontSize: 14, color: '#666666', marginTop: 4 },
});

export default DashboardScreen;