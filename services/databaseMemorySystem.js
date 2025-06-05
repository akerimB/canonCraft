/**
 * Database-Powered Memory System for Phase 2
 * Replaces the simple AsyncStorage approach with proper relational database
 */

import database from './database';

// Memory importance levels (matching database schema)
export const IMPORTANCE_LEVELS = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
};

// Event types for better categorization
export const EVENT_TYPES = {
  MAJOR_DECISION: 'major_decision',
  CHARACTER_DEATH: 'character_death',
  CHARACTER_INTERACTION: 'character_interaction',
  RELATIONSHIP_CHANGE: 'relationship_change',
  PLOT_DEVELOPMENT: 'plot_development',
  EMOTIONAL_MOMENT: 'emotional_moment',
  MILESTONE: 'milestone',
  BETRAYAL: 'betrayal',
  ROMANCE: 'romance',
  CONFLICT: 'conflict',
  DISCOVERY: 'discovery'
};

class DatabaseMemorySystem {
  constructor() {
    this.currentSessionId = null;
    this.isInitialized = false;
  }

  /**
   * Initialize memory system with database
   */
  async initializeStory(characterPack, storyId = null) {
    try {
      console.log('🧠 Initializing database memory system...');
      
      // Validate characterPack
      if (!characterPack) {
        throw new Error('Character pack is required');
      }
      
      if (!characterPack.name) {
        console.warn('⚠️ Character pack missing name, using default');
        characterPack.name = 'Unknown Character';
      }

      if (!characterPack.id) {
        console.warn('⚠️ Character pack missing id, generating one');
        characterPack.id = `char_${Date.now()}`;
      }

      if (!characterPack.title) {
        console.warn('⚠️ Character pack missing title, using default');
        characterPack.title = `Story of ${characterPack.name}`;
      }
      
      // Initialize database
      await database.initializeDatabase();
      
      // Create new story session
      if (!storyId) {
        this.currentSessionId = await database.createStorySession(characterPack);
      } else {
        this.currentSessionId = storyId;
      }
      
      // Initialize common NPCs for this character's world
      await this.initializeWorldCharacters(characterPack);
      
      this.isInitialized = true;
      console.log('✅ Database memory system initialized for session:', this.currentSessionId);
      
      return {
        sessionId: this.currentSessionId,
        memoryInitialized: true,
        databaseEnabled: true
      };
    } catch (error) {
      console.error('❌ Database memory initialization failed:', error);
      return {
        sessionId: null,
        memoryInitialized: false,
        databaseEnabled: false,
        error: error.message
      };
    }
  }

  /**
   * Initialize characters specific to each literary world
   */
  async initializeWorldCharacters(characterPack) {
    const worldCharacters = this.getWorldCharacters(characterPack);
    
    for (const character of worldCharacters) {
      await database.createCharacter(this.currentSessionId, {
        name: character.name,
        character_type: character.type || 'npc',
        current_state: 'alive',
        character_data: JSON.stringify(character.traits || {})
      });
      
      console.log(`👤 Initialized character: ${character.name}`);
    }
  }

