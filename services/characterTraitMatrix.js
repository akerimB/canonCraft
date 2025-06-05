/**
 * InCharacter Phase 5: Advanced Character Modeling System
 * Dual-Layer Personality System with Dynamic Trait Evolution
 * Based on the 67-Point Human Trait Character Modeling Matrix
 */

import { openai } from '../config.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Human Trait Character Modeling Matrix - 67 traits organized by categories
export const TRAIT_MATRIX = {
  BEHAVIOR: {
    ADAPTIVE: [
      'resilience', 'mindfulness', 'assertiveness', 'time_management', 'active_listening'
    ],
    MALADAPTIVE: [
      'procrastination', 'rumination', 'avoidance', 'passive_aggression'
    ]
  },
  EMOTION: {
    BASIC: [
      'happiness', 'sadness', 'fear', 'anger', 'surprise', 'disgust'
    ],
    COMPLEX: [
      'guilt', 'shame', 'pride', 'gratitude', 'jealousy', 'hope', 'awe',
      'loneliness', 'envy', 'contentment', 'frustration'
    ],
    SOCIAL: [
      'embarrassment', 'admiration', 'sympathy', 'empathy'
    ],
    MORAL: [
      'elevation', 'contempt'
    ]
  },
  PERSONALITY_TRAIT: {
    DARK_TRIAD: [
      'machiavellianism', 'narcissism', 'psychopathy'
    ],
    ATTACHMENT_STYLE: [
      'secure_attachment', 'anxious_attachment', 'avoidant_attachment', 'disorganized_attachment'
    ],
    BIG_FIVE: [
      'openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'
    ],
    TEMPERAMENT: [
      'novelty_seeking', 'harm_avoidance', 'reward_dependence', 'persistence',
      'self_directedness', 'cooperativeness', 'self_transcendence'
    ],
    VALUE_ORIENTATION: [
      'altruism', 'power', 'security', 'achievement'
    ]
  },
  SUBCONSCIOUS_TRAIT: {
    DEFENSE_MECHANISMS: [
      'projection', 'displacement', 'sublimation', 'repression', 'rationalization', 'reaction_formation'
    ],
    COGNITIVE_BIAS: [
      'confirmation_bias', 'anchoring_bias', 'availability_heuristic', 'dunning_kruger_effect', 'negativity_bias'
    ]
  }
};

