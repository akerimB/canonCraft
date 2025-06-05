// Phase 2 Integration: Import new core intelligence systems
import { storyMemory, MEMORY_TYPES, IMPORTANCE_LEVELS } from './storyMemory';
import { storyPlanning, STORY_PHASES, PLANNING_CONFIDENCE } from './storyPlanning';
import { personaScoring, PERSONA_CATEGORIES, SCORING_LEVELS } from './personaScoring';
// Import database memory system instead of simple memory
import { databaseMemory, createMemoryEvent } from './databaseMemorySystem';

// Import OpenAI
import OpenAI from 'openai';

// Import config for secure API key handling
import { OPENAI_CONFIG } from '../config';

// OpenAI Configuration - Enhanced with better defaults
const OPENAI_API_KEY = OPENAI_CONFIG.API_KEY;
const OPENAI_MODEL = OPENAI_CONFIG.MODEL || 'gpt-4o-mini';

// Validate API key configuration
const isOpenAIConfigured = OPENAI_API_KEY && OPENAI_API_KEY !== 'your_openai_api_key_here' && OPENAI_API_KEY.startsWith('sk-');

console.log('🔧 AI Service Configuration:', {
  hasApiKey: !!OPENAI_API_KEY,
  isConfigured: isOpenAIConfigured,
  model: OPENAI_MODEL,
  keyPreview: OPENAI_API_KEY ? OPENAI_API_KEY.substring(0, 7) + '...' : 'Not set'
});

if (!isOpenAIConfigured) {
  console.warn('⚠️ OpenAI API key not configured. Using fallback responses.');
  console.warn('📋 To enable AI features:');
  console.warn('1. Get an API key from https://platform.openai.com/api-keys');
  console.warn('2. Edit config.js and replace "your_openai_api_key_here" with your actual key');
  console.warn('3. Make sure your key starts with "sk-"');
}

// Default parameters for consistent AI responses
const DEFAULT_AI_PARAMS = {
  temperature: 0.7,
  max_tokens: 2048,
  top_p: 0.95,
  frequency_penalty: 0.1, // Slightly reduce repetitive content
  presence_penalty: 0.1   // Encourage topic diversity
};

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Required for React Native/Expo
});

// ===== NEW: ENHANCED PLAYER INPUT PROCESSING =====

/**
 * Player input limits and validation
 */
export const PLAYER_INPUT_LIMITS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 500,
  RECOMMENDED_LENGTH: 50,
  WARNING_LENGTH: 300
};

/**
 * Input types for better AI understanding
 */
export const INPUT_TYPES = {
  NARRATION: 'narration',     // Player describing action/thought
  DIALOGUE: 'dialogue',       // Character speaking directly
  OTHER_CHARACTER: 'other_character', // Other character speaking/acting
  MIXED: 'mixed'              // Combination of above
};

/**
 * Enhanced prompt parsing to understand player input intent
 */
export function parsePlayerInput(input) {
  console.log('🔍 Parsing player input:', { inputLength: input.length, preview: input.substring(0, 50) + '...' });
  
  // Validate input length
  const validation = validateInputLength(input);
  if (!validation.isValid) {
    return {
      isValid: false,
      error: validation.error,
      suggestion: validation.suggestion
    };
  }

  // Clean and analyze input
  const cleanInput = input.trim();
  const inputAnalysis = analyzeInputType(cleanInput);
  
  // Extract different components
  const components = extractInputComponents(cleanInput, inputAnalysis.type);
  
  // Generate structured prompt data
  const promptData = {
    originalInput: cleanInput,
    inputType: inputAnalysis.type,
    confidence: inputAnalysis.confidence,
    components: components,
    characterLimit: {
      current: cleanInput.length,
      max: PLAYER_INPUT_LIMITS.MAX_LENGTH,
      recommended: PLAYER_INPUT_LIMITS.RECOMMENDED_LENGTH,
      isWithinRecommended: cleanInput.length <= PLAYER_INPUT_LIMITS.RECOMMENDED_LENGTH
    },
    suggestions: generateInputSuggestions(cleanInput, inputAnalysis)
  };

  console.log('✅ Input parsed successfully:', {
    type: promptData.inputType,
    confidence: promptData.confidence,
    componentCount: Object.keys(promptData.components).length,
    withinLimit: promptData.characterLimit.isWithinRecommended
  });

  return {
    isValid: true,
    promptData: promptData
  };
}

/**
 * Validate input length and provide helpful feedback
 */
function validateInputLength(input) {
  const length = input.trim().length;
  
  if (length < PLAYER_INPUT_LIMITS.MIN_LENGTH) {
    return {
      isValid: false,
      error: 'Input too short',
      suggestion: `Please write at least ${PLAYER_INPUT_LIMITS.MIN_LENGTH} characters to describe your action or dialogue.`
    };
  }
  
  if (length > PLAYER_INPUT_LIMITS.MAX_LENGTH) {
    return {
      isValid: false,
      error: 'Input too long',
      suggestion: `Please keep your input under ${PLAYER_INPUT_LIMITS.MAX_LENGTH} characters. Consider breaking complex actions into multiple turns.`
    };
  }
  
  return {
    isValid: true,
    length: length,
    withinRecommended: length <= PLAYER_INPUT_LIMITS.RECOMMENDED_LENGTH,
    warning: length > PLAYER_INPUT_LIMITS.WARNING_LENGTH ? 
      `Consider shortening your input for better AI understanding (${length}/${PLAYER_INPUT_LIMITS.MAX_LENGTH} characters used)` : null
  };
}

/**
 * Analyze input type based on linguistic patterns
 */
function analyzeInputType(input) {
  const lowerInput = input.toLowerCase();
  let scores = {
    [INPUT_TYPES.DIALOGUE]: 0,
    [INPUT_TYPES.NARRATION]: 0,
    [INPUT_TYPES.OTHER_CHARACTER]: 0,
    [INPUT_TYPES.MIXED]: 0
  };

  // Dialogue indicators
  if (input.includes('"') || input.includes("'")) scores[INPUT_TYPES.DIALOGUE] += 30;
  if (lowerInput.includes('i say') || lowerInput.includes('i tell') || lowerInput.includes('i reply')) scores[INPUT_TYPES.DIALOGUE] += 25;
  if (lowerInput.includes('i speak') || lowerInput.includes('i ask') || lowerInput.includes('i whisper')) scores[INPUT_TYPES.DIALOGUE] += 20;
  
  // Narration indicators  
  if (lowerInput.includes('i walk') || lowerInput.includes('i move') || lowerInput.includes('i go')) scores[INPUT_TYPES.NARRATION] += 20;
  if (lowerInput.includes('i examine') || lowerInput.includes('i look') || lowerInput.includes('i search')) scores[INPUT_TYPES.NARRATION] += 20;
  if (lowerInput.includes('i think') || lowerInput.includes('i consider') || lowerInput.includes('i ponder')) scores[INPUT_TYPES.NARRATION] += 25;
  if (lowerInput.includes('i decide') || lowerInput.includes('i attempt') || lowerInput.includes('i try')) scores[INPUT_TYPES.NARRATION] += 20;

  // Other character indicators
  if (lowerInput.includes('watson says') || lowerInput.includes('holmes replies')) scores[INPUT_TYPES.OTHER_CHARACTER] += 25;
  if (lowerInput.includes('they') || lowerInput.includes('he says') || lowerInput.includes('she responds')) scores[INPUT_TYPES.OTHER_CHARACTER] += 15;

  // Mixed indicators
  const hasMultipleTypes = (scores[INPUT_TYPES.DIALOGUE] > 0 ? 1 : 0) + 
                          (scores[INPUT_TYPES.NARRATION] > 0 ? 1 : 0) + 
                          (scores[INPUT_TYPES.OTHER_CHARACTER] > 0 ? 1 : 0);
  if (hasMultipleTypes >= 2) scores[INPUT_TYPES.MIXED] += 20;

  // Default to narration if unclear
  if (Math.max(...Object.values(scores)) < 15) {
    scores[INPUT_TYPES.NARRATION] = 50;
  }

  const topType = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  const confidence = Math.min(100, Math.max(20, scores[topType]));

  return {
    type: topType,
    confidence: confidence,
    scores: scores
  };
}

