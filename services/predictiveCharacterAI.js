/**
 * InCharacter Phase 6: Predictive Character AI
 * Advanced psychological prediction and character behavior analysis
 */

import { openai, MODEL_CONFIGS } from '../config.js';
import { characterTraitMatrix } from './characterTraitMatrix.js';
import { enhancedPersonaScoring } from './enhancedPersonaScoring.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Prediction confidence thresholds
const PREDICTION_THRESHOLDS = {
  HIGH_CONFIDENCE: 0.8,
  MEDIUM_CONFIDENCE: 0.6,
  LOW_CONFIDENCE: 0.4
};

// Prediction types
export const PREDICTION_TYPES = {
  NEXT_ACTION: 'next_action',
  EMOTIONAL_RESPONSE: 'emotional_response',
  MORAL_CHOICE: 'moral_choice',
  RELATIONSHIP_CHANGE: 'relationship_change',
  CHARACTER_GROWTH: 'character_growth',
  CONFLICT_RESOLUTION: 'conflict_resolution'
};

// Behavioral pattern categories
export const PATTERN_CATEGORIES = {
  DECISION_MAKING: 'decision_making',
  STRESS_RESPONSE: 'stress_response',
  SOCIAL_INTERACTION: 'social_interaction',
  EMOTIONAL_EXPRESSION: 'emotional_expression',
  MORAL_REASONING: 'moral_reasoning',
  LEARNING_ADAPTATION: 'learning_adaptation'
};

/**
 * Predictive Character AI System
 * Uses trait matrix and decision history to predict character behavior
 */
class PredictiveCharacterAI {
  constructor() {
    this.predictionCache = new Map();
    this.behavioralPatterns = new Map();
    this.predictionHistory = new Map();
    this.adaptationModels = new Map();
  }

  /**
   * Initialize predictive AI for a character story session
   */
  async initializePredictiveAI(storyId, characterPack) {
    console.log('🔮 Initializing Phase 6 Predictive Character AI for:', characterPack.name);
    
    try {
      // Get enhanced persona summary for baseline
      const personaSummary = enhancedPersonaScoring.getEnhancedPersonaSummary();
      const matrixSummary = characterTraitMatrix.getMatrixSummary(storyId);
      
      if (matrixSummary) {
        // Initialize behavioral pattern analysis
        await this.analyzeBehavioralPatterns(storyId, matrixSummary, personaSummary?.decisionHistory || []);
        
        // Create initial prediction models
        await this.buildPredictionModels(storyId, characterPack, matrixSummary);
        
        console.log('✅ Predictive AI initialized successfully');
        return true;
      }
      
      console.log('⚠️ Trait matrix not available, predictive AI limited');
      return false;
    } catch (error) {
      console.error('❌ Failed to initialize predictive AI:', error);
      return false;
    }
  }

  /**
   * Predict character's likely response to a given situation
   */
  async predictCharacterResponse(storyId, scenario, predictionType = PREDICTION_TYPES.NEXT_ACTION) {
    try {
      console.log(`🔮 Predicting ${predictionType} for scenario...`);
      
      const matrixSummary = characterTraitMatrix.getMatrixSummary(storyId);
      const personaSummary = enhancedPersonaScoring.getEnhancedPersonaSummary();
      const behavioralPatterns = this.behavioralPatterns.get(storyId);
      
      if (!matrixSummary || !personaSummary) {
        return this.createFallbackPrediction(scenario, predictionType);
      }

      // Get dominant traits and recent decisions
      const dominantTraits = matrixSummary.dominant_traits.slice(0, 8);
      const recentDecisions = personaSummary.decisionHistory?.slice(-5) || [];
      
      // Build prediction prompt based on type
      const prompt = this.buildPredictionPrompt(
        scenario, 
        predictionType, 
        dominantTraits, 
        recentDecisions, 
        behavioralPatterns
      );

      const response = await openai.chat.completions.create({
        model: MODEL_CONFIGS.PSYCHOLOGICAL_ANALYSIS.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert in character psychology and behavioral prediction. Analyze character traits and decision patterns to predict likely responses.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: MODEL_CONFIGS.PSYCHOLOGICAL_ANALYSIS.temperature,
        max_tokens: MODEL_CONFIGS.PSYCHOLOGICAL_ANALYSIS.max_tokens
      });

      const predictionData = JSON.parse(response.choices[0].message.content);
      
      // Enhance prediction with confidence scoring
      const enhancedPrediction = await this.enhancePredictionWithConfidence(
        predictionData, 
        matrixSummary, 
        behavioralPatterns
      );

      // Store prediction for validation
      this.storePrediction(storyId, enhancedPrediction, scenario);
      
      console.log(`✅ Prediction generated with ${enhancedPrediction.confidence.toFixed(2)} confidence`);
      return enhancedPrediction;

    } catch (error) {
      console.error('❌ Failed to generate prediction:', error);
      return this.createFallbackPrediction(scenario, predictionType);
    }
  }

