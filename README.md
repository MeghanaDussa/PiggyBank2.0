PiggyBank 2.0

A multi-currency account aggregation application used to compare two Open Banking API providers, the Open Bank Project (OBP) and TrueLayer. This repository contains both the React Native mobile client (repo root) and the Express backend it talks to (backend/).

The app fetches all data through the backend, so the backend must be running before the app will show any data.

Prerequisites:
Node.js (version 22.11.0 or later) and npm
Android Studio, with an Android Virtual Device set up. This project was tested on a Pixel 8 emulator running Android 16.0 (API level 36, x86_64).
The React Native development environment configured for Android (JDK and Android SDK). See the official React Native "Set Up Your Environment" guide for Android.

Setup:

Clone this repository.
Install the backend and start it first. The app calls it at http://10.0.2.2:4000, which is the Android emulator's alias for the host machine's localhost. See backend/README.md for its environment variables and setup details.
   cd backend
   npm install
   npm start
In a separate terminal, install the frontend dependencies from the repo root:
   npm install
Start the Metro bundler:
   npm start
In a separate terminal, build and run the app on the Android emulator:
   npm run android
   

Notes
The app is configured for the Android emulator and was tested on a Pixel 8 Android Virtual Device running Android 16.0 (API level 36). The backend address http://10.0.2.2:4000 is specific to the emulator; running on a physical device or on iOS would require changing this address in the code.
The application uses sandbox data only. No real bank accounts, funds, or personal data are involved.
The app was developed and tested on the Android emulator.