require('dotenv').config();

const express = require('express');
const axios = require('axios');

const OBP_HOST = process.env.OBP_HOST;
const OBP_USERNAME = process.env.OBP_USERNAME;
const OBP_PASSWORD = process.env.OBP_PASSWORD;
const OBP_CONSUMER_KEY = process.env.OBP_CONSUMER_KEY;

const app = express();
app.use(express.json());
const PORT = 4000;

app.get('/', (req, res) => {
  res.send('PiggyBank backend is running');
});

app.post('/obp/accounts', async (req, res) => {
  try {
    const { username, password } = req.body;

    const loginResponse = await axios.post(
      `${OBP_HOST}/my/logins/direct`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `DirectLogin username="${username}", password="${password}", consumer_key="${OBP_CONSUMER_KEY}"`,
        },
      }
    );
    const token = loginResponse.data.token;

    const accountsResponse = await axios.get(
      `${OBP_HOST}/obp/v5.1.0/my/accounts`,
      { headers: { Authorization: `DirectLogin token="${token}"` } }
    );
    const accountList = accountsResponse.data.accounts;

    const detailedAccounts = await Promise.all(
      accountList.map(async (acc) => {
        try {
          const detailResponse = await axios.get(
            `${OBP_HOST}/obp/v5.1.0/my/banks/${acc.bank_id}/accounts/${acc.id}/account`,
            { headers: { Authorization: `DirectLogin token="${token}"` } }
          );
          const detail = detailResponse.data;
          return {
            id: acc.id,
            name: acc.label || 'Account',
            bank: acc.bank_id,
            currency: detail.balance ? detail.balance.currency : 'N/A',
            balance: detail.balance ? detail.balance.amount : 'N/A',
          };
        } catch (err) {
          return {
            id: acc.id,
            name: acc.label || 'Account',
            bank: acc.bank_id,
            currency: 'N/A',
            balance: 'N/A',
          };
        }
      })
    );

    res.json(detailedAccounts);
  } catch (error) {
    console.log('OBP error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: error.response ? error.response.data : error.message });
  }
});

app.get('/obp/test-login', async (req, res) => {
  try {
    const loginResponse = await axios.post(
      `${OBP_HOST}/my/logins/direct`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `DirectLogin username="${OBP_USERNAME}", password="${OBP_PASSWORD}", consumer_key="${OBP_CONSUMER_KEY}"`,
        },
      }
    );
    res.json({ success: true, token: loginResponse.data });
  } catch (error) {
    res.json({
      success: false,
      status: error.response ? error.response.status : 'no response',
      obpSaid: error.response ? error.response.data : error.message,
    });
  }
});

app.post('/obp/transactions', async (req, res) => {
  try {
    const { username, password, bankId, accountId } = req.body;

    const loginResponse = await axios.post(
      `${OBP_HOST}/my/logins/direct`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `DirectLogin username="${username}", password="${password}", consumer_key="${OBP_CONSUMER_KEY}"`,
        },
      }
    );
    const token = loginResponse.data.token;

    const txnResponse = await axios.get(
      `${OBP_HOST}/obp/v5.1.0/my/banks/${bankId}/accounts/${accountId}/transactions`,
      { headers: { Authorization: `DirectLogin token="${token}"` } }
    );

    const transactions = txnResponse.data.transactions.map((t) => ({
      id: t.id,
      description: t.details && t.details.description ? t.details.description : 'No description',
      amount: t.details && t.details.value ? t.details.value.amount : 'N/A',
      currency: t.details && t.details.value ? t.details.value.currency : '',
      date: t.details && t.details.completed ? t.details.completed : '',
    }));

    res.json(transactions);
  } catch (error) {
    console.log('OBP transactions error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: error.response ? error.response.data : error.message });
  }
});

app.get('/tl/flow', async (req, res) => {
  try {
    const code = req.query.code;

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', process.env.TL_CLIENT_ID);
    params.append('client_secret', process.env.TL_CLIENT_SECRET);
    params.append('redirect_uri', process.env.TL_REDIRECT_URI);
    params.append('code', code);

    const tokenResponse = await axios.post(
      'https://auth.truelayer-sandbox.com/connect/token',
      params.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const token = tokenResponse.data.access_token;

    const accountsResponse = await axios.get(
      'https://api.truelayer-sandbox.com/data/v1/accounts',
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.json({ token: token, accounts: accountsResponse.data });
  } catch (error) {
    res.json({
      success: false,
      error: error.response ? error.response.data : error.message,
    });
  }
});

app.get('/tl/transactions', async (req, res) => {
  try {
    const token = req.query.token;
    const accountId = req.query.accountId;

    const txnResponse = await axios.get(
      `https://api.truelayer-sandbox.com/data/v1/accounts/${accountId}/transactions`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const transactions = txnResponse.data.results.map((t) => ({
      id: t.transaction_id,
      description: t.description || 'No description',
      amount: t.amount,
      currency: t.currency,
      date: t.timestamp,
    }));

    res.json(transactions);
  } catch (error) {
    console.log('TL transactions error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: error.response ? error.response.data : error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});