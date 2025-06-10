import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  Switch,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ChevronRight, User, Shield, HelpCircle, Info } from 'lucide-react-native';

const SettingsHeader = ({ onClose }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onClose} style={styles.headerIcon}>
      <ArrowLeft size={24} color="#FFFFFF" />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>Settings</Text>
    <View style={{ width: 24 }} />
  </View>
);

const Section = ({ title, children, icon }) => {
    const Icon = icon;
    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                {Icon && <Icon size={20} color="rgba(255, 255, 255, 0.7)" />}
                <Text style={styles.sectionTitle}>{title}</Text>
            </View>
            <View style={styles.sectionContent}>
                {children}
            </View>
        </View>
    );
};

const SettingsRow = ({ label, children, isLast }) => (
  <View style={[styles.row, !isLast && styles.rowBorder]}>
    <Text style={styles.rowLabel}>{label}</Text>
    {children}
  </View>
);

const SettingsToggle = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const toggleSwitch = () => setIsEnabled(previousState => !previousState);

  return (
    <Switch
      trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#A34ED1' }}
      thumbColor={isEnabled ? '#FFFFFF' : '#f4f3f4'}
      onValueChange={toggleSwitch}
      value={isEnabled}
    />
  );
};

const SettingsLink = () => (
    <TouchableOpacity onPress={() => Alert.alert("Navigate", "This would open a new page.")}>
        <ChevronRight size={22} color="rgba(255, 255, 255, 0.5)" />
    </TouchableOpacity>
);


const SettingsScreen = ({ visible, onClose }) => {
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <LinearGradient colors={['#E94E66', '#A34ED1']} style={styles.container}>
        <SettingsHeader onClose={onClose} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
            
            <Section title="Gameplay" icon={User}>
                <SettingsRow label="Typewriter Effect">
                    <SettingsToggle />
                </SettingsRow>
                <SettingsRow label="AI Story Freedom">
                    <SettingsLink />
                </SettingsRow>
                <SettingsRow label="Content Filters" isLast>
                    <SettingsLink />
                </SettingsRow>
            </Section>

            <Section title="Account" icon={Shield}>
                <SettingsRow label="Manage Subscription">
                     <SettingsLink />
                </SettingsRow>
                <SettingsRow label="Sign Out" isLast>
                    <TouchableOpacity onPress={() => Alert.alert("Sign Out", "You have been signed out.")}>
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>
                </SettingsRow>
            </Section>

            <Section title="About" icon={Info}>
                 <SettingsRow label="Help & FAQ">
                    <SettingsLink />
                </SettingsRow>
                <SettingsRow label="Send Feedback">
                    <SettingsLink />
                </SettingsRow>
                <SettingsRow label="Privacy Policy">
                    <SettingsLink />
                </SettingsRow>
                 <SettingsRow label="Acknowledgements" isLast>
                    <SettingsLink />
                </SettingsRow>
            </Section>
            
            <Text style={styles.versionText}>Version 1.0.0 (Alpha)</Text>

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
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
    textTransform: 'uppercase',
  },
  sectionContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  rowLabel: {
    color: '#FFFFFF',
    fontSize: 17,
  },
  signOutText: {
      color: '#E94E66',
      fontSize: 17,
      fontWeight: '600',
  },
  versionText: {
      color: 'rgba(255, 255, 255, 0.5)',
      textAlign: 'center',
      fontSize: 12,
      marginTop: 20,
  }
});

export default SettingsScreen; 