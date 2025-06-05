import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { useGame } from '../gameContext';

// Character Personas for AI-driven storytelling
const CHARACTER_PACKS = [
  {
    id: 'sherlock_holmes',
    title: 'The Adventures of Sherlock Holmes',
    character: 'Sherlock Holmes',
    description: 'Step into the shoes of the world\'s greatest detective. Use your powers of deduction to solve mysteries in Victorian London.',
    difficulty: 'Medium',
    persona: {
      name: 'Sherlock Holmes',
      traits: ['analytical', 'observant', 'logical', 'eccentric', 'brilliant'],
      worldview: 'Everything can be deduced through careful observation and logical reasoning',
      setting: 'Victorian London, 1890s',
      background: 'World-renowned consulting detective living at 221B Baker Street with Dr. Watson',
      speech_style: 'Articulate, precise, sometimes condescending, uses deductive explanations',
      motivations: ['solving mysteries', 'intellectual challenges', 'justice'],
      relationships: ['Dr. Watson (loyal friend)', 'Mrs. Hudson (landlady)', 'Inspector Lestrade (police contact)'],
      canonical_knowledge: 'Stories by Arthur Conan Doyle - focus on deductive reasoning, crime solving, and Victorian atmosphere'
    },
    metadata: {
      author: 'Arthur Conan Doyle',
      setting: 'Victorian London',
      genre: 'Mystery'
    }
  },
  {
    id: 'dracula',
    title: 'Dracula',
    character: 'Count Dracula',
    description: 'Embrace the darkness as the legendary vampire. Navigate the shadows of Transylvania and beyond.',
    difficulty: 'Hard',
    persona: {
      name: 'Count Dracula',
      traits: ['manipulative', 'ancient', 'aristocratic', 'predatory', 'charismatic'],
      worldview: 'Mortals exist to serve immortal beings like myself; power and survival above all',
      setting: 'Transylvania and Victorian England, 1890s',
      background: 'Ancient vampire lord, centuries old, seeking to expand his dominion',
      speech_style: 'Formal, archaic, courtly but with underlying menace',
      motivations: ['expanding power', 'survival', 'dominion over mortals'],
      relationships: ['Renfield (thrall)', 'The Brides (vampire companions)', 'Van Helsing (nemesis)'],
      canonical_knowledge: 'Bram Stoker\'s Dracula - gothic horror, vampire mythology, Victorian fears'
    },
    metadata: {
      author: 'Bram Stoker',
      setting: 'Transylvania & London',
      genre: 'Gothic Horror'
    }
  },
  {
    id: 'pride_prejudice',
    title: 'Pride and Prejudice',
    character: 'Elizabeth Bennet',
    description: 'Navigate the complex social world of Regency England. Make choices that will determine your romantic fate.',
    difficulty: 'Easy',
    persona: {
      name: 'Elizabeth Bennet',
      traits: ['witty', 'independent', 'prejudiced', 'intelligent', 'spirited'],
      worldview: 'People should be judged by character, not wealth or status, though society often prevents this',
      setting: 'Regency England, early 1800s',
      background: 'Second eldest of five sisters in genteel but modest family',
      speech_style: 'Witty, articulate, sometimes sharp-tongued, socially aware',
      motivations: ['true love', 'family welfare', 'personal independence'],
      relationships: ['Jane (beloved sister)', 'Mr. Darcy (complex romantic interest)', 'Mr. Wickham (charming deceiver)'],
      canonical_knowledge: 'Jane Austen\'s Pride and Prejudice - social commentary, romance, class dynamics in Regency England'
    },
    metadata: {
      author: 'Jane Austen',
      setting: 'Regency England',
      genre: 'Romance'
    }
  }
];

export default function MenuScreen({ navigation }) {
  const { state, setStoryPacks, startAIStory, loadGameState } = useGame();

  useEffect(() => {
    // Load character packs and any saved game state
    setStoryPacks(CHARACTER_PACKS);
    loadGameState();
  }, []);

  const handleCharacterSelect = (characterPack) => {
    startAIStory(characterPack);
    navigation.navigate('Scene');
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#4CAF50';
      case 'Medium': return '#FF9800';
      case 'Hard': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      <View style={styles.header}>
        <Text style={styles.title}>InCharacter</Text>
        <Text style={styles.subtitle}>AI-Powered Character Adventures</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.storyGrid}>
          {CHARACTER_PACKS.map((character) => (
            <TouchableOpacity
              key={character.id}
              style={styles.storyCard}
              onPress={() => handleCharacterSelect(character)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.storyTitle}>{character.title}</Text>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(character.difficulty) }]}>
                  <Text style={styles.difficultyText}>{character.difficulty}</Text>
                </View>
              </View>
              
              <Text style={styles.characterName}>Play as {character.character}</Text>
              <Text style={styles.storyDescription}>{character.description}</Text>
              
              <View style={styles.metadata}>
                <Text style={styles.metadataText}>📚 {character.metadata.author}</Text>
                <Text style={styles.metadataText}>🌍 {character.metadata.setting}</Text>
                <Text style={styles.metadataText}>🎭 {character.metadata.genre}</Text>
                <Text style={styles.metadataText}>🤖 AI-Generated Story</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {state.currentStory && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.navigate('Scene')}
          >
            <Text style={styles.continueButtonText}>Continue Current Story</Text>
            <Text style={styles.continueSubtext}>
              Playing as {state.currentStory.character} • Persona: {state.personaScore}/100
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#eee2dc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#bab2b5',
    fontStyle: 'italic',
  },
  scrollView: {
    flex: 1,
  },
  storyGrid: {
    paddingHorizontal: 20,
  },
  storyCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#eee2dc',
    flex: 1,
    marginRight: 10,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  characterName: {
    fontSize: 16,
    color: '#e85a4f',
    fontWeight: '600',
    marginBottom: 8,
  },
  storyDescription: {
    fontSize: 14,
    color: '#bab2b5',
    lineHeight: 20,
    marginBottom: 16,
  },
  metadata: {
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
    paddingTop: 12,
  },
  metadataText: {
    fontSize: 12,
    color: '#8b8680',
    marginBottom: 4,
  },
  continueButton: {
    backgroundColor: '#e85a4f',
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  continueSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 4,
  },
}); 