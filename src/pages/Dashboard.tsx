import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';

export default function Dashboard() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [pinnedTools, setPinnedTools] = useState<string[]>([]);

  // Mock Alert Data (Apne DB data se replace karna)
  const lowStockData = [
    { id: '1', name: 'LED Light', pageId: 'pg1', pageName: 'Lights', quantity: 2 },
    { id: '3', name: 'Car Mat', pageId: 'pg2', pageName: 'Accessories', quantity: 1 }
  ];

  useEffect(() => {
    if (isFocused) loadPinnedTools();
  }, [isFocused]);

  const loadPinnedTools = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('pinned_tools');
      if (jsonValue != null) setPinnedTools(JSON.parse(jsonValue));
    } catch(e) { console.log(e) }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Dashboard</Text>

      {/* Pinned Tools Section */}
      {pinnedTools.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Tools</Text>
            <View style={styles.toolsRow}>
                {pinnedTools.map((toolId) => (
                    <TouchableOpacity key={toolId} style={styles.toolChip} onPress={() => navigation.navigate('ToolsHub')}>
                        <Ionicons name="briefcase" size={18} color="#fff" />
                        <Text style={styles.toolText}>{toolId}</Text>
                    </TouchableOpacity>
                ))}
            </View>
          </View>
      )}

      {/* Alerts Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: '#D32F2F' }]}>Low Stock Alerts</Text>
        {lowStockData.map((item) => (
            <TouchableOpacity 
                key={item.id} 
                style={styles.alertCard}
                onPress={() => navigation.navigate('PageView', { 
                    pageId: item.pageId, 
                    pageName: item.pageName, 
                    highlightItemId: item.id // Pass ID to highlight
                })}
            >
                <View>
                    <Text style={styles.alertName}>{item.name}</Text>
                    <Text style={styles.alertDetail}>In: {item.pageName} | Qty: {item.quantity}</Text>
                </View>
                <Ionicons name="chevron-forward-circle" size={24} color="#D32F2F" />
            </TouchableOpacity>
        ))}
      </View>

      <View style={{height: 100}} /> 
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20, paddingTop: 50 },
  header: { fontSize: 30, fontWeight: 'bold', marginBottom: 25, color: '#111' },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15, color: '#444' },
  
  toolsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  toolChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#004AAD', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 25, gap: 8 },
  toolText: { color: '#fff', fontWeight: '600' },

  alertCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFEBEE', padding: 16, borderRadius: 12, marginBottom: 10, borderLeftWidth: 5, borderLeftColor: '#D32F2F' },
  alertName: { fontSize: 16, fontWeight: 'bold', color: '#B71C1C' },
  alertDetail: { fontSize: 13, color: '#D32F2F', marginTop: 2 }
});