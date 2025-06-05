/**
 * InCharacter Phase 5: Enhanced Persona Scoring System
 * Integrates with Character Trait Matrix for Advanced Psychological Assessment
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { characterTraitMatrix, TRAIT_METADATA } from './characterTraitMatrix.js';
import { openai } from '../config.js';

// Enhanced scoring categories that work with trait matrix
export const ENHANCED_PERSONA_CATEGORIES = {
  // Core character authenticity (from Phase 2)
  DIALOGUE_AUTHENTICITY: 'dialogue_authenticity',
  ACTION_CONSISTENCY: 'action_consistency', 
  MORAL_ALIGNMENT: 'moral_alignment',
  EMOTIONAL_RESPONSE: 'emotional_response',
  RELATIONSHIP_HANDLING: 'relationship_handling',
  PERIOD_ACCURACY: 'period_accuracy',
  CHARACTER_GROWTH: 'character_growth',
  DECISION_MAKING: 'decision_making',

  // New Phase 5 categories
  TRAIT_MATRIX_CONSISTENCY: 'trait_matrix_consistency',     // How well choices align with trait matrix
  CONSCIOUS_TRAIT_EXPRESSION: 'conscious_trait_expression', // Expression of conscious traits
  SUBCONSCIOUS_PATTERN_ALIGNMENT: 'subconscious_pattern_alignment', // Subconscious trait patterns
  PSYCHOLOGICAL_DEPTH: 'psychological_depth',               // Overall psychological complexity
  TRAIT_EVOLUTION_COHERENCE: 'trait_evolution_coherence',   // Logical trait development
  DUAL_LAYER_BALANCE: 'dual_layer_balance'                  // Balance between conscious/subconscious
};

// Enhanced scoring levels with psychological insights
export const ENHANCED_SCORING_LEVELS = {
  PSYCHOLOGICAL_MASTERY: { score: 95, label: 'Psychological Mastery', description: 'Profound character understanding with complex trait integration' },
  EXPERT_PORTRAYAL: { score: 85, label: 'Expert Portrayal', description: 'Sophisticated character authenticity with clear trait patterns' },
  ADVANCED_AUTHENTICITY: { score: 75, label: 'Advanced Authenticity', description: 'Strong character consistency with emerging depth' },
  COMPETENT_CHARACTERIZATION: { score: 65, label: 'Competent Characterization', description: 'Solid character grasp with basic trait awareness' },
  DEVELOPING_UNDERSTANDING: { score: 55, label: 'Developing Understanding', description: 'Growing character insight with inconsistent patterns' },
  SURFACE_PORTRAYAL: { score: 45, label: 'Surface Portrayal', description: 'Basic character awareness without psychological depth' },
  DISCONNECT: { score: 35, label: 'Character Disconnect', description: 'Limited understanding of character psychology' }
};

/**
 * Enhanced Persona Scoring System with Trait Matrix Integration
 */
class EnhancedPersonaScoringSystem {
  constructor() {
    this.currentSession = null;
    this.scoringCache = new Map();
    this.decisionBuffer = [];
    this.characterProfiles = new Map();
    this.revealHistory = new Map();
    this.traitEvolutionLog = new Map();
    this.consistencyMetrics = new Map();
  }

  /**
   * Initialize enhanced persona scoring for a character and story
   */
  async initializeScoring(characterPack, storyId, playerAge = null) {
    console.log('🎭 Initializing Phase 5 enhanced persona scoring for:', characterPack.name);

    // Initialize trait matrix first
    const traitMatrixData = await characterTraitMatrix.initializeMatrix(storyId, characterPack, playerAge);

    const session = {
      storyId: storyId,
      characterId: characterPack.id,
      characterName: characterPack.name,
      decisionCount: 0,
      totalScore: 0,
      categoryScores: this.initializeEnhancedCategoryScores(),
      decisionHistory: [],
      revealSchedule: this.generateRevealSchedule(),
      lastReveal: null,
      characterProfile: this.buildEnhancedCharacterProfile(characterPack, traitMatrixData),
      startedAt: new Date().toISOString(),
      
      // Phase 5 enhancements
      traitMatrixEvolution: [],
      baselineTraitMatrix: traitMatrixData.baseline,
      currentTraitMatrix: traitMatrixData.current,
      psychologicalAssessments: [],
      matrixChangeScore: 0,
      consistencyScore: 100, // Start at perfect consistency
      playerAge: playerAge
    };

    this.currentSession = session;
    this.scoringCache.set(storyId, session);
    this.traitEvolutionLog.set(storyId, []);
    this.consistencyMetrics.set(storyId, { scores: [], patterns: [] });
    
    // Load existing session data if available
    await this.loadEnhancedScoringSession(storyId);
    
    console.log('✅ Enhanced persona scoring initialized');
    return session;
  }

