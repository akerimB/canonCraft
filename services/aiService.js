/**
 * InCharacter AI Service - Phase 5 Enhanced
 * Handles all AI interactions with OpenAI API including character modeling
 */

import { openai, MODEL_CONFIGS } from '../config.js';
import { databaseMemory } from './databaseMemorySystem.js';

// Player input validation limits
export const PLAYER_INPUT_LIMITS = {
  MIN_LENGTH: 10,
  MAX_LENGTH: 500,
  WARNING_LENGTH: 400
};

/**
 * Initialize story session with Phase 5 enhancements
 */
export async function initializeStorySession(characterPack) {
  try {
    console.log('🎬 Initializing story session for:', characterPack.name);
    
    // Initialize database memory
    const sessionId = await databaseMemory.createStorySession(characterPack);
    
    // Store character in memory
    await databaseMemory.storeCharacterProfile(sessionId, {
      id: characterPack.id,
      name: characterPack.name,
      setting: characterPack.setting,
      personality: characterPack.traits,
      background: characterPack.background,
      speech_style: characterPack.speech_style,
      worldview: characterPack.worldview
    });
    
    console.log('✅ Story session initialized:', sessionId);
    return sessionId;
  } catch (error) {
    console.error('❌ Failed to initialize story session:', error);
    throw error;
  }
}

/**
 * Generate next scene with Phase 5 intelligence systems
 */
export async function generateNextSceneWithIntelligence(
  characterPack, 
  playerAction, 
  previousScene = null, 
  sceneNumber = 1,
  freedomLevel = 50
) {
  try {
    console.log('🎭 Generating scene with Phase 5 intelligence...');
    
    // Get story memory context
    const memoryContext = await databaseMemory.getRecentMemory(characterPack.id, 10);
    
    // Build context-aware prompt
    const systemPrompt = `You are an expert storyteller creating an immersive interactive fiction experience. 

Character: ${characterPack.name}
Setting: ${characterPack.setting}
Personality: ${characterPack.traits}
Background: ${characterPack.background}
Speech Style: ${characterPack.speech_style}
Worldview: ${characterPack.worldview}

Recent Story Context:
${memoryContext.map(m => `${m.type}: ${m.content}`).join('\n')}

Freedom Level: ${freedomLevel}/100 (${freedomLevel < 30 ? 'Guided' : freedomLevel > 70 ? 'Open-ended' : 'Balanced'})

Create a compelling scene that:
1. Responds naturally to the player's action: "${playerAction}"
2. Maintains character authenticity and psychological consistency
3. Advances the narrative meaningfully
4. Matches the freedom level (more guided vs open-ended based on setting)
5. Includes appropriate emotional depth and character development

Return ONLY a JSON object with this exact structure:
{
  "title": "Scene title",
  "narration": "Rich narrative text describing what happens next (2-3 paragraphs)",
  "character_thoughts": "Internal monologue or emotional state",
  "scene_atmosphere": "Description of mood/setting",
  "next_prompt": "Natural lead-in for the next player action"
}`;

    const response = await openai.chat.completions.create({
      model: MODEL_CONFIGS.SCENE_GENERATION.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Player Action: ${playerAction}` }
      ],
      temperature: MODEL_CONFIGS.SCENE_GENERATION.temperature,
      max_tokens: MODEL_CONFIGS.SCENE_GENERATION.max_tokens
    });

    const content = response.choices[0].message.content;
    console.log('🤖 AI Response received:', content.substring(0, 100) + '...');
    
    let sceneData;
    try {
      sceneData = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parsing failed, creating fallback scene');
      sceneData = createFallbackScene(characterPack, playerAction, sceneNumber);
    }

    // Store the scene in memory
    if (sceneData) {
      await databaseMemory.storeStoryEvent(characterPack.id, {
        type: 'SCENE',
        content: sceneData.narration,
        metadata: {
          title: sceneData.title,
          scene_number: sceneNumber,
          player_action: playerAction,
          freedom_level: freedomLevel
        }
      });
    }

    console.log('✅ Scene generated successfully');
    return sceneData;

  } catch (error) {
    console.error('❌ Error generating scene:', error);
    return createFallbackScene(characterPack, playerAction, sceneNumber);
  }
}

/**
 * Generate scene image
 */
export async function generateSceneImage(characterPack, scene) {
  const placeholderImages = {
    'sherlock_holmes': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    'dracula': 'https://images.unsplash.com/photo-1520637836862-4d197d17c96a?w=400&h=300&fit=crop',
    'elizabeth_bennet': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop',
    'default': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop'
  };
  
  return placeholderImages[characterPack.id] || placeholderImages.default;
}

/**
 * Generate AI choice suggestions
 */
export async function generateChoiceSuggestions(characterPack, currentScene) {
  try {
    const prompt = `As ${characterPack.name}, suggest 3 brief actions or dialogue options that would be authentic to this character in the current scene.

Character: ${characterPack.name}
Traits: ${characterPack.traits}
Current Scene: ${currentScene.narration}

Return ONLY a JSON array of 3 short suggestions (max 50 characters each):
["suggestion 1", "suggestion 2", "suggestion 3"]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 200
    });

    const suggestions = JSON.parse(response.choices[0].message.content);
    return suggestions.slice(0, 3);
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return [
      "Continue exploring",
      "Ask a question", 
      "Wait and observe"
    ];
  }
}

