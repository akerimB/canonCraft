/**
 * Phase 7: Immersive Media Screen
 * Advanced multimedia controls and settings for voice, visuals, and ambient audio
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Alert,
  ActivityIndicator,
  Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Mic, 
  Play, 
  VolumeX, 
  Volume1, 
  Volume2, 
  Gauge, 
  VolumeOff, 
  Palette, 
  Wand2, 
  ArrowLeft, 
  Film,
  X
} from 'lucide-react-native';
import { useGame } from './gameContext';
import { immersiveMediaService } from '../services/immersiveMediaService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ImmersiveMediaScreen = ({ visible, onClose, characterPack }) => {
  const { state } = useGame();
  
  // Screen states
  const [activeTab, setActiveTab] = useState('voice');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  // Media settings
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [ambientEnabled, setAmbientEnabled] = useState(true);
  const [visualsEnabled, setVisualsEnabled] = useState(true);
  const [voiceVolume, setVoiceVolume] = useState(0.8);
  const [ambientVolume, setAmbientVolume] = useState(0.6);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  
  // Interactive states
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isPlayingAmbient, setIsPlayingAmbient] = useState(false);
  const [currentAmbientTheme, setCurrentAmbientTheme] = useState('regency_estate');
  const [visualFiltersActive, setVisualFiltersActive] = useState(false);
  
  // Character voice data
  const [characterVoice, setCharacterVoice] = useState(null);
  const [voicePreview, setVoicePreview] = useState(null);

  useEffect(() => {
    if (visible && !initialized) {
      initializeImmersiveMedia();
    }
  }, [visible]);

  const initializeImmersiveMedia = async () => {
    setLoading(true);
    try {
      const preferences = {
        voiceEnabled,
        ambientEnabled,
        visualsEnabled
      };
      
      const success = await immersiveMediaService.initializeImmersiveMedia(characterPack, preferences);
      if (success) {
        setInitialized(true);
        loadMediaSettings();
      } else {
        Alert.alert('Initialization Failed', 'Failed to initialize immersive media system.');
      }
    } catch (error) {
      console.error('Failed to initialize immersive media:', error);
      Alert.alert('Error', 'Failed to initialize immersive media system.');
    } finally {
      setLoading(false);
    }
  };

  const loadMediaSettings = () => {
    const settings = immersiveMediaService.getMediaSettings();
    setVoiceEnabled(settings.voiceEnabled);
    setAmbientEnabled(settings.ambientEnabled);
    setVisualsEnabled(settings.visualsEnabled);
  };

  const handleVoiceEnabledChange = (enabled) => {
    setVoiceEnabled(enabled);
    immersiveMediaService.setVoiceEnabled(enabled);
  };

  const handleAmbientEnabledChange = (enabled) => {
    setAmbientEnabled(enabled);
    immersiveMediaService.setAmbientEnabled(enabled);
    if (!enabled && isPlayingAmbient) {
      setIsPlayingAmbient(false);
    }
  };

  const handleVisualsEnabledChange = (enabled) => {
    setVisualsEnabled(enabled);
    immersiveMediaService.setVisualsEnabled(enabled);
  };

  const playVoicePreview = async () => {
    setIsPlayingVoice(true);
    try {
      const sampleText = characterPack.name === 'sherlock_holmes' 
        ? "The game is afoot, Watson. The smallest details often reveal the greatest mysteries."
        : characterPack.name === 'dracula'
        ? "Welcome to my castle. Enter freely and of your own will."
        : characterPack.name === 'elizabeth_bennet'
        ? "I declare there is nothing so refreshing as the morning air and good conversation."
        : characterPack.name === 'hamlet'
        ? "To be or not to be, that is the question that haunts my very soul."
        : "I am pleased to make your acquaintance in this immersive experience.";

      const audioUrl = await immersiveMediaService.generateCharacterVoice(
        characterPack.id,
        sampleText,
        { primaryEmotion: 'thoughtful', intensity: 60 }
      );
      
      if (audioUrl) {
        setVoicePreview(audioUrl);
        // Play the audio (simplified for demo)
        setTimeout(() => setIsPlayingVoice(false), 3000);
      }
    } catch (error) {
      console.error('Failed to play voice preview:', error);
      Alert.alert('Error', 'Failed to play voice preview.');
    } finally {
      setTimeout(() => setIsPlayingVoice(false), 3000);
    }
  };

  const playAmbientPreview = async () => {
    setIsPlayingAmbient(true);
    try {
      const sceneData = {
        narration: "A peaceful moment in the story unfolds with gentle atmosphere."
      };
      
      await immersiveMediaService.startAmbientAudio(sceneData, characterPack.id);
      
      // Stop after 10 seconds for preview
      setTimeout(async () => {
        await immersiveMediaService.stopAmbientAudio();
        setIsPlayingAmbient(false);
      }, 10000);
    } catch (error) {
      console.error('Failed to play ambient preview:', error);
      Alert.alert('Error', 'Failed to play ambient preview.');
    }
  };

  const stopAmbientPreview = async () => {
    await immersiveMediaService.stopAmbientAudio();
    setIsPlayingAmbient(false);
  };

  const toggleVisualFilters = () => {
    setVisualFiltersActive(!visualFiltersActive);
  };

  const getTabIcon = (tabKey, isActive) => {
    const color = isActive ? '#ffffff' : '#8b9dc3';
    const iconMap = {
      'voice': Mic,
      'ambient': VolumeOff,
      'visual': Palette,
      'effects': Wand2
    };
    const IconComponent = iconMap[tabKey] || Mic;
    return <IconComponent size={20} color={color} />;
  };

  const renderTabButton = (tabKey, title, icon) => {
    const isActive = activeTab === tabKey;
    return (
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.activeTabButton]}
        onPress={() => setActiveTab(tabKey)}
      >
        {getTabIcon(tabKey, isActive)}
        <Text style={[styles.tabButtonText, isActive && styles.activeTabButtonText]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderVoiceTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Character Voice Synthesis</Text>
        <Text style={styles.sectionSubtitle}>AI-powered character voices with emotion</Text>
      </View>

      {/* Voice Enable Toggle */}
      <View style={styles.settingCard}>
        <View style={styles.settingHeader}>
          <Mic size={24} color="#4facfe" />
          <Text style={styles.settingTitle}>Voice Synthesis</Text>
          <Switch
            value={voiceEnabled}
            onValueChange={handleVoiceEnabledChange}
            thumbColor={voiceEnabled ? '#4facfe' : '#8b9dc3'}
            trackColor={{ false: '#34495e', true: '#4facfe88' }}
          />
        </View>
        <Text style={styles.settingDescription}>
          Enable AI-generated character voices with emotion-based adjustments
        </Text>
      </View>

      {voiceEnabled && (
        <>
          {/* Character Voice Preview */}
          <View style={styles.voicePreviewCard}>
            <Text style={styles.voicePreviewTitle}>Character Voice: {characterPack.name}</Text>
            <View style={styles.voiceControls}>
              <TouchableOpacity
                style={[styles.playButton, isPlayingVoice && styles.playButtonActive]}
                onPress={playVoicePreview}
                disabled={isPlayingVoice}
              >
                <LinearGradient
                  colors={isPlayingVoice ? ['#e74c3c', '#c0392b'] : ['#4facfe', '#00f2fe']}
                  style={styles.playButtonGradient}
                >
                  {isPlayingVoice ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Play size={20} color="#ffffff" />
                      <Text style={styles.playButtonText}>Preview Voice</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
            
            {/* Voice Characteristics */}
            <View style={styles.voiceCharacteristics}>
              <Text style={styles.characteristicTitle}>Voice Profile</Text>
              <View style={styles.characteristicTags}>
                <View style={styles.characteristicTag}>
                  <Text style={styles.characteristicText}>
                    {characterPack.name === 'sherlock_holmes' ? 'British Intellectual' :
                     characterPack.name === 'dracula' ? 'Aristocratic Menacing' :
                     characterPack.name === 'elizabeth_bennet' ? 'Spirited Refined' :
                     characterPack.name === 'hamlet' ? 'Melancholic Poetic' :
                     'Warm Conversational'}
                  </Text>
                </View>
                <View style={styles.characteristicTag}>
                  <Text style={styles.characteristicText}>Emotion-Adaptive</Text>
                </View>
                <View style={styles.characteristicTag}>
                  <Text style={styles.characteristicText}>Context-Aware</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Voice Settings */}
          <View style={styles.settingCard}>
            <Text style={styles.settingTitle}>Voice Volume</Text>
            <View style={styles.sliderContainer}>
              <Volume1 size={20} color="#8b9dc3" />
              <View style={styles.sliderTrack}>
                <View 
                  style={[
                    styles.sliderFill, 
                    { width: `${voiceVolume * 100}%` }
                  ]} 
                />
                <TouchableOpacity
                  style={[
                    styles.sliderThumb,
                    { left: `${voiceVolume * 90}%` }
                  ]}
                  onPress={() => {
                    // Simple increment/decrement for demo
                    const newValue = voiceVolume >= 0.9 ? 0 : voiceVolume + 0.1;
                    setVoiceVolume(newValue);
                  }}
                />
              </View>
              <Volume2 size={20} color="#8b9dc3" />
            </View>
            <Text style={styles.sliderValue}>{Math.round(voiceVolume * 100)}%</Text>
          </View>

          <View style={styles.settingCard}>
            <Text style={styles.settingTitle}>Voice Speed</Text>
            <View style={styles.sliderContainer}>
              <Gauge size={20} color="#8b9dc3" />
              <View style={styles.sliderTrack}>
                <View 
                  style={[
                    styles.sliderFill, 
                    { width: `${((voiceSpeed - 0.5) / 1.0) * 100}%` }
                  ]} 
                />
                <TouchableOpacity
                  style={[
                    styles.sliderThumb,
                    { left: `${((voiceSpeed - 0.5) / 1.0) * 90}%` }
                  ]}
                  onPress={() => {
                    // Simple increment/decrement for demo
                    const newValue = voiceSpeed >= 1.4 ? 0.5 : voiceSpeed + 0.1;
                    setVoiceSpeed(newValue);
                  }}
                />
              </View>
              <Gauge size={20} color="#8b9dc3" />
            </View>
            <Text style={styles.sliderValue}>{voiceSpeed.toFixed(1)}x</Text>
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderAmbientTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Ambient Audio</Text>
        <Text style={styles.sectionSubtitle}>Immersive environmental soundscapes</Text>
      </View>

      {/* Ambient Enable Toggle */}
      <View style={styles.settingCard}>
        <View style={styles.settingHeader}>
          <VolumeOff size={24} color="#00f2fe" />
          <Text style={styles.settingTitle}>Ambient Audio</Text>
          <Switch
            value={ambientEnabled}
            onValueChange={handleAmbientEnabledChange}
            thumbColor={ambientEnabled ? '#00f2fe' : '#8b9dc3'}
            trackColor={{ false: '#34495e', true: '#00f2fe88' }}
          />
        </View>
        <Text style={styles.settingDescription}>
          Dynamic environmental audio that adapts to scenes and character settings
        </Text>
      </View>

      {ambientEnabled && (
        <>
          {/* Ambient Preview */}
          <View style={styles.ambientPreviewCard}>
            <Text style={styles.ambientPreviewTitle}>Environmental Soundscape</Text>
            <View style={styles.ambientControls}>
              <TouchableOpacity
                style={[styles.playButton, isPlayingAmbient && styles.playButtonActive]}
                onPress={isPlayingAmbient ? stopAmbientPreview : playAmbientPreview}
              >
                <LinearGradient
                  colors={isPlayingAmbient ? ['#e74c3c', '#c0392b'] : ['#00f2fe', '#4facfe']}
                  style={styles.playButtonGradient}
                >
                  <Ionicons 
                    name={isPlayingAmbient ? "stop" : "play"} 
                    size={20} 
                    color="#ffffff" 
                  />
                  <Text style={styles.playButtonText}>
                    {isPlayingAmbient ? 'Stop Ambient' : 'Preview Ambient'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            
            {/* Ambient Themes */}
            <View style={styles.ambientThemes}>
              <Text style={styles.themeTitle}>Available Themes</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.themeGrid}>
                  {[
                    { id: 'victorian_london', name: 'Victorian London', icon: '🌫️' },
                    { id: 'gothic_castle', name: 'Gothic Castle', icon: '🏰' },
                    { id: 'regency_estate', name: 'Regency Estate', icon: '🌳' },
                    { id: 'medieval_court', name: 'Medieval Court', icon: '👑' },
                    { id: 'ship_deck', name: 'Ship Deck', icon: '⛵' },
                    { id: 'moor_landscape', name: 'Moor Landscape', icon: '🌾' }
                  ].map(theme => (
                    <TouchableOpacity
                      key={theme.id}
                      style={[
                        styles.themeCard,
                        currentAmbientTheme === theme.id && styles.themeCardActive
                      ]}
                      onPress={() => setCurrentAmbientTheme(theme.id)}
                    >
                      <Text style={styles.themeIcon}>{theme.icon}</Text>
                      <Text style={styles.themeName}>{theme.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Ambient Volume */}
          <View style={styles.settingCard}>
            <Text style={styles.settingTitle}>Ambient Volume</Text>
            <View style={styles.sliderContainer}>
              <Volume1 size={20} color="#8b9dc3" />
              <View style={styles.sliderTrack}>
                <View 
                  style={[
                    styles.sliderFill, 
                    { width: `${ambientVolume * 100}%`, backgroundColor: '#00f2fe' }
                  ]} 
                />
                <TouchableOpacity
                  style={[
                    styles.sliderThumb,
                    { left: `${ambientVolume * 90}%` }
                  ]}
                  onPress={() => {
                    // Simple increment/decrement for demo
                    const newValue = ambientVolume >= 0.9 ? 0 : ambientVolume + 0.1;
                    setAmbientVolume(newValue);
                  }}
                />
              </View>
              <Volume2 size={20} color="#8b9dc3" />
            </View>
            <Text style={styles.sliderValue}>{Math.round(ambientVolume * 100)}%</Text>
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderVisualsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Visual Enhancements</Text>
        <Text style={styles.sectionSubtitle}>AI-generated scenes and dynamic filters</Text>
      </View>

      {/* Visuals Enable Toggle */}
      <View style={styles.settingCard}>
        <View style={styles.settingHeader}>
          <Palette size={24} color="#667eea" />
          <Text style={styles.settingTitle}>Visual Enhancements</Text>
          <Switch
            value={visualsEnabled}
            onValueChange={handleVisualsEnabledChange}
            thumbColor={visualsEnabled ? '#667eea' : '#8b9dc3'}
            trackColor={{ false: '#34495e', true: '#667eea88' }}
          />
        </View>
        <Text style={styles.settingDescription}>
          AI-generated scene illustrations and emotion-responsive visual filters
        </Text>
      </View>

      {visualsEnabled && (
        <>
          {/* Visual Style Preview */}
          <View style={styles.visualPreviewCard}>
            <Text style={styles.visualPreviewTitle}>Character Visual Style</Text>
            <View style={styles.visualStyleInfo}>
              <View style={styles.styleDetail}>
                <Text style={styles.styleLabel}>Art Style:</Text>
                <Text style={styles.styleValue}>
                  {characterPack.name === 'sherlock_holmes' ? 'Victorian Illustration' :
                   characterPack.name === 'dracula' ? 'Gothic Horror' :
                   characterPack.name === 'elizabeth_bennet' ? 'Regency Watercolor' :
                   characterPack.name === 'hamlet' ? 'Renaissance Painting' :
                   'Romantic Realism'}
                </Text>
              </View>
              <View style={styles.styleDetail}>
                <Text style={styles.styleLabel}>Lighting:</Text>
                <Text style={styles.styleValue}>
                  {characterPack.name === 'sherlock_holmes' ? 'Gaslight' :
                   characterPack.name === 'dracula' ? 'Candlelight' :
                   characterPack.name === 'elizabeth_bennet' ? 'Natural Daylight' :
                   characterPack.name === 'hamlet' ? 'Dramatic Contrast' :
                   'Firelight'}
                </Text>
              </View>
              <View style={styles.styleDetail}>
                <Text style={styles.styleLabel}>Atmosphere:</Text>
                <Text style={styles.styleValue}>
                  {characterPack.name === 'sherlock_holmes' ? 'Mysterious Fog' :
                   characterPack.name === 'dracula' ? 'Ominous Shadows' :
                   characterPack.name === 'elizabeth_bennet' ? 'Pastoral Beauty' :
                   characterPack.name === 'hamlet' ? 'Melancholic Grandeur' :
                   'Intimate Warmth'}
                </Text>
              </View>
            </View>
          </View>

          {/* Dynamic Visual Filters */}
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Wand2 size={24} color="#667eea" />
              <Text style={styles.settingTitle}>Dynamic Emotion Filters</Text>
              <Switch
                value={visualFiltersActive}
                onValueChange={toggleVisualFilters}
                thumbColor={visualFiltersActive ? '#667eea' : '#8b9dc3'}
                trackColor={{ false: '#34495e', true: '#667eea88' }}
              />
            </View>
            <Text style={styles.settingDescription}>
              Automatically adjust visual filters based on character emotions and scene mood
            </Text>
          </View>

          {/* Color Palette Preview */}
          <View style={styles.colorPaletteCard}>
            <Text style={styles.colorPaletteTitle}>Character Color Palette</Text>
            <View style={styles.colorPalette}>
              {(characterPack.name === 'sherlock_holmes' ? ['#2C3E50', '#8B4513', '#D4AF37', '#696969'] :
                characterPack.name === 'dracula' ? ['#8B0000', '#2F4F4F', '#000000', '#C0C0C0'] :
                characterPack.name === 'elizabeth_bennet' ? ['#F5DEB3', '#DDA0DD', '#98FB98', '#87CEEB'] :
                characterPack.name === 'hamlet' ? ['#483D8B', '#8B4513', '#CD853F', '#2F4F4F'] :
                ['#8B4513', '#2F4F4F', '#CD853F', '#696969']).map((color, index) => (
                <View key={index} style={[styles.colorSwatch, { backgroundColor: color }]} />
              ))}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderSettingsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Media Settings</Text>
        <Text style={styles.sectionSubtitle}>Customize your immersive experience</Text>
      </View>

      {/* Performance Settings */}
      <View style={styles.settingCard}>
        <Text style={styles.settingTitle}>Performance</Text>
        <Text style={styles.settingDescription}>
          Immersive media features are optimized for your device. All features are enabled by default.
        </Text>
        <View style={styles.performanceMetrics}>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Voice Cache:</Text>
            <Text style={styles.performanceValue}>Ready</Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Audio System:</Text>
            <Text style={styles.performanceValue}>Initialized</Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Visual Engine:</Text>
            <Text style={styles.performanceValue}>Available</Text>
          </View>
        </View>
      </View>

      {/* Storage Information */}
      <View style={styles.settingCard}>
        <Text style={styles.settingTitle}>Storage & Cache</Text>
        <Text style={styles.settingDescription}>
          Generated voice and ambient audio are cached for better performance.
        </Text>
        <TouchableOpacity style={styles.clearCacheButton}>
          <Text style={styles.clearCacheText}>Clear Media Cache</Text>
        </TouchableOpacity>
      </View>

      {/* Accessibility */}
      <View style={styles.settingCard}>
        <Text style={styles.settingTitle}>Accessibility</Text>
        <Text style={styles.settingDescription}>
          All immersive features are optional and designed to enhance, not replace, the core reading experience.
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2', '#4facfe']}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Immersive Media</Text>
            <Text style={styles.headerSubtitle}>Phase 7: Voice, Visuals & Audio</Text>
          </View>
          <View style={styles.headerIcon}>
            <Film size={24} color="#ffffff" />
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          {renderTabButton('voice', 'Voice', 'record-voice-over')}
          {renderTabButton('ambient', 'Ambient', 'music-note')}
          {renderTabButton('visuals', 'Visuals', 'palette')}
          {renderTabButton('settings', 'Settings', 'settings')}
        </View>

        {/* Content */}
        {loading && !initialized ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Initializing Immersive Media...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'voice' && renderVoiceTab()}
            {activeTab === 'ambient' && renderAmbientTab()}
            {activeTab === 'visuals' && renderVisualsTab()}
            {activeTab === 'settings' && renderSettingsTab()}
          </>
        )}
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e6ed',
    opacity: 0.8,
  },
  headerIcon: {
    padding: 8,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabButtonText: {
    fontSize: 12,
    color: '#8b9dc3',
    marginLeft: 4,
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#e0e6ed',
    opacity: 0.8,
  },
  settingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    marginLeft: 10,
  },
  settingDescription: {
    fontSize: 14,
    color: '#e0e6ed',
    opacity: 0.9,
    lineHeight: 20,
  },
  voicePreviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  voicePreviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  voiceControls: {
    marginBottom: 15,
  },
  playButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  playButtonActive: {
    opacity: 0.8,
  },
  playButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  voiceCharacteristics: {
    marginTop: 10,
  },
  characteristicTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  characteristicTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  characteristicTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  characteristicText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#34495e',
    borderRadius: 3,
    marginHorizontal: 15,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#4facfe',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -7,
    width: 20,
    height: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4facfe',
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 5,
  },
  ambientPreviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  ambientPreviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  ambientControls: {
    marginBottom: 15,
  },
  ambientThemes: {
    marginTop: 10,
  },
  themeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  themeGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  themeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCardActive: {
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  themeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  themeName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  visualPreviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  visualPreviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  visualStyleInfo: {
    gap: 10,
  },
  styleDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  styleLabel: {
    fontSize: 14,
    color: '#e0e6ed',
    fontWeight: '500',
  },
  styleValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  colorPaletteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  colorPaletteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  colorPalette: {
    flexDirection: 'row',
    gap: 10,
  },
  colorSwatch: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  performanceMetrics: {
    marginTop: 15,
    gap: 10,
  },
  performanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: 14,
    color: '#e0e6ed',
  },
  performanceValue: {
    fontSize: 14,
    color: '#4facfe',
    fontWeight: 'bold',
  },
  clearCacheButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  clearCacheText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#ffffff',
    marginTop: 20,
  },
});

export default ImmersiveMediaScreen;