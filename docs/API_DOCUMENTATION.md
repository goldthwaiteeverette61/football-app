# ScoreRED API接口文档

## 🤖 AI预测接口

### 1. 获取AI推荐2串1方案
```http
POST /api/v1/ai/recommendations
Content-Type: application/json

{
  "user_id": "string",
  "preferences": {
    "min_confidence": 0.75,
    "max_risk_level": "medium",
    "target_profit": 1000
  }
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "rec_001",
        "matches": [
          {
            "match_id": "match_001",
            "home_team": "Manchester United",
            "away_team": "Liverpool",
            "prediction": "home_win",
            "confidence": 0.82,
            "odds": 2.1
          },
          {
            "match_id": "match_002", 
            "home_team": "Barcelona",
            "away_team": "Real Madrid",
            "prediction": "draw",
            "confidence": 0.78,
            "odds": 3.2
          }
        ],
        "total_odds": 6.72,
        "expected_return": 6720,
        "risk_score": 0.3,
        "ai_confidence": 0.80
      }
    ],
    "generated_at": "2024-09-19T10:30:00Z"
  }
}
```

### 2. 获取单场比赛AI预测
```http
GET /api/v1/ai/predictions/{match_id}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "match_id": "match_001",
    "predictions": {
      "home_win": 0.45,
      "draw": 0.30,
      "away_win": 0.25
    },
    "confidence": 0.82,
    "factors": {
      "team_form": 0.8,
      "head_to_head": 0.7,
      "home_advantage": 0.9,
      "injuries": 0.6
    },
    "recommendation": "home_win"
  }
}
```

## 🎯 倍投计算接口

### 1. 计算倍投序列
```http
POST /api/v1/martingale/calculate
Content-Type: application/json

{
  "initial_bet": 100,
  "target_profit": 200,
  "odds": 2.0,
  "max_rounds": 8,
  "user_capital": 10000
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "bet_sequence": [
      {
        "round": 1,
        "bet_amount": 100,
        "cumulative_loss": 0,
        "potential_profit": 200
      },
      {
        "round": 2,
        "bet_amount": 200,
        "cumulative_loss": 100,
        "potential_profit": 300
      }
    ],
    "total_risk": 1500,
    "success_probability": 0.85,
    "kelly_fraction": 0.15
  }
}
```

### 2. 动态倍投系数计算
```http
POST /api/v1/martingale/dynamic-multiplier
Content-Type: application/json

{
  "consecutive_losses": 3,
  "ai_confidence": 0.82,
  "user_level": "gold"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "base_multiplier": 1.5,
    "confidence_adjustment": 0.82,
    "loss_adjustment": 1.2,
    "level_bonus": 0.1,
    "final_multiplier": 1.64
  }
}
```

## 🎁 邀请奖励接口

### 1. 生成邀请码
```http
POST /api/v1/invitation/generate-code
Authorization: Bearer {token}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "invitation_code": "SCORE2024ABC",
    "qr_code_url": "https://api.scorered.com/qr/SCORE2024ABC",
    "expires_at": "2024-12-31T23:59:59Z"
  }
}
```

### 2. 使用邀请码注册
```http
POST /api/v1/invitation/register
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "invitation_code": "SCORE2024ABC",
  "captcha": "123456"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "user_id": "user_123",
    "inviter_id": "user_456",
    "rewards": {
      "registration_bonus": 50,
      "first_bet_bonus": 100,
      "total_bonus": 150
    }
  }
}
```

### 3. 获取邀请统计
```http
GET /api/v1/invitation/statistics
Authorization: Bearer {token}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "total_invites": 25,
    "active_invites": 18,
    "total_commission": 2500,
    "current_level": "silver",
    "next_level_requirements": {
      "invites_needed": 5,
      "commission_needed": 1500
    },
    "monthly_stats": {
      "new_invites": 5,
      "commission_earned": 500
    }
  }
}
```

### 4. 计算佣金
```http
POST /api/v1/invitation/calculate-commission
Content-Type: application/json

{
  "inviter_id": "user_456",
  "invitee_id": "user_123",
  "transaction_type": "betting",
  "amount": 1000
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "base_rate": 0.05,
    "level_bonus": 0.1,
    "final_rate": 0.055,
    "commission_amount": 55
  }
}
```

## 🏢 代理管理接口

### 1. 申请成为代理
```http
POST /api/v1/agent/apply
Authorization: Bearer {token}
Content-Type: application/json

{
  "agent_type": "city_agent",
  "region": "Beijing",
  "business_plan": "Monthly target: 50 invites, 50k volume",
  "contact_info": {
    "phone": "+86-138-0000-0000",
    "email": "agent@example.com"
  }
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "application_id": "app_789",
    "status": "pending",
    "estimated_approval_time": "3-5 business days"
  }
}
```