// Trait metadata including consciousness level, social impact, etc.
export const TRAIT_METADATA = {
  // Behavior traits
  resilience: { 
    category: 'BEHAVIOR', subcategory: 'ADAPTIVE', 
    consciousness: 'BOTH', valence: 'POSITIVE', 
    cognitive_involvement: 'HIGH', social_impact: 'MEDIUM',
    description: 'Ability to recover from setbacks'
  },
  procrastination: {
    category: 'BEHAVIOR', subcategory: 'MALADAPTIVE',
    consciousness: 'BOTH', valence: 'NEGATIVE',
    cognitive_involvement: 'HIGH', social_impact: 'MEDIUM',
    description: 'Delaying tasks unnecessarily'
  },
  mindfulness: {
    category: 'BEHAVIOR', subcategory: 'ADAPTIVE',
    consciousness: 'CONSCIOUS', valence: 'POSITIVE',
    cognitive_involvement: 'HIGH', social_impact: 'LOW',
    description: 'Focused awareness of the present moment'
  },
  assertiveness: {
    category: 'BEHAVIOR', subcategory: 'ADAPTIVE',
    consciousness: 'CONSCIOUS', valence: 'POSITIVE',
    cognitive_involvement: 'HIGH', social_impact: 'HIGH',
    description: 'Ability to express opinions confidently and respectfully'
  },
  rumination: {
    category: 'BEHAVIOR', subcategory: 'MALADAPTIVE',
    consciousness: 'SUBCONSCIOUS', valence: 'NEGATIVE',
    cognitive_involvement: 'HIGH', social_impact: 'MEDIUM',
    description: 'Repetitive focus on distressing situations or thoughts'
  },
  avoidance: {
    category: 'BEHAVIOR', subcategory: 'MALADAPTIVE',
    consciousness: 'SUBCONSCIOUS', valence: 'NEGATIVE',
    cognitive_involvement: 'MEDIUM', social_impact: 'MEDIUM',
    description: 'Deliberately steering clear of distressing situations'
  },
  passive_aggression: {
    category: 'BEHAVIOR', subcategory: 'MALADAPTIVE',
    consciousness: 'SUBCONSCIOUS', valence: 'NEGATIVE',
    cognitive_involvement: 'MEDIUM', social_impact: 'HIGH',
    description: 'Indirect resistance or hostility'
  },
  time_management: {
    category: 'BEHAVIOR', subcategory: 'ADAPTIVE',
    consciousness: 'CONSCIOUS', valence: 'POSITIVE',
    cognitive_involvement: 'HIGH', social_impact: 'MEDIUM',
    description: 'Effective planning and use of time'
  },
  active_listening: {
    category: 'BEHAVIOR', subcategory: 'ADAPTIVE',
    consciousness: 'CONSCIOUS', valence: 'POSITIVE',
    cognitive_involvement: 'HIGH', social_impact: 'HIGH',
    description: 'Fully concentrating and responding thoughtfully'
  },

  // Basic emotions
  happiness: {
    category: 'EMOTION', subcategory: 'BASIC',
    consciousness: 'CONSCIOUS', valence: 'POSITIVE',
    cognitive_involvement: 'LOW', social_impact: 'HIGH',
    description: 'A state of well-being and contentment'
  },
  sadness: {
    category: 'EMOTION', subcategory: 'BASIC',
    consciousness: 'CONSCIOUS', valence: 'NEGATIVE',
    cognitive_involvement: 'LOW', social_impact: 'MEDIUM',
    description: 'A feeling of sorrow or unhappiness'
  },
  fear: {
    category: 'EMOTION', subcategory: 'BASIC',
    consciousness: 'BOTH', valence: 'NEGATIVE',
    cognitive_involvement: 'MEDIUM', social_impact: 'HIGH',
    description: 'An unpleasant emotion caused by perceived danger'
  },
  anger: {
    category: 'EMOTION', subcategory: 'BASIC',
    consciousness: 'BOTH', valence: 'NEGATIVE',
    cognitive_involvement: 'MEDIUM', social_impact: 'HIGH',
    description: 'A strong feeling of displeasure or hostility'
  },
  surprise: {
    category: 'EMOTION', subcategory: 'BASIC',
    consciousness: 'BOTH', valence: 'NEUTRAL',
    cognitive_involvement: 'MEDIUM', social_impact: 'MEDIUM',
    description: 'A brief emotional response to unexpected events'
  },
  disgust: {
    category: 'EMOTION', subcategory: 'BASIC',
    consciousness: 'BOTH', valence: 'NEGATIVE',
    cognitive_involvement: 'LOW', social_impact: 'HIGH',
    description: 'A strong aversion toward something offensive'
  },

  // Complex emotions
  guilt: {
    category: 'EMOTION', subcategory: 'COMPLEX',
    consciousness: 'BOTH', valence: 'NEGATIVE',
    cognitive_involvement: 'HIGH', social_impact: 'MEDIUM',
    description: 'A feeling of responsibility for a wrongdoing'
  },
  shame: {
    category: 'EMOTION', subcategory: 'COMPLEX',
    consciousness: 'BOTH', valence: 'NEGATIVE',
    cognitive_involvement: 'MEDIUM', social_impact: 'HIGH',
    description: 'A painful feeling of humiliation or distress'
  },
  pride: {
    category: 'EMOTION', subcategory: 'COMPLEX',
    consciousness: 'CONSCIOUS', valence: 'POSITIVE',
    cognitive_involvement: 'MEDIUM', social_impact: 'HIGH',
    description: 'A feeling of deep pleasure from achievements'
  },
  gratitude: {
    category: 'EMOTION', subcategory: 'COMPLEX',
    consciousness: 'CONSCIOUS', valence: 'POSITIVE',
    cognitive_involvement: 'HIGH', social_impact: 'HIGH',
    description: 'A readiness to show appreciation'
  },
  jealousy: {
    category: 'EMOTION', subcategory: 'COMPLEX',
    consciousness: 'BOTH', valence: 'NEGATIVE',
    cognitive_involvement: 'MEDIUM', social_impact: 'HIGH',
    description: 'Fear of losing something of value to another person'
  },
  hope: {
    category: 'EMOTION', subcategory: 'COMPLEX',
    consciousness: 'CONSCIOUS', valence: 'POSITIVE',
    cognitive_involvement: 'HIGH', social_impact: 'MEDIUM',
    description: 'Feeling of expectation and desire for a certain thing to happen'
  },
  awe: {
    category: 'EMOTION', subcategory: 'COMPLEX',
    consciousness: 'BOTH', valence: 'POSITIVE',
    cognitive_involvement: 'HIGH', social_impact: 'MEDIUM',
    description: 'Overwhelming feeling of reverence and admiration'
  },
  loneliness: {
    category: 'EMOTION', subcategory: 'COMPLEX',
    consciousness: 'BOTH', valence: 'NEGATIVE',
    cognitive_involvement: 'MEDIUM', social_impact: 'HIGH',
    description: 'A feeling of sadness due to lack of social connection'
  },
  envy: {
    category: 'EMOTION', subcategory: 'COMPLEX',
    consciousness: 'BOTH', valence: 'NEGATIVE',
    cognitive_involvement: 'MEDIUM', social_impact: 'HIGH',
    description: 'Desire for something another person possesses'
  },
  contentment: {
    category: 'EMOTION', subcategory: 'COMPLEX',
    consciousness: 'CONSCIOUS', valence: 'POSITIVE',
    cognitive_involvement: 'LOW', social_impact: 'MEDIUM',
    description: 'A state of peaceful happiness'
  },
  frustration: {
    category: 'EMOTION', subcategory: 'COMPLEX',
    consciousness: 'BOTH', valence: 'NEGATIVE',
    cognitive_involvement: 'MEDIUM', social_impact: 'MEDIUM',
    description: 'Feeling of being upset due to unmet expectations'
  },

  // Social emotions
  embarrassment: {
    category: 'EMOTION', subcategory: 'SOCIAL',
    consciousness: 'BOTH', valence: 'NEGATIVE',
    cognitive_involvement: 'MEDIUM', social_impact: 'HIGH',
    description: 'A feeling of self-consciousness or shame'
  },
  admiration: {
    category: 'EMOTION', subcategory: 'SOCIAL',
    consciousness: 'CONSCIOUS', valence: 'POSITIVE',
    cognitive_involvement: 'MEDIUM', social_impact: 'HIGH',
    description: 'Respect and warm approval'
  },
  sympathy: {
    category: 'EMOTION', subcategory: 'SOCIAL',
    consciousness: 'CONSCIOUS', valence: 'POSITIVE',
    cognitive_involvement: 'MEDIUM', social_impact: 'HIGH',
    description: 'Feelings of pity and sorrow for someone else\'s misfortune'
  },
  empathy: {
    category: 'EMOTION', subcategory: 'SOCIAL',
    consciousness: 'BOTH', valence: 'POSITIVE',
    cognitive_involvement: 'HIGH', social_impact: 'HIGH',
    description: 'Understanding and sharing the feelings of another'
  },

  // Moral emotions
  elevation: {
    category: 'EMOTION', subcategory: 'MORAL',
    consciousness: 'CONSCIOUS', valence: 'POSITIVE',
    cognitive_involvement: 'HIGH', social_impact: 'HIGH',
    description: 'A warm, uplifting feeling from witnessing moral beauty'
  },
  contempt: {
    category: 'EMOTION', subcategory: 'MORAL',
    consciousness: 'BOTH', valence: 'NEGATIVE',
    cognitive_involvement: 'MEDIUM', social_impact: 'HIGH',
    description: 'A feeling of disdain or lack of respect'
  },

  // Dark Triad traits
  machiavellianism: {
    category: 'PERSONALITY_TRAIT', subcategory: 'DARK_TRIAD',
    consciousness: 'SUBCONSCIOUS', valence: 'NEGATIVE',
    cognitive_involvement: 'HIGH', social_impact: 'HIGH',
    description: 'Manipulativeness and a cynical view of human nature'
  },
  narcissism: {
    category: 'PERSONALITY_TRAIT', subcategory: 'DARK_TRIAD',
    consciousness: 'SUBCONSCIOUS', valence: 'NEGATIVE',
    cognitive_involvement: 'MEDIUM', social_impact: 'HIGH',
    description: 'Excessive interest in oneself and one\'s appearance'
  },
  psychopathy: {
    category: 'PERSONALITY_TRAIT', subcategory: 'DARK_TRIAD',
    consciousness: 'SUBCONSCIOUS', valence: 'NEGATIVE',
    cognitive_involvement: 'LOW', social_impact: 'HIGH',
    description: 'Lack of empathy and remorse'
  },

  // Attachment styles
  secure_attachment: {
    category: 'PERSONALITY_TRAIT', subcategory: 'ATTACHMENT_STYLE',
    consciousness: 'BOTH', valence: 'POSITIVE',
    cognitive_involvement: 'HIGH', social_impact: 'HIGH',
    description: 'Healthy emotional bond with comfort in intimacy and independence'
  },
  anxious_attachment: {
    category: 'PERSONALITY_TRAIT', subcategory: 'ATTACHMENT_STYLE',
    consciousness: 'SUBCONSCIOUS', valence: 'NEGATIVE',
    cognitive_involvement: 'MEDIUM', social_impact: 'HIGH',
    description: 'Desire for closeness with fear of abandonment'
  },
  avoidant_attachment: {
    category: 'PERSONALITY_TRAIT', subcategory: 'ATTACHMENT_STYLE',
    consciousness: 'SUBCONSCIOUS', valence: 'NEGATIVE',
    cognitive_involvement: 'MEDIUM', social_impact: 'HIGH',
    description: 'Discomfort with closeness and reliance on self'
  },
  disorganized_attachment: {
    category: 'PERSONALITY_TRAIT', subcategory: 'ATTACHMENT_STYLE',
    consciousness: 'SUBCONSCIOUS', valence: 'NEGATIVE',
    cognitive_involvement: 'HIGH', social_impact: 'HIGH',
    description: 'Combination of anxious and avoidant behaviors'
  },

  // Big Five traits
  openness: {
    category: 'PERSONALITY_TRAIT', subcategory: 'BIG_FIVE',
    consciousness: 'BOTH', valence: 'POSITIVE',
    cognitive_involvement: 'HIGH', social_impact: 'MEDIUM',
    description: 'Imagination, creativity, and openness to experience'
  },
  conscientiousness: {
    category: 'PERSONALITY_TRAIT', subcategory: 'BIG_FIVE',
    consciousness: 'CONSCIOUS', valence: 'POSITIVE',
    cognitive_involvement: 'HIGH', social_impact: 'MEDIUM',
    description: 'Being diligent, careful, and organized'
  },
  extraversion: {
    category: 'PERSONALITY_TRAIT', subcategory: 'BIG_FIVE',
    consciousness: 'CONSCIOUS', valence: 'POSITIVE',
    cognitive_involvement: 'MEDIUM', social_impact: 'HIGH',
    description: 'Outgoing, energetic, and sociable behavior'
  },
  agreeableness: {
    category: 'PERSONALITY_TRAIT', subcategory: 'BIG_FIVE',
    consciousness: 'CONSCIOUS', valence: 'POSITIVE',
    cognitive_involvement: 'MEDIUM', social_impact: 'HIGH',
    description: 'Being cooperative, compassionate, and friendly'
  },
  neuroticism: {
    category: 'PERSONALITY_TRAIT', subcategory: 'BIG_FIVE',
    consciousness: 'SUBCONSCIOUS', valence: 'NEGATIVE',
    cognitive_involvement: 'MEDIUM', social_impact: 'MEDIUM',
    description: 'Tendency to experience negative emotions'
  },

  // Temperament traits
  novelty_seeking: {
    category: 'PERSONALITY_TRAIT', subcategory: 'TEMPERAMENT',
    consciousness: 'BOTH', valence: 'NEUTRAL',
    cognitive_involvement: 'HIGH', social_impact: 'MEDIUM',
    description: 'Tendency to seek new and exciting experiences'
  },
  harm_avoidance: {
    category: 'PERSONALITY_TRAIT', subcategory: 'TEMPERAMENT',
    consciousness: 'SUBCONSCIOUS', valence: 'NEGATIVE',
    cognitive_involvement: 'MEDIUM', social_impact: 'MEDIUM',
    description: 'Tendency to avoid potentially harmful situations'
  },
  reward_dependence: {
    category: 'PERSONALITY_TRAIT', subcategory: 'TEMPERAMENT',
    consciousness: 'SUBCONSCIOUS', valence: 'POSITIVE',
    cognitive_involvement: 'MEDIUM', social_impact: 'HIGH',
    description: 'Responding markedly to signals of reward'
  },
  persistence: {
    category: 'PERSONALITY_TRAIT', subcategory: 'TEMPERAMENT',
    consciousness: 'CONSCIOUS', valence: 'POSITIVE',
    cognitive_involvement: 'HIGH', social_impact: 'MEDIUM',
    description: 'Perseverance despite frustration and fatigue'
  },
  self_directedness: {
    category: 'PERSONALITY_TRAIT', subcategory: 'TEMPERAMENT',
    consciousness: 'CONSCIOUS', valence: 'POSITIVE',
    cognitive_involvement: 'HIGH', social_impact: 'HIGH',
    description: 'Ability to regulate behavior in accordance with goals'
  },
  cooperativeness: {
    category: 'PERSONALITY_TRAIT', subcategory: 'TEMPERAMENT',
    consciousness: 'CONSCIOUS', valence: 'POSITIVE',
    cognitive_involvement: 'MEDIUM', social_impact: 'HIGH',
    description: 'How well a person gets along with others'
  },
  self_transcendence: {
    category: 'PERSONALITY_TRAIT', subcategory: 'TEMPERAMENT',
    consciousness: 'CONSCIOUS', valence: 'POSITIVE',
    cognitive_involvement: 'HIGH', social_impact: 'HIGH',
    description: 'Tendency to view oneself as part of a broader whole'
  },

  // Value orientation traits
  altruism: {
    category: 'PERSONALITY_TRAIT', subcategory: 'VALUE_ORIENTATION',
    consciousness: 'BOTH', valence: 'POSITIVE',
    cognitive_involvement: 'MEDIUM', social_impact: 'HIGH',
    description: 'Concern for the welfare of others'
  },
  power: {
    category: 'PERSONALITY_TRAIT', subcategory: 'VALUE_ORIENTATION',
    consciousness: 'BOTH', valence: 'NEUTRAL',
    cognitive_involvement: 'MEDIUM', social_impact: 'HIGH',
    description: 'Desire for control or influence over others'
  },
  security: {
    category: 'PERSONALITY_TRAIT', subcategory: 'VALUE_ORIENTATION',
    consciousness: 'BOTH', valence: 'NEUTRAL',
    cognitive_involvement: 'MEDIUM', social_impact: 'MEDIUM',
    description: 'Desire for safety and stability'
  },
  achievement: {
    category: 'PERSONALITY_TRAIT', subcategory: 'VALUE_ORIENTATION',
    consciousness: 'CONSCIOUS', valence: 'POSITIVE',
    cognitive_involvement: 'HIGH', social_impact: 'MEDIUM',
    description: 'Striving to excel and succeed'
  },

  // Defense mechanisms
  projection: {
    category: 'SUBCONSCIOUS_TRAIT', subcategory: 'DEFENSE_MECHANISMS',
    consciousness: 'SUBCONSCIOUS', valence: 'NEGATIVE',
    cognitive_involvement: 'LOW', social_impact: 'MEDIUM',
    description: 'Attributing one\'s own thoughts to others'
  },
  displacement: {
    category: 'SUBCONSCIOUS_TRAIT', subcategory: 'DEFENSE_MECHANISMS',
    consciousness: 'SUBCONSCIOUS', valence: 'NEUTRAL',
    cognitive_involvement: 'MEDIUM', social_impact: 'MEDIUM',
    description: 'Redirecting emotions to a safer outlet'
  },
  sublimation: {
    category: 'SUBCONSCIOUS_TRAIT', subcategory: 'DEFENSE_MECHANISMS',
    consciousness: 'SUBCONSCIOUS', valence: 'POSITIVE',
    cognitive_involvement: 'HIGH', social_impact: 'HIGH',
    description: 'Redirecting impulses into acceptable activities'
  },
  repression: {
    category: 'SUBCONSCIOUS_TRAIT', subcategory: 'DEFENSE_MECHANISMS',
    consciousness: 'SUBCONSCIOUS', valence: 'NEGATIVE',
    cognitive_involvement: 'LOW', social_impact: 'LOW',
    description: 'Unconscious blocking of unpleasant emotions or memories'
  },
  rationalization: {
    category: 'SUBCONSCIOUS_TRAIT', subcategory: 'DEFENSE_MECHANISMS',
    consciousness: 'SUBCONSCIOUS', valence: 'NEUTRAL',
    cognitive_involvement: 'MEDIUM', social_impact: 'MEDIUM',
    description: 'Justifying controversial behaviors or feelings logically'
  },
  reaction_formation: {
    category: 'SUBCONSCIOUS_TRAIT', subcategory: 'DEFENSE_MECHANISMS',
    consciousness: 'SUBCONSCIOUS', valence: 'NEUTRAL',
    cognitive_involvement: 'MEDIUM', social_impact: 'MEDIUM',
    description: 'Behaving in a way opposite to true feelings'
  },

  // Cognitive biases
  confirmation_bias: {
    category: 'SUBCONSCIOUS_TRAIT', subcategory: 'COGNITIVE_BIAS',
    consciousness: 'SUBCONSCIOUS', valence: 'NEUTRAL',
    cognitive_involvement: 'MEDIUM', social_impact: 'MEDIUM',
    description: 'Tendency to search for information that confirms one\'s beliefs'
  },
  anchoring_bias: {
    category: 'SUBCONSCIOUS_TRAIT', subcategory: 'COGNITIVE_BIAS',
    consciousness: 'SUBCONSCIOUS', valence: 'NEUTRAL',
    cognitive_involvement: 'LOW', social_impact: 'LOW',
    description: 'Relying too heavily on the first piece of information encountered'
  },
  availability_heuristic: {
    category: 'SUBCONSCIOUS_TRAIT', subcategory: 'COGNITIVE_BIAS',
    consciousness: 'SUBCONSCIOUS', valence: 'NEUTRAL',
    cognitive_involvement: 'LOW', social_impact: 'LOW',
    description: 'Overestimating the importance of information that comes to mind quickly'
  },
  dunning_kruger_effect: {
    category: 'SUBCONSCIOUS_TRAIT', subcategory: 'COGNITIVE_BIAS',
    consciousness: 'SUBCONSCIOUS', valence: 'NEUTRAL',
    cognitive_involvement: 'LOW', social_impact: 'MEDIUM',
    description: 'Overestimating one\'s ability due to lack of knowledge'
  },
  negativity_bias: {
    category: 'SUBCONSCIOUS_TRAIT', subcategory: 'COGNITIVE_BIAS',
    consciousness: 'SUBCONSCIOUS', valence: 'NEGATIVE',
    cognitive_involvement: 'MEDIUM', social_impact: 'HIGH',
    description: 'Tendency to focus more on negative events'
  }
};