/**
 * Extract different components from input based on type
 */
function extractInputComponents(input, inputType) {
  const components = {
    mainAction: '',
    dialogue: '',
    narration: '',
    otherCharacters: [],
    emotions: [],
    objects: []
  };

  switch (inputType) {
    case INPUT_TYPES.DIALOGUE:
      components.dialogue = extractDialogue(input);
      components.mainAction = input;
      break;
    
    case INPUT_TYPES.NARRATION:
      components.narration = input;
      components.mainAction = input;
      components.emotions = extractEmotions(input);
      components.objects = extractObjects(input);
      break;
    
    case INPUT_TYPES.OTHER_CHARACTER:
      components.otherCharacters = extractOtherCharacters(input);
      components.mainAction = input;
      break;
    
    case INPUT_TYPES.MIXED:
      components.dialogue = extractDialogue(input);
      components.narration = extractNarration(input);
      components.otherCharacters = extractOtherCharacters(input);
      components.mainAction = input;
      break;
    
    default:
      components.mainAction = input;
  }

  return components;
}

/**
 * Helper functions for component extraction
 */
function extractDialogue(input) {
  const dialogueMatches = input.match(/["']([^"']+)["']/g);
  return dialogueMatches ? dialogueMatches.join(' ') : '';
}

function extractNarration(input) {
  // Remove quoted dialogue and return remaining text
  return input.replace(/["']([^"']+)["']/g, '').trim();
}

function extractOtherCharacters(input) {
  const characters = [];
  const characterPattern = /(?:watson|holmes|elizabeth|darcy|dracula|renfield|alice|hamlet|jane|inspector|lady|captain|doctor|mr\.|mrs\.|miss)\s+\w+/gi;
  const matches = input.match(characterPattern);
  if (matches) {
    characters.push(...matches.map(m => m.trim()));
  }
  return characters;
}

function extractEmotions(input) {
  const emotions = [];
  const emotionWords = ['angry', 'sad', 'happy', 'afraid', 'surprised', 'disgusted', 'contempt', 'excitement', 'relief', 'anxiety'];
  emotionWords.forEach(emotion => {
    if (input.toLowerCase().includes(emotion)) {
      emotions.push(emotion);
    }
  });
  return emotions;
}

function extractObjects(input) {
  const objects = [];
  const objectPattern = /\b(?:letter|book|weapon|key|door|window|table|chair|candle|lamp|map|document|photograph|ring|necklace|sword|gun|knife|bottle|glass|cup|paper|pen|ink|watch|clock|mirror|painting|statue|chest|box|safe|vault|grave|tomb|carriage|horse|ship|boat|train|bridge|castle|manor|house|building|church|cemetery|garden|forest|street|road|path|river|lake|ocean|mountain|hill|valley)\b/gi;
  const matches = input.match(objectPattern);
  if (matches) {
    objects.push(...[...new Set(matches.map(m => m.toLowerCase()))]);
  }
  return objects;
}

/**
 * Generate suggestions to improve input quality
 */
function generateInputSuggestions(input, analysis) {
  const suggestions = [];
  
  if (analysis.confidence < 40) {
    suggestions.push("Consider being more specific about what you want to do");
  }
  
  if (input.length < PLAYER_INPUT_LIMITS.RECOMMENDED_LENGTH) {
    suggestions.push("Add more detail to help the AI understand your intent");
  }
  
  if (analysis.type === INPUT_TYPES.NARRATION && !input.toLowerCase().includes('i ')) {
    suggestions.push("Try starting with 'I...' to make your action clearer");
  }
  
  if (analysis.type === INPUT_TYPES.DIALOGUE && !input.includes('"') && !input.includes("'")) {
    suggestions.push("Use quotes around dialogue: \"Hello there\"");
  }
  
  return suggestions;
}

// Enhanced conversation tracking
let conversationHistory = {
  scenes: [],
  messages: [],
  sessionId: null,
  startTime: null
};

// ===== ENHANCED IMAGE GENERATION WITH OPENAI DALL-E =====

/**
 * Generate scene image using OpenAI DALL-E instead of Unsplash
 */
export async function generateSceneImage(characterPack, sceneData) {
  try {
    // Add null safety check
    if (!sceneData || !sceneData.narration) {
      console.warn('Scene data or narration is missing for image generation');
      return null;
    }

    console.log('🎨 Generating scene image with fallback (DALL-E disabled)...');
    
    // DISABLED: OpenAI DALL-E to save costs
    // const prompt = generateEnhancedImagePrompt(characterPack, sceneData);
    // console.log('🖼️ Image prompt:', prompt);

    // Skip DALL-E and go directly to thematic fallback
    console.log('⚠️ Using thematic fallback images instead of DALL-E');
    
    // Fallback to thematic search terms for Unsplash
    const searchTerms = generateThematicSearchTerms(characterPack, sceneData);
    const fallbackUrl = `https://source.unsplash.com/400x300/?${encodeURIComponent(searchTerms)}&${Date.now()}`;
    
    console.log('✅ Fallback image generated:', searchTerms);
    return fallbackUrl;
    
  } catch (error) {
    console.error('❌ Image generation failed completely:', error);
    return null;
  }
}

/**
 * Generate enhanced image prompt for DALL-E
 */
function generateEnhancedImagePrompt(characterPack, sceneData) {
  const character = characterPack.name;
  const setting = characterPack.setting || 'Unknown Setting';
  const narration = sceneData.narration.toLowerCase();
  
  // Base art style based on character/period
  let artStyle = getArtStyleForCharacter(characterPack.id);
  
  // Extract key visual elements from narration
  const visualElements = extractVisualElements(narration);
  
  // Extract mood and atmosphere
  const mood = extractMoodFromNarration(narration);
  
  // Build comprehensive prompt
  const prompt = `${artStyle} showing ${character} ${visualElements.action} in ${visualElements.location}. ${mood.atmosphere}. ${visualElements.objects.join(', ')}. ${mood.lighting}. High quality literary illustration, detailed, atmospheric, ${mood.style}`;
  
  // Ensure prompt isn't too long for DALL-E
  return prompt.length > 400 ? prompt.substring(0, 397) + '...' : prompt;
}

/**
 * Get appropriate art style for character
 */
