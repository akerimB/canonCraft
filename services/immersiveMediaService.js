/**
 * InCharacter Phase 7: Immersive Media Service
 * Advanced voice synthesis, visual generation, and multimedia experiences
 */

import { openai, MODEL_CONFIGS } from '../config.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Platform-specific audio import
let Audio = null;
if (Platform.OS !== 'web') {
  try {
    const { Audio: ExpoAudio } = require('expo-av');
    Audio = ExpoAudio;
  } catch (e) {
    console.warn('expo-av not available, audio features disabled');
  }
}

// Voice synthesis configuration
const VOICE_CONFIGS = {
  sherlock_holmes: {
    voiceId: 'alloy', // OpenAI voice
    accent: 'british',
    pace: 'measured',
    tone: 'analytical',
    pitch: 'medium-low',
    style: 'intellectual'
  },
  dracula: {
    voiceId: 'echo',
    accent: 'transylvanian',
    pace: 'slow',
    tone: 'menacing',
    pitch: 'low',
    style: 'aristocratic'
  },
  elizabeth_bennet: {
    voiceId: 'nova',
    accent: 'refined-english',
    pace: 'lively',
    tone: 'witty',
    pitch: 'medium-high',
    style: 'spirited'
  },
  hamlet: {
    voiceId: 'fable',
    accent: 'shakespearean',
    pace: 'contemplative',
    tone: 'melancholic',
    pitch: 'medium',
    style: 'poetic'
  },
  jane_eyre: {
    voiceId: 'shimmer',
    accent: 'yorkshire',
    pace: 'gentle',
    tone: 'determined',
    pitch: 'medium',
    style: 'earnest'
  },
  default: {
    voiceId: 'alloy',
    accent: 'neutral',
    pace: 'normal',
    tone: 'warm',
    pitch: 'medium',
    style: 'conversational'
  }
};

// Ambient audio themes
const AMBIENT_THEMES = {
  victorian_london: {
    baseTrack: 'london_fog',
    layers: ['horse_carriages', 'distant_bells', 'cobblestone_steps'],
    intensity: 0.6,
    dynamics: true
  },
  gothic_castle: {
    baseTrack: 'wind_howling',
    layers: ['creaking_doors', 'distant_thunder', 'chains_rattling'],
    intensity: 0.8,
    dynamics: true
  },
  regency_estate: {
    baseTrack: 'countryside_birds',
    layers: ['harpsichord_distant', 'tea_service', 'garden_fountain'],
    intensity: 0.4,
    dynamics: false
  },
  medieval_court: {
    baseTrack: 'great_hall_echo',
    layers: ['lute_music', 'court_chatter', 'torch_crackling'],
    intensity: 0.5,
    dynamics: true
  },
  ship_deck: {
    baseTrack: 'ocean_waves',
    layers: ['wind_sails', 'rope_creaking', 'seagulls'],
    intensity: 0.7,
    dynamics: true
  },
  moor_landscape: {
    baseTrack: 'wind_grass',
    layers: ['distant_church', 'sheep_bleating', 'stream_babbling'],
    intensity: 0.5,
    dynamics: false
  }
};

// Visual generation themes
const VISUAL_THEMES = {
  sherlock_holmes: {
    style: 'victorian_illustration',
    palette: ['#2C3E50', '#8B4513', '#D4AF37', '#696969'],
    lighting: 'gaslight',
    atmosphere: 'mysterious_fog'
  },
  dracula: {
    style: 'gothic_horror',
    palette: ['#8B0000', '#2F4F4F', '#000000', '#C0C0C0'],
    lighting: 'candlelight',
    atmosphere: 'ominous_shadows'
  },
  elizabeth_bennet: {
    style: 'regency_watercolor',
    palette: ['#F5DEB3', '#DDA0DD', '#98FB98', '#87CEEB'],
    lighting: 'natural_daylight',
    atmosphere: 'pastoral_beauty'
  },
  hamlet: {
    style: 'renaissance_painting',
    palette: ['#483D8B', '#8B4513', '#CD853F', '#2F4F4F'],
    lighting: 'dramatic_contrast',
    atmosphere: 'melancholic_grandeur'
  },
  jane_eyre: {
    style: 'romantic_realism',
    palette: ['#8B4513', '#2F4F4F', '#CD853F', '#696969'],
    lighting: 'firelight',
    atmosphere: 'intimate_warmth'
  }
};