/**
 * Character Trait Matrix System
 * Manages dual-layer personality modeling and dynamic trait evolution
 */
class CharacterTraitMatrix {
  constructor() {
    this.traitMatrices = new Map(); // storyId -> trait matrix
    this.evolutionHistory = new Map(); // storyId -> evolution log
    this.baselineMatrices = new Map(); // storyId -> baseline traits
    this.assessmentCache = new Map(); // storyId -> assessment results
  }

  /**
   * Initialize trait matrix for a character
   */
  async initializeMatrix(storyId, characterPack, playerAge = null) {
    console.log('🧠 Initializing Phase 5 trait matrix for:', characterPack.name);

    // Create baseline trait matrix from character data
    const baselineMatrix = await this.createBaselineMatrix(characterPack, playerAge);
    
    // Current matrix starts as copy of baseline
    const currentMatrix = { ...baselineMatrix };

    // Store matrices
    this.baselineMatrices.set(storyId, baselineMatrix);
    this.traitMatrices.set(storyId, currentMatrix);
    this.evolutionHistory.set(storyId, []);

    // Generate initial AI assessment
    const initialAssessment = await this.generateAIAssessment(
      currentMatrix, 
      characterPack, 
      [], // No decisions yet
      'BASELINE'
    );

    this.assessmentCache.set(storyId, initialAssessment);

    console.log('✅ Trait matrix initialized with', Object.keys(currentMatrix).length, 'traits');
    
    return {
      baseline: baselineMatrix,
      current: currentMatrix,
      assessment: initialAssessment
    };
  }

