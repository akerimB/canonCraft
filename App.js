import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GameContextProvider } from './gameContext';
import MenuScreen from './components/MenuScreen';
import SceneScreen from './components/SceneScreen';
import SummaryScreen from './components/SummaryScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <GameContextProvider>
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
            options={{ title: 'InCharacter' }}
          />
          <Stack.Screen 
            name="Scene" 
            component={SceneScreen} 
            options={{ title: 'Story' }}
          />
          <Stack.Screen 
            name="Summary" 
            component={SummaryScreen} 
            options={{ title: 'Chapter Complete' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GameContextProvider>
  );
} 