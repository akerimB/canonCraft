/**
 * InCharacter Phase 8: Animal Companions Screen
 * Revolutionary Interspecies Relationship Management Interface
 * Displays and manages animal companions with trait-based interactions
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Animated } from 'react-native';
import { X, Paw, Bird, Heart, Shield, Star, BookOpen } from 'lucide-react-native';
import { useGame } from './gameContext';
import { ANIMAL_SPECIES, ANIMAL_TRAIT_MATRIX } from '../services/animalBehaviorService';

const AnimalCompanionsScreen = ({ visible, onClose }) => {
  const { state, acquireAnimalCompanion, getAnimalCompanionSummary, initializeAnimalCompanions } = useGame();
  const [selectedTab, setSelectedTab] = useState('companions');
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [showAcquisitionModal, setShowAcquisitionModal] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Initialize animal companions system if needed
      if (!state.animalCompanions?.initialized) {
        initializeAnimalCompanions();
      }
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleAcquireAnimal = async (species, name, acquisitionMethod = 'encountered') => {
    try {
      const companion = await acquireAnimalCompanion({
        species: species,
        name: name,
        age_category: 'adult',
        location: 'with_character'
      }, acquisitionMethod);
      
      setShowAcquisitionModal(false);
      console.log('🐾 Acquired animal companion:', companion);
    } catch (error) {
      console.error('Failed to acquire animal companion:', error);
    }
  };

  const renderCompanionCard = (companion) => {
    const speciesData = ANIMAL_SPECIES[companion.species];
    const summary = getAnimalCompanionSummary(companion.id);
    
    return (
      <TouchableOpacity
        key={companion.id}
        style={styles.companionCard}
        onPress={() => setSelectedAnimal(companion)}
      >
        <View style={styles.companionHeader}>
          <View style={styles.companionIcon}>
            {companion.species === 'falcon' || companion.species === 'raven' ? 
              <Bird size={32} color="#8B4513" /> : 
              <Paw size={32} color="#8B4513" />
            }
          </View>
          <View style={styles.companionInfo}>
            <Text style={styles.companionName}>{companion.name}</Text>
            <Text style={styles.companionSpecies}>{companion.species.charAt(0).toUpperCase() + companion.species.slice(1)}</Text>
            <View style={styles.companionStatus}>
              {companion.current_state === 'alive' ? (
                <>
                  <Heart size={16} color="#4CAF50" />
                  <Text style={[styles.statusText, { color: '#4CAF50' }]}>Healthy</Text>
                </>
              ) : companion.current_state === 'injured' ? (
                <>
                  <Shield size={16} color="#FF9800" />
                  <Text style={[styles.statusText, { color: '#FF9800' }]}>Injured</Text>
                </>
              ) : (
                <>
                  <X size={16} color="#F44336" />
                  <Text style={[styles.statusText, { color: '#F44336' }]}>Deceased</Text>
                </>
              )}
            </View>
          </View>
        </View>
        
        {summary && (
          <View style={styles.companionStats}>
            <Text style={styles.statsTitle}>Dominant Traits:</Text>
            {summary.dominant_traits?.slice(0, 3).map((trait, index) => (
              <Text key={index} style={styles.traitText}>
                • {trait.trait}: {trait.score}/100
              </Text>
            ))}
            
            {summary.behavior_prediction && (
              <View style={styles.behaviorSection}>
                <Text style={styles.behaviorTitle}>Current State:</Text>
                <Text style={styles.behaviorText}>
                  {summary.behavior_prediction.primary_response?.primary || 'calm'} 
                  ({summary.behavior_prediction.primary_response?.intensity || 50}%)
                </Text>
              </View>
            )}
            
            <Text style={styles.relationshipText}>
              Interactions: {summary.relationship_count || 0}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderRelationshipTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionTitleContainer}>
        <Heart size={20} color="#8B4513" />
        <Text style={styles.sectionTitle}>Human-Animal Bonds</Text>
      </View>
      
      {state.humanAnimalRelationships?.length > 0 ? (
        state.humanAnimalRelationships.map((relationship, index) => (
          <View key={index} style={styles.relationshipCard}>
            <Text style={styles.relationshipTitle}>
              {relationship.character_name} ↔ {relationship.animal_name}
            </Text>
            
            <View style={styles.bondMetrics}>
              <View style={styles.bondMeter}>
                <Text style={styles.bondLabel}>Affection</Text>
                <View style={styles.meterBar}>
                  <View style={[styles.meterFill, { 
                    width: `${relationship.affection || 50}%`,
                    backgroundColor: '#ff6b6b'
                  }]} />
                </View>
                <Text style={styles.bondValue}>{relationship.affection || 50}/100</Text>
              </View>
              
              <View style={styles.bondMeter}>
                <Text style={styles.bondLabel}>Trust</Text>
                <View style={styles.meterBar}>
                  <View style={[styles.meterFill, { 
                    width: `${relationship.trust || 50}%`,
                    backgroundColor: '#4ecdc4'
                  }]} />
                </View>
                <Text style={styles.bondValue}>{relationship.trust || 50}/100</Text>
              </View>
              
              <View style={styles.bondMeter}>
                <Text style={styles.bondLabel}>Loyalty</Text>
                <View style={styles.meterBar}>
                  <View style={[styles.meterFill, { 
                    width: `${relationship.loyalty || 50}%`,
                    backgroundColor: '#45b7d1'
                  }]} />
                </View>
                <Text style={styles.bondValue}>{relationship.loyalty || 50}/100</Text>
              </View>
              
              {relationship.training_level > 0 && (
                <View style={styles.bondMeter}>
                  <Text style={styles.bondLabel}>Training</Text>
                  <View style={styles.meterBar}>
                    <View style={[styles.meterFill, { 
                      width: `${relationship.training_level}%`,
                      backgroundColor: '#f7b731'
                    }]} />
                  </View>
                  <Text style={styles.bondValue}>{relationship.training_level}/100</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.bondType}>
              Bond Type: {relationship.bond_type || 'neutral'}
            </Text>
            <Text style={styles.interactionCount}>
              Interactions: {relationship.interaction_count || 0}
            </Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No animal relationships yet</Text>
          <Text style={styles.emptySubtext}>
            Acquire animal companions to build meaningful bonds
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const renderSpeciesGuide = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionTitleContainer}>
        <BookOpen size={20} color="#8B4513" />
        <Text style={styles.sectionTitle}>Species Guide</Text>
      </View>
      
      {Object.entries(ANIMAL_SPECIES).map(([speciesKey, speciesData]) => (
        <View key={speciesKey} style={styles.speciesCard}>
          <View style={styles.speciesHeader}>
            <View style={styles.speciesIcon}>
              {speciesKey === 'falcon' || speciesKey === 'raven' ? 
                <Bird size={24} color="#8B4513" /> : 
                <Paw size={24} color="#8B4513" />
              }
            </View>
            <View style={styles.speciesInfo}>
              <Text style={styles.speciesName}>
                {speciesKey.charAt(0).toUpperCase() + speciesKey.slice(1)}
              </Text>
              <Text style={styles.speciesDetails}>
                Intelligence: {speciesData.intelligence_level}
              </Text>
              <Text style={styles.speciesDetails}>
                Trainable: {speciesData.trainable ? 'Yes' : 'No'}
              </Text>
              <Text style={styles.speciesDetails}>
                Social: {speciesData.social_structure}
              </Text>
            </View>
          </View>
          
          <View style={styles.speciesTraits}>
            <Text style={styles.traitsTitle}>Key Traits:</Text>
            {speciesData.traits.map((trait, index) => (
              <Text key={index} style={styles.traitTag}>
                {trait.replace(/_/g, ' ')}
              </Text>
            ))}
          </View>
          
          <View style={styles.periodRoles}>
            <Text style={styles.rolesTitle}>Historical Roles:</Text>
            {Object.entries(speciesData.period_roles).map(([period, roles]) => (
              <View key={period} style={styles.periodSection}>
                <Text style={styles.periodName}>{period.charAt(0).toUpperCase() + period.slice(1)}:</Text>
                <Text style={styles.rolesList}>{roles.join(', ')}</Text>
              </View>
            ))}
          </View>
          
          <TouchableOpacity
            style={styles.acquireButton}
            onPress={() => {
              setShowAcquisitionModal(true);
              setSelectedAnimal({ species: speciesKey, ...speciesData });
            }}
          >
            <Text style={styles.acquireButtonText}>Encounter {speciesKey}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

  const renderAcquisitionModal = () => (
    <Modal
      visible={showAcquisitionModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowAcquisitionModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Encounter Animal Companion</Text>
          
          {selectedAnimal && (
            <View style={styles.modalAnimalInfo}>
              <Text style={styles.modalAnimalIcon}>
                {selectedAnimal.species === 'horse' ? '🐎' :
                 selectedAnimal.species === 'dog' ? '🐕' :
                 selectedAnimal.species === 'cat' ? '🐱' :
                 selectedAnimal.species === 'raven' ? '🐦‍⬛' :
                 selectedAnimal.species === 'falcon' ? '🦅' : '🐾'}
              </Text>
              <Text style={styles.modalAnimalName}>
                {selectedAnimal.species?.charAt(0).toUpperCase() + selectedAnimal.species?.slice(1)}
              </Text>
            </View>
          )}
          
          <Text style={styles.modalQuestion}>What shall you name your new companion?</Text>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalOptionButton}
              onPress={() => handleAcquireAnimal(selectedAnimal?.species, 'Shadow', 'encountered')}
            >
              <Text style={styles.modalOptionText}>Shadow</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalOptionButton}
              onPress={() => handleAcquireAnimal(selectedAnimal?.species, 'Companion', 'encountered')}
            >
              <Text style={styles.modalOptionText}>Companion</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalOptionButton}
              onPress={() => handleAcquireAnimal(selectedAnimal?.species, 'Faithful', 'encountered')}
            >
              <Text style={styles.modalOptionText}>Faithful</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalOptionButton, styles.modalCancelButton]}
              onPress={() => setShowAcquisitionModal(false)}
            >
              <Text style={[styles.modalOptionText, styles.modalCancelText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.header}>
                          <Text style={styles.title}>Animal Companions</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                          <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'companions' && styles.activeTab]}
            onPress={() => setSelectedTab('companions')}
          >
            <Text style={[styles.tabText, selectedTab === 'companions' && styles.activeTabText]}>
              My Companions
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'relationships' && styles.activeTab]}
            onPress={() => setSelectedTab('relationships')}
          >
            <Text style={[styles.tabText, selectedTab === 'relationships' && styles.activeTabText]}>
              Relationships
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'guide' && styles.activeTab]}
            onPress={() => setSelectedTab('guide')}
          >
            <Text style={[styles.tabText, selectedTab === 'guide' && styles.activeTabText]}>
              Species Guide
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === 'companions' && (
          <ScrollView style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Your Animal Companions</Text>
            
            {state.animalCompanions?.companions?.length > 0 || 
             (Array.isArray(state.animalCompanions) && state.animalCompanions.length > 0) ? (
              (state.animalCompanions?.companions || state.animalCompanions).map(renderCompanionCard)
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🐾</Text>
                <Text style={styles.emptyText}>No Animal Companions Yet</Text>
                <Text style={styles.emptySubtext}>
                  Explore the Species Guide to encounter and bond with animal companions
                </Text>
                <TouchableOpacity
                  style={styles.getStartedButton}
                  onPress={() => setSelectedTab('guide')}
                >
                  <Text style={styles.getStartedText}>Explore Species Guide</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}

        {selectedTab === 'relationships' && renderRelationshipTab()}
        {selectedTab === 'guide' && renderSpeciesGuide()}
        
        {renderAcquisitionModal()}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#8B4513',
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#8B4513',
  },
  tabText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#8B4513',
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  companionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  companionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  companionIcon: {
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },
  companionInfo: {
    flex: 1,
  },
  companionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  companionSpecies: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  companionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  companionStats: {
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 10,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  traitText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 10,
  },
  behaviorSection: {
    marginTop: 8,
  },
  behaviorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  behaviorText: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: '500',
  },
  relationshipText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 5,
  },
  relationshipCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  relationshipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  bondMetrics: {
    marginBottom: 10,
  },
  bondMeter: {
    marginBottom: 8,
  },
  bondLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7f8c8d',
    marginBottom: 3,
  },
  meterBar: {
    height: 6,
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 3,
  },
  bondValue: {
    fontSize: 10,
    color: '#7f8c8d',
    marginTop: 2,
    textAlign: 'right',
  },
  bondType: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  interactionCount: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  speciesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  speciesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  speciesIcon: {
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },
  speciesInfo: {
    flex: 1,
  },
  speciesName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  speciesDetails: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  speciesTraits: {
    marginBottom: 10,
  },
  traitsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  traitTag: {
    fontSize: 12,
    color: '#8B4513',
    backgroundColor: 'rgba(139, 69, 19, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    margin: 2,
    alignSelf: 'flex-start',
  },
  periodRoles: {
    marginBottom: 15,
  },
  rolesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  periodSection: {
    marginBottom: 5,
  },
  periodName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  rolesList: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 10,
  },
  acquireButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  acquireButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    marginBottom: 20,
  },
  getStartedButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  getStartedText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    margin: 20,
    alignItems: 'center',
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  modalAnimalInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalAnimalIcon: {
    fontSize: 50,
    marginBottom: 10,
  },
  modalAnimalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  modalQuestion: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    width: '100%',
  },
  modalOptionButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#95a5a6',
  },
  modalOptionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalCancelText: {
    color: 'white',
  },
});

export default AnimalCompanionsScreen; 