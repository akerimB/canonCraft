/**
 * InCharacter Phase 8: Economic Narrative Service
 * Revolutionary Wealth-Driven Storytelling System
 * Manages inventory, money, and economic consequences in narratives
 */

import { openai } from '../config.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Period-Appropriate Item Catalog
export const ITEM_CATALOG = {
  victorian: {
    clothing: {
      top_hat: {
        name: "Top Hat",
        value: {min: 15, max: 50, currency: 'shillings'},
        social_significance: 'upper_class_status',
        story_potential: ['formal_events', 'social_recognition', 'identity'],
        properties: {durability: 'high', conspicuous: true, gender: 'male'},
        description: "A black silk top hat, symbol of gentleman's status"
      },
      pocket_watch: {
        name: "Pocket Watch",
        value: {min: 2, max: 20, currency: 'pounds'},
        social_significance: 'professional_status',
        story_potential: ['punctuality', 'inheritance', 'gift', 'timing'],
        properties: {precision: 'varies', sentimental: true, functional: true},
        description: "A gold pocket watch with intricate engravings"
      },
      mourning_dress: {
        name: "Mourning Dress",
        value: {min: 5, max: 25, currency: 'pounds'},
        social_significance: 'grief_status',
        story_potential: ['loss', 'respect', 'tradition', 'social_expectations'],
        properties: {color: 'black', formal: true, gender: 'female'},
        description: "Black silk dress appropriate for periods of mourning"
      }
    },
    books: {
      first_edition_novel: {
        name: "First Edition Novel",
        value: {min: 5, max: 100, currency: 'pounds'},
        social_significance: 'intellectual_status',
        story_potential: ['knowledge', 'conversation', 'collection', 'education'],
        properties: {knowledge_type: 'literature', rarity: 'uncommon'},
        description: "A rare first edition of a popular novel"
      },
      medical_journal: {
        name: "Medical Journal",
        value: {min: 1, max: 10, currency: 'pounds'},
        social_significance: 'professional_knowledge',
        story_potential: ['expertise', 'research', 'healing', 'discovery'],
        properties: {knowledge_type: 'medicine', practical: true},
        description: "Current medical research and case studies"
      }
    },
    tools: {
      surgical_instruments: {
        name: "Surgical Instruments",
        value: {min: 10, max: 50, currency: 'pounds'},
        social_significance: 'professional_identity',
        story_potential: ['medical_situations', 'trust', 'expertise', 'life_death'],
        properties: {professional_use: 'medical', precision: 'high'},
        description: "Complete set of surgical tools in leather case"
      },
      magnifying_glass: {
        name: "Magnifying Glass",
        value: {min: 2, max: 8, currency: 'pounds'},
        social_significance: 'investigative_tool',
        story_potential: ['investigation', 'discovery', 'detail', 'truth'],
        properties: {functional: true, precision: 'high'},
        description: "High-quality magnifying glass for detailed examination"
      }
    }
  },
  regency: {
    clothing: {
      ball_gown: {
        name: "Ball Gown",
        value: {min: 20, max: 200, currency: 'pounds'},
        social_significance: 'female_social_status',
        story_potential: ['balls', 'courtship', 'fashion', 'society'],
        properties: {occasion: 'formal', gender: 'female', seasonal: true},
        description: "Elegant silk gown suitable for the finest social gatherings"
      },
      riding_habit: {
        name: "Riding Habit",
        value: {min: 15, max: 75, currency: 'pounds'},
        social_significance: 'active_lifestyle',
        story_potential: ['sport', 'freedom', 'countryside', 'independence'],
        properties: {practical: true, gender: 'female', outdoor: true},
        description: "Tailored riding costume for horseback activities"
      }
    },
    transportation: {
      carriage: {
        name: "Private Carriage",
        value: {min: 100, max: 1000, currency: 'pounds'},
        social_significance: 'extreme_wealth',
        story_potential: ['travel', 'status', 'courtship', 'mobility'],
        properties: {mobility: true, status_symbol: true, luxury: true},
        description: "Elegant private carriage with matched horses"
      }
    },
    jewelry: {
      pearl_necklace: {
        name: "Pearl Necklace",
        value: {min: 50, max: 500, currency: 'pounds'},
        social_significance: 'wealth_display',
        story_potential: ['inheritance', 'gift', 'theft', 'family_history'],
        properties: {luxury: true, heirloom: true, conspicuous: true},
        description: "Strand of lustrous pearls passed down through generations"
      }
    }
  },
  medieval: {
    weapons: {
      sword: {
        name: "Sword",
        value: {min: 5, max: 50, currency: 'gold_pieces'},
        social_significance: 'warrior_status',
        story_potential: ['combat', 'honor', 'inheritance', 'knighthood'],
        properties: {combat_effectiveness: 'high', symbol: 'honor'},
        description: "Well-forged blade with family crest on the pommel"
      },
      longbow: {
        name: "Longbow",
        value: {min: 2, max: 15, currency: 'gold_pieces'},
        social_significance: 'hunter_warrior',
        story_potential: ['hunting', 'warfare', 'skill', 'survival'],
        properties: {range: 'long', skill_required: 'high'},
        description: "Yew longbow capable of remarkable accuracy"
      }
    },
    animals: {
      war_horse: {
        name: "War Horse",
        value: {min: 50, max: 500, currency: 'gold_pieces'},
        social_significance: 'nobility',
        story_potential: ['warfare', 'travel', 'status', 'loyalty'],
        properties: {mobility: true, combat_trained: true, living: true},
        description: "Powerful destrier trained for mounted combat"
      }
    },
    land: {
      manor: {
        name: "Manor House",
        value: {min: 500, max: 5000, currency: 'gold_pieces'},
        social_significance: 'landed_nobility',
        story_potential: ['inheritance', 'responsibility', 'power', 'legacy'],
        properties: {immobile: true, income_generating: true, prestigious: true},
        description: "Grand manor house with extensive lands and tenants"
      }
    }
  }
};

