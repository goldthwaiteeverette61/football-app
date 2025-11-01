# ScoreRED AI智能投注系统技术文档

## 🤖 AI挑选2串1方案底层逻辑

### 核心算法架构

#### 1. 数据收集与处理
```python
# 数据源整合
data_sources = {
    "historical_data": "历史比赛数据（3年+）",
    "team_stats": "球队技术统计",
    "player_data": "球员状态数据", 
    "market_odds": "实时赔率变化",
    "weather_data": "天气条件",
    "injury_reports": "伤病报告",
    "form_analysis": "近期状态分析"
}
```

#### 2. AI模型架构
```
多层神经网络模型
├── 输入层 (数据预处理)
│   ├── 球队实力评估
│   ├── 历史对战记录
│   ├── 主客场优势
│   └── 赔率变化趋势
├── 隐藏层 (特征提取)
│   ├── LSTM层 (时序数据)
│   ├── CNN层 (图像数据)
│   └── Attention层 (权重分配)
└── 输出层 (预测结果)
    ├── 胜平负概率
    ├── 进球数预测
    └── 置信度评分
```

#### 3. 2串1组合优化算法
```python
def optimize_2string1_combinations(matches, ai_predictions):
    """
    2串1组合优化算法
    """
    # 1. 筛选高置信度比赛
    high_confidence_matches = filter_by_confidence(matches, threshold=0.75)
    
    # 2. 计算组合期望收益
    combinations = generate_combinations(high_confidence_matches, k=2)
    
    # 3. 风险评估
    for combo in combinations:
        combo.expected_return = calculate_expected_return(combo)
        combo.risk_score = calculate_risk_score(combo)
        combo.kelly_criterion = calculate_kelly(combo)
    
    # 4. 排序选择最优组合
    optimal_combos = sort_by_score(combinations)
    
    return optimal_combos[:5]  # 返回前5个最优组合
```

### AI预测模型详解

#### 1. 球队实力评估模型
```python
class TeamStrengthModel:
    def __init__(self):
        self.features = [
            'recent_form',      # 近期状态
            'home_away_record', # 主客场记录
            'head_to_head',     # 历史对战
            'squad_strength',   # 阵容实力
            'tactical_style',   # 战术风格
            'motivation_level'  # 战意水平
        ]
    
    def predict_match_outcome(self, home_team, away_team):
        # 特征工程
        features = self.extract_features(home_team, away_team)
        
        # 模型预测
        probabilities = self.model.predict_proba(features)
        
        return {
            'home_win': probabilities[0],
            'draw': probabilities[1], 
            'away_win': probabilities[2],
            'confidence': self.calculate_confidence(probabilities)
        }
```

#### 2. 赔率变化分析
```python
class OddsAnalysisModel:
    def analyze_odds_movement(self, match_id, time_window=24):
        """
        分析赔率变化趋势
        """
        odds_history = get_odds_history(match_id, time_window)
        
        # 计算赔率变化率
        odds_change_rate = calculate_change_rate(odds_history)
        
        # 识别异常变化
        anomalies = detect_anomalies(odds_change_rate)
        
        # 预测最终赔率
        predicted_odds = self.predict_final_odds(odds_history)
        
        return {
            'current_odds': odds_history[-1],
            'predicted_odds': predicted_odds,
            'change_rate': odds_change_rate,
            'anomalies': anomalies,
            'market_sentiment': self.analyze_sentiment(odds_history)
        }
```

## 🎯 倍投足彩底层逻辑

### 1. 倍投数学模型

#### 基础倍投公式
```python
class MartingaleCalculator:
    def __init__(self, initial_bet, target_profit, max_rounds=8):
        self.initial_bet = initial_bet
        self.target_profit = target_profit
        self.max_rounds = max_rounds
        
    def calculate_bet_sequence(self, odds=2.0):
        """
        计算倍投序列
        """
        bets = []
        cumulative_loss = 0
        
        for round_num in range(self.max_rounds):
            # 计算当前轮次投注金额
            if round_num == 0:
                bet_amount = self.initial_bet
            else:
                # 倍投公式: 下一轮投注 = (累计损失 + 目标利润) / (赔率 - 1)
                bet_amount = (cumulative_loss + self.target_profit) / (odds - 1)
            
            bets.append({
                'round': round_num + 1,
                'bet_amount': bet_amount,
                'cumulative_loss': cumulative_loss,
                'potential_profit': bet_amount * odds - cumulative_loss - bet_amount
            })
            
            cumulative_loss += bet_amount
            
        return bets
```

