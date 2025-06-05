/**
 * Story Session Manager
 * Handles saving, loading, and managing multiple story sessions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { databaseMemory } from '../services/databaseMemorySystem';
import { useGame } from './gameContext';

const { width, height } = Dimensions.get('window');

export default function StorySessionManager({ visible, onClose, onLoadStory }) {
  const [savedStories, setSavedStories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameStoryId, setRenameStoryId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const { state } = useGame();

  useEffect(() => {
    if (visible) {
      loadSavedStories();
    }
  }, [visible]);

  const loadSavedStories = async () => {
    setIsLoading(true);
    try {
      const stories = await databaseMemory.getSavedStories();
      setSavedStories(stories);
    } catch (error) {
      console.error('Failed to load saved stories:', error);
      Alert.alert('Error', 'Failed to load saved stories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadStory = async (story) => {
    try {
      setIsLoading(true);
      
      Alert.alert(
        'Load Story',
        `Resume "${story.title}" as ${story.character}?\n\nProgress: Scene ${story.scene_number}\nPersona Score: ${Math.round(story.persona_score)}%\nLast Played: ${new Date(story.last_played).toLocaleDateString()}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Resume',
            onPress: async () => {
              try {
                const storyData = await databaseMemory.loadStoryMemory(story.id);
                if (storyData) {
                  onLoadStory(story, storyData);
                  onClose();
                } else {
                  Alert.alert('Error', 'Failed to load story data');
                }
              } catch (error) {
                console.error('Failed to load story:', error);
                Alert.alert('Error', 'Failed to load story');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error loading story:', error);
      Alert.alert('Error', 'Failed to load story');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStory = (story) => {
    Alert.alert(
      'Delete Story',
      `Are you sure you want to delete "${story.title}"?\n\nThis cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseMemory.deleteStoryMemory(story.id);
              loadSavedStories(); // Refresh list
            } catch (error) {
              console.error('Failed to delete story:', error);
              Alert.alert('Error', 'Failed to delete story');
            }
          }
        }
      ]
    );
  };

  const handleRenameStory = (story) => {
    setRenameStoryId(story.id);
    setNewTitle(story.title);
    setShowRenameModal(true);
  };

  const confirmRename = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Error', 'Please enter a valid title');
      return;
    }

    try {
      // Update story title in database
      await databaseMemory.database.updateStorySession(renameStoryId, {
        title: newTitle.trim()
      });
      
      setShowRenameModal(false);
      setRenameStoryId(null);
      setNewTitle('');
      loadSavedStories(); // Refresh list
    } catch (error) {
      console.error('Failed to rename story:', error);
      Alert.alert('Error', 'Failed to rename story');
    }
  };

  const getStoryStatusText = (story) => {
    const daysSinceLastPlayed = Math.floor((Date.now() - new Date(story.last_played)) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastPlayed === 0) {
      return 'Today';
    } else if (daysSinceLastPlayed === 1) {
      return 'Yesterday';
    } else if (daysSinceLastPlayed < 7) {
      return `${daysSinceLastPlayed} days ago`;
    } else {
      return new Date(story.last_played).toLocaleDateString();
    }
  };

  const getPersonaScoreColor = (score) => {
    if (score >= 80) return '#4CAF50'; // Green
    if (score >= 60) return '#FF9800'; // Orange
    if (score >= 40) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  const getCharacterIcon = (characterName) => {
    const name = characterName.toLowerCase();
    if (name.includes('holmes')) return '🔍';
    if (name.includes('elizabeth') || name.includes('bennet')) return '💃';
    if (name.includes('dracula')) return '🧛';
    if (name.includes('hamlet')) return '👑';
    if (name.includes('gatsby')) return '🎩';
    if (name.includes('alice')) return '🐰';
    return '📚';
  };

  const renderStoryCard = (story) => (
    <View key={story.id} style={styles.storyCard}>
      <View style={styles.storyHeader}>
        <View style={styles.characterInfo}>
          <Text style={styles.characterIcon}>{getCharacterIcon(story.character)}</Text>
          <View style={styles.characterDetails}>
            <Text style={styles.storyTitle}>{story.title}</Text>
            <Text style={styles.characterName}>{story.character}</Text>
          </View>
        </View>
        <View style={styles.storyActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleRenameStory(story)}
          >
            <Text style={styles.actionButtonText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteStory(story)}
          >
            <Text style={styles.actionButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.storyStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Scene</Text>
          <Text style={styles.statValue}>{story.scene_number}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Persona Score</Text>
          <Text style={[styles.statValue, { color: getPersonaScoreColor(story.persona_score) }]}>
            {Math.round(story.persona_score)}%
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Last Played</Text>
          <Text style={styles.statValue}>{getStoryStatusText(story)}</Text>
        </View>
      </View>

      {story.metadata && (
        <View style={styles.storyMetadata}>
          <Text style={styles.metadataText}>
            {story.metadata.world} • {story.metadata.difficulty} Difficulty
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.loadButton}
        onPress={() => handleLoadStory(story)}
      >
        <Text style={styles.loadButtonText}>Resume Story</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Saved Stories</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B4513" />
              <Text style={styles.loadingText}>Loading saved stories...</Text>
            </View>
          ) : savedStories.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyTitle}>No Saved Stories</Text>
              <Text style={styles.emptyText}>
                Start a new story to create your first save file
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.storiesList} showsVerticalScrollIndicator={false}>
              {savedStories.map(renderStoryCard)}
            </ScrollView>
          )}

          {/* Current Story Info */}
          {state.currentStory && (
            <View style={styles.currentStoryInfo}>
              <Text style={styles.currentStoryLabel}>Currently Playing:</Text>
              <Text style={styles.currentStoryText}>
                {state.currentStory.character} • Scene {state.sceneCounter || 1}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Rename Modal */}
      <Modal visible={showRenameModal} animationType="fade" transparent={true}>
        <View style={styles.renameModalOverlay}>
          <View style={styles.renameModalContainer}>
            <Text style={styles.renameModalTitle}>Rename Story</Text>
            <TextInput
              style={styles.renameInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Enter new title"
              maxLength={50}
              autoFocus={true}
            />
            <View style={styles.renameModalActions}>
              <TouchableOpacity
                style={[styles.renameModalButton, styles.cancelButton]}
                onPress={() => {
                  setShowRenameModal(false);
                  setRenameStoryId(null);
                  setNewTitle('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.renameModalButton, styles.confirmButton]}
                onPress={confirmRename}
              >
                <Text style={styles.confirmButtonText}>Rename</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    height: height * 0.8,
    backgroundColor: '#2C1810',
    borderRadius: 15,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#5C4033',
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#5C4033',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#A0826D',
    fontSize: 16,
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#A0826D',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  storiesList: {
    flex: 1,
  },
  storyCard: {
    backgroundColor: '#3E2723',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#5C4033',
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  characterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  characterIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  characterDetails: {
    flex: 1,
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 2,
  },
  characterName: {
    fontSize: 14,
    color: '#A0826D',
  },
  storyActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: '#5C4033',
    borderRadius: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#D32F2F',
  },
  actionButtonText: {
    fontSize: 14,
  },
  storyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#8D6E63',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  storyMetadata: {
    marginBottom: 12,
  },
  metadataText: {
    fontSize: 12,
    color: '#8D6E63',
    fontStyle: 'italic',
  },
  loadButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  loadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentStoryInfo: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#4A4A4A',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#D4AF37',
  },
  currentStoryLabel: {
    fontSize: 12,
    color: '#A0826D',
    marginBottom: 2,
  },
  currentStoryText: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  // Rename Modal Styles
  renameModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  renameModalContainer: {
    width: width * 0.8,
    backgroundColor: '#2C1810',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#5C4033',
  },
  renameModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 15,
    textAlign: 'center',
  },
  renameInput: {
    backgroundColor: '#3E2723',
    borderWidth: 1,
    borderColor: '#5C4033',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#D4AF37',
    marginBottom: 20,
  },
  renameModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  renameModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#5C4033',
  },
  confirmButton: {
    backgroundColor: '#8B4513',
  },
  cancelButtonText: {
    color: '#A0826D',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 