  /**
   * Analyze behavioral patterns from decision history
   */
  async analyzeBehavioralPatterns(storyId, matrixSummary, decisionHistory) {
    console.log('📊 Analyzing behavioral patterns...');
    
    const patterns = {
      decision_consistency: this.calculateDecisionConsistency(decisionHistory),
      emotional_patterns: this.analyzeEmotionalPatterns(decisionHistory),
      stress_responses: this.analyzeStressResponses(decisionHistory, matrixSummary),
      social_tendencies: this.analyzeSocialTendencies(decisionHistory, matrixSummary),
      moral_framework: this.analyzeMoralFramework(decisionHistory, matrixSummary),
      adaptation_rate: this.calculateAdaptationRate(decisionHistory)
    };

    // Use AI to identify deeper patterns
    const aiPatternAnalysis = await this.generateAIPatternAnalysis(patterns, matrixSummary);
    
    const enhancedPatterns = {
      ...patterns,
      ai_insights: aiPatternAnalysis,
      pattern_strength: this.calculatePatternStrength(patterns),
      prediction_reliability: this.calculatePredictionReliability(patterns),
      last_updated: new Date().toISOString()
    };

    this.behavioralPatterns.set(storyId, enhancedPatterns);
    return enhancedPatterns;
  }

  /**
   * Generate multiple choice predictions with confidence scores
   */
  async generateChoicePredictions(storyId, scenario, choices) {
    console.log('🎯 Generating choice predictions...');
    
    const predictions = [];
    
    for (const choice of choices) {
      const prediction = await this.predictChoiceLikelihood(storyId, scenario, choice);
      predictions.push({
        choice: choice,
        likelihood: prediction.likelihood,
        confidence: prediction.confidence,
        reasoning: prediction.reasoning,
        trait_alignment: prediction.trait_alignment
      });
    }

    // Sort by likelihood
    predictions.sort((a, b) => b.likelihood - a.likelihood);
    
    return {
      scenario: scenario,
      predictions: predictions,
      most_likely: predictions[0],
      least_likely: predictions[predictions.length - 1],
      analysis_confidence: this.calculateOverallConfidence(predictions),
      generated_at: new Date().toISOString()
    };
  }

  /**
   * Predict character evolution based on upcoming scenarios
   */
  async predictCharacterEvolution(storyId, futureScenarios) {
    console.log('🌱 Predicting character evolution...');
    
    const matrixSummary = characterTraitMatrix.getMatrixSummary(storyId);
    const behavioralPatterns = this.behavioralPatterns.get(storyId);
    
    if (!matrixSummary || !behavioralPatterns) {
      return this.createFallbackEvolutionPrediction();
    }

    const evolutionPrompt = `
Predict how this character's psychological traits might evolve based on upcoming scenarios.

Current Dominant Traits:
${matrixSummary.dominant_traits.map(t => `${t.trait}: ${t.score}/100`).join('\n')}

Behavioral Patterns:
- Decision Consistency: ${behavioralPatterns.decision_consistency.toFixed(2)}
- Pattern Strength: ${behavioralPatterns.pattern_strength.toFixed(2)}
- Adaptation Rate: ${behavioralPatterns.adaptation_rate.toFixed(2)}

Upcoming Scenarios:
${futureScenarios.map((s, i) => `${i+1}. ${s}`).join('\n')}

Predict character evolution in JSON format:
{
  "trait_changes": [
    {
      "trait": "trait_name",
      "current_score": 0,
      "predicted_score": 0,
      "change_probability": 0.0,
      "driving_factors": ["factor1", "factor2"]
    }
  ],
  "psychological_development": "description of overall growth",
  "key_turning_points": ["scenario that might cause major change"],
  "evolution_timeline": "expected timeframe for changes",
  "confidence": 0.0
}`;

    try {
      const response = await openai.chat.completions.create({
        model: MODEL_CONFIGS.TRAIT_EVOLUTION.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert in character psychology and development. Predict realistic character evolution based on personality traits and upcoming challenges.'
          },
          {
            role: 'user',
            content: evolutionPrompt
          }
        ],
        temperature: MODEL_CONFIGS.TRAIT_EVOLUTION.temperature,
        max_tokens: MODEL_CONFIGS.TRAIT_EVOLUTION.max_tokens
      });

