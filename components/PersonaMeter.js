import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PersonaMeter({ score }) {
  const getPersonaColor = (score) => {
    if (score >= 80) return '#4CAF50'; // Green - Perfect
    if (score >= 60) return '#8BC34A'; // Light Green - Great
    if (score >= 40) return '#FFC107'; // Yellow - Good
    if (score >= 20) return '#FF9800'; // Orange - Interesting
    return '#F44336'; // Red - Off-character
  };

  const getPersonaLabel = (score) => {
    if (score >= 80) return 'Perfect';
    if (score >= 60) return 'Great';
    if (score >= 40) return 'Good';
    if (score >= 20) return 'Different';
    return 'Off-Character';
  };

  const meterWidth = `${score}%`;
  const meterColor = getPersonaColor(score);
  const label = getPersonaLabel(score);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Persona Meter</Text>
        <Text style={styles.score}>{score}/100</Text>
      </View>
      
      <View style={styles.meterContainer}>
        <View style={styles.meterBackground}>
          <View 
            style={[
              styles.meterFill, 
              { 
                width: meterWidth, 
                backgroundColor: meterColor 
              }
            ]} 
          />
        </View>
        <Text style={[styles.statusLabel, { color: meterColor }]}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#16213e',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#eee2dc',
  },
  score: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e85a4f',
  },
  meterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meterBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#0f3460',
    borderRadius: 4,
    marginRight: 15,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 2, // Ensure some visibility even at 0
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'right',
  },
}); 