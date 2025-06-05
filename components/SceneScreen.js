import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useGame } from '../gameContext';
import PersonaMeter from './PersonaMeter';
import ChoiceButton from './ChoiceButton';

export default function SceneScreen({ navigation }) {
  const { 
    state, 
    setScene, 
    updatePersonaScore, 
    generateNextScene,
    incrementAdsWatched 
  } = useGame();
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!state.currentStory || !state.currentScene) {
      // If no story is loaded, go back to menu
      navigation.navigate('Menu');
    }
  }, [state.currentStory, state.currentScene]);

  const handleChoice = async (choice) => {
    if (isLoading || state.isGeneratingScene) return;
    
    setIsLoading(true);

    try {
      // Update persona score
      if (choice.persona_score) {
        updatePersonaScore(choice.persona_score);
      }

      // Handle rewarded ad if specified
      if (choice.reward_ad) {
        const watchAd = await showRewardedAdPrompt();
        if (watchAd) {
          incrementAdsWatched();
          // Could unlock special content or bonus points here
        }
      }

      // Navigate to next scene
      if (choice.next_scene === 'end_summary') {
        navigation.navigate('Summary');
      } else {
        // For AI-generated stories, generate the next scene dynamically
        if (state.currentStory?.isAIGenerated) {
          try {
            await generateNextScene(choice);
          } catch (error) {
            console.error('Failed to generate next scene:', error);
            Alert.alert(
              'Connection Error', 
              'Unable to generate the next scene. Please check your internet connection and try again.',
              [
                { text: 'Retry', onPress: () => handleChoice(choice) },
                { text: 'Return to Menu', onPress: () => navigation.navigate('Menu') }
              ]
            );
            return;
          }
        } else {
          // Legacy: for pre-defined scenes (backward compatibility)
          const nextScene = findSceneById(choice.next_scene);
          if (nextScene) {
            setScene(nextScene);
          } else {
            Alert.alert('Error', 'Scene not found. Returning to menu.');
            navigation.navigate('Menu');
          }
        }
      }
    } catch (error) {
      console.error('Error handling choice:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showRewardedAdPrompt = () => {
    return new Promise((resolve) => {
      Alert.alert(
        'Watch Ad for Bonus',
        'Watch a short video to unlock special content or bonus persona points?',
        [
          { text: 'Skip', onPress: () => resolve(false) },
          { text: 'Watch Ad', onPress: () => resolve(true) }
        ]
      );
    });
  };

  if (!state.currentScene) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e85a4f" />
        <Text style={styles.loadingText}>Loading your story...</Text>
      </View>
    );
  }

  const scene = state.currentScene;
  const isGenerating = state.isGeneratingScene || isLoading;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      {/* Persona Meter */}
      <PersonaMeter score={state.personaScore} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Scene Title */}
        {scene.title && (
          <View style={styles.titleContainer}>
            <Text style={styles.sceneTitle}>{scene.title}</Text>
          </View>
        )}

        {/* Scene Narration */}
        <View style={styles.narrationContainer}>
          <Text style={styles.narrationText}>{scene.narration}</Text>
          
          {/* Embedded Ad Content */}
          {scene.ad && (
            <View style={styles.adContainer}>
              <Text style={styles.adLabel}>Sponsored</Text>
              <Text style={styles.adText}>{scene.ad}</Text>
            </View>
          )}
        </View>

        {/* Loading State for AI Generation */}
        {isGenerating && (
          <View style={styles.generatingContainer}>
            <ActivityIndicator size="large" color="#e85a4f" />
            <Text style={styles.generatingText}>
              AI is crafting your next adventure...
            </Text>
          </View>
        )}

        {/* Choices */}
        {!isGenerating && (
          <View style={styles.choicesContainer}>
            <Text style={styles.choicesHeader}>What do you do?</Text>
            {scene.choices && scene.choices.map((choice, index) => (
              <ChoiceButton
                key={choice.choice_id || index}
                choice={choice}
                onPress={() => handleChoice(choice)}
                disabled={isGenerating}
              />
            ))}
          </View>
        )}

        {/* Character Info */}
        <View style={styles.characterInfo}>
          <Text style={styles.characterText}>
            Playing as {state.currentStory?.character}
          </Text>
          <Text style={styles.progressText}>
            Choices made: {state.totalChoicesMade}
          </Text>
          {state.currentStory?.isAIGenerated && (
            <Text style={styles.aiIndicator}>
              🤖 AI-Generated Story
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: '#eee2dc',
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sceneTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#eee2dc',
    textAlign: 'center',
  },
  narrationContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  narrationText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#bab2b5',
    textAlign: 'justify',
  },
  adContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#16213e',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e85a4f',
  },
  adLabel: {
    fontSize: 12,
    color: '#8b8680',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  adText: {
    fontSize: 14,
    color: '#bab2b5',
    fontStyle: 'italic',
  },
  generatingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  generatingText: {
    color: '#bab2b5',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  choicesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  choicesHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#eee2dc',
    marginBottom: 15,
    textAlign: 'center',
  },
  characterInfo: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#16213e',
    paddingTop: 20,
    marginTop: 10,
  },
  characterText: {
    fontSize: 14,
    color: '#e85a4f',
    fontWeight: '600',
    marginBottom: 5,
  },
  progressText: {
    fontSize: 12,
    color: '#8b8680',
    marginBottom: 5,
  },
  aiIndicator: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
}); 