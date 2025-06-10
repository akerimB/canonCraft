import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

// A default avatar image, replace with dynamic user avatar later
const defaultAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face';

export default function PersonaMeter({ score, avatarUri }) {
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

  const meterWidth = score ? `${score}%` : '0%';
  const meterColor = getPersonaColor(score);
  const label = getPersonaLabel(score);

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <Image 
          source={{ uri: avatarUri || defaultAvatar }} 
          style={styles.avatar} 
        />
      </View>
      <View style={styles.meterWrapper}>
        <View style={styles.header}>
          <Text style={styles.label}>PERSONA METER</Text>
          <Text style={styles.scoreText}>{score}/100</Text>
        </View>
        <View style={styles.meterBackground}>
          <View 
            style={[
              styles.meterFill, 
              { width: meterWidth }
            ]} 
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5', // Match the new background
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  meterWrapper: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  meterBackground: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    backgroundColor: '#2ECC71', // A nice teal/green color
    borderRadius: 6,
  },
}); 