/**
 * Immersive Media Service Class
 * Handles voice synthesis, visual generation, and ambient audio
 */
class ImmersiveMediaService {
  constructor() {
    this.audioCache = new Map();
    this.voiceCache = new Map();
    this.visualCache = new Map();
    this.activeAmbientSound = null;
    this.voiceSynthesisEnabled = true;
    this.ambientAudioEnabled = true;
    this.visualEnhancementsEnabled = true;
  }

  /**
   * Initialize immersive media for a character story
   */
  async initializeImmersiveMedia(characterPack, playerPreferences = {}) {
    console.log('🎬 Initializing Phase 7 Immersive Media for:', characterPack.name);
    
    try {
      // Set user preferences
      this.voiceSynthesisEnabled = playerPreferences.voiceEnabled !== false;
      this.ambientAudioEnabled = playerPreferences.ambientEnabled !== false;
      this.visualEnhancementsEnabled = playerPreferences.visualsEnabled !== false;
      
      // Initialize audio system
      if (this.ambientAudioEnabled) {
        await this.initializeAudioSystem();
      }
      
      // Preload character voice profile
      if (this.voiceSynthesisEnabled) {
        await this.loadCharacterVoiceProfile(characterPack.id);
      }
      
      // Initialize visual theme
      if (this.visualEnhancementsEnabled) {
        await this.initializeVisualTheme(characterPack.id);
      }
      
      console.log('✅ Immersive media initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize immersive media:', error);
      return false;
    }
  }

  /**
   * Generate character voice narration
   */
  async generateCharacterVoice(characterId, text, emotionData = null) {
    if (!this.voiceSynthesisEnabled) return null;
    
    try {
      console.log('🎤 Generating voice for:', characterId);
      
      const voiceConfig = VOICE_CONFIGS[characterId] || VOICE_CONFIGS.default;
      const cacheKey = `${characterId}_${this.hashText(text)}`;
      
      // Check cache first
      if (this.voiceCache.has(cacheKey)) {
        return this.voiceCache.get(cacheKey);
      }
      
      // Adjust voice parameters based on emotion
      const adjustedConfig = this.adjustVoiceForEmotion(voiceConfig, emotionData);
      
      // Generate speech using OpenAI's TTS
      const audioBuffer = await this.synthesizeSpeech(text, adjustedConfig);
      
      // Cache the result
      this.voiceCache.set(cacheKey, audioBuffer);
      
      console.log('✅ Voice generated successfully');
      return audioBuffer;
    } catch (error) {
      console.error('❌ Failed to generate voice:', error);
      return null;
    }
  }

  /**
   * Generate scene-specific ambient audio
   */
  async generateAmbientAudio(sceneData, characterId, intensity = 0.6) {
    if (!this.ambientAudioEnabled) return null;
    
    try {
      console.log('🎵 Generating ambient audio for scene...');
      
      const theme = this.selectAmbientTheme(sceneData, characterId);
      const ambientConfig = { ...AMBIENT_THEMES[theme], intensity };
      
      // Generate dynamic ambient mix
      const ambientMix = await this.createAmbientMix(ambientConfig, sceneData);
      
      console.log('✅ Ambient audio generated');
      return ambientMix;
    } catch (error) {
      console.error('❌ Failed to generate ambient audio:', error);
      return null;
    }
  }

  /**
   * Generate enhanced scene visuals
   */
  async generateEnhancedVisuals(sceneData, characterId, style = 'auto') {
    if (!this.visualEnhancementsEnabled) return null;
    
    try {
      console.log('🎨 Generating enhanced visuals...');
      
      const visualTheme = VISUAL_THEMES[characterId] || VISUAL_THEMES.elizabeth_bennet;
      const enhancedPrompt = this.buildVisualPrompt(sceneData, visualTheme, style);
      
      // Generate image using DALL-E (placeholder for now)
      const visualData = await this.generateSceneImage(enhancedPrompt, visualTheme);
      
      console.log('✅ Enhanced visuals generated');
      return visualData;
    } catch (error) {
      console.error('❌ Failed to generate enhanced visuals:', error);
      return null;
    }
  }

