import React from 'react';
// 导入 Alert 用于提示，Clipboard 用于复制
import { Modal, StyleSheet, View } from 'react-native';
// 导入 IconButton 用于显示复制图标按钮
import { Button, Card, IconButton, Paragraph, Title } from 'react-native-paper';
// 导入 Expo 的剪贴板模块
import * as Clipboard from 'expo-clipboard';

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

  // 处理复制的函数
  const handleCopy = async (textToCopy: string) => {
    try {
      // 异步将文本设置到剪贴板
      await Clipboard.setStringAsync(textToCopy);
    } catch (e) {
      console.error('复制失败:', e);
    }
  };

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
              // 使用 View 来横向排列文本和按钮
              <View key={item.dictCode} style={styles.infoRow}>
                <Paragraph style={styles.infoText}>
                  {item.dictLabel}: {item.dictValue}
                </Paragraph>
                {/* 复制按钮 */}
                <IconButton
                  icon="content-copy" // "复制" 的 Material Design 图标
                  size={20}
                  onPress={() => handleCopy(item.dictValue)}
                />
              </View>
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
    padding: 10, // 调整内边距以适应
  },
  // 新增样式
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // 两端对齐
    alignItems: 'center', // 垂直居中
    // 确保行不会太挤
    minHeight: 40,
  },
  infoText: {
    flex: 1, // 让文本占据剩余空间
    flexWrap: 'wrap', // 允许文本换行
    marginRight: 8, // 文本和图标间留点空隙
  },
});

export default CustomerServiceModal;