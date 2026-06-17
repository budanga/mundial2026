# Mundial 2026

## Overview
Mundial 2026 is a comprehensive mobile application built with React Native and Expo, dedicated to the 2026 FIFA World Cup. It provides a highly optimized, native-like experience for both iOS and Android platforms, featuring background fetch capabilities and real-time notifications to keep users informed about tournament events.

## Features
- **Cross-Platform Compatibility:** Developed using Expo to ensure seamless performance on iOS and Android devices.
- **Push Notifications:** Integrated with Expo Notifications to deliver real-time updates and alerts.
- **Background Tasks:** Utilizes Expo Background Fetch and Task Manager to synchronize data efficiently in the background.
- **Optimized User Interface:** Designed with a sophisticated dark mode interface and a tailored user experience.

## Prerequisites
To run this project locally, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 18 or newer recommended)
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [EAS CLI](https://docs.expo.dev/build/setup/) (for building the application)

## Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone git@github.com:budanga/mundial2026.git
   cd mundial2026
   ```

2. Install the project dependencies:
   ```bash
   npm install
   ```

## Running the Application

To start the Expo development server, run:
```bash
npm start
```
From the Expo CLI, you can open the app on a physical device using the Expo Go app, or launch it on an iOS Simulator or Android Emulator.

## Building the Application

This project is configured with Expo Application Services (EAS). To generate a standalone build for Android or iOS, use the following commands:

- **Android (APK):**
  ```bash
  eas build -p android --profile apk
  ```

- **iOS:**
  ```bash
  eas build -p ios
  ```

## License
This project is licensed under the terms provided in the LICENSE file.
