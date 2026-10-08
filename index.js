/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { initializeAppCheck } from './src/services/appCheck';

// Initialize Firebase App Check immediately at startup.
// This registers the Play Integrity provider (prod) / debug provider (dev)
// so that phone auth runs silently with NO reCAPTCHA screen.
initializeAppCheck();

AppRegistry.registerComponent(appName, () => App);
