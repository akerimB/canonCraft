w/**
 * Phase 8: Creator Tools Screen
 * Advanced character creation, educational tools, and community features
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft,
  Wrench,
  Plus,
  BookOpen,
  Users,
  Settings,
  ChevronDown,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const Header = ({ onClose }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onClose} style={styles.headerIcon}>
      <ArrowLeft size={24} color="#FFFFFF" />
    </TouchableOpacity>
    <View>
      <Text style={styles.headerTitle}>Creator Tools</Text>
      <Text style={styles.headerSubtitle}>Phase 8: Educational Platform</Text>
    </View>
    <TouchableOpacity style={styles.headerIcon}>
      <Wrench size={24} color="#FFFFFF" />
    </TouchableOpacity>
  </View>
);

const TabButton = ({ title, icon, active, onPress }) => {
  const Icon = icon;
  return (
    <TouchableOpacity onPress={onPress} style={[styles.tabButton, active && styles.tabButtonActive]}>
      <Icon size={20} color={active ? '#E94E66' : '#FFFFFF'} />
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{title}</Text>
    </TouchableOpacity>
  );
};

const FormRow = ({ label, children, required }) => (
  <View style={styles.formRow}>
    <Text style={styles.formLabel}>{label}{required && ' *'}</Text>
    {children}
  </View>
);

const CustomTextInput = ({ placeholder, value, onChangeText }) => (
  <TextInput
    style={styles.textInput}
    placeholder={placeholder}
    placeholderTextColor="#A0A0A0"
    value={value}
    onChangeText={onChangeText}
  />
);

const CustomPicker = ({ label }) => (
  <View style={styles.pickerContainer}>
    <Text style={styles.pickerText}>{label}</Text>
    <ChevronDown size={20} color="#4CD964" />
  </View>
);

const CreatorToolsScreen = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState('Create');

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#E94E66', '#A34ED1']}
        style={styles.container}
      >
        <Header onClose={onClose} />
        
        <View style={styles.tabContainer}>
          <TabButton title="Create" icon={Plus} active={activeTab === 'Create'} onPress={() => setActiveTab('Create')} />
          <TabButton title="Library" icon={BookOpen} active={activeTab === 'Library'} onPress={() => setActiveTab('Library')} />
          <TabButton title="Community" icon={Users} active={activeTab === 'Community'} onPress={() => setActiveTab('Community')} />
          <TabButton title="Settings" icon={Settings} active={activeTab === 'Settings'} onPress={() => setActiveTab('Settings')} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.creationSection}>
            <Text style={styles.sectionTitle}>Character Creation</Text>
            <Text style={styles.sectionSubtitle}>Create custom characters with AI assistance</Text>

            <View style={styles.formCard}>
              <FormRow label="Character Template">
                <CustomPicker label="Sherlock Holmes" />
              </FormRow>
              <FormRow label="Character Name" required>
                <CustomTextInput placeholder="Enter character name..." />
              </FormRow>
              <FormRow label="Era">
                 <CustomPicker label="Victorian England" />
              </FormRow>
              <FormRow label="Social Class">
                <CustomTextInput placeholder="e.g. Upper class, Middle class, Working class..." />
              </FormRow>
              <FormRow label="Primary Trait" required>
                <CustomTextInput placeholder="e.g. Intellectual, Passionate, Mysterious..." />
              </FormRow>
            </View>
          </View>
        </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerIcon: {
    padding: 5,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#E94E66',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  creationSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sectionSubtitle: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
  },
  formRow: {
    marginBottom: 20,
  },
  formLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
});

export default CreatorToolsScreen;