import { useWebCompatibleAlert } from '@/components/WebCompatibleAlert';
import { useAuth } from '@/contexts/AuthContext';
import { createShadowStyle } from '@/utils/webCompatibility';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
    Button,
    Modal,
    Portal,
    Text,
    useTheme
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { configApi } from '../../services/configApi';
import { WalletAddress, walletApi } from '../../services/walletApi';

export default function WithdrawScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const alert = useWebCompatibleAlert();
  
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [showAddressList, setShowAddressList] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('BEP20');
  const [showNetworkList, setShowNetworkList] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<WalletAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [payPassword, setPayPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [withdrawalFee, setWithdrawalFee] = useState<number>(1);
  const [withdrawalMin, setWithdrawalMin] = useState<number>(1);

  // 支持的网络列表
  const supportedNetworks = [
    { id: 'BEP20', name: 'BSC(BEP20)', description: 'BSC網絡', icon: '🔗', available: true },
    { id: 'TRC20', name: 'TRC20', description: '波場網絡', icon: '🔗', available: false },
    { id: 'ERC20', name: 'ERC20', description: '以太坊網絡', icon: '⛓️', available: false },
  ];

  const selectedNetworkInfo = supportedNetworks.find(n => n.id === selectedNetwork);
  const selectedNetworkLabel = selectedNetworkInfo ? selectedNetworkInfo.name : selectedNetwork;
  const isWeb = Platform.OS === 'web';


  const handleSelectAddress = (addressItem: WalletAddress) => {
    setAddress(addressItem.address);
    setSelectedAddress(addressItem.id ? addressItem.id.toString() : null);
  };

  const handleSelectNetwork = (networkId: string) => {
    setSelectedNetwork(networkId);
    setShowNetworkList(false);
    // 切換網絡時清空地址
    setAddress('');
    setSelectedAddress(null);
  };

  // 獲取保存的地址列表
  const fetchSavedAddresses = useCallback(async () => {
    try {
      setAddressesLoading(true);
      console.log('🔄 開始獲取地址列表，網絡:', selectedNetwork);
      
      const response = await walletApi.getAddressList(selectedNetwork);
      console.log('📊 API響應:', response);
      
      if (response.success && response.data && response.data.rows) {
        console.log('✅ 地址列表獲取成功，數量:', response.data.rows.length);
        
        // 轉換API數據格式到我們的WalletAddress格式
        const addresses: WalletAddress[] = response.data.rows.map((item: any) => ({
          id: parseInt(item.walletId), // 將walletId轉換為數字id
          name: item.name || '未命名錢包',
          address: item.address,
          network: selectedNetwork,
          isDefault: false, // API沒有這個字段，默認為false
          createTime: item.createdAt,
          updateTime: item.createdAt
        }));
        
        console.log('✅ 轉換後的地址列表:', addresses);
        setSavedAddresses(addresses);
      } else {
        console.error('❌ 獲取地址列表失敗:', response.message);
        setSavedAddresses([]);
      }
    } catch (error) {
      console.error('❌ 獲取地址列表異常:', error);
      setSavedAddresses([]);
    } finally {
      setAddressesLoading(false);
    }
  }, [selectedNetwork]);

  const handleAddressInput = (inputAddress: string) => {
    setAddress(inputAddress);
    setSelectedAddress(null);
  };

  // 驗證地址格式
  const validateAddress = (address: string, network: string) => {
    switch (network) {
      case 'ERC20':
        const erc20Pattern = /^0x[a-fA-F0-9]{40}$/;
        return erc20Pattern.test(address);
      case 'BEP20':
        const bep20Pattern = /^0x[a-fA-F0-9]{40}$/;
        return bep20Pattern.test(address);
      default:
        return false;
    }
  };

  const isAddressValid = address.length > 0 && validateAddress(address, selectedNetwork);

  // 組件加載時獲取地址列表
  useEffect(() => {
    fetchSavedAddresses();
  }, [selectedNetwork, fetchSavedAddresses]);

  // 獲取配置（提現手續費、最低提現金額）
  useEffect(() => {
    (async () => {
      try {
        const resp = await configApi.getConfigs();
        if (resp.success && resp.data) {
          const fee = parseFloat((resp.data as any).withdrawalFee ?? '1');
          const min = parseFloat((resp.data as any).withdrawalMin ?? '1');
          if (!Number.isNaN(fee)) setWithdrawalFee(fee);
          if (!Number.isNaN(min)) setWithdrawalMin(min);
        }
      } catch (e) {
        console.warn('獲取提現配置失敗，使用默認配置', e);
      }
    })();
  }, []);

  const calculateFee = () => {
    return withdrawalFee; // 使用配置中的手續費
  };

  const calculateReceiveAmount = () => {
    const withdrawAmount = parseFloat(amount) || 0;
    return Math.max(0, withdrawAmount - calculateFee());
  };

  const handleWithdraw = () => {
    if (!amount || !address) {
      alert('提示', '請填寫提現金額和提現地址');
      return;
    }

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      alert('提示', '請輸入有效的提現金額');
      return;
    }

    if (withdrawAmount < withdrawalMin) {
      alert('提示', `最低提現金額為${withdrawalMin} USDT`);
      return;
    }

    if (withdrawAmount > (parseFloat(user?.balance || '0'))) {
      alert('提示', '提現金額不能超過可用餘額');
      return;
    }

    // 顯示支付密碼彈窗
    setShowPasswordModal(true);
  };

  const handleConfirmWithdraw = async () => {
    if (!payPassword) {
      setPasswordError('請輸入支付密碼');
      return;
    }

    setPasswordError(''); // 清除之前的錯誤
    setLoading(true);
    try {
      const response = await walletApi.applyWithdrawal({
        amount: parseFloat(amount),
        toWalletAddress: address,
        payPassword: payPassword
      });

      if (response.success) {
        // 立即關閉密碼彈窗
        setShowPasswordModal(false);
        setPayPassword('');
        setPasswordError('');
        
        alert('成功', '提現申請已提交，請等待處理', [
          {
            text: '確定',
            onPress: () => {
              router.back();
            }
          }
        ]);
      } else {
        // 檢查是否是密碼錯誤
        if (response.message && (response.message.includes('密碼') || response.message.includes('password'))) {
          setPasswordError(response.message);
        } else {
          alert('錯誤', response.message || '提現失敗，請重試');
        }
      }
    } catch (error) {
      console.error('提現失敗:', error);
      // 檢查是否是密碼錯誤
      if (error && typeof error === 'object' && (error as any).message && 
          ((error as any).message.includes('密碼') || (error as any).message.includes('password'))) {
        setPasswordError((error as any).message);
      } else {
        alert('錯誤', '提現失敗，請重試');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelWithdraw = () => {
    setShowPasswordModal(false);
    setPayPassword('');
    setPasswordError('');
  };

  const getBottomPadding = () => {
    return Math.max(insets.bottom, 16);
  };

  const [showMethodModal, setShowMethodModal] = useState(true);

  const openMethod = (type: 'onchain' | 'internal') => {
    setShowMethodModal(false);
    if (type === 'onchain') {
      router.push('/wallet/withdraw-onchain');
    } else {
      router.push('/wallet/transfer-internal');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'USDT提現',
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: { fontWeight: '600' },
          headerTitleAlign: 'center',
        }}
      />
      <StatusBar style="light" />

      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { padding: 16 }]}> 
          <View style={[styles.formSection, { backgroundColor: theme.colors.surface }]}> 
            <Text variant="titleMedium" style={{ marginBottom: 12, color: theme.colors.onSurface }}>
              提現
            </Text>
            <Button mode="contained" onPress={() => setShowMethodModal(true)}>選擇提現方式</Button>
          </View>
        </ScrollView>
      </View>

      <Portal>
        <Modal
          visible={showMethodModal}
          onDismiss={() => setShowMethodModal(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.modalContent}>
            <Text variant="titleMedium" style={{ marginBottom: 12, color: theme.colors.onSurface }}>選擇提現方式</Text>
            <Button mode="contained" onPress={() => openMethod('onchain')} style={{ marginBottom: 12 }}>
              鏈上提現
            </Button>
            <Button mode="outlined" onPress={() => openMethod('internal')}>
              站內轉帳
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 0,
  },
  
  // 餘額概覽
  balanceSection: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    opacity: 0.9,
    marginBottom: 6,
    fontSize: 14,
  },
  balanceAmount: {
    fontWeight: '800',
    marginBottom: 4,
    fontSize: 28,
    lineHeight: 32,
  },
  balanceUnit: {
    opacity: 0.8,
    fontSize: 14,
  },
  
  // 表單區域
  formSection: {
    margin: 12,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    }),
  },
  
  // 輸入組
  inputGroup: {
    marginBottom: 16,
  },
  groupTitle: {
    fontWeight: '700',
    marginBottom: 12,
    fontSize: 16,
    lineHeight: 20,
  },
  sectionDivider: {
    marginVertical: 16,
    opacity: 0.3,
  },
  
  // 輸入容器
  inputContainer: {
    position: 'relative',
  },
  inputField: {
    backgroundColor: 'transparent',
    fontSize: 14,
    minHeight: 48,
  },
  noteInput: {
    marginTop: 16,
  },
  
  // 下拉選擇
  dropdown: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    borderRadius: 6,
    borderWidth: 1,
    maxHeight: 180,
    zIndex: 1000,
    elevation: 6,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
    }),
    overflow: 'hidden',
  },
  dropdownItem: {
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    margin: 0,
    borderRadius: 0,
    minHeight: 44,
  },
  dropdownText: {
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 18,
  },
  loadingContainer: {
    padding: 12,
    alignItems: 'center',
    minHeight: 44,
  },
  loadingText: {
    opacity: 0.7,
    fontSize: 13,
  },
  emptyContainer: {
    padding: 12,
    alignItems: 'center',
    minHeight: 44,
  },
  emptyText: {
    opacity: 0.7,
    fontSize: 13,
  },
  
  
  // 費用明細
  feeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginTop: 8,
    minHeight: 40,
  },
  feeItemTotal: {
    paddingVertical: 16,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    minHeight: 48,
  },
  feeItemLabel: {
    fontWeight: '600',
    letterSpacing: 0.1,
    fontSize: 13,
    lineHeight: 16,
  },
  feeItemValue: {
    fontWeight: '500',
    textAlign: 'right',
    letterSpacing: 0.2,
    fontSize: 13,
    lineHeight: 16,
  },
  feeDivider: {
    marginVertical: 12,
    opacity: 0.3,
  },
  
  // 錯誤消息
  errorMessage: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  
  
  // 底部區域
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    elevation: 6,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
    }),
  },
  submitButton: {
    borderRadius: 12,
    elevation: 3,
  },
  submitButtonContent: {
    paddingVertical: 12,
    minHeight: 48,
  },
  submitButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 18,
  },

  // 支付密碼彈窗
  modalContainer: {
    margin: 20,
    borderRadius: 16,
    elevation: 8,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    }),
  },
  modalContent: {
    padding: 24,
  },
  modalTitle: {
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  passwordInput: {
    marginBottom: 8,
    fontSize: 16,
  },
  errorText: {
    marginBottom: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
  },
});
