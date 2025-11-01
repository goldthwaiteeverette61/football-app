import { useWebCompatibleAlert } from '@/components/WebCompatibleAlert';
import { useAuth } from '@/contexts/AuthContext';
import { footballCalculatorApi } from '@/services/footballCalculatorApi';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    Icon,
    useTheme
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';


interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchTime: string;
  matchNumStr: string;
  goalLine: number;
  odds: {
    spf: { home: number; draw: number; away: number };
    rq: { home: number; draw: number; away: number };
    bf: Record<string, number>;
    zjq: Record<string, number>;
    bqc: Record<string, number>;
  };
}

export default function FootballCalculator() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const alert = useWebCompatibleAlert();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  // 状态管理
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('spf');
  const [selectedBets, setSelectedBets] = useState<{
    matchId: string;
    betType: string;
    result: string;
    odds: number;
    matchInfo: string;
  }[]>([]);
  const [showBettingModal, setShowBettingModal] = useState(false);
  const [betMultiple, setBetMultiple] = useState(1); // 倍数，默认1倍
  const [showMultipleKeyboard, setShowMultipleKeyboard] = useState(false); // 控制数字键盘
  const [showRangeAlert, setShowRangeAlert] = useState(false); // 控制范围提示
  const [showErrorAlert, setShowErrorAlert] = useState(false); // 控制错误提示
  const [errorMessage, setErrorMessage] = useState(''); // 错误消息
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 每注固定金额
  const AMOUNT_PER_BET = 1; // 1 USDT

  // 玩法配置
  const betTypes = useMemo(() => [
    { key: 'spf', label: '勝負平', description: '勝平負和讓球投注' },
    { key: 'bf', label: '比分', description: '具體比分投注' },
    { key: 'zjq', label: '總進球數', description: '總進球數投注' },
    { key: 'bqc', label: '半全場', description: '半全場投注' },
  ], []);

  // 格式化比賽時間
  const formatMatchTime = (timeStr: string): string => {
    if (!timeStr) return '';
    try {
      const [, timePart] = timeStr.split(' ');
      if (timePart) {
        return timePart.substring(0, 5);
      }
      return timeStr;
    } catch {
      return timeStr;
    }
  };

  // 格式化總進球數顯示文本
  const formatGoalText = (goalKey: string): string => {
    if (goalKey.includes('plus') || goalKey.includes('+')) {
      // 處理 7+ 或 goals7plus 格式
      const match = goalKey.match(/(\d+)(plus|\+)/);
      if (match) {
        return `${match[1]}+`;
      }
      return goalKey;
    }
    
    // 處理 goals0, goals1 等格式
    if (goalKey.startsWith('goals')) {
      const number = goalKey.replace('goals', '');
      if (number === '0') {
        return '0球';
      } else if (number.match(/^\d+$/)) {
        return `${number}球`;
      }
    }
    
    // 處理純數字格式
    if (goalKey.match(/^\d+$/)) {
      if (goalKey === '0') {
        return '0球';
      }
      return `${goalKey}球`;
    }
    
    // 其他格式直接返回
    return goalKey;
  };

  // 格式化半全場顯示文本
  const formatBqcText = (bqcKey: string): string => {
    // 處理新API格式：HH, HD, HA, DH, DD, DA, AH, AD, AA
    if (bqcKey.length === 2) {
      const first = bqcKey[0];
      const second = bqcKey[1];
      
      const getResultText = (char: string): string => {
        switch (char.toUpperCase()) {
          case 'H': return '勝';
          case 'D': return '平';
          case 'A': return '負';
          // 兼容舊格式
          case 'S': return '勝';
          case 'P': return '平';
          case 'F': return '負';
          default: return char;
        }
      };
      
      return `${getResultText(first)}${getResultText(second)}`;
    }
    
    // 處理其他格式，如 "勝勝", "勝平" 等
    if (bqcKey.includes('勝') || bqcKey.includes('平') || bqcKey.includes('負')) {
      return bqcKey;
    }
    
    // 其他格式直接返回
    return bqcKey;
  };

  // 格式化比分顯示文本
  const formatScoreText = (scoreKey: string): string => {
    // 處理特殊比分選項
    switch (scoreKey.toUpperCase()) {
      case 'HX': return '勝其它';
      case 'DX': return '平其它';
      case 'AX': return '負其它';
      default: return scoreKey; // 其他比分直接返回
    }
  };

  // 將比分按主勝、平局、客勝分組，並按第一個字符排序
  const groupScoresByResult = (scores: Record<string, number>) => {
    const homeWin: Record<string, number> = {};
    const draw: Record<string, number> = {};
    const awayWin: Record<string, number> = {};
    
    Object.entries(scores).forEach(([score, odds]) => {
      // 特殊處理"勝其它"、"平其它"等非數字比分
      if (score.includes('勝其它') || score.includes('胜其它') || score.includes('胜其他') || score.includes('勝其他')) {
        homeWin[score] = odds;
        return;
      }
      
      if (score.includes('平其它') || score.includes('平其他')) {
        draw[score] = odds;
        return;
      }
      
      const [homeScore, awayScore] = score.split('-').map(Number);
      
      if (homeScore > awayScore) {
        homeWin[score] = odds;
      } else if (homeScore === awayScore) {
        draw[score] = odds;
      } else {
        awayWin[score] = odds;
      }
    });
    
    // 按第一個字符（主隊得分）排序每個組
    const sortByFirstChar = (obj: Record<string, number>) => {
      return Object.fromEntries(
        Object.entries(obj).sort(([a], [b]) => {
          // 處理"勝其它"、"平其它"等非數字比分，放在最後
          const aIsOther = a.includes('其它') || a.includes('其他');
          const bIsOther = b.includes('其它') || b.includes('其他');
          
          if (aIsOther && !bIsOther) return 1;  // a是其它，b不是，a排在後面
          if (!aIsOther && bIsOther) return -1; // a不是其它，b是其它，a排在前面
          if (aIsOther && bIsOther) return 0;   // 都是其它，保持原順序
          
          // 都是數字比分，按第一個數字排序
          const aFirst = parseInt(a.split('-')[0]);
          const bFirst = parseInt(b.split('-')[0]);
          return aFirst - bFirst;
        })
      );
    };

    // 按最後一個字符（客隊得分）排序客勝組
    const sortByLastChar = (obj: Record<string, number>) => {
      return Object.fromEntries(
        Object.entries(obj).sort(([a], [b]) => {
          // 處理"勝其它"、"平其它"等非數字比分，放在最後
          const aIsOther = a.includes('其它') || a.includes('其他');
          const bIsOther = b.includes('其它') || b.includes('其他');
          
          if (aIsOther && !bIsOther) return 1;  // a是其它，b不是，a排在後面
          if (!aIsOther && bIsOther) return -1; // a不是其它，b是其它，a排在前面
          if (aIsOther && bIsOther) return 0;   // 都是其它，保持原順序
          
          // 都是數字比分，按最後一個數字（客隊得分）排序
          const aLast = parseInt(a.split('-')[1]);
          const bLast = parseInt(b.split('-')[1]);
          return aLast - bLast;
        })
      );
    };
    
    return { 
      homeWin: sortByFirstChar(homeWin), 
      draw: sortByFirstChar(draw), 
      awayWin: sortByLastChar(awayWin) 
    };
  };

  // 檢查是否已選擇
  const isSelected = (matchId: string, betType: string, result: string): boolean => {
    return selectedBets.some(bet => 
      bet.matchId === matchId && bet.betType === betType && bet.result === result
    );
  };

  // 選擇比賽結果
  const selectMatchResult = (matchId: string, betType: string, result: string, odds: number) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const matchInfo = `${match.homeTeam} vs ${match.awayTeam}`;
    const existingIndex = selectedBets.findIndex(bet => 
      bet.matchId === matchId && bet.betType === betType && bet.result === result
    );

    if (existingIndex >= 0) {
      // 如果點擊的是已選擇的相同選項，則取消選擇
      const newBets = [...selectedBets];
      newBets.splice(existingIndex, 1);
      setSelectedBets(newBets);
    } else {
      // 檢查同一場比賽是否已有其他玩法的選擇
      const sameMatchOtherBetTypeIndex = selectedBets.findIndex(bet => 
        bet.matchId === matchId && bet.betType !== betType
      );

      if (sameMatchOtherBetTypeIndex >= 0) {
        // 如果同一場比賽已有其他玩法的選擇，先清除所有該比賽的選擇
        const newBets = selectedBets.filter(bet => bet.matchId !== matchId);
        // 然後添加新的選擇
        newBets.push({ matchId, betType, result, odds, matchInfo });
        setSelectedBets(newBets);
    } else {
        // 同一場比賽同一玩法中可以多選，直接添加新選擇
        setSelectedBets([...selectedBets, { matchId, betType, result, odds, matchInfo }]);
      }
    }
  };

  // 清空選擇
  const clearSelection = () => {
    setSelectedBets([]);
    setBetMultiple(1); // 保持默認值1倍，不清空
  };

  // 检查赔率是否有效
  const isOddsValid = (odds: number | undefined | null): boolean => {
    return odds !== undefined && odds !== null && odds > 0;
  };

  // 格式化赔率显示
  const formatOdds = (odds: number | undefined | null): string => {
    return isOddsValid(odds) ? Number(odds).toFixed(2) : '-';
  };

  // 检查玩法是否有任何有效赔率
  const hasValidOddsForPlayType = (match: Match, playType: string): boolean => {
    if (playType === 'spf') {
      // 胜负平：至少有一个有效赔率
      return isOddsValid(match.odds?.spf?.home) || 
             isOddsValid(match.odds?.spf?.draw) || 
             isOddsValid(match.odds?.spf?.away);
    } else if (playType === 'rq') {
      // 让球：至少有一个有效赔率
      return isOddsValid(match.odds?.rq?.home) || 
             isOddsValid(match.odds?.rq?.draw) || 
             isOddsValid(match.odds?.rq?.away);
    } else if (playType === 'bf') {
      // 比分：至少有一个有效赔率
      return Object.values(match.odds?.bf || {}).some(odds => isOddsValid(odds));
    } else if (playType === 'zjq') {
      // 总进球：至少有一个有效赔率
      return Object.values(match.odds?.zjq || {}).some(odds => isOddsValid(odds));
    } else if (playType === 'bqc') {
      // 半全场：至少有一个有效赔率
      return Object.values(match.odds?.bqc || {}).some(odds => isOddsValid(odds));
    }
    return false;
  };

  // 检查比赛是否应该显示
  const shouldShowMatch = (match: Match): boolean => {
    const hasHad = hasValidOddsForPlayType(match, 'spf');
    const hasHhad = hasValidOddsForPlayType(match, 'rq');
    
    // 如果had和hhad都没有，整个比赛不显示
    if (!hasHad && !hasHhad) {
      return false;
    }
    
    return true;
  };

  // 查看已選投注
  const viewSelectedBets = () => {
    if (selectedBets.length === 0) {
      alert('提示', '您還沒有選擇任何投注方案');
      return;
    }
    if (!validateBetMultiple(betMultiple)) {
      alert('提示', '請輸入有效的投注倍數（1-50倍）');
      return;
    }
    setShowBettingModal(true);
  };

  // 計算總賠率
  const calculateTotalOdds = useMemo(() => {
    if (selectedBets.length === 0) return 0;
    
    // 按比賽分組，找出每場比賽的最高賠率
    const matchGroups = selectedBets.reduce((groups, bet) => {
      if (!groups[bet.matchId]) {
        groups[bet.matchId] = [];
      }
      groups[bet.matchId].push(bet);
      return groups;
    }, {} as Record<string, typeof selectedBets>);
    
    // 獲取每場比賽的最高賠率
    const maxOddsPerMatch = Object.values(matchGroups).map(bets => 
      Math.max(...bets.map(bet => bet.odds))
    );
    
    // 计算總賠率
    if (maxOddsPerMatch.length === 1) {
      // 單關模式：只有一場比賽，返回最高賠率
      return maxOddsPerMatch[0];
      } else {
      // 串關模式：多場比賽，每場最高賠率相乘
      return maxOddsPerMatch.reduce((total, odds) => total * odds, 1);
      }
  }, [selectedBets]);

  // 計算組合數量
  const calculateCombinations = (): number => {
    if (selectedBets.length === 0) return 0;
    
    // 按比賽分組，計算每場比賽的選項數
    const matchGroups = selectedBets.reduce((groups, bet) => {
      if (!groups[bet.matchId]) {
        groups[bet.matchId] = [];
      }
      groups[bet.matchId].push(bet);
      return groups;
    }, {} as Record<string, typeof selectedBets>);
    
    // 組合數 = 每場比賽選項數的乘積
    const combinations = Object.values(matchGroups).reduce((total, bets) => {
      return total * bets.length;
    }, 1);
    
    return combinations;
  };

  // 計算實際投注金額 = 倍數 × 每注金額 × 組合數
  const calculateTotalBetAmount = (): number => {
    const combinations = calculateCombinations();
    return betMultiple * AMOUNT_PER_BET * combinations;
  };

  // 獲取過關類型標籤
  const getPassTypeLabel = (): string => {
    if (selectedBets.length === 0) return '';
    
    // 按比賽分組，計算比賽數量
    const matchGroups = selectedBets.reduce((groups, bet) => {
      if (!groups[bet.matchId]) {
        groups[bet.matchId] = [];
      }
      groups[bet.matchId].push(bet);
      return groups;
    }, {} as Record<string, typeof selectedBets>);
    
    const matchCount = Object.keys(matchGroups).length;
    const combinations = calculateCombinations();
    
    if (matchCount === 1) return '單關';
    return `${matchCount}串${combinations}`;
  };

  // 按比賽分組投注信息
  const getGroupedBets = () => {
    const matchGroups = selectedBets.reduce((groups, bet) => {
      if (!groups[bet.matchId]) {
        groups[bet.matchId] = {
          matchInfo: bet.matchInfo,
          bets: []
        };
      }
      groups[bet.matchId].bets.push(bet);
      return groups;
    }, {} as Record<string, { matchInfo: string; bets: typeof selectedBets }>);

    return Object.entries(matchGroups).map(([matchId, group]) => ({
      matchId,
      matchInfo: group.matchInfo,
      bets: group.bets,
      maxOdds: Math.max(...group.bets.map(bet => bet.odds))
    }));
  };

  // 驗證投注倍數
  const validateBetMultiple = (multiple: number): boolean => {
    return multiple >= 1 && multiple <= 50;
  };

  // 數字鍵盤輸入處理
  const handleNumberInput = (num: number) => {
    // 如果是第一位数字，直接设置为该数字
    if (betMultiple === 1) {
      setBetMultiple(num);
    } else {
      // 如果不是第一位，则追加数字
      const newMultiple = betMultiple * 10 + num;
      if (newMultiple <= 50) {
        setBetMultiple(newMultiple);
      } else {
        // 超过50倍时给出提示
        setShowRangeAlert(true);
      }
    }
  };

  // 刪除數字
  const handleDelete = () => {
    if (betMultiple < 10) {
      // 如果只有一位数字，重置为1
      setBetMultiple(1);
    } else {
      // 如果有多位数字，删除最后一位
      const newMultiple = Math.floor(betMultiple / 10);
      setBetMultiple(newMultiple);
    }
  };

  // 確認倍數
  const handleConfirm = () => {
    setShowMultipleKeyboard(false);
  };

  // 提交投注
  const submitBet = async () => {
    setIsSubmitting(true);
    try {
      // betType 到 poolCode 的映射
      const betTypeToPoolCode: Record<string, string> = {
        'spf': 'had',    // 胜平负
        'rq': 'hhad',    // 让球
        'bf': 'crs',     // 比分
        'zjq': 'ttg',    // 总进球数
        'bqc': 'hafu',   // 半全场
      };

      // 转换为新API格式
      const details = selectedBets.map(bet => {
        // 将前端的结果值转换为后台要求的格式
        let selection = bet.result;
        
        // HAD和HHAD玩法需要转换home/draw/away为H/D/A
        if (bet.betType === 'spf' || bet.betType === 'rq') {
          switch (bet.result) {
            case 'home': selection = 'H'; break;
            case 'draw': selection = 'D'; break;
            case 'away': selection = 'A'; break;
            default: selection = bet.result; // 保持原值
          }
        }
        
        return {
          matchId: parseInt(bet.matchId, 10),
          poolCode: betTypeToPoolCode[bet.betType] || bet.betType,
          selection: selection,
        };
      });

      // 计算比赛数量和组合数
      const matchGroups = selectedBets.reduce((groups, bet) => {
        if (!groups[bet.matchId]) {
          groups[bet.matchId] = [];
        }
        groups[bet.matchId].push(bet);
        return groups;
      }, {} as Record<string, typeof selectedBets>);
      
      const matchCount = Object.keys(matchGroups).length;
      const combinations = calculateCombinations();
      
      // 单关为 1x1，多关为 XxY（X为比赛数量，Y为组合数）
      const combinationType = matchCount === 1 ? '1x1' : `${matchCount}x${combinations}`;

      const response = await footballCalculatorApi.submitBet({
        betAmount: calculateTotalBetAmount(),
        combinationType: combinationType,
        details: details,
      });
      
      if (response.success) {
        alert('成功', '投注成功！');
        clearSelection();
        setShowBettingModal(false);
      } else {
        // 检查是否是500错误
        if (response.status === 500 || response.statusCode === 500) {
          setErrorMessage(response.message || '服務器內部錯誤，請稍後重試');
          setShowErrorAlert(true);
        } else {
          setError(response.message || '投注失敗');
        }
      }
    } catch (error: any) {
      // 检查是否是网络错误或500错误
      if (error?.response?.status === 500 || error?.status === 500) {
        setErrorMessage('服務器內部錯誤，請稍後重試');
        setShowErrorAlert(true);
      } else {
        setErrorMessage('網絡錯誤，請稍後重試');
        setShowErrorAlert(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 加載比賽數據
  const loadMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await footballCalculatorApi.getCalculatorData();
      console.log('足球計算器API響應:', response);
      
      if (response.success && response.data) {
        let matchesData = [];
        
        // 新API返回數據在 data.matchList 中
        if (response.data.matchList && Array.isArray(response.data.matchList)) {
          matchesData = response.data.matchList;
        } else if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0 && response.data.data[0].matches) {
          matchesData = response.data.data[0].matches;
        } else if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
          matchesData = response.data.data[0];
        } else if (Array.isArray(response.data)) {
          matchesData = response.data;
        } else if (response.data.list && Array.isArray(response.data.list)) {
          matchesData = response.data.list;
        } else if (response.data.matches && Array.isArray(response.data.matches)) {
          matchesData = response.data.matches;
      } else {
          const data = response.data;
          for (const key in data) {
            if (Array.isArray(data[key])) {
              matchesData = data[key];
              break;
            }
          }
        }
        
        const transformedMatches = matchesData.map((match: any, index: number) => {
          console.log('=== 新API比賽數據詳情 ===', {
            index,
            '完整match對象': match,
            '所有字段名': Object.keys(match || {}),
            'odds結構': match?.odds,
            'HAD賠率': match?.odds?.HAD,
            'HHAD賠率': match?.odds?.HHAD,
            'TTG賠率': match?.odds?.TTG,
            'CRS賠率': match?.odds?.CRS,
            'HAFU賠率': match?.odds?.HAFU
          });
          
          return {
          id: match?.matchId?.toString() || match?.id || `match_${index}`,
          homeTeam: match?.homeTeamName || match?.homeTeam || '主隊',
          awayTeam: match?.awayTeamName || match?.awayTeam || '客隊',
          league: match?.leagueName || match?.league || '未知聯賽',
          matchTime: match?.matchDatetime || match?.matchTime || '',
          matchNumStr: match?.matchNumStr || '',
          goalLine: (() => {
            // 新API中goalLine在odds.HHAD中
            const goalLine = match?.odds?.HHAD?.goalLine;
            if (goalLine) {
              // goalLine格式为 "-1" 或 "+1"，转换为数字
              return parseFloat(goalLine) || 0;
            }
            return 0;
          })(),
          odds: {
            spf: (() => {
              // 新API中勝負平賠率在 odds.HAD 下
              const hadOdds = match?.odds?.HAD;
              if (hadOdds) {
                console.log(`找到odds.HAD數據:`, hadOdds);
                return { 
                  home: parseFloat(hadOdds.H) || 0, 
                  draw: parseFloat(hadOdds.D) || 0, 
                  away: parseFloat(hadOdds.A) || 0 
                };
              }
              
              console.log(`未找到勝負平賠率`);
              return { home: 0, draw: 0, away: 0 };
            })(),
            rq: (() => {
              // 新API中讓球賠率在 odds.HHAD 下
              const hhadOdds = match?.odds?.HHAD;
              if (hhadOdds) {
                console.log('找到odds.HHAD數據:', hhadOdds);
                return {
                  home: parseFloat(hhadOdds.H) || 0,
                  draw: parseFloat(hhadOdds.D) || 0,
                  away: parseFloat(hhadOdds.A) || 0,
                };
              }
              
              // 兼容旧API格式
              const spfOdds = match?.odds?.spf;
              if (spfOdds && (spfOdds.letHomeWin || spfOdds.letDraw || spfOdds.letAwayWin)) {
                const letMapped = {
                  home: spfOdds.letHomeWin || 0,
                  draw: spfOdds.letDraw || 0,
                  away: spfOdds.letAwayWin || 0,
                };
                console.log('使用odds.spf的讓球/受讓賠率:', letMapped);
                return letMapped;
              }
              console.log('未找到讓球賠率');
              return { home: 0, draw: 0, away: 0 };
            })(),
            bf: (() => {
              // 新API中比分在odds.CRS中，包含H、D、A三个分类
              // 保持后台分组结构，不进行合并
              const crsOdds = match?.odds?.CRS;
              if (!crsOdds) return { H: {}, D: {}, A: {} };
              
              const convertedScores: { H: Record<string, number>, D: Record<string, number>, A: Record<string, number> } = {
                H: {},
                D: {},
                A: {}
              };
              
              // 处理主胜比分 (H)
              if (crsOdds.H) {
                Object.entries(crsOdds.H).forEach(([key, value]) => {
                  const convertedKey = key.replace(/:/g, '-');
                  convertedScores.H[convertedKey] = parseFloat(value as string) || 0;
                });
              }
              
              // 处理平局比分 (D)
              if (crsOdds.D) {
                Object.entries(crsOdds.D).forEach(([key, value]) => {
                  const convertedKey = key.replace(/:/g, '-');
                  convertedScores.D[convertedKey] = parseFloat(value as string) || 0;
                });
              }
              
              // 处理客胜比分 (A)
              if (crsOdds.A) {
                Object.entries(crsOdds.A).forEach(([key, value]) => {
                  const convertedKey = key.replace(/:/g, '-');
                  convertedScores.A[convertedKey] = parseFloat(value as string) || 0;
                });
              }
              
              return convertedScores;
            })(),
            zjq: (() => {
              // 新API中总进球数在odds.TTG中
              const ttgOdds = match?.odds?.TTG;
              if (!ttgOdds) return {};
              
              // 转换所有值为数字
              const convertedTtg: Record<string, number> = {};
              Object.entries(ttgOdds).forEach(([key, value]) => {
                convertedTtg[key] = parseFloat(value as string) || 0;
              });
              
              return convertedTtg;
            })(),
            bqc: (() => {
              // 新API中半全场在odds.HAFU中
              // H=胜，D=平，A=负
              // 组合含义：HH=胜胜，HD=胜平，HA=胜负，DH=平胜，DD=平平，DA=平负，AH=负胜，AD=负平，AA=负负
              const hafuOdds = match?.odds?.HAFU;
              if (!hafuOdds) return {};
              
              // 转换所有值为数字，并保持原始键名（HH, HD, HA等）
              const convertedHafu: Record<string, number> = {};
              Object.entries(hafuOdds).forEach(([key, value]) => {
                convertedHafu[key] = parseFloat(value as string) || 0;
              });
              
              return convertedHafu;
            })(),
          }
          };
        });
        
        setMatches(transformedMatches);
      } else {
        setError(response.message || '加載比賽數據失敗');
        setMatches([]);
      }
    } catch (err) {
      console.error('加載比賽數據失败:', err);
      setError('網絡錯誤，請稍後重試');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadMatches();
    }
  }, [isAuthenticated]);

  // 認證檢查
  if (authLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
          加載中...
        </Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          請先登錄
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          title: '足球計算器',
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.onPrimary,
          headerTitleAlign: 'center',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/discover/calculator-orders')}
                style={{ marginRight: 16 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Icon source="format-list-bulleted" size={24} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          ),
        }}
      />

        {/* 玩法標籤 */}
        <View style={[styles.tabsContainer, { borderBottomColor: theme.colors.outline }]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {betTypes.map((type) => (
                <TouchableOpacity
                key={type.key}
                  style={[
                  styles.filterChip,
                  { 
                    backgroundColor: activeTab === type.key ? theme.colors.primary : theme.colors.surfaceVariant 
                  }
                ]}
                onPress={() => setActiveTab(type.key)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.filterText,
                  { 
                    color: activeTab === type.key ? theme.colors.onPrimary : theme.colors.onSurfaceVariant 
                  }
                ]}>
                  {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
            </View>

        {/* 錯誤提示 */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorContainer }]}>
            <Text style={[styles.errorText, { color: theme.colors.onErrorContainer }]}>
              {error}
            </Text>
            <Button
              mode="contained"
              onPress={loadMatches}
              style={styles.retryButton}
              compact
            >
              重試
            </Button>
        </View>
        )}

        {/* 比賽列表 */}
        <ScrollView 
          style={styles.matchesList}
          contentContainerStyle={[styles.matchesContent, { paddingBottom: 60 + insets.bottom + 20 }]}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
                加載比賽數據...
              </Text>
            </View>
          ) : matches.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIcon}>
                <Text style={[styles.emptyStateIconText, { color: theme.colors.onSurfaceVariant }]}>
                  ⚽
                </Text>
              </View>
              <Text style={[styles.emptyStateTitle, { color: theme.colors.onSurface }]}>
                暫無可投注比賽
              </Text>
              <Text style={[styles.emptyStateDescription, { color: theme.colors.onSurfaceVariant }]}>
                當前沒有可用的足球比賽數據{'\n'}請稍後再試或刷新獲取最新數據
              </Text>
              <Button
                mode="contained"
                onPress={loadMatches}
                style={[styles.refreshButton, { backgroundColor: theme.colors.primary }]}
                contentStyle={styles.refreshButtonContent}
              >
                刷新數據
              </Button>
            </View>
          ) : (
            matches.filter(match => shouldShowMatch(match)).map((match) => (
              <Card key={match.id} style={[styles.matchCard, { backgroundColor: theme.colors.surface }]}>
                <Card.Content style={styles.matchCardContent}>
                  <View style={styles.matchHeader}>
                    <View style={styles.matchTeams}>
                      <Text style={[styles.teamName, { color: theme.colors.onSurface }]}>
                        {match.homeTeam}
                    </Text>
                      <Text style={[styles.vsText, { color: theme.colors.onSurfaceVariant }]}>
                        vs
                      </Text>
                      <Text style={[styles.teamName, { color: theme.colors.onSurface }]}>
                        {match.awayTeam}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.matchInfoContainer}>
                      <Text style={[styles.leagueName, { color: theme.colors.onSurfaceVariant }]}>
                        {match.league}
                      </Text>
                            </View>
                            
                  <View style={styles.matchMetaContainer}>
                    <Text style={[styles.matchMeta, { color: theme.colors.onSurfaceVariant }]}>
                      {match.matchNumStr ? `${match.matchNumStr} ${formatMatchTime(match.matchTime)}` : `[空] ${formatMatchTime(match.matchTime)}`}
                      </Text>
                  </View>

                  {/* 投注選項 */}
                  <View style={styles.betOptions}>
                    {activeTab === 'spf' && (
                      <>
                        {/* 勝負平玩法 */}
                        {hasValidOddsForPlayType(match, 'spf') && (
                        <View style={styles.betSection}>
                          <View style={styles.betOptionsRow}>
                            {/* 玩法名稱選項 */}
                            <View style={[styles.betOption, styles.playMethodOption, { backgroundColor: theme.colors.surfaceVariant }]}>
                              <Text style={[styles.betOptionText, { color: theme.colors.onSurfaceVariant }]}>
                                勝負平
                              </Text>
                              <Text style={[styles.betOdds, { color: theme.colors.onSurfaceVariant }]}>
                                -
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={[
                                styles.betOption,
                                isSelected(match.id, 'spf', 'home') && styles.selectedBetOption,
                              { 
                                backgroundColor: isSelected(match.id, 'spf', 'home') ? theme.colors.primary : theme.colors.surfaceVariant,
                                opacity: isOddsValid(match.odds?.spf?.home) ? 1 : 0.5
                              }
                            ]}
                            onPress={() => isOddsValid(match.odds?.spf?.home) && selectMatchResult(match.id, 'spf', 'home', Number(match.odds?.spf?.home))}
                            disabled={!isOddsValid(match.odds?.spf?.home)}
                          >
                            <Text style={[styles.betOptionText, { color: isSelected(match.id, 'spf', 'home') ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>
                              主勝
                              </Text>
                            <Text style={[styles.betOdds, { color: isSelected(match.id, 'spf', 'home') ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>
                              {formatOdds(match.odds?.spf?.home)}
                              </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                              style={[
                                styles.betOption,
                                isSelected(match.id, 'spf', 'draw') && styles.selectedBetOption,
                              { 
                                backgroundColor: isSelected(match.id, 'spf', 'draw') ? theme.colors.primary : theme.colors.surfaceVariant,
                                opacity: isOddsValid(match.odds?.spf?.draw) ? 1 : 0.5
                              }
                            ]}
                            onPress={() => isOddsValid(match.odds?.spf?.draw) && selectMatchResult(match.id, 'spf', 'draw', Number(match.odds?.spf?.draw))}
                            disabled={!isOddsValid(match.odds?.spf?.draw)}
                          >
                            <Text style={[styles.betOptionText, { color: isSelected(match.id, 'spf', 'draw') ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>
                              平局
                              </Text>
                            <Text style={[styles.betOdds, { color: isSelected(match.id, 'spf', 'draw') ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>
                              {formatOdds(match.odds?.spf?.draw)}
                              </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                              style={[
                                styles.betOption,
                                isSelected(match.id, 'spf', 'away') && styles.selectedBetOption,
                              { 
                                backgroundColor: isSelected(match.id, 'spf', 'away') ? theme.colors.primary : theme.colors.surfaceVariant,
                                opacity: isOddsValid(match.odds?.spf?.away) ? 1 : 0.5
                              }
                            ]}
                            onPress={() => isOddsValid(match.odds?.spf?.away) && selectMatchResult(match.id, 'spf', 'away', Number(match.odds?.spf?.away))}
                            disabled={!isOddsValid(match.odds?.spf?.away)}
                          >
                            <Text style={[styles.betOptionText, { color: isSelected(match.id, 'spf', 'away') ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>
                              客勝
                              </Text>
                            <Text style={[styles.betOdds, { color: isSelected(match.id, 'spf', 'away') ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>
                              {formatOdds(match.odds?.spf?.away)}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                        )}

                        {/* 讓球玩法 */}
                        {hasValidOddsForPlayType(match, 'rq') && (
                        <View style={styles.betSection}>
                          <View style={styles.betOptionsRow}>
                            {/* 玩法名稱選項 */}
                            <View style={[styles.betOption, styles.playMethodOption, { backgroundColor: theme.colors.surfaceVariant }]}>
                              <Text style={[styles.betOptionText, { color: theme.colors.onSurfaceVariant }]}>
                                {match.goalLine > 0 ? `受讓` : `讓球`}
                              </Text>
                              <Text style={[styles.betOdds, { color: theme.colors.onSurfaceVariant }]}>
                                {match.goalLine}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={[
                                styles.betOption,
                                isSelected(match.id, 'rq', 'home') && styles.selectedBetOption,
                              { 
                                backgroundColor: isSelected(match.id, 'rq', 'home') ? theme.colors.primary : theme.colors.surfaceVariant,
                                opacity: isOddsValid(match.odds?.rq?.home) ? 1 : 0.5
                              }
                            ]}
                            onPress={() => isOddsValid(match.odds?.rq?.home) && selectMatchResult(match.id, 'rq', 'home', Number(match.odds?.rq?.home))}
                            disabled={!isOddsValid(match.odds?.rq?.home)}
                          >
                            <Text style={[styles.betOptionText, { color: isSelected(match.id, 'rq', 'home') ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>
                              主勝
                              </Text>
                            <Text style={[styles.betOdds, { color: isSelected(match.id, 'rq', 'home') ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>
                              {formatOdds(match.odds?.rq?.home)}
                              </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                              style={[
                                styles.betOption,
                                isSelected(match.id, 'rq', 'draw') && styles.selectedBetOption,
                              { 
                                backgroundColor: isSelected(match.id, 'rq', 'draw') ? theme.colors.primary : theme.colors.surfaceVariant,
                                opacity: isOddsValid(match.odds?.rq?.draw) ? 1 : 0.5
                              }
                            ]}
                            onPress={() => isOddsValid(match.odds?.rq?.draw) && selectMatchResult(match.id, 'rq', 'draw', Number(match.odds?.rq?.draw))}
                            disabled={!isOddsValid(match.odds?.rq?.draw)}
                          >
                            <Text style={[styles.betOptionText, { color: isSelected(match.id, 'rq', 'draw') ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>
                              平局
                              </Text>
                            <Text style={[styles.betOdds, { color: isSelected(match.id, 'rq', 'draw') ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>
                              {formatOdds(match.odds?.rq?.draw)}
                              </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                              style={[
                                styles.betOption,
                                isSelected(match.id, 'rq', 'away') && styles.selectedBetOption,
                              { 
                                backgroundColor: isSelected(match.id, 'rq', 'away') ? theme.colors.primary : theme.colors.surfaceVariant,
                                opacity: isOddsValid(match.odds?.rq?.away) ? 1 : 0.5
                              }
                            ]}
                            onPress={() => isOddsValid(match.odds?.rq?.away) && selectMatchResult(match.id, 'rq', 'away', Number(match.odds?.rq?.away))}
                            disabled={!isOddsValid(match.odds?.rq?.away)}
                          >
                            <Text style={[styles.betOptionText, { color: isSelected(match.id, 'rq', 'away') ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>
                              客勝
                              </Text>
                            <Text style={[styles.betOdds, { color: isSelected(match.id, 'rq', 'away') ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>
                              {formatOdds(match.odds?.rq?.away)}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                        )}
                      </>
                    )}
                    
                    {/* 比分玩法 */}
                    {activeTab === 'bf' && (() => {
                      // 直接使用后台返回的H、D、A分组，不进行本地重新分组
                      const hGroup = match.odds.bf.H || {};
                      const dGroup = match.odds.bf.D || {};
                      const aGroup = match.odds.bf.A || {};
                      
                      // 排序函数：将HX、DX、AX放在每组的最后
                      const sortGroupEntries = (group: Record<string, number>) => {
                        return Object.entries(group).sort(([keyA], [keyB]) => {
                          const isSpecialA = ['HX', 'DX', 'AX'].includes(keyA);
                          const isSpecialB = ['HX', 'DX', 'AX'].includes(keyB);
                          
                          if (isSpecialA && !isSpecialB) return 1; // A是特殊项，B不是，A排在后面
                          if (!isSpecialA && isSpecialB) return -1; // A不是特殊项，B是，A排在前面
                          if (isSpecialA && isSpecialB) return 0; // 都是特殊项，保持原顺序
                          
                          // 都不是特殊项，按原顺序
                          return 0;
                        });
                      };
                      
                      return (
                        <View style={styles.betSection}>
                          {/* H組 - 主勝比分 */}
                          {Object.keys(hGroup).length > 0 && (
                            <View style={styles.scoreGroup}>
                              <View style={styles.scoreGrid}>
                                {sortGroupEntries(hGroup).map(([score, odds]) => (
                                  <TouchableOpacity
                                    key={score}
                                    style={[
                                      styles.betOption,
                                      styles.scoreOption,
                                      isSelected(match.id, 'bf', score) && styles.selectedBetOption,
                                      { 
                                        backgroundColor: isSelected(match.id, 'bf', score) ? theme.colors.primary : theme.colors.surfaceVariant,
                                        opacity: isOddsValid(odds) ? 1 : 0.5
                                      }
                                    ]}
                                    onPress={() => isOddsValid(odds) && selectMatchResult(match.id, 'bf', score, Number(odds))}
                                    disabled={!isOddsValid(odds)}
                                  >
                                    <Text style={[styles.betOptionText, { color: isSelected(match.id, 'bf', score) ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>
                                      {formatScoreText(score)}
                                    </Text>
                                    <Text style={[styles.betOdds, { color: isSelected(match.id, 'bf', score) ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>
                                      {formatOdds(odds)}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          )}
                          
                          {/* D組 - 平局比分 */}
                          {Object.keys(dGroup).length > 0 && (
                            <View style={styles.scoreGroup}>
                              <View style={styles.scoreGrid}>
                                {sortGroupEntries(dGroup).map(([score, odds]) => (
                                  <TouchableOpacity
                                    key={score}
                                    style={[
                                      styles.betOption,
                                      styles.scoreOption,
                                      isSelected(match.id, 'bf', score) && styles.selectedBetOption,
                                      { 
                                        backgroundColor: isSelected(match.id, 'bf', score) ? theme.colors.primary : theme.colors.surfaceVariant,
                                        opacity: isOddsValid(odds) ? 1 : 0.5
                                      }
                                    ]}
                                    onPress={() => isOddsValid(odds) && selectMatchResult(match.id, 'bf', score, Number(odds))}
                                    disabled={!isOddsValid(odds)}
                                  >
                                    <Text style={[styles.betOptionText, { color: isSelected(match.id, 'bf', score) ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>
                                      {formatScoreText(score)}
                                    </Text>
                                    <Text style={[styles.betOdds, { color: isSelected(match.id, 'bf', score) ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>
                                      {formatOdds(odds)}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          )}
                          
                          {/* A組 - 客勝比分 */}
                          {Object.keys(aGroup).length > 0 && (
                            <View style={styles.scoreGroup}>
                              <View style={styles.scoreGrid}>
                                {sortGroupEntries(aGroup).map(([score, odds]) => (
                                  <TouchableOpacity
                                    key={score}
                                    style={[
                                      styles.betOption,
                                      styles.scoreOption,
                                      isSelected(match.id, 'bf', score) && styles.selectedBetOption,
                                      { 
                                        backgroundColor: isSelected(match.id, 'bf', score) ? theme.colors.primary : theme.colors.surfaceVariant,
                                        opacity: isOddsValid(odds) ? 1 : 0.5
                                      }
                                    ]}
                                    onPress={() => isOddsValid(odds) && selectMatchResult(match.id, 'bf', score, Number(odds))}
                                    disabled={!isOddsValid(odds)}
                                  >
                                    <Text style={[styles.betOptionText, { color: isSelected(match.id, 'bf', score) ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>
                                      {formatScoreText(score)}
                                    </Text>
                                    <Text style={[styles.betOdds, { color: isSelected(match.id, 'bf', score) ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>
                                      {formatOdds(odds)}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })()}
                    
                    {/* 總進球數玩法 */}
                    {activeTab === 'zjq' && (
                      <View style={styles.betSection}>
                        <View style={styles.zjqGrid}>
                          {Object.entries(match.odds.zjq).map(([goals, odds]) => (
                            <TouchableOpacity
                              key={goals}
                              style={[
                                styles.betOption,
                                styles.zjqOption,
                                isSelected(match.id, 'zjq', goals) && styles.selectedBetOption,
                                { 
                                  backgroundColor: isSelected(match.id, 'zjq', goals) ? theme.colors.primary : theme.colors.surfaceVariant,
                                  opacity: isOddsValid(odds) ? 1 : 0.5
                                }
                              ]}
                              onPress={() => isOddsValid(odds) && selectMatchResult(match.id, 'zjq', goals, Number(odds))}
                              disabled={!isOddsValid(odds)}
                            >
                              <Text style={[styles.betOptionText, { color: isSelected(match.id, 'zjq', goals) ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>
                                {formatGoalText(goals)}
                              </Text>
                              <Text style={[styles.betOdds, { color: isSelected(match.id, 'zjq', goals) ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>
                                {formatOdds(odds)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
                    
                    {/* 半全場玩法 */}
                    {activeTab === 'bqc' && (
                      <View style={styles.betSection}>
                        <View style={styles.bqcGrid}>
                          {Object.entries(match.odds.bqc).map(([result, odds]) => (
                            <TouchableOpacity
                              key={result}
                              style={[
                                styles.betOption,
                                styles.bqcOption,
                                isSelected(match.id, 'bqc', result) && styles.selectedBetOption,
                                { 
                                  backgroundColor: isSelected(match.id, 'bqc', result) ? theme.colors.primary : theme.colors.surfaceVariant,
                                  opacity: isOddsValid(odds) ? 1 : 0.5
                                }
                              ]}
                              onPress={() => isOddsValid(odds) && selectMatchResult(match.id, 'bqc', result, Number(odds))}
                              disabled={!isOddsValid(odds)}
                            >
                              <Text style={[styles.betOptionText, { color: isSelected(match.id, 'bqc', result) ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>
                                {formatBqcText(result)}
                              </Text>
                              <Text style={[styles.betOdds, { color: isSelected(match.id, 'bqc', result) ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>
                                {formatOdds(odds)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </ScrollView>

        {/* 底部操作區域 - 只在有比賽數據時顯示 */}
        {matches.length > 0 && (
          <View style={[styles.bottomContainer, { backgroundColor: theme.colors.surface }]}>
            <SafeAreaView edges={['bottom']} style={styles.bottomSafeArea}>
              <View style={styles.bottomActions}>
              {/* 投注金額標籤 - 最左邊 */}
              <View style={[styles.amountLabel, { backgroundColor: theme.colors.secondary }]}>
                <Text style={[styles.amountLabelText, { color: theme.colors.onSecondary }]}>
                  {Math.round(calculateTotalBetAmount())} USDT
                </Text>
              </View>

              {/* 操作按鈕區域 */}
              <View style={styles.actionButtonsContainer}>
                {/* 投注倍數選擇 */}
                <TouchableOpacity
                  onPress={() => setShowMultipleKeyboard(true)}
                  style={[styles.multipleSelector, { 
                    backgroundColor: theme.colors.primary 
                  }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.multipleSelectorText, { color: theme.colors.onPrimary }]}>
                    {betMultiple}倍
                  </Text>
                </TouchableOpacity>
                
                {/* 查看按鈕 */}
                <TouchableOpacity
                  onPress={viewSelectedBets}
                  style={[styles.bottomButton, { 
                    backgroundColor: selectedBets.length > 0 ? theme.colors.primary : theme.colors.surfaceVariant 
                  }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.bottomButtonText, { 
                    color: selectedBets.length > 0 ? theme.colors.onPrimary : theme.colors.onSurfaceVariant 
                  }]}>
                    查看 ({selectedBets.length})
                  </Text>
                </TouchableOpacity>
                
                {/* 清空按鈕 */}
                <TouchableOpacity
                  onPress={clearSelection}
                  style={[styles.bottomButton, { 
                    backgroundColor: selectedBets.length > 0 ? theme.colors.primary : theme.colors.surfaceVariant 
                  }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.bottomButtonText, { 
                    color: selectedBets.length > 0 ? theme.colors.onPrimary : theme.colors.onSurfaceVariant 
                  }]}>
                    清空
                  </Text>
                </TouchableOpacity>
              </View>
              </View>
            </SafeAreaView>
          </View>
        )}

        {/* 投注確認彈窗 */}
                 <Modal
          visible={showBettingModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowBettingModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
              <Card style={[styles.modalCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={styles.modalContent}>
                <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                         投注確認
                       </Text>
                
                <View style={styles.modalStats}>
                  <View style={styles.modalStatItem}>
                    <Text style={[styles.modalStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                      過關模式
                         </Text>
                    <Text style={[styles.modalStatValue, { color: theme.colors.primary }]}>
                      {getPassTypeLabel()}
                          </Text>
                         </View>
                  
                  <View style={styles.modalStatItem}>
                    <Text style={[styles.modalStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                             總賠率
                           </Text>
                    <Text style={[styles.modalStatValue, { color: theme.colors.primary }]}>
                             {calculateTotalOdds.toFixed(2)}
                           </Text>
                         </View>
                  
                  <View style={styles.modalStatItem}>
                    <Text style={[styles.modalStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                      預期回報
                           </Text>
                    <Text style={[styles.modalStatValue, { color: theme.colors.secondary }]}>
                      {Math.round(calculateTotalOdds * calculateTotalBetAmount())}
                           </Text>
                         </View>
                         </View>
                
                {/* 已選擇的投注詳情 */}
                <View style={styles.selectedBetsList}>
                  {getGroupedBets().map((group, index) => (
                    <View key={group.matchId} style={[styles.betItem, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <View style={styles.betItemHeader}>
                        <Text style={[styles.betMatchInfo, { color: theme.colors.onSurface }]}>
                          {group.matchInfo}
                        </Text>
                        <View style={[styles.betTypeOddsContainer, { backgroundColor: theme.colors.primary }]}>
                          <Text style={[styles.betTypeText, { color: theme.colors.onPrimary }]}>
                            {group.bets[0].betType === 'spf' ? '勝負平' : 
                             group.bets[0].betType === 'rq' ? '讓球' :
                             group.bets[0].betType === 'bf' ? '比分' :
                             group.bets[0].betType === 'zjq' ? '總進球' :
                             group.bets[0].betType === 'bqc' ? '半全場' : group.bets[0].betType}
                          </Text>
                          <Text style={[styles.betOddsValue, { color: theme.colors.onPrimary }]}>
                            {group.maxOdds.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.betItemDetails}>
                        <View style={styles.betResultsContainer}>
                          {group.bets.map((bet, betIndex) => (
                            <View key={`${bet.result}-${betIndex}`} style={styles.betResultChip}>
                              <Text style={[styles.betResultText, { color: theme.colors.onSurface }]}>
                                {bet.betType === 'zjq' ? formatGoalText(bet.result) :
                                 bet.betType === 'bqc' ? formatBqcText(bet.result) :
                                 bet.result === 'home' ? '主勝' :
                                 bet.result === 'draw' ? '平局' :
                                 bet.result === 'away' ? '客勝' : bet.result}
                            </Text>
                              <Text style={[styles.betResultOdds, { color: theme.colors.primary }]}>
                                {bet.odds.toFixed(2)}
                                          </Text>
                                        </View>
                          ))}
                                 </View>
                      </View>
                    </View>
                  ))}
                </View>
                
                     <View style={styles.modalActions}>
                      <Button
                         mode="outlined"
                    onPress={() => setShowBettingModal(false)}
                    style={styles.modalButton}
                         disabled={isSubmitting}
                       >
                    取消
                       </Button>
                  
                      <Button
                         mode="contained"
                         onPress={submitBet}
                    style={styles.modalButton}
                         loading={isSubmitting}
                    disabled={isSubmitting}
                       >
                    確認投注
                       </Button>
                     </View>
              </Card.Content>
              </Card>
                     </View>
                   </View>
                 </Modal>

        {/* 倍數輸入數字鍵盤 */}
        <Modal
          visible={showMultipleKeyboard}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowMultipleKeyboard(false)}
          statusBarTranslucent={true}
        >
          <View style={styles.keyboardOverlay}>
            <View style={[styles.keyboardContainer, { backgroundColor: theme.colors.surface }]}>
              {/* 倍數顯示欄 */}
              <View style={[styles.multipleDisplay, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.multipleDisplayText, { color: theme.colors.onPrimary }]}>
                  {betMultiple}倍
                </Text>
              </View>
              
              {/* 數字鍵盤 */}
              <View style={styles.keyboard}>
                {/* 第一行 */}
                <View style={styles.keyboardRow}>
                  <TouchableOpacity
                    style={[styles.keyButton, { backgroundColor: theme.colors.surface }]}
                    onPress={() => handleNumberInput(1)}
                  >
                    <Text style={[styles.keyText, { color: theme.colors.onSurface }]}>1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.keyButton, { backgroundColor: theme.colors.surface }]}
                    onPress={() => handleNumberInput(2)}
                  >
                    <Text style={[styles.keyText, { color: theme.colors.onSurface }]}>2</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.keyButton, { backgroundColor: theme.colors.surface }]}
                    onPress={() => handleNumberInput(3)}
                  >
                    <Text style={[styles.keyText, { color: theme.colors.onSurface }]}>3</Text>
                  </TouchableOpacity>
                </View>
                
                {/* 第二行 */}
                <View style={styles.keyboardRow}>
                  <TouchableOpacity
                    style={[styles.keyButton, { backgroundColor: theme.colors.surface }]}
                    onPress={() => handleNumberInput(4)}
                  >
                    <Text style={[styles.keyText, { color: theme.colors.onSurface }]}>4</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.keyButton, { backgroundColor: theme.colors.surface }]}
                    onPress={() => handleNumberInput(5)}
                  >
                    <Text style={[styles.keyText, { color: theme.colors.onSurface }]}>5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.keyButton, { backgroundColor: theme.colors.surface }]}
                    onPress={() => handleNumberInput(6)}
                  >
                    <Text style={[styles.keyText, { color: theme.colors.onSurface }]}>6</Text>
                  </TouchableOpacity>
                </View>
                
                {/* 第三行 */}
                <View style={styles.keyboardRow}>
                  <TouchableOpacity
                    style={[styles.keyButton, { backgroundColor: theme.colors.surface }]}
                    onPress={() => handleNumberInput(7)}
                  >
                    <Text style={[styles.keyText, { color: theme.colors.onSurface }]}>7</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.keyButton, { backgroundColor: theme.colors.surface }]}
                    onPress={() => handleNumberInput(8)}
                  >
                    <Text style={[styles.keyText, { color: theme.colors.onSurface }]}>8</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.keyButton, { backgroundColor: theme.colors.surface }]}
                    onPress={() => handleNumberInput(9)}
                  >
                    <Text style={[styles.keyText, { color: theme.colors.onSurface }]}>9</Text>
                  </TouchableOpacity>
                </View>
                
                {/* 第四行 */}
                <View style={styles.keyboardRow}>
                  <TouchableOpacity
                    style={[styles.keyButton, { backgroundColor: theme.colors.surface }]}
                    onPress={handleDelete}
                  >
                    <Text style={[styles.keyText, { color: theme.colors.onSurface }]}>删除</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.keyButton, { backgroundColor: theme.colors.surface }]}
                    onPress={() => handleNumberInput(0)}
                  >
                    <Text style={[styles.keyText, { color: theme.colors.onSurface }]}>0</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.keyButton, { backgroundColor: theme.colors.primary }]}
                    onPress={handleConfirm}
                  >
                    <Text style={[styles.keyText, { color: theme.colors.onPrimary }]}>确认</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* 范围提示弹窗 - 最高层级 */}
        <Modal
          visible={showRangeAlert}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowRangeAlert(false)}
          statusBarTranslucent={true}
          presentationStyle="overFullScreen"
        >
          <View style={styles.alertOverlay}>
            <View style={[styles.alertContainer, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.alertTitle, { color: theme.colors.onSurface }]}>
                提示
              </Text>
              <Text style={[styles.alertMessage, { color: theme.colors.onSurface }]}>
                倍数不能超过50倍，请输入1-50之间的数字
              </Text>
              <TouchableOpacity
                style={[styles.alertButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setShowRangeAlert(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.alertButtonText, { color: theme.colors.onPrimary }]}>
                  确定
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* 错误提示弹窗 - 最高层级 */}
        <Modal
          visible={showErrorAlert}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowErrorAlert(false)}
          statusBarTranslucent={true}
          presentationStyle="overFullScreen"
        >
          <View style={styles.alertOverlay}>
            <View style={[styles.alertContainer, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.alertTitle, { color: theme.colors.error }]}>
                錯誤提示
              </Text>
              <Text style={[styles.alertMessage, { color: theme.colors.onSurface }]}>
                {errorMessage}
              </Text>
              <TouchableOpacity
                style={[styles.alertButton, { backgroundColor: theme.colors.error }]}
                onPress={() => setShowErrorAlert(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.alertButtonText, { color: theme.colors.onError }]}>
                  确定
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyStateIcon: {
    marginBottom: 24,
    opacity: 0.6,
  },
  emptyStateIconText: {
    fontSize: 48,
    textAlign: 'center',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyStateDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  refreshButton: {
    borderRadius: 8,
  },
  refreshButtonContent: {
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  errorContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  retryButton: {
    minWidth: 80,
  },
  tabsContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  tabsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  matchesList: {
    flex: 1,
  },
  matchesContent: {
    padding: 16,
    paddingBottom: 100,
  },
  matchCard: {
    marginBottom: 12,
    elevation: 2,
    position: 'relative',
  },
  matchCardContent: {
    padding: 16,
    paddingBottom: 32, // 為左下角的聯賽名稱留出空間
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  vsText: {
    fontSize: 14,
    marginHorizontal: 8,
    opacity: 0.7,
  },
  matchTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  matchInfoContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  leagueName: {
    fontSize: 11,
    opacity: 0.6,
    fontWeight: '500',
  },
  matchMetaContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  matchMeta: {
    fontSize: 11,
    opacity: 0.6,
    fontWeight: '500',
  },
  betOptions: {
    marginTop: 8,
  },
  betSection: {
    marginBottom: 6,
  },
  playMethodOption: {
    opacity: 0.7,
  },
  betOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // 比分分組容器
  scoreGroup: {
    marginBottom: 12,
  },
  // 比分分組標題
  scoreGroupTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 4,
  },
  // 比分網格：一行5個，兩端對齊
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  // 總進球數網格：一行4個
  zjqGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  // 半全場網格：一行3個
  bqcGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  betOption: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  // 比分項：固定寬度，兩端對齊
  scoreOption: {
    width: '18%',
    maxWidth: '18%',
    minWidth: '18%',
    flex: 0,
    flexShrink: 0,
    marginBottom: 4,
    // 移除水平間距，使用 space-between 對齊
    marginHorizontal: 0,
    // 水平內邊距縮小，避免擠壓
    paddingHorizontal: 2,
  },
  // 總進球數項：一行4個
  zjqOption: {
    width: '24%',
    maxWidth: '24%',
    minWidth: '24%',
    flex: 0,
    flexShrink: 0,
    marginBottom: 4,
    // 移除水平間距，使用 space-between 對齊
    marginHorizontal: 0,
    // 水平內邊距
    paddingHorizontal: 4,
  },
  // 半全場項：一行3個
  bqcOption: {
    width: '32%',
    maxWidth: '32%',
    minWidth: '32%',
    flex: 0,
    flexShrink: 0,
    marginBottom: 4,
    // 移除水平間距，使用 space-between 對齊
    marginHorizontal: 0,
    // 水平內邊距
    paddingHorizontal: 6,
  },
  selectedBetOption: {
    // 選中狀態在動態樣式中處理
  },
  betOptionText: {
    fontSize: 9,
    marginBottom: 1,
  },
  betOdds: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
  },
  bottomSafeArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  multipleSelector: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  multipleSelectorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 6,
    minWidth: 60,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  amountLabel: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
    width: 100,
  },
  amountLabelText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  keyboardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  multipleDisplay: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  multipleDisplayText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  keyboard: {
    padding: 20,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  keyButton: {
    width: 80,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  keyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    borderRadius: 12,
    padding: 20,
    minWidth: 280,
    maxWidth: '90%',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  alertMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  alertButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  alertButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    borderRadius: 16,
    maxWidth: '100%',
    width: '100%',
    maxHeight: '80%',
  },
  modalCard: {
    borderRadius: 16,
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  modalStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  modalStatLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  modalStatValue: {
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  selectedBetsList: {
    marginBottom: 20,
  },
  betItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  betItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  betMatchInfo: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  betTypeOddsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  betTypeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  betOddsValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  betItemDetails: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  betResultsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  betResultChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  betResultText: {
    fontSize: 11,
    fontWeight: '500',
    marginRight: 4,
  },
  betResultOdds: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});