  /**
   * Create immersive scene experience
   */
  async createImmersiveExperience(sceneData, characterId, emotionData = null) {
    console.log('🌟 Creating immersive experience...');
    
    const experience = {
      visual: null,
      audio: null,
      voice: null,
      atmosphere: null,
      timestamp: new Date().toISOString()
    };
    
    try {
      // Generate all media components in parallel
      const [visualData, ambientAudio, characterVoice] = await Promise.allSettled([
        this.generateEnhancedVisuals(sceneData, characterId),
        this.generateAmbientAudio(sceneData, characterId),
        sceneData.narration ? this.generateCharacterVoice(characterId, sceneData.narration, emotionData) : null
      ]);
      
      // Process results
      if (visualData.status === 'fulfilled') {
        experience.visual = visualData.value;
      }
      
      if (ambientAudio.status === 'fulfilled') {
        experience.audio = ambientAudio.value;
      }
      
      if (characterVoice.status === 'fulfilled') {
        experience.voice = characterVoice.value;
      }
      
      // Generate atmospheric data
      experience.atmosphere = this.generateAtmosphericData(sceneData, characterId, emotionData);
      
      console.log('✅ Immersive experience created');
      return experience;
    } catch (error) {
      console.error('❌ Failed to create immersive experience:', error);
      return experience;
    }
  }

  /**
   * Play character dialogue with voice synthesis
   */
  async playCharacterDialogue(characterId, dialogue, emotionData = null) {
    if (!this.voiceSynthesisEnabled) return;
    
    try {
      const audioBuffer = await this.generateCharacterVoice(characterId, dialogue, emotionData);
      
      if (audioBuffer) {
        const sound = new Audio.Sound();
        await sound.loadAsync({ uri: audioBuffer });
        await sound.playAsync();
        
        return sound;
      }
    } catch (error) {
      console.error('❌ Failed to play character dialogue:', error);
    }
  }

  /**
   * Start ambient audio for scene
   */
  async startAmbientAudio(sceneData, characterId) {
    if (!this.ambientAudioEnabled) return;
    
    try {
      // Stop any existing ambient audio
      await this.stopAmbientAudio();
      
      const ambientMix = await this.generateAmbientAudio(sceneData, characterId);
      
      if (ambientMix) {
        this.activeAmbientSound = new Audio.Sound();
        await this.activeAmbientSound.loadAsync({ uri: ambientMix.audioUrl });
        await this.activeAmbientSound.setIsLoopingAsync(true);
        await this.activeAmbientSound.setVolumeAsync(ambientMix.volume || 0.3);
        await this.activeAmbientSound.playAsync();
      }
    } catch (error) {
      console.error('❌ Failed to start ambient audio:', error);
    }
  }

  /**
   * Stop ambient audio
   */
  async stopAmbientAudio() {
    if (this.activeAmbientSound) {
      try {
        await this.activeAmbientSound.stopAsync();
        await this.activeAmbientSound.unloadAsync();
        this.activeAmbientSound = null;
      } catch (error) {
        console.error('❌ Failed to stop ambient audio:', error);
      }
    }
  }

