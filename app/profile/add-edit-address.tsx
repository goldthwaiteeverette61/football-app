import { useWebCompatibleAlert } from '@/components/WebCompatibleAlert';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
    Button,
    Card,
    Text,
    TextInput,
    useTheme
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiClient } from '../../services/apiClient';

// 地址數據類型定義
interface WalletAddress {
  walletId: string;
  userId: number;
  address: string;
  privateKeyEncrypted: string | null;
  createdAt: string;
  name: string;
  note: string;
}

export default function AddEditAddressScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { walletId } = useLocalSearchParams<{ walletId?: string }>();
  const alert = useWebCompatibleAlert();
  
  const isEdit = !!walletId;
  const [loading, setLoading] = useState(false);
  
  // 表單數據
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    note: ''
  });

  // 表單驗證
  const [errors, setErrors] = useState({
    name: '',
    address: '',
    note: ''
  });

  // 編輯模式下加載數據
  useEffect(() => {
    if (isEdit && walletId) {
      loadAddressData();
    }
  }, [isEdit, walletId]);

  // 加載地址數據（編輯模式）
  const loadAddressData = async () => {
    try {
      setLoading(true);
      console.log('🔍 加載地址數據:', walletId);
      
      // 調用獲取地址列表API，然後篩選出對應的地址
      const response = await apiClient.get('/app/userWallets/list');
      
      if (response.success && response.data && response.data.rows) {
        const targetAddress = response.data.rows.find((addr: WalletAddress) => addr.walletId === walletId);
        if (targetAddress) {
          setFormData({
            name: targetAddress.name,
            address: targetAddress.address,
            note: targetAddress.note
          });
          console.log('✅ 地址數據加載成功:', targetAddress);
        } else {
          console.warn('⚠️ 未找到對應的地址數據');
          alert('錯誤', '未找到對應的地址數據');
        }
      } else {
        console.error('❌ 地址數據加載失敗:', response.message);
        alert('錯誤', '加載地址數據失敗');
      }
    } catch (error) {
      console.error('❌ 加載地址數據異常:', error);
      alert('錯誤', '加載地址數據失敗');
    } finally {
      setLoading(false);
    }
  };

  // 驗證表單
  const validateForm = () => {
    const newErrors = {
      name: '',
      address: '',
      note: ''
    };

    if (!formData.name.trim()) {
      newErrors.name = '請輸入錢包名稱';
    }

    if (!formData.address.trim()) {
      newErrors.address = '請輸入錢包地址';
    } else if (!isValidAddress(formData.address)) {
      newErrors.address = '請輸入有效的錢包地址';
    }

    // 備註不是必填項，不需要驗證

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  // 驗證地址格式
  const isValidAddress = (address: string) => {
    // BSC(BEP20)地址驗證（以0x開頭，42位字符）
    const bep20Pattern = /^0x[a-fA-F0-9]{40}$/;
    
    return bep20Pattern.test(address);
  };

  // 提交表單
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      console.log('💾 提交地址數據:', formData);

      if (isEdit) {
        // 编辑模式 - 使用PUT方法
        console.log('🔄 編輯模式：準備發送PUT請求');
        console.log('📍 请求URL:', '/app/userWallets');
        console.log('📦 请求数据:', formData);
        
        // 确保请求体格式正确，walletId放在请求体中
        const requestData = {
          walletId: walletId,
          name: formData.name,
          address: formData.address,
          note: formData.note
        };
        
        console.log('🚀 发送PUT请求到:', '/app/userWallets');
        console.log('📋 PUT请求数据:', JSON.stringify(requestData, null, 2));
        
        const response = await apiClient.put('/app/userWallets', requestData);
        
        if (response.success) {
          console.log('✅ 地址更新成功');
          alert('成功', '地址更新成功', [
            { text: '確定', style: 'default', onPress: () => router.back() }
          ]);
        } else {
          console.error('❌ 地址更新失敗:', response.message);
          alert('錯誤', response.message || '更新失敗，請重試');
        }
      } else {
        // 新增模式 - 使用POST方法
        const response = await apiClient.post('/app/userWallets', formData);
        
        if (response.success) {
          console.log('✅ 地址添加成功');
          alert('成功', '地址添加成功', [
            { text: '確定', style: 'default', onPress: () => router.back() }
          ]);
        } else {
          console.error('❌ 地址添加失敗:', response.message);
          alert('錯誤', response.message || '添加失敗，請重試');
        }
      }
    } catch (error) {
      console.error('❌ 提交异常:', error);
      alert('錯誤', '操作失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: isEdit ? '編輯地址' : '新增地址',
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
      <StatusBar style="light" />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <Card style={[styles.formCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Card.Content style={styles.formContent}>
              {/* 新增模式说明，仅支持BSC */}
              {!isEdit && (
                <Text variant="bodySmall" style={{ marginBottom: 12, color: theme.colors.onSurfaceVariant }}>
                  僅支持 BSC(BEP20) 錢包地址（需以 0x 開頭），其他網絡暫不支持。
                </Text>
              )}
              
              {/* 錢包名稱 */}
              <TextInput
                label="錢包名稱"
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                error={!!errors.name}
                style={styles.input}
                mode="outlined"
                placeholder="請輸入錢包名稱，如：幣安、歐易等"
              />
              {errors.name ? (
                <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.name}
                </Text>
              ) : null}

              {/* 錢包地址 */}
              <TextInput
                label="錢包地址"
                value={formData.address}
                onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                error={!!errors.address}
                style={styles.input}
                mode="outlined"
                placeholder="請輸入BSC(BEP20)錢包地址（0x開頭）"
                multiline
                numberOfLines={2}
              />
              {errors.address ? (
                <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.address}
                </Text>
              ) : null}

              {/* 備註信息 */}
              <TextInput
                label="備註信息（可選）"
                value={formData.note}
                onChangeText={(text) => setFormData(prev => ({ ...prev, note: text }))}
                error={!!errors.note}
                style={styles.input}
                mode="outlined"
                placeholder="請輸入備註信息（可選），如：我的錢包1"
              />
              {errors.note ? (
                <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.note}
                </Text>
              ) : null}

              {/* 提交按钮 */}
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                style={styles.submitButton}
                contentStyle={styles.submitButtonContent}
              >
                {isEdit ? '更新地址' : '添加地址'}
              </Button>
            </Card.Content>
          </Card>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  formCard: {
    marginBottom: 16,
  },
  formContent: {
    padding: 20,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    marginTop: -8,
    marginBottom: 12,
  },
  submitButton: {
    marginTop: 20,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
});