// Economic Status Categories
export const ECONOMIC_STATUS = {
  destitute: {
    range: {min: 0, max: 5},
    description: "Struggling to survive",
    story_implications: ['desperation', 'crime_temptation', 'charity_dependence']
  },
  poor: {
    range: {min: 5, max: 25},
    description: "Basic needs barely met",
    story_implications: ['hard_choices', 'limited_options', 'vulnerability']
  },
  struggling: {
    range: {min: 25, max: 75},
    description: "Making ends meet with difficulty",
    story_implications: ['financial_stress', 'sacrifice_required', 'modest_hopes']
  },
  comfortable: {
    range: {min: 75, max: 200},
    description: "Living well without luxury",
    story_implications: ['security', 'moderate_choices', 'stability']
  },
  wealthy: {
    range: {min: 200, max: 1000},
    description: "Enjoying significant luxury",
    story_implications: ['influence', 'responsibility', 'social_expectations']
  },
  extremely_wealthy: {
    range: {min: 1000, max: Infinity},
    description: "Immense wealth and power",
    story_implications: ['political_influence', 'family_legacy', 'societal_responsibility']
  }
};

class EconomicNarrativeService {
  constructor() {
    this.economicContexts = new Map(); // sessionId -> economic context
    this.transactionHistory = new Map(); // sessionId -> transaction array
    this.wealthNarratives = new Map(); // sessionId -> wealth narrative cache
    this.inventoryCache = new Map(); // characterId -> inventory
  }

  /**
   * Initialize character economic status
   */
  async initializeCharacterEconomics(characterId, initialWealth = null, socialClass = 'middle') {
    const economics = {
      character_id: characterId,
      currency_amount: initialWealth || this.generateInitialWealth(socialClass),
      currency_type: this.determineCurrencyType(),
      social_class: socialClass,
      property_value: 0,
      debt_amount: 0,
      income_source: this.generateIncomeSource(socialClass),
      economic_status: null, // Will be calculated
      financial_history: []
    };

    economics.economic_status = this.calculateEconomicStatus(economics.currency_amount);
    
    return economics;
  }

