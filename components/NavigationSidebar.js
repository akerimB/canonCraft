import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

const NavigationButton = ({ title, onPress }) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

export default function NavigationSidebar({ onNavigate, onShowPersona, onShowMetrics, onExit }) {
  const handleComingSoon = (feature) => {
    Alert.alert('Coming Soon!', `${feature} is under development and will be available soon.`);
  };
  
  return (
    <View style={styles.container}>
      <NavigationButton title="METRICS" onPress={onShowMetrics} />
      <NavigationButton title="MAIN MENU" onPress={() => onNavigate('Menu')} />
      <NavigationButton title="PERSONA" onPress={onShowPersona} />
      <NavigationButton title="STORY BOARD" onPress={() => handleComingSoon('The Story Board')} />
      <NavigationButton title="SOCIAL MEDIA" onPress={() => handleComingSoon('Social Media integration')} />
      <NavigationButton title="EXIT" onPress={onExit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 200,
    backgroundColor: 'transparent',
    padding: 20,
    justifyContent: 'center',
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingVertical: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 