function getArtStyleForCharacter(characterId) {
  const styles = {
    'sherlock_holmes': 'Victorian London illustration, detective noir style',
    'dr_watson': 'Victorian medical gentleman illustration, warm professional style',
    'inspector_lestrade': 'Victorian police procedural illustration, official style',
    'dracula': 'Gothic horror illustration, dark romantic style',
    'renfield': 'Victorian asylum illustration, psychological horror style',
    'van_helsing': 'Victorian scholar illustration, religious gothic style',
    'elizabeth_bennet': 'Regency era illustration, elegant social style',
    'mr_darcy': 'Regency aristocratic illustration, grand estate style',
    'jane_bennet': 'Regency domestic illustration, gentle feminine style',
    'hamlet': 'Medieval Danish illustration, royal tragedy style',
    'jane_eyre': 'Victorian Gothic illustration, brooding manor style',
    'captain_ahab': 'Maritime adventure illustration, nautical epic style',
    'dr_jekyll': 'Victorian scientific illustration, dual nature style',
    'odysseus': 'Ancient Greek illustration, heroic adventure style',
    'lady_macbeth': 'Medieval Scottish illustration, royal drama style'
  };
  
  return styles[characterId] || 'Literary period illustration, dramatic style';
}

/**
 * Extract visual elements from narration
 */
function extractVisualElements(narration) {
  const elements = {
    action: 'standing thoughtfully',
    location: 'an elegant room',
    objects: [],
    characters: []
  };
  
  // Actions
  if (narration.includes('walk') || narration.includes('stroll')) elements.action = 'walking carefully';
  if (narration.includes('examine') || narration.includes('study')) elements.action = 'examining something intently';
  if (narration.includes('speak') || narration.includes('say')) elements.action = 'speaking earnestly';
  if (narration.includes('fight') || narration.includes('attack')) elements.action = 'in dramatic confrontation';
  if (narration.includes('read') || narration.includes('letter')) elements.action = 'reading a document';
  
  // Locations
  if (narration.includes('london') || narration.includes('street')) elements.location = 'a Victorian London street';
  if (narration.includes('castle')) elements.location = 'a grand medieval castle';
  if (narration.includes('manor') || narration.includes('estate')) elements.location = 'an elegant manor house';
  if (narration.includes('study') || narration.includes('library')) elements.location = 'a scholarly study';
  if (narration.includes('ballroom') || narration.includes('dance')) elements.location = 'an opulent ballroom';
  if (narration.includes('garden') || narration.includes('countryside')) elements.location = 'beautiful countryside gardens';
  if (narration.includes('ship') || narration.includes('ocean')) elements.location = 'aboard a sailing ship';
  if (narration.includes('laboratory')) elements.location = 'a Victorian laboratory';
  
  // Objects
  if (narration.includes('fire') || narration.includes('fireplace')) elements.objects.push('flickering fireplace');
  if (narration.includes('book') || narration.includes('tome')) elements.objects.push('ancient books');
  if (narration.includes('candle')) elements.objects.push('candlelight');
  if (narration.includes('window')) elements.objects.push('tall windows');
  if (narration.includes('portrait') || narration.includes('painting')) elements.objects.push('elegant portraits');
  if (narration.includes('furniture')) elements.objects.push('period furniture');
  
  return elements;
}

/**
 * Extract mood and atmosphere from narration
 */
function extractMoodFromNarration(narration) {
  const mood = {
    atmosphere: 'mysterious and atmospheric',
    lighting: 'dramatic lighting with shadows',
    style: 'cinematic composition'
  };
  
  // Atmosphere
  if (narration.includes('dark') || narration.includes('shadow')) {
    mood.atmosphere = 'dark and foreboding atmosphere';
    mood.lighting = 'dramatic chiaroscuro lighting';
  }
  if (narration.includes('bright') || narration.includes('cheerful')) {
    mood.atmosphere = 'bright and welcoming atmosphere';
    mood.lighting = 'warm natural lighting';
  }
  if (narration.includes('romantic') || narration.includes('love')) {
    mood.atmosphere = 'romantic and intimate atmosphere';
    mood.lighting = 'soft romantic lighting';
  }
  if (narration.includes('tense') || narration.includes('danger')) {
    mood.atmosphere = 'tense and suspenseful atmosphere';
    mood.lighting = 'dramatic tension lighting';
  }
  if (narration.includes('peaceful') || narration.includes('calm')) {
    mood.atmosphere = 'peaceful and serene atmosphere';
    mood.lighting = 'gentle diffused lighting';
  }
  
  return mood;
}

/**
 * Generate thematic search terms for Unsplash fallback
 */
function generateThematicSearchTerms(characterPack, sceneData) {
  const narration = sceneData.narration.toLowerCase();
  
  if (characterPack.id === 'sherlock_holmes') {
    if (narration.includes('fog') || narration.includes('london')) {
      return 'victorian london fog street detective';
    } else if (narration.includes('study') || narration.includes('room')) {
      return 'victorian study room fireplace books';
    } else {
      return 'victorian detective mystery';
    }
  } else if (characterPack.id === 'dracula') {
    if (narration.includes('castle')) {
      return 'gothic castle dark moonlight';
    } else if (narration.includes('night') || narration.includes('moon')) {
      return 'gothic mansion moonlight dark';
    } else {
      return 'gothic dark atmospheric';
    }
  } else if (characterPack.id === 'elizabeth_bennet') {
    if (narration.includes('estate') || narration.includes('house')) {
      return 'regency manor house countryside';
    } else if (narration.includes('room') || narration.includes('parlor')) {
      return 'regency interior room elegant';
    } else {
      return 'regency england countryside manor';
    }
  }
  
  // Default fallback
  return `${characterPack.setting || 'classical literature'} ${characterPack.name || 'character'} period drama`;
}

/**
 * Character emotion detection and animation guidance
 */
