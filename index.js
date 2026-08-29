require('dotenv').config();

const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const tlSigning = require('truelayer-signing');

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

// ---------------------------------------------------------------------------
// OBP PAYMENT (account-to-account transfer inside the sandbox)
// ---------------------------------------------------------------------------
app.post('/obp/payment', async (req, res) => {
  try {
    const {
      username,
      password,
      fromBankId,
      fromAccountId,
      toBankId,
      toAccountId,
      amount,
      currency,
      description,
    } = req.body;

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

    const requestUrl = `${OBP_HOST}/obp/v5.1.0/banks/${fromBankId}/accounts/${fromAccountId}/owner/transaction-request-types/SANDBOX_TAN/transaction-requests`;

    const paymentBody = {
      to: {
        bank_id: toBankId,
        account_id: toAccountId,
      },
      value: {
        currency: currency,
        amount: String(amount),
      },
      description: description || 'PiggyBank transfer',
    };

    const createResponse = await axios.post(requestUrl, paymentBody, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `DirectLogin token="${token}"`,
      },
    });

    let request = createResponse.data;
    const transactionRequestId = request.id;
    let challengeAnswered = false;

    const challenge =
      request.challenge || (request.challenges && request.challenges[0]);

    if (request.status !== 'COMPLETED' && challenge && challenge.id) {
      const challengeUrl = `${requestUrl}/${transactionRequestId}/challenge`;
      const challengeResponse = await axios.post(
        challengeUrl,
        { id: challenge.id, answer: '123' },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `DirectLogin token="${token}"`,
          },
        }
      );
      request = challengeResponse.data;
      challengeAnswered = true;
    }

    res.json({
      success: true,
      status: request.status,
      transactionRequestId: transactionRequestId,
      transactionIds: request.transaction_ids || [],
      challengeAnswered: challengeAnswered,
    });
  } catch (error) {
    console.log('OBP payment error:', error.response ? error.response.data : error.message);
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

    const accountList = accountsResponse.data.results;

    const detailedAccounts = await Promise.all(
      accountList.map(async (acc) => {
        try {
          const balanceResponse = await axios.get(
            `https://api.truelayer-sandbox.com/data/v1/accounts/${acc.account_id}/balance`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const bal = balanceResponse.data.results[0];
          return {
            account_id: acc.account_id,
            display_name: acc.display_name,
            provider: acc.provider,
            currency: bal ? bal.currency : acc.currency,
            balance: bal ? bal.current : '',
          };
        } catch (err) {
          return {
            account_id: acc.account_id,
            display_name: acc.display_name,
            provider: acc.provider,
            currency: acc.currency,
            balance: '',
          };
        }
      })
    );

    res.json({ token: token, accounts: { results: detailedAccounts } });
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

// ---------------------------------------------------------------------------
// TRUELAYER PAYMENT (v3 single payment to an external account, signed)
//
// Chain:
//   1. Get a payments-scoped access token (client_credentials).
//   2. Build a single-payment body: pay to a beneficiary's sort code + account
//      number. amount_in_minor is in pence, so we multiply pounds by 100.
//   3. Sign the request with the private key + kid using truelayer-signing.
//   4. POST to /v3/payments. TrueLayer returns a payment id and resource_token.
//   5. Build the Hosted Payment Page URL from those, and hand it back to the app
//      so the user can authorise with a (mock) bank.
//
// IMPORTANT: the body string we sign must be the exact same string we send,
// so we stringify once and reuse it.
// ---------------------------------------------------------------------------
app.post('/tl/payment', async (req, res) => {
  try {
    const { amount, beneficiaryName, sortCode, accountNumber, reference } = req.body;

    // Step 1: payments access token
    const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'client_credentials');
    tokenParams.append('client_id', process.env.TL_CLIENT_ID);
    tokenParams.append('client_secret', process.env.TL_CLIENT_SECRET);
    tokenParams.append('scope', 'payments');

    const tokenResponse = await axios.post(
      'https://auth.truelayer-sandbox.com/connect/token',
      tokenParams.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const accessToken = tokenResponse.data.access_token;

    // Step 2: build the payment body
    const amountInMinor = Math.round(parseFloat(amount) * 100);
    const returnUri = 'http://localhost:3000/callback';

    const paymentBody = {
      amount_in_minor: amountInMinor,
      currency: 'GBP',
      payment_method: {
        type: 'bank_transfer',
        provider_selection: { type: 'user_selected' },
        beneficiary: {
          type: 'external_account',
          account_holder_name: beneficiaryName,
          account_identifier: {
            type: 'sort_code_account_number',
            sort_code: sortCode,
            account_number: accountNumber,
          },
          reference: (reference || 'PiggyBank').substring(0, 18),
        },
      },
      user: {
        id: crypto.randomUUID(),
        name: 'PiggyBank Test User',
        email: 'test@piggybank.example',
      },
    };

    const bodyString = JSON.stringify(paymentBody);
    const idempotencyKey = crypto.randomUUID();

    // Step 3: sign the request
    const privateKeyPem = fs.readFileSync(
      path.join(__dirname, 'ec512-private-key.pem'),
      'utf8'
    );

    const signature = tlSigning.sign({
      kid: process.env.TL_KID,
      privateKeyPem: privateKeyPem,
      method: 'POST',
      path: '/v3/payments',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: bodyString,
    });

    // Step 4: create the payment (send the EXACT string we signed)
    const paymentResponse = await axios.post(
      'https://api.truelayer-sandbox.com/v3/payments',
      bodyString,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
          'Tl-Signature': signature,
        },
      }
    );

    const paymentId = paymentResponse.data.id;
    const resourceToken = paymentResponse.data.resource_token;

    // Step 5: build the Hosted Payment Page URL
    const hppUrl = `https://payment.truelayer-sandbox.com/payments#payment_id=${paymentId}&resource_token=${resourceToken}&return_uri=${returnUri}`;

    res.json({
      success: true,
      paymentId: paymentId,
      status: paymentResponse.data.status,
      hppUrl: hppUrl,
      returnUri: returnUri,
    });
  } catch (error) {
    console.log('TL payment error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: error.response ? error.response.data : error.message });
  }
});

app.get('/convert', async (req, res) => {
  try {
    const from = req.query.from;
    const to = req.query.to;
    const amount = parseFloat(req.query.amount);

    if (from === to) {
      return res.json({ converted: amount.toFixed(2), rate: 1 });
    }

    const rateResponse = await axios.get(
      `https://api.frankfurter.app/latest?from=${from}&to=${to}`
    );

    const rate = rateResponse.data.rates[to];
    const converted = (amount * rate).toFixed(2);

    res.json({ converted: converted, rate: rate });
  } catch (error) {
    console.log('Convert error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Could not convert currency' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});