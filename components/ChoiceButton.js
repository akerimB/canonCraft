import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';

export default function ChoiceButton({ choice, onPress, disabled }) {
  const getPersonaIndicator = (score) => {
    if (!score) return null;
    
    if (score > 0) {
      return {
        icon: '↗️',
        color: '#4CAF50',
        text: `+${score}`
      };
    } else {
      return {
        icon: '↘️',
        color: '#F44336',
        text: `${score}`
      };
    }
  };

  const personaIndicator = getPersonaIndicator(choice.persona_score);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.buttonDisabled
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <Text style={[styles.text, disabled && styles.textDisabled]}>
          {choice.text}
        </Text>
        
        <View style={styles.indicators}>
          {/* Persona Score Indicator */}
          {personaIndicator && (
            <View style={[styles.indicator, { backgroundColor: personaIndicator.color }]}>
              <Text style={styles.indicatorText}>
                {personaIndicator.icon} {personaIndicator.text}
              </Text>
            </View>
          )}
          
          {/* Reward Ad Indicator */}
          {choice.reward_ad && (
            <View style={[styles.indicator, styles.adIndicator]}>
              <Text style={styles.indicatorText}>📺 Bonus</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'column',
  },
  text: {
    fontSize: 16,
    color: '#eee2dc',
    lineHeight: 22,
    marginBottom: 8,
  },
  textDisabled: {
    color: '#8b8680',
  },
  indicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  indicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  adIndicator: {
    backgroundColor: '#FF9800',
  },
  indicatorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 