export function generateCharacterEmotionData(characterPack, sceneData, playerInput) {
  console.log('😊 Analyzing character emotions for animation...');
  
  const emotions = {
    emotions: ['neutral'], // Array of emotions for the UI
    primary: 'neutral',
    intensity: 50,
    secondary: null,
    facialExpression: 'thoughtful',
    bodyLanguage: 'composed',
    animationSuggestions: []
  };
  
  const sceneText = sceneData?.narration?.toLowerCase() || '';
  
  // Handle different types of playerInput (string or parsed object)
  let inputText = '';
  if (typeof playerInput === 'string') {
    inputText = playerInput.toLowerCase();
  } else if (playerInput && typeof playerInput === 'object') {
    // If it's a parsed input object, extract the original input
    inputText = (playerInput.originalInput || playerInput.inputText || playerInput.text || '').toLowerCase();
  }
  
  console.log('🔍 Analyzing emotions from:', {
    sceneLength: sceneText.length,
    inputLength: inputText.length,
    playerInputType: typeof playerInput
  });
  
  // Analyze emotional content
  if (sceneText.includes('anger') || sceneText.includes('furious') || inputText.includes('angry')) {
    emotions.emotions = ['angry'];
    emotions.primary = 'anger';
    emotions.intensity = 80;
    emotions.facialExpression = 'frowning';
    emotions.bodyLanguage = 'tense';
    emotions.animationSuggestions.push('eyebrow_furrow', 'jaw_clench');
  } else if (sceneText.includes('joy') || sceneText.includes('happy') || sceneText.includes('delight')) {
    emotions.emotions = ['happy'];
    emotions.primary = 'joy';
    emotions.intensity = 70;
    emotions.facialExpression = 'smiling';
    emotions.bodyLanguage = 'relaxed';
    emotions.animationSuggestions.push('smile', 'eye_crinkle');
  } else if (sceneText.includes('fear') || sceneText.includes('afraid') || sceneText.includes('terrified')) {
    emotions.emotions = ['fearful'];
    emotions.primary = 'fear';
    emotions.intensity = 85;
    emotions.facialExpression = 'worried';
    emotions.bodyLanguage = 'defensive';
    emotions.animationSuggestions.push('eye_widen', 'slight_recoil');
  } else if (sceneText.includes('surprise') || sceneText.includes('shocked') || sceneText.includes('amazed')) {
    emotions.emotions = ['surprised'];
    emotions.primary = 'surprise';
    emotions.intensity = 75;
    emotions.facialExpression = 'surprised';
    emotions.bodyLanguage = 'alert';
    emotions.animationSuggestions.push('eyebrow_raise', 'slight_lean_forward');
  } else if (sceneText.includes('love') || sceneText.includes('affection') || sceneText.includes('tender')) {
    emotions.emotions = ['happy'];
    emotions.primary = 'love';
    emotions.intensity = 65;
    emotions.facialExpression = 'gentle';
    emotions.bodyLanguage = 'warm';
    emotions.animationSuggestions.push('soft_smile', 'gentle_gaze');
  } else if (sceneText.includes('sad') || sceneText.includes('melancholy') || sceneText.includes('sorrowful')) {
    emotions.emotions = ['sad'];
    emotions.primary = 'sadness';
    emotions.intensity = 70;
    emotions.facialExpression = 'melancholic';
    emotions.bodyLanguage = 'subdued';
    emotions.animationSuggestions.push('slight_frown', 'lowered_gaze');
  }
  
  // Character-specific emotional patterns
  if (characterPack.id === 'sherlock_holmes') {
    emotions.emotions.push('analytical');
    emotions.facialExpression = emotions.primary === 'neutral' ? 'analytical' : emotions.facialExpression;
    emotions.bodyLanguage = 'precise';
    if (emotions.primary === 'neutral') {
      emotions.animationSuggestions.push('temple_touch', 'keen_observation');
    }
  } else if (characterPack.id === 'dracula') {
    emotions.emotions.push('calculating');
    emotions.facialExpression = emotions.primary === 'neutral' ? 'calculating' : emotions.facialExpression;
    emotions.bodyLanguage = 'commanding';
    if (emotions.primary === 'neutral') {
      emotions.animationSuggestions.push('slight_smirk', 'predatory_gaze');
    }
  } else if (characterPack.id === 'elizabeth_bennet') {
    emotions.emotions.push('intelligent');
    emotions.facialExpression = emotions.primary === 'neutral' ? 'intelligent' : emotions.facialExpression;
    emotions.bodyLanguage = 'graceful';
    if (emotions.primary === 'neutral') {
      emotions.animationSuggestions.push('knowing_smile', 'elegant_posture');
    }
  }
  
  // Ensure we have at least one emotion for the UI
  if (emotions.emotions.length === 0) {
    emotions.emotions = ['thoughtful'];
  }
  
  console.log('✅ Character emotion analysis complete:', {
    primary: emotions.primary,
    emotions: emotions.emotions,
    intensity: emotions.intensity,
    expression: emotions.facialExpression,
    animations: emotions.animationSuggestions.length
  });
  
  return emotions;
}

async function generateEnhancedScene(characterPack, playerAction, sceneData, storyContext, planningData, sceneNumber, freedomLevel) {
  console.log('🎨 Generating enhanced scene with context:', {
    characterName: characterPack?.name,
    playerAction: playerAction?.substring(0, 50) + '...',
    sceneNumber,
    freedomLevel,
    hasSceneData: !!sceneData,
    hasStoryContext: !!storyContext,
    hasPlanningData: !!planningData,
    sessionId: conversationHistory.sessionId
  });
  
  // Parse player input with enhanced understanding
  console.log('🔍 Parsing player input for better understanding...');
  const inputParsing = parsePlayerInput(playerAction);
  
  if (!inputParsing.isValid) {
    console.warn('⚠️ Invalid player input:', inputParsing.error);
    // Return a scene asking for better input
    return {
      scene_id: `scene_${sceneNumber}`,
      title: "Please Clarify Your Action",
      narration: `I need to understand your intention better. ${inputParsing.suggestion}\n\nPlease describe what you'd like to do more clearly.`,
      choices: [
        {
          choice_id: "clarify_action",
          text: "Try to explain your action more clearly",
          persona_impact: 0,
          consequences: "The story will wait for clearer direction"
        },
        {
          choice_id: "get_help",
          text: "Ask for AI suggestions on what to do",
          persona_impact: 0,
          consequences: "Get helpful suggestions for character actions"
        },
        {
          choice_id: "simple_action",
          text: "Take a simple, safe action instead",
          persona_impact: 0,
          consequences: "Proceed with a basic character action"
        }
      ]
    };
  }
  
  const promptData = inputParsing.promptData;
  console.log('✅ Input parsing successful:', {
    type: promptData.inputType,
    confidence: promptData.confidence,
    withinRecommended: promptData.characterLimit.isWithinRecommended
  });
  
  const memoryContext = buildMemoryContext(storyContext);
  const phaseGuidance = getPhaseGuidance(planningData?.currentPhase);
  const freedomGuidance = getFreedomGuidance(freedomLevel);
  
  // Build enhanced prompt based on input type
  const inputTypeGuidance = getInputTypeGuidance(promptData);
  
  // Enhanced prompt with better structure and clearer instructions
  const prompt = `CHARACTER PROFILE:
Name: ${characterPack.name}
Setting: ${characterPack.setting}
Personality: ${characterPack.traits?.join(', ')}
Background: ${characterPack.background}
Speech Style: ${characterPack.speech_style}

PREVIOUS SCENE CONTEXT:
Title: ${sceneData?.title || 'Story Beginning'}
Previous Narration: ${sceneData?.narration || 'This is the start of the story'}

PLAYER INPUT ANALYSIS:
Original Input: "${playerAction}"
Input Type: ${promptData.inputType}
Input Confidence: ${promptData.confidence}%
Character Count: ${promptData.characterLimit.current}/${promptData.characterLimit.max}
${inputTypeGuidance}

SCENE NUMBER: ${sceneNumber}
FREEDOM LEVEL: ${freedomLevel}%

${freedomGuidance}

STORY MEMORY CONTEXT:
${memoryContext}

STORY PLANNING GUIDANCE:
${phaseGuidance}

ENHANCED REQUIREMENTS:
1. 🎯 DIRECT RESPONSE: Scene MUST directly address player's ${promptData.inputType}: "${playerAction}"
2. 💬 DIALOGUE FOCUS: 80% character dialogue, 20% action/description maximum
3. 📝 CONCISE LENGTH: 150-200 words total
4. 🎭 CHARACTER AUTHENTICITY: Stay true to ${characterPack.name}'s personality
5. 📖 STORY PROGRESSION: Advance the plot meaningfully
6. ✨ UNIQUE CONTENT: No repetitive scenes or generic responses
7. 🎨 PROPER FORMATTING: Use \\n\\n for paragraphs, \\n between dialogue lines

FORBIDDEN ELEMENTS:
- Generic atmospheric descriptions ("flickering lights", "shadows dancing")
- Repetitive scene structures from previous responses
- Ignoring the player's specific choice
- Overly long narration without character interaction

RESPONSE FORMAT (JSON ONLY):
{
  "scene_id": "scene_${sceneNumber}",
  "title": "Specific Scene Title",
  "narration": "DIALOGUE-HEAVY scene responding to ${promptData.inputType}",
  "choices": [
    {
      "choice_id": "choice_${sceneNumber}_1",
      "text": "Character-appropriate response option",
      "persona_impact": number(-20 to +20),
      "consequences": "Clear outcome description"
    },
    {
      "choice_id": "choice_${sceneNumber}_2", 
      "text": "Alternative character response",
      "persona_impact": number(-20 to +20),
      "consequences": "Different outcome description"
    },
    {
      "choice_id": "choice_${sceneNumber}_3",
      "text": "Creative third option",
      "persona_impact": number(-20 to +20),
      "consequences": "Unique path forward"
    }
  ]
}

PERSONA IMPACT GUIDELINES:
- Positive values (+5 to +20): Actions that align perfectly with character personality
- Small positive (+1 to +4): Actions that somewhat match the character
- Zero (0): Neutral actions
- Small negative (-1 to -4): Actions slightly out of character 
- Negative values (-5 to -20): Actions that go against character personality
Make choices have DIFFERENT persona impacts to show character alignment!

`;

  console.log('📤 Sending enhanced prompt to OpenAI...', {
    promptLength: prompt.length,
    sceneNumber,
    characterName: characterPack.name,
    inputType: promptData.inputType
  });

  // Record the prompt in conversation history
  conversationHistory.messages.push({
    role: 'user',
    content: prompt,
    timestamp: new Date().toISOString(),
    sceneNumber: sceneNumber,
    playerAction: playerAction,
    inputType: promptData.inputType,
    inputConfidence: promptData.confidence
  });

  try {
    const response = await callOpenAIAPI(prompt);
    const scene = parseSceneResponse(response);
    
    // Record successful generation in conversation history
    conversationHistory.scenes.push({
      scene_id: scene.scene_id,
      title: scene.title,
      summary: scene.narration.substring(0, 150) + '...',
      timestamp: new Date().toISOString(),
      sceneNumber: sceneNumber,
      playerAction: playerAction,
      choicesCount: scene.choices?.length || 0,
      inputType: promptData.inputType,
      inputConfidence: promptData.confidence
    });

    // Keep conversation history manageable
    if (conversationHistory.messages.length > 15) {
      conversationHistory.messages = conversationHistory.messages.slice(-15);
    }
    if (conversationHistory.scenes.length > 10) {
      conversationHistory.scenes = conversationHistory.scenes.slice(-10);
    }

    console.log('✅ Enhanced scene generated successfully:', {
      sceneId: scene.scene_id,
      title: scene.title,
      choicesCount: scene.choices?.length || 0,
      narrationLength: scene.narration?.length || 0,
      inputTypeHandled: promptData.inputType
    });

    return scene;
  } catch (error) {
    console.error('❌ Enhanced scene generation failed:', {
      error: error.message,
      characterName: characterPack?.name,
      sceneNumber,
      playerAction: playerAction?.substring(0, 50)
    });
    
    // NO MORE FALLBACKS - Let the error bubble up properly
    throw new Error(`Scene generation failed: ${error.message}`);
  }
}

