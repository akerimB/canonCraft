/**
 * InCharacter Phase 8: Animal Behavior Service
 * Revolutionary Interspecies Psychological Modeling System
 * Based on Animal Trait-Behavior Matrix
 */

import { openai } from '../config.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Animal Trait Matrix based on Animal_Trait-Behavior_Matrix.csv
export const ANIMAL_TRAIT_MATRIX = {
  BEHAVIOR: {
    ADAPTIVE: ['grooming', 'exploration', 'problem_solving', 'social_bonding'],
    MALADAPTIVE: ['stereotypy', 'aggression', 'self_harm', 'destructive_behavior']
  },
  EMOTION: {
    BASIC: ['fear', 'playfulness', 'contentment', 'anxiety'],
    COMPLEX: ['curiosity', 'jealousy', 'grief', 'excitement']
  },
  SOCIAL_BEHAVIOR: {
    COOPERATIVE: ['pack_hunting', 'mutual_grooming', 'shared_protection', 'food_sharing'],
    TERRITORIAL: ['resource_guarding', 'boundary_marking', 'dominance_display']
  },
  SOCIAL_EMOTION: {
    ATTACHMENT: ['maternal_bonding', 'pair_bonding', 'pack_loyalty', 'human_attachment'],
    COMPETITIVE: ['rivalry', 'jealousy', 'dominance_seeking']
  },
  PERSONALITY_TRAIT: {
    TEMPERAMENT: ['boldness', 'aggression', 'sociability', 'reactivity'],
    LEARNING: ['trainability', 'memory_retention', 'problem_solving', 'adaptability']
  },
  SUBCONSCIOUS: {
    INSTINCT: ['nest_building', 'migration', 'hunting_sequence', 'mating_rituals'],
    REFLEX: ['startle_response', 'fight_flight', 'prey_drive', 'protective_instinct']
  }
};

// Animal Species Database with period-appropriate roles
export const ANIMAL_SPECIES = {
  horse: {
    traits: ['loyalty', 'boldness', 'pack_hierarchy', 'territorial', 'trainability'],
    period_roles: {
      victorian: ['transportation', 'status_symbol', 'military', 'sport'],
      medieval: ['warfare', 'transportation', 'agriculture', 'nobility'],
      regency: ['transportation', 'sport', 'social_status', 'hunting']
    },
    interaction_capacity: 'high',
    trainable: true,
    social_structure: 'herd',
    size_category: 'large',
    intelligence_level: 'high'
  },
  dog: {
    traits: ['loyalty', 'playfulness', 'pack_bonding', 'protective', 'trainability'],
    period_roles: {
      victorian: ['companionship', 'hunting', 'protection', 'sport'],
      medieval: ['hunting', 'protection', 'herding', 'warfare'],
      regency: ['companionship', 'hunting', 'sport', 'lap_dog']
    },
    interaction_capacity: 'very_high',
    trainable: true,
    social_structure: 'pack',
    size_category: 'varies',
    intelligence_level: 'very_high'
  },
  cat: {
    traits: ['independence', 'curiosity', 'territorial', 'nocturnal', 'predatory'],
    period_roles: {
      victorian: ['pest_control', 'companionship', 'luxury'],
      medieval: ['pest_control', 'supernatural_beliefs', 'barn_cat'],
      regency: ['companionship', 'pest_control', 'fashionable_pet']
    },
    interaction_capacity: 'medium',
    trainable: false,
    social_structure: 'solitary',
    size_category: 'small',
    intelligence_level: 'high'
  },
  raven: {
    traits: ['intelligence', 'curiosity', 'tool_use', 'social_learning', 'memory'],
    period_roles: {
      victorian: ['messenger', 'omen', 'specimen', 'curiosity'],
      medieval: ['omen', 'battlefield_scavenger', 'messenger'],
      gothic: ['supernatural_messenger', 'omen', 'companion', 'harbinger']
    },
    interaction_capacity: 'high',
    trainable: true,
    social_structure: 'flock',
    size_category: 'medium',
    intelligence_level: 'exceptional'
  },
  falcon: {
    traits: ['predatory', 'loyalty', 'territorial', 'hunting_instinct', 'trainability'],
    period_roles: {
      medieval: ['hunting', 'sport', 'nobility', 'warfare'],
      regency: ['hunting', 'sport', 'status_symbol'],
      victorian: ['sport', 'exotic_pet', 'status']
    },
    interaction_capacity: 'medium',
    trainable: true,
    social_structure: 'pair_bond',
    size_category: 'medium',
    intelligence_level: 'high'
  }
};

