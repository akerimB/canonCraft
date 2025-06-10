/**
 * InCharacter Phase 8: Multi-Species Context Builder
 * Advanced AI Context Integration for Animal Companions & Economic Systems
 * Combines human, animal, and economic contexts for comprehensive storytelling
 */

import AnimalBehaviorService from './animalBehaviorService.js';
import EconomicNarrativeService from './economicNarrativeService.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

class MultiSpeciesContextBuilder {
  constructor() {
    this.animalBehaviorService = new AnimalBehaviorService();
    this.economicNarrativeService = new EconomicNarrativeService();
    this.contextCache = new Map(); // sessionId -> cached context
    this.lastUpdateTime = new Map(); // sessionId -> timestamp
  }

  /**
   * Build comprehensive multi-species context for AI including all systems
   */
  async buildMultiSpeciesContext(sessionId, sceneNumber, forceRefresh = false) {
    const cacheKey = `${sessionId}_${sceneNumber}`;
    const lastUpdate = this.lastUpdateTime.get(sessionId) || 0;
    const now = Date.now();

    // Use cache if recent and not forced refresh
    if (!forceRefresh && (now - lastUpdate) < 30000 && this.contextCache.has(cacheKey)) {
      return this.contextCache.get(cacheKey);
    }

    // Build comprehensive context
    let context = await this.buildBaseHumanContext(sessionId, sceneNumber);
    
    // Add animal companions context
    const animalContext = await this.buildAnimalCompanionContext(sessionId, sceneNumber);
    if (animalContext) {
      context += animalContext;
    }

    // Add economic context
    const economicContext = await this.buildEconomicContext(sessionId, sceneNumber);
    if (economicContext) {
      context += economicContext;
    }

    // Add multi-species interaction dynamics
    const interactionContext = await this.buildInteractionDynamicsContext(sessionId, sceneNumber);
    if (interactionContext) {
      context += interactionContext;
    }

    // Add mandatory instructions
    context += this.buildMandatoryInstructions();

    // Cache the result
    this.contextCache.set(cacheKey, context);
    this.lastUpdateTime.set(sessionId, now);

    return context;
  }

  /**
   * Build base human character context
   */
  async buildBaseHumanContext(sessionId, sceneNumber) {
    // This would integrate with existing database/memory systems
    let context = `\n🎭 STORY CONTEXT (Scene ${sceneNumber}):\n`;
    
    // Add human characters
    const characters = await this.getSessionCharacters(sessionId);
    if (characters.length > 0) {
      context += "\n👥 HUMAN CHARACTERS:\n";
      characters.forEach(char => {
        const stateIcon = char.current_state === 'dead' ? '💀' : 
                         char.current_state === 'injured' ? '🤕' : '👤';
        context += `${stateIcon} ${char.name}: ${char.current_state.toUpperCase()}`;
        if (char.current_state === 'dead') {
          context += ' - CANNOT INTERACT OR SPEAK';
        }
        if (char.emotional_state && char.emotional_state !== 'neutral') {
          context += ` (${char.emotional_state})`;
        }
        context += `\n`;
      });
    }

    // Add human relationships
    const relationships = await this.getHumanRelationships(sessionId);
    if (relationships.length > 0) {
      context += "\n💕 HUMAN RELATIONSHIPS:\n";
      relationships.slice(0, 5).forEach(rel => {
        if (rel.character_a_state !== 'dead' && rel.character_b_state !== 'dead') {
          const strength = (rel.affection + rel.trust + rel.respect - rel.fear) / 3;
          const relationshipType = strength > 60 ? 'Close' : strength < 40 ? 'Tense' : 'Neutral';
          context += `- ${rel.character_a_name} ↔ ${rel.character_b_name}: ${relationshipType} (${rel.interaction_count} interactions)\n`;
        }
      });
    }

    return context;
  }