/**
 * Get guidance for different input types
 */
function getInputTypeGuidance(promptData) {
  switch (promptData.inputType) {
    case INPUT_TYPES.DIALOGUE:
      return `DIALOGUE INPUT DETECTED: Player wants the character to speak directly. 
Focus on:
- How other characters react to the dialogue
- The tone and delivery of the speech
- Consequences of what was said
- Follow-up dialogue from NPCs`;
      
    case INPUT_TYPES.NARRATION:
      return `NARRATION INPUT DETECTED: Player is describing an action or thought.
Focus on:
- The physical execution of the action
- Environmental reactions to the action
- Character thoughts during the action
- Immediate consequences and reactions`;
      
    case INPUT_TYPES.OTHER_CHARACTER:
      return `OTHER CHARACTER INPUT DETECTED: Player is directing other characters.
Focus on:
- How the main character reacts to this behavior
- The relationship dynamics at play
- Whether other characters comply or resist
- The social/political implications`;
      
    case INPUT_TYPES.MIXED:
      return `MIXED INPUT DETECTED: Player has provided complex multi-part input.
Focus on:
- Address each component (dialogue, action, etc.)
- Show the interconnection between different elements
- Create a rich, layered scene response
- Balance all aspects of the input`;
      
    default:
      return `GENERAL INPUT: Standard character action or decision.
Focus on:
- Direct response to the player's intent
- Character-appropriate execution
- Meaningful story progression
- Engaging dialogue and interaction`;
  }
}

// ===== STORY SESSION INITIALIZATION =====

/**
 * Initialize a story session with character and story context
 * This function sets up the initial context for AI story generation
 */
export async function initializeStorySession(characterPack) {
  console.log('🎬 Initializing story session for:', characterPack?.name || 'Unknown Character');
  
  try {
    // Validate character pack
    if (!characterPack || !characterPack.id) {
      throw new Error('Invalid character pack provided');
    }

    // Create session context
    const sessionContext = {
      sessionId: Date.now().toString(),
      characterId: characterPack.id,
      characterName: characterPack.name,
      storyTheme: characterPack.story_theme || 'Literary Adventure',
      createdAt: new Date().toISOString(),
      sceneCount: 0,
      conversationHistory: [],
      storyMemory: {
        key_events: [],
        character_relationships: {},
        story_arcs: [],
        world_state: {}
      }
    };

    // Initialize story memory systems if available
    if (typeof storyMemory !== 'undefined' && storyMemory.initializeSession) {
      await storyMemory.initializeSession(sessionContext);
    }

    // Initialize story planning if available
    if (typeof storyPlanning !== 'undefined' && storyPlanning.initializeSession) {
      await storyPlanning.initializeSession(sessionContext);
    }

    console.log('✅ Story session initialized successfully:', {
      sessionId: sessionContext.sessionId,
      character: characterPack.name,
      theme: sessionContext.storyTheme
    });

    return sessionContext;
  } catch (error) {
    console.error('❌ Failed to initialize story session:', error);
    throw new Error(`Story session initialization failed: ${error.message}`);
  }
}

// ===== ENHANCED SCENE GENERATION WITH INTELLIGENCE =====

/**
 * Generate next scene with Phase 2 intelligence systems integration
 * This replaces the simpler generateNextScene with enhanced memory, planning, and persona analysis
 */
