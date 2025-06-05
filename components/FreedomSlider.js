/**
 * Freedom Slider Component
 * Controls how closely the AI follows original canon vs. allows creative freedom
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
  TouchableOpacity
} from 'react-native';

const { width } = Dimensions.get('window');

export default function FreedomSlider({ value = 50, onValueChange, disabled = false }) {
  const [sliderValue] = useState(new Animated.Value(value));
  const [currentValue, setCurrentValue] = useState(value);

  const sliderWidth = width * 0.7;
  const thumbSize = 24;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: () => {
      sliderValue.setOffset(sliderValue._value);
    },
    onPanResponderMove: (evt, gestureState) => {
      if (disabled) return;
      
      const newValue = Math.max(0, Math.min(100, 
        (gestureState.moveX / sliderWidth) * 100
      ));
      
      sliderValue.setValue(newValue - sliderValue._offset);
      setCurrentValue(Math.round(newValue));
      
      if (onValueChange) {
        onValueChange(Math.round(newValue));
      }
    },
    onPanResponderRelease: () => {
      if (disabled) return;
      sliderValue.flattenOffset();
    },
  });

  const getSliderDescription = () => {
    if (currentValue <= 20) {
      return {
        title: "📚 Strict Canon",
        description: "Follow the original story closely with minimal creative departures",
        color: "#8B4513"
      };
    } else if (currentValue <= 40) {
      return {
        title: "📖 Guided Adventure", 
        description: "Some creative freedom within the spirit of the original work",
        color: "#D2691E"
      };
    } else if (currentValue <= 60) {
      return {
        title: "🎭 Balanced Creative",
        description: "Equal mix of canon elements and creative new directions",
        color: "#DAA520"
      };
    } else if (currentValue <= 80) {
      return {
        title: "✨ Creative Freedom",
        description: "Significant departures from canon with character authenticity",
        color: "#B8860B"
      };
    } else {
      return {
        title: "🌟 Pure Imagination",
        description: "Maximum creative freedom - completely new adventures",
        color: "#FFD700"
      };
    }
  };

  const handlePresetTap = (presetValue) => {
    if (disabled) return;
    
    setCurrentValue(presetValue);
    Animated.timing(sliderValue, {
      toValue: presetValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    if (onValueChange) {
      onValueChange(presetValue);
    }
  };

  const sliderDescription = getSliderDescription();

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <View style={styles.header}>
        <Text style={styles.title}>Story Freedom</Text>
        <View style={[styles.valueContainer, { backgroundColor: sliderDescription.color }]}>
          <Text style={styles.valueText}>{currentValue}%</Text>
        </View>
      </View>

      <View style={styles.descriptionContainer}>
        <Text style={[styles.descriptionTitle, { color: sliderDescription.color }]}>
          {sliderDescription.title}
        </Text>
        <Text style={styles.descriptionText}>
          {sliderDescription.description}
        </Text>
      </View>

      <View style={styles.sliderContainer}>
        {/* Track Background */}
        <View style={styles.track}>
          {/* Active Track */}
          <Animated.View 
            style={[
              styles.activeTrack,
              {
                width: sliderValue.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                }),
                backgroundColor: sliderDescription.color
              }
            ]}
          />
          
          {/* Thumb */}
          <Animated.View
            style={[
              styles.thumb,
              {
                backgroundColor: sliderDescription.color,
                left: sliderValue.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, sliderWidth - thumbSize],
                  extrapolate: 'clamp',
                }),
              }
            ]}
            {...panResponder.panHandlers}
          >
            <Text style={styles.thumbIcon}>📖</Text>
          </Animated.View>
        </View>

        {/* Track Labels */}
        <View style={styles.trackLabels}>
          <Text style={styles.trackLabel}>📚 Canon</Text>
          <Text style={styles.trackLabel}>🌟 Creative</Text>
        </View>
      </View>

      {/* Preset Buttons */}
      <View style={styles.presetContainer}>
        <TouchableOpacity
          style={[styles.presetButton, currentValue === 25 && styles.presetButtonActive]}
          onPress={() => handlePresetTap(25)}
          disabled={disabled}
        >
          <Text style={styles.presetText}>📚</Text>
          <Text style={styles.presetLabel}>Canon</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.presetButton, currentValue === 50 && styles.presetButtonActive]}
          onPress={() => handlePresetTap(50)}
          disabled={disabled}
        >
          <Text style={styles.presetText}>🎭</Text>
          <Text style={styles.presetLabel}>Balanced</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.presetButton, currentValue === 75 && styles.presetButtonActive]}
          onPress={() => handlePresetTap(75)}
          disabled={disabled}
        >
          <Text style={styles.presetText}>✨</Text>
          <Text style={styles.presetLabel}>Creative</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.presetButton, currentValue === 90 && styles.presetButtonActive]}
          onPress={() => handlePresetTap(90)}
          disabled={disabled}
        >
          <Text style={styles.presetText}>🌟</Text>
          <Text style={styles.presetLabel}>Free</Text>
        </TouchableOpacity>
      </View>

      {/* Examples */}
      <View style={styles.examplesContainer}>
        <Text style={styles.examplesTitle}>How this affects your story:</Text>
        {currentValue <= 30 ? (
          <View style={styles.example}>
            <Text style={styles.exampleText}>
              • Follows original plot points closely{'\n'}
              • Characters behave as in the source material{'\n'}
              • Historical/canonical accuracy prioritized
            </Text>
          </View>
        ) : currentValue <= 70 ? (
          <View style={styles.example}>
            <Text style={styles.exampleText}>
              • Mix of familiar and new story elements{'\n'}
              • Characters may make different choices{'\n'}
              • Some creative situations and outcomes
            </Text>
          </View>
        ) : (
          <View style={styles.example}>
            <Text style={styles.exampleText}>
              • Completely new adventures and scenarios{'\n'}
              • Characters in unexpected situations{'\n'}
              • AI has maximum creative freedom
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 20,
    margin: 16,
    borderWidth: 2,
    borderColor: '#0f3460',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
    elevation: 8,
  },
  disabled: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  valueContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  valueText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#A0826D',
    lineHeight: 20,
  },
  sliderContainer: {
    paddingHorizontal: 10,
  },
  track: {
    height: 8,
    backgroundColor: '#5C4033',
    borderRadius: 4,
    position: 'relative',
    marginBottom: 12,
  },
  activeTrack: {
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
    top: -8,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
    elevation: 4,
  },
  thumbIcon: {
    fontSize: 12,
  },
  trackLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  trackLabel: {
    fontSize: 12,
    color: '#8D6E63',
  },
  presetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  presetButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#5C4033',
    minWidth: 60,
  },
  presetButtonActive: {
    backgroundColor: '#8B4513',
  },
  presetText: {
    fontSize: 20,
    marginBottom: 4,
  },
  presetLabel: {
    fontSize: 10,
    color: '#A0826D',
    fontWeight: 'bold',
  },
  examplesContainer: {
    backgroundColor: '#2C1810',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#D4AF37',
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 8,
  },
  example: {
    paddingLeft: 8,
  },
  exampleText: {
    fontSize: 12,
    color: '#A0826D',
    lineHeight: 18,
  },
}); 