  /**
   * Enhanced decision scoring with trait matrix integration
   */
  async scoreEnhancedDecision(decisionData) {
    if (!this.currentSession) return null;

    const session = this.currentSession;
    session.decisionCount++;

    console.log(`📊 Scoring enhanced decision #${session.decisionCount}...`);

    // Create enhanced decision record
    const decisionRecord = {
      id: `decision_${session.decisionCount}`,
      timestamp: new Date().toISOString(),
      playerAction: decisionData.playerAction,
      sceneContext: decisionData.sceneContext,
      characterExpected: decisionData.characterExpected || {},
      scores: {},
      enhancedScores: {},
      overallScore: 0,
      enhancedOverallScore: 0,
      feedback: {},
      enhancedFeedback: {},
      importance: decisionData.importance || 'medium',
      
      // Phase 5 additions
      traitMatrixImpact: null,
      psychologicalAnalysis: null,
      consciousTraitExpression: {},
      subconsciousPatternAlignment: {}
    };

    // 1. Traditional persona scoring (Phase 2)
    Object.keys(ENHANCED_PERSONA_CATEGORIES).forEach(category => {
      if (category in { 
        DIALOGUE_AUTHENTICITY: true, ACTION_CONSISTENCY: true, MORAL_ALIGNMENT: true, 
        EMOTIONAL_RESPONSE: true, RELATIONSHIP_HANDLING: true, PERIOD_ACCURACY: true, 
        CHARACTER_GROWTH: true, DECISION_MAKING: true 
      }) {
        const score = this.evaluateTraditionalCategory(category, decisionData);
        decisionRecord.scores[category] = score;
        this.updateCategoryScore(category, score);
      }
    });

    // 2. Evolve trait matrix based on decision
    const traitEvolution = await characterTraitMatrix.evolveMatrix(session.storyId, {
      ...decisionData,
      id: decisionRecord.id,
      characterName: session.characterName
    });

    if (traitEvolution) {
      decisionRecord.traitMatrixImpact = traitEvolution;
      session.traitMatrixEvolution.push(traitEvolution);
      
      // Update current trait matrix in session
      session.currentTraitMatrix = characterTraitMatrix.traitMatrices.get(session.storyId);
    }

    // 3. Enhanced psychological scoring with trait matrix
    const enhancedScores = await this.evaluateEnhancedCategories(decisionData, traitEvolution);
    decisionRecord.enhancedScores = enhancedScores;

    // Update enhanced category scores
    Object.entries(enhancedScores).forEach(([category, score]) => {
      this.updateCategoryScore(category, score);
    });

    // 4. Generate comprehensive psychological analysis
    decisionRecord.psychologicalAnalysis = await this.generateDecisionPsychologicalAnalysis(
      decisionData, 
      traitEvolution,
      session.currentTraitMatrix
    );

    // 5. Calculate overall scores
    decisionRecord.overallScore = this.calculateOverallScore(decisionRecord.scores);
    decisionRecord.enhancedOverallScore = this.calculateEnhancedOverallScore(
      decisionRecord.scores, 
      decisionRecord.enhancedScores
    );

    // 6. Update matrix change score
    session.matrixChangeScore = characterTraitMatrix.calculateMatrixChangeScore(
      session.baselineTraitMatrix,
      session.currentTraitMatrix
    );

    // 7. Update consistency metrics
    this.updateConsistencyMetrics(session.storyId, decisionRecord);

    // 8. Generate comprehensive feedback
    decisionRecord.feedback = this.generateTraditionalFeedback(decisionRecord);
    decisionRecord.enhancedFeedback = this.generateEnhancedFeedback(decisionRecord);

    // Add to decision history
    session.decisionHistory.push(decisionRecord);
    session.totalScore = this.calculateRunningAverage();

    // Check if it's time for enhanced reveal
    const shouldReveal = this.shouldRevealScore();
    let revealData = null;

    if (shouldReveal) {
      revealData = await this.generateEnhancedScoreReveal();
      session.lastReveal = {
        timestamp: new Date().toISOString(),
        decisionNumber: session.decisionCount,
        scores: { ...session.categoryScores },
        totalScore: session.totalScore,
        enhancedData: revealData.enhancedData
      };

      // Generate periodic psychological assessment
      const periodicAssessment = await characterTraitMatrix.generateAIAssessment(
        session.currentTraitMatrix,
        { name: session.characterName }, // Simplified character pack
        session.decisionHistory,
        'PERIODIC'
      );
      
      session.psychologicalAssessments.push(periodicAssessment);
    }

    // Auto-save enhanced session
    await this.saveEnhancedScoringSession();

    console.log(`✅ Enhanced decision scored: ${decisionRecord.enhancedOverallScore.toFixed(1)}/100`);

    return {
      decisionRecord,
      shouldReveal,
      revealData,
      currentScore: session.totalScore,
      enhancedScore: decisionRecord.enhancedOverallScore,
      matrixChangeScore: session.matrixChangeScore,
      consistencyScore: session.consistencyScore,
      decisionCount: session.decisionCount,
      traitEvolution: traitEvolution
    };
  }

