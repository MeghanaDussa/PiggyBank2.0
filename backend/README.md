PiggyBank 2.0 (Backend)

The Node.js and Express backend for PiggyBank 2.0. It mediates all communication with the two Open Banking providers (OBP and TrueLayer) and the Frankfurter exchange-rate service, and it holds all secrets. The mobile client calls this backend; it never contacts the providers directly.

Prerequisites
Node.js (version 22.11.0 or later) and npm
Git Bash with OpenSSL (to generate the TrueLayer signing key)
Sandbox accounts and credentials for OBP and TrueLayer
Setup steps

Step 1: Install dependencies.
Clone this repository, then run:

npm install

Step 2: Generate the TrueLayer signing key.
In Git Bash, generate a P-521 elliptic-curve key pair:

openssl ecparam -genkey -name secp521r1 -noout -out ec512-private-key.pem
openssl ec -in ec512-private-key.pem -pubout -out ec512-public-key.pem

Place ec512-private-key.pem in the backend root. This file must not be committed to version control.

Step 3: Register the key with TrueLayer.
Upload ec512-public-key.pem to the TrueLayer Console to obtain the key ID (KID). You will need this in the next step.

Step 4: Create the environment file.
Create a file named .env in the backend root and add the following variables, supplying your own sandbox values. Do not commit this file.

OBP_HOST=your_obp_sandbox_host
OBP_USERNAME=your_obp_username
OBP_PASSWORD=your_obp_password
OBP_CONSUMER_KEY=your_obp_consumer_key
TL_CLIENT_ID=your_truelayer_client_id
TL_CLIENT_SECRET=your_truelayer_client_secret
TL_REDIRECT_URI=https://console.truelayer.com/redirect-page
TL_KID=your_truelayer_key_id

Step 5: Start the server.

node index.js

The server runs on http://localhost:4000. You should see the message "Server running on http://localhost:4000".

Step 6: Run the frontend.
With the backend running, start the mobile app from the frontend repository. The app connects to this backend at http://10.0.2.2:4000, the Android emulator's alias for the host machine's localhost.

Notes
The .env file and both .pem key files are excluded from version control and must be supplied locally.
TL_REDIRECT_URI must exactly match the redirect URI used by the app during authorisation, or the token exchange will fail.
The application uses sandbox environments only. No real bank accounts, funds, or personal data are involved.