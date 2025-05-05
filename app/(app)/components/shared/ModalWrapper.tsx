import React from 'react';
import { View, TouchableOpacity, Modal as RNModal, StyleSheet } from 'react-native';

interface ModalProps {
  visible: boolean;
  children: React.ReactNode;
  onClose: () => void;
}

const ModalWrapper = ({ visible, children, onClose }: ModalProps) => {
  return (
    <RNModal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackground}
          activeOpacity={1}
          onPress={onClose}
        />
        {children}
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default ModalWrapper;