  /**
   * Evaluate enhanced Phase 5 categories using trait matrix
   */
  async evaluateEnhancedCategories(decisionData, traitEvolution) {
    const session = this.currentSession;
    const currentMatrix = session.currentTraitMatrix;
    const enhancedScores = {};

    // 1. Trait Matrix Consistency - How well decision aligns with current traits
    enhancedScores[ENHANCED_PERSONA_CATEGORIES.TRAIT_MATRIX_CONSISTENCY] = 
      this.evaluateTraitMatrixConsistency(decisionData, currentMatrix);

    // 2. Conscious Trait Expression - Expression of conscious traits
    enhancedScores[ENHANCED_PERSONA_CATEGORIES.CONSCIOUS_TRAIT_EXPRESSION] = 
      this.evaluateConsciousTraitExpression(decisionData, currentMatrix);

    // 3. Subconscious Pattern Alignment - Alignment with subconscious patterns
    enhancedScores[ENHANCED_PERSONA_CATEGORIES.SUBCONSCIOUS_PATTERN_ALIGNMENT] = 
      this.evaluateSubconsciousPatternAlignment(decisionData, currentMatrix);

    // 4. Psychological Depth - Overall psychological complexity
    enhancedScores[ENHANCED_PERSONA_CATEGORIES.PSYCHOLOGICAL_DEPTH] = 
      this.evaluatePsychologicalDepth(decisionData, traitEvolution);

    // 5. Trait Evolution Coherence - Logical trait development
    enhancedScores[ENHANCED_PERSONA_CATEGORIES.TRAIT_EVOLUTION_COHERENCE] = 
      this.evaluateTraitEvolutionCoherence(traitEvolution, session.traitMatrixEvolution);

    // 6. Dual Layer Balance - Balance between conscious/subconscious expression
    enhancedScores[ENHANCED_PERSONA_CATEGORIES.DUAL_LAYER_BALANCE] = 
      this.evaluateDualLayerBalance(decisionData, currentMatrix);

    return enhancedScores;
  }

  /**
   * Evaluate how well decision aligns with current trait matrix
   */
  evaluateTraitMatrixConsistency(decisionData, traitMatrix) {
    const dominantTraits = characterTraitMatrix.getDominantTraits(traitMatrix, 10);
    let consistencyScore = 50; // Base score

    // Analyze action against dominant traits
    const playerAction = decisionData.playerAction.toLowerCase();
    
    dominantTraits.forEach(({ trait, score }) => {
      const metadata = TRAIT_METADATA[trait];
      if (!metadata) return;

      const traitStrength = Math.abs(score - 50) / 50; // 0-1 scale
      
      // Check for trait-consistent language and actions
      if (this.actionExpressesTrait(playerAction, trait, score > 50)) {
        consistencyScore += traitStrength * 10; // Boost for expressing strong traits
      } else if (this.actionContradictesTrait(playerAction, trait, score > 50)) {
        consistencyScore -= traitStrength * 15; // Penalty for contradicting strong traits
      }
    });

    return Math.max(0, Math.min(100, consistencyScore));
  }

