/**
 * InCharacter Story Memory System
 * Tracks major decisions, character relationships, plot threads, and provides persistent story continuity
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Memory types for different kinds of story events
export const MEMORY_TYPES = {
  MAJOR_DECISION: 'major_decision',
  CHARACTER_INTERACTION: 'character_interaction',
  PLOT_DEVELOPMENT: 'plot_development',
  RELATIONSHIP_CHANGE: 'relationship_change',
  EMOTIONAL_STATE: 'emotional_state',
  MILESTONE: 'milestone',
  CONSEQUENCE: 'consequence'
};

// Importance levels for filtering and prioritization
export const IMPORTANCE_LEVELS = {
  CRITICAL: 3,    // Character deaths, major betrayals, life-changing decisions
  HIGH: 2,        // Important relationships, significant discoveries
  MEDIUM: 1,      // Notable interactions, minor plot points
  LOW: 0          // Background details, flavor text
};

class StoryMemorySystem {
  constructor() {
    this.currentStoryId = null;
    this.memoryCache = new Map();
    this.relationshipMatrix = new Map();
    this.plotThreads = new Map();
    this.emotionalStates = new Map();
  }

  /**
   * Initialize memory system for a new story session
   */
  async initializeStory(characterPack, storyId = null) {
    this.currentStoryId = storyId || `${characterPack.id}_${Date.now()}`;
    
    // Load existing memory or create new
    await this.loadStoryMemory(this.currentStoryId);
    
    // Initialize character relationships if new story
    if (!this.relationshipMatrix.has(this.currentStoryId)) {
      this.initializeRelationships(characterPack);
    }
    
    // Initialize emotional state
    if (!this.emotionalStates.has(this.currentStoryId)) {
      this.initializeEmotionalState(characterPack);
    }
    
    return this.currentStoryId;
  }

  /**
   * Record a major story event with full context
   */
  recordMemory(eventData) {
    const memory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      storyId: this.currentStoryId,
      sceneNumber: eventData.sceneNumber || 0,
      type: eventData.type,
      importance: eventData.importance || IMPORTANCE_LEVELS.MEDIUM,
      title: eventData.title,
      description: eventData.description,
      playerAction: eventData.playerAction,
      aiResponse: eventData.aiResponse,
      characters: eventData.characters || [],
      consequences: eventData.consequences || [],
      emotionalImpact: eventData.emotionalImpact || {},
      tags: eventData.tags || [],
      metadata: eventData.metadata || {}
    };

    // Add to cache
    if (!this.memoryCache.has(this.currentStoryId)) {
      this.memoryCache.set(this.currentStoryId, []);
    }
    this.memoryCache.get(this.currentStoryId).push(memory);

    // Update relationships if character interaction
    if (memory.type === MEMORY_TYPES.CHARACTER_INTERACTION || memory.type === MEMORY_TYPES.RELATIONSHIP_CHANGE) {
      this.updateRelationships(memory);
    }

    // Update emotional state
    if (memory.emotionalImpact) {
      this.updateEmotionalState(memory);
    }

    // Update plot threads
    if (memory.type === MEMORY_TYPES.PLOT_DEVELOPMENT) {
      this.updatePlotThreads(memory);
    }

    // Auto-save to storage
    this.saveStoryMemory();

    return memory;
  }

  /**
   * Initialize character relationships matrix
   */
  initializeRelationships(characterPack) {
    const relationships = {
      // Relationship with self (character traits, current state)
      self: {
        confidence: 50,
        happiness: 50,
        trust_in_others: 50,
        moral_alignment: characterPack.personality?.moral_alignment || 'neutral',
        current_goal: characterPack.personality?.primary_motivation || 'survive',
        character_growth: 0
      },
      // Relationships with other characters (discovered through play)
      others: {}
    };

    this.relationshipMatrix.set(this.currentStoryId, relationships);
  }

  /**
   * Initialize emotional state tracking
   */
  initializeEmotionalState(characterPack) {
    const emotionalState = {
      primary_emotion: 'neutral',
      emotion_intensity: 0,
      mood_history: [],
      stress_level: 0,
      confidence_level: 50,
      last_major_emotion: null,
      emotional_triggers: []
    };

    this.emotionalStates.set(this.currentStoryId, emotionalState);
  }

  /**
   * Update character relationships based on interactions
   */
  updateRelationships(memory) {
    const relationships = this.relationshipMatrix.get(this.currentStoryId);
    if (!relationships) return;

    memory.characters.forEach(character => {
      if (!relationships.others[character.name]) {
        relationships.others[character.name] = {
          affection: 50,
          trust: 50,
          respect: 50,
          fear: 0,
          romantic_interest: 0,
          last_interaction: memory.timestamp,
          interaction_count: 0,
          shared_experiences: []
        };
      }

      const relation = relationships.others[character.name];
      relation.interaction_count++;
      relation.last_interaction = memory.timestamp;
      relation.shared_experiences.push({
        memory_id: memory.id,
        type: memory.type,
        outcome: character.outcome || 'neutral'
      });

      // Apply relationship changes based on interaction
      if (character.relationship_changes) {
        Object.keys(character.relationship_changes).forEach(metric => {
          relation[metric] = Math.max(0, Math.min(100, 
            relation[metric] + character.relationship_changes[metric]
          ));
        });
      }
    });

    this.relationshipMatrix.set(this.currentStoryId, relationships);
  }

  /**
   * Update emotional state based on story events
   */
  updateEmotionalState(memory) {
    const emotional = this.emotionalStates.get(this.currentStoryId);
    if (!emotional || !memory.emotionalImpact) return;

    // Update primary emotion if impact is significant
    if (memory.emotionalImpact.primary_emotion && memory.importance >= IMPORTANCE_LEVELS.HIGH) {
      emotional.primary_emotion = memory.emotionalImpact.primary_emotion;
      emotional.emotion_intensity = memory.emotionalImpact.intensity || 50;
      emotional.last_major_emotion = {
        emotion: memory.emotionalImpact.primary_emotion,
        cause: memory.title,
        timestamp: memory.timestamp
      };
    }

    // Add to mood history
    emotional.mood_history.push({
      emotion: memory.emotionalImpact.primary_emotion || emotional.primary_emotion,
      intensity: memory.emotionalImpact.intensity || emotional.emotion_intensity,
      timestamp: memory.timestamp,
      cause: memory.title
    });

    // Keep only last 20 mood entries
    if (emotional.mood_history.length > 20) {
      emotional.mood_history = emotional.mood_history.slice(-20);
    }

    // Update stress and confidence
    if (memory.emotionalImpact.stress_change) {
      emotional.stress_level = Math.max(0, Math.min(100, 
        emotional.stress_level + memory.emotionalImpact.stress_change
      ));
    }

    if (memory.emotionalImpact.confidence_change) {
      emotional.confidence_level = Math.max(0, Math.min(100, 
        emotional.confidence_level + memory.emotionalImpact.confidence_change
      ));
    }

    this.emotionalStates.set(this.currentStoryId, emotional);
  }

  /**
   * Update plot thread tracking
   */
  updatePlotThreads(memory) {
    if (!this.plotThreads.has(this.currentStoryId)) {
      this.plotThreads.set(this.currentStoryId, {});
    }

    const threads = this.plotThreads.get(this.currentStoryId);
    
    // Extract plot thread information from memory
    if (memory.metadata.plot_thread) {
      const threadId = memory.metadata.plot_thread.id;
      
      if (!threads[threadId]) {
        threads[threadId] = {
          id: threadId,
          title: memory.metadata.plot_thread.title || memory.title,
          status: 'active',
          importance: memory.importance,
          start_scene: memory.sceneNumber,
          events: [],
          resolution: null
        };
      }

      threads[threadId].events.push({
        memory_id: memory.id,
        scene: memory.sceneNumber,
        description: memory.description,
        timestamp: memory.timestamp
      });

      // Check if thread is resolved
      if (memory.metadata.plot_thread.resolved) {
        threads[threadId].status = 'resolved';
        threads[threadId].resolution = {
          scene: memory.sceneNumber,
          resolution: memory.metadata.plot_thread.resolution,
          timestamp: memory.timestamp
        };
      }
    }

    this.plotThreads.set(this.currentStoryId, threads);
  }

  /**
   * Get story context for AI - returns relevant memories for scene generation
   */
  getStoryContext(options = {}) {
    const {
      includeRelationships = true,
      includeEmotions = true,
      includeRecentEvents = true,
      includePlotThreads = true,
      maxMemories = 10,
      minImportance = IMPORTANCE_LEVELS.MEDIUM
    } = options;

    const memories = this.memoryCache.get(this.currentStoryId) || [];
    
    // Filter and sort memories by importance and recency
    const relevantMemories = memories
      .filter(memory => memory.importance >= minImportance)
      .sort((a, b) => {
        // Sort by importance first, then recency
        if (a.importance !== b.importance) {
          return b.importance - a.importance;
        }
        return new Date(b.timestamp) - new Date(a.timestamp);
      })
      .slice(0, maxMemories);

    const context = {
      storyId: this.currentStoryId,
      total_memories: memories.length,
      key_events: relevantMemories
    };

    if (includeRelationships) {
      context.relationships = this.relationshipMatrix.get(this.currentStoryId);
    }

    if (includeEmotions) {
      context.emotional_state = this.emotionalStates.get(this.currentStoryId);
    }

    if (includePlotThreads) {
      context.plot_threads = this.plotThreads.get(this.currentStoryId);
    }

    return context;
  }

  /**
   * Get milestone timeline for UI display
   */
  getMilestoneTimeline() {
    const memories = this.memoryCache.get(this.currentStoryId) || [];
    
    return memories
      .filter(memory => memory.importance >= IMPORTANCE_LEVELS.HIGH || memory.type === MEMORY_TYPES.MILESTONE)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map(memory => ({
        id: memory.id,
        title: memory.title,
        description: memory.description,
        timestamp: memory.timestamp,
        sceneNumber: memory.sceneNumber,
        type: memory.type,
        importance: memory.importance,
        characters: memory.characters
      }));
  }

  /**
   * Get character relationship summary
   */
  getRelationshipSummary() {
    const relationships = this.relationshipMatrix.get(this.currentStoryId);
    if (!relationships) return null;

    return {
      self: relationships.self,
      others: Object.keys(relationships.others).map(name => ({
        name,
        ...relationships.others[name],
        relationship_strength: this.calculateRelationshipStrength(relationships.others[name])
      }))
    };
  }

  /**
   * Calculate overall relationship strength
   */
  calculateRelationshipStrength(relationship) {
    const { affection, trust, respect, fear } = relationship;
    // Positive emotions increase strength, fear decreases it
    return Math.max(0, Math.min(100, (affection + trust + respect - fear) / 3));
  }

  /**
   * Save story memory to persistent storage
   */
  async saveStoryMemory() {
    try {
      const storyData = {
        memories: this.memoryCache.get(this.currentStoryId) || [],
        relationships: this.relationshipMatrix.get(this.currentStoryId) || {},
        emotions: this.emotionalStates.get(this.currentStoryId) || {},
        plotThreads: this.plotThreads.get(this.currentStoryId) || {},
        lastSaved: new Date().toISOString()
      };

      await AsyncStorage.setItem(`story_memory_${this.currentStoryId}`, JSON.stringify(storyData));
      console.log(`Story memory saved for: ${this.currentStoryId}`);
    } catch (error) {
      console.error('Failed to save story memory:', error);
    }
  }

  /**
   * Load story memory from persistent storage
   */
  async loadStoryMemory(storyId) {
    try {
      const saved = await AsyncStorage.getItem(`story_memory_${storyId}`);
      if (saved) {
        const storyData = JSON.parse(saved);
        
        this.memoryCache.set(storyId, storyData.memories || []);
        this.relationshipMatrix.set(storyId, storyData.relationships || {});
        this.emotionalStates.set(storyId, storyData.emotions || {});
        this.plotThreads.set(storyId, storyData.plotThreads || {});
        
        console.log(`Story memory loaded for: ${storyId}`);
        return true;
      }
    } catch (error) {
      console.error('Failed to load story memory:', error);
    }
    return false;
  }

  /**
   * Get all saved stories
   */
  async getSavedStories() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const storyKeys = keys.filter(key => key.startsWith('story_memory_'));
      
      const stories = await Promise.all(
        storyKeys.map(async key => {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            const storyId = key.replace('story_memory_', '');
            return {
              storyId,
              lastSaved: parsed.lastSaved,
              memoryCount: parsed.memories?.length || 0,
              characterName: parsed.memories?.[0]?.metadata?.character_name || 'Unknown'
            };
          }
          return null;
        })
      );

      return stories.filter(story => story !== null);
    } catch (error) {
      console.error('Failed to get saved stories:', error);
      return [];
    }
  }

  /**
   * Delete a story's memory
   */
  async deleteStoryMemory(storyId) {
    try {
      await AsyncStorage.removeItem(`story_memory_${storyId}`);
      this.memoryCache.delete(storyId);
      this.relationshipMatrix.delete(storyId);
      this.emotionalStates.delete(storyId);
      this.plotThreads.delete(storyId);
      console.log(`Story memory deleted for: ${storyId}`);
    } catch (error) {
      console.error('Failed to delete story memory:', error);
    }
  }
}

// Export singleton instance
export const storyMemory = new StoryMemorySystem();

// Export helper functions
export const createMemoryEvent = (type, data) => ({
  type,
  importance: data.importance || IMPORTANCE_LEVELS.MEDIUM,
  title: data.title,
  description: data.description,
  playerAction: data.playerAction,
  aiResponse: data.aiResponse,
  characters: data.characters || [],
  consequences: data.consequences || [],
  emotionalImpact: data.emotionalImpact || {},
  tags: data.tags || [],
  metadata: data.metadata || {}
});

export default storyMemory; 