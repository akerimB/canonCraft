import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
  Image,
  Dimensions,
  ImageBackground,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useGame } from './gameContext';
import { 
  generateSceneImage, 
  generateChoiceSuggestions, 
  parsePlayerInput, 
  generateCharacterEmotionData,
  PLAYER_INPUT_LIMITS,
  testOpenAIConnection,
  testSuggestionsFormat
} from '../services/aiService';
import FreedomSlider from './FreedomSlider';
import PersonaMeter from './PersonaMeter';
import TraitMatrixScreen from './TraitMatrixScreen';

const { width, height } = Dimensions.get('window');

// Import the separate vintage book page backgrounds
const VINTAGE_BOOK_LEFT = require('../assets/bookLeft.png');
const VINTAGE_BOOK_RIGHT = require('../assets/bookRight.png');

// Character portraits for major characters
const characterPortraits = {
  'sherlock_holmes': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  'dr_watson': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  'inspector_lestrade': 'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=150&h=150&fit=crop&crop=face',
  'dracula': 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=150&h=150&fit=crop&crop=face',
  'renfield': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
  'van_helsing': 'https://images.unsplash.com/photo-1478098711619-5ab0b478d6e6?w=150&h=150&fit=crop&crop=face',
  'elizabeth_bennet': 'https://images.unsplash.com/photo-1494790108755-2616c5e3b5ee?w=150&h=150&fit=crop&crop=face',
  'mr_darcy': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  'jane_bennet': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  'hamlet': 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face',
  'jane_eyre': 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face',
  'captain_ahab': 'https://images.unsplash.com/photo-1553292262-4ac2cfa85dc1?w=150&h=150&fit=crop&crop=face',
  'dr_jekyll': 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=150&h=150&fit=crop&crop=face',
  'odysseus': 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=150&h=150&fit=crop&crop=face',
  'lady_macbeth': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=150&h=150&fit=crop&crop=face',
  'default': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
};

// Character-specific atmospheric overlays (to complement the book background)
const getCharacterAtmosphericOverlay = (characterId, sceneText) => {
  const text = sceneText?.toLowerCase() || '';
  
  // Character-specific mood detection
  if (characterId === 'sherlock_holmes' || characterId === 'dr_watson' || characterId === 'inspector_lestrade') {
    if (text.includes('fog') || text.includes('mist') || text.includes('london')) {
      return 'rgba(26, 26, 46, 0.4)'; // Victorian mysterious
    }
    return 'rgba(46, 42, 62, 0.25)'; // Victorian default
  }
  
  if (characterId === 'dracula' || characterId === 'renfield' || characterId === 'van_helsing') {
    return 'rgba(26, 13, 13, 0.45)'; // Gothic horror
  }
  
  if (characterId === 'elizabeth_bennet' || characterId === 'mr_darcy' || characterId === 'jane_bennet') {
    return 'rgba(101, 67, 33, 0.2)'; // Regency warmth
  }
  
  if (characterId === 'hamlet' || characterId === 'lady_macbeth') {
    return 'rgba(62, 53, 72, 0.35)'; // Medieval drama
  }
  
  if (characterId === 'jane_eyre') {
    if (text.includes('fire') || text.includes('flame')) {
      return 'rgba(139, 69, 19, 0.3)'; // Gothic fire
    }
    return 'rgba(46, 42, 62, 0.35)'; // Gothic Victorian
  }
  
  if (characterId === 'captain_ahab') {
    return 'rgba(25, 25, 112, 0.3)'; // Maritime blue
  }
  
  // Default literary atmosphere
  return 'rgba(62, 53, 72, 0.15)';
};

// Typewriter text component
const TypewriterText = ({ text, speed = 30, onComplete, style, disabled = false }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (disabled) {
      setDisplayedText(text);
      setIsComplete(true);
      onComplete && onComplete();
      return;
    }

    setDisplayedText('');
    setIsComplete(false);
    indexRef.current = 0;
    
    const typeNextChar = () => {
      if (indexRef.current < text.length) {
        setDisplayedText(text.substring(0, indexRef.current + 1));
        indexRef.current++;
        timeoutRef.current = setTimeout(typeNextChar, speed);
      } else {
        setIsComplete(true);
        onComplete && onComplete();
      }
    };

    timeoutRef.current = setTimeout(typeNextChar, speed);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, disabled]);

  const handleSkip = () => {
    if (!isComplete && !disabled) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setDisplayedText(text);
      setIsComplete(true);
      onComplete && onComplete();
    }
  };

  return (
    <TouchableOpacity onPress={handleSkip} style={style} disabled={isComplete || disabled}>
      <Text style={[styles.narrativeText, { opacity: isComplete ? 1 : 0.9 }]}>
        {displayedText}
        {!isComplete && <Text style={styles.cursor}>|</Text>}
      </Text>
      {!isComplete && !disabled && (
        <Text style={styles.skipHint}>Tap to skip animation</Text>
      )}
    </TouchableOpacity>
  );
};