  /**
   * Build animal companion context
   */
  async buildAnimalCompanionContext(sessionId, sceneNumber) {
    const animals = await this.getAnimalCompanions(sessionId);
    if (animals.length === 0) return '';

    let context = "\n🐾 ANIMAL COMPANIONS:\n";
    
    for (const animal of animals) {
      const stateIcon = animal.current_state === 'dead' ? '💀' : 
                       animal.current_state === 'injured' ? '🤕' : '🐾';
      
      context += `${stateIcon} ${animal.name} (${animal.species}): ${animal.current_state.toUpperCase()}`;
      
      if (animal.current_state === 'dead') {
        context += ' - CANNOT INTERACT';
      } else {
        // Add behavior prediction
        try {
          const prediction = await this.animalBehaviorService.predictAnimalBehavior(
            animal.id, 
            { threat_level: 0, novelty: 30, social_opportunity: 50 }, 
            { stress_level: 20, social_energy: 60 }
          );
          
          const dominantEmotion = Object.entries(prediction.emotional_state)
            .sort((a, b) => b[1] - a[1])[0];
          
          context += ` - ${prediction.primary_response.primary} (${dominantEmotion[0]} ${dominantEmotion[1].toFixed(0)}%)`;
        } catch (error) {
          context += ` - behavioral data loading`;
        }
      }
      context += `\n`;
    }

    // Add human-animal relationships
    const humanAnimalBonds = await this.getHumanAnimalRelationships(sessionId);
    if (humanAnimalBonds.length > 0) {
      context += "\n🤝 HUMAN-ANIMAL BONDS:\n";
      humanAnimalBonds.forEach(bond => {
        if (bond.animal_state !== 'dead') {
          const bondStrength = (bond.affection + bond.trust + bond.loyalty) / 3;
          const bondType = bondStrength > 70 ? 'Strong' : bondStrength > 40 ? 'Moderate' : 'Weak';
          context += `- ${bond.character_name} ↔ ${bond.animal_name}: ${bondType} ${bond.bond_type}`;
          if (bond.training_level > 50) {
            context += ` (well-trained)`;
          }
          context += `\n`;
        }
      });
    }

    // Add animal-animal relationships
    const animalRelationships = await this.getAnimalRelationships(sessionId);
    if (animalRelationships.length > 0) {
      context += "\n🐕‍🦺 ANIMAL-ANIMAL DYNAMICS:\n";
      animalRelationships.forEach(rel => {
        if (rel.animal_a_state !== 'dead' && rel.animal_b_state !== 'dead') {
          const dominanceText = rel.dominance_a_over_b > 60 ? `${rel.animal_a_name} dominates` :
                               rel.dominance_a_over_b < 40 ? `${rel.animal_b_name} dominates` : 'equal';
          context += `- ${rel.animal_a_name} ↔ ${rel.animal_b_name}: ${rel.relationship_type} (${dominanceText})\n`;
        }
      });
    }

    return context;
  }

  /**
   * Build economic context for all characters
   */
  async buildEconomicContext(sessionId, sceneNumber) {
    const economics = await this.getAllCharacterEconomics(sessionId);
    if (economics.length === 0) return '';

    let context = "\n💰 ECONOMIC STATUS:\n";
    
    economics.forEach(econ => {
      context += `- ${econ.character_name}: ${econ.economic_status.toUpperCase()} (${econ.currency_amount} ${econ.currency_type})`;
      if (econ.debt_amount > 0) {
        context += ` [DEBT: ${econ.debt_amount}]`;
      }
      context += `\n`;
    });

    // Add significant possessions across all characters
    const inventories = await this.getSignificantInventories(sessionId);
    if (inventories.length > 0) {
      context += "\n📦 SIGNIFICANT POSSESSIONS:\n";
      inventories.forEach(item => {
        if (item.sentimental_value > 50 || item.current_value > 20) {
          context += `- ${item.character_name} owns: ${item.name}`;
          if (item.sentimental_value > 50) context += ' [SENTIMENTAL]';
          if (item.item_data && item.item_data.social_significance) {
            context += ` [${item.item_data.social_significance.toUpperCase()}]`;
          }
          context += `\n`;
        }
      });
    }

    // Add recent economic events
    const recentTransactions = await this.getRecentTransactions(sessionId, 3);
    if (recentTransactions.length > 0) {
      context += "\n💸 RECENT TRANSACTIONS:\n";
      recentTransactions.forEach(trans => {
        context += `- ${trans.character_name}: ${trans.type} ${trans.amount} ${trans.currency_type}`;
        if (trans.description) context += ` (${trans.description})`;
        context += `\n`;
      });
    }

    return context;
  }