  /**
   * Evaluate expression of conscious traits
   */
  evaluateConsciousTraitExpression(decisionData, traitMatrix) {
    const consciousTraits = Object.entries(traitMatrix)
      .filter(([trait, data]) => {
        const metadata = TRAIT_METADATA[trait];
        return metadata && (metadata.consciousness === 'CONSCIOUS' || metadata.consciousness === 'BOTH');
      })
      .sort(([, a], [, b]) => Math.abs(b.score - 50) - Math.abs(a.score - 50))
      .slice(0, 8); // Top 8 conscious traits

    let expressionScore = 50;
    const playerAction = decisionData.playerAction.toLowerCase();

    consciousTraits.forEach(([trait, data]) => {
      const traitStrength = Math.abs(data.score - 50) / 50;
      
      if (this.actionDeliberatelyExpressesTrait(playerAction, trait, data.score > 50)) {
        expressionScore += traitStrength * 12; // Reward deliberate expression
      }
    });

    return Math.max(0, Math.min(100, expressionScore));
  }

  /**
   * Evaluate alignment with subconscious patterns
   */
  evaluateSubconsciousPatternAlignment(decisionData, traitMatrix) {
    const subconsciousTraits = Object.entries(traitMatrix)
      .filter(([trait, data]) => {
        const metadata = TRAIT_METADATA[trait];
        return metadata && metadata.consciousness === 'SUBCONSCIOUS';
      })
      .sort(([, a], [, b]) => Math.abs(b.score - 50) - Math.abs(a.score - 50))
      .slice(0, 8); // Top 8 subconscious traits

    let alignmentScore = 50;
    const playerAction = decisionData.playerAction.toLowerCase();
    const sceneContext = decisionData.sceneContext || '';

    subconsciousTraits.forEach(([trait, data]) => {
      const traitStrength = Math.abs(data.score - 50) / 50;
      
      if (this.actionSubtlyReflectsTrait(playerAction, sceneContext, trait, data.score > 50)) {
        alignmentScore += traitStrength * 8; // Reward subtle subconscious expression
      }
    });

    return Math.max(0, Math.min(100, alignmentScore));
  }

  /**
   * Evaluate psychological depth and complexity
   */
  evaluatePsychologicalDepth(decisionData, traitEvolution) {
    let depthScore = 50;
    const playerAction = decisionData.playerAction;

    // Length and complexity of action
    const actionLength = playerAction.length;
    if (actionLength > 100) depthScore += 5;
    if (actionLength > 200) depthScore += 5;

    // Emotional complexity indicators
    const emotionalWords = ['feel', 'emotion', 'heart', 'soul', 'think', 'remember', 'regret', 'hope', 'fear', 'love', 'hate'];
    const emotionalCount = emotionalWords.filter(word => playerAction.toLowerCase().includes(word)).length;
    depthScore += emotionalCount * 3;

    // Internal conflict indicators
    const conflictWords = ['but', 'however', 'although', 'despite', 'torn', 'struggle', 'conflict', 'dilemma'];
    const conflictCount = conflictWords.filter(word => playerAction.toLowerCase().includes(word)).length;
    depthScore += conflictCount * 5;

    // Trait evolution indicates psychological growth
    if (traitEvolution && Object.keys(traitEvolution.traitChanges || {}).length > 0) {
      depthScore += 10;
    }

    return Math.max(0, Math.min(100, depthScore));
  }

  /**
   * Evaluate coherence of trait evolution
   */
  evaluateTraitEvolutionCoherence(currentEvolution, evolutionHistory) {
    let coherenceScore = 75; // Default good score

    if (!currentEvolution || !currentEvolution.traitChanges) return coherenceScore;

    const currentChanges = currentEvolution.traitChanges;
    
    // Check for erratic trait changes
    Object.entries(currentChanges).forEach(([trait, change]) => {
      const changeMagnitude = Math.abs(change.delta);
      
      // Penalize sudden large changes (unrealistic)
      if (changeMagnitude > 10) {
        coherenceScore -= 15;
      } else if (changeMagnitude > 5) {
        coherenceScore -= 5;
      }

      // Check for contradictory changes in recent history
      const recentChanges = evolutionHistory.slice(-3).filter(e => e.traitChanges && e.traitChanges[trait]);
      if (recentChanges.length > 0) {
        const recentDirections = recentChanges.map(e => Math.sign(e.traitChanges[trait].delta));
        const currentDirection = Math.sign(change.delta);
        
        // Penalize flip-flopping
        if (recentDirections.some(dir => dir !== 0 && dir !== currentDirection)) {
          coherenceScore -= 8;
        }
      }
    });

    return Math.max(0, Math.min(100, coherenceScore));
  }