  /**
   * Calculate available story paths based on economic status
   */
  async calculateEconomicStoryPaths(characterId, currentScene, storyContext) {
    const economics = await this.getCharacterEconomics(characterId);
    const inventory = await this.getCharacterInventory(characterId);
    
    const availablePaths = {
      wealth_dependent: [],
      item_dependent: [],
      social_access: [],
      economic_consequences: [],
      period_appropriate: []
    };

    // Wealth-dependent paths
    if (economics.economic_status === 'wealthy' || economics.economic_status === 'extremely_wealthy') {
      availablePaths.wealth_dependent.push(
        'hire_private_investigator',
        'host_social_gathering',
        'purchase_expensive_item',
        'travel_in_luxury',
        'make_charitable_donation',
        'invest_in_business'
      );
    } else if (economics.economic_status === 'struggling' || economics.economic_status === 'poor') {
      availablePaths.wealth_dependent.push(
        'seek_employment',
        'pawn_possessions',
        'request_financial_help',
        'consider_desperate_measures',
        'take_dangerous_job',
        'steal_necessity'
      );
    }

    // Item-dependent paths
    inventory.forEach(item => {
      const itemData = this.getItemFromCatalog(item.item_id);
      if (itemData && itemData.story_potential) {
        availablePaths.item_dependent.push({
          item: item.item_id,
          name: itemData.name,
          potentials: itemData.story_potential,
          social_significance: itemData.social_significance
        });
      }
    });

    // Social access based on wealth and possessions
    availablePaths.social_access = this.calculateSocialAccess(economics, inventory);

    return availablePaths;
  }

