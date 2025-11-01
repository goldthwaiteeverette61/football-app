/**
 * 比赛状态判断工具函数
 * 统一处理比赛状态相关的逻辑
 */

export interface MatchStatusInfo {
  status: 'pending' | 'playing' | 'halfTime' | 'finished' | 'cancelled' | 'postponed';
  displayText: string;
  backgroundColor: string;
  textColor: string;
  isRed?: boolean; // 是否红单（仅用于已结束的比赛）
}

/**
 * 根据比赛数据判断比赛状态
 * @param match 比赛数据
 * @returns 比赛状态信息
 */
export const getMatchStatus = (match: any): MatchStatusInfo => {
  const { matchStatus, matchMinute, fullScore, isRed } = match || {};

  // 简化判断：直接使用 matchStatus 数值
  const status = Number(matchStatus);

  console.log('🏈 比赛状态判断:', {
    matchStatus,
    status,
    matchMinute,
    fullScore,
    isRed
  });

  // -1: 比赛结束
  if (status === -1) {
    const hasScore = fullScore && fullScore !== '' && fullScore !== '-';
    if (hasScore) {
      return {
        status: 'finished',
        displayText: isRed ? '红' : '黑',
        backgroundColor: isRed ? '#f44336' : '#424242',
        textColor: '#ffffff',
        isRed
      };
    }
    return {
      status: 'finished',
      displayText: '完',
      backgroundColor: '#424242',
      textColor: '#ffffff'
    };
  }

  // 0: 未开始
  if (status === 0) {
    return {
      status: 'pending',
      displayText: '未',
      backgroundColor: '#9e9e9e',
      textColor: '#ffffff'
    };
  }

  // 1: 上半场
  if (status === 1) {
    return {
      status: 'playing',
      displayText: (matchMinute || '0') + "'",
      backgroundColor: '#4caf50', // 绿色
      textColor: '#ffffff'
    };
  }

  // 2: 中场休息
  if (status === 2) {
    return {
      status: 'halfTime',
      displayText: '休',
      backgroundColor: '#9e9e9e', // 灰色
      textColor: '#ffffff'
    };
  }

  // 3: 下半场
  if (status === 3) {
    return {
      status: 'playing',
      displayText: (matchMinute || '0') + "'",
      backgroundColor: '#4caf50', // 绿色
      textColor: '#ffffff'
    };
  }

  // 兜底：当作未开始处理
  console.log('⚠️ 未知比赛状态:', status);
  return {
    status: 'pending',
    displayText: '未',
    backgroundColor: '#9e9e9e',
    textColor: '#ffffff'
  };
};

/**
 * 判断比赛是否已结束
 * @param match 比赛数据
 * @returns 是否已结束
 */
export const isMatchFinished = (match: any): boolean => {
  const { matchStatus } = match || {};
  return Number(matchStatus) === -1;
};

/**
 * 判断比赛是否进行中
 * @param match 比赛数据
 * @returns 是否进行中
 */
export const isMatchPlaying = (match: any): boolean => {
  const { matchStatus } = match || {};
  const status = Number(matchStatus);
  return status === 1 || status === 3; // 上半场或下半场
};

/**
 * 判断比赛是否未开始
 * @param match 比赛数据
 * @returns 是否未开始
 */
export const isMatchPending = (match: any): boolean => {
  const { matchStatus } = match || {};
  return Number(matchStatus) === 0;
};

/**
 * 获取比赛显示比分
 * @param match 比赛数据
 * @returns 显示的比分文本
 */
export const getMatchScoreDisplay = (match: any): string => {
  const { matchStatus, fullScore } = match || {};
  
  const status = Number(matchStatus);
  
  console.log('🏈 比分显示判断:', {
    matchStatus,
    status,
    fullScore
  });
  
  // 0: 未开始时显示vs
  if (status === 0) {
    console.log('🏈 比赛未开始，显示vs');
    return 'vs';
  }
  
  // 2: 中场休息时显示比分（如果有的话）
  if (status === 2) {
    if (fullScore && fullScore !== '' && fullScore !== '-') {
      console.log('🏈 中场休息，显示比分:', fullScore);
      return fullScore;
    } else {
      console.log('🏈 中场休息但无比分，显示vs');
      return 'vs';
    }
  }
  
  // 如果比分无效或为空，也显示vs
  if (!fullScore || fullScore === '' || fullScore === '-') {
    console.log('🏈 比分无效，显示vs');
    return 'vs';
  }
  
  // 其他情况显示实际比分
  console.log('🏈 显示实际比分:', fullScore);
  return fullScore;
};