  /**
   * Evaluate balance between conscious and subconscious trait expression
   */
  evaluateDualLayerBalance(decisionData, traitMatrix) {
    const playerAction = decisionData.playerAction.toLowerCase();
    
    let consciousExpression = 0;
    let subconsciousExpression = 0;
    let totalTraits = 0;

    Object.entries(traitMatrix).forEach(([trait, data]) => {
      const metadata = TRAIT_METADATA[trait];
      if (!metadata || Math.abs(data.score - 50) < 10) return; // Skip neutral traits
      
      totalTraits++;
      const expressed = this.actionExpressesTrait(playerAction, trait, data.score > 50);
      
      if (metadata.consciousness === 'CONSCIOUS') {
        if (expressed) consciousExpression++;
      } else if (metadata.consciousness === 'SUBCONSCIOUS') {
        if (expressed) subconsciousExpression++;
      } else if (metadata.consciousness === 'BOTH') {
        if (expressed) {
          consciousExpression += 0.5;
          subconsciousExpression += 0.5;
        }
      }
    });

    if (totalTraits === 0) return 50;

    const consciousRatio = consciousExpression / (totalTraits * 0.6); // Conscious traits easier to express
    const subconsciousRatio = subconsciousExpression / (totalTraits * 0.4); // Subconscious harder
    
    // Ideal balance is showing both layers appropriately
    const balance = 1 - Math.abs(consciousRatio - subconsciousRatio);
    return Math.max(30, Math.min(100, 50 + balance * 50));
  }

  /**
   * Helper: Check if action expresses a specific trait
   */
  actionExpressesTrait(action, trait, isPositive) {
    const traitKeywords = this.getTraitKeywords(trait, isPositive);
    return traitKeywords.some(keyword => action.includes(keyword));
  }

  /**
   * Helper: Check if action contradicts a specific trait
   */
  actionContradictesTrait(action, trait, isPositive) {
    const oppositeKeywords = this.getTraitKeywords(trait, !isPositive);
    return oppositeKeywords.some(keyword => action.includes(keyword));
  }

  /**
   * Helper: Check if action deliberately expresses trait (conscious)
   */
  actionDeliberatelyExpressesTrait(action, trait, isPositive) {
    // Look for explicit, deliberate expressions
    const deliberateIndicators = ['decide', 'choose', 'will', 'deliberately', 'intentionally', 'purpose'];
    const hasDeliberateLanguage = deliberateIndicators.some(indicator => action.includes(indicator));
    
    return hasDeliberateLanguage && this.actionExpressesTrait(action, trait, isPositive);
  }

  /**
   * Helper: Check if action subtly reflects trait (subconscious)
   */
  actionSubtlyReflectsTrait(action, context, trait, isPositive) {
    // Look for indirect expressions without explicit conscious choice
    const explicitIndicators = ['decide', 'choose', 'will', 'think', 'deliberately'];
    const hasExplicitLanguage = explicitIndicators.some(indicator => action.includes(indicator));
    
    return !hasExplicitLanguage && this.actionExpressesTrait(action, trait, isPositive);
  }