  /**
   * Generate dynamic visual filters based on emotion and scene
   */
  generateDynamicVisualFilters(sceneData, emotionData, characterId) {
    const baseTheme = VISUAL_THEMES[characterId] || VISUAL_THEMES.elizabeth_bennet;
    
    const filters = {
      colorGrading: baseTheme.palette,
      lighting: baseTheme.lighting,
      atmosphere: baseTheme.atmosphere,
      intensity: 1.0,
      contrast: 1.0,
      saturation: 1.0,
      warmth: 0.5
    };
    
    // Adjust based on emotion
    if (emotionData) {
      const primaryEmotion = emotionData.primaryEmotion || emotionData.emotions?.[0];
      const intensity = (emotionData.intensity || 50) / 100;
      
      switch (primaryEmotion) {
        case 'fear':
        case 'anxious':
          filters.contrast += 0.3;
          filters.saturation -= 0.2;
          filters.warmth -= 0.3;
          break;
        case 'anger':
        case 'frustrated':
          filters.saturation += 0.3;
          filters.warmth += 0.2;
          filters.intensity += 0.2;
          break;
        case 'sad':
        case 'melancholic':
          filters.saturation -= 0.4;
          filters.contrast -= 0.2;
          filters.warmth -= 0.2;
          break;
        case 'happy':
        case 'joyful':
          filters.saturation += 0.2;
          filters.warmth += 0.3;
          filters.intensity += 0.1;
          break;
        case 'curious':
        case 'thoughtful':
          filters.contrast += 0.1;
          filters.saturation += 0.1;
          break;
      }
      
      // Scale adjustments by emotion intensity
      Object.keys(filters).forEach(key => {
        if (key !== 'colorGrading' && key !== 'lighting' && key !== 'atmosphere') {
          const baseValue = 1.0;
          const adjustment = filters[key] - baseValue;
          filters[key] = baseValue + (adjustment * intensity);
        }
      });
    }
    
    return filters;
  }