// Character portrait component with emotion animations
const CharacterPortrait = ({ characterId, visible, style, emotionData }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const emotionAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && imageLoaded) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, imageLoaded]);

  // Animate emotions when they change
  useEffect(() => {
    if (emotionData && visible) {
      // Pulse animation based on emotion intensity
      const intensity = emotionData.intensity || 50;
      const pulseScale = 1 + (intensity / 1000); // Subtle scaling
      
      Animated.sequence([
        Animated.timing(emotionAnim, {
          toValue: pulseScale,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(emotionAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        })
      ]).start();

      // Glow effect for strong emotions
      if (intensity > 70) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            })
          ]),
          { iterations: 2 }
        ).start();
      }
    }
  }, [emotionData]);

  const portraitUrl = characterPortraits[characterId] || characterPortraits.default;

  // Get emotion-based border color
  const getEmotionBorderColor = () => {
    if (!emotionData || !emotionData.emotions) return '#D4AF37';
    
    const emotion = emotionData.emotions[0];
    const emotionColors = {
      'happy': '#FFD700',
      'sad': '#4169E1', 
      'angry': '#DC143C',
      'surprised': '#FF69B4',
      'fearful': '#8A2BE2',
      'analytical': '#20B2AA',
      'calculating': '#B22222',
      'intelligent': '#4682B4',
      'thoughtful': '#708090'
    };
    
    return emotionColors[emotion] || '#D4AF37';
  };

  return (
    <Animated.View style={[
      styles.portraitContainer, 
      style, 
      { 
        opacity: fadeAnim,
        transform: [{ scale: emotionAnim }]
      }
    ]}>
      <Image
        source={{ uri: portraitUrl }}
        style={styles.characterPortrait}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageLoaded(true)}
      />
      <Animated.View style={[
        styles.portraitFrame, 
        { 
          borderColor: getEmotionBorderColor(),
          shadowOpacity: glowAnim,
          shadowColor: getEmotionBorderColor(),
          shadowRadius: 10,
          elevation: 5
        }
      ]} />
      
      {/* Emotion indicator overlay */}
      {emotionData && emotionData.emotions && (
        <View style={styles.emotionIndicator}>
          <Text style={styles.emotionEmoji}>
            {getEmotionEmoji(emotionData.emotions[0])}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

// Helper function to get emoji for emotions
const getEmotionEmoji = (emotion) => {
  const emojiMap = {
    'happy': '😊',
    'sad': '😢',
    'angry': '😠',
    'surprised': '😲',
    'fearful': '😰',
    'analytical': '🤔',
    'calculating': '😏',
    'intelligent': '🧠',
    'thoughtful': '💭',
    'neutral': '😐'
  };
  return emojiMap[emotion] || '😐';
};

// Helper function to get color for emotions
const getEmotionColor = (emotion) => {
  const emotionColors = {
    'happy': '#FFD700',
    'sad': '#4169E1',
    'angry': '#DC143C',
    'surprised': '#FF69B4',
    'disgusted': '#9ACD32',
    'fearful': '#8A2BE2',
    'analytical': '#20B2AA',
    'calculating': '#B22222',
    'intelligent': '#4682B4',
    'mysterious': '#483D8B',
    'confident': '#FF6347',
    'thoughtful': '#708090'
  };
  return emotionColors[emotion?.toLowerCase()] || '#696969';
};

// NEW: Advanced input analysis component
const InputAnalysisPanel = ({ inputText, analysisData }) => {
  if (!analysisData || !inputText.trim()) return null;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'dialogue': return '💬';
      case 'narration': return '🎭';
      case 'other_character': return '👥';
      case 'mixed': return '🎪';
      default: return '📝';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return '#4CAF50';
    if (confidence >= 60) return '#FF9800';
    return '#F44336';
  };

  return (
    <View style={styles.inputAnalysisPanel}>
      <View style={styles.analysisHeader}>
        <Text style={styles.analysisTitle}>Input Analysis</Text>
        <View style={styles.typeIndicator}>
          <Text style={styles.typeIcon}>{getTypeIcon(analysisData.inputType)}</Text>
          <Text style={styles.typeText}>{analysisData.inputType.replace('_', ' ').toUpperCase()}</Text>
          <View style={[styles.confidenceBar, { backgroundColor: getConfidenceColor(analysisData.confidence) }]}>
            <Text style={styles.confidenceText}>{analysisData.confidence}%</Text>
          </View>
        </View>
      </View>
      
      {analysisData.components && (
        <View style={styles.componentsSection}>
          {analysisData.components.dialogue && (
            <Text style={styles.componentText}>💬 Dialogue: "{analysisData.components.dialogue}"</Text>
          )}
          {analysisData.components.emotions.length > 0 && (
            <Text style={styles.componentText}>😊 Emotions: {analysisData.components.emotions.join(', ')}</Text>
          )}
          {analysisData.components.objects.length > 0 && (
            <Text style={styles.componentText}>🔍 Objects: {analysisData.components.objects.join(', ')}</Text>
          )}
        </View>
      )}
    </View>
  );
};

// NEW: Character emotion visualization component
const CharacterEmotionDisplay = ({ emotionData, characterId }) => {
  if (!emotionData) return null;

  const getEmotionColor = (emotion) => {
    const emotionColors = {
      'happy': '#FFD700',
      'sad': '#4169E1',
      'angry': '#DC143C',
      'surprised': '#FF69B4',
      'disgusted': '#9ACD32',
      'fearful': '#8A2BE2',
      'analytical': '#20B2AA',
      'calculating': '#B22222',
      'intelligent': '#4682B4',
      'mysterious': '#483D8B',
      'confident': '#FF6347',
      'thoughtful': '#708090'
    };
    return emotionColors[emotion.toLowerCase()] || '#696969';
  };

  return (
    <View style={styles.emotionDisplay}>
      <Text style={styles.emotionTitle}>Character Emotions</Text>
      <View style={styles.emotionGrid}>
        {emotionData.emotions && emotionData.emotions.map((emotion, index) => (
          <View key={index} style={[styles.emotionChip, { borderColor: getEmotionColor(emotion) }]}>
            <Text style={[styles.emotionText, { color: getEmotionColor(emotion) }]}>{emotion}</Text>
          </View>
        ))}
      </View>
      {emotionData.intensity && (
        <View style={styles.intensityBar}>
          <Text style={styles.intensityLabel}>Intensity:</Text>
          <View style={styles.intensityTrack}>
            <View style={[styles.intensityFill, { width: `${emotionData.intensity}%` }]} />
          </View>
          <Text style={styles.intensityValue}>{emotionData.intensity}%</Text>
        </View>
      )}
    </View>
  );
};

// NEW: Scene atmosphere controls
const AtmosphereControls = ({ onAtmosphereChange, currentAtmosphere }) => {
  const atmosphereOptions = [
    { id: 'auto', name: 'Auto', icon: '🎭', description: 'AI-determined mood' },
    { id: 'mysterious', name: 'Mysterious', icon: '🌫️', description: 'Foggy, enigmatic' },
    { id: 'dramatic', name: 'Dramatic', icon: '⚡', description: 'Intense, theatrical' },
    { id: 'romantic', name: 'Romantic', icon: '🌹', description: 'Warm, intimate' },
    { id: 'dark', name: 'Dark', icon: '🌙', description: 'Gothic, ominous' },
    { id: 'bright', name: 'Bright', icon: '☀️', description: 'Light, optimistic' }
  ];

  return (
    <View style={styles.atmosphereControls}>
      <Text style={styles.atmosphereTitle}>Scene Atmosphere</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.atmosphereScroll}>
        {atmosphereOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.atmosphereOption,
              currentAtmosphere === option.id && styles.atmosphereOptionActive
            ]}
            onPress={() => onAtmosphereChange(option.id)}
          >
            <Text style={styles.atmosphereIcon}>{option.icon}</Text>
            <Text style={[
              styles.atmosphereName,
              currentAtmosphere === option.id && styles.atmosphereNameActive
            ]}>
              {option.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default function SceneScreen({ navigation }) {
  const { 
    state, 
    setScene, 
    updatePersonaScore, 
    generateNextScene,
    incrementAdsWatched,
    checkEnergyRefill,
    watchAdForEnergy,
    upgradeToPremium,
    getTimeUntilNextEnergyRefill,
    canGenerateScene,
    // Phase 5: Enhanced persona scoring functions
    scoreEnhancedDecision,
    getTraitMatrixSummary,
    getEnhancedPersonaSummary
  } = useGame();
  
  const [isLoading, setIsLoading] = useState(false);
  const [sceneImage, setSceneImage] = useState(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [playerInput, setPlayerInput] = useState('');
  const [suggestedChoices, setSuggestedChoices] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [freedomLevel, setFreedomLevel] = useState(50); // Default to balanced
  const [showFreedomSlider, setShowFreedomSlider] = useState(false);
  
  // NEW: Enhanced AI features state
  const [inputAnalysisData, setInputAnalysisData] = useState(null);
  const [characterEmotionData, setCharacterEmotionData] = useState(null);
  const [currentAtmosphere, setCurrentAtmosphere] = useState('auto');
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  const [realTimeAnalysis, setRealTimeAnalysis] = useState(true);
  
  // Phase 5: Trait Matrix Screen state
  const [showTraitMatrix, setShowTraitMatrix] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pageFlipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!state.currentStory || !state.currentScene) {
      navigation.navigate('Menu');
    }
    
    // Check for energy refill when component loads
    checkEnergyRefill();
  }, [state.currentStory, state.currentScene]);

  useEffect(() => {
    if (state.currentScene && state.selectedCharacter) {
      loadSceneImage();
      // Animate page entrance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
      ]).start(() => {
        // Show input after a delay
        setTimeout(() => setShowChoices(true), 1000);
      });
    }
  }, [state.currentScene]);

  const loadSceneImage = async () => {
    if (!state.currentScene || !state.selectedCharacter) return;
    
    setIsLoadingImage(true);
    try {
      const imageUrl = await generateSceneImage(state.selectedCharacter, state.currentScene);
      setSceneImage(imageUrl);
    } catch (error) {
      console.error('Error loading scene image:', error);
    } finally {
      setIsLoadingImage(false);
    }
  };

  const handlePlayerAction = async () => {
    if (!playerInput.trim()) {
      Alert.alert('Input Required', 'Please enter your action or dialogue.');
      return;
    }
    
    if (!canGenerateScene()) {
      Alert.alert(
        'No Energy',
        'You need energy to continue your story. Watch an ad or upgrade to premium for unlimited energy.',
        [
          { text: 'Watch Ad', onPress: watchAdForEnergy },
          { text: 'Upgrade', onPress: upgradeToPremium },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }
    
    setIsLoading(true);
    setShowChoices(false);
    
    try {
      // NEW: Enhanced input parsing and validation
      const parseResult = parsePlayerInput(playerInput);
      
      if (!parseResult.isValid) {
        Alert.alert('Input Issue', parseResult.error + '\n\n' + parseResult.suggestion);
        setIsLoading(false);
        return;
      }

      // Store analysis data for display
      setInputAnalysisData(parseResult.promptData);
      
      // Generate character emotion data
      const emotionData = generateCharacterEmotionData(
        state.selectedCharacter,
        state.currentScene,
        parseResult.promptData
      );
      setCharacterEmotionData(emotionData);

      await processPlayerAction(parseResult.promptData);
    } catch (error) {
      console.error('Error processing player action:', error);
      Alert.alert('Error', 'Failed to process your action. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Real-time input analysis as user types
  const handleInputChange = (text) => {
    setPlayerInput(text);
    
    if (realTimeAnalysis && text.trim().length > 3) {
      try {
        const parseResult = parsePlayerInput(text);
        if (parseResult.isValid) {
          setInputAnalysisData(parseResult.promptData);
        }
      } catch (error) {
        // Silently handle parsing errors during real-time analysis
        console.log('Real-time analysis error:', error);
      }
    } else if (text.trim().length <= 3) {
      setInputAnalysisData(null);
    }
  };

  // NEW: Atmosphere change handler
  const handleAtmosphereChange = (atmosphereId) => {
    setCurrentAtmosphere(atmosphereId);
    // You could trigger a scene re-render with new atmosphere here
    console.log('Atmosphere changed to:', atmosphereId);
  };

  const processPlayerAction = async (promptData = null) => {
    // Animate page flip
    Animated.timing(pageFlipAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();
    
    setShowChoices(false);
    setShowSuggestions(false);

    try {
      // Create a custom choice object from the player's input
      const customChoice = {
        text: promptData?.originalInput || playerInput,
        choice_id: Date.now().toString(),
        custom: true,
        persona_impact: 0 // Default for custom player actions
      };

      console.log('🎭 Processing choice with persona impact:', customChoice.persona_impact);
      console.log('🎭 Current persona score before action:', state.personaScore);
      
      // Phase 5: Enhanced decision scoring
      if (state.traitMatrixInitialized) {
        const decisionData = {
          playerAction: promptData?.originalInput || playerInput,
          sceneContext: state.currentScene?.narrative || '',
          characterExpected: {
            name: state.selectedCharacter?.name,
            traits: state.selectedCharacter?.traits
          },
          importance: 'medium' // Could be determined by scene context
        };
        
        console.log('🧠 Scoring decision with enhanced persona system...');
        const scoringResult = await scoreEnhancedDecision(decisionData);
        
        if (scoringResult) {
          console.log(`✅ Enhanced scoring complete: ${scoringResult.enhancedScore.toFixed(1)}/100`);
          console.log(`🔄 Matrix change score: ${scoringResult.matrixChangeScore.toFixed(1)}`);
          console.log(`📊 Consistency score: ${scoringResult.consistencyScore.toFixed(1)}`);
          
          if (scoringResult.traitEvolution) {
            console.log('🌱 Trait evolution detected:', Object.keys(scoringResult.traitEvolution.traitChanges || {}));
          }
        }
      }

      if (state.currentStory?.isAIGenerated) {
        try {
          // Pass the freedom level to the AI generation
          await generateNextScene(customChoice, freedomLevel);
          // Reset animations and input for new scene
          fadeAnim.setValue(0);
          scaleAnim.setValue(0.95);
          pageFlipAnim.setValue(0);
          setPlayerInput('');
          setSuggestedChoices([]);
        } catch (error) {
          if (error.message === 'INSUFFICIENT_ENERGY') {
            Alert.alert(
              'No Energy',
              'Please wait for energy to refill or watch an ad for more energy.',
              [{ text: 'OK' }]
            );
            return;
          }
          
          console.error('Failed to generate next scene:', error);
          Alert.alert(
            'Connection Error', 
            'Unable to generate the next scene. Please check your internet connection and try again.',
            [
              { text: 'Retry', onPress: () => processPlayerAction() },
              { text: 'Return to Menu', onPress: () => navigation.navigate('Menu') }
            ]
          );
          return;
        }
      } else {
        Alert.alert('Error', 'Story format not supported. Returning to menu.');
        navigation.navigate('Menu');
      }
    } catch (error) {
      console.error('Error handling player action:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleGetAISuggestions = async () => {
    if (isLoadingSuggestions) return;
    
    setIsLoadingSuggestions(true);
    try {
      const suggestions = await generateChoiceSuggestions(state.selectedCharacter, state.currentScene);
      setSuggestedChoices(suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      Alert.alert('Error', 'Unable to get AI suggestions. Please try again.');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setPlayerInput(suggestion);
    setShowSuggestions(false);
  };

  const getInputTypeDisplay = (input) => {
    if (input.trim().length < PLAYER_INPUT_LIMITS.MIN_LENGTH) return '';
    
    const parsing = parsePlayerInput(input);
    if (!parsing.isValid) return '❌ Invalid';
    
    const icons = {
      'dialogue': '💬 Speech',
      'narration': '🎭 Action', 
      'other_character': '👥 Others',
      'mixed': '🎪 Complex'
    };
    
    return icons[parsing.promptData.inputType] || '📝 General';
  };
    
  const getInputQualityTips = (input) => {
    if (input.trim().length < PLAYER_INPUT_LIMITS.MIN_LENGTH) return [];
    
    const parsing = parsePlayerInput(input);
    const tips = [];
    
    if (parsing.isValid && parsing.promptData.suggestions.length > 0) {
      tips.push(...parsing.promptData.suggestions);
    }
    
    if (input.length > PLAYER_INPUT_LIMITS.RECOMMENDED_LENGTH) {
      tips.push('Consider shortening for better AI understanding');
    }
    
    if (parsing.isValid && parsing.promptData.confidence < 60) {
      tips.push('Try being more specific about your action');
    }
    
    return tips.slice(0, 2); // Limit to 2 tips to avoid clutter
  };

  const getAtmosphericOverlay = () => {
    const characterId = state.selectedCharacter?.id;
    const sceneText = state.currentScene?.narration;
    return getCharacterAtmosphericOverlay(characterId, sceneText);
  };

  // NEW: Test API connection
  const handleTestAPI = async () => {
    try {
      const result = await testOpenAIConnection();
      if (result.success) {
        Alert.alert('✅ API Test Successful', result.message);
      } else {
        Alert.alert('❌ API Test Failed', `${result.error}\n\n${result.suggestion || ''}`);
      }
    } catch (error) {
      Alert.alert('❌ Test Error', error.message);
    }
  };

  // NEW: Test suggestions format
  const handleTestSuggestions = async () => {
    try {
      const result = await testSuggestionsFormat();
      if (result.success) {
        Alert.alert('✅ Suggestions Test', `Response length: ${result.length}\n\nCheck console for full response.`);
      } else {
        Alert.alert('❌ Suggestions Test Failed', result.error);
      }
    } catch (error) {
      Alert.alert('❌ Test Error', error.message);
    }
  };

  // NEW: Test persona meter
  const handleTestPersona = () => {
    const testImpacts = [-15, -5, 0, 5, 15];
    const randomImpact = testImpacts[Math.floor(Math.random() * testImpacts.length)];
    const newScore = state.personaScore + randomImpact;
    
    updatePersonaScore(newScore);
    
    Alert.alert(
      '🎭 Persona Test', 
      `Applied impact: ${randomImpact > 0 ? '+' : ''}${randomImpact}\nOld score: ${state.personaScore}\nNew score: ${Math.max(0, Math.min(100, newScore))}`
    );
  };

  if (!state.currentScene) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Opening the ancient tome...</Text>
      </View>
    );
  }

  const scene = state.currentScene;
  const isGenerating = state.isGeneratingScene || isLoading;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#2C1810" />
      
      {/* TEMPORARILY DISABLED: Energy Status Bar */}
      {false && (
      <View style={styles.energyBar}>
        {state.premiumUser ? (
          <View style={styles.premiumStatus}>
            <Text style={styles.premiumText}>👑 PREMIUM</Text>
            <Text style={styles.premiumSubtext}>Unlimited Energy</Text>
          </View>
        ) : (
          <View style={styles.energyStatus}>
            <Text style={styles.energyText}>⚡ Energy: {state.energy}/{state.maxEnergy}</Text>
            {state.energy === 0 && (
              <TouchableOpacity 
                style={styles.energyButton}
                onPress={() => {
                  const timeLeft = getTimeUntilNextEnergyRefill();
                  Alert.alert(
                    'Energy Options',
                    `Next refill in ${timeLeft.hours}h ${timeLeft.minutes}m`,
                    [
                      { text: 'Watch Ad (+2)', onPress: () => watchAdForEnergy() },
                      { text: 'Go Premium', onPress: () => upgradeToPremium() },
                      { text: 'Wait', style: 'cancel' }
                    ]
                  );
                }}
              >
                <Text style={styles.energyButtonText}>Get More</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      )}
      
      {/* Persona Meter */}
      <PersonaMeter score={state.personaScore} />
      
      {/* Simple Dark Background */}
      <View style={styles.atmosphericBackground}>
        {/* Character/Scene Atmospheric Overlay */}
        <View style={[styles.atmosphericOverlay, { backgroundColor: getAtmosphericOverlay() }]}>
        <View style={styles.bookContainer}>
          <Animated.View 
            style={[
              styles.openBook,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  {
                    rotateY: pageFlipAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '5deg']
                    })
                  }
                ]
              }
            ]}
          >
            {/* Book Spine */}
            <View style={styles.bookSpine} />
            
            <View style={styles.bookPages}>
                {/* Left Page - AI Generated Image Section */}
                <ImageBackground
                  source={VINTAGE_BOOK_LEFT}
                  style={styles.leftPage}
                  imageStyle={styles.pageBackgroundImage}
                >
                  <View style={styles.imagePageContent}>
                    {/* Scene Title at Top */}
                    <View style={styles.imageSectionTitle}>
                      <Text style={styles.sceneTitle}>{scene.title}</Text>
                  </View>

                    {/* Main Scene Image - Larger and More Prominent */}
                    <View style={styles.mainSceneImageContainer}>
                    {isLoadingImage ? (
                      <View style={styles.imageLoading}>
                          <ActivityIndicator size="large" color="#8B4513" />
                        <Text style={styles.imageLoadingText}>Conjuring scene...</Text>
                      </View>
                    ) : sceneImage ? (
                      <Image 
                        source={{ uri: sceneImage }} 
                          style={styles.mainSceneImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                          <Text style={styles.imagePlaceholderText}>🎨</Text>
                          <Text style={styles.placeholderSubtext}>AI Generated Scene</Text>
                      </View>
                    )}
                  </View>
                  
                    {/* Character Info at Bottom */}
                    <View style={styles.characterInfoSection}>
                      <CharacterPortrait
                        characterId={state.selectedCharacter?.id}
                        visible={!isGenerating}
                        style={styles.compactPortrait}
                        emotionData={characterEmotionData}
                      />
                      <View style={styles.characterDetails}>
                        <Text style={styles.characterName}>
                          {state.selectedCharacter?.name || 'Unknown Character'}
                        </Text>
                        <Text style={styles.chapterText}>
                          Chapter {state.totalChoicesMade + 1}
                        </Text>
                        
                        {/* Current Emotion Display */}
                        {characterEmotionData && characterEmotionData.emotions && (
                          <View style={styles.currentEmotionDisplay}>
                            <Text style={styles.emotionBadgeText}>
                              {getEmotionEmoji(characterEmotionData.emotions[0])} {characterEmotionData.emotions[0]}
                            </Text>
                  </View>
                        )}
                </View>
              </View>
                  </View>
                </ImageBackground>

                {/* Right Page - Story Text Section */}
                <ImageBackground
                  source={VINTAGE_BOOK_RIGHT}
                  style={styles.rightPage}
                  imageStyle={styles.pageBackgroundImage}
                >
                <ScrollView 
                  style={styles.rightPageScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.rightPageContent}
                >
                  {/* Story Text */}
                  <TypewriterText
                    text={scene.narration}
                    speed={30}
                    onComplete={() => {}}
                    style={styles.storyText}
                    disabled={isGenerating}
                  />

                  {/* Loading State for AI Generation */}
                  {isGenerating && (
                    <View style={styles.generatingContainer}>
                      <ActivityIndicator size="small" color="#8B4513" />
                      <Text style={styles.generatingText}>
                        The story weaves onward...
                      </Text>
                    </View>
                  )}

                  {/* Player Input Section */}
                  {!isGenerating && showChoices && (
                    <Animated.View 
                      style={[
                        styles.inputContainer,
                        {
                          opacity: showChoices ? 1 : 0,
                          transform: [{ translateY: showChoices ? 0 : 20 }]
                        }
                      ]}
                    >
                      <Text style={styles.inputHeader}>What do you do?</Text>
                      <Text style={styles.inputSubtext}>Write your action or decision as {state.currentStory?.character}:</Text>
                      
                      <TextInput
                        style={styles.textInput}
                        placeholder={`I decide to...`}
                        placeholderTextColor="#A0826D"
                        value={playerInput}
                          onChangeText={handleInputChange}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                          maxLength={PLAYER_INPUT_LIMITS.MAX_LENGTH}
                        />
                        
                        {/* Character Count and Input Type Display */}
                        <View style={styles.inputMetadata}>
                          <Text style={[
                            styles.characterCount,
                            playerInput.length > PLAYER_INPUT_LIMITS.WARNING_LENGTH && styles.characterCountWarning,
                            playerInput.length >= PLAYER_INPUT_LIMITS.MAX_LENGTH && styles.characterCountDanger
                          ]}>
                            {playerInput.length}/{PLAYER_INPUT_LIMITS.MAX_LENGTH}
                          </Text>
                          
                          {playerInput.trim().length >= PLAYER_INPUT_LIMITS.MIN_LENGTH && (
                            <Text style={styles.inputTypeIndicator}>
                              {getInputTypeDisplay(playerInput)}
                            </Text>
                          )}
                        </View>
                        
                        {/* Input Quality Tips */}
                        {playerInput.trim().length > 0 && (
                          <View style={styles.inputTips}>
                            {getInputQualityTips(playerInput).map((tip, index) => (
                              <Text key={index} style={styles.inputTip}>💡 {tip}</Text>
                            ))}
                          </View>
                        )}

                        {/* NEW: Advanced Features Toggle */}
                        <TouchableOpacity
                          style={styles.advancedToggle}
                          onPress={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
                        >
                          <Text style={styles.advancedToggleText}>
                            {showAdvancedFeatures ? '🔽' : '▶️'} Advanced AI Features
                          </Text>
                        </TouchableOpacity>

                        {/* NEW: Enhanced AI Features */}
                        {showAdvancedFeatures && (
                          <View style={styles.advancedFeaturesContainer}>
                            {/* Real-time Input Analysis */}
                            <InputAnalysisPanel 
                              inputText={playerInput}
                              analysisData={inputAnalysisData}
                            />
                            
                            {/* Character Emotion Display */}
                            {characterEmotionData && (
                              <CharacterEmotionDisplay 
                                emotionData={characterEmotionData}
                                characterId={state.selectedCharacter?.id}
                              />
                            )}
                            
                            {/* Scene Atmosphere Controls */}
                            <AtmosphereControls 
                              onAtmosphereChange={handleAtmosphereChange}
                              currentAtmosphere={currentAtmosphere}
                            />
                            
                            {/* Real-time Analysis Toggle */}
                            <View style={styles.featureToggle}>
                              <TouchableOpacity
                                style={[styles.toggleButton, realTimeAnalysis && styles.toggleButtonActive]}
                                onPress={() => setRealTimeAnalysis(!realTimeAnalysis)}
                              >
                                <Text style={[styles.toggleText, realTimeAnalysis && styles.toggleTextActive]}>
                                  {realTimeAnalysis ? '✅' : '⬜'} Real-time Analysis
                                </Text>
                              </TouchableOpacity>
                            </View>
                            
                            {/* API Test Button */}
                            <View style={styles.featureToggle}>
                              <TouchableOpacity
                                style={styles.toggleButton}
                                onPress={handleTestAPI}
                              >
                                <Text style={styles.toggleText}>
                                  🔧 Test OpenAI Connection
                                </Text>
                              </TouchableOpacity>
                            </View>
                            
                            {/* Suggestions Format Test Button */}
                            <View style={styles.featureToggle}>
                              <TouchableOpacity
                                style={styles.toggleButton}
                                onPress={handleTestSuggestions}
                              >
                                <Text style={styles.toggleText}>
                                  🧪 Test Suggestions Format
                                </Text>
                              </TouchableOpacity>
                            </View>
                            
                            {/* Persona Meter Test Button */}
                            <View style={styles.featureToggle}>
                              <TouchableOpacity
                                style={styles.toggleButton}
                                onPress={handleTestPersona}
                              >
                                <Text style={styles.toggleText}>
                                  🎭 Test Persona Meter
                                </Text>
                              </TouchableOpacity>
                            </View>
                            
                            {/* Phase 5: Trait Matrix Button */}
                            {state.traitMatrixInitialized && (
                              <View style={styles.featureToggle}>
                                <TouchableOpacity
                                  style={[styles.toggleButton, styles.traitMatrixButton]}
                                  onPress={() => setShowTraitMatrix(true)}
                                >
                                  <Text style={[styles.toggleText, styles.traitMatrixButtonText]}>
                                    🧠 Character Trait Matrix
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        )}
                      
                      <View style={styles.actionButtons}>
                        <TouchableOpacity 
                          style={styles.helpButton}
                          onPress={handleGetAISuggestions}
                          disabled={isLoadingSuggestions}
                        >
                          {isLoadingSuggestions ? (
                            <ActivityIndicator size="small" color="#8B4513" />
                          ) : (
                            <>
                              <Text style={styles.helpButtonText}>💭 Get AI Help</Text>
                            </>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={styles.settingsButton}
                          onPress={() => setShowFreedomSlider(!showFreedomSlider)}
                        >
                          <Text style={styles.settingsButtonText}>⚙️ Story Freedom</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[
                            styles.actionButton,
                            (!playerInput.trim() || isGenerating) && styles.actionButtonDisabled
                          ]}
                          onPress={handlePlayerAction}
                          disabled={!playerInput.trim() || isGenerating}
                        >
                          <Text style={[
                            styles.actionButtonText,
                            (!playerInput.trim() || isGenerating) && styles.actionButtonTextDisabled
                          ]}>
                            ➤ Continue Story
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Freedom Slider */}
                      {showFreedomSlider && (
                        <FreedomSlider
                          value={freedomLevel}
                          onValueChange={setFreedomLevel}
                          disabled={isGenerating}
                        />
                      )}

                      {/* AI Suggestions */}
                      {showSuggestions && suggestedChoices.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                          <Text style={styles.suggestionsHeader}>AI Suggestions:</Text>
                          {suggestedChoices.map((suggestion, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.suggestionButton}
                              onPress={() => handleSelectSuggestion(suggestion)}
                            >
                              <Text style={styles.suggestionText}>{suggestion}</Text>
                            </TouchableOpacity>
                          ))}
                          <TouchableOpacity
                            style={styles.closeSuggestions}
                            onPress={() => setShowSuggestions(false)}
                          >
                            <Text style={styles.closeSuggestionsText}>✕ Close suggestions</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </Animated.View>
                  )}
                </ScrollView>
                </ImageBackground>
            </View>
          </Animated.View>
        </View>
        </View>
      </View>
      
      {/* Phase 5: Trait Matrix Screen */}
      <TraitMatrixScreen
        visible={showTraitMatrix}
        onClose={() => setShowTraitMatrix(false)}
        storyId={state.currentStory?.id}
        characterName={state.selectedCharacter?.name}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C1810',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2C1810',
  },
  loadingText: {
    color: '#D4AF37',
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
    fontFamily: 'serif',
    fontStyle: 'italic',
  },
  atmosphericBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  openBook: {
    width: width > 768 ? Math.min(width * 0.9, 900) : width * 0.95,
    height: width > 768 ? Math.min(height * 0.8, 600) : height * 0.85,
    flexDirection: 'row',
    boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.3)',
    elevation: 15,
  },
  bookSpine: {
    width: 8,
    backgroundColor: '#654321',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    boxShadow: '-2px 0px 4px rgba(0, 0, 0, 0.5)',
  },
  bookPages: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F5F1E8',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
  },
  leftPage: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#E0D5C7',
    position: 'relative',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    overflow: 'hidden',
  },
  rightPage: {
    flex: 1,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
  },
  pageBackgroundImage: {
    borderRadius: 8,
    opacity: 0.8,
  },
  imagePageContent: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  imageSectionTitle: {
    borderTopWidth: 2,
    borderTopColor: '#D4AF37',
    paddingTop: 15,
    marginBottom: 15,
  },
  mainSceneImageContainer: {
    flex: 1,
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
    elevation: 5,
  },
  mainSceneImage: {
    width: '100%',
    height: '100%',
  },
  imageLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EAE0D2',
  },
  imageLoadingText: {
    color: '#8B4513',
    fontSize: 14,
    marginTop: 10,
    fontStyle: 'italic',
    fontFamily: 'serif',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EAE0D2',
  },
  imagePlaceholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#8B4513',
    fontStyle: 'italic',
    fontFamily: 'serif',
  },
  characterInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  compactPortrait: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: 10,
  },
  characterDetails: {
    flexDirection: 'column',
  },
  characterName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C1810',
    textAlign: 'center',
    fontFamily: 'serif',
  },
  chapterText: {
    fontSize: 12,
    color: '#A0826D',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 2,
  },
  storyText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#2C1810',
    textAlign: 'justify',
    fontFamily: 'serif',
    letterSpacing: 0.3,
    marginBottom: 25,
  },
  generatingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  generatingText: {
    color: '#8B4513',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: 'serif',
  },
  inputContainer: {
    marginTop: 20,
  },
  inputHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C1810',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'serif',
    letterSpacing: 0.5,
  },
  inputSubtext: {
    fontSize: 14,
    color: '#8B4513',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 15,
    fontFamily: 'serif',
  },
  textInput: {
    backgroundColor: 'rgba(245, 241, 232, 0.95)',
    borderWidth: 2,
    borderColor: '#D4AF37',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#2C1810',
    fontFamily: 'serif',
    lineHeight: 22,
    minHeight: 80,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  helpButton: {
    flex: 1,
    backgroundColor: '#5C4033',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    minWidth: 100,
  },
  helpButtonText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: 'bold',
  },
  settingsButton: {
    flex: 1,
    backgroundColor: '#5C4033',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    minWidth: 120,
  },
  settingsButtonText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: '#e85a4f',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginVertical: 8,
    alignItems: 'center',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  actionButtonDisabled: {
    backgroundColor: '#A0826D',
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#F5F1E8',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  actionButtonTextDisabled: {
    color: '#E6D7C3',
  },
  suggestionsContainer: {
    backgroundColor: 'rgba(234, 224, 210, 0.95)',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'serif',
  },
  suggestionButton: {
    backgroundColor: 'rgba(245, 241, 232, 0.95)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionText: {
    color: '#2C1810',
    fontSize: 14,
    fontFamily: 'serif',
    lineHeight: 20,
  },
  closeSuggestions: {
    alignSelf: 'center',
    marginTop: 5,
  },
  closeSuggestionsText: {
    color: '#8B4513',
    fontSize: 12,
    fontStyle: 'italic',
  },
  portraitContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portraitFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: '#D4AF37',
    borderRadius: 50,
  },
  emotionIndicator: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  emotionEmoji: {
    fontSize: 16,
    textAlign: 'center',
  },
  characterPortrait: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  narrativeText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#2C1810',
    textAlign: 'justify',
    fontFamily: 'serif',
    letterSpacing: 0.3,
  },
  cursor: {
    color: '#8B4513',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipHint: {
    color: '#8B4513',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 5,
  },
  energyBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: '#2C1810',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  premiumText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: 'bold',
  },
  premiumSubtext: {
    color: '#D4AF37',
    fontSize: 12,
    fontStyle: 'italic',
  },
  energyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  energyText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: 'bold',
  },
  energyButton: {
    backgroundColor: '#e85a4f',
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  energyButtonText: {
    color: '#F5F1E8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  atmosphericOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sceneTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C1810',
    textAlign: 'center',
    fontFamily: 'serif',
    letterSpacing: 1,
  },
  rightPageScroll: {
    flex: 1,
  },
  rightPageContent: {
    padding: 25,
    paddingTop: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  characterCount: {
    color: '#2C1810',
    fontSize: 14,
    fontWeight: 'bold',
  },
  characterCountWarning: {
    color: '#8B4513',
  },
  characterCountDanger: {
    color: '#e85a4f',
  },
  inputTypeIndicator: {
    color: '#2C1810',
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputTips: {
    marginTop: 10,
  },
  inputTip: {
    color: '#2C1810',
    fontSize: 14,
    marginBottom: 5,
  },
  inputAnalysisPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
    marginRight: 10,
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
    marginRight: 5,
  },
  typeText: {
    color: '#8B4513',
    fontSize: 14,
  },
  confidenceBar: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 2,
  },
  confidenceText: {
    color: '#F5F1E8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  componentsSection: {
    marginTop: 10,
  },
  componentText: {
    color: '#2C1810',
    fontSize: 14,
    marginBottom: 5,
  },
  emotionDisplay: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emotionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 10,
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#D4AF37',
    borderRadius: 8,
    padding: 8,
  },
  emotionText: {
    color: '#2C1810',
    fontSize: 14,
  },
  intensityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  intensityLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B4513',
    marginRight: 10,
  },
  intensityTrack: {
    flex: 1,
    backgroundColor: '#D4AF37',
    borderRadius: 8,
    height: 10,
  },
  intensityFill: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    height: '100%',
  },
  intensityValue: {
    color: '#2C1810',
    fontSize: 14,
    fontWeight: 'bold',
  },
  atmosphereControls: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  atmosphereTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 10,
  },
  atmosphereScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  atmosphereOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#D4AF37',
    borderRadius: 8,
    padding: 8,
  },
  atmosphereOptionActive: {
    backgroundColor: '#D4AF37',
  },
  atmosphereIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C1810',
  },
  atmosphereName: {
    color: '#2C1810',
    fontSize: 14,
  },
  atmosphereNameActive: {
    fontWeight: 'bold',
  },
  advancedToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  advancedToggleText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: 'bold',
  },
  advancedFeaturesContainer: {
    marginTop: 10,
  },
  featureToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  toggleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#D4AF37',
  },
  toggleText: {
    color: '#2C1810',
    fontSize: 14,
    fontWeight: 'bold',
  },
  toggleTextActive: {
    fontWeight: 'bold',
  },
  currentEmotionDisplay: {
    alignItems: 'center',
    marginTop: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  emotionBadgeText: {
    color: '#2C1810',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Phase 5: Trait Matrix Button Styles
  traitMatrixButton: {
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    borderWidth: 2,
    borderColor: '#4a90e2',
  },
  traitMatrixButtonText: {
    color: '#4a90e2',
    fontWeight: 'bold',
  },
}); 