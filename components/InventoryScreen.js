/**
 * CanonCraft Phase 8: Inventory & Economy Screen
 * 
 * Displays character inventory, possessions, and economic status
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
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Package, 
  Coins, 
  TrendingUp, 
  Star, 
  Search, 
  Filter, 
  ArrowLeft, 
  Scroll,
  Crown,
  Shield,
  Sword,
  Book,
  Heart,
  Clock,
  MapPin
} from 'lucide-react-native';
import { useGame } from './gameContext';
import { economicNarrativeService } from '../services/economicNarrativeService';

const { width: screenWidth } = Dimensions.get('window');

const InventoryScreen = ({ visible, onClose, characterPack }) => {
  const { state } = useGame();
  
  // State management
  const [activeTab, setActiveTab] = useState('inventory');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Inventory data
  const [inventory, setInventory] = useState([]);
  const [economicStatus, setEconomicStatus] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [inheritances, setInheritances] = useState([]);

  useEffect(() => {
    if (visible && !initialized) {
      initializeInventory();
    }
  }, [visible]);

  const initializeInventory = async () => {
    try {
      setLoading(true);
      console.log('💰 Initializing inventory system...');
      
      // Initialize economic service if needed
      if (!economicNarrativeService.initialized) {
        await economicNarrativeService.initializeEconomicSystem(
          state.currentStory?.id || 'demo',
          state.selectedCharacter || characterPack
        );
      }

      await loadInventoryData();
      setInitialized(true);
      console.log('✅ Inventory system initialized');
    } catch (error) {
      console.error('❌ Failed to initialize inventory:', error);
      Alert.alert('Error', 'Failed to initialize inventory system');
    } finally {
      setLoading(false);
    }
  };

  const loadInventoryData = async () => {
    try {
      const characterId = state.selectedCharacter?.id || characterPack?.id;
      if (!characterId) return;

      // Load inventory items
      const characterInventory = economicNarrativeService.inventoryCache.get(characterId) || [];
      setInventory(characterInventory);

      // Load economic status
      const economics = economicNarrativeService.characterEconomics.get(characterId) || {
        monetary_status: 'moderate',
        social_class: 'middle',
        current_wealth: 500,
        reputation: 'neutral'
      };

      const economicSummary = economicNarrativeService.getCharacterEconomicSummary(characterId);
      setEconomicStatus({
        ...economics,
        ...economicSummary
      });

      // Load recent transactions
      const recentTransactions = economicNarrativeService.transactionHistory.get(characterId) || [];
      setTransactions(recentTransactions.slice(-10)); // Last 10 transactions

      // Load inheritance records
      const inheritanceRecords = economicNarrativeService.inheritanceRecords.get(characterId) || [];
      setInheritances(inheritanceRecords);

    } catch (error) {
      console.error('❌ Failed to load inventory data:', error);
    }
  };

  const getTabIcon = (tabKey, isActive) => {
    const color = isActive ? '#ffffff' : '#8b9dc3';
    const iconMap = {
      'inventory': Package,
      'wealth': Coins,
      'transactions': TrendingUp,
      'inheritance': Crown
    };
    const IconComponent = iconMap[tabKey] || Package;
    return <IconComponent size={20} color={color} />;
  };

  const renderTabButton = (tabKey, title) => {
    const isActive = activeTab === tabKey;
    return (
      <TouchableOpacity
        key={tabKey}
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

  const getCategoryIcon = (category) => {
    const iconMap = {
      'weapon': Sword,
      'armor': Shield,
      'book': Book,
      'jewelry': Star,
      'clothing': Package,
      'tool': Package,
      'currency': Coins,
      'document': Scroll,
      'sentimental': Heart,
      'other': Package
    };
    return iconMap[category] || Package;
  };

  const getConditionColor = (condition) => {
    const colorMap = {
      'pristine': '#27ae60',
      'excellent': '#2ecc71',
      'good': '#f39c12',
      'fair': '#e67e22',
      'poor': '#e74c3c',
      'damaged': '#c0392b'
    };
    return colorMap[condition] || '#95a5a6';
  };

  const renderInventoryTab = () => {
    const filteredInventory = inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      return matchesSearch && matchesCategory;
    });

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Character Inventory</Text>
          <Text style={styles.sectionSubtitle}>
            {inventory.length} items • Total value: {economicStatus?.total_inventory_value || 0} coins
          </Text>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#8b9dc3" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search inventory..."
              placeholderTextColor="#8b9dc3"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} color="#8b9dc3" />
          </TouchableOpacity>
        </View>

        {/* Category Filter */}
        {showFilters && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
            {['all', 'weapon', 'armor', 'book', 'jewelry', 'clothing', 'tool', 'currency', 'document', 'sentimental'].map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  filterCategory === category && styles.activeCategoryButton
                ]}
                onPress={() => setFilterCategory(category)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  filterCategory === category && styles.activeCategoryButtonText
                ]}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Inventory Items */}
        {filteredInventory.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={48} color="#8b9dc3" />
            <Text style={styles.emptyStateText}>No items found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery || filterCategory !== 'all' 
                ? 'Try adjusting your search or filter' 
                : 'Your inventory is empty'}
            </Text>
          </View>
        ) : (
          <View style={styles.inventoryGrid}>
            {filteredInventory.map((item, index) => {
              const CategoryIcon = getCategoryIcon(item.category);
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.inventoryCard}
                  onPress={() => Alert.alert(
                    item.name,
                    `${item.description}\n\nCondition: ${item.condition}\nValue: ${item.current_value} coins\nSentimental Value: ${item.sentimental_value}/10\nAcquired: ${item.acquisition_context}`
                  )}
                >
                  <View style={styles.inventoryCardHeader}>
                    <CategoryIcon size={24} color="#d4af37" />
                    <View 
                      style={[
                        styles.conditionIndicator, 
                        { backgroundColor: getConditionColor(item.condition) }
                      ]} 
                    />
                  </View>
                  <Text style={styles.inventoryCardTitle}>{item.name}</Text>
                  <Text style={styles.inventoryCardDescription}>
                    {item.description?.substring(0, 50)}...
                  </Text>
                  <View style={styles.inventoryCardFooter}>
                    <Text style={styles.inventoryCardValue}>{item.current_value} coins</Text>
                    {item.sentimental_value > 5 && (
                      <Heart size={16} color="#e74c3c" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderWealthTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Economic Status</Text>
        <Text style={styles.sectionSubtitle}>Character wealth and social standing</Text>
      </View>

      {/* Wealth Overview */}
      <View style={styles.wealthCard}>
        <LinearGradient
          colors={['#f39c12', '#e67e22']}
          style={styles.wealthCardGradient}
        >
          <View style={styles.wealthCardHeader}>
            <Coins size={32} color="#ffffff" />
            <Text style={styles.wealthCardTitle}>Current Wealth</Text>
          </View>
          <Text style={styles.wealthCardAmount}>
            {economicStatus?.current_wealth || 0} Coins
          </Text>
          <Text style={styles.wealthCardStatus}>
            {economicStatus?.monetary_status || 'Unknown'} • {economicStatus?.social_class || 'Unknown'} Class
          </Text>
        </LinearGradient>
      </View>

      {/* Economic Details */}
      <View style={styles.economicDetailsCard}>
        <Text style={styles.economicDetailsTitle}>Economic Profile</Text>
        
        <View style={styles.economicDetailRow}>
          <Text style={styles.economicDetailLabel}>Social Class:</Text>
          <Text style={styles.economicDetailValue}>
            {economicStatus?.social_class?.charAt(0).toUpperCase() + economicStatus?.social_class?.slice(1) || 'Unknown'}
          </Text>
        </View>
        
        <View style={styles.economicDetailRow}>
          <Text style={styles.economicDetailLabel}>Reputation:</Text>
          <Text style={styles.economicDetailValue}>
            {economicStatus?.reputation?.charAt(0).toUpperCase() + economicStatus?.reputation?.slice(1) || 'Unknown'}
          </Text>
        </View>
        
        <View style={styles.economicDetailRow}>
          <Text style={styles.economicDetailLabel}>Total Assets:</Text>
          <Text style={styles.economicDetailValue}>
            {economicStatus?.total_assets || 0} Coins
          </Text>
        </View>
        
        <View style={styles.economicDetailRow}>
          <Text style={styles.economicDetailLabel}>Inventory Value:</Text>
          <Text style={styles.economicDetailValue}>
            {economicStatus?.total_inventory_value || 0} Coins
          </Text>
        </View>
      </View>

      {/* Significant Possessions */}
      {economicStatus?.significant_possessions?.length > 0 && (
        <View style={styles.significantPossessionsCard}>
          <Text style={styles.significantPossessionsTitle}>Significant Possessions</Text>
          {economicStatus.significant_possessions.map((item, index) => (
            <View key={index} style={styles.significantPossessionItem}>
              <Star size={16} color="#d4af37" />
              <Text style={styles.significantPossessionText}>{item.name}</Text>
              <Text style={styles.significantPossessionValue}>{item.current_value} coins</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderTransactionsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        <Text style={styles.sectionSubtitle}>Recent economic activities</Text>
      </View>

      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <TrendingUp size={48} color="#8b9dc3" />
          <Text style={styles.emptyStateText}>No transactions yet</Text>
          <Text style={styles.emptyStateSubtext}>Economic activities will appear here</Text>
        </View>
      ) : (
        <View style={styles.transactionsList}>
          {transactions.map((transaction, index) => (
            <View key={index} style={styles.transactionCard}>
              <View style={styles.transactionCardHeader}>
                <Text style={styles.transactionCardType}>{transaction.type}</Text>
                <Text style={[
                  styles.transactionCardAmount,
                  { color: transaction.amount > 0 ? '#27ae60' : '#e74c3c' }
                ]}>
                  {transaction.amount > 0 ? '+' : ''}{transaction.amount} coins
                </Text>
              </View>
              <Text style={styles.transactionCardDescription}>
                {transaction.description}
              </Text>
              <View style={styles.transactionCardFooter}>
                <Clock size={14} color="#8b9dc3" />
                <Text style={styles.transactionCardTime}>
                  {new Date(transaction.timestamp).toLocaleDateString()}
                </Text>
                {transaction.location && (
                  <>
                    <MapPin size={14} color="#8b9dc3" />
                    <Text style={styles.transactionCardLocation}>
                      {transaction.location}
                    </Text>
                  </>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderInheritanceTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Inheritance Records</Text>
        <Text style={styles.sectionSubtitle}>Inherited possessions and wealth</Text>
      </View>

      {inheritances.length === 0 ? (
        <View style={styles.emptyState}>
          <Crown size={48} color="#8b9dc3" />
          <Text style={styles.emptyStateText}>No inheritances received</Text>
          <Text style={styles.emptyStateSubtext}>Inherited items and wealth will appear here</Text>
        </View>
      ) : (
        <View style={styles.inheritancesList}>
          {inheritances.map((inheritance, index) => (
            <View key={index} style={styles.inheritanceCard}>
              <View style={styles.inheritanceCardHeader}>
                <Crown size={24} color="#d4af37" />
                <Text style={styles.inheritanceCardTitle}>
                  Inheritance from {inheritance.deceased_name}
                </Text>
              </View>
              
              {inheritance.wealth > 0 && (
                <View style={styles.inheritanceDetail}>
                  <Coins size={18} color="#f39c12" />
                  <Text style={styles.inheritanceDetailText}>
                    {inheritance.wealth} coins inherited
                  </Text>
                </View>
              )}
              
              {inheritance.items?.length > 0 && (
                <View style={styles.inheritanceDetail}>
                  <Package size={18} color="#3498db" />
                  <Text style={styles.inheritanceDetailText}>
                    {inheritance.items.length} items inherited
                  </Text>
                </View>
              )}
              
              <Text style={styles.inheritanceCardDescription}>
                {inheritance.narrative_context}
              </Text>
              
              <Text style={styles.inheritanceCardTime}>
                Received: {new Date(inheritance.timestamp).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}
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
        colors={['#8e44ad', '#9b59b6', '#3498db']}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Character Inventory</Text>
            <Text style={styles.headerSubtitle}>
              {characterPack?.name || state.selectedCharacter?.name || 'Character'} Possessions
            </Text>
          </View>
          <View style={styles.headerIcon}>
            <Package size={24} color="#ffffff" />
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          {renderTabButton('inventory', 'Items')}
          {renderTabButton('wealth', 'Wealth')}
          {renderTabButton('transactions', 'History')}
          {renderTabButton('inheritance', 'Legacy')}
        </View>

        {/* Content */}
        {loading && !initialized ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Loading inventory...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'inventory' && renderInventoryTab()}
            {activeTab === 'wealth' && renderWealthTab()}
            {activeTab === 'transactions' && renderTransactionsTab()}
            {activeTab === 'inheritance' && renderInheritanceTab()}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 12,
    marginLeft: 10,
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryFilter: {
    marginBottom: 20,
  },
  categoryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  activeCategoryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoryButtonText: {
    color: '#e0e6ed',
    fontSize: 12,
    fontWeight: '500',
  },
  activeCategoryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
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
    textAlign: 'center',
    opacity: 0.8,
  },
  inventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  inventoryCard: {
    width: (screenWidth - 60) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inventoryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  conditionIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  inventoryCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  inventoryCardDescription: {
    fontSize: 12,
    color: '#e0e6ed',
    marginBottom: 10,
    opacity: 0.8,
  },
  inventoryCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inventoryCardValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d4af37',
  },
  wealthCard: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  wealthCardGradient: {
    padding: 25,
    alignItems: 'center',
  },
  wealthCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  wealthCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 10,
  },
  wealthCardAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  wealthCardStatus: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  economicDetailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  economicDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  economicDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  economicDetailLabel: {
    fontSize: 14,
    color: '#e0e6ed',
  },
  economicDetailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  significantPossessionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
  },
  significantPossessionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  significantPossessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  significantPossessionText: {
    flex: 1,
    fontSize: 14,
    color: '#e0e6ed',
    marginLeft: 10,
  },
  significantPossessionValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d4af37',
  },
  transactionsList: {
    paddingBottom: 20,
  },
  transactionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  transactionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionCardType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  transactionCardAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionCardDescription: {
    fontSize: 14,
    color: '#e0e6ed',
    marginBottom: 10,
    opacity: 0.8,
  },
  transactionCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionCardTime: {
    fontSize: 12,
    color: '#8b9dc3',
    marginLeft: 5,
    marginRight: 15,
  },
  transactionCardLocation: {
    fontSize: 12,
    color: '#8b9dc3',
    marginLeft: 5,
  },
  inheritancesList: {
    paddingBottom: 20,
  },
  inheritanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#d4af37',
  },
  inheritanceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  inheritanceCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 10,
  },
  inheritanceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inheritanceDetailText: {
    fontSize: 14,
    color: '#e0e6ed',
    marginLeft: 8,
  },
  inheritanceCardDescription: {
    fontSize: 14,
    color: '#e0e6ed',
    marginTop: 10,
    marginBottom: 10,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  inheritanceCardTime: {
    fontSize: 12,
    color: '#8b9dc3',
  },
});

export default InventoryScreen; 