  /**
   * Build interaction dynamics context
   */
  async buildInteractionDynamicsContext(sessionId, sceneNumber) {
    const participants = await this.getAllParticipants(sessionId);
    if (participants.length < 2) return '';

    let context = "\n🌐 INTERACTION DYNAMICS:\n";

    // Analyze group composition
    const humans = participants.filter(p => p.type === 'human' && p.current_state !== 'dead');
    const animals = participants.filter(p => p.type === 'animal' && p.current_state !== 'dead');
    
    context += `Active Participants: ${humans.length} humans, ${animals.length} animals\n`;

    // Multi-species complexity analysis
    if (humans.length > 0 && animals.length > 0) {
      try {
        const dynamics = await this.animalBehaviorService.generateMultiSpeciesInteraction(participants);
        
        if (dynamics.conflict_potential > 60) {
          context += `⚠️ HIGH CONFLICT POTENTIAL between species\n`;
        }
        if (dynamics.cooperation_level > 70) {
          context += `✅ HIGH COOPERATION LEVEL in group\n`;
        }
        if (dynamics.attention_competition > 50) {
          context += `👀 ATTENTION COMPETITION between animals for human attention\n`;
        }
      } catch (error) {
        context += `Group dynamics analysis in progress...\n`;
      }
    }

    // Economic power dynamics
    const wealthyCharacters = humans.filter(h => h.economic_status === 'wealthy' || h.economic_status === 'extremely_wealthy');
    const poorCharacters = humans.filter(h => h.economic_status === 'poor' || h.economic_status === 'struggling');
    
    if (wealthyCharacters.length > 0 && poorCharacters.length > 0) {
      context += `💎 ECONOMIC DIVIDE: Wealth disparity affects social dynamics\n`;
    }

    return context;
  }

  /**
   * Build mandatory AI instructions
   */
  buildMandatoryInstructions() {
    return `\n🚨 MANDATORY AI INSTRUCTIONS:
1. Dead characters (💀) CANNOT interact, speak, or influence events
2. Animal behavior must reflect their trait matrices and species characteristics
3. Economic status must influence character options, reactions, and social access
4. Human-animal bonds affect story development and character decisions
5. Possessions with sentimental value create emotional story opportunities
6. Multi-species interactions follow realistic behavioral patterns
7. Wealth disparities create authentic social tensions and opportunities
8. All relationship changes must be consistent with established dynamics

💡 CREATIVE REQUIREMENTS:
- Animals should demonstrate species-appropriate intelligence and behavior
- Economic consequences should feel authentic to the historical period
- Character possessions should influence available story paths
- Multi-species group dynamics should create interesting complications
- Inheritance and wealth transfer should carry emotional and social weight\n`;
  }

  /**
   * Generate context for specific character focus
   */
  async generateCharacterFocusContext(sessionId, characterId, sceneNumber) {
    const baseContext = await this.buildMultiSpeciesContext(sessionId, sceneNumber);
    
    // Add character-specific economic context
    const economicContext = this.economicNarrativeService.generateEconomicContextPrompt(characterId, {});
    
    // Add character's animal relationships
    const characterAnimals = await this.getCharacterAnimalCompanions(characterId);
    let animalContext = '';
    
    if (characterAnimals.length > 0) {
      animalContext = `\n🐾 ${await this.getCharacterName(characterId)}'S ANIMAL COMPANIONS:\n`;
      for (const animal of characterAnimals) {
        try {
          const behaviorContext = await this.animalBehaviorService.generateAnimalBehaviorContext(
            animal.id, 
            { threat_level: 0, novelty: 20, social_opportunity: 60 }
          );
          animalContext += `${animal.name} (${animal.species}):\n${behaviorContext}\n`;
        } catch (error) {
          animalContext += `${animal.name} (${animal.species}): Behavior data loading...\n`;
        }
      }
    }

    return baseContext + economicContext + animalContext;
  }