  /**
   * Get keywords associated with a trait
   */
  getTraitKeywords(trait, positive) {
    const keywords = {
      // Behavior traits
      resilience: positive ? ['persist', 'overcome', 'endure', 'bounce back', 'continue'] : ['give up', 'quit', 'surrender'],
      assertiveness: positive ? ['stand up', 'speak out', 'confident', 'direct'] : ['passive', 'meek', 'submissive'],
      procrastination: positive ? ['delay', 'postpone', 'later', 'wait'] : ['immediate', 'now', 'urgent'],
      
      // Emotions
      anger: positive ? ['furious', 'rage', 'mad', 'angry', 'livid'] : ['calm', 'peaceful', 'serene'],
      fear: positive ? ['afraid', 'scared', 'terrified', 'nervous'] : ['brave', 'bold', 'confident'],
      happiness: positive ? ['joy', 'smile', 'laugh', 'cheerful'] : ['sad', 'gloomy', 'depressed'],
      
      // Big Five
      extraversion: positive ? ['social', 'outgoing', 'talkative', 'energetic'] : ['quiet', 'reserved', 'withdrawn'],
      conscientiousness: positive ? ['organized', 'careful', 'planned', 'detail'] : ['careless', 'messy', 'impulsive'],
      openness: positive ? ['creative', 'curious', 'imaginative', 'new'] : ['traditional', 'conventional', 'routine'],
      
      // Dark Triad
      narcissism: positive ? ['superior', 'special', 'admire', 'deserve'] : ['humble', 'modest', 'equal'],
      machiavellianism: positive ? ['manipulate', 'use', 'scheme', 'advantage'] : ['honest', 'direct', 'genuine']
    };

    return keywords[trait] || [];
  }

  /**
   * Generate comprehensive psychological analysis for a decision
   */
  async generateDecisionPsychologicalAnalysis(decisionData, traitEvolution, currentMatrix) {
    const dominantTraits = characterTraitMatrix.getDominantTraits(currentMatrix, 8);
    
    const prompt = `
Provide a brief psychological analysis of this character decision and its trait implications.

Character Action: "${decisionData.playerAction}"
Scene Context: ${decisionData.sceneContext}

Current Dominant Traits:
${dominantTraits.map(t => `${t.trait}: ${t.score}/100`).join('\n')}

Trait Changes from This Decision:
${traitEvolution ? Object.entries(traitEvolution.traitChanges || {}).map(([trait, change]) => 
  `${trait}: ${change.oldScore} → ${change.newScore} (${change.reasoning})`).join('\n') : 'No changes'}

Provide concise analysis (max 150 words) covering:
1. Psychological motivations behind the action
2. How this reflects or changes character traits
3. Conscious vs subconscious influences
4. Character development implications

Return JSON format:
{
  "motivation_analysis": "brief analysis",
  "trait_reflection": "how action reflects traits",  
  "consciousness_level": "conscious/subconscious/mixed",
  "development_implication": "growth pattern"
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in character psychology and trait analysis. Provide concise, insightful analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 512
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Failed to generate psychological analysis:', error);
      return {
        motivation_analysis: 'Analysis unavailable',
        trait_reflection: 'Unable to analyze',
        consciousness_level: 'unknown',
        development_implication: 'Unclear'
      };
    }
  }

  /**
   * Generate enhanced score reveal with trait matrix insights
   */
  async generateEnhancedScoreReveal() {
    const session = this.currentSession;
    const matrixSummary = characterTraitMatrix.getMatrixSummary(session.storyId);
    const traditionalReveal = this.generateTraditionalScoreReveal();

    // Generate enhanced insights
    const enhancedInsights = await this.generateTraitMatrixInsights(matrixSummary);

    return {
      ...traditionalReveal,
      enhancedData: {
        matrixSummary: matrixSummary,
        traitInsights: enhancedInsights,
        psychologicalGrowth: this.calculatePsychologicalGrowth(),
        consciousSubconsciousBalance: this.calculateConsciousSubconsciousBalance(matrixSummary),
        evolutionPattern: this.analyzeEvolutionPattern(),
        nextDevelopmentStage: this.predictNextDevelopmentStage(matrixSummary)
      }
    };
  }

  /**
   * Generate trait matrix insights using AI
   */
  async generateTraitMatrixInsights(matrixSummary) {
    if (!matrixSummary) return null;

    const prompt = `
Analyze this character's psychological trait profile and provide insights for the player.

Dominant Traits:
${matrixSummary.dominant_traits.map(t => `${t.trait}: ${t.score}/100 (${t.confidence.toFixed(2)} confidence)`).join('\n')}

Conscious vs Subconscious Balance:
- Conscious: ${matrixSummary.conscious_traits.length} dominant traits
- Subconscious: ${matrixSummary.subconscious_traits.length} dominant traits

Matrix Change Score: ${matrixSummary.matrix_change_score.toFixed(1)}

Provide player-friendly insights in JSON format:
{
  "personality_summary": "2-3 sentence summary of character psychology",
  "dominant_pattern": "main psychological pattern",
  "growth_direction": "how character is developing",
  "conscious_strengths": ["strength1", "strength2"],
  "subconscious_influences": ["influence1", "influence2"],
  "authenticity_note": "comment on authenticity"
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a character psychology expert providing insights to help players understand their character portrayal.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 768
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Failed to generate trait matrix insights:', error);
      return null;
    }
  }

