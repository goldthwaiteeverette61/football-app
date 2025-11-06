import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Button, Card, Paragraph, Title } from 'react-native-paper';

interface CustomerInfoItem {
  dictCode: string;
  dictLabel: string;
  dictValue: string;
}

interface CustomerServiceModalProps {
  visible: boolean;
  onClose: () => void;
  customerInfo: CustomerInfoItem[] | null;
}

const CustomerServiceModal: React.FC<CustomerServiceModalProps> = ({ visible, onClose, customerInfo }) => {
  if (!customerInfo) {
    return null;
  }

  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>QQ客服</Title>
            {customerInfo.map((item) => (
              <Paragraph key={item.dictCode}>
                {item.dictLabel}: {item.dictValue}
              </Paragraph>
            ))}
          </Card.Content>
          <Card.Actions>
            <Button onPress={onClose}>关闭</Button>
          </Card.Actions>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    width: '80%',
    padding: 20,
  },
});

export default CustomerServiceModal;