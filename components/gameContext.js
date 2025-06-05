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