class AnimalBehaviorService {
  constructor() {
    this.animalTraitMatrices = new Map(); // animalId -> trait scores
    this.behaviorPredictions = new Map(); // animalId -> prediction cache
    this.animalMemories = new Map(); // animalId -> memory array
    this.relationshipCache = new Map(); // relationship cache
  }

  /**
   * Initialize animal companion with trait matrix
   */
  async initializeAnimalCompanion(animalData) {
    const species = ANIMAL_SPECIES[animalData.species];
    if (!species) {
      throw new Error(`Unknown animal species: ${animalData.species}`);
    }

    // Generate trait matrix for this animal
    const traitMatrix = this.generateAnimalTraitMatrix(species, animalData);
    
    // Store in cache
    this.animalTraitMatrices.set(animalData.id, traitMatrix);
    
    // Initialize empty memories
    this.animalMemories.set(animalData.id, []);

    return {
      ...animalData,
      trait_matrix: traitMatrix,
      behavior_profile: this.generateBehaviorProfile(traitMatrix, species),
      interaction_preferences: this.calculateInteractionPreferences(traitMatrix)
    };
  }

  /**
   * Generate animal trait matrix based on species and individual variation
   */
  generateAnimalTraitMatrix(species, animalData) {
    const matrix = {};
    
    // Base traits from species
    species.traits.forEach(trait => {
      // Add some individual variation (±20%)
      const baseScore = 70 + (Math.random() * 40 - 20);
      matrix[trait] = Math.max(10, Math.min(100, baseScore));
    });

    // Add traits from each category
    Object.keys(ANIMAL_TRAIT_MATRIX).forEach(category => {
      Object.keys(ANIMAL_TRAIT_MATRIX[category]).forEach(subcategory => {
        ANIMAL_TRAIT_MATRIX[category][subcategory].forEach(trait => {
          if (!matrix[trait]) {
            // Random score with species-appropriate tendencies
            const score = this.calculateSpeciesTraitScore(trait, species);
            matrix[trait] = score;
          }
        });
      });
    });

    // Apply age and experience modifiers
    if (animalData.age_category === 'young') {
      matrix.playfulness += 20;
      matrix.trainability += 15;
      matrix.fear += 10;
    } else if (animalData.age_category === 'elderly') {
      matrix.boldness -= 10;
      matrix.aggression -= 15;
      matrix.loyalty += 20;
    }

    // Normalize scores
    Object.keys(matrix).forEach(trait => {
      matrix[trait] = Math.max(0, Math.min(100, matrix[trait]));
    });

    return matrix;
  }

  /**
   * Calculate species-appropriate trait scores
   */
  calculateSpeciesTraitScore(trait, species) {
    // Species-specific trait tendencies
    const speciesTendencies = {
      dog: {
        loyalty: 85, playfulness: 75, pack_bonding: 90, protective: 80,
        trainability: 85, social_bonding: 90
      },
      cat: {
        independence: 85, curiosity: 80, territorial: 75, nocturnal: 70,
        trainability: 25, social_bonding: 40
      },
      horse: {
        loyalty: 70, boldness: 65, pack_hierarchy: 80, territorial: 60,
        trainability: 75, social_bonding: 70
      },
      raven: {
        intelligence: 95, curiosity: 90, tool_use: 85, social_learning: 80,
        memory: 90, problem_solving: 85
      },
      falcon: {
        predatory: 90, loyalty: 70, territorial: 80, hunting_instinct: 95,
        trainability: 70, boldness: 85
      }
    };

    const tendency = speciesTendencies[species.key] && speciesTendencies[species.key][trait];
    if (tendency) {
      return tendency + (Math.random() * 20 - 10); // ±10 variation
    }
    
    // Default random score
    return 30 + Math.random() * 40;
  }

