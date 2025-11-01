import { useWebCompatibleAlert } from '@/components/WebCompatibleAlert';
import { useAuth } from '@/contexts/AuthContext';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
    Button,
    Card,
    IconButton,
    Text,
    TextInput,
    useTheme
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CachedAvatar from '../../components/CachedAvatar';
import { userApi } from '../../services/userApi';

export default function EditProfileScreen() {
  const { user, forceRefreshUserInfo } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const alert = useWebCompatibleAlert();
  
  const [nickName, setNickName] = useState(user?.nickName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);

  // 選擇頭像
  const handleSelectAvatar = async () => {
    try {
      // 檢查是否在 Expo Go 環境中
      if (__DEV__ && !Constants.appOwnership) {
        alert(
          '開發環境限制', 
          '在 Expo Go 中頭像選擇功能受限，請使用開發構建進行完整測試。',
          [{ text: '確定' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedImageUri = result.assets[0].uri;
        setAvatar(selectedImageUri);
        console.log('頭像選擇成功:', selectedImageUri);
      }
    } catch (error) {
      console.error('選擇頭像失敗:', error);
      alert('錯誤', '選擇頭像失敗，請重試');
    }
  };

  // 上傳頭像
  const handleUploadAvatar = async (imageUri: string) => {
    setLoading(true);
    try {
      console.log('🔄 開始上傳頭像:', imageUri);
      console.log('📁 文件類型檢查:', imageUri.startsWith('file://'));
      
      const avatarResponse = await userApi.uploadAvatar(imageUri);
      
      console.log('📤 頭像上傳響應:', {
        success: avatarResponse.success,
        code: avatarResponse.code,
        message: avatarResponse.message,
        data: avatarResponse.data
      });
      
      if (!avatarResponse.success) {
        throw new Error(avatarResponse.message || '上傳頭像失敗');
      }
      
      // 更新本地頭像URL為服務器返回的URL
      if (avatarResponse.data?.imgUrl) {
        setAvatar(avatarResponse.data.imgUrl);
        console.log('✅ 頭像上傳成功，新URL:', avatarResponse.data.imgUrl);
        
        // 強制刷新用戶信息以更新界面
        await forceRefreshUserInfo();
        
        alert('成功', '頭像上傳成功');
      } else {
        throw new Error('服務器未返回頭像URL');
      }
    } catch (error) {
      console.error('❌ 上傳頭像失敗:', error);
      console.error('❌ 錯誤詳情:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        name: (error as Error).name
      });
      alert('錯誤', (error as Error).message || '上傳頭像失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  // 保存個人信息（僅暱稱和郵箱，不包含頭像）
  const handleSave = async () => {
    if (!nickName.trim()) {
      alert('提示', '請輸入暱稱');
      return;
    }

    if (!email.trim()) {
      alert('提示', '請輸入郵箱');
      return;
    }

    setLoading(true);
    try {
      console.log('開始保存個人信息（不包含頭像）:', { 
        nickName: nickName.trim(), 
        email: email.trim()
      });
      
      // 檢查是否有變化
      const hasNickNameChange = nickName.trim() !== (user?.nickName || '');
      const hasEmailChange = email.trim() !== (user?.email || '');
      
      if (!hasNickNameChange && !hasEmailChange) {
        console.log('沒有檢測到任何變化，直接返回');
        setLoading(false);
        router.back();
        return;
      }
      
      // 更新用戶信息（僅暱稱和郵箱）
      console.log('更新用戶信息:', { 
        nickName: nickName.trim(), 
        email: email.trim() 
      });
      const updateResponse = await userApi.updateProfile({
        nickName: nickName.trim(),
        email: email.trim()
      });
      
      if (!updateResponse.success) {
        throw new Error(updateResponse.message || '更新用戶信息失敗');
      }
      console.log('✅ 用戶信息更新成功');
      
      // 強制刷新用戶信息（更新界面狀態）
      console.log('🔄 開始強制刷新用戶信息...');
      try {
        await forceRefreshUserInfo();
        console.log('✅ 用戶信息強制刷新完成，界面將自動更新');
      } catch (refreshError) {
        console.warn('⚠️ 刷新用戶信息失敗，但保存操作已完成:', refreshError);
        // 即使刷新失敗，也不影響保存成功的提示
      }
      
      alert('成功', '個人信息已更新');
      router.back();
    } catch (error) {
      console.error('保存失敗:', error);
      alert('錯誤', (error as Error).message || '保存失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: '編輯資料',
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
              icon="check"
              iconColor={theme.colors.onPrimary}
              size={24}
              onPress={handleSave}
              disabled={loading}
            />
          ),
        }} 
      />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar style="light" />
        
        <SafeAreaView style={styles.safeArea}>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {/* 頭像編輯區域 */}
          <Card style={styles.avatarCard} elevation={2}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                頭像
              </Text>
              
              <View style={styles.avatarSection}>
                <View style={styles.avatarContainer}>
                  <CachedAvatar
                    size={80}
                    source={avatar && avatar.trim() !== '' && avatar !== 'null' && avatar !== 'undefined' 
                      ? { uri: avatar } 
                      : null
                    }
                    label={nickName?.charAt(0).toUpperCase() || 'U'}
                    style={styles.avatar}
                    fallbackBackgroundColor={theme.colors.primaryContainer}
                  />
                </View>
                
                <View style={styles.avatarButtons}>
                  <Button
                    mode="outlined"
                    onPress={handleSelectAvatar}
                    style={styles.avatarButton}
                    icon="camera"
                  >
                    選擇頭像
                  </Button>
                  
                  <Button
                    mode="contained"
                    onPress={() => handleUploadAvatar(avatar)}
                    style={styles.avatarButton}
                    icon="upload"
                    loading={loading}
                    disabled={loading || !avatar || !avatar.startsWith('file://')}
                  >
                    上傳頭像
                  </Button>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* 個人信息編輯區域 */}
          <Card style={styles.infoCard} elevation={2}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                個人信息
              </Text>
              
              <TextInput
                mode="outlined"
                value={nickName}
                onChangeText={setNickName}
                placeholder="請輸入暱稱"
                style={styles.nicknameInput}
                maxLength={20}
                right={<TextInput.Affix text={`${nickName.length}/20`} />}
              />
              
              <TextInput
                mode="outlined"
                value={email}
                onChangeText={setEmail}
                placeholder="請輸入郵箱"
                style={styles.emailInput}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </Card.Content>
          </Card>
        </ScrollView>
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  avatarCard: {
    marginBottom: 16,
  },
  infoCard: {
    marginBottom: 16,
  },
  cardContent: {
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    // 头像样式
  },
  avatarButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarButton: {
    borderRadius: 8,
    flex: 1,
  },
  nicknameInput: {
    marginTop: 8,
    marginBottom: 16,
  },
  emailInput: {
    marginTop: 0,
  },
});