export async function generateNextSceneWithIntelligence(
  characterPack,
  playerAction,
  currentScene = null,
  sceneNumber = 1,
  freedomLevel = 50
) {
  console.log('🧠 Generating enhanced scene with intelligence systems:', {
    character: characterPack?.name,
    sceneNumber,
    freedomLevel,
    hasCurrentScene: !!currentScene
  });

  try {
    // Validate inputs
    if (!characterPack || !characterPack.id) {
      throw new Error('Invalid character pack provided');
    }

    // Build story context from available systems
    let storyContext = {
      character: characterPack,
      sceneNumber,
      previousScene: currentScene,
      playerAction,
      freedomLevel
    };

    // Add memory context if system is available
    if (typeof storyMemory !== 'undefined') {
      try {
        const memoryContext = await storyMemory.getRelevantMemories(
          characterPack.id,
          playerAction,
          MEMORY_TYPES.SCENE_CONTEXT
        );
        storyContext.memories = memoryContext;
        console.log('📚 Added memory context:', memoryContext?.length || 0, 'memories');
      } catch (error) {
        console.warn('⚠️ Memory system unavailable:', error.message);
        storyContext.memories = [];
      }
    }

    // Add planning context if system is available  
    if (typeof storyPlanning !== 'undefined') {
      try {
        const planningData = await storyPlanning.generateScenePlan(
          characterPack,
          storyContext,
          STORY_PHASES.DEVELOPMENT
        );
        storyContext.planning = planningData;
        console.log('📋 Added planning context:', planningData?.confidence || 'unknown');
      } catch (error) {
        console.warn('⚠️ Planning system unavailable:', error.message);
        storyContext.planning = { confidence: PLANNING_CONFIDENCE.LOW };
      }
    }

    // Generate enhanced scene with all available intelligence
    const enhancedScene = await generateEnhancedScene(
      characterPack,
      playerAction,
      currentScene,
      storyContext,
      storyContext.planning,
      sceneNumber,
      freedomLevel
    );

    // Store scene in memory systems if available
    if (typeof storyMemory !== 'undefined' && enhancedScene) {
      try {
        await storyMemory.recordScene(
          characterPack.id,
          enhancedScene,
          playerAction,
          IMPORTANCE_LEVELS.MEDIUM
        );
        console.log('💾 Scene recorded in memory system');
      } catch (error) {
        console.warn('⚠️ Failed to record scene in memory:', error.message);
      }
    }

    // Update persona scoring if available
    if (typeof personaScoring !== 'undefined' && enhancedScene) {
      try {
        const personaUpdate = await personaScoring.analyzeSceneAlignment(
          characterPack,
          enhancedScene,
          playerAction
        );
        storyContext.personaScore = personaUpdate;
        console.log('🎭 Persona analysis completed:', personaUpdate?.score || 'unknown');
      } catch (error) {
        console.warn('⚠️ Persona scoring unavailable:', error.message);
      }
    }

    console.log('✅ Enhanced scene generated successfully:', {
      title: enhancedScene?.title,
      hasMemories: !!storyContext.memories?.length,
      hasPlanning: !!storyContext.planning,
      personaScore: storyContext.personaScore?.score
    });

    return enhancedScene;

  } catch (error) {
    console.error('❌ Failed to generate enhanced scene:', error);
    
    // Fallback to basic scene generation
    console.log('🔄 Falling back to basic scene generation...');
    try {
      return await generateEnhancedScene(
        characterPack,
        playerAction,
        currentScene,
        { character: characterPack, sceneNumber, freedomLevel },
        { confidence: 'LOW' },
        sceneNumber,
        freedomLevel
      );
    } catch (fallbackError) {
      console.error('❌ Fallback scene generation also failed:', fallbackError);
      throw new Error(`Scene generation failed: ${error.message}`);
    }
  }
}

// ===== INITIAL SCENE GENERATION =====

/**
 * Generate the initial scene for a character story
 * This is a wrapper around generateNextSceneWithIntelligence for the first scene
 */
export async function generateInitialScene(characterPack, freedomLevel = 50) {
  console.log('🎬 Generating initial scene for:', characterPack?.name);
  
  try {
    // Generate the first scene with "Begin the story" as the initial action
    const initialScene = await generateNextSceneWithIntelligence(
      characterPack,
      "Begin the story",
      null, // No previous scene
      1, // First scene
      freedomLevel
    );

    if (!initialScene) {
      throw new Error('No initial scene generated');
    }

    console.log('✅ Initial scene generated:', initialScene.title);
    return initialScene;
  } catch (error) {
    console.error('❌ Failed to generate initial scene:', error);
    throw new Error(`Initial scene generation failed: ${error.message}`);
  }
}

// ===== ENHANCED FALLBACK SCENE GENERATION =====

/**
 * Generate a fallback scene when primary generation fails
 * This ensures the game continues even when AI services fail
 */
function getEnhancedFallback(characterPack, playerAction, storyContext, planningData, sceneNumber) {
  console.log('🛡️ Generating enhanced fallback scene:', {
    character: characterPack?.name,
    sceneNumber,
    hasStoryContext: !!storyContext
  });

  // Create a contextual fallback based on character and action
  const character = characterPack?.name || 'Character';
  const setting = characterPack?.setting || 'unknown location';
  
  // Analyze player action for fallback response
  const actionLower = playerAction.toLowerCase();
  let fallbackNarration = '';
  let fallbackTitle = '';
  
  if (actionLower.includes('examine') || actionLower.includes('look')) {
    fallbackTitle = `${character} Observes Carefully`;
    fallbackNarration = `${character} takes a moment to carefully observe the surroundings. In this ${setting}, every detail could be significant. The character's keen senses pick up subtle clues that others might miss.\n\n"There's more here than meets the eye," ${character} muses thoughtfully, considering the next course of action.`;
  } else if (actionLower.includes('speak') || actionLower.includes('say') || actionLower.includes('talk')) {
    fallbackTitle = `${character} Speaks Thoughtfully`;
    fallbackNarration = `${character} chooses words carefully, understanding that in this ${setting}, every conversation matters. The character's voice carries the weight of experience and wisdom.\n\n"Let me think about this carefully," ${character} says, pausing to consider the implications of each word. "What we say here could change everything."`;
  } else if (actionLower.includes('move') || actionLower.includes('go') || actionLower.includes('walk')) {
    fallbackTitle = `${character} Moves Forward`;
    fallbackNarration = `${character} moves with purpose through the ${setting}. Each step is deliberate, showing the character's determination to face whatever challenges lie ahead.\n\n"Forward then," ${character} decides, "whatever awaits us, we'll meet it with courage." The path ahead remains uncertain, but the character's resolve is clear.`;
  } else if (actionLower.includes('think') || actionLower.includes('consider') || actionLower.includes('ponder')) {
    fallbackTitle = `${character} Reflects Deeply`;
    fallbackNarration = `In the quiet of this ${setting}, ${character} takes time for deep reflection. The weight of recent events settles in the character's mind, each detail examined with careful attention.\n\n"The pieces of this puzzle are starting to come together," ${character} thinks, "but I need to be certain before I act."`;
  } else {
    fallbackTitle = `${character} Prepares for Action`;
    fallbackNarration = `${character} stands ready in this ${setting}, prepared for whatever challenge comes next. The character's experience and wisdom guide every decision, no matter how difficult the path ahead may seem.\n\n"Every choice matters here," ${character} reflects, "and I must choose wisely." The moment of decision has arrived.`;
  }

  // Generate character-appropriate choices
  const fallbackChoices = [
    {
      choice_id: `fallback_${sceneNumber}_1`,
      text: "Take a careful, measured approach",
      persona_impact: 5,
      consequences: `${character} will proceed with caution and wisdom`
    },
    {
      choice_id: `fallback_${sceneNumber}_2`,
      text: "Act decisively based on instinct",
      persona_impact: 10,
      consequences: `${character} will trust their intuition and take bold action`
    },
    {
      choice_id: `fallback_${sceneNumber}_3`,
      text: "Seek more information before deciding",
      persona_impact: 0,
      consequences: `${character} will gather more details before making a choice`
    }
  ];

  const fallbackScene = {
    scene_id: `fallback_scene_${sceneNumber}`,
    title: fallbackTitle,
    narration: fallbackNarration,
    choices: fallbackChoices
  };

  console.log('✅ Enhanced fallback scene generated:', {
    title: fallbackScene.title,
    choicesCount: fallbackScene.choices.length,
    character: character
  });

  return fallbackScene;
}

// ===== HELPER FUNCTIONS =====

/**
 * Build memory context from story context
 */
function buildMemoryContext(storyContext) {
  if (!storyContext || !storyContext.memories) {
    return "No previous story memories available. This is a fresh start.";
  }
  
  const memories = storyContext.memories;
  if (memories.length === 0) {
    return "No previous story memories available. This is a fresh start.";
  }
  
  // Format memories for inclusion in prompt
  const memoryText = memories.map((memory, index) => {
    return `Memory ${index + 1}: ${memory.summary || memory.description || 'Unknown memory'}`;
  }).join('\n');
  
  return `Previous Story Context:\n${memoryText}`;
}

