/**
 * 倍投页面 - 方案显示组件
 * 显示今日方案和比赛信息
 */

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { getMatchResult, getMatchScoreDisplay, getMatchStatus } from '@/utils/matchStatus';
import { createShadowStyle } from '@/utils/webCompatibility';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, IconButton, Text, useTheme } from 'react-native-paper';

interface SchemeDisplayProps {
  schemeLoading: boolean;
  todayScheme: any;
  groupedMatches: any[];
  countdown: string;
  parseDeadlineMs: (value: any) => number;
}

export const SchemeDisplay = memo(function SchemeDisplay({
  schemeLoading,
  todayScheme,
  groupedMatches,
  countdown,
  parseDeadlineMs,
}: SchemeDisplayProps) {
  const theme = useTheme();

  if (schemeLoading) {
    return (
      <View style={[styles.schemeSection, { backgroundColor: '#f7f7f7' }]}>
        <LoadingSpinner 
          size={48} 
          text="正在加载方案..." 
          color={theme.colors.primary}
          type="spinner"
        />
      </View>
    );
  }

  if (!todayScheme) {
    return (
      <View style={[styles.schemeSection, { backgroundColor: '#f7f7f7' }]}>
        <View style={styles.waitingContainer}>
          <Icon source="clock-outline" size={48} color={theme.colors.outline} />
          <Text variant="bodyLarge" style={[styles.waitingText, { color: theme.colors.onSurfaceVariant }]}>
            暫無方案
          </Text>
          <Text variant="bodyMedium" style={[styles.waitingSubtext, { color: theme.colors.outline }]}>
            請耐心等待，方案即將發布
          </Text>
        </View>
      </View>
    );
  }

  const isBeforeDeadline = (() => {
    const deadlineMs = parseDeadlineMs(todayScheme.deadlineTime);
    return Date.now() < deadlineMs;
  })();

  return (
    <View style={[styles.schemeSection, { backgroundColor: '#f7f7f7' }]}>
      <View style={styles.schemeContainer}>
        {/* 方案標題區域 */}
        <View style={styles.schemeHeader}>
          <View style={styles.schemeTitleContainer}>
            <Text variant="titleMedium" style={[styles.schemeTitle, { color: theme.colors.onSurface }]}> 
              {todayScheme.status === 'won' ? '紅單到手' : 
               todayScheme.status === 'lost' ? '下次再來' : 
               isBeforeDeadline ? '今日方案' : '恭喜發財'}
            </Text>
          </View>
          <IconButton
            icon="help-circle-outline"
            size={16}
            onPress={() => {}}
            iconColor={theme.colors.outline}
            style={{ margin: 0, width: 24, height: 24, marginRight: 10 }}
          />
        </View>
        
        {/* 比賽列表 */}
        {!isBeforeDeadline && groupedMatches.length > 0 && (
          <View style={styles.matchesList}>
            {groupedMatches.map((match, index) => (
              <View key={`${match.matchId}_${index}`} style={[styles.matchCard, { backgroundColor: theme.colors.surface }]}>
                {/* 比賽頭部 */}
                <View style={styles.matchCardHeader}>
                  <View style={styles.matchInfo}>
                    <Text style={[styles.leagueName, { color: theme.colors.onSurface }]}>
                      {match.leagueName}
                    </Text>
                    <Text style={[styles.matchTime, { color: theme.colors.outline }]}>
                      {match.matchNumStr} {new Date(match.matchDatetime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View style={[styles.resultBadge, { 
                    backgroundColor: getMatchStatus(match).backgroundColor
                  }]}>
                    <Text style={[styles.resultText, { 
                      color: getMatchStatus(match).textColor 
                    }]}>
                      {getMatchStatus(match).displayText}
                    </Text>
                  </View>
                </View>
                
                {/* 比賽比分 */}
                <View style={styles.matchScore}>
                  <Text style={[styles.homeTeamName, { color: theme.colors.onSurface }]}>
                    {match.homeTeamName}
                  </Text>
                  <View style={styles.scoreContainer}>
                    <Text style={[
                      getMatchScoreDisplay(match) === 'vs' ? styles.scoreVs : styles.score, 
                      { color: theme.colors.onSurface }
                    ]}>
                      {getMatchScoreDisplay(match)}
                    </Text>
                  </View>
                  <Text style={[styles.awayTeamName, { color: theme.colors.onSurface }]}>
                    {match.awayTeamName}
                  </Text>
                </View>
                
                {/* 投注選項 */}
                <View style={styles.bettingOptions}>
                  {match.bettingOptions.map((poolOption: any, poolIndex: number) => (
                    <View key={`${poolOption.poolCode}_${poolOption.goalLine || ''}`} style={styles.bettingRow}>
                      <View style={styles.bettingCategory}>
                        <Text style={styles.bettingCategoryText}>
                          {poolOption.poolCode === 'HAD' 
                            ? '勝負平' 
                            : (() => {
                                const goalLineNum = parseFloat(poolOption.goalLine || '0');
                                return goalLineNum < 0 ? '讓球' : '受讓';
                              })()
                          }
                        </Text>
                        {poolOption.poolCode !== 'HAD' && poolOption.goalLine && (
                          <View style={styles.goalLineBadge}>
                            <Text style={styles.goalLineText}>
                              {Math.abs(parseFloat(poolOption.goalLine))}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.bettingButtons}>
                        <View style={[
                          styles.bettingButton,
                          poolOption.selections.some((sel: any) => sel.selection === 'H') && styles.selectedBettingButton,
                          (() => {
                            const result = getMatchResult(match, poolOption.poolCode, poolOption.goalLine);
                            const isMatchPending = Number(match.matchStatus) === 0;
                            return result === 'H' && !isMatchPending ? styles.winningOdds : null;
                          })()
                        ]}>
                          <Text style={[
                            poolOption.selections.some((sel: any) => sel.selection === 'H') ? styles.selectedBettingButtonText : styles.bettingButtonText,
                            poolOption.selections.some((sel: any) => sel.selection === 'H') && { color: '#1976d2' },
                            (() => {
                              const result = getMatchResult(match, poolOption.poolCode, poolOption.goalLine);
                              const isMatchPending = Number(match.matchStatus) === 0;
                              return result === 'H' && !isMatchPending ? { color: '#ff4444', fontWeight: 'bold' } : null;
                            })()
                          ]}>
                            主勝
                          </Text>
                          <Text style={[
                            styles.bettingOdds,
                            poolOption.selections.some((sel: any) => sel.selection === 'H') && { color: '#1976d2' },
                            (() => {
                              const result = getMatchResult(match, poolOption.poolCode, poolOption.goalLine);
                              const isMatchPending = Number(match.matchStatus) === 0;
                              return result === 'H' && !isMatchPending ? { color: '#ff4444', fontWeight: 'bold' } : null;
                            })()
                          ]}>
                            {poolOption.poolCode === 'HAD' ? (match.had?.homeOdds || '--') : (match.hhad?.homeOdds || '--')}
                          </Text>
                        </View>
                        {/* 其他投注选项... */}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 等待投注状态 */}
        {isBeforeDeadline && (
          <View style={styles.waitingContainer}>
            <Icon source="lock" size={48} color={theme.colors.outline} />
            {countdown ? (
              <Text variant="titleMedium" style={[styles.countdownText, { color: theme.colors.primary }]}>
                {countdown}
              </Text>
            ) : null}
            <Text variant="bodyLarge" style={[styles.waitingText, { color: theme.colors.onSurfaceVariant }]}>等待投注中</Text>
            <Text variant="bodyMedium" style={[styles.waitingSubtext, { color: theme.colors.outline }]}>截止時間：{new Date(todayScheme.deadlineTime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  schemeSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
  },
  schemeContainer: {
    padding: 6,
  },
  schemeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingVertical: 4,
  },
  schemeTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginLeft: 10,
  },
  schemeTitle: {
    fontWeight: '600',
    lineHeight: 18,
    fontSize: 16,
  },
  matchesList: {
    gap: 8,
  },
  matchCard: {
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
  },
  matchCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  matchInfo: {
    flex: 1,
  },
  leagueName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 1,
  },
  matchTime: {
    fontSize: 11,
  },
  resultBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 11,
  },
  matchScore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    minHeight: 32,
  },
  homeTeamName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    lineHeight: 24,
  },
  awayTeamName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'left',
    lineHeight: 24,
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  scoreVs: {
    fontSize: 24,
    fontWeight: 'normal',
    lineHeight: 24,
  },
  bettingOptions: {
    marginTop: 6,
  },
  bettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bettingCategory: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    width: 60,
  },
  bettingCategoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    textAlign: 'center',
  },
  goalLineBadge: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalLineText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '600',
  },
  bettingButtons: {
    flexDirection: 'row',
    flex: 1,
    gap: 6,
  },
  bettingButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    height: 40,
  },
  selectedBettingButton: {
    borderColor: '#1976d2',
    backgroundColor: '#e3f2fd',
  },
  winningOdds: {
    borderBottomWidth: 2,
    borderBottomColor: '#ff4444',
  },
  bettingButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
    textAlign: 'center',
    width: '100%',
  },
  selectedBettingButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
    textAlign: 'center',
    width: '100%',
  },
  bettingOdds: {
    fontSize: 11,
    textAlign: 'center',
    width: '100%',
  },
  waitingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  countdownText: {
    marginTop: 12,
    fontWeight: '700',
  },
  waitingText: {
    marginTop: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  waitingSubtext: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
});
