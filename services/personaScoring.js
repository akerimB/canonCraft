/**
 * InCharacter Periodic Persona Assessment System
 * Tracks character authenticity and reveals scores every 10 decisions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Persona evaluation categories
export const PERSONA_CATEGORIES = {
  DIALOGUE_AUTHENTICITY: 'dialogue_authenticity',    // How well dialogue matches character
  ACTION_CONSISTENCY: 'action_consistency',          // Actions align with character personality
  MORAL_ALIGNMENT: 'moral_alignment',                // Choices match character's moral code
  EMOTIONAL_RESPONSE: 'emotional_response',          // Emotional reactions are character-appropriate
  RELATIONSHIP_HANDLING: 'relationship_handling',    // How character interacts with others
  PERIOD_ACCURACY: 'period_accuracy',               // Maintains historical/literary period accuracy
  CHARACTER_GROWTH: 'character_growth',             // Shows authentic character development
  DECISION_MAKING: 'decision_making'                // Decision patterns match character mindset
};

// Scoring levels
export const SCORING_LEVELS = {
  MASTERFUL: { score: 90, label: 'Masterful', description: 'Exceptional character portrayal' },
  EXCELLENT: { score: 80, label: 'Excellent', description: 'Strong character authenticity' },
  GOOD: { score: 70, label: 'Good', description: 'Solid character understanding' },
  FAIR: { score: 60, label: 'Fair', description: 'Basic character grasp' },
  NEEDS_WORK: { score: 50, label: 'Needs Work', description: 'Some character inconsistencies' },
  INCONSISTENT: { score: 40, label: 'Inconsistent', description: 'Frequent character breaks' },
  POOR: { score: 30, label: 'Poor', description: 'Little character authenticity' }
};

class PersonaScoringSystem {
  constructor() {
    this.currentSession = null;
    this.scoringCache = new Map();
    this.decisionBuffer = [];
    this.characterProfiles = new Map();
    this.revealHistory = new Map();
  }

  /**
   * Initialize persona scoring for a character and story
   */
  async initializeScoring(characterPack, storyId) {
    const session = {
      storyId: storyId,
      characterId: characterPack.id,
      characterName: characterPack.name,
      decisionCount: 0,
      totalScore: 0,
      categoryScores: this.initializeCategoryScores(),
      decisionHistory: [],
      revealSchedule: this.generateRevealSchedule(),
      lastReveal: null,
      characterProfile: this.buildCharacterProfile(characterPack),
      startedAt: new Date().toISOString()
    };

    this.currentSession = session;
    this.scoringCache.set(storyId, session);
    
    // Load existing session data if available
    await this.loadScoringSession(storyId);
    
    return session;
  }

  /**
   * Score a player decision and update running totals
   */
  scoreDecision(decisionData) {
    if (!this.currentSession) return null;

    const session = this.currentSession;
    session.decisionCount++;

    // Create decision record
    const decisionRecord = {
      id: `decision_${session.decisionCount}`,
      timestamp: new Date().toISOString(),
      playerAction: decisionData.playerAction,
      sceneContext: decisionData.sceneContext,
      characterExpected: decisionData.characterExpected || {},
      scores: {},
      overallScore: 0,
      feedback: {},
      importance: decisionData.importance || 'medium'
    };

    // Score each persona category
    Object.keys(PERSONA_CATEGORIES).forEach(category => {
      const score = this.evaluateCategory(category, decisionData);
      decisionRecord.scores[category] = score;
      
      // Update running category averages
      this.updateCategoryScore(category, score);
    });

    // Calculate overall decision score
    decisionRecord.overallScore = this.calculateOverallScore(decisionRecord.scores);
    
    // Generate feedback for this decision
    decisionRecord.feedback = this.generateDecisionFeedback(decisionRecord);

    // Add to decision history
    session.decisionHistory.push(decisionRecord);
    session.totalScore = this.calculateRunningAverage();

    // Check if it's time for a reveal
    const shouldReveal = this.shouldRevealScore();
    let revealData = null;

    if (shouldReveal) {
      revealData = this.generateScoreReveal();
      session.lastReveal = {
        timestamp: new Date().toISOString(),
        decisionNumber: session.decisionCount,
        scores: { ...session.categoryScores },
        totalScore: session.totalScore
      };
    }

    // Auto-save session
    this.saveScoringSession();

    return {
      decisionRecord,
      shouldReveal,
      revealData,
      currentScore: session.totalScore,
      decisionCount: session.decisionCount
    };
  }

  /**
   * Evaluate a specific persona category for a decision
   */
  evaluateCategory(category, decisionData) {
    const characterProfile = this.currentSession.characterProfile;
    const { playerAction, sceneContext } = decisionData;

    switch (category) {
      case PERSONA_CATEGORIES.DIALOGUE_AUTHENTICITY:
        return this.scoreDialogueAuthenticity(playerAction, characterProfile);
      
      case PERSONA_CATEGORIES.ACTION_CONSISTENCY:
        return this.scoreActionConsistency(playerAction, characterProfile);
      
      case PERSONA_CATEGORIES.MORAL_ALIGNMENT:
        return this.scoreMoralAlignment(playerAction, characterProfile);
      
      case PERSONA_CATEGORIES.EMOTIONAL_RESPONSE:
        return this.scoreEmotionalResponse(playerAction, sceneContext, characterProfile);
      
      case PERSONA_CATEGORIES.RELATIONSHIP_HANDLING:
        return this.scoreRelationshipHandling(playerAction, sceneContext, characterProfile);
      
      case PERSONA_CATEGORIES.PERIOD_ACCURACY:
        return this.scorePeriodAccuracy(playerAction, characterProfile);
      
      case PERSONA_CATEGORIES.CHARACTER_GROWTH:
        return this.scoreCharacterGrowth(playerAction, characterProfile);
      
      case PERSONA_CATEGORIES.DECISION_MAKING:
        return this.scoreDecisionMaking(playerAction, characterProfile);
      
      default:
        return 50; // Neutral score
    }
  }

  /**
   * Score dialogue authenticity
   */
  scoreDialogueAuthenticity(playerAction, characterProfile) {
    let score = 50; // Base score
    
    // Check for character-specific speech patterns
    if (this.containsCharacterSpeechPatterns(playerAction, characterProfile)) {
      score += 20;
    }
    
    // Check for period-appropriate language
    if (this.usesPeriodAppropriateLang(playerAction, characterProfile)) {
      score += 15;
    }
    
    // Check for character-specific vocabulary
    if (this.usesCharacterVocabulary(playerAction, characterProfile)) {
      score += 15;
    }
    
    // Penalize modern language in historical characters
    if (this.usesModernLanguage(playerAction, characterProfile)) {
      score -= 20;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score action consistency with character
   */
  scoreActionConsistency(playerAction, characterProfile) {
    let score = 50;
    
    // Check if action aligns with character traits
    const traits = characterProfile.personality_traits || [];
    traits.forEach(trait => {
      if (this.actionAlignsWith(playerAction, trait)) {
        score += 10;
      } else if (this.actionContradictes(playerAction, trait)) {
        score -= 15;
      }
    });
    
    // Check historical character behavior patterns
    if (this.matchesHistoricalBehavior(playerAction, characterProfile)) {
      score += 20;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score moral alignment
   */
  scoreMoralAlignment(playerAction, characterProfile) {
    let score = 50;
    
    const moralCode = characterProfile.moral_alignment || 'neutral';
    
    // Evaluate based on character's moral compass
    if (this.actionAlignWithMoralCode(playerAction, moralCode)) {
      score += 25;
    } else if (this.actionContradictesMoralCode(playerAction, moralCode)) {
      score -= 25;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score emotional response appropriateness
   */
  scoreEmotionalResponse(playerAction, sceneContext, characterProfile) {
    let score = 50;
    
    // Check if emotional response matches character temperament
    const temperament = characterProfile.temperament || 'balanced';
    
    if (this.emotionMatchesTemperament(playerAction, temperament, sceneContext)) {
      score += 20;
    }
    
    // Check for character-specific emotional patterns
    if (this.showsCharacterEmotionalPatterns(playerAction, characterProfile)) {
      score += 15;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Build character profile for scoring reference
   */
  buildCharacterProfile(characterPack) {
    return {
      id: characterPack.id,
      name: characterPack.name,
      literary_source: characterPack.source || '',
      time_period: characterPack.time_period || 'unknown',
      personality_traits: this.extractPersonalityTraits(characterPack),
      speech_patterns: this.extractSpeechPatterns(characterPack),
      moral_alignment: characterPack.moral_alignment || 'neutral',
      temperament: characterPack.temperament || 'balanced',
      social_class: characterPack.social_class || 'middle',
      primary_motivations: characterPack.motivations || [],
      behavioral_patterns: this.extractBehavioralPatterns(characterPack),
      historical_context: this.extractHistoricalContext(characterPack),
      relationship_styles: this.extractRelationshipStyles(characterPack)
    };
  }

  /**
   * Extract personality traits from character pack
   */
  extractPersonalityTraits(characterPack) {
    const traits = [];
    
    if (characterPack.id.includes('sherlock')) {
      traits.push('analytical', 'observant', 'logical', 'eccentric', 'confident');
    } else if (characterPack.id.includes('watson')) {
      traits.push('loyal', 'practical', 'brave', 'patient', 'compassionate');
    } else if (characterPack.id.includes('elizabeth')) {
      traits.push('witty', 'independent', 'intelligent', 'spirited', 'proud');
    } else if (characterPack.id.includes('dracula')) {
      traits.push('commanding', 'seductive', 'ruthless', 'ancient', 'aristocratic');
    } else if (characterPack.id.includes('alice')) {
      traits.push('curious', 'brave', 'logical', 'polite', 'determined');
    }
    
    return traits;
  }

  /**
   * Extract speech patterns from character pack
   */
  extractSpeechPatterns(characterPack) {
    const patterns = [];
    
    if (characterPack.id.includes('sherlock')) {
      patterns.push('deductive_reasoning', 'scientific_terminology', 'precise_language');
    } else if (characterPack.id.includes('elizabeth')) {
      patterns.push('wit', 'social_commentary', 'regency_formality');
    } else if (characterPack.id.includes('dracula')) {
      patterns.push('archaic_formality', 'commanding_tone', 'sophisticated_vocabulary');
    }
    
    return patterns;
  }

  /**
   * Should we reveal the score at this decision count?
   */
  shouldRevealScore() {
    const session = this.currentSession;
    if (!session) return false;
    
    // Reveal every 10 decisions
    return session.decisionCount % 10 === 0 && session.decisionCount > 0;
  }

  /**
   * Generate comprehensive score reveal
   */
  generateScoreReveal() {
    const session = this.currentSession;
    if (!session) return null;

    const reveal = {
      decisionRange: {
        from: Math.max(1, session.decisionCount - 9),
        to: session.decisionCount
      },
      overallScore: session.totalScore,
      scoreLevel: this.getScoreLevel(session.totalScore),
      categoryBreakdown: { ...session.categoryScores },
      improvements: this.generateImprovementSuggestions(),
      strengths: this.identifyStrengths(),
      characterInsights: this.generateCharacterInsights(),
      comparisonToPrevious: this.compareToPreviousReveal(),
      encouragement: this.generateEncouragement()
    };

    // Add to reveal history
    if (!this.revealHistory.has(session.storyId)) {
      this.revealHistory.set(session.storyId, []);
    }
    this.revealHistory.get(session.storyId).push(reveal);

    return reveal;
  }

  /**
   * Get score level description
   */
  getScoreLevel(score) {
    const levels = Object.values(SCORING_LEVELS).sort((a, b) => b.score - a.score);
    
    for (const level of levels) {
      if (score >= level.score) {
        return level;
      }
    }
    
    return SCORING_LEVELS.POOR;
  }

  /**
   * Generate improvement suggestions
   */
  generateImprovementSuggestions() {
    const session = this.currentSession;
    const suggestions = [];
    
    // Identify lowest scoring categories
    const sortedCategories = Object.entries(session.categoryScores)
      .sort(([,a], [,b]) => a - b);
    
    const lowestCategories = sortedCategories.slice(0, 2);
    
    lowestCategories.forEach(([category, score]) => {
      if (score < 60) {
        suggestions.push(this.getSuggestionForCategory(category));
      }
    });
    
    return suggestions;
  }

  /**
   * Get specific suggestion for category
   */
  getSuggestionForCategory(category) {
    const characterName = this.currentSession.characterName;
    
    switch (category) {
      case PERSONA_CATEGORIES.DIALOGUE_AUTHENTICITY:
        return `Try to speak more like ${characterName}. Study their speech patterns and vocabulary from the original text.`;
      
      case PERSONA_CATEGORIES.ACTION_CONSISTENCY:
        return `Consider what ${characterName} would do based on their personality. Think about their core traits and motivations.`;
      
      case PERSONA_CATEGORIES.MORAL_ALIGNMENT:
        return `Remember ${characterName}'s moral compass. Consider their values when making decisions.`;
      
      default:
        return `Focus on understanding ${characterName}'s character more deeply.`;
    }
  }

  /**
   * Initialize category scores
   */
  initializeCategoryScores() {
    const scores = {};
    Object.keys(PERSONA_CATEGORIES).forEach(category => {
      scores[category] = 50; // Start at neutral
    });
    return scores;
  }

  /**
   * Update running category score
   */
  updateCategoryScore(category, newScore) {
    const session = this.currentSession;
    const currentScore = session.categoryScores[category];
    const decisionCount = session.decisionCount;
    
    // Calculate running average
    session.categoryScores[category] = 
      ((currentScore * (decisionCount - 1)) + newScore) / decisionCount;
  }

  /**
   * Calculate overall running average
   */
  calculateRunningAverage() {
    const session = this.currentSession;
    const scores = Object.values(session.categoryScores);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /**
   * Calculate overall score for a single decision
   */
  calculateOverallScore(categoryScores) {
    const scores = Object.values(categoryScores);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /**
   * Generate decision feedback
   */
  generateDecisionFeedback(decisionRecord) {
    const feedback = {
      overall: this.getOverallFeedback(decisionRecord.overallScore),
      categories: {}
    };
    
    // Generate category-specific feedback
    Object.entries(decisionRecord.scores).forEach(([category, score]) => {
      feedback.categories[category] = this.getCategoryFeedback(category, score);
    });
    
    return feedback;
  }

  /**
   * Get current persona summary
   */
  getPersonaSummary() {
    const session = this.currentSession;
    if (!session) return null;

    return {
      characterName: session.characterName,
      decisionCount: session.decisionCount,
      currentScore: session.totalScore,
      scoreLevel: this.getScoreLevel(session.totalScore),
      nextRevealAt: Math.ceil(session.decisionCount / 10) * 10,
      decisionsUntilReveal: (Math.ceil(session.decisionCount / 10) * 10) - session.decisionCount,
      categoryScores: { ...session.categoryScores },
      trends: this.calculateTrends()
    };
  }

  /**
   * Save scoring session to storage
   */
  async saveScoringSession() {
    try {
      const session = this.currentSession;
      if (!session) return;

      await AsyncStorage.setItem(
        `persona_scoring_${session.storyId}`, 
        JSON.stringify(session)
      );
      console.log(`Persona scoring saved for: ${session.storyId}`);
    } catch (error) {
      console.error('Failed to save persona scoring:', error);
    }
  }

  /**
   * Load scoring session from storage
   */
  async loadScoringSession(storyId) {
    try {
      const saved = await AsyncStorage.getItem(`persona_scoring_${storyId}`);
      if (saved) {
        const session = JSON.parse(saved);
        this.currentSession = session;
        this.scoringCache.set(storyId, session);
        console.log(`Persona scoring loaded for: ${storyId}`);
        return true;
      }
    } catch (error) {
      console.error('Failed to load persona scoring:', error);
    }
    return false;
  }

  // Helper methods for scoring evaluation
  containsCharacterSpeechPatterns(action, profile) {
    // Implementation would check for character-specific speech patterns
    return false;
  }

  usesPeriodAppropriateLang(action, profile) {
    // Implementation would check for period-appropriate language
    return false;
  }

  usesCharacterVocabulary(action, profile) {
    // Implementation would check for character-specific vocabulary
    return false;
  }

  usesModernLanguage(action, profile) {
    // Implementation would detect modern language in historical characters
    return false;
  }

  actionAlignsWith(action, trait) {
    // Implementation would check if action aligns with personality trait
    return false;
  }

  actionContradictes(action, trait) {
    // Implementation would check if action contradicts personality trait
    return false;
  }

  matchesHistoricalBehavior(action, profile) {
    // Implementation would check historical character behavior patterns
    return false;
  }

  actionAlignWithMoralCode(action, moralCode) {
    // Implementation would check moral alignment
    return false;
  }

  actionContradictesMoralCode(action, moralCode) {
    // Implementation would check moral contradictions
    return false;
  }

  emotionMatchesTemperament(action, temperament, context) {
    // Implementation would check emotional appropriateness
    return false;
  }

  showsCharacterEmotionalPatterns(action, profile) {
    // Implementation would check character-specific emotional patterns
    return false;
  }

  extractBehavioralPatterns(characterPack) {
    // Implementation would extract behavioral patterns
    return [];
  }

  extractHistoricalContext(characterPack) {
    // Implementation would extract historical context
    return {};
  }

  extractRelationshipStyles(characterPack) {
    // Implementation would extract relationship styles
    return {};
  }

  generateRevealSchedule() {
    // Implementation would generate reveal schedule
    return [];
  }

  identifyStrengths() {
    // Implementation would identify player strengths
    return [];
  }

  generateCharacterInsights() {
    // Implementation would generate character insights
    return {};
  }

  compareToPreviousReveal() {
    // Implementation would compare to previous reveal
    return {};
  }

  generateEncouragement() {
    // Implementation would generate encouraging message
    return '';
  }

  getOverallFeedback(score) {
    // Implementation would generate overall feedback
    return '';
  }

  getCategoryFeedback(category, score) {
    // Implementation would generate category feedback
    return '';
  }

  calculateTrends() {
    // Implementation would calculate scoring trends
    return {};
  }
}

// Export singleton instance
export const personaScoring = new PersonaScoringSystem();

export default personaScoring; 