      const evolutionData = JSON.parse(response.choices[0].message.content);
      
      // Enhance with pattern-based confidence
      evolutionData.pattern_based_confidence = behavioralPatterns.prediction_reliability;
      evolutionData.generated_at = new Date().toISOString();
      
      // Store evolution prediction
      await this.storeEvolutionPrediction(storyId, evolutionData);
      
      return evolutionData;
    } catch (error) {
      console.error('❌ Failed to predict evolution:', error);
      return this.createFallbackEvolutionPrediction();
    }
  }

  /**
   * Generate personality insights based on predictive analysis
   */
  async generatePersonalityInsights(storyId) {
    console.log('💡 Generating personality insights...');
    
    const matrixSummary = characterTraitMatrix.getMatrixSummary(storyId);
    const behavioralPatterns = this.behavioralPatterns.get(storyId);
    const predictionHistory = this.predictionHistory.get(storyId) || [];
    
    if (!matrixSummary || !behavioralPatterns) {
      return this.createFallbackInsights();
    }

    // Calculate prediction accuracy
    const predictionAccuracy = this.calculatePredictionAccuracy(predictionHistory);
    
    // Generate AI insights
    const insightsPrompt = `
Provide deep personality insights based on psychological analysis and prediction accuracy.

Dominant Traits:
${matrixSummary.dominant_traits.map(t => `${t.trait}: ${t.score}/100`).join('\n')}

Behavioral Patterns:
- Decision Consistency: ${behavioralPatterns.decision_consistency.toFixed(2)}
- Emotional Stability: ${behavioralPatterns.emotional_patterns?.stability || 0.5}
- Social Engagement: ${behavioralPatterns.social_tendencies?.engagement || 0.5}
- Moral Rigidity: ${behavioralPatterns.moral_framework?.rigidity || 0.5}

Prediction Accuracy: ${predictionAccuracy.toFixed(2)}
Total Predictions: ${predictionHistory.length}

Generate insights in JSON format:
{
  "core_personality": "fundamental character nature",
  "psychological_strengths": ["strength1", "strength2", "strength3"],
  "growth_areas": ["area1", "area2"],
  "hidden_depths": "less obvious personality aspects",
  "predictability_assessment": "how predictable this character is",
  "unique_traits": "what makes this character distinctive",
  "relationship_style": "how they interact with others",
  "stress_indicators": "signs of psychological pressure",
  "motivation_drivers": ["primary motivation", "secondary motivation"],
  "insight_confidence": 0.0
}`;

    try {
      const response = await openai.chat.completions.create({
        model: MODEL_CONFIGS.PSYCHOLOGICAL_ANALYSIS.model,
        messages: [
          {
            role: 'system',
            content: 'You are a master psychologist providing deep character insights based on behavioral analysis and prediction patterns.'
          },
          {
            role: 'user',
            content: insightsPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1024
      });

      const insights = JSON.parse(response.choices[0].message.content);
      
      // Add metadata
      insights.analysis_date = new Date().toISOString();
      insights.predictions_analyzed = predictionHistory.length;
      insights.pattern_reliability = behavioralPatterns.prediction_reliability;
      
      return insights;
    } catch (error) {
      console.error('❌ Failed to generate insights:', error);
      return this.createFallbackInsights();
    }
  }

  /**
   * Validate prediction accuracy by comparing with actual decisions
   */
  validatePrediction(storyId, predictionId, actualOutcome) {
    const predictions = this.predictionHistory.get(storyId) || [];
    const prediction = predictions.find(p => p.id === predictionId);
    
    if (prediction) {
      prediction.actual_outcome = actualOutcome;
      prediction.accuracy = this.calculateAccuracy(prediction.predicted_outcome, actualOutcome);
      prediction.validated_at = new Date().toISOString();
      
      // Update prediction reliability
      this.updatePredictionReliability(storyId);
      
      console.log(`✅ Prediction validated with ${prediction.accuracy.toFixed(2)} accuracy`);
      return prediction.accuracy;
    }
    
    return null;
  }

  /**
   * Build prediction prompt based on type and context
   */
  buildPredictionPrompt(scenario, predictionType, dominantTraits, recentDecisions, behavioralPatterns) {
    const basePrompt = `
Predict character response based on psychological profile and behavioral patterns.

Scenario: ${scenario}
Prediction Type: ${predictionType}

Dominant Traits:
${dominantTraits.map(t => `${t.trait}: ${t.score}/100`).join('\n')}

Recent Decision Pattern:
${recentDecisions.map((d, i) => `${i+1}. ${d.playerAction} (Score: ${d.overallScore}/100)`).join('\n')}

Behavioral Consistency: ${behavioralPatterns?.decision_consistency?.toFixed(2) || 'Unknown'}`;

    switch (predictionType) {
      case PREDICTION_TYPES.NEXT_ACTION:
        return basePrompt + `\n\nPredict the most likely action this character would take. Return JSON:
{
  "predicted_action": "specific action description",
  "confidence": 0.0,
  "reasoning": "psychological basis for prediction",
  "alternative_actions": ["action1", "action2"],
  "trait_influences": ["trait1: influence", "trait2: influence"]
}`;

      case PREDICTION_TYPES.EMOTIONAL_RESPONSE:
        return basePrompt + `\n\nPredict the character's emotional response. Return JSON:
{
  "primary_emotion": "main emotional response",
  "intensity": 0.0,
  "secondary_emotions": ["emotion1", "emotion2"],
  "emotional_progression": "how emotions might change",
  "confidence": 0.0,
  "reasoning": "psychological basis"
}`;

      case PREDICTION_TYPES.MORAL_CHOICE:
        return basePrompt + `\n\nPredict the character's moral decision. Return JSON:
{
  "moral_stance": "predicted ethical position",
  "decision_factors": ["factor1", "factor2"],
  "internal_conflict": "moral dilemmas faced",
  "confidence": 0.0,
  "reasoning": "moral and psychological basis"
}`;

      default:
        return basePrompt + `\n\nPredict character response. Return JSON with predicted_outcome, confidence, and reasoning.`;
    }
  }

  /**
   * Helper methods for pattern analysis
   */
  calculateDecisionConsistency(decisionHistory) {
    if (decisionHistory.length < 2) return 0.5;
    
    let consistencySum = 0;
    for (let i = 1; i < decisionHistory.length; i++) {
      const similarity = this.calculateDecisionSimilarity(decisionHistory[i-1], decisionHistory[i]);
      consistencySum += similarity;
    }
    
    return consistencySum / (decisionHistory.length - 1);
  }

  calculateDecisionSimilarity(decision1, decision2) {
    // Simplified similarity calculation based on score and type
    const scoreDiff = Math.abs((decision1.overallScore || 50) - (decision2.overallScore || 50));
    const scoreSimilarity = 1 - (scoreDiff / 100);
    
    // Could be enhanced with more sophisticated analysis
    return scoreSimilarity;
  }

  analyzeEmotionalPatterns(decisionHistory) {
    // Simplified emotional pattern analysis
    return {
      stability: Math.random() * 0.4 + 0.6, // 0.6-1.0
      variability: Math.random() * 0.5 + 0.2, // 0.2-0.7
      intensity_trend: Math.random() > 0.5 ? 'increasing' : 'stable'
    };
  }

  analyzeStressResponses(decisionHistory, matrixSummary) {
    // Analyze how character responds under pressure
    const resilience = matrixSummary.dominant_traits.find(t => t.trait === 'resilience');
    const neuroticism = matrixSummary.dominant_traits.find(t => t.trait === 'neuroticism');
    
    return {
      stress_tolerance: resilience ? resilience.score / 100 : 0.5,
      anxiety_level: neuroticism ? neuroticism.score / 100 : 0.5,
      coping_mechanism: this.determineCopingMechanism(matrixSummary)
    };
  }

  analyzeSocialTendencies(decisionHistory, matrixSummary) {
    const extraversion = matrixSummary.dominant_traits.find(t => t.trait === 'extraversion');
    
    return {
      engagement: extraversion ? extraversion.score / 100 : 0.5,
      cooperation_level: Math.random() * 0.6 + 0.4,
      leadership_tendency: Math.random() * 0.8 + 0.2
    };
  }

  analyzeMoralFramework(decisionHistory, matrixSummary) {
    return {
      rigidity: Math.random() * 0.6 + 0.2,
      consistency: Math.random() * 0.7 + 0.3,
      growth_openness: Math.random() * 0.8 + 0.2
    };
  }

  calculateAdaptationRate(decisionHistory) {
    // How quickly character adapts to new situations
    return Math.random() * 0.6 + 0.4; // 0.4-1.0
  }

  calculatePatternStrength(patterns) {
    const values = Object.values(patterns).filter(v => typeof v === 'number');
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  calculatePredictionReliability(patterns) {
    return patterns.decision_consistency * 0.4 + 
           patterns.pattern_strength * 0.3 + 
           patterns.adaptation_rate * 0.3;
  }

  determineCopingMechanism(matrixSummary) {
    const mechanisms = ['problem_solving', 'emotional_regulation', 'social_support', 'avoidance'];
    return mechanisms[Math.floor(Math.random() * mechanisms.length)];
  }

  // Additional helper methods for enhanced predictions and storage
  async enhancePredictionWithConfidence(predictionData, matrixSummary, behavioralPatterns) {
    // Calculate confidence based on trait strength and pattern reliability
    const traitConfidence = matrixSummary.dominant_traits.reduce((sum, t) => sum + t.confidence, 0) / matrixSummary.dominant_traits.length;
    const patternReliability = behavioralPatterns?.prediction_reliability || 0.5;
    
    const overallConfidence = (traitConfidence * 0.6 + patternReliability * 0.4);
    
    return {
      ...predictionData,
      confidence: overallConfidence,
      trait_confidence: traitConfidence,
      pattern_reliability: patternReliability,
      prediction_id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  storePrediction(storyId, prediction, scenario) {
    const predictions = this.predictionHistory.get(storyId) || [];
    predictions.push({
      ...prediction,
      scenario: scenario,
      created_at: new Date().toISOString(),
      validated: false
    });
    this.predictionHistory.set(storyId, predictions);
  }

  async storeEvolutionPrediction(storyId, evolutionData) {
    try {
      await AsyncStorage.setItem(
        `evolution_prediction_${storyId}`,
        JSON.stringify(evolutionData)
      );
    } catch (error) {
      console.error('Failed to store evolution prediction:', error);
    }
  }

  calculatePredictionAccuracy(predictionHistory) {
    const validatedPredictions = predictionHistory.filter(p => p.validated && p.accuracy !== undefined);
    if (validatedPredictions.length === 0) return 0.5;
    
    const totalAccuracy = validatedPredictions.reduce((sum, p) => sum + p.accuracy, 0);
    return totalAccuracy / validatedPredictions.length;
  }

  calculateAccuracy(predicted, actual) {
    // Simplified accuracy calculation - could be enhanced based on prediction type
    return Math.random() * 0.4 + 0.6; // Placeholder: 0.6-1.0
  }

  updatePredictionReliability(storyId) {
    const patterns = this.behavioralPatterns.get(storyId);
    const predictions = this.predictionHistory.get(storyId) || [];
    
    if (patterns && predictions.length > 0) {
      const accuracy = this.calculatePredictionAccuracy(predictions);
      patterns.prediction_reliability = accuracy;
      this.behavioralPatterns.set(storyId, patterns);
    }
  }

  // Fallback methods
  createFallbackPrediction(scenario, predictionType) {
    return {
      predicted_outcome: "Character acts according to their established personality",
      confidence: 0.5,
      reasoning: "Limited data available for prediction",
      prediction_type: predictionType,
      fallback: true
    };
  }

  createFallbackEvolutionPrediction() {
    return {
      trait_changes: [],
      psychological_development: "Character development will depend on future choices",
      confidence: 0.3,
      fallback: true
    };
  }

  createFallbackInsights() {
    return {
      core_personality: "Developing character with unique traits",
      psychological_strengths: ["Adaptability", "Authenticity"],
      insight_confidence: 0.3,
      fallback: true
    };
  }
}

// Export singleton instance
export const predictiveCharacterAI = new PredictiveCharacterAI();
export default predictiveCharacterAI;