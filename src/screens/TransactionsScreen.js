import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';

function TransactionsScreen({ route }) {
  const { accountName } = route.params;
  const [transactions, setTransactions] = useState([]);
  const [status, setStatus] = useState('Loading transactions...');

  useEffect(() => {
    if (route.params.provider === 'truelayer') {
      // TrueLayer: fetch transactions with the token
      axios
        .get(`http://10.0.2.2:4000/tl/transactions?token=${route.params.token}&accountId=${route.params.accountId}`)
        .then((response) => {
          setTransactions(response.data);
          setStatus(response.data.length === 0 ? 'No transactions found' : '');
        })
        .catch(() => setStatus('Could not load transactions'));
    } else {
      // OBP: fetch transactions with username/password
      axios
        .post('http://10.0.2.2:4000/obp/transactions', {
          username: route.params.username,
          password: route.params.password,
          bankId: route.params.bankId,
          accountId: route.params.accountId,
        })
        .then((response) => {
          setTransactions(response.data);
          setStatus(response.data.length === 0 ? 'No transactions found' : '');
        })
        .catch(() => setStatus('Could not load transactions'));
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transactions</Text>
      <Text style={styles.subtitle}>{accountName}</Text>

      {status !== '' && <Text style={styles.status}>{status}</Text>}

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.date}>{item.date ? item.date.substring(0, 10) : ''}</Text>
            <Text
              style={[
                styles.amount,
                Number(item.amount) < 0 && styles.amountDebit,
              ]}
            >
              {item.amount} {item.currency}
            </Text>
          </View>
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
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  description: { fontSize: 15, fontWeight: '600', color: '#333333' },
  date: { fontSize: 12, color: '#999999', marginTop: 2 },
  amount: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32', marginTop: 6 },
  amountDebit: { color: '#c62828' },
});

export default TransactionsScreen;