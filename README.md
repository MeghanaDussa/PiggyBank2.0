PiggyBank 2.0 (Frontend)

The React Native mobile client for PiggyBank 2.0, a multi-currency account aggregation application used to compare two Open Banking API providers, the Open Bank Project (OBP) and TrueLayer.

This is the frontend only. It requires the PiggyBank 2.0 backend to be running, since the app fetches all data through it.

Prerequisites:
Node.js (version 22.11.0 or later) and npm
Android Studio, with an Android Virtual Device set up. This project was tested on a Pixel 8 emulator running Android 16.0 (API level 36, x86_64).
The React Native development environment configured for Android (JDK and Android SDK). See the official React Native "Set Up Your Environment" guide for Android.
The PiggyBank 2.0 backend, cloned and running (see the backend repository)

Setup:

Clone this repository and install dependencies:
   npm install
Start the backend first. This app calls the backend at http://10.0.2.2:4000, which is the Android emulator's alias for the host machine's localhost. The backend must be running before you launch the app, or no data will load.
Start the Metro bundler:
   npm start
In a separate terminal, build and run the app on the Android emulator:
   npm run android
   

Notes
The app is configured for the Android emulator and was tested on a Pixel 8 Android Virtual Device running Android 16.0 (API level 36). The backend address http://10.0.2.2:4000 is specific to the emulator; running on a physical device or on iOS would require changing this address in the code.
The application uses sandbox data only. No real bank accounts, funds, or personal data are involved.
The app was developed and tested on the Android emulator.