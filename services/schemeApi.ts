import { apiClient, ApiResponse } from './apiClient';

// 方案汇总数据接口
export interface SchemeSummaryData {
  systemReserveAmount: string;           // 系统储备金额（理赔奖池）
  cumulativeLostAmountSinceWin: string;  // 自上次盈利以来累计亏损金额（连黑成本）
  currentPeriodFollowAmount: string;     // 当前周期跟投金额（本单下注）
  cumulativeLostBetCountSinceWin: number; // 自上次盈利以来累计亏损次数（连黑次数）
  compensationStatus: boolean;           // 理赔状态
  betAmount: string | null;              // 投注金额
  commissionRate: string;                // 佣金比例
  betType: 'normal' | 'double';          // 投注类型：normal=普通投注，double=倍投
}

export interface SchemeSummaryResponse {
  code: number;
  msg: string;
  data: SchemeSummaryData;
}

// 比赛详情接口
export interface MatchDetail {
  detailId: string;
  periodId: string;
  matchId: number;
  poolCode: string;
  selection: string;
  odds: string;
  goalLine: string;
  matchName: string;
  bizMatchesVo: {
    matchId: number;
    matchNum: number;
    matchNumStr: string;
    matchWeek: string;
    businessDate: string;
    matchDatetime: string;
    leagueId: string;
    homeTeamId: number;
    awayTeamId: number;
    halfScore: string;
    fullScore: string;
    winFlag: any;
    status: string;
    sellStatus: string;
    remark: string;
    leagueName: string;
    homeRank: any;
    awayRank: any;
    homeTeamName: string;
    awayTeamName: string;
    homeTeamLogo: string;
    awayTeamLogo: string;
    matchMinute: string;
    matchStatus: string;
    matchPhaseTc: string;
    matchPhaseTcName: string;
    matchName: string;
    had: {
      id: string;
      matchId: number;
      poolCode: string;
      goalLine: string;
      homeOdds: string;
      drawOdds: string;
      awayOdds: string;
      status: string;
      updatedAt: string;
    };
    hhad: {
      id: string;
      matchId: number;
      poolCode: string;
      goalLine: string;
      homeOdds: string;
      drawOdds: string;
      awayOdds: string;
      status: string;
      updatedAt: string;
    };
  };
}

// 今日方案数据接口
export interface SchemePeriodData {
  periodId: string;
  status: string;
  name: string;
  createTime: string;
  resultTime: string | null;
  deadlineTime: string;
  details: MatchDetail[];
}

export interface SchemePeriodResponse {
  code: number;
  msg: string;
  data: SchemePeriodData;
}

// 获取方案汇总数据
export const getSchemeSummary = async (): Promise<ApiResponse<SchemeSummaryData>> => {
  try {
    // 使用缓存优化的API请求
    const response = await apiClient.request<SchemeSummaryResponse>(
      '/app/dashboard/scheme-summary',
      { method: 'GET' }
    );
    
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data,
        message: response.message || '获取方案汇总数据成功'
      };
    } else {
      console.warn('⚠️ getSchemeSummary: 数据获取失败:', response.message);
      return {
        success: false,
        data: undefined,
        message: response.message || '获取方案汇总数据失败'
      };
    }
  } catch (error) {
    console.error('❌ getSchemeSummary: 网络请求失败:', error);
    return {
      success: false,
      data: undefined,
      message: '网络错误，请稍后重试'
    };
  }
};

// 获取今日方案数据
export const getTodayScheme = async (): Promise<ApiResponse<SchemePeriodData>> => {
  try {
    const response = await apiClient.get<SchemePeriodResponse>('/app/schemePeriods/findActiveOrRecentPeriod');
    
    if (response.success) {
      // 检查响应数据结构
      if (response.data && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.msg || '获取今日方案成功'
        };
      } else if (response.data) {
        return {
          success: true,
          data: response.data as SchemePeriodData,
          message: '获取今日方案成功'
        };
      } else {
        console.warn('⚠️ getTodayScheme: 响应成功但数据为空');
        return {
          success: false,
          data: undefined,
          message: '暂无方案数据'
        };
      }
    } else {
      console.warn('⚠️ getTodayScheme: API调用失败:', response.message);
      return {
        success: false,
        data: undefined,
        message: response.message || '获取今日方案失败'
      };
    }
  } catch (error) {
    console.error('❌ getTodayScheme: 网络错误:', error);
    return {
      success: false,
      data: undefined,
      message: '网络错误，请稍后重试'
    };
  }
};

// 红单趋势统计接口
interface RedTrendStats {
  totalWon: number;        // 红单数
  totalLost: number;       // 黑单数
  totalCount: number;
  winRate: number;
  recentResults: ('won' | 'lost' | 'pending')[];  // 最近结果，won=红单，lost=黑单
}

// 获取红单趋势统计信息
export const getRedTrendStats = async (): Promise<ApiResponse<RedTrendStats>> => {
  try {
    const response = await apiClient.get<RedTrendStats>('/app/schemePeriods/dashboard');
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: '获取红单趋势统计成功'
      };
    } else {
      return {
        success: false,
        data: undefined,
        message: response.message || '获取红单趋势统计失败'
      };
    }
  } catch (error) {
    console.error('❌ getRedTrendStats 错误:', error);
    return {
      success: false,
      data: undefined,
      message: '网络错误，请稍后重试'
    };
  }
};

// 方案详情接口
export interface SchemeDetail {
  detailId: string;
  periodId: string;
  matchId: number;
  poolCode: string;
  selection: string;
  odds: string;
  goalLine: string;
  matchName: string;
  bizMatchesVo: {
    matchId: number;
    matchNum: number;
    matchNumStr: string;
    businessDate: string;
    matchDatetime: string;
    leagueName: string;
    homeTeamName: string;
    awayTeamName: string;
    homeTeamLogo: string | null;
    awayTeamLogo: string | null;
    halfScore: string | null;
    fullScore: string | null;
    matchStatus: string | null;
    matchPhaseTcName: string | null;
    had?: {
      homeOdds: string;
      drawOdds: string;
      awayOdds: string;
    };
    hhad?: {
      goalLine: string;
      homeOdds: string;
      drawOdds: string;
      awayOdds: string;
    };
  };
}

// 方案列表项接口
export interface SchemeListItem {
  periodId: string;
  status: 'won' | 'lost' | 'pending';
  name: string;
  createTime: string;
  resultTime: string | null;
  deadlineTime: string | null;
  details: SchemeDetail[];
}

// 方案列表响应接口
export interface SchemeListResponse {
  total: number;
  rows: SchemeListItem[];
  code: number;
  msg: string;
  extra: any;
}

// 获取方案列表
export const getSchemeList = async (pageNum: number = 1, pageSize: number = 10): Promise<ApiResponse<SchemeListItem[]>> => {
  try {
    const response = await apiClient.get<SchemeListResponse>('/app/schemePeriods/list', {
      params: { pageNum, pageSize }
    });
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.rows || [],
        message: response.data.msg || '获取方案列表成功'
      };
    } else {
      return {
        success: false,
        data: undefined,
        message: response.message || '获取方案列表失败'
      };
    }
  } catch (error) {
    console.error('❌ getSchemeList 错误:', error);
    return {
      success: false,
      data: undefined,
      message: '网络错误，请稍后重试'
    };
  }
};