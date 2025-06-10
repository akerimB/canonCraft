/**
 * InCharacter Persona Reveal Screen
 * Beautiful interface for showing periodic persona assessment results
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const PersonaRevealScreen = ({ 
  visible, 
  onClose, 
  revealData, 
  characterName 
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(height));
  const [currentTab, setCurrentTab] = useState('overview');

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible || !revealData) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 70) return '#8BC34A';
    if (score >= 60) return '#FFC107';
    if (score >= 50) return '#FF9800';
    return '#F44336';
  };

  const getScoreBadge = (score) => {
    if (score >= 90) return { text: 'MASTERFUL', color: '#4CAF50' };
    if (score >= 80) return { text: 'EXCELLENT', color: '#66BB6A' };
    if (score >= 70) return { text: 'GOOD', color: '#9CCC65' };
    if (score >= 60) return { text: 'FAIR', color: '#FFCA28' };
    if (score >= 50) return { text: 'NEEDS WORK', color: '#FF7043' };
    return { text: 'INCONSISTENT', color: '#EF5350' };
  };

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Main Score Display */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreTitle}>CHARACTER AUTHENTICITY</Text>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreNumber}>{Math.round(revealData.overallScore)}</Text>
          <Text style={styles.scoreOutOf}>/ 100</Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: getScoreBadge(revealData.overallScore).color }]}>
          <Text style={styles.scoreBadgeText}>
            {getScoreBadge(revealData.overallScore).text}
          </Text>
        </View>
        <Text style={styles.scoreLevel}>
          {revealData.scoreLevel?.description || 'Character portrayal assessment'}
        </Text>
      </View>

      {/* Decision Range */}
      <View style={styles.rangeContainer}>
        <Text style={styles.rangeText}>
          Decisions {revealData.decisionRange?.from || 1} - {revealData.decisionRange?.to || 10}
        </Text>
        <Text style={styles.rangeSubtext}>
          Your choices as {characterName} during this period
        </Text>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>ASSESSMENT PROGRESS</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${(revealData.decisionRange?.to || 0) / 100 * 100}%`,
                backgroundColor: getScoreColor(revealData.overallScore)
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          Next assessment in {10 - ((revealData.decisionRange?.to || 0) % 10)} decisions
        </Text>
      </View>

      {/* Quick Insights */}
      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>QUICK INSIGHTS</Text>
        
        {revealData.strengths && revealData.strengths.length > 0 && (
          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>Strengths:</Text>
            <Text style={styles.insightText}>
              {revealData.strengths.slice(0, 2).join(', ')}
            </Text>
          </View>
        )}

        {revealData.improvements && revealData.improvements.length > 0 && (
          <View style={styles.insightItem}>
            <Text style={styles.insightLabel}>Focus Areas:</Text>
            <Text style={styles.insightText}>
              {revealData.improvements[0]?.split('.')[0] || 'Continue developing character understanding'}
            </Text>
          </View>
        )}

        {revealData.encouragement && (
          <View style={styles.encouragementContainer}>
            <Text style={styles.encouragementText}>
              {revealData.encouragement}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderCategoriesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.categoriesTitle}>DETAILED BREAKDOWN</Text>
      
      {Object.entries(revealData.categoryBreakdown || {}).map(([category, score]) => (
        <View key={category} style={styles.categoryItem}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryName}>
              {category.replace(/_/g, ' ').toUpperCase()}
            </Text>
            <Text style={[styles.categoryScore, { color: getScoreColor(score) }]}>
              {Math.round(score)}
            </Text>
          </View>
          <View style={styles.categoryBar}>
            <View 
              style={[
                styles.categoryFill,
                { 
                  width: `${score}%`,
                  backgroundColor: getScoreColor(score)
                }
              ]}
            />
          </View>
          <Text style={styles.categoryDescription}>
            {getCategoryDescription(category)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );

  const renderImprovementsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.improvementsTitle}>GROWTH OPPORTUNITIES</Text>
      
      {revealData.improvements && revealData.improvements.length > 0 ? (
        revealData.improvements.map((improvement, index) => (
          <View key={index} style={styles.improvementItem}>
            <View style={styles.improvementHeader}>
              <Text style={styles.improvementNumber}>{index + 1}</Text>
              <Text style={styles.improvementTitle}>Suggestion</Text>
            </View>
            <Text style={styles.improvementText}>{improvement}</Text>
          </View>
        ))
      ) : (
        <View style={styles.noImprovementsContainer}>
          <Text style={styles.noImprovementsTitle}>Excellent Work!</Text>
          <Text style={styles.noImprovementsText}>
            You're portraying {characterName} authentically. Keep exploring the depth of their character!
          </Text>
        </View>
      )}

      {revealData.characterInsights && (
        <View style={styles.insightsSection}>
          <Text style={styles.insightsSectionTitle}>CHARACTER INSIGHTS</Text>
          <Text style={styles.insightsSectionText}>
            {typeof revealData.characterInsights === 'string' 
              ? revealData.characterInsights 
              : 'Continue exploring your character\'s complexity and motivations.'}
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const getCategoryDescription = (category) => {
    const descriptions = {
      dialogue_authenticity: 'How well your words match the character\'s voice',
      action_consistency: 'Alignment of actions with character personality',
      moral_alignment: 'Choices reflect character\'s moral compass',
      emotional_response: 'Emotional reactions feel authentic',
      relationship_handling: 'Natural character interactions',
      period_accuracy: 'Maintains historical/literary period',
      character_growth: 'Shows authentic development',
      decision_making: 'Decision patterns match character mindset'
    };
    return descriptions[category] || 'Character authenticity measure';
  };

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <Animated.View 
          style={[
            styles.container,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f3460']}
            style={styles.gradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.title}>PERSONA ASSESSMENT</Text>
                <Text style={styles.subtitle}>{characterName}</Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={onClose}
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabNavigation}>
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'categories', label: 'Details' },
                { id: 'improvements', label: 'Growth' }
              ].map(tab => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tab,
                    currentTab === tab.id && styles.activeTab
                  ]}
                  onPress={() => setCurrentTab(tab.id)}
                >
                  <Text style={[
                    styles.tabText,
                    currentTab === tab.id && styles.activeTabText
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tab Content */}
            <View style={styles.content}>
              {currentTab === 'overview' && renderOverviewTab()}
              {currentTab === 'categories' && renderCategoriesTab()}
              {currentTab === 'improvements' && renderImprovementsTab()}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity 
                style={styles.continueButton}
                onPress={onClose}
              >
                <Text style={styles.continueButtonText}>Continue Story</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.9,
    height: height * 0.85,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#B0BEC5',
    fontStyle: 'italic',
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
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 10,
    borderRadius: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  tabText: {
    color: '#B0BEC5',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tabContent: {
    flex: 1,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  scoreTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0BEC5',
    marginBottom: 15,
    letterSpacing: 1,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreOutOf: {
    fontSize: 14,
    color: '#B0BEC5',
    marginTop: -5,
  },
  scoreBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 10,
  },
  scoreBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  scoreLevel: {
    fontSize: 14,
    color: '#B0BEC5',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  rangeContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  rangeText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  rangeSubtext: {
    fontSize: 12,
    color: '#B0BEC5',
    marginTop: 4,
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0BEC5',
    marginBottom: 10,
    letterSpacing: 1,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#B0BEC5',
    textAlign: 'center',
  },
  insightsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    letterSpacing: 1,
  },
  insightItem: {
    marginBottom: 12,
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B0BEC5',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  insightText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  encouragementContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  encouragementText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  categoriesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: 1,
  },
  categoryItem: {
    marginBottom: 25,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B0BEC5',
    letterSpacing: 1,
  },
  categoryScore: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginBottom: 8,
  },
  categoryFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryDescription: {
    fontSize: 12,
    color: '#B0BEC5',
    lineHeight: 16,
  },
  improvementsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: 1,
  },
  improvementItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  improvementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  improvementNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 10,
  },
  improvementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  improvementText: {
    fontSize: 14,
    color: '#B0BEC5',
    lineHeight: 20,
  },
  noImprovementsContainer: {
    alignItems: 'center',
    padding: 30,
  },
  noImprovementsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  noImprovementsText: {
    fontSize: 14,
    color: '#B0BEC5',
    textAlign: 'center',
    lineHeight: 20,
  },
  insightsSection: {
    marginTop: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
  },
  insightsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: 1,
  },
  insightsSectionText: {
    fontSize: 14,
    color: '#B0BEC5',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  continueButton: {
    backgroundColor: '#2196F3',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default PersonaRevealScreen; 