  /**
   * Get characters specific to each literary world
   */
  getWorldCharacters(characterPack) {
    // Add safety check for characterPack.name
    if (!characterPack || !characterPack.name || typeof characterPack.name !== 'string') {
      console.warn('⚠️ Invalid character pack data, using default characters');
      return [
        { name: 'Mysterious Stranger', type: 'npc', traits: { unknown: true } }
      ];
    }

    const characterName = characterPack.name.toLowerCase();
    
    if (characterName.includes('holmes')) {
      return [
        { name: 'Dr. Watson', type: 'supporting', traits: { loyal: true, medical: true } },
        { name: 'Mrs. Hudson', type: 'npc', traits: { landlady: true, helpful: true } },
        { name: 'Inspector Lestrade', type: 'npc', traits: { police: true, skeptical: true } },
        { name: 'Professor Moriarty', type: 'npc', traits: { enemy: true, genius: true } }
      ];
    } else if (characterName.includes('elizabeth') || characterName.includes('bennet')) {
      return [
        { name: 'Jane Bennet', type: 'supporting', traits: { sister: true, gentle: true } },
        { name: 'Mr. Darcy', type: 'supporting', traits: { proud: true, wealthy: true } },
        { name: 'Mr. Bingley', type: 'supporting', traits: { cheerful: true, wealthy: true } },
        { name: 'Mr. Wickham', type: 'npc', traits: { charming: true, deceptive: true } },
        { name: 'Charlotte Lucas', type: 'npc', traits: { practical: true, friend: true } }
      ];
    } else if (characterName.includes('dracula')) {
      return [
        { name: 'Renfield', type: 'supporting', traits: { servant: true, mad: true } },
        { name: 'Van Helsing', type: 'npc', traits: { hunter: true, knowledgeable: true } },
        { name: 'Mina Harker', type: 'npc', traits: { intelligent: true, vulnerable: true } },
        { name: 'Jonathan Harker', type: 'npc', traits: { solicitor: true, brave: true } }
      ];
    } else if (characterName.includes('hamlet')) {
      return [
        { name: 'Ophelia', type: 'supporting', traits: { innocent: true, fragile: true } },
        { name: 'Claudius', type: 'npc', traits: { king: true, guilty: true } },
        { name: 'Gertrude', type: 'npc', traits: { mother: true, conflicted: true } },
        { name: 'Horatio', type: 'supporting', traits: { friend: true, loyal: true } },
        { name: 'Polonius', type: 'npc', traits: { advisor: true, meddling: true } }
      ];
    }
    
    // Default characters for unknown worlds
    return [
      { name: 'Mysterious Stranger', type: 'npc', traits: { unknown: true } }
    ];
  }

  /**
   * Record a memory event with full database integration
   */
  async recordMemory(eventData) {
    if (!this.isInitialized) {
      console.warn('Memory system not initialized');
      return null;
    }

    try {
      // Determine event type and importance
      const eventType = this.categorizeEvent(eventData);
      const importance = this.determineImportance(eventData);
      
      // Extract witnesses from the event
      const witnesses = this.extractWitnesses(eventData);
      
      // Record the main event
      const eventId = await database.recordEvent(this.currentSessionId, {
        type: eventType,
        title: eventData.title,
        description: eventData.description,
        sceneNumber: eventData.sceneNumber,
        importance: importance,
        playerAction: eventData.playerAction,
        aiResponse: eventData.aiResponse,
        emotionalImpact: eventData.emotionalImpact,
        witnesses: witnesses,
        metadata: eventData.metadata
      });

      // Update character states if necessary
      await this.updateCharacterStatesFromEvent(eventData);
      
      // Update relationships
      await this.updateRelationshipsFromEvent(eventData);
      
      // Record specific character interactions
      if (eventData.characters && eventData.characters.length > 0) {
        for (const characterInteraction of eventData.characters) {
          await this.recordCharacterInteraction(eventId, characterInteraction, eventData.sceneNumber);
        }
      }

      console.log('✅ Memory event recorded with ID:', eventId);
      return {
        id: eventId,
        sessionId: this.currentSessionId,
        type: eventType,
        importance: importance,
        witnesses: witnesses
      };
      
    } catch (error) {
      console.error('❌ Failed to record memory:', error);
      return null;
    }
  }

  /**
   * Categorize event based on content
   */
  categorizeEvent(eventData) {
    const description = eventData.description.toLowerCase();
    const playerAction = (eventData.playerAction || '').toLowerCase();
    
    if (description.includes('death') || description.includes('kill') || description.includes('murder')) {
      return EVENT_TYPES.CHARACTER_DEATH;
    }
    if (description.includes('betray') || playerAction.includes('betray')) {
      return EVENT_TYPES.BETRAYAL;
    }
    if (description.includes('love') || description.includes('kiss') || description.includes('romance')) {
      return EVENT_TYPES.ROMANCE;
    }
    if (description.includes('discover') || description.includes('reveal') || description.includes('secret')) {
      return EVENT_TYPES.DISCOVERY;
    }
    if (description.includes('fight') || description.includes('attack') || description.includes('battle')) {
      return EVENT_TYPES.CONFLICT;
    }
    if (eventData.characters && eventData.characters.length > 0) {
      return EVENT_TYPES.CHARACTER_INTERACTION;
    }
    
    return EVENT_TYPES.MAJOR_DECISION;
  }

  /**
   * Determine importance based on event content
   */
  determineImportance(eventData) {
    const description = eventData.description.toLowerCase();
    
    if (description.includes('death') || description.includes('murder') || description.includes('kill')) {
      return IMPORTANCE_LEVELS.CRITICAL;
    }
    if (description.includes('betray') || description.includes('love') || description.includes('discover')) {
      return IMPORTANCE_LEVELS.HIGH;
    }
    if (eventData.characters && eventData.characters.length > 1) {
      return IMPORTANCE_LEVELS.HIGH;
    }
    
    return eventData.importance || IMPORTANCE_LEVELS.MEDIUM;
  }