/**
 * Get phase guidance for story progression
 */
function getPhaseGuidance(currentPhase) {
  const phaseGuidelines = {
    'INTRODUCTION': 'Focus on character introduction and world building. Establish the setting and initial conflict.',
    'DEVELOPMENT': 'Develop the main conflict and character relationships. Build tension and complexity.',
    'CLIMAX': 'Approach the peak of tension. Make choices matter significantly. High stakes.',
    'RESOLUTION': 'Begin wrapping up storylines. Focus on consequences of previous actions.',
    'CONCLUSION': 'Provide satisfying closure. Resolve major conflicts and character arcs.'
  };
  
  return phaseGuidelines[currentPhase] || phaseGuidelines['DEVELOPMENT'];
}

/**
 * Get freedom level guidance for AI generation
 */
function getFreedomGuidance(freedomLevel) {
  if (freedomLevel <= 20) {
    return `VERY STRICT ADHERENCE: Stay extremely close to established character personality and historical accuracy. Minimal creative liberties.`;
  } else if (freedomLevel <= 40) {
    return `MODERATE ADHERENCE: Follow character traits closely but allow some creative interpretation within reasonable bounds.`;
  } else if (freedomLevel <= 60) {
    return `BALANCED APPROACH: Balance character authenticity with creative storytelling. Allow reasonable dramatic license.`;
  } else if (freedomLevel <= 80) {
    return `CREATIVE FREEDOM: Take creative liberties while maintaining core character essence. Focus on engaging story progression.`;
  } else {
    return `MAXIMUM CREATIVITY: Prioritize compelling narrative over strict character adherence. Take bold creative risks.`;
  }
}

/**
 * Call OpenAI API with proper error handling
 */
async function callOpenAIAPI(prompt) {
  console.log('📤 Calling OpenAI API...');
  
  // Check if OpenAI is properly configured
  if (!isOpenAIConfigured) {
    throw new Error('OpenAI API not configured properly. Please check your API key in config.js');
  }
  
  try {
    console.log('🔑 Using API key:', OPENAI_API_KEY.substring(0, 15) + '...');
    console.log('🤖 Using model:', OPENAI_MODEL);
    
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a creative writer specializing in interactive literary fiction. You MUST respond with ONLY valid JSON in the exact format requested. NEVER include markdown code blocks, explanations, or any text outside the JSON response. Start your response with { and end with }. Ensure all strings are properly quoted and escaped.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      ...DEFAULT_AI_PARAMS
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned empty response');
    }

    console.log('✅ OpenAI API call successful, response length:', content.length);
    console.log('📝 Response preview:', content.substring(0, 200) + '...');
    
    return content;
  } catch (error) {
    console.error('❌ OpenAI API call failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.status,
      type: error.type
    });
    
    // Provide specific error messages based on error type
    if (error.code === 'insufficient_quota') {
      throw new Error('OpenAI API quota exceeded. Please check your billing and usage limits.');
    } else if (error.code === 'invalid_api_key') {
      throw new Error('Invalid OpenAI API key. Please check your config.js file.');
    } else if (error.code === 'rate_limit_exceeded') {
      throw new Error('OpenAI API rate limit exceeded. Please wait a moment and try again.');
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network connection error. Please check your internet connection.');
    } else {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
}

/**
 * Parse OpenAI response into scene object
 */
function parseSceneResponse(response) {
  console.log('🔍 Parsing OpenAI response...');
  console.log('📄 Raw response length:', response.length);
  console.log('📄 Raw response preview:', response.substring(0, 300) + '...');
  
  try {
    // Step 1: Remove markdown code blocks
    let cleanResponse = response.replace(/```json\s*\n?/gi, '').replace(/```\s*\n?/g, '').trim();
    
    // Step 2: Remove any leading/trailing non-JSON text
    cleanResponse = cleanResponse.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
    
    // Step 3: Try to extract JSON object more aggressively
    let jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanResponse = jsonMatch[0];
      console.log('📄 Extracted JSON:', cleanResponse.substring(0, 200) + '...');
    } else {
      console.warn('⚠️ No JSON object found in response');
      // Try to find JSON even if brackets don't match perfectly
      const openBrace = cleanResponse.indexOf('{');
      const closeBrace = cleanResponse.lastIndexOf('}');
      if (openBrace !== -1 && closeBrace !== -1 && closeBrace > openBrace) {
        cleanResponse = cleanResponse.substring(openBrace, closeBrace + 1);
        console.log('📄 Extracted JSON (fallback):', cleanResponse.substring(0, 200) + '...');
      }
    }
    
    // Step 4: Clean up common JSON formatting issues
    cleanResponse = cleanResponse
      .replace(/\n\s*\n/g, '\n') // Remove extra newlines
      .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
      .trim();
    
    // Step 5: Parse the JSON
    const scene = JSON.parse(cleanResponse);
    
    // Validate required fields
    if (!scene.scene_id || !scene.title || !scene.narration) {
      console.error('❌ Missing required scene fields:', {
        hasSceneId: !!scene.scene_id,
        hasTitle: !!scene.title,
        hasNarration: !!scene.narration
      });
      throw new Error('Missing required scene fields');
    }
    
    // Ensure choices array exists
    if (!scene.choices || !Array.isArray(scene.choices)) {
      console.warn('⚠️ No choices array found, creating empty array');
      scene.choices = [];
    }
    
    // Validate and fix choice objects
    scene.choices = scene.choices.map((choice, index) => ({
      choice_id: choice.choice_id || `choice_${Date.now()}_${index}`,
      text: choice.text || 'Continue the story',
      persona_impact: parseInt(choice.persona_impact) || 0,
      consequences: choice.consequences || 'The story continues...'
    }));
    
    console.log('✅ Scene response parsed successfully:', {
      sceneId: scene.scene_id,
      title: scene.title,
      narrationLength: scene.narration.length,
      choicesCount: scene.choices.length
    });
    
    return scene;
  } catch (error) {
    console.error('❌ Failed to parse scene response:', error);
    console.error('❌ JSON Parse Error:', error.message);
    console.log('📄 Problematic response (first 500 chars):', response.substring(0, 500));
    
    // Try one more fallback - extract just the essential parts manually
    try {
      console.log('🔄 Attempting manual extraction fallback...');
      const fallbackScene = attemptManualExtraction(response);
      if (fallbackScene) {
        console.log('✅ Manual extraction successful');
        return fallbackScene;
      }
    } catch (manualError) {
      console.error('❌ Manual extraction also failed:', manualError.message);
    }
    
    // Return a more informative fallback scene
    return {
      scene_id: `parse_error_${Date.now()}`,
      title: 'Story Generation Error',
      narration: `I encountered a technical difficulty while generating your story. This might be due to an API issue or response formatting problem.\n\nError details: ${error.message}\n\nPlease try again, and if the problem persists, try adjusting your story freedom settings or input.`,
      choices: [
        {
          choice_id: `error_choice_1_${Date.now()}`,
          text: 'Try again with the same action',
          persona_impact: 0,
          consequences: 'Attempt to regenerate the scene with the same input'
        },
        {
          choice_id: `error_choice_2_${Date.now()}`,
          text: 'Try a different approach',
          persona_impact: 0,
          consequences: 'Modify your approach and try again'
        },
        {
          choice_id: `error_choice_3_${Date.now()}`,
          text: 'Return to main menu',
          persona_impact: 0,
          consequences: 'Go back to the character selection menu'
        }
      ]
    };
  }
}

