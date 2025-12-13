import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { useTranslation } from '../utils/translator'; // Uncomment if translator hook exists
// Agar hook nahi h, to hum temporary logic use karenge niche

export default function PageView({ route, navigation }: any) {
  const { pageId, pageName, highlightItemId } = route.params || {}; 
  
  // Dummy Data (Isse hata kar apna Firebase Fetch lagana)
  const [items, setItems] = useState<any[]>([
    { id: '1', name: 'LED Light', sku: 'L-101', quantity: 10 },
    { id: '2', name: 'Bumper Guard', sku: 'B-202', quantity: 5 },
    { id: '3', name: 'Car Mat', sku: 'C-303', quantity: 20 },
  ]);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [language, setLanguage] = useState('en'); // Temp translator state

  // Agar highlightItemId aata hai (Search/Alert se), to scroll/highlight logic
  useEffect(() => {
    if (highlightItemId) {
        console.log(`Highlighting item: ${highlightItemId}`);
        // ScrollToIndex logic can be added here if list is long
    }
  }, [highlightItemId]);

  // --- FEATURE: INSTANT MOVE UP/DOWN ---
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newItems.length) {
      // 1. UI Update (Instant)
      [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
      setItems(newItems);

      // 2. Database Update (Background)
      // updateFirebaseOrder(newItems);
      console.log('Order updated in Background'); 
    }
  };

  // --- TRANSLATOR TOGGLE ---
  const toggleLanguage = () => {
      setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  };

  const renderItem = ({ item, index }: any) => {
    const isHighlighted = item.id === highlightItemId; 

    return (
      <View style={[styles.row, isHighlighted && styles.highlightRow]}>
        <View style={{ flex: 1 }}>
           <Text style={styles.itemName}>
               {language === 'hi' ? `${item.name} (Hi)` : item.name} 
           </Text>
           <Text style={styles.itemSku}>SKU: {item.sku}</Text>
        </View>

        {isEditMode ? (
          <View style={styles.editControls}>
            <TouchableOpacity onPress={() => moveItem(index, 'up')} style={styles.iconBtn}>
               <Ionicons name="arrow-up-circle" size={30} color="#004AAD" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => moveItem(index, 'down')} style={styles.iconBtn}>
               <Ionicons name="arrow-down-circle" size={30} color="#004AAD" />
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.qty}>{item.quantity}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{flexDirection:'row', alignItems:'center'}}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{pageName || 'Inventory'}</Text>
        </View>
        
        <View style={{flexDirection:'row', alignItems:'center', gap: 15}}>
             {/* Translator Icon */}
            <TouchableOpacity onPress={toggleLanguage} style={styles.transBtn}>
                <Ionicons name="language" size={20} color="#333" />
                <Text style={{fontSize:12, fontWeight:'bold'}}>{language.toUpperCase()}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsEditMode(!isEditMode)}>
                <Ionicons name={isEditMode ? "checkmark-done-circle" : "create-outline"} size={28} color="#004AAD" />
            </TouchableOpacity>
        </View>
      </View>

      <FlatList 
        data={items} 
        renderItem={renderItem} 
        keyExtractor={item => item.id} 
        contentContainerStyle={{paddingBottom: 80}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#eee', backgroundColor:'#fff' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  transBtn: { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'#f0f0f0', padding:6, borderRadius:20},
  
  row: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderColor: '#f0f0f0', alignItems: 'center' },
  highlightRow: { backgroundColor: '#E3F2FD', borderWidth: 1, borderColor: '#004AAD' }, // Blue Highlight
  itemName: { fontSize: 16, fontWeight: '500', color: '#333' },
  itemSku: { fontSize: 12, color: '#888', marginTop: 2 },
  qty: { fontSize: 18, fontWeight: 'bold', color: '#004AAD' },
  editControls: { flexDirection: 'row', gap: 10 },
  iconBtn: { padding: 5 }
});