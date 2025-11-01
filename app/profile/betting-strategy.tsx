import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
    Card,
    Chip,
    Divider,
    Icon,
    Text,
    useTheme
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BettingStrategyScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const strategySteps = [
    {
      id: 1,
      title: '小額起步',
      description: '用少量資金開始，建議不超過總資金的2%',
      example: '1000元總資金，起步20元'
    },
    {
      id: 2,
      title: '倍數遞增',
      description: '失敗後翻倍投注，一次成功即可收回所有損失',
      example: '20元 → 40元 → 80元 → 160元 → 320元'
    },
    {
      id: 3,
      title: '見好就收',
      description: '有盈利立即停止，重新開始下一輪',
      example: '任何盈利都要立即停止，防止貪心'
    },
    {
      id: 4,
      title: '理賠兜底',
      description: '連續8次失敗可申請理賠，全額賠付所有成本',
      example: '平台用盈利建立理賠基金，保障用戶資金'
    }
  ];




  return (
    <>
      <Stack.Screen
        options={{
          title: '倍投包賠策略',
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: { fontWeight: '600' },
          headerTitleAlign: 'center',
        }}
      />
      <StatusBar style="light" />
      
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { 
            paddingBottom: 20 + insets.bottom 
          }]}
          showsVerticalScrollIndicator={false}
        >
        {/* 策略概述 */}
        <Card style={styles.overviewCard} elevation={2}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              策略概述
            </Text>
            <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
              倍投包賠是一種基於數學概率的投注策略，通過遞增投注金額來確保在有限次數的失敗後，一次成功即可收回所有損失並實現盈利。
            </Text>
            <View style={styles.chipContainer}>
              <Chip 
                icon="calculator" 
                style={[styles.chip, { backgroundColor: theme.colors.primaryContainer }]}
                textStyle={{ color: theme.colors.onPrimaryContainer }}
              >
                數學原理
              </Chip>
              <Chip 
                icon="robot" 
                style={[styles.chip, { backgroundColor: theme.colors.secondaryContainer }]}
                textStyle={{ color: theme.colors.onSecondaryContainer }}
              >
                AI模型
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* 策略步骤 */}
        <Card style={styles.stepsCard} elevation={2}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              策略步驟
            </Text>
            {strategySteps.map((step, index) => (
              <View key={step.id}>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text variant="labelLarge" style={[styles.stepNumberText, { color: theme.colors.primary }]}>
                      {step.id}
                    </Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text variant="titleSmall" style={[styles.stepTitle, { color: theme.colors.onSurface }]}>
                      {step.title}
                    </Text>
                    <Text variant="bodyMedium" style={[styles.stepDescription, { color: theme.colors.onSurfaceVariant }]}>
                      {step.description}
                    </Text>
                    <Text variant="bodySmall" style={[styles.stepExample, { color: theme.colors.primary }]}>
                      {step.example}
                    </Text>
                  </View>
                </View>
                {index < strategySteps.length - 1 && <Divider style={styles.stepDivider} />}
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* AI模型介绍 */}
        <Card style={styles.aiModelCard} elevation={2}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              AI智能模型
            </Text>
            
            <Text variant="bodyMedium" style={[styles.aiModelDescription, { color: theme.colors.onSurfaceVariant }]}> 
              我們的AI模型專門針對足球比賽進行深度學習和數據分析，通過大數據訓練和機器學習算法，實現精準的盈利預測和風險控制。
            </Text>
            
            <View style={styles.aiModelFeatures}>
              <View style={styles.aiFeatureItem}>
                <View style={styles.aiFeatureHeader}>
                  <Icon source="trending-up" size={20} color={theme.colors.primary} />
                  <Text variant="titleSmall" style={[styles.aiFeatureTitle, { color: theme.colors.onSurface }]}> 
                    盈利能力
                  </Text>
                </View>
                <Text variant="bodySmall" style={[styles.aiFeatureText, { color: theme.colors.onSurfaceVariant }]}> 
                  • 分析歷史比賽數據，識別盈利模式{'\n'}
                  • 實時監控賠率變化，捕捉最佳投注時機{'\n'}
                  • 多維度數據融合，提升預測準確率{'\n'}
                  • 動態調整投注策略，最大化盈利空間
                </Text>
              </View>
              
              <View style={styles.aiFeatureItem}>
                <View style={styles.aiFeatureHeader}>
                  <Icon source="shield-check" size={20} color={theme.colors.secondary} />
                  <Text variant="titleSmall" style={[styles.aiFeatureTitle, { color: theme.colors.onSurface }]}> 
                    風險控制
                  </Text>
                </View>
                <Text variant="bodySmall" style={[styles.aiFeatureText, { color: theme.colors.onSurfaceVariant }]}> 
                  • 智能識別高風險比賽，自動規避{'\n'}
                  • 實時監控資金風險，動態調整投注比例{'\n'}
                  • 多模型交叉驗證，降低預測誤差{'\n'}
                  • 自動止損機制，保護用戶資金安全
                </Text>
              </View>
            </View>
            
            <View style={styles.aiModelStats}>
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={[styles.statNumber, { color: theme.colors.primary }]}>
                  65%
                </Text>
                <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}> 
                  置信度
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={[styles.statNumber, { color: theme.colors.secondary }]}>
                  24/7
                </Text>
                <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}> 
                  實時監控
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={[styles.statNumber, { color: theme.colors.onSurfaceVariant }]}>
                  99.9%
                </Text>
                <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}> 
                  系統穩定性
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* 投资保护建议 */}
        <Card style={styles.protectionCard} elevation={2}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              投資保護建議
            </Text>
            <Text variant="bodyMedium" style={[styles.protectionDescription, { color: theme.colors.onSurfaceVariant }]}> 
              建立良好的投資保護體系，是長期穩定盈利的關鍵。以下建議幫助您構建完善的風險管理體系：
            </Text>
            
            <View style={styles.protectionList}>
              <View style={styles.protectionItem}>
                <Icon source="shield-account" size={20} color={theme.colors.primary} />
                <View style={styles.protectionContent}>
                  <Text variant="titleSmall" style={[styles.protectionTitle, { color: theme.colors.onSurface }]}> 
                    資金管理
                  </Text>
                  <Text variant="bodySmall" style={[styles.protectionText, { color: theme.colors.onSurfaceVariant }]}> 
                    永遠不要投入超過承受能力的資金，建議單次投注不超過總資金的2-5%
                  </Text>
                </View>
              </View>
              
              <View style={styles.protectionItem}>
                <Icon source="chart-timeline-variant" size={20} color={theme.colors.secondary} />
                <View style={styles.protectionContent}>
                  <Text variant="titleSmall" style={[styles.protectionTitle, { color: theme.colors.onSurface }]}> 
                    記錄分析
                  </Text>
                  <Text variant="bodySmall" style={[styles.protectionText, { color: theme.colors.onSurfaceVariant }]}> 
                    詳細記錄每次投注結果，定期分析盈虧情況，及時調整策略參數
                  </Text>
                </View>
              </View>
              
              <View style={styles.protectionItem}>
                <Icon source="heart-pulse" size={20} color={theme.colors.tertiary} />
                <View style={styles.protectionContent}>
                  <Text variant="titleSmall" style={[styles.protectionTitle, { color: theme.colors.onSurface }]}> 
                    心理建設
                  </Text>
                  <Text variant="bodySmall" style={[styles.protectionText, { color: theme.colors.onSurfaceVariant }]}> 
                    保持冷靜理性，避免情緒化決策，嚴格按照既定策略執行
                  </Text>
                </View>
              </View>
              
            </View>
          </Card.Content>
        </Card>

        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  overviewCard: {
    marginBottom: 16,
  },
  stepsCard: {
    marginBottom: 16,
  },
  aiModelCard: {
    marginBottom: 16,
  },
  protectionCard: {
    marginBottom: 16,
  },
  cardContent: {
    padding: 20,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  description: {
    lineHeight: 22,
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chip: {
    marginRight: 8,
  },
  stepItem: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  stepDescription: {
    lineHeight: 20,
    marginBottom: 4,
  },
  stepExample: {
    fontStyle: 'italic',
    fontWeight: '500',
  },
  stepDivider: {
    marginLeft: 48,
    marginVertical: 8,
  },
  listItem: {
    paddingVertical: 4,
  },
  listItemTitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  protectionDescription: {
    lineHeight: 22,
    marginBottom: 16,
  },
  protectionList: {
    gap: 16,
  },
  protectionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  protectionContent: {
    flex: 1,
    marginLeft: 12,
  },
  protectionTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  protectionText: {
    lineHeight: 18,
  },
  aiModelDescription: {
    lineHeight: 22,
    marginBottom: 20,
  },
  aiModelFeatures: {
    gap: 20,
    marginBottom: 24,
  },
  aiFeatureItem: {
    gap: 12,
  },
  aiFeatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiFeatureTitle: {
    fontWeight: '600',
  },
  aiFeatureText: {
    lineHeight: 20,
    paddingLeft: 28,
  },
  aiModelStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});
