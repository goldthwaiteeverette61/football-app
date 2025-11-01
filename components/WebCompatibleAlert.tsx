import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, Button, Text, useTheme } from 'react-native-paper';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface WebCompatibleAlertProps {
  title: string;
  message: string;
  buttons?: AlertButton[];
}

// 全局状态管理
let globalAlertState: {
  showAlert: (title: string, message: string, buttons?: AlertButton[]) => void;
} = {
  showAlert: () => {},
};

// 全局Alert函数
export const showWebCompatibleAlert = (title: string, message: string, buttons?: AlertButton[]) => {
  globalAlertState.showAlert(title, message, buttons);
};

// Alert组件
export const WebCompatibleAlert: React.FC = () => {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [alertData, setAlertData] = useState<{
    title: string;
    message: string;
    buttons: AlertButton[];
  }>({
    title: '',
    message: '',
    buttons: [],
  });

  // 设置全局状态
  React.useEffect(() => {
    globalAlertState.showAlert = (title: string, message: string, buttons?: AlertButton[]) => {
      setAlertData({
        title,
        message,
        buttons: buttons || [{ text: '确定' }],
      });
      setVisible(true);
    };
  }, []);

  const handleButtonPress = (button: AlertButton) => {
    setVisible(false);
    if (button.onPress) {
      button.onPress();
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={() => setVisible(false)}
        contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.modalContent}>
          <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            {alertData.title}
          </Text>
          <Text variant="bodyMedium" style={[styles.modalDescription, { color: theme.colors.onSurfaceVariant }]}>
            {alertData.message}
          </Text>
          <View style={styles.modalButtons}>
            {alertData.buttons.map((button, index) => (
              <Button
                key={index}
                mode={button.style === 'destructive' ? 'contained' : button.style === 'cancel' ? 'outlined' : 'contained'}
                onPress={() => handleButtonPress(button)}
                style={[
                  styles.modalButton,
                  { marginLeft: index > 0 ? 12 : 0 },
                  button.style === 'destructive' && { backgroundColor: theme.colors.error }
                ]}
                buttonColor={button.style === 'destructive' ? theme.colors.error : undefined}
              >
                {button.text}
              </Button>
            ))}
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    borderRadius: 12,
    minWidth: 280,
    maxWidth: 400,
    alignSelf: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalContent: {
    padding: 24,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
    fontSize: 20,
  },
  modalDescription: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  modalButton: {
    minWidth: 100,
    borderRadius: 8,
  },
});

// 统一使用Modal的Hook
export const useWebCompatibleAlert = () => {
  const alert = React.useCallback((title: string, message: string, buttons?: AlertButton[]) => {
    showWebCompatibleAlert(title, message, buttons);
  }, []);

  return alert;
};
