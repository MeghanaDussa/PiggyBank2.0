import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';

function DashboardScreen({ route, navigation }) {
  const { provider, username, password } = route.params;
  const [accounts, setAccounts] = useState([]);
  const [status, setStatus] = useState('Loading accounts...');
  const [tlToken, setTlToken] = useState('');

  useEffect(() => {
    if (route.params.provider === 'truelayer' && route.params.code) {
      // TrueLayer: exchange the code and fetch accounts
      axios
        .get(`http://10.0.2.2:4000/tl/flow?code=${route.params.code}`)
        .then((response) => {
          setTlToken(response.data.token);
          const mapped = response.data.accounts.results.map((acc) => ({
            id: acc.account_id,
            name: acc.display_name,
            bank: acc.provider.display_name,
            currency: acc.currency,
            balance: '',
          }));
          setAccounts(mapped);
          setStatus(mapped.length === 0 ? 'No accounts found' : '');
        })
        .catch(() => setStatus('Could not load TrueLayer accounts'));
    } else {
      // OBP: typed login
      axios
        .post('http://10.0.2.2:4000/obp/accounts', {
          username: route.params.username,
          password: route.params.password,
        })
        .then((response) => {
          setAccounts(response.data);
          setStatus(response.data.length === 0 ? 'No accounts found' : '');
        })
        .catch(() => setStatus('Could not load accounts'));
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Accounts</Text>
      <Text style={styles.subtitle}>Connected via: {provider}</Text>

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
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2e7d32' },
  subtitle: { fontSize: 14, color: '#666666', marginTop: 4, marginBottom: 20 },
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
});

export default DashboardScreen;