  /**
   * Extract witnesses from event data
   */
  extractWitnesses(eventData) {
    const witnesses = [];
    
    if (eventData.characters) {
      witnesses.push(...eventData.characters.map(char => char.name));
    }
    
    // Look for character names in the description
    const description = eventData.description;
    const commonNames = ['Watson', 'Holmes', 'Elizabeth', 'Darcy', 'Dracula', 'Renfield', 
                        'Hamlet', 'Ophelia', 'Claudius', 'Jane', 'Bingley', 'Charlotte'];
    
    commonNames.forEach(name => {
      if (description.includes(name) && !witnesses.includes(name)) {
        witnesses.push(name);
      }
    });
    
    return witnesses;
  }

  /**
   * Update character states based on events
   */
  async updateCharacterStatesFromEvent(eventData) {
    const description = eventData.description.toLowerCase();
    
    // Check for character deaths
    if (description.includes('death') || description.includes('kill') || description.includes('murder')) {
      // Try to identify who died
      const witnesses = this.extractWitnesses(eventData);
      
      for (const characterName of witnesses) {
        // Check if this character is the victim
        const context = this.getCharacterContext(description, characterName);
        if (context.includes('kill') || context.includes('death') || context.includes('murder')) {
          await database.updateCharacterState(this.currentSessionId, characterName, 'dead', eventData.sceneNumber);
          console.log(`💀 Character ${characterName} marked as dead`);
        }
      }
    }
  }

  /**
   * Get context around a character name in text
   */
  getCharacterContext(text, characterName) {
    const sentences = text.split('.');
    const relevantSentences = sentences.filter(sentence => 
      sentence.toLowerCase().includes(characterName.toLowerCase())
    );
    return relevantSentences.join('. ').toLowerCase();
  }

  /**
   * Update relationships based on events
   */
  async updateRelationshipsFromEvent(eventData) {
    if (!eventData.characters || eventData.characters.length === 0) return;

    for (const characterInteraction of eventData.characters) {
      if (characterInteraction.relationship_changes) {
        // Update relationship with the player character
        await database.updateRelationship(
          this.currentSessionId,
          eventData.metadata?.character_name || 'Player',
          characterInteraction.name,
          characterInteraction.relationship_changes
        );
        
        console.log(`💝 Updated relationship: Player ↔ ${characterInteraction.name}`);
      }
    }
  }

  /**
   * Record specific character interaction
   */
  async recordCharacterInteraction(eventId, characterInteraction, sceneNumber) {
    // This would need additional database queries to get character ID
    // For now, we'll log the interaction
    console.log(`🗣️ Character interaction: ${characterInteraction.name} (${characterInteraction.outcome})`);
  }

  /**
   * Get story context for AI generation
   */
  async getStoryContext(options = {}) {
    if (!this.isInitialized) {
      return { key_events: [], relationships: {}, emotional_state: {} };
    }

    try {
      // Use database to build comprehensive context
      const memoryContext = await database.buildMemoryContext(this.currentSessionId, options.sceneNumber || 1);
      
      // Get structured data for backward compatibility
      const recentEvents = await database.getRecentEvents(this.currentSessionId, 10);
      const criticalEvents = await database.getCriticalEvents(this.currentSessionId);
      const relationships = await database.getRelationships(this.currentSessionId);
      const characters = await database.getCharactersBySession(this.currentSessionId);
      
      return {
        // Formatted context for AI
        formatted_context: memoryContext,
        
        // Structured data for compatibility
        key_events: [...criticalEvents, ...recentEvents].slice(0, 15),
        relationships: this.formatRelationshipsForCompatibility(relationships),
        characters: characters,
        emotional_state: {
          primary_emotion: 'determined',
          emotion_intensity: 60
        },
        
        // Database-specific data
        session_id: this.currentSessionId,
        total_events: recentEvents.length + criticalEvents.length,
        critical_events_count: criticalEvents.length
      };
      
    } catch (error) {
      console.error('❌ Failed to get story context:', error);
      return { key_events: [], relationships: {}, emotional_state: {} };
    }
  }

