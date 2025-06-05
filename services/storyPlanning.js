/**
 * InCharacter AI Story Planning System
 * Plans story events ahead to ensure satisfying narrative arcs and conclusions
 */

import { storyMemory, MEMORY_TYPES, IMPORTANCE_LEVELS } from './storyMemory';

// Story arc phases
export const STORY_PHASES = {
  SETUP: 'setup',           // Introduction, world-building, character establishment
  RISING_ACTION: 'rising_action',  // Complications, conflicts, character development
  CLIMAX: 'climax',         // Peak tension, major confrontation
  FALLING_ACTION: 'falling_action', // Consequences, resolution beginning
  RESOLUTION: 'resolution'   // Conclusion, character fates, loose ends tied
};

// Planning confidence levels
export const PLANNING_CONFIDENCE = {
  HIGH: 'high',       // Clear path forward, strong story structure
  MEDIUM: 'medium',   // Some uncertainty, multiple viable paths
  LOW: 'low',         // Unclear direction, needs player input
  CRITICAL: 'critical' // Story at risk, intervention needed
};

class StoryPlanningSystem {
  constructor() {
    this.currentPlan = null;
    this.planningCache = new Map();
    this.narrativeTargets = new Map();
    this.conflictTracking = new Map();
  }

  /**
   * Initialize story planning for a character
   */
  async initializePlanning(characterPack, storyId) {
    const plan = {
      storyId: storyId,
      characterId: characterPack.id,
      characterName: characterPack.name,
      currentPhase: STORY_PHASES.SETUP,
      sceneCount: 0,
      targetLength: this.calculateTargetLength(characterPack),
      plannedEvents: [],
      activeConflicts: [],
      narrativeThemes: this.extractThemes(characterPack),
      endingOptions: [],
      planningConfidence: PLANNING_CONFIDENCE.HIGH,
      lastPlanned: new Date().toISOString()
    };

    // Generate initial story blueprint
    plan.blueprint = await this.generateStoryBlueprint(characterPack);
    
    this.currentPlan = plan;
    this.planningCache.set(storyId, plan);
    
    return plan;
  }

  /**
   * Generate a high-level story blueprint based on character
   */
  async generateStoryBlueprint(characterPack) {
    const blueprint = {
      themes: this.extractThemes(characterPack),
      expectedConflicts: this.identifyPotentialConflicts(characterPack),
      characterArcs: this.planCharacterDevelopment(characterPack),
      narrativeGoals: this.setNarrativeGoals(characterPack),
      estimatedScenes: {
        setup: 3,
        rising_action: 5,
        climax: 2,
        falling_action: 2,
        resolution: 1
      }
    };

    return blueprint;
  }

  /**
   * Plan next 3-5 scenes based on current story state
   */
  async planAheadScenes(currentScene, playerAction, storyContext) {
    const plan = this.currentPlan;
    if (!plan) return null;

    // Analyze current story state
    const storyAnalysis = this.analyzeCurrentState(storyContext);
    
    // Determine story phase
    const newPhase = this.determineStoryPhase(storyAnalysis);
    if (newPhase !== plan.currentPhase) {
      plan.currentPhase = newPhase;
      console.log(`Story phase transition: ${newPhase}`);
    }

    // Generate scene sketches
    const plannedScenes = await this.generateSceneSketches(
      currentScene, 
      playerAction, 
      storyAnalysis, 
      5 // Plan 5 scenes ahead
    );

    // Update planning cache
    plan.plannedEvents = plannedScenes;
    plan.sceneCount++;
    plan.lastPlanned = new Date().toISOString();
    plan.planningConfidence = this.assessPlanningConfidence(storyAnalysis);

    // Check if we need ending options
    if (this.shouldPrepareEndings(storyAnalysis)) {
      plan.endingOptions = await this.generateEndingOptions(storyAnalysis);
    }

    this.planningCache.set(plan.storyId, plan);
    
    return {
      nextScenes: plannedScenes,
      currentPhase: plan.currentPhase,
      planningConfidence: plan.planningConfidence,
      endingOptions: plan.endingOptions,
      recommendedActions: this.generateRecommendations(storyAnalysis)
    };
  }

  /**
   * Generate scene sketches for upcoming story beats
   */
  async generateSceneSketches(currentScene, playerAction, storyAnalysis, count = 5) {
    const scenes = [];
    
    for (let i = 1; i <= count; i++) {
      const sceneSketch = {
        sequenceNumber: i,
        title: `Planned Scene ${i}`,
        phase: this.predictPhaseForScene(i, storyAnalysis),
        purpose: this.determinePurpose(i, storyAnalysis),
        suggestedElements: [],
        conflictLevel: this.calculateConflictLevel(i, storyAnalysis),
        characterFocus: this.selectCharacterFocus(i, storyAnalysis),
        plotThreads: this.identifyRelevantPlotThreads(i, storyAnalysis),
        estimatedTension: this.estimateTension(i, storyAnalysis),
        keyEvents: [],
        flexibility: 'medium' // How much the scene can change based on player actions
      };

      // Add specific scene elements based on story phase and needs
      this.populateSceneElements(sceneSketch, storyAnalysis);
      
      scenes.push(sceneSketch);
    }

    return scenes;
  }

