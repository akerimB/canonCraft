/**
 * InCharacter Phase 5: Character Trait Matrix Screen
 * Advanced Psychological Profile Display with Dual-Layer Personality System
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';
import { characterTraitMatrix, TRAIT_METADATA } from '../services/characterTraitMatrix.js';
import { enhancedPersonaScoring } from '../services/enhancedPersonaScoring.js';

const { width, height } = Dimensions.get('window');

export default function TraitMatrixScreen({ visible, onClose, storyId, characterName }) {
  const [matrixData, setMatrixData] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedTrait, setSelectedTrait] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible && storyId) {
      loadMatrixData();
    }
  }, [visible, storyId]);

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const loadMatrixData = async () => {
    try {
      setLoading(true);
      
      // Get enhanced persona summary with trait matrix data
      const personaSummary = enhancedPersonaScoring.getEnhancedPersonaSummary();
      const matrixSummary = characterTraitMatrix.getMatrixSummary(storyId);
      
      if (personaSummary && matrixSummary) {
        setMatrixData({
          ...personaSummary,
          matrixSummary: matrixSummary
        });
      }
    } catch (error) {
      console.error('Failed to load trait matrix data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {['overview', 'conscious', 'subconscious', 'evolution', 'insights'].map(tab => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, selectedTab === tab && styles.activeTab]}
          onPress={() => setSelectedTab(tab)}
        >
          <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Character Header */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.characterHeader}
      >
        <Text style={styles.characterName}>{characterName}</Text>
        <Text style={styles.characterSubtitle}>Psychological Profile</Text>
        
        <View style={styles.scoreContainer}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValue}>{matrixData?.totalScore?.toFixed(0) || '0'}</Text>
            <Text style={styles.scoreLabel}>Authenticity</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValue}>{matrixData?.matrixChangeScore?.toFixed(0) || '0'}</Text>
            <Text style={styles.scoreLabel}>Evolution</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValue}>{matrixData?.consistencyScore?.toFixed(0) || '0'}</Text>
            <Text style={styles.scoreLabel}>Consistency</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Dominant Traits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dominant Psychological Traits</Text>
        <View style={styles.traitsGrid}>
          {matrixData?.dominantTraits?.slice(0, 6).map((trait, index) => (
            <TouchableOpacity
              key={trait.trait}
              style={styles.traitCard}
              onPress={() => setSelectedTrait(trait)}
            >
              <LinearGradient
                colors={trait.score > 50 ? ['#4a90e2', '#357abd'] : ['#e74c3c', '#c0392b']}
                style={styles.traitCardGradient}
              >
                <Text style={styles.traitName}>
                  {trait.trait.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
                <Text style={styles.traitScore}>{trait.score.toFixed(0)}</Text>
                <View style={styles.traitBar}>
                  <View 
                    style={[
                      styles.traitBarFill, 
                      { width: `${Math.abs(trait.score - 50) * 2}%` }
                    ]} 
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Consciousness Balance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Consciousness Balance</Text>
        {renderConsciousnessBalance()}
      </View>

      {/* Recent Assessment */}
      {matrixData?.lastAssessment && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Psychological Assessment</Text>
          <View style={styles.assessmentCard}>
            <Text style={styles.assessmentScore}>
              Authenticity: {matrixData.lastAssessment.authenticity_score}/100
            </Text>
            <Text style={styles.assessmentText}>
              {matrixData.lastAssessment.overall_assessment}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderConsciousTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Conscious Traits</Text>
      <Text style={styles.sectionDescription}>
        Traits that the character can deliberately control and express
      </Text>
      
      {matrixData?.matrixSummary?.conscious_traits?.map(trait => (
        <TouchableOpacity 
          key={trait.trait}
          style={styles.traitListItem}
          onPress={() => setSelectedTrait(trait)}
        >
          <View style={styles.traitListContent}>
            <Text style={styles.traitListName}>
              {trait.trait.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
            <Text style={styles.traitListDescription}>
              {TRAIT_METADATA[trait.trait]?.description || 'No description available'}
            </Text>
            <View style={styles.traitListMeta}>
              <Text style={styles.traitListScore}>Score: {trait.score.toFixed(0)}/100</Text>
              <Text style={styles.traitListConfidence}>
                Confidence: {(trait.confidence * 100).toFixed(0)}%
              </Text>
            </View>
          </View>
          <View style={styles.traitListIndicator}>
            <View 
              style={[
                styles.traitIndicatorBar,
                { 
                  height: `${Math.abs(trait.score - 50) * 1.5}%`,
                  backgroundColor: trait.score > 50 ? '#4a90e2' : '#e74c3c'
                }
              ]}
            />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderSubconsciousTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Subconscious Traits</Text>
      <Text style={styles.sectionDescription}>
        Deep psychological patterns that influence behavior unconsciously
      </Text>
      
      {matrixData?.matrixSummary?.subconscious_traits?.map(trait => (
        <TouchableOpacity 
          key={trait.trait}
          style={[styles.traitListItem, styles.subconsciousItem]}
          onPress={() => setSelectedTrait(trait)}
        >
          <View style={styles.traitListContent}>
            <Text style={styles.traitListName}>
              {trait.trait.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
            <Text style={styles.traitListDescription}>
              {TRAIT_METADATA[trait.trait]?.description || 'No description available'}
            </Text>
            <View style={styles.traitListMeta}>
              <Text style={styles.traitListScore}>Score: {trait.score.toFixed(0)}/100</Text>
              <Text style={styles.traitListConfidence}>
                Confidence: {(trait.confidence * 100).toFixed(0)}%
              </Text>
            </View>
          </View>
          <View style={styles.traitListIndicator}>
            <View 
              style={[
                styles.traitIndicatorBar,
                { 
                  height: `${Math.abs(trait.score - 50) * 1.5}%`,
                  backgroundColor: trait.score > 50 ? '#9b59b6' : '#e67e22'
                }
              ]}
            />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderEvolutionTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Trait Evolution</Text>
      <Text style={styles.sectionDescription}>
        How your character's psychological profile has developed
      </Text>

      {/* Evolution Metrics */}
      <View style={styles.evolutionMetrics}>
        <View style={styles.evolutionMetric}>
          <Text style={styles.evolutionValue}>
            {matrixData?.psychologicalGrowth?.traitEvolutionCount || 0}
          </Text>
          <Text style={styles.evolutionLabel}>Trait Changes</Text>
        </View>
        <View style={styles.evolutionMetric}>
          <Text style={styles.evolutionValue}>
            {matrixData?.psychologicalGrowth?.matrixChangeScore?.toFixed(1) || '0.0'}
          </Text>
          <Text style={styles.evolutionLabel}>Change Score</Text>
        </View>
        <View style={styles.evolutionMetric}>
          <Text style={styles.evolutionValue}>
            {matrixData?.evolutionTrend === 'positive' ? '📈' : 
             matrixData?.evolutionTrend === 'negative' ? '📉' : '📊'}
          </Text>
          <Text style={styles.evolutionLabel}>Trend</Text>
        </View>
      </View>

      {/* Evolution Pattern */}
      <View style={styles.evolutionPattern}>
        <Text style={styles.evolutionPatternTitle}>Development Pattern</Text>
        <Text style={styles.evolutionPatternText}>
          {matrixData?.evolutionTrend === 'gradual_development' && 
            'Your character is developing gradually with consistent trait changes that reflect natural psychological growth.'}
          {matrixData?.evolutionTrend === 'rapid_change' &&
            'Your character is experiencing rapid psychological changes, indicating significant character development.'}
          {matrixData?.evolutionTrend === 'stable' &&
            'Your character maintains psychological stability with minimal trait fluctuation.'}
        </Text>
      </View>
    </ScrollView>
  );

  const renderInsightsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Psychological Insights</Text>
      
      {/* AI-Generated Insights */}
      {matrixData?.lastAssessment?.trait_insights && (
        <View style={styles.insightsSection}>
          <Text style={styles.insightTitle}>Character Psychology</Text>
          <Text style={styles.insightText}>
            {matrixData.lastAssessment.trait_insights.dominant_patterns}
          </Text>
          
          <Text style={styles.insightTitle}>Subconscious Influences</Text>
          <Text style={styles.insightText}>
            {matrixData.lastAssessment.trait_insights.subconscious_influence}
          </Text>
          
          <Text style={styles.insightTitle}>Character Growth</Text>
          <Text style={styles.insightText}>
            {matrixData.lastAssessment.trait_insights.character_growth}
          </Text>
        </View>
      )}

      {/* Recommendations */}
      {matrixData?.lastAssessment?.recommendations && (
        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {matrixData.lastAssessment.recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Text style={styles.recommendationText}>• {recommendation}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderConsciousnessBalance = () => {
    const balance = matrixData?.consciousSubconsciousBalance;
    if (!balance) return null;

    const consciousWidth = balance.balance * 100;
    const subconsciousWidth = (1 - balance.balance) * 100;

    return (
      <View style={styles.balanceContainer}>
        <View style={styles.balanceBar}>
          <View style={[styles.balanceSegment, styles.consciousSegment, { width: `${consciousWidth}%` }]}>
            <Text style={styles.balanceLabel}>Conscious {consciousWidth.toFixed(0)}%</Text>
          </View>
          <View style={[styles.balanceSegment, styles.subconsciousSegment, { width: `${subconsciousWidth}%` }]}>
            <Text style={styles.balanceLabel}>Subconscious {subconsciousWidth.toFixed(0)}%</Text>
          </View>
        </View>
        <Text style={styles.balanceDescription}>
          {balance.type === 'balanced' && 'Balanced expression of conscious and subconscious traits'}
          {balance.type === 'conscious_dominant' && 'Primarily conscious trait expression with deliberate choices'}
          {balance.type === 'subconscious_dominant' && 'Strong subconscious influence with intuitive behaviors'}
        </Text>
      </View>
    );
  };

  const renderTraitDetailModal = () => (
    <Modal visible={!!selectedTrait} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {selectedTrait && (
            <>
              <Text style={styles.modalTitle}>
                {selectedTrait.trait.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              
              <View style={styles.modalScoreContainer}>
                <Text style={styles.modalScore}>{selectedTrait.score.toFixed(0)}/100</Text>
                <Text style={styles.modalConfidence}>
                  {(selectedTrait.confidence * 100).toFixed(0)}% confidence
                </Text>
              </View>

              <Text style={styles.modalDescription}>
                {TRAIT_METADATA[selectedTrait.trait]?.description || 'No description available'}
              </Text>

              <View style={styles.modalMetadata}>
                <Text style={styles.modalMetaTitle}>Trait Properties</Text>
                <Text style={styles.modalMetaText}>
                  Category: {TRAIT_METADATA[selectedTrait.trait]?.category?.replace(/_/g, ' ')}
                </Text>
                <Text style={styles.modalMetaText}>
                  Consciousness: {TRAIT_METADATA[selectedTrait.trait]?.consciousness}
                </Text>
                <Text style={styles.modalMetaText}>
                  Social Impact: {TRAIT_METADATA[selectedTrait.trait]?.social_impact}
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setSelectedTrait(null)}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview': return renderOverviewTab();
      case 'conscious': return renderConsciousTab();
      case 'subconscious': return renderSubconsciousTab();
      case 'evolution': return renderEvolutionTab();
      case 'insights': return renderInsightsTab();
      default: return renderOverviewTab();
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        <LinearGradient
          colors={['#0f0f23', '#1a1a2e', '#16213e']}
          style={styles.background}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Character Trait Matrix</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Analyzing psychological profile...</Text>
              </View>
            ) : (
              <>
                {renderTabBar()}
                {renderTabContent()}
              </>
            )}
          </Animated.View>
        </LinearGradient>
        {renderTraitDetailModal()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 25,
    padding: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: 'rgba(74, 144, 226, 0.3)',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  characterHeader: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  characterName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  characterSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  scoreLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 5,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  sectionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 15,
    lineHeight: 20,
  },
  traitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  traitCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  traitCardGradient: {
    padding: 15,
    alignItems: 'center',
  },
  traitName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  traitScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  traitBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  traitBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  balanceContainer: {
    marginVertical: 15,
  },
  balanceBar: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 10,
  },
  balanceSegment: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  consciousSegment: {
    backgroundColor: '#4a90e2',
  },
  subconsciousSegment: {
    backgroundColor: '#9b59b6',
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  balanceDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 18,
  },
  assessmentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4a90e2',
  },
  assessmentScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 8,
  },
  assessmentText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  traitListItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subconsciousItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#9b59b6',
  },
  traitListContent: {
    flex: 1,
  },
  traitListName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  traitListDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
    marginBottom: 8,
  },
  traitListMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  traitListScore: {
    fontSize: 12,
    color: '#4a90e2',
    fontWeight: 'bold',
  },
  traitListConfidence: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  traitListIndicator: {
    width: 30,
    height: 60,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginLeft: 15,
  },
  traitIndicatorBar: {
    width: 6,
    borderRadius: 3,
  },
  evolutionMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  evolutionMetric: {
    alignItems: 'center',
  },
  evolutionValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  evolutionLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 5,
  },
  evolutionPattern: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 12,
  },
  evolutionPatternTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  evolutionPatternText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  insightsSection: {
    marginBottom: 25,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 10,
    marginTop: 15,
  },
  insightText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  recommendationsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 12,
  },
  recommendationItem: {
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 15,
    padding: 25,
    width: '100%',
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalScoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalScore: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  modalConfidence: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 5,
  },
  modalDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalMetadata: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  modalMetaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  modalMetaText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 5,
  },
  modalCloseButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});