  /**
   * Format relationships for backward compatibility
   */
  formatRelationshipsForCompatibility(relationships) {
    const formatted = { others: {} };
    
    relationships.forEach(rel => {
      if (rel.character_a_name !== 'Player') {
        formatted.others[rel.character_a_name] = {
          affection: rel.affection,
          trust: rel.trust,
          respect: rel.respect,
          fear: rel.fear,
          interaction_count: rel.interaction_count,
          relationship_type: rel.relationship_type
        };
      }
      if (rel.character_b_name !== 'Player') {
        formatted.others[rel.character_b_name] = {
          affection: rel.affection,
          trust: rel.trust,
          respect: rel.respect,
          fear: rel.fear,
          interaction_count: rel.interaction_count,
          relationship_type: rel.relationship_type
        };
      }
    });
    
    return formatted;
  }

  /**
   * Save current session state
   */
  async saveStoryMemory() {
    if (!this.isInitialized) return false;
    
    try {
      // Database automatically saves everything, but we can update session metadata
      await database.updateStorySession(this.currentSessionId, {
        updated_at: new Date().toISOString()
      });
      
      console.log('✅ Story memory saved to database');
      return true;
    } catch (error) {
      console.error('❌ Failed to save story memory:', error);
      return false;
    }
  }

  /**
   * Load story memory from database
   */
  async loadStoryMemory(sessionId) {
    try {
      console.log('📖 Loading story memory from database:', sessionId);
      
      await database.initializeDatabase();
      const session = await database.getStorySession(sessionId);
      
      if (session) {
        this.currentSessionId = sessionId;
        this.isInitialized = true;
        
        console.log('✅ Story memory loaded successfully');
        return {
          sessionId: sessionId,
          character: session.character_name,
          title: session.title,
          scene_number: session.current_scene_number,
          persona_score: session.persona_score
        };
      } else {
        console.warn('⚠️ Session not found in database');
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to load story memory:', error);
      return null;
    }
  }

  /**
   * Get all saved stories
   */
  async getSavedStories() {
    try {
      await database.initializeDatabase();
      
      const sql = 'SELECT * FROM story_sessions WHERE is_active = 1 ORDER BY updated_at DESC';
      const result = await database.db.executeSql(sql);
      
      const stories = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        const row = result[0].rows.item(i);
        stories.push({
          id: row.id,
          character: row.character_name,
          title: row.title,
          scene_number: row.current_scene_number,
          persona_score: row.persona_score,
          last_played: row.updated_at,
          metadata: row.metadata ? JSON.parse(row.metadata) : null
        });
      }
      
      return stories;
    } catch (error) {
      console.error('❌ Failed to get saved stories:', error);
      return [];
    }
  }

  /**
   * Delete story memory
   */
  async deleteStoryMemory(sessionId) {
    try {
      await database.updateStorySession(sessionId, { is_active: 0 });
      console.log('🗑️ Story memory marked as deleted');
      return true;
    } catch (error) {
      console.error('❌ Failed to delete story memory:', error);
      return false;
    }
  }

  /**
   * Get memory statistics
   */
  async getMemoryStats() {
    if (!this.isInitialized) return null;
    
    try {
      const events = await database.getRecentEvents(this.currentSessionId, 100);
      const relationships = await database.getRelationships(this.currentSessionId);
      const characters = await database.getCharactersBySession(this.currentSessionId);
      
      return {
        total_events: events.length,
        critical_events: events.filter(e => e.importance_level >= IMPORTANCE_LEVELS.CRITICAL).length,
        total_characters: characters.length,
        active_relationships: relationships.length,
        dead_characters: characters.filter(c => c.current_state === 'dead').length
      };
    } catch (error) {
      console.error('❌ Failed to get memory stats:', error);
      return null;
    }
  }
}

// Create memory event helper function
export const createMemoryEvent = (type, data) => ({
  type,
  title: data.title || 'Untitled Event',
  description: data.description || '',
  sceneNumber: data.sceneNumber || 1,
  importance: data.importance || IMPORTANCE_LEVELS.MEDIUM,
  playerAction: data.playerAction,
  aiResponse: data.aiResponse,
  characters: data.characters || [],
  emotionalImpact: data.emotionalImpact,
  metadata: data.metadata,
  timestamp: new Date().toISOString()
});

// Export singleton instance
export const databaseMemory = new DatabaseMemorySystem();
export default databaseMemory; 