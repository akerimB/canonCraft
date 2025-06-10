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
  BackHandler,
} from 'react-native';
import { 
  MessageCircle, 
  Play, 
  Brain, 
  Eye, 
  Sparkles, 
  FileText, 
  X, 
  Zap, 
  Crown,
  Palette,
  Loader,
  CheckCircle,
  AlertCircle,
  Menu,
  HelpCircle,
  Settings,
  ArrowRight,
  Theater,
  Lightbulb,
  TestTube,
  Wrench,
  FlaskConical
} from 'lucide-react-native';
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
import PredictiveAIScreen from './PredictiveAIScreen';
import ImmersiveMediaScreen from './ImmersiveMediaScreen';
import CreatorToolsScreen from './CreatorToolsScreen';
import AnimalCompanionsScreen from './AnimalCompanionsScreen';
import InventoryScreen from './InventoryScreen';
import NavigationSidebar from './NavigationSidebar';
import { LinearGradient } from 'expo-linear-gradient';

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
      case 'dialogue': return <MessageCircle size={16} color="#6B7280" />;
      case 'narration': return <Theater size={16} color="#6B7280" />;
      case 'other_character': return <Crown size={16} color="#6B7280" />;
      case 'mixed': return <Sparkles size={16} color="#6B7280" />;
      default: return <FileText size={16} color="#6B7280" />;
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
          <View style={styles.typeIcon}>{getTypeIcon(analysisData.inputType)}</View>
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
    { id: 'auto', name: 'Auto', icon: Theater, description: 'AI-determined mood' },
    { id: 'mysterious', name: 'Mysterious', icon: Eye, description: 'Foggy, enigmatic' },
    { id: 'dramatic', name: 'Dramatic', icon: Zap, description: 'Intense, theatrical' },
    { id: 'romantic', name: 'Romantic', icon: Sparkles, description: 'Warm, intimate' },
    { id: 'dark', name: 'Dark', icon: Palette, description: 'Gothic, ominous' },
    { id: 'bright', name: 'Bright', icon: Crown, description: 'Light, optimistic' }
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
            <View style={styles.atmosphereIcon}>
              <option.icon size={20} color={currentAtmosphere === option.id ? "#FFFFFF" : "#6B7280"} />
            </View>
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
  const [realTimeAnalysis, setRealTimeAnalysis] = useState(true);
  
  // Phase 5: Trait Matrix Screen state
  const [showTraitMatrix, setShowTraitMatrix] = useState(false);
  const [showPredictiveAI, setShowPredictiveAI] = useState(false);
  const [showImmersiveMedia, setShowImmersiveMedia] = useState(false);
  const [showCreatorTools, setShowCreatorTools] = useState(false);
  const [showAnimalCompanions, setShowAnimalCompanions] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pageFlipAnim = useRef(new Animated.Value(0)).current;

  const [isAnimalCompanionsVisible, setAnimalCompanionsVisible] = useState(false);
  const [isInventoryVisible, setInventoryVisible] = useState(false);
  
  const scrollViewRef = useRef();

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
      const imageUrl = await generateSceneImage(state.selectedCharacter, state.currentScene, 'illustration, minimalist, vector art');
      setSceneImage(imageUrl);
    } catch (error) {
      console.error('Error loading scene image:', error);
      setSceneImage(null); // Set to null to show placeholder on error
    } finally {
      setIsLoadingImage(false);
    }
  };

  const handlePlayerAction = async () => {
    if (!playerInput.trim()) {
      Alert.alert('Input Required', 'Please describe what you do next.');
      return;
    }
    setIsLoading(true);
    try {
      const customChoice = { text: playerInput, choice_id: 'custom' };
      await generateNextScene(customChoice, 50); // Using a default freedom level
      setPlayerInput('');
    } catch (error) {
      console.error('Error generating next scene:', error);
      Alert.alert('Error', 'Failed to generate the next scene. Please try again.');
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
    
    const typeConfig = {
      'dialogue': { icon: MessageCircle, label: 'Speech' },
      'action': { icon: Play, label: 'Action' }, 
      'internal': { icon: Brain, label: 'Thought' },
      'observation': { icon: Eye, label: 'Observe' },
      'mixed': { icon: Sparkles, label: 'Complex' }
    };
    
    const config = typeConfig[parsing.promptData?.type] || { icon: FileText, label: 'General' };
    const IconComponent = config.icon;
    
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconComponent size={16} color="#8b9dc3" style={{ marginRight: 4 }} />
        <Text style={{ color: '#8b9dc3', fontSize: 12 }}>{config.label}</Text>
      </View>
    );
  };
    
  const getInputQualityTips = (input) => {
    if (input.trim().length < PLAYER_INPUT_LIMITS.MIN_LENGTH) return [];
    
    const parsing = parsePlayerInput(input);
    const tips = [];
    
    // Generate tips based on the analysis data
    if (parsing.isValid && parsing.promptData) {
      const { confidence, type, hasMotivation, isDetailed, emotionalWords } = parsing.promptData;
      
      if (confidence < 0.6) {
        tips.push('Try being more specific about your action');
      }
      
      if (!hasMotivation && type === 'action') {
        tips.push('Consider adding "because" or "since" to explain motivation');
      }
      
      if (emotionalWords === 0 && input.length > 30) {
        tips.push('Add emotional depth to your character\'s actions');
      }
      
      if (!isDetailed && input.length < 50) {
        tips.push('Provide more detail about what your character does');
      }
    }
    
    if (input.length > PLAYER_INPUT_LIMITS.RECOMMENDED_LENGTH) {
      tips.push('Consider shortening for better AI understanding');
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

  const handleExit = () => {
    Alert.alert(
      "Exit Game",
      "Are you sure you want to exit to the main menu?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes, Exit", onPress: () => navigation.navigate('Menu') }
      ]
    );
  };

  if (!state.currentScene) {
    return (
      <LinearGradient colors={['#E94E66', '#A34ED1']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading Your Story...</Text>
      </LinearGradient>
    );
  }

  const scene = state.currentScene;
  const isGenerating = state.isGeneratingScene || isLoading;

  return (
    <LinearGradient colors={['#E94E66', '#A34ED1']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <PersonaMeter 
        score={state.personaScore} 
        avatarUri={state.selectedCharacter?.portrait} 
      />
      <View style={styles.mainContent}>
        <ScrollView contentContainerStyle={styles.centerContent}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>SCENE VISUAL</Text>
            <View style={styles.imageContainer}>
              {isLoadingImage ? (
                <ActivityIndicator size="large" color="#E94E66" />
              ) : sceneImage ? (
                <Image source={{ uri: sceneImage }} style={styles.sceneImage} resizeMode="cover" />
              ) : (
                <View style={styles.imagePlaceholder}><Text>🎨</Text></View>
              )}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>SCENE TEXT</Text>
            <ScrollView style={styles.narrativeScrollView}>
                <Text style={styles.narrativeText}>{scene.narration}</Text>
            </ScrollView>
            <TextInput
              style={styles.textInput}
              placeholder="What do you do next?"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={playerInput}
              onChangeText={setPlayerInput}
              editable={!isGenerating}
            />
            <TouchableOpacity
              style={[styles.continueButton, (isGenerating || !playerInput.trim()) && styles.disabledButton]}
              onPress={handlePlayerAction}
              disabled={isGenerating || !playerInput.trim()}
            >
              {isGenerating ? (
                <ActivityIndicator color="#E94E66" />
              ) : (
                <>
                  <Text style={styles.continueButtonText}>CONTINUE</Text>
                  <ArrowRight size={18} color="#E94E66" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        <NavigationSidebar
          onNavigate={navigation.navigate}
          onShowPersona={() => setShowTraitMatrix(true)}
          onShowMetrics={() => setShowCreatorTools(true)}
          onExit={handleExit}
        />
      </View>

      <TraitMatrixScreen
        visible={showTraitMatrix}
        onClose={() => setShowTraitMatrix(false)}
        storyId={state.currentStory?.id}
        characterName={state.selectedCharacter?.name}
      />
      <CreatorToolsScreen
        visible={showCreatorTools}
        onClose={() => setShowCreatorTools(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 15,
    fontSize: 16,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  centerContent: {
    flexGrow: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    width: 380,
    height: 500,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  imageContainer: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sceneImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    fontSize: 50,
  },
  narrativeScrollView: {
    flex: 1,
    marginBottom: 15,
  },
  narrativeText: {
    fontSize: 17,
    color: '#FFFFFF',
    lineHeight: 26,
  },
  textInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 15,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  continueButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 15,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
  },
  disabledButton: {
    backgroundColor: '#A9A9A9',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pageCounter: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageCounterText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
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
}); 