/**
 * Parse and validate player input
 */
export function parsePlayerInput(input) {
  if (!input || typeof input !== 'string') {
    return {
      isValid: false,
      error: 'Input is required',
      suggestion: 'Please enter your character\'s action or dialogue.'
    };
  }

  const trimmedInput = input.trim();
  
  if (trimmedInput.length < PLAYER_INPUT_LIMITS.MIN_LENGTH) {
    return {
      isValid: false,
      error: `Input too short (minimum ${PLAYER_INPUT_LIMITS.MIN_LENGTH} characters)`,
      suggestion: 'Provide more detail about what your character does or says.'
    };
  }

  if (trimmedInput.length > PLAYER_INPUT_LIMITS.MAX_LENGTH) {
    return {
      isValid: false,
      error: `Input too long (maximum ${PLAYER_INPUT_LIMITS.MAX_LENGTH} characters)`,
      suggestion: 'Please shorten your input while keeping the essential action.'
    };
  }

  const analysisData = analyzeInputQuality(trimmedInput);

  return {
    isValid: true,
    originalInput: input,
    cleanedInput: trimmedInput,
    promptData: analysisData
  };
}

/**
 * Analyze input quality for psychological depth
 */
function analyzeInputQuality(input) {
  const lowercaseInput = input.toLowerCase();
  
  let inputType = 'action';
  if (input.includes('"') || input.includes('say') || input.includes('tell') || input.includes('ask')) {
    inputType = 'dialogue';
  } else if (lowercaseInput.includes('think') || lowercaseInput.includes('feel') || lowercaseInput.includes('remember')) {
    inputType = 'internal';
  } else if (lowercaseInput.includes('look') || lowercaseInput.includes('examine') || lowercaseInput.includes('observe')) {
    inputType = 'observation';
  }

  let confidence = 0.5;
  if (input.length > 50) confidence += 0.2;
  if (input.length > 100) confidence += 0.1;
  if (input.includes('because') || input.includes('since') || input.includes('so that')) confidence += 0.1;
  if (/[.!?]/.test(input)) confidence += 0.1;
  
  confidence = Math.min(1, confidence);

  return {
    type: inputType,
    confidence: confidence,
    originalInput: input,
    length: input.length,
    hasMotivation: input.includes('because') || input.includes('since'),
    isDetailed: input.length > 80,
    emotionalWords: countEmotionalWords(input)
  };
}

/**
 * Count emotional words for psychological depth
 */
function countEmotionalWords(input) {
  const emotionalWords = [
    'feel', 'emotion', 'heart', 'soul', 'afraid', 'angry', 'sad', 'happy', 'excited',
    'worried', 'hopeful', 'nervous', 'confident', 'anxious', 'grateful', 'frustrated',
    'love', 'hate', 'trust', 'doubt', 'fear', 'hope', 'despair', 'joy', 'sorrow'
  ];
  
  const lowercaseInput = input.toLowerCase();
  return emotionalWords.filter(word => lowercaseInput.includes(word)).length;
}

/**
 * Generate character emotion data
 */
export function generateCharacterEmotionData(characterPack, scene, inputData) {
  const emotions = ['curious', 'determined', 'thoughtful'];
  const intensity = Math.random() * 50 + 25;
  
  return {
    emotions: emotions,
    intensity: intensity,
    primaryEmotion: emotions[0],
    confidence: 0.8
  };
}

/**
 * Test OpenAI connection
 */
export async function testOpenAIConnection() {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Test connection. Respond with "Connected!"' }],
      max_tokens: 10
    });
    return { success: true, message: response.choices[0].message.content };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Test suggestions format
 */
export async function testSuggestionsFormat() {
  try {
    const testCharacter = {
      name: 'Test Character',
      traits: 'curious, brave',
    };
    const testScene = {
      narration: 'You find yourself in a mysterious room.'
    };
    
    const suggestions = await generateChoiceSuggestions(testCharacter, testScene);
    return { success: true, suggestions };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Create fallback scene when AI generation fails
 */
function createFallbackScene(characterPack, playerAction, sceneNumber) {
  return {
    title: `Chapter ${sceneNumber}: Continuing the Journey`,
    narration: `As ${characterPack.name}, you ${playerAction.toLowerCase()}. The story continues to unfold around you, shaped by your choices and the world you inhabit. Every decision carries weight in this narrative journey.`,
    character_thoughts: "I must stay true to who I am while navigating this path.",
    scene_atmosphere: "The atmosphere is charged with possibility and consequence.",
    next_prompt: "What do you do next?"
  };
}

// Legacy compatibility exports
export const generateInitialScene = generateNextSceneWithIntelligence;
export const generateNextScene = generateNextSceneWithIntelligence;