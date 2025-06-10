/**
 * Phase 6: Predictive Character AI Screen
 * Advanced character behavior prediction and psychological analysis interface
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
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  TrendingUp, 
  Zap, 
  BarChart3, 
  Brain, 
  Lightbulb, 
  Trees, 
  X, 
  ArrowLeft,
  Target
} from 'lucide-react-native';
import { useGame } from './gameContext';
import { predictiveCharacterAI, PREDICTION_TYPES } from '../services/predictiveCharacterAI';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PredictiveAIScreen = ({ visible, onClose, characterPack }) => {
  const { state } = useGame();
  const storyId = state.currentStory?.id;
  
  // Screen states
  const [activeTab, setActiveTab] = useState('predictions');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  // Data states
  const [predictions, setPredictions] = useState([]);
  const [behavioralPatterns, setBehavioralPatterns] = useState(null);
  const [personalityInsights, setPersonalityInsights] = useState(null);
  const [evolutionPrediction, setEvolutionPrediction] = useState(null);
  
  // Interaction states
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [generatingPrediction, setGeneratingPrediction] = useState(false);
  const [predictionType, setPredictionType] = useState(PREDICTION_TYPES.NEXT_ACTION);

  useEffect(() => {
    if (visible && !initialized) {
      initializePredictiveAI();
    }
  }, [visible]);

  const initializePredictiveAI = async () => {
    setLoading(true);
    try {
      const success = await predictiveCharacterAI.initializePredictiveAI(storyId, characterPack);
      if (success) {
        await loadAllData();
        setInitialized(true);
      } else {
        Alert.alert('Initialization Failed', 'Predictive AI requires more character data. Play more of the story to unlock predictions.');
      }
    } catch (error) {
      console.error('Failed to initialize predictive AI:', error);
      Alert.alert('Error', 'Failed to initialize predictive AI system.');
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async () => {
    try {
      // Load personality insights
      const insights = await predictiveCharacterAI.generatePersonalityInsights(storyId);
      setPersonalityInsights(insights);
    } catch (error) {
      console.error('Failed to load predictive AI data:', error);
    }
  };

  const generateNewPrediction = async () => {
    setGeneratingPrediction(true);
    try {
      const scenario = "The character faces a new challenging situation that requires careful consideration.";
      const prediction = await predictiveCharacterAI.predictCharacterResponse(storyId, scenario, predictionType);
      
      setPredictions(prev => [prediction, ...prev.slice(0, 9)]); // Keep last 10 predictions
      
      Alert.alert('Prediction Generated', `New ${predictionType.replace('_', ' ')} prediction created with ${(prediction.confidence * 100).toFixed(0)}% confidence.`);
    } catch (error) {
      console.error('Failed to generate prediction:', error);
      Alert.alert('Error', 'Failed to generate character prediction.');
    } finally {
      setGeneratingPrediction(false);
    }
  };

  const generateEvolutionPrediction = async () => {
    setLoading(true);
    try {
      const futureScenarios = [
        "A moral dilemma that challenges core values",
        "A relationship conflict requiring resolution",
        "A personal growth opportunity",
        "A high-stress decision under pressure"
      ];
      
      const evolution = await predictiveCharacterAI.predictCharacterEvolution(storyId, futureScenarios);
      setEvolutionPrediction(evolution);
    } catch (error) {
      console.error('Failed to generate evolution prediction:', error);
      Alert.alert('Error', 'Failed to predict character evolution.');
    } finally {
      setLoading(false);
    }
  };

  const getTabIcon = (tabKey, isActive) => {
    const color = isActive ? '#ffffff' : '#8b9dc3';
    const iconMap = {
      'predictions': Target,
      'patterns': BarChart3,
      'insights': Brain,
      'evolution': TrendingUp
    };
    const IconComponent = iconMap[tabKey] || Target;
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

  const renderPredictionsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Character Predictions</Text>
        <Text style={styles.sectionSubtitle}>AI-powered behavioral forecasting</Text>
      </View>

      {/* Prediction Type Selector */}
      <View style={styles.predictionTypeSelector}>
        <Text style={styles.selectorLabel}>Prediction Type:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScrollView}>
          {Object.values(PREDICTION_TYPES).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                predictionType === type && styles.activeTypeButton
              ]}
              onPress={() => setPredictionType(type)}
            >
              <Text style={[
                styles.typeButtonText,
                predictionType === type && styles.activeTypeButtonText
              ]}>
                {type.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Generate New Prediction Button */}
      <TouchableOpacity
        style={styles.generateButton}
        onPress={generateNewPrediction}
        disabled={generatingPrediction}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.generateButtonGradient}
        >
          {generatingPrediction ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Zap size={20} color="#ffffff" />
              <Text style={styles.generateButtonText}>Generate Prediction</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Predictions List */}
      {predictions.map((prediction, index) => (
        <TouchableOpacity
          key={index}
          style={styles.predictionCard}
          onPress={() => setSelectedPrediction(prediction)}
        >
          <LinearGradient
            colors={['#f093fb', '#f5576c', '#4facfe']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.predictionCardGradient}
          >
            <View style={styles.predictionHeader}>
              <Text style={styles.predictionType}>
                {prediction.prediction_type?.replace('_', ' ').toUpperCase() || 'PREDICTION'}
              </Text>
              <View style={styles.confidenceIndicator}>
                <Text style={styles.confidenceText}>
                  {(prediction.confidence * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
            <Text style={styles.predictionSummary} numberOfLines={2}>
              {prediction.predicted_action || prediction.predicted_outcome || 'Character prediction available'}
            </Text>
            <Text style={styles.predictionReasoning} numberOfLines={1}>
              {prediction.reasoning || 'Tap to view detailed analysis'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      ))}

      {predictions.length === 0 && (
        <View style={styles.emptyState}>
          <TrendingUp size={48} color="#8b9dc3" />
          <Text style={styles.emptyStateText}>No predictions yet</Text>
          <Text style={styles.emptyStateSubtext}>Generate your first character prediction above</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderPatternsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Behavioral Patterns</Text>
        <Text style={styles.sectionSubtitle}>Deep psychological analysis</Text>
      </View>

      {behavioralPatterns ? (
        <>
          {/* Pattern Strength Overview */}
          <View style={styles.patternCard}>
            <Text style={styles.patternCardTitle}>Pattern Analysis</Text>
            <View style={styles.patternMetrics}>
              <View style={styles.patternMetric}>
                <Text style={styles.patternMetricLabel}>Decision Consistency</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${behavioralPatterns.decision_consistency * 100}%` }]} />
                </View>
                <Text style={styles.patternMetricValue}>
                  {(behavioralPatterns.decision_consistency * 100).toFixed(0)}%
                </Text>
              </View>
              
              <View style={styles.patternMetric}>
                <Text style={styles.patternMetricLabel}>Prediction Reliability</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${behavioralPatterns.prediction_reliability * 100}%` }]} />
                </View>
                <Text style={styles.patternMetricValue}>
                  {(behavioralPatterns.prediction_reliability * 100).toFixed(0)}%
                </Text>
              </View>
              
              <View style={styles.patternMetric}>
                <Text style={styles.patternMetricLabel}>Adaptation Rate</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${behavioralPatterns.adaptation_rate * 100}%` }]} />
                </View>
                <Text style={styles.patternMetricValue}>
                  {(behavioralPatterns.adaptation_rate * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
          </View>

          {/* Detailed Pattern Analysis */}
          <View style={styles.patternCard}>
            <Text style={styles.patternCardTitle}>Psychological Profile</Text>
            
            {behavioralPatterns.stress_responses && (
              <View style={styles.patternSection}>
                <Text style={styles.patternSectionTitle}>Stress Response</Text>
                <Text style={styles.patternDetail}>
                  Tolerance: {(behavioralPatterns.stress_responses.stress_tolerance * 100).toFixed(0)}%
                </Text>
                <Text style={styles.patternDetail}>
                  Coping: {behavioralPatterns.stress_responses.coping_mechanism?.replace('_', ' ')}
                </Text>
              </View>
            )}
            
            {behavioralPatterns.social_tendencies && (
              <View style={styles.patternSection}>
                <Text style={styles.patternSectionTitle}>Social Patterns</Text>
                <Text style={styles.patternDetail}>
                  Engagement: {(behavioralPatterns.social_tendencies.engagement * 100).toFixed(0)}%
                </Text>
                <Text style={styles.patternDetail}>
                  Cooperation: {(behavioralPatterns.social_tendencies.cooperation_level * 100).toFixed(0)}%
                </Text>
              </View>
            )}
            
            {behavioralPatterns.emotional_patterns && (
              <View style={styles.patternSection}>
                <Text style={styles.patternSectionTitle}>Emotional Profile</Text>
                <Text style={styles.patternDetail}>
                  Stability: {(behavioralPatterns.emotional_patterns.stability * 100).toFixed(0)}%
                </Text>
                <Text style={styles.patternDetail}>
                  Trend: {behavioralPatterns.emotional_patterns.intensity_trend}
                </Text>
              </View>
            )}
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <BarChart3 size={48} color="#8b9dc3" />
          <Text style={styles.emptyStateText}>Analyzing patterns...</Text>
          <Text style={styles.emptyStateSubtext}>Behavioral patterns will appear after more interactions</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderInsightsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Personality Insights</Text>
        <Text style={styles.sectionSubtitle}>AI-generated character analysis</Text>
      </View>

      {personalityInsights ? (
        <>
          {/* Core Personality */}
          <View style={styles.insightCard}>
            <Text style={styles.insightCardTitle}>Core Personality</Text>
            <Text style={styles.insightText}>
              {personalityInsights.core_personality}
            </Text>
          </View>

          {/* Strengths and Growth Areas */}
          <View style={styles.insightCard}>
            <Text style={styles.insightCardTitle}>Psychological Profile</Text>
            
            <View style={styles.insightSection}>
              <Text style={styles.insightSectionTitle}>Strengths</Text>
              {personalityInsights.psychological_strengths?.map((strength, index) => (
                <Text key={index} style={styles.insightListItem}>• {strength}</Text>
              ))}
            </View>
            
            <View style={styles.insightSection}>
              <Text style={styles.insightSectionTitle}>Growth Areas</Text>
              {personalityInsights.growth_areas?.map((area, index) => (
                <Text key={index} style={styles.insightListItem}>• {area}</Text>
              ))}
            </View>
          </View>

          {/* Unique Traits */}
          <View style={styles.insightCard}>
            <Text style={styles.insightCardTitle}>Distinctive Characteristics</Text>
            <Text style={styles.insightText}>
              {personalityInsights.unique_traits}
            </Text>
          </View>

          {/* Hidden Depths */}
          <View style={styles.insightCard}>
            <Text style={styles.insightCardTitle}>Hidden Depths</Text>
            <Text style={styles.insightText}>
              {personalityInsights.hidden_depths}
            </Text>
          </View>

          {/* Predictability Assessment */}
          <View style={styles.insightCard}>
            <Text style={styles.insightCardTitle}>Predictability Assessment</Text>
            <Text style={styles.insightText}>
              {personalityInsights.predictability_assessment}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Lightbulb size={48} color="#8b9dc3" />
          <Text style={styles.emptyStateText}>Generating insights...</Text>
          <Text style={styles.emptyStateSubtext}>Deep personality analysis in progress</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderEvolutionTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Character Evolution</Text>
        <Text style={styles.sectionSubtitle}>Predicted character development</Text>
      </View>

      {/* Generate Evolution Button */}
      <TouchableOpacity
        style={styles.generateButton}
        onPress={generateEvolutionPrediction}
        disabled={loading}
      >
        <LinearGradient
          colors={['#4facfe', '#00f2fe']}
          style={styles.generateButtonGradient}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <TrendingUp size={20} color="#ffffff" />
              <Text style={styles.generateButtonText}>Predict Evolution</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {evolutionPrediction ? (
        <>
          {/* Evolution Overview */}
          <View style={styles.evolutionCard}>
            <Text style={styles.evolutionCardTitle}>Psychological Development</Text>
            <Text style={styles.evolutionText}>
              {evolutionPrediction.psychological_development}
            </Text>
          </View>

          {/* Trait Changes */}
          {evolutionPrediction.trait_changes?.length > 0 && (
            <View style={styles.evolutionCard}>
              <Text style={styles.evolutionCardTitle}>Predicted Trait Changes</Text>
              {evolutionPrediction.trait_changes.map((change, index) => (
                <View key={index} style={styles.traitChangeItem}>
                  <Text style={styles.traitChangeName}>
                    {change.trait?.replace('_', ' ').toUpperCase()}
                  </Text>
                  <View style={styles.traitChangeProgress}>
                    <Text style={styles.traitChangeScore}>
                      {change.current_score} → {change.predicted_score}
                    </Text>
                    <Text style={styles.traitChangeProbability}>
                      {(change.change_probability * 100).toFixed(0)}% likely
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Turning Points */}
          {evolutionPrediction.key_turning_points?.length > 0 && (
            <View style={styles.evolutionCard}>
              <Text style={styles.evolutionCardTitle}>Key Turning Points</Text>
              {evolutionPrediction.key_turning_points.map((point, index) => (
                <Text key={index} style={styles.turningPoint}>• {point}</Text>
              ))}
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Trees size={48} color="#8b9dc3" />
          <Text style={styles.emptyStateText}>Character evolution awaits</Text>
          <Text style={styles.emptyStateSubtext}>Generate predictions to see how your character might develop</Text>
        </View>
      )}
    </ScrollView>
  );

  // Prediction Detail Modal
  const renderPredictionModal = () => (
    <Modal
      visible={!!selectedPrediction}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setSelectedPrediction(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Prediction Details</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedPrediction(null)}
            >
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>
          
          <ScrollView style={styles.modalBody}>
            {selectedPrediction && (
              <>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Prediction</Text>
                  <Text style={styles.modalText}>
                    {selectedPrediction.predicted_action || selectedPrediction.predicted_outcome}
                  </Text>
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Reasoning</Text>
                  <Text style={styles.modalText}>
                    {selectedPrediction.reasoning}
                  </Text>
                </View>
                
                {selectedPrediction.trait_influences && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Trait Influences</Text>
                    {selectedPrediction.trait_influences.map((influence, index) => (
                      <Text key={index} style={styles.modalListItem}>• {influence}</Text>
                    ))}
                  </View>
                )}
                
                {selectedPrediction.alternative_actions && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Alternative Actions</Text>
                    {selectedPrediction.alternative_actions.map((action, index) => (
                      <Text key={index} style={styles.modalListItem}>• {action}</Text>
                    ))}
                  </View>
                )}
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Confidence Analysis</Text>
                  <Text style={styles.modalText}>
                    Overall Confidence: {(selectedPrediction.confidence * 100).toFixed(0)}%
                  </Text>
                  {selectedPrediction.trait_confidence && (
                    <Text style={styles.modalText}>
                      Trait Confidence: {(selectedPrediction.trait_confidence * 100).toFixed(0)}%
                    </Text>
                  )}
                  {selectedPrediction.pattern_reliability && (
                    <Text style={styles.modalText}>
                      Pattern Reliability: {(selectedPrediction.pattern_reliability * 100).toFixed(0)}%
                    </Text>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#2c3e50', '#3498db', '#9b59b6']}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Predictive AI</Text>
            <Text style={styles.headerSubtitle}>Phase 6: Character Behavior Prediction</Text>
          </View>
          <View style={styles.headerIcon}>
            <TrendingUp size={24} color="#ffffff" />
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          {renderTabButton('predictions', 'Predictions', 'psychology')}
          {renderTabButton('patterns', 'Patterns', 'analytics')}
          {renderTabButton('insights', 'Insights', 'lightbulb-outline')}
          {renderTabButton('evolution', 'Evolution', 'trending-up')}
        </View>

        {/* Content */}
        {loading && !initialized ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Initializing Predictive AI...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'predictions' && renderPredictionsTab()}
            {activeTab === 'patterns' && renderPatternsTab()}
            {activeTab === 'insights' && renderInsightsTab()}
            {activeTab === 'evolution' && renderEvolutionTab()}
          </>
        )}

        {renderPredictionModal()}
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
  predictionTypeSelector: {
    marginBottom: 20,
  },
  selectorLabel: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 10,
    fontWeight: '600',
  },
  typeScrollView: {
    flexDirection: 'row',
  },
  typeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  activeTypeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  typeButtonText: {
    color: '#e0e6ed',
    fontSize: 12,
    fontWeight: '500',
  },
  activeTypeButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  generateButton: {
    marginBottom: 20,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  predictionCard: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  predictionCardGradient: {
    padding: 20,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  predictionType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  predictionSummary: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  predictionReasoning: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#e0e6ed',
    opacity: 0.8,
    textAlign: 'center',
  },
  patternCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  patternCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  patternMetrics: {
    gap: 15,
  },
  patternMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  patternMetricLabel: {
    fontSize: 14,
    color: '#e0e6ed',
    flex: 1,
  },
  progressBar: {
    flex: 2,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginHorizontal: 15,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4facfe',
    borderRadius: 4,
  },
  patternMetricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    minWidth: 40,
    textAlign: 'right',
  },
  patternSection: {
    marginBottom: 15,
  },
  patternSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  patternDetail: {
    fontSize: 14,
    color: '#e0e6ed',
    marginBottom: 4,
  },
  insightCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  insightCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  insightText: {
    fontSize: 14,
    color: '#e0e6ed',
    lineHeight: 20,
  },
  insightSection: {
    marginBottom: 15,
  },
  insightSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  insightListItem: {
    fontSize: 14,
    color: '#e0e6ed',
    marginBottom: 4,
  },
  evolutionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  evolutionCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  evolutionText: {
    fontSize: 14,
    color: '#e0e6ed',
    lineHeight: 20,
  },
  traitChangeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  traitChangeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  traitChangeProgress: {
    alignItems: 'flex-end',
  },
  traitChangeScore: {
    fontSize: 14,
    color: '#4facfe',
    fontWeight: 'bold',
  },
  traitChangeProbability: {
    fontSize: 12,
    color: '#e0e6ed',
    opacity: 0.8,
  },
  turningPoint: {
    fontSize: 14,
    color: '#e0e6ed',
    marginBottom: 8,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
  },
  modalListItem: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 4,
  },
});

export default PredictiveAIScreen;