  /**
   * Update context after significant events
   */
  async updateContextAfterEvent(sessionId, eventData) {
    // Clear cache to force rebuild
    const keysToRemove = Array.from(this.contextCache.keys()).filter(key => key.startsWith(sessionId));
    keysToRemove.forEach(key => this.contextCache.delete(key));
    
    // Update animal relationships if animals were involved
    if (eventData.animals_involved) {
      for (const animalData of eventData.animals_involved) {
        await this.animalBehaviorService.updateAnimalRelationship(
          animalData.animal_id,
          animalData.interactor_id,
          animalData.interactor_type,
          animalData.interaction_type,
          animalData.outcome
        );
      }
    }

    // Update economic status if financial impact
    if (eventData.economic_impact) {
      await this.economicNarrativeService.processEconomicTransaction(
        eventData.economic_impact.character_id,
        eventData.economic_impact.transaction_type,
        eventData.economic_impact.amount,
        eventData.economic_impact.item_id,
        { scene: eventData.scene, description: eventData.economic_impact.description }
      );
    }
  }

  /**
   * Get comprehensive summary for UI display
   */
  async getMultiSpeciesSummary(sessionId) {
    const humans = await this.getSessionCharacters(sessionId);
    const animals = await this.getAnimalCompanions(sessionId);
    const economics = await this.getAllCharacterEconomics(sessionId);

    return {
      participants: {
        humans: humans.length,
        animals: animals.length,
        total_alive: humans.filter(h => h.current_state !== 'dead').length + 
                    animals.filter(a => a.current_state !== 'dead').length
      },
      relationships: {
        human_human: await this.getHumanRelationshipCount(sessionId),
        human_animal: await this.getHumanAnimalRelationshipCount(sessionId),
        animal_animal: await this.getAnimalRelationshipCount(sessionId)
      },
      economic_overview: {
        wealthy_characters: economics.filter(e => e.economic_status === 'wealthy' || e.economic_status === 'extremely_wealthy').length,
        struggling_characters: economics.filter(e => e.economic_status === 'poor' || e.economic_status === 'struggling').length,
        total_wealth: economics.reduce((sum, e) => sum + e.currency_amount, 0),
        significant_items: await this.getSignificantItemCount(sessionId)
      },
      context_cache_size: this.contextCache.size,
      last_updated: new Date().toISOString()
    };
  }

  // Placeholder methods - these would integrate with actual database
  async getSessionCharacters(sessionId) { return []; }
  async getHumanRelationships(sessionId) { return []; }
  async getAnimalCompanions(sessionId) { return []; }
  async getHumanAnimalRelationships(sessionId) { return []; }
  async getAnimalRelationships(sessionId) { return []; }
  async getAllCharacterEconomics(sessionId) { return []; }
  async getSignificantInventories(sessionId) { return []; }
  async getRecentTransactions(sessionId, limit) { return []; }
  async getAllParticipants(sessionId) { return []; }
  async getCharacterAnimalCompanions(characterId) { return []; }
  async getCharacterName(characterId) { return 'Character'; }
  async getHumanRelationshipCount(sessionId) { return 0; }
  async getHumanAnimalRelationshipCount(sessionId) { return 0; }
  async getAnimalRelationshipCount(sessionId) { return 0; }
  async getSignificantItemCount(sessionId) { return 0; }
}

export default MultiSpeciesContextBuilder; 