  /**
   * Calculate psychological growth metrics
   */
  calculatePsychologicalGrowth() {
    const session = this.currentSession;
    
    return {
      traitEvolutionCount: session.traitMatrixEvolution.length,
      matrixChangeScore: session.matrixChangeScore,
      growthTrend: this.calculateGrowthTrend(),
      developmentStability: this.calculateDevelopmentStability()
    };
  }

  /**
   * Calculate conscious/subconscious balance
   */
  calculateConsciousSubconsciousBalance(matrixSummary) {
    if (!matrixSummary) return { balance: 0.5, type: 'balanced' };

    const consciousCount = matrixSummary.conscious_traits.length;
    const subconsciousCount = matrixSummary.subconscious_traits.length;
    const total = consciousCount + subconsciousCount;

    if (total === 0) return { balance: 0.5, type: 'balanced' };

    const consciousRatio = consciousCount / total;
    
    let type = 'balanced';
    if (consciousRatio > 0.7) type = 'conscious_dominant';
    else if (consciousRatio < 0.3) type = 'subconscious_dominant';

    return { balance: consciousRatio, type: type };
  }

  /**
   * Initialize enhanced category scores
   */
  initializeEnhancedCategoryScores() {
    const scores = {};
    Object.values(ENHANCED_PERSONA_CATEGORIES).forEach(category => {
      scores[category] = {
        total: 0,
        count: 0,
        average: 50,
        recent: []
      };
    });
    return scores;
  }

  /**
   * Calculate enhanced overall score combining traditional and new metrics
   */
  calculateEnhancedOverallScore(traditionalScores, enhancedScores) {
    const traditionalWeight = 0.6;
    const enhancedWeight = 0.4;

    const traditionalAvg = this.calculateOverallScore(traditionalScores);
    const enhancedAvg = Object.values(enhancedScores).reduce((sum, score) => sum + score, 0) / Object.keys(enhancedScores).length;

    return traditionalAvg * traditionalWeight + enhancedAvg * enhancedWeight;
  }

  /**
   * Update consistency metrics
   */
  updateConsistencyMetrics(storyId, decisionRecord) {
    const metrics = this.consistencyMetrics.get(storyId) || { scores: [], patterns: [] };
    
    // Add current decision scores
    metrics.scores.push({
      timestamp: decisionRecord.timestamp,
      overall: decisionRecord.enhancedOverallScore,
      categories: { ...decisionRecord.scores, ...decisionRecord.enhancedScores }
    });

    // Keep only last 20 decisions for analysis
    if (metrics.scores.length > 20) {
      metrics.scores = metrics.scores.slice(-20);
    }

    // Calculate consistency score
    if (metrics.scores.length > 3) {
      const recentScores = metrics.scores.slice(-5).map(s => s.overall);
      const variance = this.calculateVariance(recentScores);
      const consistencyScore = Math.max(0, 100 - variance);
      this.currentSession.consistencyScore = consistencyScore;
    }

    this.consistencyMetrics.set(storyId, metrics);
  }

  /**
   * Helper methods for traditional scoring (adapted from Phase 2)
   */
  evaluateTraditionalCategory(category, decisionData) {
    // Simplified version - in full implementation, this would use the detailed
    // evaluation logic from the original personaScoring.js
    return 50 + Math.random() * 30 - 15; // Placeholder
  }

  generateTraditionalFeedback(decisionRecord) {
    return { message: 'Traditional feedback placeholder' };
  }

  generateEnhancedFeedback(decisionRecord) {
    return { message: 'Enhanced feedback placeholder' };
  }

  generateTraditionalScoreReveal() {
    return { traditional: 'score reveal data' };
  }

  // Additional helper methods...
  buildEnhancedCharacterProfile(characterPack, traitMatrixData) {
    return {
      ...characterPack,
      baselineTraits: traitMatrixData.baseline,
      initialAssessment: traitMatrixData.assessment
    };
  }