### 2. 获取代理等级
```http
GET /api/v1/agent/level
Authorization: Bearer {token}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "current_level": "city_agent",
    "requirements_met": {
      "monthly_invites": true,
      "monthly_volume": true,
      "active_users": false
    },
    "benefits": {
      "commission_rate": 0.12,
      "monthly_bonus": 2500,
      "marketing_support": true
    },
    "next_level": {
      "level": "regional_agent",
      "requirements": {
        "monthly_invites": 100,
        "monthly_volume": 100000,
        "active_users": 50
      }
    }
  }
}
```

### 3. 代理奖励计算
```http
GET /api/v1/agent/rewards/{period}
Authorization: Bearer {token}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "period": "2024-09",
    "rewards": {
      "direct_commission": 1200,
      "team_commission": 800,
      "performance_bonus": 300,
      "volume_bonus": 200,
      "level_multiplier": 1.2,
      "total_reward": 3000
    },
    "statistics": {
      "direct_invites": 15,
      "team_size": 45,
      "total_volume": 50000,
      "active_users": 35
    }
  }
}
```

### 4. 代理绩效评估
```http
GET /api/v1/agent/performance
Authorization: Bearer {token}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "user_growth_rate": 0.25,
      "retention_rate": 0.85,
      "volume_growth_rate": 0.30,
      "customer_satisfaction": 4.2
    },
    "overall_score": 8.5,
    "rank": "top_20_percent",
    "recommendations": [
      "Focus on user retention strategies",
      "Increase marketing activities in Q4"
    ]
  }
}
```

## 🛡️ 理赔系统接口

### 1. 检查理赔资格
```http
GET /api/v1/compensation/eligibility
Authorization: Bearer {token}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "eligible": true,
    "consecutive_losses": 8,
    "total_loss": 1500,
    "compensation_amount": 1200,
    "compensation_rate": 0.8
  }
}
```

### 2. 申请理赔
```http
POST /api/v1/compensation/apply
Authorization: Bearer {token}
Content-Type: application/json

{
  "pay_password": "user_password"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "claim_id": "claim_123",
    "status": "approved",
    "compensation_amount": 1200,
    "processed_at": "2024-09-19T10:30:00Z"
  }
}
```

## 📊 统计报表接口

### 1. 用户投注统计
```http
GET /api/v1/statistics/betting/{user_id}
Authorization: Bearer {token}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "total_bets": 150,
    "successful_bets": 120,
    "success_rate": 0.80,
    "total_invested": 15000,
    "total_return": 18000,
    "net_profit": 3000,
    "martingale_usage": {
      "times_used": 25,
      "success_rate": 0.85,
      "total_compensation": 800
    }
  }
}
```

### 2. 系统整体统计
```http
GET /api/v1/statistics/system
Authorization: Bearer {admin_token}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total_users": 10000,
      "active_users": 7500,
      "new_registrations": 500
    },
    "betting": {
      "total_volume": 1000000,
      "ai_recommendations": 5000,
      "success_rate": 0.78
    },
    "agents": {
      "total_agents": 200,
      "active_agents": 150,
      "total_commissions": 50000
    },
    "compensation": {
      "total_claims": 100,
      "total_amount": 50000,
      "approval_rate": 0.95
    }
  }
}
```

## 🔒 风控接口

### 1. 风险评估
```http
POST /api/v1/risk/assess
Authorization: Bearer {token}
Content-Type: application/json

{
  "bet_amount": 1000,
  "odds": 2.5,
  "user_level": "gold"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "risk_level": "medium",
    "risk_score": 0.6,
    "recommended_amount": 800,
    "warnings": [
      "Bet amount exceeds recommended limit",
      "Consider reducing bet size"
    ]
  }
}
```

### 2. 反欺诈检测
```http
POST /api/v1/security/fraud-detection
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "user_id": "user_123",
  "transaction_data": {
    "amount": 5000,
    "frequency": "high",
    "pattern": "unusual"
  }
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "fraud_score": 0.7,
    "risk_level": "high",
    "indicators": [
      "unusual_betting_pattern",
      "rapid_account_growth"
    ],
    "recommended_actions": [
      "manual_review",
      "temporary_restriction"
    ]
  }
}
```

## 📝 错误码说明

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 1001 | 用户未认证 | 请先登录 |
| 1002 | 权限不足 | 联系管理员提升权限 |
| 2001 | AI预测服务不可用 | 稍后重试 |
| 2002 | 倍投计算参数错误 | 检查输入参数 |
| 3001 | 邀请码无效 | 使用有效邀请码 |
| 3002 | 佣金计算失败 | 联系客服 |
| 4001 | 代理申请被拒绝 | 查看拒绝原因 |
| 4002 | 代理等级不足 | 满足升级条件 |
| 5001 | 理赔申请失败 | 检查理赔条件 |
| 5002 | 支付密码错误 | 输入正确密码 |

---

**ScoreRED API v1.0 - 智能投注，稳定收益！** 🚀