/**
 * 判断比赛结果（用于投注验证）
 * @param match 比赛数据
 * @param poolCode 玩法代码
 * @param goalLine 让球数
 * @returns 比赛结果 H/A/D 或 null
 */
export const getMatchResult = (match: any, poolCode: string, goalLine: string): string | null => {
  const { fullScore } = match || {};
  
  // 如果比赛未结束或没有比分，返回null
  if (!fullScore || fullScore === '' || fullScore === '-') {
    console.log('🏈 比赛无比分，返回null:', { fullScore, poolCode, goalLine });
    return null;
  }
  
  // 解析比分
  const [homeScore, awayScore] = fullScore.split(':').map(Number);
  if (isNaN(homeScore) || isNaN(awayScore)) {
    console.log('🏈 比分解析失败，返回null:', { fullScore, homeScore, awayScore });
    return null;
  }
  
  console.log('🏈 开始判断比赛结果:', {
    fullScore,
    homeScore,
    awayScore,
    poolCode,
    goalLine,
    originalHomeScore: homeScore,
    originalAwayScore: awayScore
  });
  
  // 计算实际比分差（考虑让球）
  let actualHomeScore = homeScore;
  let actualAwayScore = awayScore;
  
  if (poolCode === 'HHAD' && goalLine) {
    // HHAD让球胜负平：主队比分先和goalLine相加，然后比较
    // goalLine < 0: 让球（主队让球给客队）
    // goalLine > 0: 受让（主队受让，客队让球给主队）
    // 例如：主队2:1客队，让球-1，则调整后主队得分 = 2 + (-1) = 1，客队得分 = 1
    // 调整后比分1:1，结果为平局(D)
    const goalLineNum = parseFloat(goalLine);
    if (!isNaN(goalLineNum)) {
      actualHomeScore = homeScore + goalLineNum;
      
      // 判断是让球还是受让
      const handicapType = goalLineNum < 0 ? '让球' : '受让';
      
      console.log(`🏈 HHAD${handicapType}情况调整:`, {
        originalScore: `${homeScore}:${awayScore}`,
        goalLine,
        goalLineNum,
        handicapType,
        adjustedScore: `${actualHomeScore}:${actualAwayScore}`,
        calculation: `${homeScore} + ${goalLineNum} = ${actualHomeScore}`,
        description: goalLineNum < 0 
          ? `主队让球${Math.abs(goalLineNum)}分给客队` 
          : `主队受让${goalLineNum}分（客队让球给主队）`
      });
    }
  }
  
  // 判断结果
  let result: string;
  if (actualHomeScore > actualAwayScore) {
    result = 'H'; // 主胜
  } else if (actualHomeScore < actualAwayScore) {
    result = 'A'; // 客胜
  } else {
    result = 'D'; // 平局
  }
  
  console.log('🏈 比赛结果判断完成:', {
    fullScore,
    poolCode,
    goalLine,
    actualHomeScore,
    actualAwayScore,
    result
  });
  
  return result;
};

/**
 * 检查比赛是否有结果（用于方案显示逻辑）
 * @param match 比赛数据
 * @param bettingOptions 投注选项
 * @returns 是否有结果
 */
export const hasMatchResult = (match: any, bettingOptions: any[]): boolean => {
  if (!isMatchFinished(match)) {
    return false;
  }
  
  // 检查是否有投注选项
  if (!bettingOptions || !Array.isArray(bettingOptions) || bettingOptions.length === 0) {
    return false;
  }
  
  // 检查是否有投注选项有结果（红单或黑单）
  return bettingOptions.some((poolOption: any) => {
    if (!poolOption || !poolOption.selections || !Array.isArray(poolOption.selections)) {
      return false;
    }
    
    return poolOption.selections.some((selection: any) => {
      const result = getMatchResult(match, poolOption.poolCode, poolOption.goalLine);
      return result !== null; // 有结果（红单或黑单）
    });
  });
};
