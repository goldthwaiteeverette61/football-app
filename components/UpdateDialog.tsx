/**
 * 更新对话框组件 - 浏览器跳转版本
 */

import { VersionInfo } from '@/services/versionApi';
import React from 'react';
import { Alert, Dimensions, Linking, Modal, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text, useTheme } from 'react-native-paper';

const { width } = Dimensions.get('window');

interface UpdateDialogProps {
  visible: boolean;
  updateInfo: VersionInfo | null;
  currentVersion?: string;
  onDismiss: () => void;
  onUpdate: () => void;
}

export const UpdateDialog: React.FC<UpdateDialogProps> = ({
  visible,
  updateInfo,
  currentVersion = '1.0.0',
  onDismiss,
  onUpdate
}) => {
  const theme = useTheme();

  if (!updateInfo) return null;

  // 处理更新 - 打开浏览器到下载页面
  const handleUpdate = async () => {
    try {
      // 构建下载页面URL，使用现有的downloadUrl作为基础
      const downloadPageUrl = `${updateInfo.downloadUrl}?version=${updateInfo.version}&current=${currentVersion}`;
      
      const supported = await Linking.canOpenURL(downloadPageUrl);
      if (supported) {
        await Linking.openURL(downloadPageUrl);
        onUpdate();
      } else {
        Alert.alert('错误', '无法打开浏览器，请手动访问下载页面');
      }
    } catch (error) {
      Alert.alert('错误', '打开浏览器失败，请检查网络连接');
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  };

  const getUpdateTypeText = (type: string) => {
    switch (type) {
      case 'force':
        return '强制更新';
      case 'required':
        return '重要更新';
      case 'optional':
        return '可选更新';
      default:
        return '版本更新';
    }
  };

  const getUpdateTypeColor = (type: string) => {
    switch (type) {
      case 'force':
        return theme.colors.error;
      case 'required':
        return theme.colors.primary;
      case 'optional':
        return theme.colors.secondary;
      default:
        return theme.colors.primary;
    }
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="fade"
      onRequestClose={updateInfo.updateType === 'force' ? undefined : onDismiss}
    >
      <View style={styles.overlay}>
        <Card style={[styles.dialog, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.content}>
            <Text 
              variant="headlineSmall" 
              style={[styles.title, { color: theme.colors.onSurface }]}
            >
              {getUpdateTypeText(updateInfo.updateType)}
            </Text>
            
            <View style={styles.versionInfo}>
              <Text variant="bodyMedium" style={[styles.versionText, { color: theme.colors.onSurfaceVariant }]}>
                当前版本: {currentVersion}
              </Text>
              <Text variant="bodyMedium" style={[styles.versionText, { color: theme.colors.onSurfaceVariant }]}>
                最新版本: {updateInfo.version}
              </Text>
              <Text variant="bodyMedium" style={[styles.versionText, { color: theme.colors.onSurfaceVariant }]}>
                更新大小: {formatFileSize(updateInfo.fileSize)}
              </Text>
            </View>

            <Divider style={styles.divider} />

            <Text 
              variant="bodyMedium" 
              style={[styles.notes, { color: theme.colors.onSurface }]}
            >
              更新内容:
            </Text>
            <Text 
              variant="bodySmall" 
              style={[styles.notesContent, { color: theme.colors.onSurfaceVariant }]}
            >
              {updateInfo.releaseNotes}
            </Text>
            
            {updateInfo.updateDeadline && (
              <>
                <Divider style={styles.divider} />
                <Text 
                  variant="bodySmall" 
                  style={[styles.deadline, { color: theme.colors.error }]}
                >
                  更新截止时间: {new Date(updateInfo.updateDeadline).toLocaleString()}
                </Text>
              </>
            )}

            <Divider style={styles.divider} />
            
            <Text 
              variant="bodySmall" 
              style={[styles.instruction, { color: theme.colors.onSurfaceVariant }]}
            >
              点击&quot;立即更新&quot;将在浏览器中打开下载页面
            </Text>
          </Card.Content>
          
          <Card.Actions style={styles.actions}>
            {updateInfo.updateType !== 'force' && (
              <Button 
                onPress={onDismiss}
                mode="outlined"
                style={styles.button}
              >
                稍后更新
              </Button>
            )}
            <Button 
              mode="contained" 
              onPress={handleUpdate}
              style={[styles.button, styles.updateButton]}
              buttonColor={getUpdateTypeColor(updateInfo.updateType)}
            >
              立即更新
            </Button>
          </Card.Actions>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: width * 0.9,
    maxWidth: 400,
    elevation: 8,
    borderRadius: 12,
  },
  content: {
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  versionInfo: {
    marginBottom: 16,
  },
  versionText: {
    marginBottom: 4,
  },
  divider: {
    marginVertical: 16,
  },
  notes: {
    marginBottom: 8,
    fontWeight: '600',
  },
  notesContent: {
    lineHeight: 20,
    marginBottom: 8,
  },
  deadline: {
    textAlign: 'center',
    fontWeight: '600',
  },
  instruction: {
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  actions: {
    padding: 16,
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  updateButton: {
    marginLeft: 8,
  },
});