  /**
   * Predict animal behavior based on situation and trait matrix
   */
  async predictAnimalBehavior(animalId, situation, emotionalContext) {
    const traitMatrix = this.animalTraitMatrices.get(animalId);
    if (!traitMatrix) {
      throw new Error(`No trait matrix found for animal ${animalId}`);
    }

    const memories = this.animalMemories.get(animalId) || [];
    
    // Analyze situation
    const behaviorPrediction = {
      primary_response: this.calculatePrimaryResponse(traitMatrix, situation),
      emotional_state: this.determineEmotionalState(traitMatrix, emotionalContext),
      interaction_tendency: this.calculateInteractionTendency(traitMatrix),
      learning_adaptation: this.assessLearningAdaptation(memories, situation),
      confidence_level: this.calculateConfidenceLevel(traitMatrix, situation),
      stress_indicators: this.assessStressLevel(traitMatrix, situation)
    };

    // Cache prediction
    this.behaviorPredictions.set(animalId, behaviorPrediction);

    return behaviorPrediction;
  }

  /**
   * Calculate primary behavioral response
   */
  calculatePrimaryResponse(traitMatrix, situation) {
    const responses = {
      approach: 0,
      avoid: 0,
      investigate: 0,
      protect: 0,
      play: 0,
      aggressive: 0
    };

    // Factor in relevant traits
    if (situation.threat_level > 0) {
      responses.avoid += traitMatrix.fear || 50;
      responses.aggressive += traitMatrix.aggression || 30;
      responses.protect += traitMatrix.protective || 40;
    }

    if (situation.novelty > 0) {
      responses.investigate += traitMatrix.curiosity || 50;
      responses.avoid += traitMatrix.fear || 30;
    }

    if (situation.social_opportunity > 0) {
      responses.approach += traitMatrix.social_bonding || 50;
      responses.play += traitMatrix.playfulness || 40;
    }

    // Find dominant response
    let maxResponse = 'approach';
    let maxScore = 0;
    Object.keys(responses).forEach(response => {
      if (responses[response] > maxScore) {
        maxScore = responses[response];
        maxResponse = response;
      }
    });

    return {
      primary: maxResponse,
      intensity: Math.min(100, maxScore),
      alternatives: Object.entries(responses)
        .sort((a, b) => b[1] - a[1])
        .slice(1, 3)
        .map(([response, score]) => ({ response, score }))
    };
  }

  /**
   * Determine emotional state
   */
  determineEmotionalState(traitMatrix, emotionalContext) {
    const emotions = {
      calm: 50,
      excited: 0,
      fearful: 0,
      content: 50,
      anxious: 0,
      playful: 0
    };

    // Apply trait influences
    emotions.fearful += (traitMatrix.fear || 30) * (emotionalContext.stress_level || 0) / 100;
    emotions.playful += (traitMatrix.playfulness || 40) * (emotionalContext.social_energy || 50) / 100;
    emotions.excited += (traitMatrix.reactivity || 40) * (emotionalContext.stimulation || 30) / 100;
    emotions.anxious += (traitMatrix.anxiety || 30) * (emotionalContext.uncertainty || 20) / 100;

    // Normalize
    const total = Object.values(emotions).reduce((sum, val) => sum + val, 0);
    Object.keys(emotions).forEach(emotion => {
      emotions[emotion] = (emotions[emotion] / total) * 100;
    });

    return emotions;
  }

  /**
   * Update animal relationships based on interactions
   */
  async updateAnimalRelationship(animalId, interactorId, interactorType, interactionType, outcome) {
    const traitMatrix = this.animalTraitMatrices.get(animalId);
    if (!traitMatrix) return;

    // Calculate relationship changes
    const changes = this.calculateRelationshipChanges(
      traitMatrix,
      interactionType,
      outcome,
      interactorType
    );

    // Store interaction memory
    await this.storeAnimalMemory(animalId, {
      interactor_id: interactorId,
      interactor_type: interactorType,
      interaction_type: interactionType,
      outcome: outcome,
      emotional_impact: changes.emotional_impact,
      timestamp: Date.now(),
      scene: this.currentScene
    });

    return changes;
  }