  /**
   * Create baseline trait matrix from character data
   */
  async createBaselineMatrix(characterPack, playerAge) {
    console.log('📊 Creating baseline trait matrix...');

    const baselineTraits = {};
    
    // Initialize all traits with base values (50 = neutral)
    Object.keys(TRAIT_METADATA).forEach(trait => {
      baselineTraits[trait] = {
        score: 50,
        confidence: 0.1, // Low confidence initially
        evidence: [],
        lastUpdated: new Date().toISOString(),
        ageInfluence: 0
      };
    });

    // Use AI to analyze character and set baseline trait scores
    try {
      const characterAnalysis = await this.analyzeCharacterTraits(characterPack);
      
      // Apply AI-generated trait scores
      Object.entries(characterAnalysis.traits).forEach(([trait, data]) => {
        if (baselineTraits[trait]) {
          baselineTraits[trait].score = data.score;
          baselineTraits[trait].confidence = data.confidence;
          baselineTraits[trait].evidence = data.evidence;
        }
      });

      // Apply age-based modifications if age provided
      if (playerAge) {
        this.applyAgeInfluence(baselineTraits, playerAge);
      }

    } catch (error) {
      console.warn('⚠️ AI character analysis failed, using default values:', error);
    }

    return baselineTraits;
  }

