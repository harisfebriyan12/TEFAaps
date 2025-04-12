import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function Support() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Live Chat Bantuan</Text>
      </View>

      <View style={styles.chatContainer}>
        <Text style={styles.welcomeText}>Halo! Silakan sampaikan konfirmasi pembayaran Anda</Text>
        
        {/* Area chat akan muncul di sini */}
        <View style={styles.chatArea}>
          {/* Pesan akan muncul di sini */}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ketik pesan Anda..."
            multiline
          />
          <TouchableOpacity style={styles.sendButton}>
            <Text style={styles.sendButtonText}>Kirim</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    color: '#1A1A1A',
    fontFamily: 'Poppins_600SemiBold',
  },
  chatContainer: {
    flex: 1,
    padding: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Poppins_400Regular',
  },
  chatArea: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    marginRight: 8,
    fontFamily: 'Poppins_400Regular',
  },
  sendButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  sendButtonText: {
    color: '#FFF',
    fontFamily: 'Poppins_500Medium',
  },
});