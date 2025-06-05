import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useGame } from './gameContext';

export default function SummaryScreen({ navigation }) {
  const { state, resetGame, getPersonaMessage } = useGame();

  const handlePlayAgain = () => {
    resetGame();
    navigation.navigate('Menu');
  };

  const handleNewStory = () => {
    resetGame();
    navigation.navigate('Menu');
  };

  const getScoreGrade = (score) => {
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#8BC34A';
    if (score >= 40) return '#FFC107';
    if (score >= 20) return '#FF9800';
    return '#F44336';
  };

  const grade = getScoreGrade(state.personaScore);
  const scoreColor = getScoreColor(state.personaScore);
  const personaMessage = getPersonaMessage();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Chapter Complete!</Text>
          <Text style={styles.subtitle}>
            Your journey as {state.currentStory?.character} has ended
          </Text>
        </View>

        {/* Score Display */}
        <View style={styles.scoreContainer}>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreGrade, { color: scoreColor }]}>{grade}</Text>
            <Text style={[styles.scoreNumber, { color: scoreColor }]}>
              {state.personaScore}/100
            </Text>
          </View>
          
          <View style={styles.scoreDetails}>
            <Text style={styles.scoreLabel}>Persona Score</Text>
            <Text style={[styles.scoreMessage, { color: scoreColor }]}>
              {personaMessage}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Your Journey</Text>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Choices Made</Text>
            <Text style={styles.statValue}>{state.totalChoicesMade}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Ads Watched</Text>
            <Text style={styles.statValue}>{state.adsWatched}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Character</Text>
            <Text style={styles.statValue}>{state.currentStory?.character}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Story</Text>
            <Text style={styles.statValue}>{state.currentStory?.title}</Text>
          </View>
        </View>

        {/* Ending Description */}
        <View style={styles.endingContainer}>
          <Text style={styles.endingTitle}>Your Ending</Text>
          <Text style={styles.endingText}>
            {state.personaScore >= 80 
              ? `You embodied ${state.currentStory?.character} perfectly, staying true to their essence while navigating the challenges of their world. Your choices reflected deep understanding of the character's motivations and values.`
              : state.personaScore >= 60
              ? `You captured much of ${state.currentStory?.character}'s spirit, making choices that largely aligned with their character. There were moments of perfect authenticity mixed with your own interpretation.`
              : state.personaScore >= 40
              ? `Your portrayal of ${state.currentStory?.character} was a unique blend of the original character and your own vision. Some choices felt authentic, while others took the story in new directions.`
              : state.personaScore >= 20
              ? `You took ${state.currentStory?.character} on a very different journey than originally intended. Your interpretation was bold and creative, creating an alternate version of their story.`
              : `Your version of ${state.currentStory?.character} was completely reimagined. You created an entirely new character arc that diverged dramatically from the source material - a truly unique adventure!`
            }
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handlePlayAgain}
          >
            <Text style={styles.primaryButtonText}>Play This Story Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleNewStory}
          >
            <Text style={styles.secondaryButtonText}>Try a Different Character</Text>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#eee2dc',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#bab2b5',
    textAlign: 'center',
    lineHeight: 22,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#16213e',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  scoreGrade: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreNumber: {
    fontSize: 12,
    fontWeight: '600',
  },
  scoreDetails: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#eee2dc',
    marginBottom: 5,
  },
  scoreMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#eee2dc',
    marginBottom: 15,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
  },
  statLabel: {
    fontSize: 16,
    color: '#bab2b5',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e85a4f',
  },
  endingContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  endingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#eee2dc',
    marginBottom: 15,
  },
  endingText: {
    fontSize: 16,
    color: '#bab2b5',
    lineHeight: 24,
    textAlign: 'justify',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#e85a4f',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#16213e',
  },
  secondaryButtonText: {
    color: '#eee2dc',
    fontSize: 16,
    fontWeight: '600',
  },
}); 