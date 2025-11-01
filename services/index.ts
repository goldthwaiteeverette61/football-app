// API服务统一导出
export { authApi } from './authApi';
export { betApi } from './betApi';
export { claimApi } from './claimApi';
export { configApi } from './configApi';
export { dashboardApi } from './dashboardApi';
export { followApi } from './followApi';
export { matchesApi } from './matchesApi';
export { oddsApi } from './oddsApi';
export { ordersApi } from './ordersApi';
export { rewardApi } from './rewardApi';
export { schemeApi } from './schemeApi';
export { transactionApi } from './transactionApi';
export { userApi } from './userApi';
export { versionsApi } from './versionsApi';
export { walletApi } from './walletApi';
export { withdrawalApi } from './withdrawalApi';

// 错误处理服务导出
export { ErrorSeverity, ErrorType, RecoveryStrategy, errorService } from './errorService';

export { apiClient } from './apiClient';
export type { ApiResponse, RequestConfig } from './apiClient';

