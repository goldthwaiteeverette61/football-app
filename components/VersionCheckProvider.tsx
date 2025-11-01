/**
 * 版本检查Provider组件
 * 提供全局版本检查功能
 */

import { useVersionCheck } from '@/hooks/useVersionCheck';
import React, { createContext, ReactNode, useContext } from 'react';
import { UpdateDialog } from './UpdateDialog';

interface VersionCheckContextType {
  isChecking: boolean;
  updateInfo: any;
  hasUpdate: boolean;
  lastCheckTime: Date | null;
  checkForUpdates: (showDialog?: boolean) => Promise<void>;
  getCurrentVersion: () => string;
  setHasUpdate: (hasUpdate: boolean) => void;
}

const VersionCheckContext = createContext<VersionCheckContextType | undefined>(undefined);

interface VersionCheckProviderProps {
  children: ReactNode;
}

export const VersionCheckProvider: React.FC<VersionCheckProviderProps> = ({ children }) => {
  const versionCheck = useVersionCheck();

  return (
    <VersionCheckContext.Provider value={versionCheck}>
      {children}
      <UpdateDialog
        visible={versionCheck.hasUpdate}
        updateInfo={versionCheck.updateInfo}
        currentVersion={versionCheck.getCurrentVersion()}
        onDismiss={() => {
          // 处理对话框关闭
          console.log('更新对话框已关闭');
          // 重置更新状态
          versionCheck.setHasUpdate(false);
          
          // 可选更新时，设置稍后提醒
          if (versionCheck.updateInfo?.updateType === 'optional') {
            setTimeout(() => {
              versionCheck.checkForUpdates(false);
            }, 3 * 24 * 60 * 60 * 1000); // 3天后再次提醒
          }
        }}
        onUpdate={() => {
          // 处理更新操作
          console.log('用户选择更新');
        }}
      />
    </VersionCheckContext.Provider>
  );
};

export const useVersionCheckContext = () => {
  const context = useContext(VersionCheckContext);
  if (context === undefined) {
    throw new Error('useVersionCheckContext must be used within a VersionCheckProvider');
  }
  return context;
};
