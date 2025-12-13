import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const toolsList = [
  { id: 'Invoice', name: 'Invoice Generator', icon: 'receipt-outline' },
  { id: 'GST', name: 'GST Calculator', icon: 'calculator-outline' },
  { id: 'Margin', name: 'Margin Calculator', icon: 'trending-up-outline' },
  { id: 'Notepad', name: 'Notepad', icon: 'document-text-outline' },
  { id: 'Card', name: 'Digital Card', icon: 'id-card-outline' },
];

export default function ToolsHub() {
  const [pinned, setPinned] = useState<string[]>([]);

  useEffect(() => {
    loadPins();
  }, []);

  const loadPins = async () => {
    const jsonValue = await AsyncStorage.getItem('pinned_tools');
    if (jsonValue) setPinned(JSON.parse(jsonValue));
  };

  const togglePin = async (toolId: string) => {
    let newPinned = [...pinned];
    if (newPinned.includes(toolId)) {
      newPinned = newPinned.filter(id => id !== toolId);
    } else {
      newPinned.push(toolId);
    }
    setPinned(newPinned);
    await AsyncStorage.setItem('pinned_tools', JSON.stringify(newPinned));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Business Tools</Text>
      <View style={styles.grid}>
        {toolsList.map((tool) => (
          <View key={tool.id} style={styles.card}>
            <View style={styles.iconContainer}>
               <Ionicons name={tool.icon as any} size={32} color="#004AAD" />
            </View>
            <Text style={styles.toolName}>{tool.name}</Text>
            
            {/* Pin Button */}
            <TouchableOpacity 
                style={[styles.pinBtn, pinned.includes(tool.id) ? styles.pinnedActive : null]} 
                onPress={() => togglePin(tool.id)}
            >
                <Ionicons 
                    name={pinned.includes(tool.id) ? "push" : "push-outline"} 
                    size={16} 
                    color={pinned.includes(tool.id) ? "#fff" : "#666"} 
                />
                <Text style={[styles.pinText, pinned.includes(tool.id) && {color:'#fff'}]}>
                    {pinned.includes(tool.id) ? "Pinned" : "Pin to Home"}
                </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8', padding: 20, paddingTop: 50 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  
  card: { width: '48%', backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 15, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  iconContainer: { width: 60, height: 60, backgroundColor: '#E3F2FD', borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  toolName: { fontSize: 14, fontWeight: '600', color: '#333', textAlign: 'center', marginBottom: 15 },
  
  pinBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#f0f0f0' },
  pinnedActive: { backgroundColor: '#004AAD' },
  pinText: { fontSize: 11, color: '#666', fontWeight: '600' }
});