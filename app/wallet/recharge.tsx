import { useWebCompatibleAlert } from '@/components/WebCompatibleAlert';
import { userApi } from '@/services/userApi';
import { createShadowStyle } from '@/utils/webCompatibility';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import * as MediaLibrary from 'expo-media-library';
import { Stack } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Divider,
  Icon,
  IconButton,
  Snackbar,
  Text,
  useTheme
} from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import { useAuth } from '../../contexts/AuthContext';

export default function RechargeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const alert = useWebCompatibleAlert();
  
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);
  
  // 充值地址（改为从接口获取）
  const [usdtAddress, setUsdtAddress] = useState<string | undefined>(undefined);
  const [usdtNetwork, setUsdtNetwork] = useState<string | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    const loadAddress = async () => {
      try {
        setLoading(true);
        const resp = await userApi.applyDepositWallet();
        if (!mounted) return;
        if (resp.success && resp.data) {
          const raw = resp.data as any;
          const addr = (typeof raw === 'string' ? raw : (raw.address || raw.walletAddress || '')).toString();
          const net = (typeof raw === 'object' && raw?.network ? raw.network : 'BSC(BEP20)').toString();
          setUsdtAddress(addr || undefined);
          setUsdtNetwork(net);
        } else {
          setUsdtAddress(undefined);
        }
      } catch (e) {
        setUsdtAddress(undefined);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadAddress();
    return () => { mounted = false; };
  }, []);

  const handleCopyAddress = async () => {
    if (!usdtAddress) {
      setSnackbarMessage('充值地址不可用，該頁面不支持刷新操作');
      setSnackbarVisible(true);
      return;
    }
    
    try {
      await Clipboard.setString(usdtAddress);
      setSnackbarMessage('地址已複製');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('複製失敗:', error);
      setSnackbarMessage('複製失敗，請重試');
      setSnackbarVisible(true);
    }
  };

  const handleSaveShare = () => {
    alert(
      '選擇操作',
      '請選擇您要執行的操作',
      [
        {
          text: '保存到相冊',
          onPress: handleSaveToAlbum,
        },
        {
          text: '分享給好友',
          onPress: handleShareToFriend,
        },
      ]
    );
  };

  // 安全的截圖方法
  const captureQRCode = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!viewShotRef.current) {
        reject(new Error('ViewShot ref not available'));
        return;
      }

      try {
        // 使用更安全的方式调用 capture
        const captureMethod = viewShotRef.current.capture;
        if (!captureMethod) {
          reject(new Error('Capture method not available'));
          return;
        }
        
        const capturePromise = captureMethod();
        
        if (capturePromise && typeof capturePromise.then === 'function') {
          capturePromise
            .then((uri: string) => {
              if (uri && typeof uri === 'string') {
                resolve(uri);
              } else {
                reject(new Error('Failed to capture image - invalid result'));
              }
            })
            .catch((error: Error) => {
              reject(error);
            });
        } else {
          reject(new Error('Capture method not available'));
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleSaveToAlbum = async () => {
    try {
      setLoading(true);
      console.log('開始保存到相冊');
      
      // 檢查是否在 Expo Go 環境中
      if (Constants.appOwnership === 'expo') {
        setSnackbarMessage('在 Expo Go 中保存功能受限，請使用開發構建');
        setSnackbarVisible(true);
        return;
      }
      
      // 截取二維碼區域
      const imageUri = await captureQRCode();
      
      // 直接保存到相冊，不請求權限（讓系統處理）
      await MediaLibrary.saveToLibraryAsync(imageUri);
      
      setSnackbarMessage('已保存到相冊');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('保存到相冊失敗:', error);
      setSnackbarMessage('保存到相冊失敗，請重試');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleShareToFriend = async () => {
    try {
      setLoading(true);
      console.log('開始分享給好友');
      
      // 檢查分享功能是否可用
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        setSnackbarMessage('分享功能不可用');
        setSnackbarVisible(true);
        return;
      }
      
      // 截取二維碼區域
      const imageUri = await captureQRCode();
      
      // 分享圖片
      await Sharing.shareAsync(imageUri, {
        mimeType: 'image/jpeg',
        dialogTitle: '分享USDT充值碼',
      });
      
      setSnackbarMessage('已分享給好友');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('分享失敗:', error);
      setSnackbarMessage('分享失敗，請重試');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const getBottomPadding = () => {
    return Math.max(insets.bottom, 16);
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: '充值',
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerTitleAlign: 'center',
        }} 
      />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar style="light" />
      
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* USDT充值地址卡片 */}
          <ViewShot 
            ref={viewShotRef} 
            options={{ 
              format: "jpg", 
              quality: 0.9,
              result: 'tmpfile'
            }}
            style={{ backgroundColor: 'transparent' }}
          >
            <View style={[styles.paymentCodeCard, { backgroundColor: theme.colors.surface }]}>
            {/* 頭部標題 */}
            <View style={[styles.paymentCodeHeader, { backgroundColor: theme.colors.primary }]}>
              <Text variant="titleLarge" style={[styles.paymentCodeTitle, { color: theme.colors.onPrimary }]}>
                USDT充值碼
              </Text>
              <Text variant="bodyMedium" style={[styles.paymentCodeSubtitle, { color: theme.colors.onPrimary }]}>
                {usdtNetwork || '幣安智能鏈 BSC(BEP20) 網絡'}
              </Text>
            </View>
            
            {/* 二維碼區域 */}
            <View style={styles.qrCodeArea}>
              {loading ? (
                <View style={styles.loadingAddressContainer}>
                  <ActivityIndicator animating size={36} />
                  <Text variant="bodySmall" style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}>
                    正在獲取充值地址...
                  </Text>
                </View>
              ) : usdtAddress ? (
                <QRCode
                  value={usdtAddress}
                  size={200}
                  color={theme.colors.onSurface}
                  backgroundColor={theme.colors.surface}
                />
              ) : (
                <View style={styles.errorContainer}>
                  <Icon source="alert-circle" size={48} color={theme.colors.error} />
                  <Text variant="bodyMedium" style={[styles.errorText, { color: theme.colors.error }]}>
                    充值系统维护中
                  </Text>
                  <Text variant="bodySmall" style={[styles.errorSubtext, { color: theme.colors.onSurfaceVariant }]}> 
                    該頁面不支持刷新操作
                  </Text>
                </View>
              )}
            </View>
            
            {/* 地址信息 */}
            <View style={styles.addressInfo}>
              <Text variant="bodyMedium" style={[styles.addressLabel, { color: theme.colors.onSurface }]}>
                充值地址
              </Text>
              <View style={styles.addressRow}>
                <Text 
                  variant="bodySmall" 
                  style={[styles.addressValue, { color: theme.colors.onSurfaceVariant }]}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {usdtAddress || '地址不可用'}
                </Text>
                {usdtAddress && (
                  <IconButton
                    icon="content-copy"
                    size={16}
                    onPress={handleCopyAddress}
                    iconColor={theme.colors.primary}
                    style={styles.addressCopyButton}
                  />
                )}
              </View>
            </View>
            
            {/* 使用說明 */}
            <View style={styles.instructionsArea}>
              <Text variant="bodySmall" style={[styles.instructionItem, { color: theme.colors.onSurfaceVariant }]}>
                • 請使用 BSC(BEP20) 網絡發送 USDT
              </Text>
              
              <Text variant="bodySmall" style={[styles.instructionItem, { color: theme.colors.onSurfaceVariant }]}>
                • 到賬時間：5-30分鐘
              </Text>
            </View>
            
            {/* 底部警告 */}
            <View style={styles.warningArea}>
              <Text variant="bodySmall" style={[styles.warningText, { color: theme.colors.error }]}>
                請勿向此地址發送其他代幣
              </Text>
            </View>
            </View>
          </ViewShot>

          {/* 充值說明 */}
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                充值說明
              </Text>
              <View style={styles.instructions}>
                <Text variant="bodySmall" style={[styles.instructionText, { color: theme.colors.onSurfaceVariant }]}>
                  • 請確保使用 BSC(BEP20) 網絡發送 USDT
                </Text>
                
                <Text variant="bodySmall" style={[styles.instructionText, { color: theme.colors.onSurfaceVariant }]}>
                  • BSC 網絡充值將在 5-30 分鐘內到賬
                </Text>
                <Text variant="bodySmall" style={[styles.instructionText, { color: theme.colors.onSurfaceVariant }]}>
                  • 請勿向此地址發送其他代幣，否則將無法找回
                </Text>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>

         {/* 底部充值按鈕 */}
         <View style={[styles.bottomContainer, { 
           backgroundColor: theme.colors.surface,
           paddingBottom: getBottomPadding()
         }]}>
           <Divider style={{ marginBottom: 16 }} />
           <Button
             mode="contained"
             onPress={handleSaveShare}
             loading={loading}
             style={styles.rechargeButton}
             contentStyle={styles.rechargeButtonContent}
           >
             {loading ? '處理中...' : '保存/分享'}
           </Button>
         </View>
      </View>
      
      {/* 輕提示 */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        style={{ marginBottom: 16 }}
      >
        {snackbarMessage}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 0,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  instructions: {
    marginTop: 8,
  },
  instructionText: {
    marginBottom: 8,
    lineHeight: 20,
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingTop: 0,
    marginTop: 0,
  },
  rechargeButton: {
    borderRadius: 12,
  },
  rechargeButtonContent: {
    paddingVertical: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressCopyButton: {
    margin: 0,
    width: 28,
    height: 28,
  },
  paymentCodeCard: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }),
    marginTop: 16,
    marginBottom: 16,
  },
  paymentCodeHeader: {
    padding: 20,
    alignItems: 'center',
  },
  paymentCodeTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  paymentCodeSubtitle: {
    opacity: 0.9,
  },
  qrCodeArea: {
    alignItems: 'center',
    padding: 20,
  },
  addressInfo: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  addressLabel: {
    fontWeight: '600',
    marginBottom: 8,
  },
  addressValue: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
    marginRight: 8,
  },
  instructionsArea: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  instructionItem: {
    marginBottom: 4,
    lineHeight: 18,
  },
  warningArea: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  warningText: {
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  errorText: {
    marginTop: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtext: {
    marginTop: 4,
    textAlign: 'center',
  },
});
