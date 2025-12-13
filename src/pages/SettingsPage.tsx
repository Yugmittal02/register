import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsPage({ navigation }: any) {
  
  // Handlers
  const handlePrivacy = () => Alert.alert("Privacy Policy", "Policy content goes here...");
  const handleFAQ = () => Alert.alert("FAQ", "Frequently asked questions...");
  const handleFeedback = () => Linking.openURL('mailto:support@automationx.com');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>Settings</Text>

      {/* Menu Options */}
      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem} onPress={handlePrivacy}>
          <View style={styles.menuLeft}>
             <Ionicons name="shield-checkmark-outline" size={22} color="#444" />
             <Text style={styles.menuText}>Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleFAQ}>
          <View style={styles.menuLeft}>
             <Ionicons name="help-circle-outline" size={22} color="#444" />
             <Text style={styles.menuText}>F&Q</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleFeedback}>
          <View style={styles.menuLeft}>
             <Ionicons name="chatbox-ellipses-outline" size={22} color="#444" />
             <Text style={styles.menuText}>Feedback / Contact</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* PROFESSIONAL BRANDING */}
      <View style={styles.brandingFooter}>
         <Text style={styles.poweredBy}>Powered by</Text>
         <Text style={styles.brandName}>AutomationX</Text>
         <View style={styles.brandLine}></View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8', padding: 20, paddingTop: 60 },
  pageTitle: { fontSize: 32, fontWeight: 'bold', marginBottom: 20, color: '#1A1A1A' },
  
  menuContainer: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', elevation: 2 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuText: { fontSize: 16, fontWeight: '500', color: '#333' },

  brandingFooter: { marginTop: 60, alignItems: 'center', opacity: 0.8 },
  poweredBy: { fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
  brandName: { fontSize: 24, fontWeight: '900', color: '#004AAD' },
  brandLine: { width: 40, height: 4, backgroundColor: '#004AAD', marginTop: 8, borderRadius: 2 }
});