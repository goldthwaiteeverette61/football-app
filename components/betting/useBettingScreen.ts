/**
 * 倍投页面自定义Hook
 * 管理倍投页面的状态和业务逻辑
 */

import { useAuth } from '@/contexts/AuthContext';
import { getSchemeSummary, getTodayScheme, SchemePeriodData, SchemeSummaryData } from '@/services/schemeApi';
import { useCallback, useEffect, useState } from 'react';

export function useBettingScreen() {
  const { user, refreshUserInfo } = useAuth();
  
  // 状态管理
  const [countdown, setCountdown] = useState<string>('');
  const [showCompensationTip, setShowCompensationTip] = useState(false);
  const [showCostTip, setShowCostTip] = useState(false);
  const [showBetTip, setShowBetTip] = useState(false);
  const [showLossTip, setShowLossTip] = useState(false);
  const [showSchemeTip, setShowSchemeTip] = useState(false);
  const [schemeData, setSchemeData] = useState<SchemeSummaryData | null>(null);
  const [todayScheme, setTodayScheme] = useState<SchemePeriodData | null>(null);
  const [groupedMatches, setGroupedMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [schemeLoading, setSchemeLoading] = useState(true);

  // 統一的截止時間解析函數（兼容多種格式與安卓解析差異）
  const parseDeadlineMs = useCallback((value: any): number => {
    if (typeof value === 'number') return value;
    if (!value) return NaN;
    let s = String(value).trim();
    // 去掉毫秒小數（如: 2025-09-27 20:00:00.0）
    if (s.includes('.')) s = s.split('.')[0];
    // 優先用正則拆解為本地時間，避免 Android 將無時區 ISO 解析為 UTC
    const m = s.match(/^(\d{4})[-\/]?(\d{1,2})[-\/]?(\d{1,2})[ T]?(\d{1,2}):?(\d{1,2})(?::?(\d{1,2}))?$/);
    if (m) {
      const [_, Y, Mo, D, H, Mi, S] = m;
      const year = Number(Y);
      const month = Number(Mo) - 1;
      const day = Number(D);
      const hour = Number(H);
      const minute = Number(Mi);
      const second = Number(S || '0');
      const constructed = new Date(year, month, day, hour, minute, second).getTime();
      if (!isNaN(constructed)) return constructed;
    }
    // 其次嘗試通用解析
    let ms = Date.parse(s);
    if (!isNaN(ms)) return ms;
    // 替換空格為T
    ms = Date.parse(s.replace(' ', 'T'));
    if (!isNaN(ms)) return ms;
    // 將-替換為/
    ms = Date.parse(s.replace(/-/g, '/'));
    if (!isNaN(ms)) return ms;
    return NaN;
  }, []);

  // 獲取方案狀態顯示文本
  const getSchemeStatusText = useCallback((status: string) => {
    switch (status) {
      case 'pending': return '可投注';
      case 'won': return '已中獎';
      case 'lost': return '未中獎';
      case 'cancelled': return '已取消';
      default: return status;
    }
  }, []);

  // 檢查是否應該顯示方案信息 - 簡化邏輯：只要有數據就顯示
  const shouldShowScheme = useCallback(() => {
    return !!todayScheme;
  }, [todayScheme]);

  // 獲取方案匯總數據
  const fetchSchemeData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getSchemeSummary();
      
      if (response.success && response.data) {
        setSchemeData(response.data);
      } else {
        console.warn('方案匯總數據獲取失敗:', response.message);
        // 設置默認數據
        setSchemeData({
          systemReserveAmount: "0",
          cumulativeLostAmountSinceWin: "0",
          currentPeriodFollowAmount: "0",
          cumulativeLostBetCountSinceWin: 0,
          compensationStatus: false,
          betAmount: null,
          commissionRate: "0",
          betType: 'normal'
        });
      }
    } catch (error) {
      console.error('❌ 方案匯總數據獲取異常:', error);
      // 設置默認數據
      setSchemeData({
        systemReserveAmount: "0",
        cumulativeLostAmountSinceWin: "0",
        currentPeriodFollowAmount: "0",
        cumulativeLostBetCountSinceWin: 0,
        compensationStatus: false,
        betAmount: null,
        commissionRate: "0",
        betType: 'normal'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // 處理比賽數據分組
  const processMatchesData = useCallback((matches: any[]) => {
    const groupedMap = new Map();
    
    matches.forEach((match: any, index: number) => {
      const matchId = match.matchId;
      const bizMatchesVo = match.bizMatchesVo || {};
      const key = `${matchId}_${bizMatchesVo.matchName || 'Unknown'}`;
      
      if (!groupedMap.has(key)) {
        const matchData = {
          matchId: match.matchId,
          matchName: bizMatchesVo.matchName || 'Unknown',
          leagueName: bizMatchesVo.leagueName || '',
          matchNumStr: bizMatchesVo.matchNumStr || '',
          matchDatetime: bizMatchesVo.matchDatetime || '',
          homeTeamName: bizMatchesVo.homeTeamName || '',
          awayTeamName: bizMatchesVo.awayTeamName || '',
          fullScore: bizMatchesVo.fullScore || '',
          matchStatus: bizMatchesVo.matchStatus || '',
          matchMinute: bizMatchesVo.matchMinute || '',
          matchPhaseTc: bizMatchesVo.matchPhaseTc || '',
          had: bizMatchesVo.had || null,
          hhad: bizMatchesVo.hhad || null,
          bettingOptions: [],
          isRed: false, // 是否紅單
        };
        
        groupedMap.set(key, matchData);
      }
      
      const groupedMatch = groupedMap.get(key);
      const bettingOption = {
        detailId: match.detailId,
        poolCode: match.poolCode,
        selection: match.selection,
        odds: match.odds,
        goalLine: match.goalLine,
        isSelected: true, // 默認選中
      };
      
      groupedMatch.bettingOptions.push(bettingOption);
    });
    
    // 按玩法分組投注選項
    const groupedMatches = Array.from(groupedMap.values()).map((match: any) => {
      // 按玩法分組
      const optionsByPool = new Map();
      match.bettingOptions.forEach((option: any) => {
        const poolKey = `${option.poolCode}_${option.goalLine || ''}`;
        if (!optionsByPool.has(poolKey)) {
          optionsByPool.set(poolKey, {
            poolCode: option.poolCode,
            goalLine: option.goalLine,
            selections: []
          });
        }
        optionsByPool.get(poolKey).selections.push(option);
      });
      
      return {
        ...match,
        bettingOptions: Array.from(optionsByPool.values()),
        isRed: false, // 简化处理，不计算红单状态
      };
    });
    
    return groupedMatches;
  }, []);

  // 獲取今日方案數據
  const fetchTodayScheme = useCallback(async () => {
    try {
      setSchemeLoading(true);
      const response = await getTodayScheme();
      
      if (response.success) {
        if (response.data) {
          setTodayScheme(response.data);
          // 處理比賽數據分組
          const processedMatches = processMatchesData(response.data.details || []);
          setGroupedMatches(processedMatches);
        } else {
          console.warn('今日方案數據為空，但API調用成功');
          setTodayScheme(null);
          setGroupedMatches([]);
        }
      } else {
        console.warn('⚠️ 今日方案數據獲取失敗:', response.message);
        setTodayScheme(null);
        setGroupedMatches([]);
      }
    } catch (error) {
      console.error('❌ 今日方案數據獲取異常:', error);
      setTodayScheme(null);
      setGroupedMatches([]);
    } finally {
      setSchemeLoading(false);
    }
  }, [processMatchesData]);

  // 截止時間倒計時（用於等待投注中提示）
  useEffect(() => {
    if (!todayScheme?.deadlineTime) {
      setCountdown('');
      return;
    }
    const deadlineMs = parseDeadlineMs(todayScheme.deadlineTime);
    const formatRemaining = (ms: number) => {
      if (ms <= 0) return '已截止';
      const totalSec = Math.floor(ms / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;
      const hh = String(hours).padStart(2, '0');
      const mm = String(minutes).padStart(2, '0');
      const ss = String(seconds).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    };
    const update = () => {
      if (!deadlineMs || isNaN(deadlineMs)) {
        setCountdown('');
        return;
      }
      const remaining = deadlineMs - Date.now();
      const display = formatRemaining(remaining);
      
      setCountdown(display);
      
      // 如果已截止，返回false表示需要停止定時器
      return remaining > 0;
    };
    
    const initialResult = update();
    if (!initialResult) {
      // 如果初始檢查就發現已截止，不啟動定時器
      return;
    }
    
    const t = setInterval(() => {
      const shouldContinue = update();
      if (!shouldContinue) {
        clearInterval(t);
      }
    }, 1000);
    
    return () => clearInterval(t);
  }, [todayScheme?.deadlineTime, parseDeadlineMs]);

  // 頁面顯示時檢查用戶信息緩存和獲取方案數據
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 如果用戶信息不存在，才進行刷新
        if (!user) {
          await refreshUserInfo();
        }
        // 並行獲取方案匯總數據和今日方案數據
        await Promise.all([
          fetchSchemeData(),
          fetchTodayScheme()
        ]);
      } catch (error) {
        console.error('❌ 倍投頁面：初始化數據失敗:', error);
      }
    };

    initializeData();
  }, [fetchSchemeData, fetchTodayScheme, refreshUserInfo, user]);

  return {
    // 状态
    countdown,
    showCompensationTip,
    showCostTip,
    showBetTip,
    showLossTip,
    showSchemeTip,
    schemeData,
    todayScheme,
    groupedMatches,
    loading,
    schemeLoading,
    user,
    
    // 方法
    setShowCompensationTip,
    setShowCostTip,
    setShowBetTip,
    setShowLossTip,
    setShowSchemeTip,
    parseDeadlineMs,
    getSchemeStatusText,
    shouldShowScheme,
    fetchSchemeData,
    fetchTodayScheme,
  };
}