  /**
   * Analyze current story state for planning decisions
   */
  analyzeCurrentState(storyContext) {
    const analysis = {
      sceneCount: this.currentPlan?.sceneCount || 0,
      memoryCount: storyContext.total_memories || 0,
      activeConflicts: this.identifyActiveConflicts(storyContext),
      characterRelationships: this.analyzeRelationships(storyContext.relationships),
      emotionalState: storyContext.emotional_state,
      plotThreads: this.analyzePlotThreads(storyContext.plot_threads),
      storyMomentum: this.calculateStoryMomentum(storyContext),
      tensionLevel: this.calculateTensionLevel(storyContext),
      resolutionNeeds: this.identifyResolutionNeeds(storyContext)
    };

    return analysis;
  }

  /**
   * Determine which story phase we're currently in
   */
  determineStoryPhase(analysis) {
    const { sceneCount, activeConflicts, tensionLevel, resolutionNeeds } = analysis;

    // Phase determination logic
    if (sceneCount <= 3) {
      return STORY_PHASES.SETUP;
    } else if (sceneCount <= 8 && activeConflicts.length > 0) {
      return STORY_PHASES.RISING_ACTION;
    } else if (tensionLevel >= 80 || (activeConflicts.length > 2 && sceneCount >= 6)) {
      return STORY_PHASES.CLIMAX;
    } else if (resolutionNeeds.length > 0 && tensionLevel < 80) {
      return STORY_PHASES.FALLING_ACTION;
    } else if (sceneCount >= 10 || resolutionNeeds.length === 0) {
      return STORY_PHASES.RESOLUTION;
    }

    return STORY_PHASES.RISING_ACTION; // Default
  }

  /**
   * Generate multiple ending options based on story state
   */
  async generateEndingOptions(storyAnalysis) {
    const endings = [];

    // Happy ending
    endings.push({
      type: 'triumphant',
      title: 'Triumphant Resolution',
      description: 'Character overcomes challenges and achieves their goals',
      requirements: ['resolve_main_conflict', 'positive_relationships'],
      likelihood: this.calculateEndingLikelihood('triumphant', storyAnalysis),
      thematicFit: this.assessThematicFit('triumphant', storyAnalysis)
    });

    // Tragic ending
    endings.push({
      type: 'tragic',
      title: 'Tragic Downfall',
      description: 'Character faces consequences of their choices',
      requirements: ['unresolved_conflicts', 'character_flaws_exposed'],
      likelihood: this.calculateEndingLikelihood('tragic', storyAnalysis),
      thematicFit: this.assessThematicFit('tragic', storyAnalysis)
    });

    // Bittersweet ending
    endings.push({
      type: 'bittersweet',
      title: 'Bittersweet Conclusion',
      description: 'Victory comes at a cost, mixed outcomes',
      requirements: ['partial_resolution', 'character_growth'],
      likelihood: this.calculateEndingLikelihood('bittersweet', storyAnalysis),
      thematicFit: this.assessThematicFit('bittersweet', storyAnalysis)
    });

    // Sort by likelihood and thematic fit
    return endings.sort((a, b) => (b.likelihood + b.thematicFit) - (a.likelihood + a.thematicFit));
  }

  /**
   * Extract themes from character pack
   */
  extractThemes(characterPack) {
    const themes = [];
    
    // Common literary themes based on character type
    if (characterPack.id.includes('sherlock') || characterPack.id.includes('watson')) {
      themes.push('justice', 'truth', 'deduction', 'friendship');
    } else if (characterPack.id.includes('dracula')) {
      themes.push('good_vs_evil', 'temptation', 'mortality', 'power');
    } else if (characterPack.id.includes('elizabeth') || characterPack.id.includes('darcy')) {
      themes.push('love', 'pride', 'prejudice', 'social_class', 'personal_growth');
    } else if (characterPack.id.includes('alice')) {
      themes.push('coming_of_age', 'reality_vs_fantasy', 'curiosity', 'identity');
    } else if (characterPack.id.includes('gatsby')) {
      themes.push('american_dream', 'wealth', 'illusion', 'past_vs_present');
    } else if (characterPack.id.includes('hamlet')) {
      themes.push('revenge', 'madness', 'mortality', 'duty', 'indecision');
    }

    // Default themes for unknown characters
    if (themes.length === 0) {
      themes.push('personal_growth', 'conflict', 'resolution', 'relationships');
    }

    return themes;
  }