#### 2. 风险控制算法
```python
class RiskManagement:
    def __init__(self, total_capital, max_risk_percentage=0.1):
        self.total_capital = total_capital
        self.max_risk_percentage = max_risk_percentage
        self.max_loss = total_capital * max_risk_percentage
        
    def calculate_safe_bet_amount(self, current_loss, odds):
        """
        计算安全投注金额
        """
        remaining_capital = self.total_capital - current_loss
        max_safe_bet = remaining_capital * 0.2  # 单次最大投注不超过剩余资金的20%
        
        # Kelly准则计算最优投注比例
        kelly_fraction = self.calculate_kelly_fraction(odds)
        kelly_bet = remaining_capital * kelly_fraction
        
        return min(max_safe_bet, kelly_bet)
    
    def calculate_kelly_fraction(self, odds, win_probability=0.5):
        """
        Kelly准则计算最优投注比例
        """
        # Kelly公式: f = (bp - q) / b
        # b = 赔率 - 1, p = 胜率, q = 败率
        b = odds - 1
        p = win_probability
        q = 1 - p
        
        kelly_fraction = (b * p - q) / b
        return max(0, min(kelly_fraction, 0.25))  # 限制在0-25%之间
```

### 3. 智能倍投策略

#### 动态倍投系数
```python
class DynamicMartingale:
    def __init__(self):
        self.base_multiplier = 1.5
        self.max_multiplier = 3.0
        self.min_multiplier = 1.2
        
    def calculate_dynamic_multiplier(self, consecutive_losses, confidence_score):
        """
        根据连败次数和AI置信度动态调整倍投系数
        """
        # 基础调整
        if consecutive_losses <= 2:
            multiplier = self.base_multiplier
        elif consecutive_losses <= 4:
            multiplier = self.base_multiplier * 1.2
        else:
            multiplier = self.base_multiplier * 1.5
            
        # 根据AI置信度调整
        confidence_factor = confidence_score / 100
        multiplier *= confidence_factor
        
        # 限制在合理范围内
        return max(self.min_multiplier, min(multiplier, self.max_multiplier))
```

#### 4. 连黑理赔机制
```python
class CompensationSystem:
    def __init__(self, compensation_threshold=8):
        self.compensation_threshold = compensation_threshold
        
    def check_compensation_eligibility(self, user_id):
        """
        检查理赔资格
        """
        user_stats = get_user_statistics(user_id)
        
        if user_stats['consecutive_losses'] >= self.compensation_threshold:
            compensation_amount = self.calculate_compensation(user_stats)
            return {
                'eligible': True,
                'compensation_amount': compensation_amount,
                'loss_amount': user_stats['total_loss'],
                'compensation_rate': compensation_amount / user_stats['total_loss']
            }
        
        return {'eligible': False}
    
    def calculate_compensation(self, user_stats):
        """
        计算理赔金额
        """
        total_loss = user_stats['total_loss']
        compensation_rate = 0.8  # 80%理赔率
        
        return total_loss * compensation_rate
```

## 🎁 邀请奖励系统

### 1. 邀请奖励结构

#### 基础奖励机制
```python
class InvitationRewardSystem:
    def __init__(self):
        self.reward_tiers = {
            'direct_invite': {
                'registration_bonus': 50,      # 注册奖励50 USDT
                'first_bet_bonus': 100,        # 首次投注奖励100 USDT
                'commission_rate': 0.1         # 10%佣金
            },
            'indirect_invite': {
                'registration_bonus': 20,      # 间接邀请注册奖励20 USDT
                'commission_rate': 0.05        # 5%佣金
            }
        }
    
    def calculate_invitation_reward(self, inviter_id, invitee_id, reward_type):
        """
        计算邀请奖励
        """
        inviter_stats = get_user_statistics(inviter_id)
        invitee_stats = get_user_statistics(invitee_id)
        
        # 基础奖励
        base_reward = self.reward_tiers[reward_type]['registration_bonus']
        
        # 等级加成
        level_multiplier = self.get_level_multiplier(inviter_stats['level'])
        
        # 活跃度加成
        activity_multiplier = self.get_activity_multiplier(inviter_stats['activity_score'])
        
        total_reward = base_reward * level_multiplier * activity_multiplier
        
        return {
            'base_reward': base_reward,
            'level_multiplier': level_multiplier,
            'activity_multiplier': activity_multiplier,
            'total_reward': total_reward
        }
```