  /**
   * Process economic transaction and generate story consequences
   */
  async processEconomicTransaction(characterId, transactionType, amount, itemId = null, context = {}) {
    const economics = await this.getCharacterEconomics(characterId);
    
    const transaction = {
      id: `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      character_id: characterId,
      type: transactionType,
      amount: amount,
      item_id: itemId,
      previous_status: economics.economic_status,
      scene: context.scene || this.currentScene,
      timestamp: Date.now(),
      description: context.description || ''
    };

    // Calculate new wealth
    let newAmount = economics.currency_amount;
    if (transactionType === 'income' || transactionType === 'sale' || transactionType === 'inheritance') {
      newAmount += amount;
    } else if (transactionType === 'expense' || transactionType === 'purchase' || transactionType === 'loss') {
      newAmount -= amount;
    }

    const newStatus = this.calculateEconomicStatus(newAmount);

    // Generate story consequences
    const consequences = this.generateEconomicConsequences(
      transaction,
      economics.economic_status,
      newStatus,
      context
    );

    // Update economics
    const updatedEconomics = {
      ...economics,
      currency_amount: Math.max(0, newAmount),
      economic_status: newStatus,
      last_transaction_scene: context.scene || this.currentScene
    };

    // Store transaction history
    let history = this.transactionHistory.get(characterId) || [];
    history.push(transaction);
    if (history.length > 100) history = history.slice(-100); // Keep last 100
    this.transactionHistory.set(characterId, history);

    return {
      transaction: transaction,
      updated_economics: updatedEconomics,
      new_status: newStatus,
      consequences: consequences
    };
  }

  /**
   * Handle item acquisition (purchase, inheritance, gift, finding)
   */
  async acquireItem(characterId, itemId, acquisitionMethod, sceneNumber, cost = 0) {
    const itemData = this.getItemFromCatalog(itemId);
    if (!itemData) {
      throw new Error(`Unknown item: ${itemId}`);
    }

    // Process payment if purchasing
    if (acquisitionMethod === 'purchased' && cost > 0) {
      await this.processEconomicTransaction(
        characterId, 
        'purchase', 
        cost, 
        itemId,
        { scene: sceneNumber, description: `Purchased ${itemData.name}` }
      );
    }

    // Add to inventory
    const inventoryItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      character_id: characterId,
      item_id: itemId,
      name: itemData.name,
      quantity: 1,
      condition_rating: 100,
      sentimental_value: acquisitionMethod === 'inherited' ? 75 : 
                        acquisitionMethod === 'gifted' ? 50 : 0,
      acquired_scene: sceneNumber,
      acquisition_method: acquisitionMethod,
      location: 'carried',
      purchase_cost: cost,
      current_value: this.calculateCurrentValue(itemData, 100), // Full condition
      item_data: itemData
    };

    // Update inventory cache
    let inventory = this.inventoryCache.get(characterId) || [];
    inventory.push(inventoryItem);
    this.inventoryCache.set(characterId, inventory);

    return inventoryItem;
  }

  /**
   * Generate inheritance event with multi-generational transfer
   */
  async processInheritance(inheritingCharacterId, deceasedCharacterId, inheritanceType = 'full') {
    const deceasedInventory = this.inventoryCache.get(deceasedCharacterId) || [];
    const deceasedEconomics = await this.getCharacterEconomics(deceasedCharacterId);
    
    const inheritance = {
      type: inheritanceType,
      monetary: 0,
      items: [],
      property: [],
      debts: 0,
      social_consequences: []
    };

    // Calculate monetary inheritance
    if (inheritanceType === 'full') {
      inheritance.monetary = deceasedEconomics.currency_amount * 0.85; // Estate taxes/costs
      inheritance.debts = deceasedEconomics.debt_amount;
    } else if (inheritanceType === 'partial') {
      inheritance.monetary = deceasedEconomics.currency_amount * 0.4;
    }

    // Transfer significant items
    inheritance.items = deceasedInventory.filter(item => 
      item.sentimental_value > 25 || item.current_value > 10
    );

    // Calculate social consequences
    inheritance.social_consequences = this.calculateInheritanceSocialImpact(
      deceasedCharacterId, 
      inheritingCharacterId,
      inheritance
    );

    // Process inheritance transaction
    if (inheritance.monetary > 0) {
      await this.processEconomicTransaction(
        inheritingCharacterId,
        'inheritance',
        inheritance.monetary,
        null,
        { description: `Inherited wealth from deceased character` }
      );
    }

    // Transfer items
    for (const item of inheritance.items) {
      await this.acquireItem(
        inheritingCharacterId,
        item.item_id,
        'inherited',
        this.currentScene,
        0
      );
    }

    return inheritance;
  }

  /**
   * Generate AI context for economic storytelling
   */
  generateEconomicContextPrompt(characterId, sceneContext) {
    const economics = this.getCharacterEconomics(characterId);
    const inventory = this.inventoryCache.get(characterId) || [];
    const recentTransactions = this.transactionHistory.get(characterId) || [];

    let economicContext = `\n\n💰 ECONOMIC CONTEXT:\n`;
    economicContext += `Wealth Status: ${economics.economic_status.toUpperCase()}\n`;
    economicContext += `Current Funds: ${economics.currency_amount} ${economics.currency_type}\n`;
    economicContext += `Social Class: ${economics.social_class}\n`;

    if (economics.debt_amount > 0) {
      economicContext += `DEBT: ${economics.debt_amount} ${economics.currency_type} [FINANCIAL PRESSURE]\n`;
    }

    if (inventory.length > 0) {
      economicContext += `\nKEY POSSESSIONS:\n`;
      inventory.slice(0, 5).forEach(item => {
        economicContext += `- ${item.name} (${item.condition_rating}% condition)`;
        if (item.sentimental_value > 50) {
          economicContext += ` [HIGH SENTIMENTAL VALUE]`;
        }
        if (item.item_data.social_significance) {
          economicContext += ` [${item.item_data.social_significance.toUpperCase()}]`;
        }
        economicContext += `\n`;
      });
    }

    if (recentTransactions.length > 0) {
      economicContext += `\nRECENT TRANSACTIONS:\n`;
      recentTransactions.slice(-3).forEach(trans => {
        economicContext += `- ${trans.type}: ${trans.amount} ${economics.currency_type} (${trans.description || 'No description'})\n`;
      });
    }

    // Add economic story implications
    const statusData = this.getEconomicStatusData(economics.economic_status);
    economicContext += `\nECONOMIC STORY IMPLICATIONS:\n`;
    statusData.story_implications.forEach(implication => {
      economicContext += `- ${implication}\n`;
    });

    economicContext += `\n🚨 MANDATORY: Character's economic status must influence available options, reactions, and social interactions!\n`;

    return economicContext;
  }

  /**
   * Calculate economic status from wealth amount
   */
  calculateEconomicStatus(amount) {
    for (const [status, data] of Object.entries(ECONOMIC_STATUS)) {
      if (amount >= data.range.min && amount < data.range.max) {
        return status;
      }
    }
    return 'extremely_wealthy';
  }

  /**
   * Generate economic consequences for story
   */
  generateEconomicConsequences(transaction, oldStatus, newStatus, context) {
    const consequences = {
      immediate: [],
      social: [],
      relationship: [],
      story_opportunities: []
    };

    // Status change consequences
    if (oldStatus !== newStatus) {
      if (this.isWealthIncrease(oldStatus, newStatus)) {
        consequences.immediate.push(`Gained financial security and new opportunities`);
        consequences.social.push(`Improved social standing and access`);
        consequences.story_opportunities.push(`Can now afford luxury items and services`);
      } else {
        consequences.immediate.push(`Lost financial security, facing new limitations`);
        consequences.social.push(`Reduced social standing and restricted access`);
        consequences.story_opportunities.push(`Must consider desperate measures or seek help`);
      }
    }

    // Transaction-specific consequences
    switch (transaction.type) {
      case 'inheritance':
        consequences.social.push(`Inherited not just wealth but also social connections and obligations`);
        consequences.relationship.push(`May face jealousy or expectations from other characters`);
        break;
      
      case 'theft':
        consequences.immediate.push(`Risk of discovery and legal consequences`);
        consequences.relationship.push(`Betrayed trust, potential damage to reputation`);
        break;
      
      case 'charity':
        consequences.social.push(`Gained reputation for generosity and moral character`);
        consequences.relationship.push(`Improved standing with certain social circles`);
        break;
    }

    return consequences;
  }

  /**
   * Get item data from catalog
   */
  getItemFromCatalog(itemId) {
    for (const period of Object.keys(ITEM_CATALOG)) {
      for (const category of Object.keys(ITEM_CATALOG[period])) {
        if (ITEM_CATALOG[period][category][itemId]) {
          return {
            ...ITEM_CATALOG[period][category][itemId],
            period: period,
            category: category,
            id: itemId
          };
        }
      }
    }
    return null;
  }

  /**
   * Generate wealth-dependent story paths
   */
  generateWealthDependentPaths(economics, inventory, currentContext) {
    const paths = [];
    const status = economics.economic_status;

    // High wealth paths
    if (status === 'wealthy' || status === 'extremely_wealthy') {
      paths.push({
        type: 'luxury_purchase',
        description: 'Purchase an expensive item that grants social prestige',
        cost: economics.currency_amount * 0.1,
        benefits: ['social_status', 'story_props', 'character_development']
      });

      paths.push({
        type: 'charitable_action',
        description: 'Make a significant charitable donation',
        cost: economics.currency_amount * 0.05,
        benefits: ['moral_development', 'social_connections', 'reputation']
      });
    }

    // Low wealth paths
    if (status === 'poor' || status === 'struggling') {
      paths.push({
        type: 'desperate_action',
        description: 'Consider morally questionable means to gain money',
        cost: 0,
        risks: ['reputation', 'legal_trouble', 'relationship_damage']
      });

      paths.push({
        type: 'seek_patronage',
        description: 'Approach a wealthy character for financial support',
        cost: 0,
        requirements: ['social_connections', 'persuasion', 'humility']
      });
    }

    return paths;
  }

  /**
   * Get economic summary for UI display
   */
  getEconomicSummary(characterId) {
    const economics = this.getCharacterEconomics(characterId);
    const inventory = this.inventoryCache.get(characterId) || [];
    const transactions = this.transactionHistory.get(characterId) || [];

    return {
      economic_status: economics.economic_status,
      currency_amount: economics.currency_amount,
      currency_type: economics.currency_type,
      total_assets: this.calculateTotalAssets(economics, inventory),
      significant_possessions: inventory.filter(item => 
        item.sentimental_value > 50 || item.current_value > 20
      ),
      recent_transactions: transactions.slice(-5),
      available_story_paths: this.generateWealthDependentPaths(economics, inventory, {}),
      last_updated: new Date().toISOString()
    };
  }
}

export default EconomicNarrativeService;