  /**
   * Calculate relationship changes based on interaction
   */
  calculateRelationshipChanges(traitMatrix, interactionType, outcome, interactorType) {
    const changes = {
      affection: 0,
      trust: 0,
      respect: 0,
      loyalty: 0,
      fear: 0,
      training_level: 0
    };

    const trainability = traitMatrix.trainability || 50;
    const socialBonding = traitMatrix.social_bonding || 50;
    const fearLevel = traitMatrix.fear || 30;

    // Interaction type effects
    switch (interactionType) {
      case 'feeding':
        changes.affection += outcome === 'positive' ? 8 : -3;
        changes.trust += outcome === 'positive' ? 5 : -2;
        break;
      
      case 'training':
        if (outcome === 'positive') {
          changes.training_level += (trainability / 100) * 10;
          changes.respect += 3;
        } else {
          changes.fear += (100 - trainability) / 100 * 5;
        }
        break;
      
      case 'play':
        changes.affection += outcome === 'positive' ? 6 : -2;
        changes.loyalty += outcome === 'positive' ? 4 : -1;
        break;
      
      case 'protection':
        changes.loyalty += outcome === 'positive' ? 12 : -5;
        changes.trust += outcome === 'positive' ? 8 : -4;
        break;
      
      case 'punishment':
        changes.fear += 5;
        changes.affection -= 4;
        changes.training_level += trainability > 60 ? 3 : -2;
        break;
    }

    // Apply trait modifiers
    Object.keys(changes).forEach(metric => {
      if (metric === 'affection' || metric === 'loyalty') {
        changes[metric] *= (socialBonding / 100);
      }
      if (metric === 'fear') {
        changes[metric] *= (fearLevel / 100);
      }
    });

    return {
      ...changes,
      emotional_impact: this.calculateEmotionalImpact(changes)
    };
  }

  /**
   * Store animal memory
   */
  async storeAnimalMemory(animalId, memory) {
    let memories = this.animalMemories.get(animalId) || [];
    
    // Add new memory
    memories.push({
      ...memory,
      id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    // Keep only recent memories (last 50)
    if (memories.length > 50) {
      memories = memories.slice(-50);
    }

    this.animalMemories.set(animalId, memories);

    // Persist to storage
    try {
      await AsyncStorage.setItem(
        `animal_memories_${animalId}`,
        JSON.stringify(memories)
      );
    } catch (error) {
      console.error('Failed to store animal memories:', error);
    }
  }

  /**
   * Generate multi-species interaction dynamics
   */
  async generateMultiSpeciesInteraction(participants) {
    const humans = participants.filter(p => p.type === 'human');
    const animals = participants.filter(p => p.type === 'animal');

    const dynamics = {
      dominance_hierarchy: this.calculateDominanceHierarchy(animals),
      pack_dynamics: this.assessPackDynamics(animals),
      human_leadership: this.assessHumanLeadership(humans, animals),
      conflict_potential: this.calculateConflictPotential(participants),
      cooperation_level: this.assessCooperationLevel(participants),
      attention_competition: this.calculateAttentionCompetition(animals, humans)
    };

    return dynamics;
  }

  /**
   * Generate AI-powered animal behavior context
   */
  async generateAnimalBehaviorContext(animalId, situation) {
    const traitMatrix = this.animalTraitMatrices.get(animalId);
    const memories = this.animalMemories.get(animalId) || [];
    const prediction = await this.predictAnimalBehavior(animalId, situation, {});

    const prompt = `
ANIMAL BEHAVIOR CONTEXT:

Animal Traits:
${Object.entries(traitMatrix).map(([trait, score]) => 
  `- ${trait}: ${score}/100`
).join('\n')}

Current Behavioral Prediction:
- Primary Response: ${prediction.primary_response.primary} (${prediction.primary_response.intensity}%)
- Emotional State: ${Object.entries(prediction.emotional_state)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 2)
  .map(([emotion, level]) => `${emotion} (${level.toFixed(1)}%)`)
  .join(', ')}

Recent Memories (last 3):
${memories.slice(-3).map(memory => 
  `- ${memory.interaction_type} with ${memory.interactor_type}: ${memory.outcome} (emotional impact: ${memory.emotional_impact})`
).join('\n')}

🐾 MANDATORY: Animal behavior must reflect trait matrix, memories, and species-appropriate responses!
`;

    return prompt;
  }

  /**
   * Get animal companion summary for UI
   */
  getAnimalCompanionSummary(animalId) {
    const traitMatrix = this.animalTraitMatrices.get(animalId);
    const memories = this.animalMemories.get(animalId) || [];
    const prediction = this.behaviorPredictions.get(animalId);

    if (!traitMatrix) return null;

    const dominantTraits = Object.entries(traitMatrix)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([trait, score]) => ({ trait, score }));

    return {
      dominant_traits: dominantTraits,
      behavior_prediction: prediction,
      memory_count: memories.length,
      recent_interactions: memories.slice(-5),
      last_updated: new Date().toISOString()
    };
  }
}

export default AnimalBehaviorService; 