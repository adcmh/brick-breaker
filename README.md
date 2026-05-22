# 打砖块游戏 (Breakout Game)

纯 JavaScript / Canvas 实现的经典打砖块游戏，无需任何依赖，浏览器直接打开即玩。

## 玩法

- **← →** 或 **A/D** 键：移动挡板
- **鼠标** / **触摸**：也可控制挡板
- **空格** / **点击**：发射小球
- **P**：暂停 / 继续

小球反弹击碎所有砖块即过关，共 5 关。小球落入底部扣除一条命，3 条命用完则游戏结束。

## 技术要点（适合练习）

| 知识点 | 说明 |
|--------|------|
| **物理反弹** | 球与墙壁、挡板、砖块的弹性碰撞，挡板击中位置映射 -60°~+60° 反射角 |
| **对象类设计** | `Vector2D` → `Ball` → `Paddle` → `Brick` → `BrickGrid` → `Game` 六层递进架构 |
| **碰撞检测** | AABB-圆形碰撞、穿透深度计算、碰撞面判定 |
| **游戏循环** | `requestAnimationFrame` + delta time 帧率无关运动 |

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/brick-breaker.git
cd brick-breaker

# 直接用浏览器打开
open index.html   # macOS
start index.html  # Windows
xdg-open index.html  # Linux
```

或者直接双击 `index.html`。

## 文件结构

```
brick-breaker/
├── index.html    # 入口页面
├── style.css     # 样式
├── game.js       # 全部游戏逻辑（类定义 + 游戏循环）
└── README.md
```

## 关卡设计

- 第 1 关：6 行砖块，少数双血砖块
- 每关球速 +40，砖块行数 +1
- 第 5 关通关后胜利