  calculateOverallScore(scores) {
    const values = Object.values(scores);
    return values.length > 0 ? values.reduce((sum, score) => sum + score, 0) / values.length : 50;
  }

  updateCategoryScore(category, newScore) {
    if (!this.currentSession) return;
    
    const categoryData = this.currentSession.categoryScores[category];
    if (categoryData) {
      categoryData.total += newScore;
      categoryData.count += 1;
      categoryData.average = categoryData.total / categoryData.count;
      
      // Keep recent scores for trend analysis
      categoryData.recent.push(newScore);
      if (categoryData.recent.length > 10) {
        categoryData.recent = categoryData.recent.slice(-10);
      }
    }
  }

  calculateRunningAverage() {
    if (!this.currentSession) return 50;
    
    const categories = this.currentSession.categoryScores;
    const averages = Object.values(categories).map(cat => cat.average);
    return averages.length > 0 ? averages.reduce((sum, avg) => sum + avg, 0) / averages.length : 50;
  }

  shouldRevealScore() {
    return this.currentSession && this.currentSession.decisionCount % 10 === 0;
  }

  calculateVariance(numbers) {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  calculateGrowthTrend() {
    // Simplified placeholder
    return 'positive';
  }

  calculateDevelopmentStability() {
    // Simplified placeholder
    return 0.8;
  }

  analyzeEvolutionPattern() {
    // Simplified placeholder
    return 'gradual_development';
  }

  predictNextDevelopmentStage(matrixSummary) {
    // Simplified placeholder
    return 'deeper_complexity';
  }

  /**
   * Save enhanced scoring session
   */
  async saveEnhancedScoringSession() {
    if (!this.currentSession) return;

    try {
      const sessionData = {
        ...this.currentSession,
        traitMatrixData: {
          baseline: this.currentSession.baselineTraitMatrix,
          current: this.currentSession.currentTraitMatrix,
          evolution: this.currentSession.traitMatrixEvolution
        }
      };

      await AsyncStorage.setItem(
        `enhanced_persona_${this.currentSession.storyId}`, 
        JSON.stringify(sessionData)
      );

      // Also save trait matrix data
      await characterTraitMatrix.saveMatrixData(this.currentSession.storyId);

      console.log('💾 Enhanced persona session saved');
    } catch (error) {
      console.error('❌ Failed to save enhanced persona session:', error);
    }
  }

  /**
   * Load enhanced scoring session
   */
  async loadEnhancedScoringSession(storyId) {
    try {
      const sessionDataStr = await AsyncStorage.getItem(`enhanced_persona_${storyId}`);
      if (sessionDataStr) {
        const sessionData = JSON.parse(sessionDataStr);
        
        // Merge loaded data with current session
        Object.assign(this.currentSession, sessionData);
        
        // Load trait matrix data
        await characterTraitMatrix.loadMatrixData(storyId);
        
        console.log('📂 Enhanced persona session loaded');
        return sessionData;
      }
    } catch (error) {
      console.error('❌ Failed to load enhanced persona session:', error);
    }
    return null;
  }

  /**
   * Get enhanced persona summary for UI
   */
  getEnhancedPersonaSummary() {
    if (!this.currentSession) return null;

    const session = this.currentSession;
    const matrixSummary = characterTraitMatrix.getMatrixSummary(session.storyId);

    return {
      // Traditional metrics
      totalScore: session.totalScore,
      decisionCount: session.decisionCount,
      categoryScores: session.categoryScores,
      
      // Enhanced metrics
      matrixChangeScore: session.matrixChangeScore,
      consistencyScore: session.consistencyScore,
      matrixSummary: matrixSummary,
      psychologicalGrowth: this.calculatePsychologicalGrowth(),
      lastAssessment: session.psychologicalAssessments[session.psychologicalAssessments.length - 1],
      
      // Insights
      dominantTraits: matrixSummary?.dominant_traits || [],
      consciousSubconsciousBalance: this.calculateConsciousSubconsciousBalance(matrixSummary),
      evolutionTrend: this.analyzeEvolutionPattern()
    };
  }
}

// Export singleton instance
export const enhancedPersonaScoring = new EnhancedPersonaScoringSystem();
export default enhancedPersonaScoring;