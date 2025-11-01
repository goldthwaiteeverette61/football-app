import { useWebCompatibleAlert } from '@/components/WebCompatibleAlert';
import { useFocusEffect } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
    Card,
    Chip,
    IconButton,
    Text,
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

interface AddressListResponse {
  total: number;
  rows: WalletAddress[];
  code: number;
  msg: string;
  extra: any;
}

export default function AddressManagementScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const alert = useWebCompatibleAlert();
  const [addresses, setAddresses] = useState<WalletAddress[]>([]);
  const [loading, setLoading] = useState(true);

  // 獲取地址列表
  const fetchAddressList = async () => {
    try {
      setLoading(true);
      console.log('🔍 開始獲取地址列表');
      
      const response = await apiClient.get<AddressListResponse>('/app/userWallets/list');
      
      if (response.success && response.data) {
        console.log('✅ 地址列表獲取成功:', response.data);
        setAddresses(response.data.rows || []);
      } else {
        console.error('❌ 地址列表獲取失敗:', response.message);
        setAddresses([]);
      }
    } catch (error) {
      console.error('❌ 地址列表獲取異常:', error);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  // 頁面加載時獲取數據
  useEffect(() => {
    fetchAddressList();
  }, []);

  // 頁面獲得焦點時刷新數據
  useFocusEffect(
    useCallback(() => {
      console.log('🎯 地址管理頁面：界面獲得焦點，開始重新加載數據');
      fetchAddressList();
    }, [])
  );

  // 複製地址到剪貼板
  const handleCopyAddress = (address: string) => {
    // 這裡應該使用實際的剪貼板功能
    alert('已複製', `地址已複製到剪貼板：\n${address}`);
  };

  // 新增地址
  const handleAddAddress = () => {
    router.push('/profile/add-edit-address');
  };

  // 編輯地址
  const handleEditAddress = (walletId: string) => {
    router.push(`/profile/add-edit-address?walletId=${walletId}`);
  };

  // 刪除地址
  const handleDeleteAddress = (id: string) => {
    alert(
      '確認刪除',
      '確定要刪除這個地址嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              console.log('🗑️ 刪除地址:', id);
              
              // 調用刪除API
              const response = await apiClient.delete(`/app/userWallets/${encodeURIComponent(id)}`);
              if (response.success) {
                console.log('✅ 地址刪除成功');
                alert('成功', '地址已刪除', [
                  { text: '確定', style: 'default' }
                ]);
                // 重新拉取列表，確保與服務端一致
                await fetchAddressList();
              } else {
                console.error('❌ 地址刪除失敗:', response.message);
                alert('錯誤', response.message || '刪除失敗，請重試');
              }
            } catch (error) {
              console.error('❌ 刪除地址失敗:', error);
              alert('錯誤', '刪除失敗，請重試');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };


  return (
    <>
      <Stack.Screen 
        options={{
          title: '地址管理',
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerTitleAlign: 'center',
          headerRight: () => (
            <IconButton
              icon="plus"
              iconColor={theme.colors.onPrimary}
              size={24}
              onPress={handleAddAddress}
            />
          ),
        }} 
      />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar style="light" />

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
        {/* 地址列表 */}
        {loading ? (
          <Card style={[styles.addressCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Card.Content style={styles.addressCardContent}>
              <Text variant="bodyMedium" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
                加載中...
              </Text>
            </Card.Content>
          </Card>
        ) : addresses.length === 0 ? (
          <Card style={[styles.addressCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Card.Content style={styles.addressCardContent}>
              <Text variant="bodyMedium" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
                暫無地址數據
              </Text>
            </Card.Content>
          </Card>
        ) : (
          addresses.map((address, index) => (
            <Card key={address.walletId} style={[styles.addressCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <Card.Content style={styles.addressCardContent}>
                {/* 顶部：交易所名称和网络标签 */}
                <View style={styles.addressTopRow}>
                  <Text variant="titleMedium" style={[styles.exchangeName, { color: theme.colors.onSurface }]}>
                    {address.name}
                  </Text>
                  <View style={[styles.networkTag, { 
                    backgroundColor: address.address.toLowerCase().startsWith('0x') ? '#1b5e20' : '#f44336'
                  }]}>
                    <Text variant="labelSmall" style={[styles.networkTagText, { color: 'white' }]}>
                      {address.address.toLowerCase().startsWith('0x') ? 'BSC(BEP20)' : '無效地址'}
                    </Text>
                  </View>
                </View>
            
                {/* 地址 */}
                <Text 
                  variant="bodyMedium" 
                  style={[styles.addressValue, { color: theme.colors.onSurface }]}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {address.address}
                </Text>
                
                {/* 操作按钮 */}
                <View style={styles.actionButtons}>
                  <Chip
                    icon="content-copy"
                    onPress={() => handleCopyAddress(address.address)}
                    style={styles.actionChip}
                    textStyle={styles.chipText}
                  >
                    複製
                  </Chip>
                  <Chip
                    icon="pencil"
                    onPress={() => handleEditAddress(address.walletId)}
                    style={[styles.actionChip, styles.editChip]}
                    textStyle={styles.chipText}
                  >
                    編輯
                  </Chip>
                  <Chip
                    icon="delete"
                    onPress={() => handleDeleteAddress(address.walletId)}
                    style={[styles.actionChip, styles.deleteChip]}
                    textStyle={styles.chipText}
                  >
                    刪除
                  </Chip>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
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
  addressCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  addressCardContent: {
    padding: 16,
  },
  addressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exchangeName: {
    fontWeight: '600',
    fontSize: 16,
  },
  networkTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  networkTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  addressValue: {
    fontFamily: 'monospace',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  actionChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  chipText: {
    fontSize: 12,
  },
  editChip: {
    backgroundColor: '#e3f2fd',
  },
  deleteChip: {
    backgroundColor: '#ffebee',
  },
});
