import { useWebCompatibleAlert } from '@/components/WebCompatibleAlert';
import { useAuth } from '@/contexts/AuthContext';
import { createShadowStyle } from '@/utils/webCompatibility';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
    Button,
    Divider,
    Modal,
    Portal,
    Text,
    TextInput,
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
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: getBottomPadding() + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* 餘額概覽 */}
          <View style={[styles.balanceSection, { backgroundColor: theme.colors.primary }]}>
            <Text variant="bodyLarge" style={[styles.balanceLabel, { color: theme.colors.onPrimary }]}>
              可用餘額
            </Text>
            <Text variant="displayMedium" style={[styles.balanceAmount, { color: theme.colors.onPrimary }]}>
              {user?.balance || '0.00'}
            </Text>
            <Text variant="titleMedium" style={[styles.balanceUnit, { color: theme.colors.onPrimary }]}>
              USDT
            </Text>
          </View>

          {/* 提現表單 */}
          <View style={[styles.formSection, { backgroundColor: theme.colors.surface }]}>
            {/* 網絡選擇 */}
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <TextInput
                  mode="outlined"
                  value={selectedNetworkLabel}
                  placeholder="選擇網絡"
                  style={styles.inputField}
                  editable={false}
                  left={<TextInput.Icon icon="network" />}
                  right={
                    <TextInput.Icon 
                      icon={showNetworkList ? "chevron-up" : "chevron-down"}
                      onPress={() => setShowNetworkList(!showNetworkList)}
                    />
                  }
                />
                
                {/* 網絡選擇下拉（Web用Modal，原生用浮層） */}
                {showNetworkList && (
                  isWeb ? (
                    <Portal>
                      <Modal
                        visible={showNetworkList}
                        onDismiss={() => setShowNetworkList(false)}
                        contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
                      >
                        <View style={styles.modalContent}>
                          <Text variant="titleMedium" style={{ marginBottom: 8, color: theme.colors.onSurface }}>選擇網絡</Text>
                          {supportedNetworks.map((network) => (
                            <Button
                              key={network.id}
                              mode="text"
                              onPress={() => handleSelectNetwork(network.id)}
                              style={[
                                styles.dropdownItem,
                                selectedNetwork === network.id && { backgroundColor: theme.colors.primaryContainer }
                              ]}
                              textColor={selectedNetwork === network.id ? theme.colors.primary : theme.colors.onSurface}
                              disabled={!network.available}
                            >
                              <Text variant="bodyLarge" style={[
                                styles.dropdownText,
                                { 
                                  color: selectedNetwork === network.id ? theme.colors.primary : theme.colors.onSurface,
                                  opacity: network.available ? 1 : 0.5
                                }
                              ]}>
                                {network.name}
                                {!network.available && ' (即將支持)'}
                              </Text>
                            </Button>
                          ))}
                        </View>
                      </Modal>
                    </Portal>
                  ) : (
                    <View style={[styles.dropdown, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
                      {supportedNetworks.map((network) => (
                        <Button
                          key={network.id}
                          mode="text"
                          onPress={() => handleSelectNetwork(network.id)}
                          style={[
                            styles.dropdownItem,
                            selectedNetwork === network.id && { backgroundColor: theme.colors.primaryContainer }
                          ]}
                          textColor={selectedNetwork === network.id ? theme.colors.primary : theme.colors.onSurface}
                          disabled={!network.available}
                        >
                          <Text variant="bodyLarge" style={[
                            styles.dropdownText,
                            { 
                              color: selectedNetwork === network.id ? theme.colors.primary : theme.colors.onSurface,
                              opacity: network.available ? 1 : 0.5
                            }
                          ]}>
                            {network.name}
                            {!network.available && ' (即将支持)'}
                          </Text>
                        </Button>
                      ))}
                    </View>
                  )
                )}
              </View>
            </View>

            {/* 地址輸入 */}
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <TextInput
                  mode="outlined"
                  value={address}
                  onChangeText={handleAddressInput}
                  placeholder={`輸入${selectedNetworkLabel}地址`}
                  style={styles.inputField}
                  error={address.length > 0 && !validateAddress(address, selectedNetwork)}
                  left={<TextInput.Icon icon="wallet" />}
                  right={
                    <TextInput.Icon 
                      icon={showAddressList ? "chevron-up" : "chevron-down"}
                      onPress={() => setShowAddressList(!showAddressList)}
                    />
                  }
                />
                
                {/* 地址選擇下拉（Web用Modal，原生用浮層） */}
                {showAddressList && (
                  isWeb ? (
                    <Portal>
                      <Modal
                        visible={showAddressList}
                        onDismiss={() => setShowAddressList(false)}
                        contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
                      >
                        <View style={styles.modalContent}>
                          <Text variant="titleMedium" style={{ marginBottom: 8, color: theme.colors.onSurface }}>選擇地址</Text>
                          {addressesLoading ? (
                            <View style={styles.loadingContainer}>
                              <Text variant="bodyMedium" style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>加載中...</Text>
                            </View>
                          ) : savedAddresses && savedAddresses.length > 0 ? (
                            savedAddresses.map((addressItem) => (
                              <Button
                                key={addressItem.id}
                                mode="text"
                                onPress={() => {
                                  handleSelectAddress(addressItem);
                                  setShowAddressList(false);
                                }}
                                style={[
                                  styles.dropdownItem,
                                  selectedAddress === (addressItem.id ? addressItem.id.toString() : '') && { backgroundColor: theme.colors.primaryContainer }
                                ]}
                                textColor={selectedAddress === (addressItem.id ? addressItem.id.toString() : '') ? theme.colors.primary : theme.colors.onSurface}
                              >
                                <Text variant="bodyLarge" style={[
                                  styles.dropdownText,
                                  { color: selectedAddress === (addressItem.id ? addressItem.id.toString() : '') ? theme.colors.primary : theme.colors.onSurface }
                                ]}>
                                  {addressItem.name}
                                </Text>
                              </Button>
                            ))
                          ) : (
                            <View style={styles.emptyContainer}>
                              <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>暫無保存的地址</Text>
                            </View>
                          )}
                        </View>
                      </Modal>
                    </Portal>
                  ) : (
                    <View style={[styles.dropdown, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}> 
                      {addressesLoading ? (
                        <View style={styles.loadingContainer}>
                          <Text variant="bodyMedium" style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>加载中...</Text>
                        </View>
                      ) : savedAddresses && savedAddresses.length > 0 ? (
                        savedAddresses.map((addressItem) => (
                          <Button
                            key={addressItem.id}
                            mode="text"
                            onPress={() => {
                              handleSelectAddress(addressItem);
                              setShowAddressList(false);
                            }}
                            style={[
                              styles.dropdownItem,
                              selectedAddress === (addressItem.id ? addressItem.id.toString() : '') && { backgroundColor: theme.colors.primaryContainer }
                            ]}
                            textColor={selectedAddress === (addressItem.id ? addressItem.id.toString() : '') ? theme.colors.primary : theme.colors.onSurface}
                          >
                            <Text variant="bodyLarge" style={[
                              styles.dropdownText,
                              { color: selectedAddress === (addressItem.id ? addressItem.id.toString() : '') ? theme.colors.primary : theme.colors.onSurface }
                            ]}>
                              {addressItem.name}
                            </Text>
                          </Button>
                        ))
                      ) : (
                        <View style={styles.emptyContainer}>
                          <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>暂无保存的地址</Text>
                        </View>
                      )}
                    </View>
                  )
                )}
              </View>
              
              {address.length > 0 && !validateAddress(address, selectedNetwork) && (
                <Text variant="bodySmall" style={[styles.errorMessage, { color: theme.colors.error }]}>
                  請輸入有效的{selectedNetworkLabel}地址
                </Text>
              )}
            </View>

            {/* 金額輸入 */}
            <View style={styles.inputGroup}>
                <TextInput
                mode="outlined"
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="numeric"
                style={styles.inputField}
                left={<TextInput.Icon icon="currency-usd" />}
                right={<TextInput.Affix text="USDT" />}
                error={amount.length > 0 && !Number.isNaN(parseFloat(amount)) && parseFloat(amount) < withdrawalMin}
              />
              {amount.length > 0 && !Number.isNaN(parseFloat(amount)) && parseFloat(amount) < withdrawalMin && (
                <Text variant="bodySmall" style={[styles.errorMessage, { color: theme.colors.error }]}>最低提現金額為 {withdrawalMin} USDT</Text>
              )}
              
              {/* 備註輸入 */}
              <TextInput
                mode="outlined"
                value={note}
                onChangeText={setNote}
                placeholder="添加備註信息 (可選)"
                style={[styles.inputField, styles.noteInput]}
                left={<TextInput.Icon icon="note-text" />}
              />
            </View>

            {/* 費用明細 */}
            <View style={styles.inputGroup}>
              <Divider style={styles.sectionDivider} />
              
              {/* 提現金額 */}
              <View style={styles.feeItem}>
                <Text variant="bodyMedium" style={[styles.feeItemLabel, { color: theme.colors.onSurfaceVariant }]}> 
                  提現金額
                </Text>
                <Text variant="titleMedium" style={[styles.feeItemValue, { color: theme.colors.onSurface }]}> 
                  {amount || '0.00'} USDT
                </Text>
              </View>
              
              {/* 手續費 */}
              <View style={styles.feeItem}>
                <Text variant="bodyMedium" style={[styles.feeItemLabel, { color: theme.colors.onSurfaceVariant }]}> 
                  網絡手續費
                </Text>
                <Text variant="titleMedium" style={[styles.feeItemValue, { color: theme.colors.onSurface }]}> 
                  {calculateFee()} USDT
                </Text>
              </View>
              {/* 配置提示 */}
              <View style={styles.feeItem}> 
                <Text variant="bodySmall" style={[styles.feeItemLabel, { color: theme.colors.onSurfaceVariant }]}>最低提現金額</Text>
                <Text variant="bodySmall" style={[styles.feeItemValue, { color: theme.colors.onSurfaceVariant }]}>{withdrawalMin} USDT</Text>
              </View>
              
              <Divider style={styles.feeDivider} />
              
              {/* 實際到賬 */}
              <View style={[styles.feeItem, styles.feeItemTotal]}> 
                <Text variant="titleMedium" style={[styles.feeItemLabel, { color: theme.colors.primary }]}> 
                  實際到賬
                </Text>
                <Text variant="titleMedium" style={[styles.feeItemValue, { color: theme.colors.primary }]}> 
                  {calculateReceiveAmount().toFixed(2)} USDT
                </Text>
              </View>
            </View>
          </View>

        </ScrollView>

        {/* 底部按鈕 */}
        <View style={[styles.bottomSection, { 
          backgroundColor: theme.colors.surface,
          paddingBottom: getBottomPadding()
        }]}> 
          <Button
            mode="contained"
            onPress={handleWithdraw}
            loading={loading}
            disabled={loading || !amount || !isAddressValid}
            style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
            contentStyle={styles.submitButtonContent}
            labelStyle={styles.submitButtonLabel}
          >
            確認提現
          </Button>
        </View>
      </View>

      {/* 支付密碼彈窗 */}
      <Portal>
        <Modal
          visible={showPasswordModal}
          onDismiss={handleCancelWithdraw}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.modalContent}>
            <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}> 
              輸入支付密碼
            </Text>
            
            <Text variant="bodyMedium" style={[styles.modalDescription, { color: theme.colors.onSurfaceVariant }]}> 
              請輸入支付密碼以確認提現操作
            </Text>

            <TextInput
              mode="outlined"
              value={payPassword}
              onChangeText={(text) => {
                setPayPassword(text);
                if (passwordError) {
                  setPasswordError(''); // 清除錯誤提示
                }
              }}
              placeholder="請輸入支付密碼"
              secureTextEntry
              style={styles.passwordInput}
              left={<TextInput.Icon icon="lock" />}
              error={!!passwordError}
            />

            {passwordError ? (
              <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}> 
                {passwordError}
              </Text>
            ) : null}

            <View style={styles.modalButtons}> 
              <Button
                mode="outlined"
                onPress={handleCancelWithdraw}
                style={[styles.modalButton, { borderColor: theme.colors.outline }]}
                textColor={theme.colors.onSurface}
              >
                取消
              </Button>
              
              <Button
                mode="contained"
                onPress={handleConfirmWithdraw}
                loading={loading}
                disabled={loading || !payPassword}
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
              >
                確認提現
              </Button>
            </View>
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

