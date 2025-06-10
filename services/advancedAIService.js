/**
 * CanonCraft Phase 9: Advanced AI Service
 * Revolutionary AI features including emotional memory, predictive storytelling, and cross-story continuity
 */

import { openai } from '../config.js';
import { databaseMemory } from './databaseMemorySystem.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Advanced AI configuration for Phase 9
const ADVANCED_AI_CONFIG = {
  GPT4_TURBO: {
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    max_tokens: 2000
  },
  EMOTIONAL_MEMORY: {
    model: 'gpt-4o-mini',
    temperature: 0.6,
    max_tokens: 800
  },
  PREDICTIVE_ANALYSIS: {
    model: 'gpt-4o-mini',
    temperature: 0.8,
    max_tokens: 1000
  },
  CROSS_STORY_MEMORY: {
    retention_days: 30,
    max_memories_per_character: 100,
    emotional_weight_threshold: 0.6
  }
};

class AdvancedAIService {
  constructor() {
    this.emotionalMemories = new Map(); // characterId -> emotional states
    this.playerPreferences = new Map(); // userId -> preference patterns
    this.crossStoryMemories = new Map(); // characterId -> cross-story experiences
    this.predictiveCache = new Map(); // cache for story predictions
  }

  /**
   * Phase 9: Enhanced scene generation with GPT-4 Turbo
   */
  async generateSceneWithAdvancedAI(characterPack, playerAction, context = {}) {
    try {
      console.log('🚀 Generating scene with GPT-4 Turbo and emotional memory...');

      // Get emotional context
      const emotionalState = await this.getCharacterEmotionalState(characterPack.id);
      
      // Get player preferences
      const playerPrefs = await this.getPlayerPreferences();
      
      // Get cross-story memories
      const crossStoryContext = await this.getCrossStoryMemories(characterPack.id);
      
      // Build advanced context prompt
      const systemPrompt = this.buildAdvancedSystemPrompt(
        characterPack, 
        emotionalState, 
        playerPrefs, 
        crossStoryContext,
        context
      );

      const response = await openai.chat.completions.create({
        model: ADVANCED_AI_CONFIG.GPT4_TURBO.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Player Action: ${playerAction}` }
        ],
        temperature: ADVANCED_AI_CONFIG.GPT4_TURBO.temperature,
        max_tokens: ADVANCED_AI_CONFIG.GPT4_TURBO.max_tokens
      });

      const content = response.choices[0].message.content;
      let sceneData = JSON.parse(content);

      // Update emotional memory
      await this.updateEmotionalMemory(characterPack.id, sceneData, playerAction);
      
      // Learn player preferences
      await this.updatePlayerPreferences(playerAction, sceneData);
      
      // Store cross-story memory if significant
      await this.considerCrossStoryMemory(characterPack.id, sceneData, playerAction);

      console.log('✅ Advanced AI scene generated successfully');
      return sceneData;

    } catch (error) {
      console.error('❌ Advanced AI generation failed:', error);
      throw error;
    }
  }

  /**
   * Build advanced system prompt with emotional and predictive context
   */
  buildAdvancedSystemPrompt(characterPack, emotionalState, playerPrefs, crossStoryContext, context) {
    return `You are an advanced AI storyteller with deep psychological understanding and emotional memory.

CHARACTER PROFILE:
Name: ${characterPack.name}
Setting: ${characterPack.setting}
Core Traits: ${characterPack.traits}
Background: ${characterPack.background}
Speech Style: ${characterPack.speech_style}
Worldview: ${characterPack.worldview}

EMOTIONAL MEMORY CONTEXT:
Current Emotional State: ${emotionalState.primary_emotion} (intensity: ${emotionalState.intensity}/100)
Recent Emotional Triggers: ${emotionalState.recent_triggers.join(', ')}
Emotional Patterns: ${emotionalState.patterns.join(', ')}
Long-term Emotional Growth: ${emotionalState.character_development}

PLAYER PREFERENCE ANALYSIS:
Preferred Story Elements: ${playerPrefs.preferred_elements.join(', ')}
Interaction Style: ${playerPrefs.interaction_style}
Narrative Pacing: ${playerPrefs.pacing_preference}
Emotional Engagement: ${playerPrefs.emotional_engagement_level}

CROSS-STORY MEMORIES:
${crossStoryContext.significant_memories.map(m => 
  `- ${m.story_context}: ${m.emotional_impact} (${m.lessons_learned})`
).join('\n')}

PREDICTIVE STORYTELLING GOALS:
- Build on established emotional connections
- Reference past character growth and lessons learned
- Adapt to player's preferred narrative style
- Create meaningful character development arcs
- Maintain psychological authenticity across interactions

ADVANCED FEATURES TO INCLUDE:
1. Emotional Memory: Character remembers emotional states and references past feelings
2. Character Growth: Show how past experiences have shaped current responses
3. Player Adaptation: Tailor storytelling style to player preferences
4. Psychological Depth: Include subconscious motivations and complex emotions
5. Predictive Elements: Hint at future character development possibilities

Return a JSON object with:
{
  "title": "Scene title reflecting emotional context",
  "narration": "Rich narrative with emotional memory integration (3-4 paragraphs)",
  "character_thoughts": "Complex internal monologue with emotional depth",
  "emotional_state": {
    "primary_emotion": "dominant emotion",
    "intensity": number 1-100,
    "triggers": ["what caused this emotion"],
    "character_growth": "how this moment changes the character"
  },
  "scene_atmosphere": "Mood and setting reflecting emotional state",
  "next_prompt": "Thoughtful lead-in considering player preferences",
  "predictive_hints": ["subtle hints about future character development"],
  "cross_story_references": ["connections to past character experiences"]
}`;
  }

  /**
   * Get character's current emotional state with memory
   */
  async getCharacterEmotionalState(characterId) {
    const stored = this.emotionalMemories.get(characterId);
    if (stored) return stored;

    // Load from persistent storage
    try {
      const key = `emotional_memory_${characterId}`;
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const emotionalState = JSON.parse(data);
        this.emotionalMemories.set(characterId, emotionalState);
        return emotionalState;
      }
    } catch (error) {
      console.error('Failed to load emotional memory:', error);
    }

    // Default emotional state
    return {
      primary_emotion: 'neutral',
      intensity: 50,
      recent_triggers: [],
      patterns: ['balanced', 'introspective'],
      character_development: 'Beginning of emotional journey'
    };
  }

  /**
   * Update emotional memory after scene
   */
  async updateEmotionalMemory(characterId, sceneData, playerAction) {
    try {
      if (!sceneData.emotional_state) return;

      const currentState = await this.getCharacterEmotionalState(characterId);
      
      // Evolve emotional state
      const newState = {
        primary_emotion: sceneData.emotional_state.primary_emotion,
        intensity: sceneData.emotional_state.intensity,
        recent_triggers: [
          ...sceneData.emotional_state.triggers,
          ...currentState.recent_triggers.slice(0, 4) // Keep last 4
        ],
        patterns: this.updateEmotionalPatterns(currentState.patterns, sceneData.emotional_state),
        character_development: sceneData.emotional_state.character_growth,
        last_updated: Date.now()
      };

      // Store in memory and persistent storage
      this.emotionalMemories.set(characterId, newState);
      const key = `emotional_memory_${characterId}`;
      await AsyncStorage.setItem(key, JSON.stringify(newState));

      console.log('💭 Emotional memory updated for:', characterId);
    } catch (error) {
      console.error('Failed to update emotional memory:', error);
    }
  }

  /**
   * Update emotional patterns based on recent experiences
   */
  updateEmotionalPatterns(currentPatterns, newEmotionalState) {
    const patterns = [...currentPatterns];
    
    // Add new patterns based on emotional intensity and type
    if (newEmotionalState.intensity > 80) {
      patterns.push('intense_emotional_responses');
    }
    
    if (newEmotionalState.primary_emotion === 'joy' && newEmotionalState.intensity > 70) {
      patterns.push('optimistic_outlook');
    }
    
    if (newEmotionalState.primary_emotion === 'melancholy' && newEmotionalState.intensity > 60) {
      patterns.push('philosophical_depth');
    }

    // Keep only recent patterns (max 6)
    return [...new Set(patterns)].slice(-6);
  }

  /**
   * Get player preferences through behavior analysis
   */
  async getPlayerPreferences() {
    try {
      const key = 'player_preferences';
      const data = await AsyncStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load player preferences:', error);
    }

    // Default preferences
    return {
      preferred_elements: ['character_development', 'emotional_depth'],
      interaction_style: 'thoughtful',
      pacing_preference: 'moderate',
      emotional_engagement_level: 'high'
    };
  }

  /**
   * Learn and update player preferences
   */
  async updatePlayerPreferences(playerAction, sceneData) {
    try {
      const preferences = await this.getPlayerPreferences();
      
      // Analyze player action for preferences
      const actionAnalysis = this.analyzePlayerAction(playerAction);
      
      // Update preferences based on patterns
      if (actionAnalysis.shows_introspection) {
        preferences.preferred_elements.push('philosophical_dialogue');
      }
      
      if (actionAnalysis.action_length > 100) {
        preferences.interaction_style = 'detailed';
      }
      
      if (actionAnalysis.emotional_words > 2) {
        preferences.emotional_engagement_level = 'very_high';
      }

      // Keep unique preferences
      preferences.preferred_elements = [...new Set(preferences.preferred_elements)].slice(-8);
      
      const key = 'player_preferences';
      await AsyncStorage.setItem(key, JSON.stringify(preferences));

    } catch (error) {
      console.error('Failed to update player preferences:', error);
    }
  }

  /**
   * Analyze player action for preference learning
   */
  analyzePlayerAction(action) {
    const words = action.toLowerCase().split(' ');
    const emotionalWords = ['feel', 'emotion', 'heart', 'soul', 'love', 'fear', 'hope', 'dream'];
    const introspectiveWords = ['think', 'consider', 'reflect', 'ponder', 'wonder', 'contemplate'];
    
    return {
      action_length: action.length,
      emotional_words: words.filter(w => emotionalWords.includes(w)).length,
      shows_introspection: words.some(w => introspectiveWords.includes(w)),
      complexity_score: words.length > 15 ? 'high' : words.length > 8 ? 'medium' : 'low'
    };
  }

  /**
   * Get cross-story memories for character continuity
   */
  async getCrossStoryMemories(characterId) {
    try {
      const key = `cross_story_${characterId}`;
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const memories = JSON.parse(data);
        // Filter recent and significant memories
        const significantMemories = memories.filter(m => 
          m.emotional_weight > ADVANCED_AI_CONFIG.CROSS_STORY_MEMORY.emotional_weight_threshold &&
          (Date.now() - m.timestamp) < (ADVANCED_AI_CONFIG.CROSS_STORY_MEMORY.retention_days * 24 * 60 * 60 * 1000)
        );
        return { significant_memories: significantMemories };
      }
    } catch (error) {
      console.error('Failed to load cross-story memories:', error);
    }

    return { significant_memories: [] };
  }

  /**
   * Consider storing experience as cross-story memory
   */
  async considerCrossStoryMemory(characterId, sceneData, playerAction) {
    try {
      // Calculate emotional weight
      const emotionalWeight = this.calculateEmotionalWeight(sceneData, playerAction);
      
      if (emotionalWeight > ADVANCED_AI_CONFIG.CROSS_STORY_MEMORY.emotional_weight_threshold) {
        const memory = {
          story_context: sceneData.title,
          emotional_impact: sceneData.emotional_state?.character_growth || 'Character development moment',
          lessons_learned: sceneData.emotional_state?.primary_emotion || 'Emotional experience',
          emotional_weight: emotionalWeight,
          timestamp: Date.now()
        };

        // Load existing memories
        const key = `cross_story_${characterId}`;
        let memories = [];
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) memories = JSON.parse(data);
        } catch (e) {}

        // Add new memory and limit total
        memories.push(memory);
        memories = memories
          .sort((a, b) => b.emotional_weight - a.emotional_weight)
          .slice(0, ADVANCED_AI_CONFIG.CROSS_STORY_MEMORY.max_memories_per_character);

        await AsyncStorage.setItem(key, JSON.stringify(memories));
        console.log('🌟 Cross-story memory created for:', characterId);
      }
    } catch (error) {
      console.error('Failed to create cross-story memory:', error);
    }
  }

  /**
   * Calculate emotional weight for memory significance
   */
  calculateEmotionalWeight(sceneData, playerAction) {
    let weight = 0;
    
    // Base weight from emotional intensity
    if (sceneData.emotional_state?.intensity) {
      weight += sceneData.emotional_state.intensity / 100 * 0.4;
    }
    
    // Weight from character growth indication
    if (sceneData.emotional_state?.character_growth) {
      weight += 0.3;
    }
    
    // Weight from player action complexity
    if (playerAction.length > 100) weight += 0.2;
    
    // Weight from predictive hints (future importance)
    if (sceneData.predictive_hints?.length > 0) {
      weight += 0.3;
    }

    return Math.min(weight, 1.0); // Cap at 1.0
  }

  /**
   * Generate predictive story analysis
   */
  async generatePredictiveAnalysis(characterId, recentScenes) {
    try {
      const emotionalState = await this.getCharacterEmotionalState(characterId);
      const playerPrefs = await this.getPlayerPreferences();

      const prompt = `Based on the character's emotional journey and player preferences, predict likely story developments:

Character Emotional State: ${emotionalState.primary_emotion} (${emotionalState.intensity}/100)
Emotional Patterns: ${emotionalState.patterns.join(', ')}
Player Preferences: ${playerPrefs.preferred_elements.join(', ')}

Recent Scenes:
${recentScenes.map(s => `- ${s.title}: ${s.character_thoughts}`).join('\n')}

Predict:
1. Likely emotional arc progression
2. Potential character development moments
3. Story themes that would resonate
4. Optimal pacing for next 3-5 scenes

Return JSON:
{
  "emotional_progression": ["next emotions in order"],
  "character_development_opportunities": ["key growth moments"],
  "recommended_themes": ["story themes to explore"],
  "pacing_suggestions": ["scene pacing recommendations"],
  "player_engagement_tactics": ["ways to increase engagement"]
}`;

      const response = await openai.chat.completions.create({
        model: ADVANCED_AI_CONFIG.PREDICTIVE_ANALYSIS.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: ADVANCED_AI_CONFIG.PREDICTIVE_ANALYSIS.temperature,
        max_tokens: ADVANCED_AI_CONFIG.PREDICTIVE_ANALYSIS.max_tokens
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      
      // Cache the prediction
      this.predictiveCache.set(characterId, {
        analysis,
        timestamp: Date.now(),
        expires: Date.now() + (60 * 60 * 1000) // 1 hour
      });

      return analysis;
    } catch (error) {
      console.error('Failed to generate predictive analysis:', error);
      return null;
    }
  }

  /**
   * Get cached predictive analysis
   */
  getPredictiveAnalysis(characterId) {
    const cached = this.predictiveCache.get(characterId);
    if (cached && cached.expires > Date.now()) {
      return cached.analysis;
    }
    return null;
  }

  /**
   * Generate multi-language content for global expansion
   */
  async generateMultiLanguageContent(content, targetLanguage) {
    try {
      const prompt = `Translate this interactive fiction content to ${targetLanguage}, maintaining character authenticity and emotional depth:

${JSON.stringify(content, null, 2)}

Ensure:
1. Character personality remains authentic in target language
2. Cultural nuances are respected
3. Emotional intensity is preserved
4. Literary quality is maintained

Return the same JSON structure with translated content.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3, // Lower temperature for translation accuracy
        max_tokens: 1500
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Translation failed:', error);
      return content; // Return original if translation fails
    }
  }

  /**
   * Clear emotional memories (for testing or reset)
   */
  async clearEmotionalMemories(characterId = null) {
    if (characterId) {
      this.emotionalMemories.delete(characterId);
      await AsyncStorage.removeItem(`emotional_memory_${characterId}`);
    } else {
      this.emotionalMemories.clear();
      // Clear all emotional memories from storage
      const keys = await AsyncStorage.getAllKeys();
      const emotionalKeys = keys.filter(k => k.startsWith('emotional_memory_'));
      await AsyncStorage.multiRemove(emotionalKeys);
    }
  }

  /**
   * Get advanced AI status and metrics
   */
  getAdvancedAIStatus() {
    return {
      emotional_memories_loaded: this.emotionalMemories.size,
      player_preferences_learned: this.playerPreferences.size,
      cross_story_memories: this.crossStoryMemories.size,
      predictive_cache_entries: this.predictiveCache.size,
      features_active: [
        'emotional_memory',
        'predictive_storytelling', 
        'player_preference_learning',
        'cross_story_continuity',
        'multi_language_support'
      ]
    };
  }
}

// Export singleton instance
export const advancedAI = new AdvancedAIService();
export default advancedAI; 