  /**
   * Use AI to analyze character traits from character pack data
   */
  async analyzeCharacterTraits(characterPack) {
    const prompt = `
Analyze this literary character and score them on the 67-point Human Trait Character Modeling Matrix.

Character: ${characterPack.name}
Description: ${characterPack.description}
Personality: ${characterPack.personality}
Background: ${characterPack.background}
Speech Style: ${characterPack.speechStyle}

For each relevant trait, provide:
1. Score (0-100, where 50 is neutral/average)
2. Confidence level (0.0-1.0)
3. Evidence from the character description

Focus on traits that are clearly evident from the source material. Be conservative with scores - only deviate significantly from 50 if there's strong evidence.

Return response in this JSON format:
{
  "traits": {
    "trait_name": {
      "score": 75,
      "confidence": 0.8,
      "evidence": ["Specific quote or behavior showing this trait"]
    }
  },
  "dominant_traits": ["trait1", "trait2", "trait3"],
  "character_archetype": "description of overall personality type"
}

Available traits to score: ${Object.keys(TRAIT_METADATA).join(', ')}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert literary character analyst specializing in psychological trait assessment. Provide accurate, evidence-based trait scoring.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2048
    });

    try {
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Failed to parse AI trait analysis:', error);
      return { traits: {}, dominant_traits: [], character_archetype: 'Unknown' };
    }
  }

  /**
   * Apply age-based modifications to trait scores
   */
  applyAgeInfluence(traits, age) {
    // Age influences certain traits differently
    const ageModifiers = {
      // Younger people tend to be higher in certain traits
      novelty_seeking: age < 25 ? 10 : age > 50 ? -5 : 0,
      openness: age < 30 ? 5 : age > 60 ? -10 : 0,
      neuroticism: age < 25 ? 5 : age > 40 ? -8 : 0,
      
      // Older people tend to be higher in others
      conscientiousness: age < 25 ? -8 : age > 40 ? 10 : 0,
      agreeableness: age < 25 ? -5 : age > 50 ? 8 : 0,
      self_directedness: age < 25 ? -10 : age > 35 ? 8 : 0,
      
      // Experience-based traits
      wisdom: age < 30 ? -15 : age > 50 ? 15 : 0,
      patience: age < 25 ? -10 : age > 45 ? 12 : 0
    };

    Object.entries(ageModifiers).forEach(([trait, modifier]) => {
      if (traits[trait]) {
        traits[trait].score = Math.max(0, Math.min(100, traits[trait].score + modifier));
        traits[trait].ageInfluence = modifier;
      }
    });
  }

  /**
   * Evolve trait matrix based on player decision
   */
  async evolveMatrix(storyId, decisionData) {
    console.log('🔄 Evolving trait matrix based on decision...');

    const currentMatrix = this.traitMatrices.get(storyId);
    if (!currentMatrix) {
      console.warn('⚠️ No trait matrix found for story:', storyId);
      return null;
    }

    // Use AI to analyze decision impact on traits
    const traitEvolution = await this.analyzeDecisionImpact(
      currentMatrix,
      decisionData
    );

    // Apply trait changes
    const evolutionRecord = {
      timestamp: new Date().toISOString(),
      decisionId: decisionData.id,
      playerAction: decisionData.playerAction,
      traitChanges: {},
      reasoning: traitEvolution.reasoning
    };

    Object.entries(traitEvolution.changes).forEach(([trait, change]) => {
      if (currentMatrix[trait]) {
        const oldScore = currentMatrix[trait].score;
        const newScore = Math.max(0, Math.min(100, oldScore + change.delta));
        
        currentMatrix[trait].score = newScore;
        currentMatrix[trait].confidence = Math.min(1.0, currentMatrix[trait].confidence + 0.1);
        currentMatrix[trait].evidence.push({
          action: decisionData.playerAction,
          impact: change.delta,
          reasoning: change.reasoning,
          timestamp: new Date().toISOString()
        });
        currentMatrix[trait].lastUpdated = new Date().toISOString();

        evolutionRecord.traitChanges[trait] = {
          oldScore,
          newScore,
          delta: change.delta,
          reasoning: change.reasoning
        };
      }
    });

    // Store evolution record
    const history = this.evolutionHistory.get(storyId) || [];
    history.push(evolutionRecord);
    this.evolutionHistory.set(storyId, history);

    console.log(`✅ Matrix evolved: ${Object.keys(evolutionRecord.traitChanges).length} traits changed`);

    return evolutionRecord;
  }

  /**
   * Use AI to analyze how a decision impacts character traits
   */
  async analyzeDecisionImpact(currentMatrix, decisionData) {
    // Get top traits to focus analysis
    const dominantTraits = this.getDominantTraits(currentMatrix, 15);
    
    const prompt = `
Analyze how this player decision would impact the character traits of this literary character.

Player Action: "${decisionData.playerAction}"
Scene Context: ${decisionData.sceneContext}
Character: ${decisionData.characterName}

Current Dominant Traits (scores 0-100):
${dominantTraits.map(t => `${t.trait}: ${t.score}`).join('\n')}

Consider:
1. Which traits would this action strengthen or weaken?
2. How much change is realistic for a single decision? (usually ±1 to ±5 points)
3. Both conscious and subconscious trait impacts
4. How this action reflects or contradicts existing trait patterns

Return JSON format:
{
  "changes": {
    "trait_name": {
      "delta": 2,
      "reasoning": "explanation"
    }
  },
  "reasoning": "overall analysis of trait evolution"
}

Available traits: ${dominantTraits.map(t => t.trait).join(', ')}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a psychological trait evolution expert. Analyze decisions for realistic trait changes.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1024
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Failed to analyze decision impact:', error);
      return { changes: {}, reasoning: 'Analysis failed' };
    }
  }

  /**
   * Generate comprehensive AI assessment of current trait matrix
   */
  async generateAIAssessment(matrix, characterPack, decisionHistory, assessmentType = 'PERIODIC') {
    console.log('🤖 Generating AI trait assessment...');

    const dominantTraits = this.getDominantTraits(matrix, 10);
    const recentEvolution = this.getRecentEvolution(decisionHistory, 5);

    const prompt = `
Provide a comprehensive psychological assessment of how this player is portraying their character.

Character: ${characterPack.name}
Assessment Type: ${assessmentType}

Current Trait Profile (top traits, 0-100 scale):
${dominantTraits.map(t => `${t.trait} (${TRAIT_METADATA[t.trait]?.description}): ${t.score}`).join('\n')}

Recent Trait Evolution:
${recentEvolution.map(e => `${e.trait}: ${e.oldScore} → ${e.newScore} (${e.reasoning})`).join('\n')}

Provide detailed assessment covering:
1. Character authenticity score (0-100)
2. Psychological consistency score (0-100)  
3. Growth/development patterns
4. Strengths in portrayal
5. Areas for improvement
6. Notable trait combinations
7. Subconscious vs conscious trait balance

Return JSON format:
{
  "authenticity_score": 85,
  "consistency_score": 78,
  "overall_assessment": "detailed analysis",
  "strengths": ["strength1", "strength2"],
  "improvement_areas": ["area1", "area2"],
  "trait_insights": {
    "dominant_patterns": "analysis",
    "subconscious_influence": "analysis",
    "character_growth": "analysis"
  },
  "recommendations": ["suggestion1", "suggestion2"]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert character psychology assessor specializing in literary character authenticity.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1536
      });

      const assessment = JSON.parse(response.choices[0].message.content);
      
      // Add metadata
      assessment.timestamp = new Date().toISOString();
      assessment.assessment_type = assessmentType;
      assessment.trait_count = Object.keys(matrix).length;
      assessment.dominant_traits = dominantTraits.slice(0, 5);

      return assessment;
    } catch (error) {
      console.error('Failed to generate AI assessment:', error);
      return {
        authenticity_score: 50,
        consistency_score: 50,
        overall_assessment: 'Assessment failed - using default values',
        strengths: [],
        improvement_areas: [],
        trait_insights: {},
        recommendations: [],
        timestamp: new Date().toISOString(),
        assessment_type: assessmentType
      };
    }
  }

  /**
   * Get dominant traits sorted by score
   */
  getDominantTraits(matrix, limit = 10) {
    return Object.entries(matrix)
      .map(([trait, data]) => ({
        trait,
        score: data.score,
        confidence: data.confidence,
        category: TRAIT_METADATA[trait]?.category || 'UNKNOWN'
      }))
      .filter(t => Math.abs(t.score - 50) > 5) // Only include traits that deviate from neutral
      .sort((a, b) => Math.abs(b.score - 50) - Math.abs(a.score - 50))
      .slice(0, limit);
  }

  /**
   * Get recent trait evolution data
   */
  getRecentEvolution(decisionHistory, limit = 5) {
    // This would be implemented to extract recent trait changes
    // For now, return empty array
    return [];
  }

  /**
   * Calculate matrix change score between two time points
   */
  calculateMatrixChangeScore(baselineMatrix, currentMatrix) {
    let totalChange = 0;
    let traitCount = 0;

    Object.keys(baselineMatrix).forEach(trait => {
      if (currentMatrix[trait]) {
        const change = Math.abs(currentMatrix[trait].score - baselineMatrix[trait].score);
        totalChange += change;
        traitCount++;
      }
    });

    return traitCount > 0 ? totalChange / traitCount : 0;
  }

  /**
   * Evaluate consistency across sessions
   */
  evaluateConsistency(evolutionHistory) {
    // Implementation for consistency scoring across sessions
    // Would analyze trait evolution patterns for consistency
    return {
      score: 75, // Placeholder
      patterns: [],
      inconsistencies: []
    };
  }

  /**
   * Save trait matrix data
   */
  async saveMatrixData(storyId) {
    try {
      const data = {
        baseline: this.baselineMatrices.get(storyId),
        current: this.traitMatrices.get(storyId),
        evolution: this.evolutionHistory.get(storyId),
        assessment: this.assessmentCache.get(storyId)
      };

      await AsyncStorage.setItem(`trait_matrix_${storyId}`, JSON.stringify(data));
      console.log('💾 Trait matrix data saved');
    } catch (error) {
      console.error('❌ Failed to save trait matrix data:', error);
    }
  }

  /**
   * Load trait matrix data
   */
  async loadMatrixData(storyId) {
    try {
      const dataStr = await AsyncStorage.getItem(`trait_matrix_${storyId}`);
      if (dataStr) {
        const data = JSON.parse(dataStr);
        
        this.baselineMatrices.set(storyId, data.baseline);
        this.traitMatrices.set(storyId, data.current);
        this.evolutionHistory.set(storyId, data.evolution || []);
        this.assessmentCache.set(storyId, data.assessment);

        console.log('📂 Trait matrix data loaded');
        return data;
      }
    } catch (error) {
      console.error('❌ Failed to load trait matrix data:', error);
    }
    return null;
  }

  /**
   * Get comprehensive matrix summary for UI display
   */
  getMatrixSummary(storyId) {
    const current = this.traitMatrices.get(storyId);
    const baseline = this.baselineMatrices.get(storyId);
    const assessment = this.assessmentCache.get(storyId);

    if (!current || !baseline) return null;

    const dominant = this.getDominantTraits(current, 8);
    const changeScore = this.calculateMatrixChangeScore(baseline, current);

    return {
      dominant_traits: dominant,
      matrix_change_score: changeScore,
      assessment: assessment,
      conscious_traits: dominant.filter(t => 
        TRAIT_METADATA[t.trait]?.consciousness === 'CONSCIOUS'
      ),
      subconscious_traits: dominant.filter(t => 
        TRAIT_METADATA[t.trait]?.consciousness === 'SUBCONSCIOUS'
      ),
      trait_count: Object.keys(current).length,
      last_updated: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const characterTraitMatrix = new CharacterTraitMatrix();
export default characterTraitMatrix;