  /**
   * Identify potential conflicts for the character
   */
  identifyPotentialConflicts(characterPack) {
    const conflicts = [];
    
    // Character-specific conflicts
    if (characterPack.id.includes('sherlock')) {
      conflicts.push('criminal_mystery', 'intellectual_challenge', 'moral_dilemma');
    } else if (characterPack.id.includes('dracula')) {
      conflicts.push('supernatural_threat', 'moral_corruption', 'survival');
    } else if (characterPack.id.includes('elizabeth')) {
      conflicts.push('romantic_misunderstanding', 'social_pressure', 'family_expectations');
    }

    return conflicts;
  }

  /**
   * Calculate target story length based on character and complexity
   */
  calculateTargetLength(characterPack) {
    // Base length varies by character complexity
    let baseScenes = 12;
    
    if (characterPack.difficulty === 'hard') {
      baseScenes = 15;
    } else if (characterPack.difficulty === 'easy') {
      baseScenes = 10;
    }

    return {
      min: baseScenes - 3,
      target: baseScenes,
      max: baseScenes + 5
    };
  }

  /**
   * Assess planning confidence based on story state
   */
  assessPlanningConfidence(analysis) {
    let confidence = PLANNING_CONFIDENCE.HIGH;
    
    // Reduce confidence if too many unresolved conflicts
    if (analysis.activeConflicts.length > 3) {
      confidence = PLANNING_CONFIDENCE.MEDIUM;
    }
    
    // Reduce confidence if story is dragging
    if (analysis.sceneCount > 15 && analysis.tensionLevel < 30) {
      confidence = PLANNING_CONFIDENCE.LOW;
    }
    
    // Critical if story is broken
    if (analysis.activeConflicts.length === 0 && analysis.sceneCount > 5) {
      confidence = PLANNING_CONFIDENCE.CRITICAL;
    }

    return confidence;
  }

  /**
   * Check if we should prepare ending options
   */
  shouldPrepareEndings(analysis) {
    return analysis.sceneCount >= 8 || 
           analysis.tensionLevel >= 70 || 
           analysis.resolutionNeeds.length > 2;
  }

  /**
   * Generate recommendations for player/AI based on story state
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    if (analysis.activeConflicts.length === 0) {
      recommendations.push({
        type: 'introduce_conflict',
        priority: 'high',
        description: 'Story needs more tension - introduce a complication'
      });
    }

    if (analysis.sceneCount > 10 && analysis.resolutionNeeds.length > 0) {
      recommendations.push({
        type: 'begin_resolution',
        priority: 'high',
        description: 'Time to start resolving plot threads'
      });
    }

    if (analysis.tensionLevel < 20 && analysis.sceneCount > 5) {
      recommendations.push({
        type: 'increase_stakes',
        priority: 'medium',
        description: 'Consider raising the stakes or urgency'
      });
    }

    return recommendations;
  }

  /**
   * Get current story plan
   */
  getCurrentPlan() {
    return this.currentPlan;
  }

  /**
   * Get story progress summary
   */
  getStoryProgress() {
    if (!this.currentPlan) return null;

    const plan = this.currentPlan;
    const progressPercent = Math.min(100, (plan.sceneCount / plan.targetLength.target) * 100);

    return {
      currentPhase: plan.currentPhase,
      sceneCount: plan.sceneCount,
      targetLength: plan.targetLength,
      progressPercent: Math.round(progressPercent),
      planningConfidence: plan.planningConfidence,
      activeThemes: plan.narrativeThemes,
      nextMilestone: this.getNextMilestone(plan)
    };
  }

  /**
   * Helper methods for analysis
   */
  identifyActiveConflicts(storyContext) {
    // Analyze story context to find ongoing conflicts
    const conflicts = [];
    
    if (storyContext.plot_threads) {
      Object.values(storyContext.plot_threads).forEach(thread => {
        if (thread.status === 'active' && thread.importance >= IMPORTANCE_LEVELS.MEDIUM) {
          conflicts.push({
            type: 'plot_thread',
            id: thread.id,
            title: thread.title,
            urgency: this.calculateUrgency(thread)
          });
        }
      });
    }

    return conflicts;
  }

