import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AIStoryService from './aiService';

// Game State Context
const GameContext = createContext();

// Initial state
const initialState = {
  currentStory: null,
  currentScene: null,
  personaScore: 50, // 0-100 scale
  gameProgress: {},
  storyPacks: [],
  adsWatched: 0,
  totalChoicesMade: 0,
  isGeneratingScene: false,
  currentCharacterPack: null,
};

// Actions
const ACTIONS = {
  START_AI_STORY: 'START_AI_STORY',
  SET_SCENE: 'SET_SCENE',
  UPDATE_PERSONA: 'UPDATE_PERSONA',
  RESET_GAME: 'RESET_GAME',
  SET_STORY_PACKS: 'SET_STORY_PACKS',
  INCREMENT_ADS: 'INCREMENT_ADS',
  INCREMENT_CHOICES: 'INCREMENT_CHOICES',
  LOAD_SAVED_STATE: 'LOAD_SAVED_STATE',
  SET_GENERATING: 'SET_GENERATING',
  SET_CHARACTER_PACK: 'SET_CHARACTER_PACK',
};

// Reducer
function gameReducer(state, action) {
  switch (action.type) {
    case ACTIONS.START_AI_STORY:
      return {
        ...state,
        currentStory: action.payload.story,
        currentScene: action.payload.scene,
        currentCharacterPack: action.payload.characterPack,
        personaScore: 50,
        totalChoicesMade: 0,
      };
    
    case ACTIONS.SET_SCENE:
      return {
        ...state,
        currentScene: action.payload,
      };
    
    case ACTIONS.UPDATE_PERSONA:
      const newScore = Math.max(0, Math.min(100, state.personaScore + action.payload));
      return {
        ...state,
        personaScore: newScore,
        totalChoicesMade: state.totalChoicesMade + 1,
      };
    
    case ACTIONS.RESET_GAME:
      return {
        ...state,
        currentStory: null,
        currentScene: null,
        currentCharacterPack: null,
        personaScore: 50,
        totalChoicesMade: 0,
        isGeneratingScene: false,
      };
    
    case ACTIONS.SET_STORY_PACKS:
      return {
        ...state,
        storyPacks: action.payload,
      };
    
    case ACTIONS.INCREMENT_ADS:
      return {
        ...state,
        adsWatched: state.adsWatched + 1,
      };
    
    case ACTIONS.INCREMENT_CHOICES:
      return {
        ...state,
        totalChoicesMade: state.totalChoicesMade + 1,
      };
    
    case ACTIONS.LOAD_SAVED_STATE:
      return {
        ...state,
        ...action.payload,
      };
    
    case ACTIONS.SET_GENERATING:
      return {
        ...state,
        isGeneratingScene: action.payload,
      };
    
    case ACTIONS.SET_CHARACTER_PACK:
      return {
        ...state,
        currentCharacterPack: action.payload,
      };
    
    default:
      return state;
  }
}

// Context Provider
export function GameContextProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Save game state to AsyncStorage
  const saveGameState = async () => {
    try {
      const gameState = {
        currentStory: state.currentStory,
        currentScene: state.currentScene,
        currentCharacterPack: state.currentCharacterPack,
        personaScore: state.personaScore,
        totalChoicesMade: state.totalChoicesMade,
        adsWatched: state.adsWatched,
      };
      await AsyncStorage.setItem('gameState', JSON.stringify(gameState));
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  };

  // Load game state from AsyncStorage
  const loadGameState = async () => {
    try {
      const savedState = await AsyncStorage.getItem('gameState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        dispatch({ type: ACTIONS.LOAD_SAVED_STATE, payload: parsedState });
      }
    } catch (error) {
      console.error('Error loading game state:', error);
    }
  };

  // Auto-save whenever critical state changes
  useEffect(() => {
    if (state.currentStory && state.currentScene) {
      saveGameState();
    }
  }, [state.currentScene, state.personaScore]);

  // Game actions
  const gameActions = {
    // Start a new AI-driven story
    startAIStory: async (characterPack) => {
      dispatch({ type: ACTIONS.SET_GENERATING, payload: true });
      dispatch({ type: ACTIONS.SET_CHARACTER_PACK, payload: characterPack });
      
      try {
        const initialScene = await AIStoryService.startStory(characterPack);
        const story = {
          id: characterPack.id,
          title: characterPack.title,
          character: characterPack.character,
          persona: characterPack.persona,
          isAIGenerated: true,
        };
        
        dispatch({ 
          type: ACTIONS.START_AI_STORY, 
          payload: { 
            story, 
            scene: initialScene, 
            characterPack 
          } 
        });
      } catch (error) {
        console.error('Error starting AI story:', error);
        // Fallback to basic story start
        const fallbackScene = {
          scene_id: 'scene_1',
          title: 'Beginning',
          narration: `Your adventure as ${characterPack.character} begins...`,
          choices: [{
            choice_id: '1',
            text: 'Continue the story',
            persona_score: 0,
            next_scene: 'scene_2'
          }]
        };
        const story = {
          id: characterPack.id,
          title: characterPack.title,
          character: characterPack.character,
          persona: characterPack.persona,
          isAIGenerated: true,
        };
        dispatch({ 
          type: ACTIONS.START_AI_STORY, 
          payload: { 
            story, 
            scene: fallbackScene, 
            characterPack 
          } 
        });
      } finally {
        dispatch({ type: ACTIONS.SET_GENERATING, payload: false });
      }
    },
    
    // Generate next scene based on choice
    generateNextScene: async (choice) => {
      dispatch({ type: ACTIONS.SET_GENERATING, payload: true });
      
      try {
        const currentContext = {
          personaScore: state.personaScore,
          totalChoicesMade: state.totalChoicesMade,
          character: state.currentStory?.character,
        };
        
        const nextScene = await AIStoryService.generateNextScene(choice, currentContext);
        dispatch({ type: ACTIONS.SET_SCENE, payload: nextScene });
        
        return nextScene;
      } catch (error) {
        console.error('Error generating next scene:', error);
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_GENERATING, payload: false });
      }
    },
    
    setScene: (scene) => {
      dispatch({ type: ACTIONS.SET_SCENE, payload: scene });
    },
    
    updatePersonaScore: (delta) => {
      dispatch({ type: ACTIONS.UPDATE_PERSONA, payload: delta });
    },
    
    resetGame: () => {
      dispatch({ type: ACTIONS.RESET_GAME });
    },
    
    setStoryPacks: (packs) => {
      dispatch({ type: ACTIONS.SET_STORY_PACKS, payload: packs });
    },
    
    incrementAdsWatched: () => {
      dispatch({ type: ACTIONS.INCREMENT_ADS });
    },
    
    getPersonaMessage: () => {
      const score = state.personaScore;
      if (score >= 80) return "Perfect embodiment! You're truly in character.";
      if (score >= 60) return "Great portrayal! You understand this character well.";
      if (score >= 40) return "Good effort! Some choices felt authentic.";
      if (score >= 20) return "Interesting interpretation! Very different from the original.";
      return "Completely off-character! But that's an adventure too.";
    },
    
    findSceneById: (sceneId) => {
      // For AI-generated stories, we don't pre-load scenes
      // This method is mainly for backward compatibility
      return null;
    },
    
    loadGameState,
    saveGameState,
  };

  return (
    <GameContext.Provider value={{ state, ...gameActions }}>
      {children}
    </GameContext.Provider>
  );
}

// Custom hook to use game context
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameContextProvider');
  }
  return context;
} 