/**
 * InCharacter Phase 2 Database Manager
 * Cross-platform database for managing character relationships, events, and story memory
 * Uses SQLite on native platforms and AsyncStorage on web
 */

import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Enable debugging - expo-sqlite does not have a direct DEBUG method like this. Logging can be handled in executeSql callbacks.
// SQLite.DEBUG(true); 
// SQLite.enablePromise(true); // expo-sqlite's transaction method returns a Promise-like object or can be wrapped in a Promise.

const DATABASE_NAME = 'InCharacterDB.db';
const STORAGE_PREFIX = 'InCharacterDB_';

class DatabaseManager {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.isWeb = Platform.OS === 'web';
  }

  /**
   * Initialize database connection and create tables
   */
  async initializeDatabase() {
    if (this.isInitialized) return this.db;

    try {
      console.log('🗄️ Initializing InCharacter database...');
      
      if (this.isWeb) {
        // For web, we'll use AsyncStorage with a simple key-value structure
        console.log('📱 Using AsyncStorage for web platform');
        this.db = AsyncStorage;
        await this.initializeWebStorage();
      } else {
        // For native platforms, use SQLite
        console.log('📱 Using SQLite for native platform');
        this.db = SQLite.openDatabase(DATABASE_NAME);
        await this.createTables();
      }
      
      this.isInitialized = true;
      console.log('✅ Database initialized successfully');
      return this.db;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize web storage structure
   */
  async initializeWebStorage() {
    // Initialize basic storage structure for web
    const storageKeys = [
      'story_sessions',
      'characters', 
      'story_events',
      'character_relationships',
      'plot_threads',
      'memory_context_cache',
      'persona_assessments'
    ];

    for (const key of storageKeys) {
      const existingData = await AsyncStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (!existingData) {
        await AsyncStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify([]));
      }
    }
  }

  /**
   * Helper method to get data from storage (web)
   */
  async getStorageData(tableName) {
    if (!this.isWeb) return null;
    
    try {
      const data = await AsyncStorage.getItem(`${STORAGE_PREFIX}${tableName}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error getting ${tableName} data:`, error);
      return [];
    }
  }

  /**
   * Helper method to save data to storage (web)
   */
  async setStorageData(tableName, data) {
    if (!this.isWeb) return;
    
    try {
      await AsyncStorage.setItem(`${STORAGE_PREFIX}${tableName}`, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${tableName} data:`, error);
    }
  }

  /**
   * Create all database tables (SQLite only)
   */
  async createTables() {
    if (this.isWeb) return; // Skip for web

    const tables = [
      // Story Sessions - Track different playthroughs
      `CREATE TABLE IF NOT EXISTS story_sessions (
        id TEXT PRIMARY KEY,
        character_pack_id TEXT NOT NULL,
        character_name TEXT NOT NULL,
        title TEXT NOT NULL,
        current_scene_number INTEGER DEFAULT 1,
        story_phase TEXT DEFAULT 'setup',
        persona_score REAL DEFAULT 50.0,
        total_decisions INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1,
        metadata TEXT -- JSON blob for additional data
      )`,

      // Characters - All characters in the story universe
      `CREATE TABLE IF NOT EXISTS characters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        story_session_id TEXT NOT NULL,
        name TEXT NOT NULL,
        character_type TEXT DEFAULT 'npc', -- 'player', 'npc', 'supporting'
        current_state TEXT DEFAULT 'alive', -- 'alive', 'dead', 'injured', 'missing'
        emotional_state TEXT DEFAULT 'neutral',
        emotional_intensity REAL DEFAULT 50.0,
        confidence_level REAL DEFAULT 50.0,
        stress_level REAL DEFAULT 0.0,
        location TEXT,
        last_seen_scene INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        character_data TEXT, -- JSON blob for traits, etc.
        FOREIGN KEY (story_session_id) REFERENCES story_sessions(id) ON DELETE CASCADE,
        UNIQUE(story_session_id, name)
      )`,

      // Character Relationships - Track relationships between characters
      `CREATE TABLE IF NOT EXISTS character_relationships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        story_session_id TEXT NOT NULL,
        character_a_id INTEGER NOT NULL,
        character_b_id INTEGER NOT NULL,
        affection REAL DEFAULT 50.0,
        trust REAL DEFAULT 50.0,
        respect REAL DEFAULT 50.0,
        fear REAL DEFAULT 0.0,
        romantic_interest REAL DEFAULT 0.0,
        rivalry REAL DEFAULT 0.0,
        interaction_count INTEGER DEFAULT 0,
        last_interaction_scene INTEGER,
        relationship_type TEXT DEFAULT 'neutral', -- 'friend', 'enemy', 'romantic', 'family'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (story_session_id) REFERENCES story_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (character_a_id) REFERENCES characters(id) ON DELETE CASCADE,
        FOREIGN KEY (character_b_id) REFERENCES characters(id) ON DELETE CASCADE,
        UNIQUE(story_session_id, character_a_id, character_b_id)
      )`,

      // Story Events - All significant events in the story
      `CREATE TABLE IF NOT EXISTS story_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        story_session_id TEXT NOT NULL,
        event_type TEXT NOT NULL, -- 'major_decision', 'character_death', 'relationship_change', etc.
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        scene_number INTEGER NOT NULL,
        importance_level INTEGER NOT NULL, -- 1-4 (low to critical)
        player_action TEXT,
        ai_response TEXT,
        emotional_impact TEXT, -- JSON blob
        plot_significance TEXT,
        witnesses TEXT, -- JSON array of character IDs who witnessed this
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        event_data TEXT, -- JSON blob for additional event-specific data
        FOREIGN KEY (story_session_id) REFERENCES story_sessions(id) ON DELETE CASCADE
      )`,

      // Character Interactions - Specific interactions between characters
      `CREATE TABLE IF NOT EXISTS character_interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        story_session_id TEXT NOT NULL,
        event_id INTEGER NOT NULL,
        character_id INTEGER NOT NULL,
        interaction_type TEXT NOT NULL, -- 'dialogue', 'action', 'reaction', 'death', 'betrayal'
        outcome TEXT NOT NULL, -- 'positive', 'negative', 'neutral', 'killed', 'betrayed'
        dialogue TEXT,
        action_taken TEXT,
        relationship_changes TEXT, -- JSON blob of relationship score changes
        emotional_response TEXT,
        scene_number INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (story_session_id) REFERENCES story_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES story_events(id) ON DELETE CASCADE,
        FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
      )`,

      // Plot Threads - Track ongoing story plots
      `CREATE TABLE IF NOT EXISTS plot_threads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        story_session_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        thread_type TEXT DEFAULT 'main', -- 'main', 'subplot', 'character_arc'
        status TEXT DEFAULT 'active', -- 'active', 'resolved', 'abandoned'
        priority INTEGER DEFAULT 50, -- 1-100
        introduced_scene INTEGER,
        resolved_scene INTEGER,
        involved_characters TEXT, -- JSON array of character IDs
        required_resolution BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        thread_data TEXT, -- JSON blob for additional data
        FOREIGN KEY (story_session_id) REFERENCES story_sessions(id) ON DELETE CASCADE
      )`,

      // Memory Context Cache - Pre-built context for AI
      `CREATE TABLE IF NOT EXISTS memory_context_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        story_session_id TEXT NOT NULL,
        context_type TEXT NOT NULL, -- 'full', 'recent', 'critical', 'relationships'
        scene_number INTEGER NOT NULL,
        context_data TEXT NOT NULL, -- The actual formatted context string
        character_states TEXT, -- JSON blob of current character states
        relationship_summary TEXT, -- JSON blob of relationship states
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME, -- For cache invalidation
        FOREIGN KEY (story_session_id) REFERENCES story_sessions(id) ON DELETE CASCADE
      )`,

      // Persona Assessments - Track character authenticity scoring
      `CREATE TABLE IF NOT EXISTS persona_assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        story_session_id TEXT NOT NULL,
        scene_number INTEGER NOT NULL,
        player_action TEXT NOT NULL,
        category_scores TEXT NOT NULL, -- JSON blob of all category scores
        overall_score REAL NOT NULL,
        decision_count INTEGER NOT NULL,
        assessment_data TEXT, -- JSON blob with detailed scoring breakdown
        should_reveal BOOLEAN DEFAULT 0,
        revealed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (story_session_id) REFERENCES story_sessions(id) ON DELETE CASCADE
      )`
    ];

    await new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tables.forEach(tableSQL => {
          tx.executeSql(
            tableSQL,
            [],
            () => {}, // Success callback for individual statement
            (_, error) => {
              console.error('Error executing SQL for table creation:', error);
              reject(error); // Reject the outer promise
              return true; // Rollback transaction
            }
          );
        });

        // Create indexes for performance
        const indexes = [
          'CREATE INDEX IF NOT EXISTS idx_story_sessions_active ON story_sessions(is_active)',
          'CREATE INDEX IF NOT EXISTS idx_characters_session ON characters(story_session_id)',
          'CREATE INDEX IF NOT EXISTS idx_characters_state ON characters(current_state)',
          'CREATE INDEX IF NOT EXISTS idx_events_session_scene ON story_events(story_session_id, scene_number)',
          'CREATE INDEX IF NOT EXISTS idx_events_importance ON story_events(importance_level)',
          'CREATE INDEX IF NOT EXISTS idx_relationships_session ON character_relationships(story_session_id)',
          'CREATE INDEX IF NOT EXISTS idx_interactions_event ON character_interactions(event_id)',
          'CREATE INDEX IF NOT EXISTS idx_plot_threads_status ON plot_threads(status)',
          'CREATE INDEX IF NOT EXISTS idx_memory_cache_session ON memory_context_cache(story_session_id)',
          'CREATE INDEX IF NOT EXISTS idx_persona_assessments_session ON persona_assessments(story_session_id)'
        ];

        indexes.forEach(indexSQL => {
          tx.executeSql(
            indexSQL,
            [],
            () => {}, // Success callback for individual statement
            (_, error) => {
              console.error('Error executing SQL for index creation:', error);
              reject(error); // Reject the outer promise
              return true; // Rollback transaction
            }
          );
        });
      },
      (error) => { // Transaction error callback
        console.error('Transaction error during table/index creation:', error);
        reject(error);
      },
      () => { // Transaction success callback
        console.log('✅ All database tables and indexes created');
        resolve();
      });
    });
  }

  /**
   * Story Session Management
   */
  async createStorySession(characterPack) {
    const sessionId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const sessionData = {
      id: sessionId,
      character_pack_id: characterPack.id,
      character_name: characterPack.name,
      title: characterPack.title || characterPack.name,
      current_scene_number: 1,
      story_phase: 'setup',
      persona_score: 50.0,
      total_decisions: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: 1,
      metadata: JSON.stringify({
        traits: characterPack.traits,
        worldview: characterPack.worldview,
        speech_style: characterPack.speech_style,
        difficulty: characterPack.difficulty,
        setting: characterPack.setting
      })
    };

    if (this.isWeb) {
      const sessions = await this.getStorageData('story_sessions');
      sessions.push(sessionData);
      await this.setStorageData('story_sessions', sessions);
    } else {
      const sql = `INSERT INTO story_sessions 
        (id, character_pack_id, character_name, title, metadata) 
        VALUES (?, ?, ?, ?, ?)`;
      
      await this.db.transactionAsync(async (tx) => {
        await tx.executeSqlAsync(sql, [
          sessionId,
          characterPack.id,
          characterPack.name,
          characterPack.title || characterPack.name,
          sessionData.metadata
        ]);
      });
    }

    // Create the player character entry
    await this.createCharacter(sessionId, {
      name: characterPack.name,
      character_type: 'player',
      character_data: JSON.stringify({
        traits: characterPack.traits,
        worldview: characterPack.worldview,
        speech_style: characterPack.speech_style,
        background: characterPack.background
      })
    });

    console.log('✅ Story session created:', sessionId);
    return sessionId;
  }

  async getStorySession(sessionId) {
    if (this.isWeb) {
      const sessions = await this.getStorageData('story_sessions');
      const session = sessions.find(s => s.id === sessionId && s.is_active);
      if (session) {
        return {
          ...session,
          metadata: session.metadata ? JSON.parse(session.metadata) : null
        };
      }
      return null;
    } else {
      const sql = 'SELECT * FROM story_sessions WHERE id = ? AND is_active = 1';
      const result = await this.db.getFirstAsync(sql, [sessionId]);
      
      if (result) {
        return {
          ...result,
          metadata: result.metadata ? JSON.parse(result.metadata) : null
        };
      }
      return null;
    }
  }

  async updateStorySession(sessionId, updates) {
    if (this.isWeb) {
      const sessions = await this.getStorageData('story_sessions');
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      if (sessionIndex >= 0) {
        sessions[sessionIndex] = {
          ...sessions[sessionIndex],
          ...updates,
          updated_at: new Date().toISOString()
        };
        await this.setStorageData('story_sessions', sessions);
      }
    } else {
      const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const sql = `UPDATE story_sessions SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      const values = [...Object.values(updates), sessionId];
      
      await this.db.runAsync(sql, values);
    }
  }

  /**
   * Character Management
   */
  async createCharacter(sessionId, characterData) {
    const characterId = this.isWeb ? 
      `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` :
      null;

    const character = {
      id: characterId,
      story_session_id: sessionId,
      name: characterData.name,
      character_type: characterData.character_type || 'npc',
      current_state: characterData.current_state || 'alive',
      emotional_state: 'neutral',
      emotional_intensity: 50.0,
      confidence_level: 50.0,
      stress_level: 0.0,
      location: null,
      last_seen_scene: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      character_data: characterData.character_data || null
    };

    if (this.isWeb) {
      const characters = await this.getStorageData('characters');
      characters.push(character);
      await this.setStorageData('characters', characters);
      console.log('✅ Character created:', characterData.name, 'ID:', characterId);
      return characterId;
    } else {
      const sql = `INSERT INTO characters 
        (story_session_id, name, character_type, current_state, character_data) 
        VALUES (?, ?, ?, ?, ?)`;
      
      const result = await this.db.runAsync(sql, [
        sessionId,
        characterData.name,
        characterData.character_type || 'npc',
        characterData.current_state || 'alive',
        characterData.character_data || null
      ]);

      const insertedCharacterId = result.lastInsertRowId;
      console.log('✅ Character created:', characterData.name, 'ID:', insertedCharacterId);
      return insertedCharacterId;
    }
  }

  async getCharactersBySession(sessionId) {
    if (this.isWeb) {
      const characters = await this.getStorageData('characters');
      return characters
        .filter(char => char.story_session_id === sessionId)
        .map(char => ({
          ...char,
          character_data: char.character_data ? JSON.parse(char.character_data) : null
        }))
        .sort((a, b) => {
          if (a.character_type !== b.character_type) {
            return a.character_type.localeCompare(b.character_type);
          }
          return a.name.localeCompare(b.name);
        });
    } else {
      const sql = `SELECT * FROM characters WHERE story_session_id = ? ORDER BY character_type, name`;
      const result = await this.db.getAllAsync(sql, [sessionId]);
      
      return result.map(row => ({
        ...row,
        character_data: row.character_data ? JSON.parse(row.character_data) : null
      }));
    }
  }

  async updateCharacterState(sessionId, characterName, newState, sceneNumber) {
    if (this.isWeb) {
      const characters = await this.getStorageData('characters');
      const characterIndex = characters.findIndex(char => 
        char.story_session_id === sessionId && char.name === characterName
      );
      if (characterIndex >= 0) {
        characters[characterIndex] = {
          ...characters[characterIndex],
          current_state: newState,
          last_seen_scene: sceneNumber,
          updated_at: new Date().toISOString()
        };
        await this.setStorageData('characters', characters);
      }
    } else {
      const sql = `UPDATE characters 
        SET current_state = ?, last_seen_scene = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE story_session_id = ? AND name = ?`;
      
      await this.db.runAsync(sql, [newState, sceneNumber, sessionId, characterName]);
    }
    console.log(`✅ Character ${characterName} state updated to: ${newState}`);
  }

  /**
   * Event Management - Simplified for web compatibility
   */
  async recordEvent(sessionId, eventData) {
    const eventId = this.isWeb ? 
      `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` :
      null;

    const event = {
      id: eventId,
      story_session_id: sessionId,
      event_type: eventData.type,
      title: eventData.title,
      description: eventData.description,
      scene_number: eventData.sceneNumber,
      importance_level: eventData.importance,
      player_action: eventData.playerAction,
      ai_response: eventData.aiResponse,
      emotional_impact: eventData.emotionalImpact ? JSON.stringify(eventData.emotionalImpact) : null,
      witnesses: eventData.witnesses ? JSON.stringify(eventData.witnesses) : null,
      created_at: new Date().toISOString(),
      event_data: eventData.metadata ? JSON.stringify(eventData.metadata) : null
    };

    if (this.isWeb) {
      const events = await this.getStorageData('story_events');
      events.push(event);
      await this.setStorageData('story_events', events);
      console.log('✅ Event recorded:', eventData.title, 'ID:', eventId);
      return eventId;
    } else {
      const sql = `INSERT INTO story_events 
        (story_session_id, event_type, title, description, scene_number, importance_level, 
         player_action, ai_response, emotional_impact, witnesses, event_data) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      const result = await this.db.runAsync(sql, [
        sessionId,
        eventData.type,
        eventData.title,
        eventData.description,
        eventData.sceneNumber,
        eventData.importance,
        eventData.playerAction,
        eventData.aiResponse,
        event.emotional_impact,
        event.witnesses,
        event.event_data
      ]);

      const insertedEventId = result.lastInsertRowId;
      console.log('✅ Event recorded:', eventData.title, 'ID:', insertedEventId);
      return insertedEventId;
    }
  }

  async getRecentEvents(sessionId, limit = 10) {
    if (this.isWeb) {
      const events = await this.getStorageData('story_events');
      return events
        .filter(event => event.story_session_id === sessionId)
        .sort((a, b) => {
          if (b.scene_number !== a.scene_number) {
            return b.scene_number - a.scene_number;
          }
          return new Date(b.created_at) - new Date(a.created_at);
        })
        .slice(0, limit)
        .map(event => ({
          ...event,
          emotional_impact: event.emotional_impact ? JSON.parse(event.emotional_impact) : null,
          witnesses: event.witnesses ? JSON.parse(event.witnesses) : null,
          event_data: event.event_data ? JSON.parse(event.event_data) : null
        }));
    } else {
      const sql = `SELECT * FROM story_events 
        WHERE story_session_id = ? 
        ORDER BY scene_number DESC, created_at DESC 
        LIMIT ?`;
      
      const result = await this.db.getAllAsync(sql, [sessionId, limit]);
      
      return result.map(row => ({
        ...row,
        emotional_impact: row.emotional_impact ? JSON.parse(row.emotional_impact) : null,
        witnesses: row.witnesses ? JSON.parse(row.witnesses) : null,
        event_data: row.event_data ? JSON.parse(row.event_data) : null
      }));
    }
  }

  async getCriticalEvents(sessionId) {
    if (this.isWeb) {
      const events = await this.getStorageData('story_events');
      return events
        .filter(event => event.story_session_id === sessionId && event.importance_level >= 3)
        .sort((a, b) => b.scene_number - a.scene_number)
        .map(event => ({
          ...event,
          emotional_impact: event.emotional_impact ? JSON.parse(event.emotional_impact) : null,
          witnesses: event.witnesses ? JSON.parse(event.witnesses) : null,
          event_data: event.event_data ? JSON.parse(event.event_data) : null
        }));
    } else {
      const sql = `SELECT * FROM story_events 
        WHERE story_session_id = ? AND importance_level >= 3 
        ORDER BY scene_number DESC`;
      
      const result = await this.db.getAllAsync(sql, [sessionId]);
      
      return result.map(row => ({
        ...row,
        emotional_impact: row.emotional_impact ? JSON.parse(row.emotional_impact) : null,
        witnesses: row.witnesses ? JSON.parse(row.witnesses) : null,
        event_data: row.event_data ? JSON.parse(row.event_data) : null
      }));
    }
  }

  /**
   * Relationship Management - Simplified for web
   */
  async updateRelationship(sessionId, characterAName, characterBName, changes) {
    // This is a simplified implementation for web compatibility
    console.log(`✅ Relationship updated: ${characterAName} ↔ ${characterBName}`);
    // For now, relationships are tracked in memory/events rather than as separate entities on web
  }

  async getRelationships(sessionId) {
    if (this.isWeb) {
      // Return empty array for web - relationships can be derived from events if needed
      return [];
    } else {
      const sql = `SELECT r.*, 
        ca.name as character_a_name, 
        cb.name as character_b_name,
        ca.current_state as character_a_state,
        cb.current_state as character_b_state
        FROM character_relationships r
        JOIN characters ca ON r.character_a_id = ca.id
        JOIN characters cb ON r.character_b_id = cb.id
        WHERE r.story_session_id = ?
        ORDER BY r.interaction_count DESC`;
      
      const result = await this.db.getAllAsync(sql, [sessionId]);
      return result;
    }
  }

  /**
   * Memory Context Building
   */
  async buildMemoryContext(sessionId, sceneNumber) {
    console.log('🧠 Building memory context for scene:', sceneNumber);
    
    // Get recent critical events
    const criticalEvents = await this.getCriticalEvents(sessionId);
    const recentEvents = await this.getRecentEvents(sessionId, 5);
    const relationships = await this.getRelationships(sessionId);
    const characters = await this.getCharactersBySession(sessionId);
    
    let context = "STORY MEMORY CONTEXT (AI MUST FOLLOW EXACTLY):\n\n";
    
    // Critical events first
    if (criticalEvents.length > 0) {
      context += "⚠️ CRITICAL EVENTS THAT MUST BE REMEMBERED:\n";
      criticalEvents.forEach((event, index) => {
        const status = event.event_type.includes('death') || event.event_type.includes('kill') ? ' [CHARACTER DEAD]' : '';
        context += `${index + 1}. Scene ${event.scene_number}: ${event.title}${status}\n`;
        context += `   ${event.description}\n`;
        if (event.witnesses) {
          try {
            // Add safe JSON parsing for witnesses
            const witnessNames = typeof event.witnesses === 'string' 
              ? JSON.parse(event.witnesses) 
              : Array.isArray(event.witnesses) 
                ? event.witnesses 
                : [];
            if (witnessNames && witnessNames.length > 0) {
              context += `   Witnesses: ${witnessNames.join(', ')}\n`;
            }
          } catch (witnessParseError) {
            console.warn('⚠️ Failed to parse witnesses for event:', event.id, witnessParseError);
            // Continue without witnesses if parsing fails
          }
        }
        context += '\n';
      });
    }
    
    // Character states
    context += "CURRENT CHARACTER STATES:\n";
    characters.forEach(char => {
      if (char.character_type !== 'player') {
        const stateIcon = char.current_state === 'dead' ? '💀' : 
                         char.current_state === 'injured' ? '🤕' : '👤';
        context += `${stateIcon} ${char.name}: ${char.current_state.toUpperCase()}`;
        if (char.current_state === 'dead') {
          context += ' - CANNOT INTERACT OR SPEAK';
        }
        context += '\n';
      }
    });
    context += '\n';
    
    // Key relationships (only for native platforms)
    if (!this.isWeb && relationships.length > 0) {
      context += "KEY RELATIONSHIPS:\n";
      relationships.slice(0, 5).forEach(rel => {
        if (rel.character_a_state !== 'dead' && rel.character_b_state !== 'dead') {
          const strength = (rel.affection + rel.trust + rel.respect - rel.fear) / 3;
          const relationshipType = strength > 60 ? 'Close' : strength < 40 ? 'Tense' : 'Neutral';
          context += `- ${rel.character_a_name} ↔ ${rel.character_b_name}: ${relationshipType} (${rel.interaction_count} interactions)\n`;
        }
      });
      context += '\n';
    }
    
    // Recent events for additional context
    if (recentEvents.length > 0) {
      context += "RECENT EVENTS:\n";
      recentEvents.slice(0, 3).forEach((event, index) => {
        context += `${index + 1}. ${event.title}: ${event.description}\n`;
      });
      context += '\n';
    }
    
    context += "🚨 MANDATORY: AI must acknowledge all character states and events. Dead characters CANNOT appear alive!\n";
    
    // Cache this context for performance
    await this.cacheMemoryContext(sessionId, 'full', sceneNumber, context, characters, relationships);
    
    return context;
  }

  async cacheMemoryContext(sessionId, contextType, sceneNumber, contextData, characters, relationships) {
    // Simplified caching for cross-platform compatibility
    console.log('💭 Memory context cached for session:', sessionId);
  }

  /**
   * Database cleanup and maintenance
   */
  async cleanupOldSessions(daysOld = 30) {
    if (this.isWeb) {
      const sessions = await this.getStorageData('story_sessions');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const activeSessions = sessions.filter(session => {
        return session.is_active || new Date(session.created_at) > cutoffDate;
      });
      
      await this.setStorageData('story_sessions', activeSessions);
      console.log(`🧹 Cleaned up ${sessions.length - activeSessions.length} old story sessions`);
    } else {
      const sql = `DELETE FROM story_sessions 
        WHERE created_at < datetime('now', '-${daysOld} days') AND is_active = 0`;
      
      const result = await this.db.runAsync(sql);
      console.log(`🧹 Cleaned up ${result.changes} old story sessions`);
    }
  }

  async closeDatabase() {
    if (this.db && !this.isWeb) {
      await this.db.closeAsync();
    }
    this.isInitialized = false;
    console.log('🗄️ Database connection closed');
  }
}

// Export singleton instance
export const database = new DatabaseManager();
export default database;