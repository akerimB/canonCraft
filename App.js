import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GameProvider } from './components/gameContext';
import MenuScreen from './components/MenuScreen';
import SceneScreen from './components/SceneScreen';
import SummaryScreen from './components/SummaryScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GameProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Menu"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1a1a2e',
            },
            headerTintColor: '#eee2dc',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
                  <Stack.Screen 
          name="Menu" 
          component={MenuScreen} 
          options={{ title: 'CanonCraft' }}
          />
          <Stack.Screen 
            name="Scene" 
            component={SceneScreen}
            options={{ title: 'Adventure' }}
          />
          <Stack.Screen 
            name="Summary" 
            component={SummaryScreen}
            options={{ title: 'Adventure Complete' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GameProvider>
  );
} 