import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';

export const AdvanceModal = ({
  visible,
  onClose,
  onConfirm,
  advanceAmount,
  totalAmount,
  seatsCount,
  tourTitle
}) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>⚠️ Seat Confirmation Notice</Text>
          </View>

          <ScrollView style={styles.body}>
            {/* Warning Box */}
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>20% Non-Refundable Advance</Text>
              <Text style={styles.warningText}>
                To lock in {seatsCount} seat(s) for "{tourTitle}", an immediate 20%
                advance payment is required.
              </Text>
              <Text style={styles.strictNotice}>
                STRICT NOTICE: This 20% advance fee is strictly NON-REFUNDABLE upon
                cancellation because transportation & seats are reserved exclusively for you.
              </Text>
            </View>

            {/* Price breakdown */}
            <View style={styles.priceBox}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Total Tour Cost:</Text>
                <Text style={styles.priceVal}>₹{totalAmount?.toLocaleString()}</Text>
              </View>
              <View style={[styles.priceRow, styles.advanceRow]}>
                <Text style={styles.advanceLabel}>20% Advance Due Now:</Text>
                <Text style={styles.advanceVal}>₹{advanceAmount?.toLocaleString()}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.remainLabel}>80% Balance before departure:</Text>
                <Text style={styles.remainVal}>
                  ₹{(totalAmount - advanceAmount)?.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Agreement toggle button */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && <Text style={styles.checkText}>✓</Text>}
              </View>
              <Text style={styles.agreementText}>
                I understand and agree to pay the 20% advance (₹
                {advanceAmount?.toLocaleString()}) and acknowledge that it is
                strictly non-refundable.
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Review</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, !agreed && styles.confirmBtnDisabled]}
              disabled={!agreed}
              onPress={() => {
                if (agreed) onConfirm();
              }}
            >
              <Text style={styles.confirmText}>Agree & Proceed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxHeight: '85%',
    overflow: 'hidden'
  },
  header: {
    backgroundColor: '#f59e0b',
    paddingVertical: 16,
    paddingHorizontal: 20
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  body: {
    padding: 20
  },
  warningBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 16
  },
  warningTitle: {
    color: '#78350f',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4
  },
  warningText: {
    color: '#92400e',
    fontSize: 12,
    lineHeight: 18
  },
  strictNotice: {
    color: '#b45309',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 8,
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 8
  },
  priceBox: {
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3
  },
  advanceRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
    marginTop: 4
  },
  priceLabel: {
    color: '#64748b',
    fontSize: 12
  },
  priceVal: {
    color: '#1e293b',
    fontSize: 12,
    fontWeight: '600'
  },
  advanceLabel: {
    color: '#047857',
    fontWeight: 'bold',
    fontSize: 13
  },
  advanceVal: {
    color: '#047857',
    fontWeight: 'bold',
    fontSize: 15
  },
  remainLabel: {
    color: '#94a3b8',
    fontSize: 11
  },
  remainVal: {
    color: '#64748b',
    fontSize: 11
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94a3b8',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2
  },
  checkboxChecked: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7'
  },
  checkText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  agreementText: {
    flex: 1,
    fontSize: 11,
    color: '#334155',
    lineHeight: 16
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8
  },
  cancelText: {
    color: '#64748b',
    fontWeight: 'bold',
    fontSize: 13
  },
  confirmBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12
  },
  confirmBtnDisabled: {
    backgroundColor: '#cbd5e1'
  },
  confirmText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13
  }
});