  analyzeRelationships(relationships) {
    if (!relationships || !relationships.others) return {};
    
    const analysis = {
      total_relationships: Object.keys(relationships.others).length,
      positive_relationships: 0,
      negative_relationships: 0,
      neutral_relationships: 0,
      romantic_interests: 0
    };

    Object.values(relationships.others).forEach(rel => {
      const strength = (rel.affection + rel.trust + rel.respect - rel.fear) / 3;
      
      if (strength > 60) analysis.positive_relationships++;
      else if (strength < 40) analysis.negative_relationships++;
      else analysis.neutral_relationships++;
      
      if (rel.romantic_interest > 50) analysis.romantic_interests++;
    });

    return analysis;
  }

  analyzePlotThreads(plotThreads) {
    if (!plotThreads) return { active: 0, resolved: 0, total: 0 };
    
    const threads = Object.values(plotThreads);
    return {
      active: threads.filter(t => t.status === 'active').length,
      resolved: threads.filter(t => t.status === 'resolved').length,
      total: threads.length
    };
  }

  calculateStoryMomentum(storyContext) {
    // Calculate based on recent event frequency and importance
    const recentEvents = storyContext.key_events?.slice(-3) || [];
    const avgImportance = recentEvents.reduce((sum, event) => sum + event.importance, 0) / Math.max(1, recentEvents.length);
    return Math.min(100, avgImportance * 25);
  }

  calculateTensionLevel(storyContext) {
    // Calculate based on conflicts, emotional state, and recent events
    let tension = 0;
    
    if (storyContext.emotional_state?.stress_level) {
      tension += storyContext.emotional_state.stress_level * 0.4;
    }
    
    const activeConflicts = this.identifyActiveConflicts(storyContext);
    tension += activeConflicts.length * 15;
    
    return Math.min(100, tension);
  }

  identifyResolutionNeeds(storyContext) {
    const needs = [];
    
    // Check for plot threads that need resolution
    if (storyContext.plot_threads) {
      Object.values(storyContext.plot_threads).forEach(thread => {
        if (thread.status === 'active' && thread.events.length > 2) {
          needs.push(`resolve_${thread.id}`);
        }
      });
    }
    
    return needs;
  }

  getNextMilestone(plan) {
    const phaseOrder = Object.values(STORY_PHASES);
    const currentIndex = phaseOrder.indexOf(plan.currentPhase);
    
    if (currentIndex < phaseOrder.length - 1) {
      return {
        phase: phaseOrder[currentIndex + 1],
        estimatedScenes: this.getScenesUntilNextPhase(plan)
      };
    }
    
    return { phase: 'completion', estimatedScenes: plan.targetLength.target - plan.sceneCount };
  }

  getScenesUntilNextPhase(plan) {
    // Estimate based on current progress and target length
    const totalScenes = plan.targetLength.target;
    const currentScene = plan.sceneCount;
    const remaining = totalScenes - currentScene;
    
    switch (plan.currentPhase) {
      case STORY_PHASES.SETUP: return Math.min(3, remaining);
      case STORY_PHASES.RISING_ACTION: return Math.min(5, remaining);
      case STORY_PHASES.CLIMAX: return Math.min(2, remaining);
      case STORY_PHASES.FALLING_ACTION: return Math.min(2, remaining);
      default: return remaining;
    }
  }

  // Additional helper methods would be implemented here...
  populateSceneElements(sceneSketch, storyAnalysis) {
    // Implementation would add specific elements based on phase and needs
  }

  predictPhaseForScene(sceneNumber, analysis) {
    // Implementation would predict what phase a future scene should be in
    return this.currentPlan?.currentPhase || STORY_PHASES.SETUP;
  }

  determinePurpose(sceneNumber, analysis) {
    // Implementation would determine the narrative purpose of each planned scene
    return 'advance_plot';
  }

  calculateConflictLevel(sceneNumber, analysis) {
    // Implementation would calculate appropriate conflict level for scene
    return 'medium';
  }

  selectCharacterFocus(sceneNumber, analysis) {
    // Implementation would choose which character should be the focus
    return 'protagonist';
  }

  identifyRelevantPlotThreads(sceneNumber, analysis) {
    // Implementation would identify which plot threads are relevant for the scene
    return [];
  }

  estimateTension(sceneNumber, analysis) {
    // Implementation would estimate tension level for the scene
    return 50;
  }

  calculateEndingLikelihood(endingType, analysis) {
    // Implementation would calculate how likely each ending type is
    return 50;
  }

  assessThematicFit(endingType, analysis) {
    // Implementation would assess how well ending fits story themes
    return 50;
  }

  calculateUrgency(thread) {
    // Implementation would calculate urgency of plot thread resolution
    return 'medium';
  }

  planCharacterDevelopment(characterPack) {
    // Implementation would plan character growth arc
    return {};
  }

  setNarrativeGoals(characterPack) {
    // Implementation would set story goals based on character
    return [];
  }
}

// Export singleton instance
export const storyPlanning = new StoryPlanningSystem();

export default storyPlanning; 