  /**
   * Private helper methods
   */
  async initializeAudioSystem() {
    try {
      if (Audio && Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
          playThroughEarpieceAndroid: false
        });
        console.log('🔊 Mobile audio system initialized');
      } else {
        // Web audio initialization
        console.log('🔊 Web audio system initialized (using Web Audio API)');
      }
    } catch (error) {
      console.error('Failed to initialize audio system:', error);
    }
  }

  async loadCharacterVoiceProfile(characterId) {
    const voiceConfig = VOICE_CONFIGS[characterId] || VOICE_CONFIGS.default;
    // Preload voice settings
    return voiceConfig;
  }

  async initializeVisualTheme(characterId) {
    const theme = VISUAL_THEMES[characterId] || VISUAL_THEMES.elizabeth_bennet;
    // Initialize visual processing
    return theme;
  }

  hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  adjustVoiceForEmotion(voiceConfig, emotionData) {
    if (!emotionData) return voiceConfig;
    
    const adjusted = { ...voiceConfig };
    const primaryEmotion = emotionData.primaryEmotion || emotionData.emotions?.[0];
    const intensity = (emotionData.intensity || 50) / 100;
    
    switch (primaryEmotion) {
      case 'fear':
      case 'anxious':
        adjusted.pace = 'fast';
        adjusted.pitch = 'higher';
        break;
      case 'anger':
        adjusted.pace = 'aggressive';
        adjusted.pitch = 'lower';
        adjusted.tone = 'stern';
        break;
      case 'sad':
        adjusted.pace = 'slow';
        adjusted.pitch = 'lower';
        adjusted.tone = 'melancholic';
        break;
      case 'happy':
        adjusted.pace = 'lively';
        adjusted.pitch = 'higher';
        adjusted.tone = 'cheerful';
        break;
      case 'thoughtful':
        adjusted.pace = 'measured';
        adjusted.tone = 'contemplative';
        break;
    }
    
    return adjusted;
  }

  async synthesizeSpeech(text, voiceConfig) {
    try {
      // Placeholder for OpenAI TTS integration
      // This would use OpenAI's text-to-speech API
      const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voiceConfig.voiceId,
        input: text,
        speed: this.getPaceMultiplier(voiceConfig.pace)
      });
      
      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      
      return audioUrl;
    } catch (error) {
      console.error('Failed to synthesize speech:', error);
      return null;
    }
  }

  getPaceMultiplier(pace) {
    switch (pace) {
      case 'slow': return 0.8;
      case 'fast': return 1.2;
      case 'measured': return 0.9;
      case 'lively': return 1.1;
      case 'aggressive': return 1.3;
      default: return 1.0;
    }
  }

  selectAmbientTheme(sceneData, characterId) {
    const sceneText = sceneData.narration?.toLowerCase() || '';
    
    // Character-specific defaults
    if (characterId === 'sherlock_holmes' || characterId === 'dr_watson') {
      return 'victorian_london';
    }
    if (characterId === 'dracula' || characterId === 'van_helsing') {
      return 'gothic_castle';
    }
    if (characterId === 'elizabeth_bennet' || characterId === 'mr_darcy') {
      return 'regency_estate';
    }
    if (characterId === 'hamlet' || characterId === 'lady_macbeth') {
      return 'medieval_court';
    }
    if (characterId === 'captain_ahab') {
      return 'ship_deck';
    }
    if (characterId === 'jane_eyre') {
      return 'moor_landscape';
    }
    
    // Scene context detection
    if (sceneText.includes('castle') || sceneText.includes('gothic')) {
      return 'gothic_castle';
    }
    if (sceneText.includes('london') || sceneText.includes('fog')) {
      return 'victorian_london';
    }
    if (sceneText.includes('estate') || sceneText.includes('garden')) {
      return 'regency_estate';
    }
    if (sceneText.includes('ship') || sceneText.includes('ocean')) {
      return 'ship_deck';
    }
    if (sceneText.includes('court') || sceneText.includes('castle')) {
      return 'medieval_court';
    }
    
    return 'regency_estate'; // Default pleasant theme
  }

  async createAmbientMix(ambientConfig, sceneData) {
    // Placeholder for ambient audio generation
    // This would combine base tracks with layers
    return {
      audioUrl: 'placeholder_ambient_url',
      volume: ambientConfig.intensity * 0.5,
      layers: ambientConfig.layers,
      dynamic: ambientConfig.dynamics
    };
  }

  buildVisualPrompt(sceneData, visualTheme, style) {
    const basePrompt = `Create a ${visualTheme.style} illustration of: ${sceneData.narration}`;
    const stylePrompt = `Style: ${visualTheme.style}, lighting: ${visualTheme.lighting}, atmosphere: ${visualTheme.atmosphere}`;
    const colorPrompt = `Color palette: ${visualTheme.palette.join(', ')}`;
    
    return `${basePrompt}. ${stylePrompt}. ${colorPrompt}. High quality, detailed, immersive.`;
  }

  async generateSceneImage(prompt, visualTheme) {
    try {
      // Placeholder for DALL-E integration
      // This would use OpenAI's image generation API
      return {
        imageUrl: 'placeholder_image_url',
        style: visualTheme.style,
        palette: visualTheme.palette,
        generated: true
      };
    } catch (error) {
      console.error('Failed to generate scene image:', error);
      return null;
    }
  }

  generateAtmosphericData(sceneData, characterId, emotionData) {
    const theme = VISUAL_THEMES[characterId] || VISUAL_THEMES.elizabeth_bennet;
    
    return {
      lighting: theme.lighting,
      colorPalette: theme.palette,
      mood: emotionData?.primaryEmotion || 'neutral',
      intensity: (emotionData?.intensity || 50) / 100,
      atmosphere: theme.atmosphere,
      visualFilters: this.generateDynamicVisualFilters(sceneData, emotionData, characterId)
    };
  }

  // Settings and preferences
  setVoiceEnabled(enabled) {
    this.voiceSynthesisEnabled = enabled;
  }

  setAmbientEnabled(enabled) {
    this.ambientAudioEnabled = enabled;
    if (!enabled) {
      this.stopAmbientAudio();
    }
  }

  setVisualsEnabled(enabled) {
    this.visualEnhancementsEnabled = enabled;
  }

  getMediaSettings() {
    return {
      voiceEnabled: this.voiceSynthesisEnabled,
      ambientEnabled: this.ambientAudioEnabled,
      visualsEnabled: this.visualEnhancementsEnabled
    };
  }

  // Cleanup
  async cleanup() {
    await this.stopAmbientAudio();
    this.audioCache.clear();
    this.voiceCache.clear();
    this.visualCache.clear();
  }
}

// Export singleton instance
export const immersiveMediaService = new ImmersiveMediaService();
export default immersiveMediaService;