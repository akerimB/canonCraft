import React, { createContext, useContext, useReducer } from 'react';
import { generateInitialScene, generateNextScene as aiGenerateNextScene, generateNextSceneWithIntelligence, initializeStorySession } from '../services/aiService';
import { databaseMemory } from '../services/databaseMemorySystem';
// Phase 5: Enhanced Persona Scoring Integration
import { enhancedPersonaScoring } from '../services/enhancedPersonaScoring';
import { characterTraitMatrix } from '../services/characterTraitMatrix';

const GameContext = createContext();

const initialState = {
  selectedCharacter: null,
  currentScene: null,
  sceneHistory: [],
  personaScore: 100,
  gameData: {
    choices: [],
    outcomes: []
  },
  storyPacks: [],
  currentStory: null,
  isGeneratingScene: false,
  totalChoicesMade: 0,
  adsWatched: 0,
  // Energy System for Phase 2.5 Monetization
  energy: 5, // Daily energy (5 free scenes)
  maxEnergy: 5,
  lastEnergyRefill: new Date().toISOString(),
  premiumUser: false, // Premium users have unlimited energy
  energyRefillTime: 4 * 60 * 60 * 1000, // 4 hours in milliseconds
  
  // Phase 5: Enhanced Psychological Profiling
  enhancedScoring: {
    matrixChangeScore: 0,
    consistencyScore: 100,
    psychologicalDepth: 50,
    consciousSubconsciousBalance: { balance: 0.5, type: 'balanced' },
    traitEvolutionCount: 0,
    dominantTraits: [],
    lastAssessment: null
  },
  traitMatrixInitialized: false,
  playerAge: null, // Optional player age for trait matrix adjustments
  
  // Phase 6: Predictive Character AI
  predictiveAI: {
    initialized: false,
    available: false,
    predictions: [],
    behavioralPatterns: null,
    personalityInsights: null,
    evolutionPrediction: null
  },
  
  // Phase 7: Immersive Media
  immersiveMedia: {
    initialized: false,
    available: false,
    voiceEnabled: true,
    ambientEnabled: true,
    visualsEnabled: true,
    currentAmbientTheme: null,
    voiceSettings: {
      volume: 0.8,
      speed: 1.0
    },
    ambientSettings: {
      volume: 0.6,
      theme: 'regency_estate'
    },
    visualSettings: {
      filtersEnabled: true,
      style: 'auto'
    },
    mediaCache: {
      voice: {},
      ambient: {},
      visuals: {}
    }
  },

  // Phase 8: Creator Tools
  creatorTools: {
    initialized: false,
    available: false,
    userType: 'student',
    permissions: {
      createCharacters: true,
      createStoryTemplates: false,
      accessAssessments: true,
      manageClassroom: false,
      publishCommunity: true
    },
    content: {
      customCharacters: [],
      storyTemplates: [],
      educationalAssessments: [],
      communityContent: []
    },
    statistics: {
      charactersCreated: 0,
      templatesCreated: 0,
      assessmentsCreated: 0,
      contentPublished: 0
    }
  },

  // Phase 8: Animal Companions & Economy Systems
  animalCompanions: {
    initialized: false,
    available: false,
    companions: [],
    behaviorPredictions: {},
    traitMatrices: {}
  },
  
  economicSystem: {
    initialized: false,
    available: false,
    currencies: {},
    itemCatalog: {}
  },

  // Phase 8: Multi-Species Data
  humanAnimalRelationships: [],
  animalAnimalRelationships: [],
  animalMemories: {},
  characterEconomics: {},
  characterInventories: {},
  economicTransactions: [],
  inheritanceEvents: [],

  // Phase 8: Context Integration
  multiSpeciesContext: {
    lastBuilt: null,
    cached: null,
    participants: {
      humans: 0,
      animals: 0
    }
  }
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SELECT_CHARACTER':
      return {
        ...state,
        selectedCharacter: action.payload,
        personaScore: 100,
        sceneHistory: [],
        currentScene: null,
        gameData: { choices: [], outcomes: [] }
      };
    case 'SET_SCENE':
      return {
        ...state,
        currentScene: action.payload,
        sceneHistory: [...state.sceneHistory, action.payload]
      };
    case 'ADD_CHOICE':
      return {
        ...state,
        gameData: {
          ...state.gameData,
          choices: [...state.gameData.choices, action.payload]
        },
        totalChoicesMade: state.totalChoicesMade + 1
      };
    case 'UPDATE_PERSONA_SCORE':
      return {
        ...state,
        personaScore: Math.max(0, Math.min(100, action.payload))
      };
    case 'SET_STORY_PACKS':
      return {
        ...state,
        storyPacks: action.payload
      };
    case 'START_AI_STORY':
      return {
        ...state,
        currentStory: { ...action.payload, isAIGenerated: true },
        personaScore: 100,
        sceneHistory: [],
        currentScene: null,
        gameData: { choices: [], outcomes: [] },
        totalChoicesMade: 0
      };
    case 'LOAD_STORY_SESSION':
      const { characterPack, storyData, sessionData } = action.payload;
      return {
        ...state,
        currentStory: { ...characterPack, isAIGenerated: true },
        selectedCharacter: characterPack,
        personaScore: sessionData.persona_score || 100,
        sceneHistory: storyData.scenes || [],
        currentScene: storyData.currentScene || null,
        gameData: { 
          choices: storyData.choices || [], 
          outcomes: storyData.outcomes || [] 
        },
        totalChoicesMade: storyData.totalChoicesMade || 0,
        sceneCounter: sessionData.scene_number || 1
      };
    case 'SET_GENERATING':
      return {
        ...state,
        isGeneratingScene: action.payload
      };
    case 'INCREMENT_ADS_WATCHED':
      return {
        ...state,
        adsWatched: state.adsWatched + 1
      };
    case 'RESET_GAME':
      return initialState;
    case 'CONSUME_ENERGY':
      return {
        ...state,
        energy: Math.max(0, state.energy - 1)
      };
    case 'REFILL_ENERGY':
      return {
        ...state,
        energy: state.maxEnergy,
        lastEnergyRefill: new Date().toISOString()
      };
    case 'WATCH_AD_FOR_ENERGY':
      return {
        ...state,
        energy: Math.min(state.maxEnergy, state.energy + 2),
        adsWatched: state.adsWatched + 1
      };
    case 'UPGRADE_TO_PREMIUM':
      return {
        ...state,
        premiumUser: true,
        energy: state.maxEnergy
      };
    case 'CHECK_ENERGY_REFILL':
      const now = new Date();
      const lastRefill = new Date(state.lastEnergyRefill);
      const timeDiff = now - lastRefill;
      
      if (timeDiff >= state.energyRefillTime && state.energy < state.maxEnergy) {
        const hoursElapsed = Math.floor(timeDiff / state.energyRefillTime);
        const newEnergy = Math.min(state.maxEnergy, state.energy + hoursElapsed);
        return {
          ...state,
          energy: newEnergy,
          lastEnergyRefill: new Date(lastRefill.getTime() + (hoursElapsed * state.energyRefillTime)).toISOString()
        };
      }
      return state;
    
    // Phase 5: Enhanced Persona Scoring Actions
    case 'INITIALIZE_TRAIT_MATRIX':
      return {
        ...state,
        traitMatrixInitialized: true,
        playerAge: action.payload.playerAge
      };
    
    case 'UPDATE_ENHANCED_SCORING':
      return {
        ...state,
        enhancedScoring: {
          ...state.enhancedScoring,
          ...action.payload
        }
      };
    
    case 'SET_TRAIT_MATRIX_DATA':
      return {
        ...state,
        enhancedScoring: {
          ...state.enhancedScoring,
          dominantTraits: action.payload.dominantTraits || [],
          matrixChangeScore: action.payload.matrixChangeScore || 0,
          consciousSubconsciousBalance: action.payload.consciousSubconsciousBalance || state.enhancedScoring.consciousSubconsciousBalance
        }
      };
    
    case 'ADD_PSYCHOLOGICAL_ASSESSMENT':
      return {
        ...state,
        enhancedScoring: {
          ...state.enhancedScoring,
          lastAssessment: action.payload
        }
      };
    
    // Phase 6: Predictive Character AI Actions
    case 'SET_PREDICTIVE_AI_STATUS':
      return {
        ...state,
        predictiveAI: {
          ...state.predictiveAI,
          ...action.payload
        }
      };
    
    case 'ADD_CHARACTER_PREDICTION':
      return {
        ...state,
        predictiveAI: {
          ...state.predictiveAI,
          predictions: [
            action.payload,
            ...(state.predictiveAI?.predictions || []).slice(0, 9) // Keep last 10 predictions
          ]
        }
      };
    
    // Phase 7: Immersive Media Actions
    case 'SET_IMMERSIVE_MEDIA_STATUS':
      return {
        ...state,
        immersiveMedia: {
          ...state.immersiveMedia,
          ...action.payload
        }
      };
    
    case 'UPDATE_MEDIA_SETTINGS':
      return {
        ...state,
        immersiveMedia: {
          ...state.immersiveMedia,
          ...action.payload
        }
      };
    
    case 'CACHE_MEDIA_CONTENT':
      const { mediaType, key, content } = action.payload;
      return {
        ...state,
        immersiveMedia: {
          ...state.immersiveMedia,
          mediaCache: {
            ...state.immersiveMedia.mediaCache,
            [mediaType]: {
              ...state.immersiveMedia.mediaCache[mediaType],
              [key]: content
            }
          }
        }
      };
    
    // Phase 8: Creator Tools Actions
    case 'SET_CREATOR_TOOLS_STATUS':
      return {
        ...state,
        creatorTools: {
          ...state.creatorTools,
          ...action.payload
        }
      };
    
    case 'UPDATE_CREATOR_CONTENT':
      return {
        ...state,
        creatorTools: {
          ...state.creatorTools,
          content: {
            ...state.creatorTools.content,
            ...action.payload
          }
        }
      };
    
    case 'UPDATE_CREATOR_STATISTICS':
      return {
        ...state,
        creatorTools: {
          ...state.creatorTools,
          statistics: {
            ...state.creatorTools.statistics,
            ...action.payload
          }
        }
      };
    
    case 'ADD_CUSTOM_CHARACTER':
      return {
        ...state,
        creatorTools: {
          ...state.creatorTools,
          content: {
            ...state.creatorTools.content,
            customCharacters: [...state.creatorTools.content.customCharacters, action.payload]
          },
          statistics: {
            ...state.creatorTools.statistics,
            charactersCreated: state.creatorTools.statistics.charactersCreated + 1
          }
        }
      };
    
    // Phase 8: Animal Companions & Economy Actions
    case 'SET_ANIMAL_COMPANIONS_STATUS':
      return {
        ...state,
        animalCompanions: {
          ...state.animalCompanions,
          ...action.payload
        }
      };
    
    case 'ADD_ANIMAL_COMPANION':
      return {
        ...state,
        animalCompanions: [...(state.animalCompanions || []), action.payload]
      };
    
    case 'UPDATE_ANIMAL_RELATIONSHIP':
      return {
        ...state,
        humanAnimalRelationships: state.humanAnimalRelationships.map(rel =>
          rel.id === action.payload.relationshipId
            ? { ...rel, ...action.payload.changes }
            : rel
        )
      };
    
    case 'ADD_ANIMAL_MEMORY':
      return {
        ...state,
        animalMemories: {
          ...state.animalMemories,
          [action.payload.animalId]: [
            ...(state.animalMemories?.[action.payload.animalId] || []),
            action.payload.memory
          ]
        }
      };
    
    case 'SET_ECONOMIC_SYSTEM_STATUS':
      return {
        ...state,
        economicSystem: {
          ...state.economicSystem,
          ...action.payload
        }
      };
    
    case 'UPDATE_CHARACTER_ECONOMICS':
      return {
        ...state,
        characterEconomics: {
          ...state.characterEconomics,
          [action.payload.characterId]: action.payload.economics
        },
        economicTransactions: [
          ...(state.economicTransactions || []),
          action.payload.transaction
        ]
      };
    
    case 'ADD_CHARACTER_ITEM':
      return {
        ...state,
        characterInventories: {
          ...state.characterInventories,
          [action.payload.characterId]: [
            ...(state.characterInventories?.[action.payload.characterId] || []),
            action.payload.item
          ]
        }
      };
    
    case 'REMOVE_CHARACTER_ITEM':
      return {
        ...state,
        characterInventories: {
          ...state.characterInventories,
          [action.payload.characterId]: (state.characterInventories?.[action.payload.characterId] || [])
            .filter(item => item.id !== action.payload.itemId)
        }
      };
    
    case 'UPDATE_ITEM_CONDITION':
      return {
        ...state,
        characterInventories: {
          ...state.characterInventories,
          [action.payload.characterId]: (state.characterInventories?.[action.payload.characterId] || [])
            .map(item => 
              item.id === action.payload.itemId
                ? { ...item, condition_rating: action.payload.newCondition }
                : item
            )
        }
      };
    
    case 'PROCESS_INHERITANCE':
      return {
        ...state,
        inheritanceEvents: [
          ...(state.inheritanceEvents || []),
          action.payload
        ]
      };
    
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const value = {
    state,
    dispatch,
    // Helper functions
    selectCharacter: (character) => dispatch({ type: 'SELECT_CHARACTER', payload: character }),
    setScene: (scene) => dispatch({ type: 'SET_SCENE', payload: scene }),
    addChoice: (choice) => dispatch({ type: 'ADD_CHOICE', payload: choice }),
    updatePersonaScore: (score) => dispatch({ type: 'UPDATE_PERSONA_SCORE', payload: score }),
    setStoryPacks: (packs) => dispatch({ type: 'SET_STORY_PACKS', payload: packs }),
    startAIStory: async (story, playerAge = null) => {
      console.log('🎬 Starting AI Story with character:', story);
      console.log('Character properties:', {
        id: story.id,
        name: story.name,
        setting: story.setting,
        traits: story.traits,
        speech_style: story.speech_style,
        background: story.background,
        worldview: story.worldview
      });
      
      dispatch({ type: 'SELECT_CHARACTER', payload: story });
      dispatch({ type: 'START_AI_STORY', payload: story });
      dispatch({ type: 'SET_GENERATING', payload: true });
      
      try {
        // Initialize story session with Phase 2 systems
        const sessionId = await initializeStorySession(story);
        
        // Phase 5: Initialize enhanced persona scoring and trait matrix
        console.log('🧠 Initializing Phase 5 enhanced persona scoring...');
        await enhancedPersonaScoring.initializeScoring(story, sessionId, playerAge);
        dispatch({ type: 'INITIALIZE_TRAIT_MATRIX', payload: { playerAge } });
        
        // Get initial trait matrix data
        const matrixSummary = characterTraitMatrix.getMatrixSummary(sessionId);
        if (matrixSummary) {
          dispatch({ type: 'SET_TRAIT_MATRIX_DATA', payload: matrixSummary });
        }
        
        // Generate the initial scene with intelligence systems and default freedom level
        const initialScene = await generateNextSceneWithIntelligence(
          story,
          "Begin the story",
          null,
          1,
          50  // Default freedom level for initial scene
        );
        
        console.log('Initial scene generated:', initialScene?.title);
        
        if (initialScene) {
          dispatch({ type: 'SET_SCENE', payload: initialScene });
        } else {
          throw new Error('No scene generated');
        }
      } catch (error) {
        console.error('Failed to generate initial scene:', error);
        // Set a fallback scene or handle error
      } finally {
        dispatch({ type: 'SET_GENERATING', payload: false });
      }
    },
    
    // Phase 5: Enhanced Persona Scoring Helper Functions
    scoreEnhancedDecision: async (decisionData) => {
      try {
        const result = await enhancedPersonaScoring.scoreEnhancedDecision(decisionData);
        
        if (result) {
          // Update traditional persona score
          dispatch({ type: 'UPDATE_PERSONA_SCORE', payload: result.currentScore });
          
          // Update enhanced scoring metrics
          dispatch({ type: 'UPDATE_ENHANCED_SCORING', payload: {
            matrixChangeScore: result.matrixChangeScore,
            consistencyScore: result.consistencyScore,
            psychologicalDepth: result.enhancedScore,
            traitEvolutionCount: result.traitEvolution ? 1 : 0
          }});
          
          // Update trait matrix data if changed
          if (result.traitEvolution) {
            const matrixSummary = characterTraitMatrix.getMatrixSummary(state.currentStory?.id);
            if (matrixSummary) {
              dispatch({ type: 'SET_TRAIT_MATRIX_DATA', payload: matrixSummary });
            }
          }
          
          // Handle score reveals and assessments
          if (result.shouldReveal && result.revealData?.enhancedData) {
            const enhancedData = result.revealData.enhancedData;
            
            // Store latest assessment
            if (enhancedData.traitInsights) {
              dispatch({ type: 'ADD_PSYCHOLOGICAL_ASSESSMENT', payload: enhancedData.traitInsights });
            }
            
            // Update psychological growth metrics
            if (enhancedData.psychologicalGrowth) {
              dispatch({ type: 'UPDATE_ENHANCED_SCORING', payload: {
                traitEvolutionCount: enhancedData.psychologicalGrowth.traitEvolutionCount
              }});
            }
            
            // Update consciousness balance
            if (enhancedData.consciousSubconsciousBalance) {
              dispatch({ type: 'UPDATE_ENHANCED_SCORING', payload: {
                consciousSubconsciousBalance: enhancedData.consciousSubconsciousBalance
              }});
            }
          }
        }
        
        return result;
      } catch (error) {
        console.error('Failed to score enhanced decision:', error);
        return null;
      }
    },
    
    getTraitMatrixSummary: () => {
      if (state.currentStory?.id) {
        return characterTraitMatrix.getMatrixSummary(state.currentStory.id);
      }
      return null;
    },
    
    getEnhancedPersonaSummary: () => {
      return enhancedPersonaScoring.getEnhancedPersonaSummary();
    },
    
    // Phase 6: Predictive Character AI functions
    initializePredictiveAI: async (characterPack) => {
      try {
        const { predictiveCharacterAI } = await import('../services/predictiveCharacterAI');
        const success = await predictiveCharacterAI.initializePredictiveAI(state.currentStory?.id, characterPack);
        
        dispatch({
          type: 'SET_PREDICTIVE_AI_STATUS',
          payload: { initialized: success, available: success }
        });
        
        return success;
      } catch (error) {
        console.error('Failed to initialize predictive AI:', error);
        return false;
      }
    },

    generateCharacterPrediction: async (scenario, predictionType) => {
      try {
        const { predictiveCharacterAI } = await import('../services/predictiveCharacterAI');
        const prediction = await predictiveCharacterAI.predictCharacterResponse(
          state.currentStory?.id, 
          scenario, 
          predictionType
        );
        
        dispatch({
          type: 'ADD_CHARACTER_PREDICTION',
          payload: prediction
        });
        
        return prediction;
      } catch (error) {
        console.error('Failed to generate character prediction:', error);
        return null;
      }
    },

    getPredictiveAIStatus: () => {
      return state.predictiveAI || { initialized: false, available: false };
    },
    
    // Phase 7: Immersive Media functions
    initializeImmersiveMedia: async (characterPack, preferences = {}) => {
      try {
        const { immersiveMediaService } = await import('../services/immersiveMediaService');
        const success = await immersiveMediaService.initializeImmersiveMedia(characterPack, preferences);
        
        dispatch({
          type: 'SET_IMMERSIVE_MEDIA_STATUS',
          payload: { 
            initialized: success, 
            available: success,
            ...preferences
          }
        });
        
        return success;
      } catch (error) {
        console.error('Failed to initialize immersive media:', error);
        return false;
      }
    },

    generateImmersiveExperience: async (sceneData, emotionData = null) => {
      try {
        const { immersiveMediaService } = await import('../services/immersiveMediaService');
        const experience = await immersiveMediaService.createImmersiveExperience(
          sceneData,
          state.selectedCharacter?.id,
          emotionData
        );
        
        // Cache generated content
        if (experience.voice) {
          dispatch({
            type: 'CACHE_MEDIA_CONTENT',
            payload: {
              mediaType: 'voice',
              key: `${state.selectedCharacter?.id}_${Date.now()}`,
              content: experience.voice
            }
          });
        }
        
        if (experience.audio) {
          dispatch({
            type: 'CACHE_MEDIA_CONTENT',
            payload: {
              mediaType: 'ambient',
              key: `${state.selectedCharacter?.id}_${Date.now()}`,
              content: experience.audio
            }
          });
        }
        
        if (experience.visual) {
          dispatch({
            type: 'CACHE_MEDIA_CONTENT',
            payload: {
              mediaType: 'visuals',
              key: `${state.selectedCharacter?.id}_${Date.now()}`,
              content: experience.visual
            }
          });
        }
        
        return experience;
      } catch (error) {
        console.error('Failed to generate immersive experience:', error);
        return null;
      }
    },

    updateMediaSettings: (settings) => {
      dispatch({
        type: 'UPDATE_MEDIA_SETTINGS',
        payload: settings
      });
    },

    getImmersiveMediaStatus: () => {
      return state.immersiveMedia || { initialized: false, available: false };
    },
    
    // Phase 8: Creator Tools functions
    initializeCreatorTools: async (userType = 'student', permissions = {}) => {
      try {
        const { creatorToolsService } = await import('../services/creatorToolsService');
        const success = await creatorToolsService.initializeCreatorTools(userType, permissions);
        
        dispatch({
          type: 'SET_CREATOR_TOOLS_STATUS',
          payload: { 
            initialized: success, 
            available: success,
            userType: userType,
            permissions: permissions
          }
        });
        
        return success;
      } catch (error) {
        console.error('Failed to initialize creator tools:', error);
        return false;
      }
    },

    createCustomCharacter: async (characterData, template = 'classic_literature') => {
      try {
        const { creatorToolsService } = await import('../services/creatorToolsService');
        const character = await creatorToolsService.createCustomCharacter(characterData, template);
        
        dispatch({
          type: 'ADD_CUSTOM_CHARACTER',
          payload: character
        });
        
        return character;
      } catch (error) {
        console.error('Failed to create custom character:', error);
        throw error;
      }
    },

    createStoryTemplate: async (templateData) => {
      try {
        const { creatorToolsService } = await import('../services/creatorToolsService');
        const template = await creatorToolsService.createStoryTemplate(templateData);
        
        dispatch({
          type: 'UPDATE_CREATOR_CONTENT',
          payload: {
            storyTemplates: [...state.creatorTools.content.storyTemplates, template]
          }
        });
        
        dispatch({
          type: 'UPDATE_CREATOR_STATISTICS',
          payload: {
            templatesCreated: state.creatorTools.statistics.templatesCreated + 1
          }
        });
        
        return template;
      } catch (error) {
        console.error('Failed to create story template:', error);
        throw error;
      }
    },

    createEducationalAssessment: async (assessmentData, framework = 'reading_comprehension') => {
      try {
        const { creatorToolsService } = await import('../services/creatorToolsService');
        const assessment = await creatorToolsService.createEducationalAssessment(assessmentData, framework);
        
        dispatch({
          type: 'UPDATE_CREATOR_CONTENT',
          payload: {
            educationalAssessments: [...state.creatorTools.content.educationalAssessments, assessment]
          }
        });
        
        dispatch({
          type: 'UPDATE_CREATOR_STATISTICS',
          payload: {
            assessmentsCreated: state.creatorTools.statistics.assessmentsCreated + 1
          }
        });
        
        return assessment;
      } catch (error) {
        console.error('Failed to create educational assessment:', error);
        throw error;
      }
    },

    publishCommunityContent: async (contentId, contentType) => {
      try {
        const { creatorToolsService } = await import('../services/creatorToolsService');
        const publishedContent = await creatorToolsService.publishCommunityContent(contentId, contentType);
        
        dispatch({
          type: 'UPDATE_CREATOR_CONTENT',
          payload: {
            communityContent: [...state.creatorTools.content.communityContent, publishedContent]
          }
        });
        
        dispatch({
          type: 'UPDATE_CREATOR_STATISTICS',
          payload: {
            contentPublished: state.creatorTools.statistics.contentPublished + 1
          }
        });
        
        return publishedContent;
      } catch (error) {
        console.error('Failed to publish community content:', error);
        throw error;
      }
    },

    getCreatorToolsStatus: () => {
      return state.creatorTools || { initialized: false, available: false };
    },

    // Phase 8: Animal Companions & Economy Functions
    initializeAnimalCompanions: async () => {
      try {
        const { default: AnimalBehaviorService } = await import('../services/animalBehaviorService');
        const animalService = new AnimalBehaviorService();
        
        dispatch({
          type: 'SET_ANIMAL_COMPANIONS_STATUS',
          payload: { 
            initialized: true, 
            available: true,
            service: animalService
          }
        });
        
        return true;
      } catch (error) {
        console.error('Failed to initialize animal companions:', error);
        return false;
      }
    },

    acquireAnimalCompanion: async (animalData, acquisitionMethod = 'encountered') => {
      try {
        const { default: AnimalBehaviorService } = await import('../services/animalBehaviorService');
        const animalService = new AnimalBehaviorService();
        
        const companion = await animalService.initializeAnimalCompanion({
          ...animalData,
          id: `animal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          acquired_scene: state.sceneHistory?.length || 1,
          acquisition_method: acquisitionMethod
        });
        
        dispatch({
          type: 'ADD_ANIMAL_COMPANION',
          payload: companion
        });
        
        return companion;
      } catch (error) {
        console.error('Failed to acquire animal companion:', error);
        throw error;
      }
    },

    initializeEconomicSystem: async () => {
      try {
        const { default: EconomicNarrativeService } = await import('../services/economicNarrativeService');
        const economicService = new EconomicNarrativeService();
        
        dispatch({
          type: 'SET_ECONOMIC_SYSTEM_STATUS',
          payload: { 
            initialized: true, 
            available: true,
            service: economicService
          }
        });
        
        return true;
      } catch (error) {
        console.error('Failed to initialize economic system:', error);
        return false;
      }
    },

    processEconomicTransaction: async (characterId, transactionType, amount, itemId = null, context = {}) => {
      try {
        const { default: EconomicNarrativeService } = await import('../services/economicNarrativeService');
        const economicService = new EconomicNarrativeService();
        
        const result = await economicService.processEconomicTransaction(
          characterId,
          transactionType,
          amount,
          itemId,
          { ...context, scene: state.sceneHistory?.length || 1 }
        );
        
        dispatch({
          type: 'UPDATE_CHARACTER_ECONOMICS',
          payload: {
            characterId: characterId,
            economics: result.updated_economics,
            transaction: result.transaction
          }
        });
        
        return result;
      } catch (error) {
        console.error('Failed to process economic transaction:', error);
        throw error;
      }
    },

    acquireItem: async (characterId, itemId, acquisitionMethod, cost = 0) => {
      try {
        const { default: EconomicNarrativeService } = await import('../services/economicNarrativeService');
        const economicService = new EconomicNarrativeService();
        
        const item = await economicService.acquireItem(
          characterId,
          itemId,
          acquisitionMethod,
          state.sceneHistory?.length || 1,
          cost
        );
        
        dispatch({
          type: 'ADD_CHARACTER_ITEM',
          payload: {
            characterId: characterId,
            item: item
          }
        });
        
        return item;
      } catch (error) {
        console.error('Failed to acquire item:', error);
        throw error;
      }
    },

    getAnimalCompanionSummary: (animalId) => {
      const animal = state.animalCompanions?.find(a => a.id === animalId);
      if (!animal) return null;
      
      return {
        ...animal,
        relationship_count: state.humanAnimalRelationships?.filter(r => r.animal_id === animalId).length || 0,
        last_interaction: state.animalMemories?.[animalId]?.slice(-1)[0] || null
      };
    },

    getEconomicSummary: (characterId) => {
      const economics = state.characterEconomics?.[characterId];
      const inventory = state.characterInventories?.[characterId] || [];
      
      if (!economics) return null;
      
      return {
        ...economics,
        significant_possessions: inventory.filter(item => 
          item.sentimental_value > 50 || item.current_value > 20
        ),
        total_inventory_value: inventory.reduce((sum, item) => sum + (item.current_value || 0), 0)
      };
    },
    generateNextScene: async (choice, freedomLevel = 50) => {
      dispatch({ type: 'SET_GENERATING', payload: true });
      dispatch({ type: 'ADD_CHOICE', payload: choice });
      
      // TEMPORARILY DISABLED: Check if user has energy (unless premium)
      // if (!state.premiumUser && state.energy <= 0) {
      //   dispatch({ type: 'SET_GENERATING', payload: false });
      //   throw new Error('INSUFFICIENT_ENERGY');
      // }
      
      try {
        const sceneNumber = (state.sceneHistory?.length || 0) + 1;
        
        // Use Phase 2 intelligent scene generation with freedom level
        const nextScene = await generateNextSceneWithIntelligence(
          state.selectedCharacter,
          choice.text || choice,
          state.currentScene,
          sceneNumber,
          freedomLevel
        );
        
        console.log('Next scene generated:', nextScene?.title);
        
        if (nextScene) {
          dispatch({ type: 'SET_SCENE', payload: nextScene });
          
          // TEMPORARILY DISABLED: Consume energy (unless premium user)
          // if (!state.premiumUser) {
          //   dispatch({ type: 'CONSUME_ENERGY' });
          // }
        } else {
          throw new Error('No scene generated');
        }
        
        // Update persona score based on choice
        if (choice.persona_impact) {
          const newScore = state.personaScore + choice.persona_impact;
          dispatch({ type: 'UPDATE_PERSONA_SCORE', payload: newScore });
          console.log('🎭 Persona score updated:', {
            oldScore: state.personaScore,
            impact: choice.persona_impact,
            newScore: newScore
          });
        }
      } catch (error) {
        console.error('Failed to generate next scene:', error);
        throw error; // Re-throw to let SceneScreen handle it
      } finally {
        dispatch({ type: 'SET_GENERATING', payload: false });
      }
    },
    incrementAdsWatched: () => dispatch({ type: 'INCREMENT_ADS_WATCHED' }),
    loadGameState: () => {
      // For now, this is a no-op. In the future, this could load from AsyncStorage
      console.log('Loading game state...');
    },
    resetGame: () => dispatch({ type: 'RESET_GAME' }),
    // Energy Management Functions
    checkEnergyRefill: () => dispatch({ type: 'CHECK_ENERGY_REFILL' }),
    watchAdForEnergy: () => dispatch({ type: 'WATCH_AD_FOR_ENERGY' }),
    upgradeToPremium: () => dispatch({ type: 'UPGRADE_TO_PREMIUM' }),
    refillEnergy: () => dispatch({ type: 'REFILL_ENERGY' }),
    getTimeUntilNextEnergyRefill: () => {
      const now = new Date();
      const lastRefill = new Date(state.lastEnergyRefill);
      const nextRefill = new Date(lastRefill.getTime() + state.energyRefillTime);
      const timeUntilRefill = nextRefill - now;
      
      if (timeUntilRefill <= 0) return 0;
      
      const hours = Math.floor(timeUntilRefill / (1000 * 60 * 60));
      const minutes = Math.floor((timeUntilRefill % (1000 * 60 * 60)) / (1000 * 60));
      
      return { hours, minutes, totalMs: timeUntilRefill };
    },
    canGenerateScene: () => true, // TEMPORARILY DISABLED: state.premiumUser || state.energy > 0,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
} 