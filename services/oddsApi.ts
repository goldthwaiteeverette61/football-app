import { apiClient, ApiResponse } from './apiClient';

// 赔率数据接口
interface OddsData {
  [key: string]: any;
}

// odds API服务类
export class OddsApi {
  // 查询比赛赔率列表
  async oddsList(poolCodes: string[]): Promise<ApiResponse<OddsData>> {
    const poolCodesStr = poolCodes.join(',');
    return apiClient.get<OddsData>(`/app/odds/oddsList?poolCodes=${poolCodesStr}`);
  }

  // 查询比赛赔率列表（备用接口）
  async oddsList_1(bo: any, pageQuery: any): Promise<ApiResponse<OddsData>> {
    return apiClient.get<OddsData>('/app/odds/list');
  }
}

// 创建odds API实例
export const oddsApi = new OddsApi();