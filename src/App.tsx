import React, { useState, useEffect, useCallback } from 'react';
import { View, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';

// Files Imports based on your structure
import Dashboard from './pages/Dashboard';
import PageView from './pages/PageView';
import SettingsPage from './pages/SettingsPage';
import StockSearch from './pages/StockSearch';
import ToolsHub from './tools/ToolsHub';
import Navbar from './components/Navbar';

// Configuration
import './config/firebase'; // Ensure Firebase initializes

// Prevent auto hide of native splash screen
SplashScreen.preventAutoHideAsync();
LogBox.ignoreLogs(['Warning: ...']); // Ignore minor warnings

const Stack = createNativeStackNavigator();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Yahan heavy lifting / API calls load ho rhe h
        await new Promise(resolve => setTimeout(resolve, 500)); // Slight buffer (0.5s)
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null; // Native Splash dikhega, text nahi
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Dashboard" component={Dashboard} />
          <Stack.Screen name="PageView" component={PageView} />
          <Stack.Screen name="StockSearch" component={StockSearch} />
          <Stack.Screen name="ToolsHub" component={ToolsHub} />
          <Stack.Screen name="SettingsPage" component={SettingsPage} />
        </Stack.Navigator>
        <Navbar /> 
      </NavigationContainer>
    </View>
  );
}