/**
 * 版本检查Hook
 */

import { versionApi, VersionInfo } from '@/services/versionApi';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Updates from 'expo-updates';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

export const useVersionCheck = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<VersionInfo | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  // 获取当前版本号
  const getCurrentVersion = useCallback(() => {
    // 优先使用expo-constants中的版本号
    const version = Constants.expoConfig?.version || 
                   Constants.manifest?.version || 
                   Updates.manifest?.version || 
                   '1.1.0';
    
    
    return version;
  }, []);

  // 获取设备ID
  const getDeviceId = useCallback(async () => {
    try {
      // 使用expo-device获取设备信息
      const deviceInfo = {
        osBuildId: Device.osBuildId || 'unknown',
        modelId: Device.modelId || 'unknown',
        osVersion: Device.osVersion || 'unknown',
        platform: Platform.OS
      };
      
      // 生成一个基于设备信息的唯一ID
      const deviceId = `${deviceInfo.platform}-${deviceInfo.osBuildId}-${deviceInfo.modelId}`;
      return deviceId;
    } catch (error) {
      console.error('获取设备ID失败:', error);
      return 'unknown-device';
    }
  }, []);

  // 检查更新
  const checkForUpdates = useCallback(async (showDialog = true) => {
    if (Platform.OS !== 'android') {
      return;
    }

    setIsChecking(true);
    try {
      const deviceId = await getDeviceId();
      const currentVersion = getCurrentVersion();


      const response = await versionApi.checkVersion({
        platform: 'android',
        currentVersion,
        deviceId
      });

      // 修复：正确解析API响应数据结构
      const hasUpdate = response.data?.hasUpdate || response.hasUpdate || false;
      const latestVersion = response.data?.latestVersion || response.latestVersion;
      const updateType = response.data?.updateType || response.updateType;
      const releaseNotes = response.data?.releaseNotes || '';
      const downloadUrl = response.data?.downloadUrl || response.downloadUrl || '';
      const updateSize = response.data?.updateSize || '';
      const checksum = response.data?.checksum || '';
      const minSupportedVersion = response.data?.minSupportedVersion || '';
      const forceUpdate = response.data?.forceUpdate || false;
      const updateDeadline = response.data?.updateDeadline || '';

      if (response.code === 0 && hasUpdate && latestVersion) {
        const versionInfo: VersionInfo = {
          version: latestVersion,
          buildNumber: 0,
          platform: 'android',
          updateType: updateType || 'optional',
          releaseNotes: releaseNotes,
          downloadUrl: downloadUrl,
          fileSize: updateSize ? parseFloat(updateSize.replace('MB', '')) * 1024 * 1024 : 0,
          checksum: checksum,
          minSupportedVersion: minSupportedVersion,
          forceUpdate: forceUpdate,
          updateDeadline: updateDeadline
        };

        setUpdateInfo(versionInfo);
        setHasUpdate(true);

        if (showDialog) {
          showUpdateDialog(versionInfo);
        }
      } else {
        console.log('📱 当前已是最新版本，无需更新');
      }

      setLastCheckTime(new Date());
    } catch (error) {
      console.error('❌ 版本检查失败:', error);
    } finally {
      setIsChecking(false);
    }
  }, [getCurrentVersion, getDeviceId]);

  // 显示更新对话框 - 现在由VersionCheckProvider中的UpdateDialog组件处理
  const showUpdateDialog = useCallback((versionInfo: VersionInfo) => {
    // 设置更新信息，让VersionCheckProvider中的UpdateDialog组件显示
    setUpdateInfo(versionInfo);
    setHasUpdate(true);
  }, [setUpdateInfo, setHasUpdate]);

  // 处理更新 - 简化为打开浏览器
  const handleUpdate = useCallback(async (versionInfo: VersionInfo) => {
    try {
      // 报告升级开始
      await versionApi.reportUpgradeStatus({
        deviceId: await getDeviceId(),
        platform: 'android',
        fromVersion: getCurrentVersion(),
        toVersion: versionInfo.version,
        status: 'started'
      });

      // 打开浏览器到下载页面
      const { Linking } = require('react-native');
      await Linking.openURL(versionInfo.downloadUrl);

    } catch (error) {
      console.error('更新失败:', error);
    }
  }, [getCurrentVersion, getDeviceId]);

  // 自动检查更新（应用启动时）
  useEffect(() => {
    const autoCheckUpdates = async () => {
      // 检查是否在24小时内已经检查过
      const now = new Date();
      const shouldCheck = !lastCheckTime || 
        (now.getTime() - lastCheckTime.getTime()) > 24 * 60 * 60 * 1000;

      if (shouldCheck) {
        await checkForUpdates(false); // 自动检查时不显示对话框
      }
    };

    autoCheckUpdates();
  }, []);

  return {
    isChecking,
    updateInfo,
    hasUpdate,
    lastCheckTime,
    checkForUpdates,
    getCurrentVersion,
    setHasUpdate
  };
};