#### 2. 邀请等级系统
```python
class InvitationLevelSystem:
    def __init__(self):
        self.level_requirements = {
            'Bronze': {'invites': 5, 'total_commission': 500},
            'Silver': {'invites': 20, 'total_commission': 2000},
            'Gold': {'invites': 50, 'total_commission': 10000},
            'Platinum': {'invites': 100, 'total_commission': 50000},
            'Diamond': {'invites': 200, 'total_commission': 100000}
        }
        
        self.level_benefits = {
            'Bronze': {'commission_bonus': 0.05, 'monthly_bonus': 200},
            'Silver': {'commission_bonus': 0.1, 'monthly_bonus': 500},
            'Gold': {'commission_bonus': 0.15, 'monthly_bonus': 1000},
            'Platinum': {'commission_bonus': 0.2, 'monthly_bonus': 2000},
            'Diamond': {'commission_bonus': 0.25, 'monthly_bonus': 5000}
        }
    
    def calculate_user_level(self, user_id):
        """
        计算用户邀请等级
        """
        user_stats = get_user_statistics(user_id)
        
        for level, requirements in self.level_requirements.items():
            if (user_stats['total_invites'] >= requirements['invites'] and 
                user_stats['total_commission'] >= requirements['total_commission']):
                return level
        
        return 'Bronze'  # 默认等级
```

### 3. 佣金计算系统
```python
class CommissionCalculator:
    def __init__(self):
        self.commission_rates = {
            'betting_commission': 0.05,    # 投注佣金5%
            'recharge_commission': 0.02,   # 充值佣金2%
            'withdrawal_commission': 0.01  # 提现佣金1%
        }
    
    def calculate_commission(self, inviter_id, invitee_id, transaction_type, amount):
        """
        计算佣金
        """
        inviter_level = get_user_level(inviter_id)
        base_rate = self.commission_rates[transaction_type]
        
        # 等级加成
        level_bonus = self.get_level_bonus(inviter_level)
        
        # 计算佣金
        commission_rate = base_rate * (1 + level_bonus)
        commission_amount = amount * commission_rate
        
        return {
            'base_rate': base_rate,
            'level_bonus': level_bonus,
            'final_rate': commission_rate,
            'commission_amount': commission_amount
        }
```

## 🏢 代理奖励系统

### 1. 代理等级体系

#### 代理等级定义
```python
class AgentLevelSystem:
    def __init__(self):
        self.agent_levels = {
            'Regional_Agent': {
                'requirements': {
                    'monthly_invites': 100,
                    'monthly_volume': 100000,
                    'active_users': 50
                },
                'benefits': {
                    'commission_rate': 0.15,
                    'monthly_bonus': 5000,
                    'marketing_support': True,
                    'priority_support': True
                }
            },
            'City_Agent': {
                'requirements': {
                    'monthly_invites': 50,
                    'monthly_volume': 50000,
                    'active_users': 25
                },
                'benefits': {
                    'commission_rate': 0.12,
                    'monthly_bonus': 2500,
                    'marketing_support': True,
                    'priority_support': False
                }
            },
            'District_Agent': {
                'requirements': {
                    'monthly_invites': 20,
                    'monthly_volume': 20000,
                    'active_users': 10
                },
                'benefits': {
                    'commission_rate': 0.1,
                    'monthly_bonus': 1000,
                    'marketing_support': False,
                    'priority_support': False
                }
            }
        }
```

