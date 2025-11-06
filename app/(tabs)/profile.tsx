import { useWebCompatibleAlert } from '@/components/WebCompatibleAlert';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
  Card,
  List,
  Text,
  useTheme
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CachedAvatar from '../../components/CachedAvatar';

import CustomerServiceModal from '@/components/CustomerServiceModal';
import { useVersionCheckContext } from '@/components/VersionCheckProvider';
import { useAuth } from '@/contexts/AuthContext';
import { getCustomerServiceInfo } from '@/services/dictApi';
import { createShadowStyle, fixWebAvatarDisplay, fixWebTitleDisplay, getWebAvatarContainerStyle, getWebAvatarStyle, getWebHeaderContentStyle, getWebHeaderStyle, getWebUserDetailsStyle, getWebUserInfoStyle } from '@/utils/webCompatibility';

export default function ProfileScreen() {
  const { user, logout, refreshUserInfo } = useAuth();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const alert = useWebCompatibleAlert();
  const [isModalVisible, setModalVisible] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  
  // 版本检查功能
  const { 
    isChecking, 
    hasUpdate, 
    lastCheckTime, 
    checkForUpdates, 
    getCurrentVersion 
  } = useVersionCheckContext();
  
  

  // 页面显示时检查用户信息缓存
  useEffect(() => {
    const checkUserInfo = async () => {
      try {
        // 如果用户信息不存在，才进行刷新
        if (!user) {
          await refreshUserInfo();
        }
        
        // Web平台修复头像显示
        fixWebAvatarDisplay();
        
        // Web平台修复标题显示
        fixWebTitleDisplay();
      } catch (error) {
        console.error('❌ 個人資料頁面：獲取用戶信息失敗:', error);
      }
    };

    checkUserInfo();
  }, [user]); // 只依赖user，避免refreshUserInfo导致的无限循环

  // 添加强制刷新用户信息的功能
  const handleForceRefresh = async () => {
    try {
      await refreshUserInfo();
      alert('刷新成功', '用戶信息已更新');
    } catch (error) {
      console.error('強制刷新失敗:', error);
      alert('刷新失敗', '請稍後重試');
    }
  };

  const handleCustomerSupport = async () => {
    console.log('--- [客服支持] 开始处理 ---');
    try {
      const response = await getCustomerServiceInfo();
      console.log('[客服支持] API 响应:', JSON.stringify(response, null, 2)); 

      // --- 修正開始 ---
      // 根據日誌，API 直接返回一個陣列
      if (Array.isArray(response) && response.length > 0) {
        // CustomerServiceModal 期望一個陣列 (因為它使用了 .map())
        // 我們將 API 返回的完整陣列傳遞給它
        console.log('[客服支持] API 成功, 獲取到陣列數據:', JSON.stringify(response, null, 2));
        setCustomerInfo(response); // <-- 傳遞整個 response 陣列
        
        console.log('[客服支持] 准备打开 Modal...');
        setModalVisible(true);
      } else {
        // 響應不是一個非空陣列
        console.warn('[客服支持] API 失败 (響應不是一個非空陣列):', response);
        alert('错误', '获取客服信息失败或暂无客服信息');
      }
      // --- 修正結束 ---

    } catch (error) {
      console.error('[客服支持] 捕获到 Error:', error);
      alert('错误', '无法连接到服务器');
    }
  };

  const handleMemberCommunity = () => {
    alert(
      '會員社區',
      '是否要打開Telegram進入會員社區？',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '打開',
          onPress: () => {
            const telegramUrl = 'https://t.me/DavidCraft2021'; // ScoreRED 红分群
            Linking.openURL(telegramUrl).catch((err) => {
              console.error('無法打開Telegram:', err);
              alert('錯誤', '無法打開Telegram，請檢查是否已安裝Telegram應用');
            });
          },
        },
      ]
    );
  };

  // 手动检查更新
  const handleCheckForUpdates = async () => {
    if (Platform.OS === 'web') {
      console.log('🌐 Web平台：跳過更新檢查');
      return;
    }
    try {
      await checkForUpdates(true);
    } catch (error) {
      console.error('檢查更新失敗:', error);
    }
  };

  // 格式化最后检查时间
  const formatLastCheckTime = () => {
    if (!lastCheckTime) return '從未檢查';
    const now = new Date();
    const diff = now.getTime() - lastCheckTime.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return '剛剛檢查過';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return `${days}天前`;
  };



  const handleLogout = () => {
    alert(
      '確認登出',
      '您確定要登出嗎？',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '登出',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };


  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      {/* 現代極簡頂部導航 */}
      <View style={[styles.headerContainer, { backgroundColor: theme.colors.primary }, getWebHeaderStyle()]}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={[styles.headerContent, getWebHeaderContentStyle()]}>
            {/* 用戶信息卡片 */}
            <View style={[styles.userInfoCard, getWebHeaderStyle()]}>
              <View style={[styles.userInfo, getWebUserInfoStyle()]}>
                <View style={[styles.avatarContainer, getWebAvatarContainerStyle()]}>
                  <CachedAvatar
                    size={60}
                    source={user?.avatar && user.avatar.trim() !== '' && user.avatar !== 'null' && user.avatar !== 'undefined' 
                      ? { uri: user.avatar } 
                      : null
                    }
                    label={user?.userName?.charAt(0).toUpperCase() || user?.nickName?.charAt(0).toUpperCase() || 'U'}
                    style={[styles.avatar, getWebAvatarStyle()]}
                    fallbackBackgroundColor="rgba(255,255,255,0.2)"
                  />
                </View>
                <View style={[styles.userDetails, getWebUserDetailsStyle()]}>
                  <Text variant="headlineSmall" style={[styles.userName, { color: 'white' }]}>
                    {user?.nickName || user?.userName || '狂奔002'}
                  </Text>
                  <Text variant="bodyMedium" style={[styles.userEmail, { color: 'white', opacity: 0.8 }]}>
                    {user?.email || 'abc@162.com'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 60 + insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >


        {/* 功能操作区域 */}
        <Card style={styles.actionsCard} elevation={2}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              功能操作
            </Text>
            <View style={styles.quickActions}>
              <List.Item
                title="個人信息"
                description="編輯個人資料"
                left={(props) => <List.Icon {...props} icon="account-edit" color={theme.colors.primary} />}
                right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurfaceVariant} />}
                onPress={() => router.push('/profile/edit-profile')}
                style={styles.actionItem}
              />
              <List.Item
                title="安全設置"
                description="密碼與安全"
                left={(props) => <List.Icon {...props} icon="shield-account" color={theme.colors.secondary} />}
                right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurfaceVariant} />}
                onPress={() => router.push('/profile/security-settings')}
                style={styles.actionItem}
              />
              <List.Item
                title="地址管理"
                description="管理錢包地址"
                left={(props) => <List.Icon {...props} icon="wallet" color={theme.colors.primary} />}
                right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurfaceVariant} />}
                onPress={() => router.push('/profile/address-management')}
                style={styles.actionItem}
              />
              <List.Item
                title="倍投包賠"
                description="策略與教程"
                left={(props) => <List.Icon {...props} icon="chart-line" color={theme.colors.tertiary} />}
                right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurfaceVariant} />}
                onPress={() => router.push('/profile/betting-strategy')}
                style={styles.actionItem}
              />
              <List.Item
                title="邀請好友"
                description="分享獲得獎勵"
                left={(props) => <List.Icon {...props} icon="account-plus" color={theme.colors.primary} />}
                right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurfaceVariant} />}
                onPress={() => router.push('/profile/invite-friends')}
                style={styles.actionItem}
              />
              <List.Item
                title="客服支持"
                description="在線幫助"
                left={(props) => <List.Icon {...props} icon="headset" color={theme.colors.error} />}
                right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurfaceVariant} />}
                onPress={handleCustomerSupport}
                style={styles.actionItem}
              />
               <List.Item
                title="退出登錄"
                description="安全退出當前賬戶"
                left={(props) => <List.Icon {...props} icon="power" color={theme.colors.error} />}
                onPress={handleLogout}
                style={styles.logoutActionItem}
                titleStyle={{ color: theme.colors.error }}
                descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
              />
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <CustomerServiceModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        customerInfo={customerInfo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerContainer: {
    paddingBottom: 20,
    height: 160,
  },
  safeArea: {
    height: 140,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    height: 140,
    justifyContent: 'center', // 垂直居中
    alignItems: 'stretch', // 改为stretch，让内容占满宽度
  },
  userInfoCard: {
    borderRadius: 12,
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    padding: 2,
  },
  avatar: {
    // 移除边框样式，让容器处理边框
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },
  menuCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 2,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }),
  },
  menuContent: {
    padding: 0,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  menuTitle: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    borderRadius: 12,
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    opacity: 0.8,
  },
  divider: {
    marginLeft: 20,
    marginRight: 20,
  },
  infoCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 2,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }),
  },
  infoContent: {
    padding: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    flex: 1,
  },
  infoValue: {
    fontWeight: '500',
  },
  // 新增样式 - 参考倍投界面设计
  actionsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  settingsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardContent: {
    padding: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  quickActions: {
    gap: 8,
  },
  actionItem: {
    paddingVertical: 4,
  },
  logoutActionItem: {
    paddingVertical: 4,
  },
  versionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  updateBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
});