// 交易类型常量
export const TRANSACTION_TYPE = {
  RECHARGE: '充值',
  WITHDRAWAL: '提现',
  INTERNAL_TRANSFER_IN: '站内转入',
  INTERNAL_TRANSFER_OUT: '站内转出',
  FEE: '手续费',
  ADJUSTMENT: '系统调账',
  BONUS: '中奖',
  FOLLOW_BET: '倍投',
  REFUND: '退款',
  REWARD_COMPENSATION: '理赔金',
  COMMISSION: '奖励',
  BET: '投注',
} as const;

// 交易状态常量
export const TRANSACTION_STATUS = {
  PENDING: '处理中',
  REJECTED: '已拒绝',
  APPROVED: '已审批',
  CONFIRMED: '成功',
  FAILED: '失败',
  CANCELLED: '已取消',
} as const;

// 交易类型映射函数
export const getTransactionTypeLabel = (type: string): string => {
  return TRANSACTION_TYPE[type as keyof typeof TRANSACTION_TYPE] || type || '未知类型';
};

// 交易状态映射函数
export const getTransactionStatusLabel = (status: string): string => {
  return TRANSACTION_STATUS[status as keyof typeof TRANSACTION_STATUS] || status || '未知状态';
};

// 根据交易类型获取对应的图标
export const getTransactionTypeIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    RECHARGE: 'plus-circle',
    WITHDRAWAL: 'minus-circle',
    INTERNAL_TRANSFER_IN: 'arrow-down-circle',
    INTERNAL_TRANSFER_OUT: 'arrow-up-circle',
    FEE: 'credit-card',
    ADJUSTMENT: 'cog',
    BONUS: 'gift',
    FOLLOW_BET: 'trending-up',
    REFUND: 'undo',
    REWARD_COMPENSATION: 'shield-check',
    COMMISSION: 'star',
    BET: 'receipt',
  };
  
  return iconMap[type] || 'help-circle';
};

// 根据交易类型获取对应的颜色
export const getTransactionTypeColor = (type: string, theme: any): string => {
  const colorMap: Record<string, string> = {
    RECHARGE: theme.colors.primary,
    WITHDRAWAL: theme.colors.error,
    INTERNAL_TRANSFER_IN: theme.colors.primary,
    INTERNAL_TRANSFER_OUT: theme.colors.error,
    FEE: theme.colors.outline,
    ADJUSTMENT: theme.colors.outline,
    BONUS: theme.colors.primary,
    FOLLOW_BET: theme.colors.secondary,
    REFUND: theme.colors.primary,
    REWARD_COMPENSATION: theme.colors.primary,
    COMMISSION: theme.colors.primary,
    BET: theme.colors.error,
  };
  
  return colorMap[type] || theme.colors.outline;
};

// 根据交易状态获取对应的颜色
export const getTransactionStatusColor = (status: string, theme: any): string => {
  const colorMap: Record<string, string> = {
    PENDING: theme.colors.outline,      // 处理中 - 灰色
    REJECTED: theme.colors.error,       // 已拒绝 - 红色
    APPROVED: theme.colors.primary,     // 已审批 - 绿色
    CONFIRMED: theme.colors.primary,    // 成功 - 绿色
    FAILED: theme.colors.error,         // 失败 - 红色
    CANCELLED: theme.colors.outline,    // 已取消 - 灰色
  };
  
  return colorMap[status] || theme.colors.outline;
};