#### 2. 代理奖励计算
```python
class AgentRewardCalculator:
    def __init__(self):
        self.reward_components = {
            'direct_commission': 0.1,      # 直接佣金10%
            'team_commission': 0.05,       # 团队佣金5%
            'performance_bonus': 0.02,     # 绩效奖金2%
            'volume_bonus': 0.01          # 流水奖金1%
        }
    
    def calculate_agent_reward(self, agent_id, period='monthly'):
        """
        计算代理奖励
        """
        agent_stats = get_agent_statistics(agent_id, period)
        agent_level = get_agent_level(agent_id)
        
        # 直接佣金
        direct_commission = agent_stats['direct_volume'] * self.reward_components['direct_commission']
        
        # 团队佣金
        team_commission = agent_stats['team_volume'] * self.reward_components['team_commission']
        
        # 绩效奖金
        performance_bonus = self.calculate_performance_bonus(agent_stats)
        
        # 流水奖金
        volume_bonus = self.calculate_volume_bonus(agent_stats)
        
        # 等级加成
        level_multiplier = self.get_level_multiplier(agent_level)
        
        total_reward = (direct_commission + team_commission + 
                       performance_bonus + volume_bonus) * level_multiplier
        
        return {
            'direct_commission': direct_commission,
            'team_commission': team_commission,
            'performance_bonus': performance_bonus,
            'volume_bonus': volume_bonus,
            'level_multiplier': level_multiplier,
            'total_reward': total_reward
        }
```

### 3. 代理管理系统
```python
class AgentManagementSystem:
    def __init__(self):
        self.agent_tasks = {
            'daily_tasks': [
                'invite_new_users',
                'maintain_user_activity',
                'provide_customer_support'
            ],
            'weekly_tasks': [
                'analyze_team_performance',
                'optimize_marketing_strategy',
                'report_market_feedback'
            ],
            'monthly_tasks': [
                'review_agent_performance',
                'plan_expansion_strategy',
                'training_and_development'
            ]
        }
    
    def evaluate_agent_performance(self, agent_id):
        """
        评估代理绩效
        """
        performance_metrics = {
            'user_growth': self.calculate_user_growth_rate(agent_id),
            'retention_rate': self.calculate_retention_rate(agent_id),
            'volume_growth': self.calculate_volume_growth_rate(agent_id),
            'customer_satisfaction': self.get_customer_satisfaction_score(agent_id)
        }
        
        # 综合评分
        overall_score = self.calculate_overall_score(performance_metrics)
        
        return {
            'metrics': performance_metrics,
            'overall_score': overall_score,
            'recommendations': self.generate_recommendations(performance_metrics)
        }
```

## 📊 系统集成架构

### 1. 数据流架构
```
用户行为数据 → AI预测模型 → 投注建议 → 倍投计算 → 风险控制
     ↓              ↓           ↓         ↓         ↓
邀请奖励系统 ← 代理管理系统 ← 佣金计算 ← 交易记录 ← 理赔系统
```

### 2. 实时监控系统
```python
class RealTimeMonitoring:
    def __init__(self):
        self.monitoring_metrics = [
            'ai_prediction_accuracy',
            'martingale_success_rate',
            'compensation_claims',
            'agent_performance',
            'system_revenue'
        ]
    
    def generate_daily_report(self):
        """
        生成每日报告
        """
        report = {}
        for metric in self.monitoring_metrics:
            report[metric] = self.calculate_metric_value(metric)
        
        return report
```

## 🔒 风控与合规

### 1. 反欺诈系统
```python
class AntiFraudSystem:
    def __init__(self):
        self.fraud_indicators = [
            'unusual_betting_patterns',
            'rapid_account_growth',
            'suspicious_transactions',
            'multiple_accounts_same_ip'
        ]
    
    def detect_fraud(self, user_id):
        """
        检测欺诈行为
        """
        user_behavior = get_user_behavior_data(user_id)
        
        fraud_score = 0
        for indicator in self.fraud_indicators:
            if self.check_indicator(user_behavior, indicator):
                fraud_score += self.get_indicator_weight(indicator)
        
        return {
            'fraud_score': fraud_score,
            'risk_level': self.calculate_risk_level(fraud_score),
            'recommended_actions': self.get_recommended_actions(fraud_score)
        }
```

---

**ScoreRED AI智能投注系统 - 让科技赋能投注，让收益更稳定！** 🚀