/**
 * Attempt to manually extract scene data from malformed response
 */
function attemptManualExtraction(response) {
  const scene = {
    scene_id: `manual_${Date.now()}`,
    title: 'Generated Scene',
    narration: '',
    choices: []
  };
  
  // Try to extract title
  const titleMatch = response.match(/"title":\s*"([^"]+)"/i);
  if (titleMatch) {
    scene.title = titleMatch[1];
  }
  
  // Try to extract narration
  const narrationMatch = response.match(/"narration":\s*"([^"]+(?:\\.[^"]*)*?)"/i);
  if (narrationMatch) {
    scene.narration = narrationMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
  }
  
  // Try to extract choices
  const choicesMatch = response.match(/"choices":\s*\[([\s\S]*?)\]/i);
  if (choicesMatch) {
    try {
      // Simple choice extraction
      const choiceTexts = choicesMatch[1].match(/"text":\s*"([^"]+)"/gi);
      if (choiceTexts) {
        scene.choices = choiceTexts.map((text, index) => {
          const cleanText = text.replace(/"text":\s*"/, '').replace(/"$/, '');
          return {
            choice_id: `manual_choice_${index}_${Date.now()}`,
            text: cleanText,
            persona_impact: 0,
            consequences: 'Continue the story'
          };
        });
      }
    } catch (choiceError) {
      console.warn('⚠️ Could not extract choices manually');
    }
  }
  
  // Only return if we got at least title and narration
  if (scene.title && scene.narration) {
    return scene;
  }
  
  return null;
}

// ===== EXPORT LEGACY FUNCTIONS FOR COMPATIBILITY =====

/**
 * Legacy function for backward compatibility
 */
export async function generateNextScene(characterPack, playerAction, sceneData = null, freedomLevel = 50) {
  console.log('⚠️ Using legacy generateNextScene function - consider upgrading to generateNextSceneWithIntelligence');
  
  return await generateNextSceneWithIntelligence(
    characterPack,
    playerAction,
    sceneData,
    1, // Default scene number
    freedomLevel
  );
}

// ===== CHOICE SUGGESTIONS =====

/**
 * Generate AI-powered choice suggestions for players
 */
export async function generateChoiceSuggestions(characterPack, sceneData) {
  console.log('💭 Generating AI choice suggestions...');
  
  if (!characterPack || !sceneData) {
    throw new Error('Missing required parameters for choice suggestions');
  }

  // Check if OpenAI is configured
  if (!isOpenAIConfigured) {
    throw new Error('OpenAI API not configured. Please check your config.js file.');
  }

  const prompt = `Generate 3 creative action suggestions for ${characterPack.name} in this scene:

CURRENT SCENE: ${sceneData.title}
NARRATION: ${sceneData.narration}

CHARACTER: ${characterPack.name}
SETTING: ${characterPack.setting}
PERSONALITY: ${characterPack.traits?.join(', ')}

Generate 3 different action suggestions that:
1. Are true to the character's personality
2. Offer different approaches (cautious, bold, creative)
3. Are 15-30 words each
4. Start with "I..." to be first-person actions

CRITICAL: Respond with ONLY a JSON array of 3 strings. NO explanatory text, NO markdown, NO extra content.

Format:
["I examine the ancient book carefully, looking for hidden clues.", "I boldly confront the mysterious figure about their intentions.", "I quietly observe the situation before making my next move."]`;

  console.log('📤 Calling OpenAI for suggestions...');
  
  try {
    const response = await callOpenAIAPI(prompt);
    console.log('📥 Got suggestions response:', response.substring(0, 200) + '...');
    
    // Parse the JSON array response with improved extraction
    let cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Try to extract JSON array even if there's extra text
    let arrayMatch = cleanResponse.match(/\[\s*"[^"]*"[^]]*\]/);
    if (arrayMatch) {
      cleanResponse = arrayMatch[0];
      console.log('📄 Extracted array from response:', cleanResponse);
    } else {
      // Try to find any array-like structure
      let fallbackMatch = cleanResponse.match(/\[[\s\S]*?\]/);
      if (fallbackMatch) {
        cleanResponse = fallbackMatch[0];
        console.log('📄 Fallback array extraction:', cleanResponse);
      }
    }
    
    let suggestions;
    
    try {
      suggestions = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('❌ Failed to parse AI suggestions response:', parseError);
      console.error('❌ Raw response:', response);
      console.error('❌ Cleaned response:', cleanResponse);
      throw new Error(`AI returned invalid JSON for suggestions: ${parseError.message}. Raw response: ${response.substring(0, 200)}...`);
    }
    
    // Validate and clean suggestions
    if (!Array.isArray(suggestions)) {
      throw new Error('AI response is not an array of suggestions');
    }
    
    if (suggestions.length === 0) {
      throw new Error('AI returned empty suggestions array');
    }
    
    suggestions = suggestions.slice(0, 3).map(suggestion => 
      suggestion.trim().substring(0, 150) // Limit length
    );
    
    // Ensure we have valid suggestions
    if (suggestions.some(s => !s || s.length < 10)) {
      throw new Error('AI returned invalid or too short suggestions');
    }
    
    console.log('✅ AI suggestions generated successfully:', suggestions);
    return suggestions;
    
  } catch (error) {
    console.error('❌ Failed to generate AI suggestions:', error.message);
    console.error('❌ Full error:', error);
    
    // NO MORE FALLBACKS - Let the error bubble up so we can fix the real issue
    throw new Error(`AI suggestion generation failed: ${error.message}. Please check your internet connection and try again.`);
  }
}

// ===== API TESTING =====

/**
 * Simple test to check if OpenAI API is working
 */
export async function testOpenAIConnection() {
  console.log('🔧 Testing OpenAI API connection...');
  
  if (!isOpenAIConfigured) {
    return {
      success: false,
      error: 'OpenAI API key not configured or invalid format',
      suggestion: 'Please check your config.js file and ensure you have a valid OpenAI API key starting with "sk-"'
    };
  }
  
  try {
    const testPrompt = 'Respond with exactly: "API test successful"';
    const response = await callOpenAIAPI(testPrompt);
    
    if (response && response.includes('API test successful')) {
      console.log('✅ OpenAI API test successful');
      return {
        success: true,
        message: 'OpenAI API is working correctly'
      };
    } else {
      console.log('⚠️ API responded but with unexpected content:', response);
      return {
        success: false,
        error: 'API responded but with unexpected content',
        response: response
      };
    }
  } catch (error) {
    console.error('❌ OpenAI API test failed:', error);
    return {
      success: false,
      error: error.message,
      suggestion: 'Check your internet connection and API key validity'
    };
  }
}

/**
 * Simple test to see OpenAI response format for suggestions
 */
export async function testSuggestionsFormat() {
  console.log('🧪 Testing suggestions format...');
  
  const testPrompt = `Generate 3 simple test suggestions in JSON array format:

CRITICAL: Respond with ONLY a JSON array of 3 strings. NO explanatory text.

Format:
["Test suggestion 1", "Test suggestion 2", "Test suggestion 3"]`;

  try {
    const response = await callOpenAIAPI(testPrompt);
    console.log('🔍 RAW OpenAI Response for suggestions:');
    console.log('=====================================');
    console.log(response);
    console.log('=====================================');
    
    return {
      success: true,
      rawResponse: response,
      length: response.length
    };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}