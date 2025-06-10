import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Sparkles,
  Eye,
  Zap,
  Heart,
  Frown,
  FlaskConical,
  TestTube,
  User,
  HelpCircle,
  Settings,
  ChevronDown,
  Paw,
  Package,
  Video,
  Wrench
} from 'lucide-react-native';

const AdvancedFeaturesSidebar = ({ 
  visible,
  onClose,
  onAtmosphereChange,
  currentAtmosphere = 'auto',
  realTimeAnalysis = false,
  onRealTimeAnalysis,
  onTestAPI,
  onTestFormat,
  onTestPersona,
  onGetAIHelp,
  onStoryFreedom,
  onContinueStory,
  isGenerating = false,
  playerInput = '',
  // Advanced Features
  onOpenTraitMatrix,
  onOpenAnimalCompanions,
  onOpenInventory,
  onOpenPredictiveAI,
  onOpenImmersiveMedia,
  onOpenCreatorTools
}) => {
  const atmosphereOptions = [
    { id: 'auto', label: 'Auto', icon: Sparkles },
    { id: 'mysterious', label: 'Mysterious', icon: Eye },
    { id: 'dramatic', label: 'Dramatic', icon: Zap },
    { id: 'romantic', label: 'Romantic', icon: Heart },
    { id: 'dark', label: 'Dark', icon: Frown }
  ];

  if (!visible) return null;

  return (
    <View style={styles.sidebarContainer}>
      <LinearGradient
        colors={['#F5F1E8', '#EAE0D2']}
        style={styles.sidebar}
      >
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <ChevronDown size={20} color="#8B4513" />
            <Text style={styles.headerTitle}>Advanced AI Features</Text>
          </View>

          {/* Scene Atmosphere Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scene Atmosphere</Text>
            <View style={styles.atmosphereGrid}>
              {atmosphereOptions.map((option) => {
                const IconComponent = option.icon;
                const isSelected = currentAtmosphere === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.atmosphereButton,
                      isSelected && styles.atmosphereButtonSelected
                    ]}
                    onPress={() => onAtmosphereChange(option.id)}
                    activeOpacity={0.7}
                  >
                    <IconComponent 
                      size={20} 
                      color={isSelected ? '#FFFFFF' : '#8B4513'} 
                    />
                    <Text style={[
                      styles.atmosphereLabel,
                      isSelected && styles.atmosphereLabelSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Real-time Analysis */}
          <TouchableOpacity 
            style={styles.analysisButton}
            onPress={onRealTimeAnalysis}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={realTimeAnalysis ? ['#D4AF37', '#B8941F'] : ['#9CA3AF', '#6B7280']}
              style={styles.analysisGradient}
            >
              <Sparkles size={20} color="#FFFFFF" />
              <Text style={styles.analysisText}>
                Real-time Analysis {realTimeAnalysis ? '✓' : '○'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Test Buttons */}
          <View style={styles.testSection}>
            <TouchableOpacity style={styles.testButton} onPress={onTestAPI}>
              <FlaskConical size={16} color="#6B7280" />
              <Text style={styles.testButtonText}>Test API</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.testButton} onPress={onTestFormat}>
              <TestTube size={16} color="#6B7280" />
              <Text style={styles.testButtonText}>Test Format</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.testButton} onPress={onTestPersona}>
              <User size={16} color="#6B7280" />
              <Text style={styles.testButtonText}>Test Persona</Text>
            </TouchableOpacity>
          </View>

          {/* Advanced Features Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Advanced Features</Text>
            
            {/* Creator Tools */}
            <TouchableOpacity style={styles.featureButton} onPress={onOpenCreatorTools}>
              <View style={[styles.featureIcon, { backgroundColor: '#B45309' }]}>
                <Wrench size={18} color="#FFFFFF" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Creator Tools</Text>
                <Text style={styles.featureDescription}>Content creation & editing</Text>
              </View>
            </TouchableOpacity>

            {/* Immersive Media */}
            <TouchableOpacity style={styles.featureButton} onPress={onOpenImmersiveMedia}>
              <View style={[styles.featureIcon, { backgroundColor: '#7C2D12' }]}>
                <Video size={18} color="#FFFFFF" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Immersive Media</Text>
                <Text style={styles.featureDescription}>Audio & visual storytelling</Text>
              </View>
            </TouchableOpacity>

            {/* Predictive AI */}
            <TouchableOpacity style={styles.featureButton} onPress={onOpenPredictiveAI}>
              <View style={[styles.featureIcon, { backgroundColor: '#2563EB' }]}>
                <Sparkles size={18} color="#FFFFFF" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Predictive AI</Text>
                <Text style={styles.featureDescription}>Character insights</Text>
              </View>
            </TouchableOpacity>

            {/* Inventory */}
            <TouchableOpacity style={styles.featureButton} onPress={onOpenInventory}>
              <View style={[styles.featureIcon, { backgroundColor: '#DC2626' }]}>
                <Package size={18} color="#FFFFFF" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Inventory</Text>
                <Text style={styles.featureDescription}>Track possessions & wealth</Text>
              </View>
            </TouchableOpacity>

            {/* Animal Companions */}
            <TouchableOpacity style={styles.featureButton} onPress={onOpenAnimalCompanions}>
              <View style={[styles.featureIcon, { backgroundColor: '#059669' }]}>
                <Paw size={18} color="#FFFFFF" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Animal Companions</Text>
                <Text style={styles.featureDescription}>Manage creature friends</Text>
              </View>
            </TouchableOpacity>

            {/* Trait Matrix */}
            <TouchableOpacity style={styles.featureButton} onPress={onOpenTraitMatrix}>
              <View style={[styles.featureIcon, { backgroundColor: '#9333EA' }]}>
                <Sparkles size={18} color="#FFFFFF" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Character Traits</Text>
                <Text style={styles.featureDescription}>Analyze personality patterns</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Bottom Action Buttons */}
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.actionButton} onPress={onGetAIHelp}>
              <HelpCircle size={18} color="#B8941F" />
              <Text style={styles.actionButtonText}>Get AI Help</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={onStoryFreedom}>
              <Settings size={18} color="#B8941F" />
              <Text style={styles.actionButtonText}>Story Freedom</Text>
            </TouchableOpacity>
          </View>

          {/* Continue Story Button */}
          <TouchableOpacity 
            style={[
              styles.continueButton,
              (isGenerating || !playerInput.trim()) && styles.continueButtonDisabled
            ]}
            onPress={onContinueStory}
            activeOpacity={0.8}
            disabled={isGenerating || !playerInput.trim()}
          >
            <LinearGradient
              colors={
                (isGenerating || !playerInput.trim()) 
                  ? ['#9CA3AF', '#6B7280'] 
                  : ['#8B7355', '#6B5B47']
              }
              style={styles.continueGradient}
            >
              <Text style={[
                styles.continueText,
                (isGenerating || !playerInput.trim()) && styles.continueTextDisabled
              ]}>
                {isGenerating ? 'Generating...' : 'Continue Story'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebarContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 280,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  sidebar: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: '#D1C7B7',
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D1C7B7',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
    marginLeft: 8,
    fontFamily: 'serif',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#654321',
    marginBottom: 12,
    fontFamily: 'serif',
  },
  atmosphereGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  atmosphereButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1C7B7',
    padding: 8,
  },
  atmosphereButtonSelected: {
    backgroundColor: '#D4AF37',
    borderColor: '#B8941F',
  },
  atmosphereLabel: {
    fontSize: 10,
    color: '#8B4513',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  atmosphereLabelSelected: {
    color: '#FFFFFF',
  },
  analysisButton: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  analysisGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  analysisText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  testSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  testButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  testButtonText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1C7B7',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#B8941F',
    marginLeft: 6,
    fontWeight: '500',
  },
  continueButton: {
    marginTop: 'auto',
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueGradient: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5F1E8',
    fontFamily: 'serif',
  },
  continueTextDisabled: {
    color: '#D1D5DB',
  },
  featureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#654321',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 10,
    color: '#6B7280',
    lineHeight: 12,
  },
});

export default AdvancedFeaturesSidebar; 