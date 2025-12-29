// 游戏数据
let gameData = {
    score: 0,
    streak: 0,
    bestStreak: 0,
    level: '新手',
    habits: [],
    totalCompleted: 0,
    lastCompletedDate: null,
    achievements: []
};

// 成就定义
const achievementDefinitions = [
    { id: 'first_habit', icon: '🌱', name: '破冰者', desc: '创建第一个习惯', check: (data) => data.habits.length >= 1 },
    { id: 'three_habits', icon: '🎯', name: '多面手', desc: '创建3个习惯', check: (data) => data.habits.length >= 3 },
    { id: 'first_complete', icon: '✨', name: '首战告捷', desc: '完成第一个习惯', check: (data) => data.totalCompleted >= 1 },
    { id: 'ten_complete', icon: '💪', name: '坚持不懈', desc: '累计完成10次', check: (data) => data.totalCompleted >= 10 },
    { id: 'streak_3', icon: '🔥', name: '三日之约', desc: '连续3天', check: (data) => data.streak >= 3 },
    { id: 'streak_7', icon: '⭐', name: '一周达人', desc: '连续7天', check: (data) => data.streak >= 7 },
    { id: 'streak_30', icon: '👑', name: '月度冠军', desc: '连续30天', check: (data) => data.streak >= 30 },
    { id: 'score_100', icon: '🏅', name: '百分成就', desc: '总分达到100', check: (data) => data.score >= 100 },
    { id: 'score_500', icon: '💎', name: '五百强者', desc: '总分达到500', check: (data) => data.score >= 500 }
];

// 等级系统
const levels = [
    { threshold: 0, name: '新手' },
    { threshold: 50, name: '学徒' },
    { threshold: 150, name: '熟练者' },
    { threshold: 300, name: '专家' },
    { threshold: 500, name: '大师' },
    { threshold: 1000, name: '宗师' }
];

// 庆祝语录
const celebrations = [
    '太棒了！继续保持！',
    '你做到了！',
    '很好！习惯正在养成！',
    '优秀！坚持就是胜利！',
    '了不起的进步！',
    '为你骄傲！',
    '你真是太厉害了！',
    '继续加油！'
];

// 掉落物品配置
const fallingItems = [
    { emoji: '⭐', points: 5, name: '星星' },
    { emoji: '💎', points: 10, name: '钻石' },
    { emoji: '🍄', points: 8, name: '蘑菇' },
    { emoji: '🌟', points: 12, name: '闪星' },
    { emoji: '🎁', points: 15, name: '礼物' },
    { emoji: '🏆', points: 20, name: '奖杯' },
    { emoji: '💰', points: 25, name: '金币' }
];

// 掉落物品追踪
let activeFallingItems = [];

// 初始化
function init() {
    loadGameData();
    renderUI();
    bindEvents();
}

// 加载游戏数据
function loadGameData() {
    const saved = localStorage.getItem('tinyhabits_game');
    if (saved) {
        gameData = JSON.parse(saved);
        checkStreak();
    }
}

// 保存游戏数据
function saveGameData() {
    localStorage.setItem('tinyhabits_game', JSON.stringify(gameData));
}

// 检查连续天数
function checkStreak() {
    const today = new Date().toDateString();
    if (gameData.lastCompletedDate) {
        const lastDate = new Date(gameData.lastCompletedDate);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastDate.toDateString() !== today && lastDate.toDateString() !== yesterday.toDateString()) {
            gameData.streak = 0;
        }
    }
}

// 渲染UI
function renderUI() {
    updateScoreBoard();
    renderHabitsList();
    renderAchievements();
    updateStats();
}

// 更新分数面板
function updateScoreBoard() {
    document.getElementById('totalScore').textContent = gameData.score;
    document.getElementById('streak').textContent = gameData.streak;
    document.getElementById('level').textContent = gameData.level;
}

// 渲染习惯列表
function renderHabitsList() {
    const container = document.getElementById('habitsList');

    if (gameData.habits.length === 0) {
        container.innerHTML = '<p class="empty-message">还没有习惯，创建你的第一个微习惯吧！</p>';
        return;
    }

    const today = new Date().toDateString();
    container.innerHTML = gameData.habits.map((habit, index) => {
        const completedToday = habit.lastCompleted === today;
        return `
            <div class="habit-item ${completedToday ? 'completed' : ''}" data-index="${index}">
                <div class="habit-content">
                    <div class="habit-text">
                        在我<strong>${habit.anchor}</strong>之后，我会<strong>${habit.behavior}</strong>
                    </div>
                    <div class="habit-meta">
                        完成次数: ${habit.completedCount} 次 | 创建时间: ${habit.createdDate}
                    </div>
                </div>
                <div class="habit-actions">
                    <button class="btn-complete" onclick="completeHabit(${index})" ${completedToday ? 'disabled' : ''}>
                        ${completedToday ? '✓ 已完成' : '完成'}
                    </button>
                    <button class="btn-delete" onclick="deleteHabit(${index})">删除</button>
                </div>
            </div>
        `;
    }).join('');
}

// 渲染成就
function renderAchievements() {
    const container = document.getElementById('achievementsGrid');

    container.innerHTML = achievementDefinitions.map(achievement => {
        const unlocked = gameData.achievements.includes(achievement.id);
        return `
            <div class="achievement-item ${unlocked ? 'unlocked' : ''}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.desc}</div>
            </div>
        `;
    }).join('');
}

// 更新统计
function updateStats() {
    document.getElementById('totalCompleted').textContent = gameData.totalCompleted;
    document.getElementById('bestStreak').textContent = gameData.bestStreak;
    document.getElementById('habitCount').textContent = gameData.habits.length;
}

// 绑定事件
function bindEvents() {
    // 添加习惯按钮
    document.getElementById('addHabitBtn').addEventListener('click', addHabit);

    // 快速示例标签
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', function() {
            document.getElementById('anchorInput').value = this.dataset.anchor;
            document.getElementById('behaviorInput').value = this.dataset.behavior;
        });
    });

    // 重置按钮
    document.getElementById('resetBtn').addEventListener('click', resetGame);

    // 回车键添加习惯
    document.getElementById('behaviorInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addHabit();
        }
    });
}

// 添加习惯
function addHabit() {
    const anchor = document.getElementById('anchorInput').value.trim();
    const behavior = document.getElementById('behaviorInput').value.trim();

    if (!anchor || !behavior) {
        alert('请填写完整的习惯公式！');
        return;
    }

    const habit = {
        anchor: anchor,
        behavior: behavior,
        createdDate: new Date().toLocaleDateString('zh-CN'),
        completedCount: 0,
        lastCompleted: null
    };

    gameData.habits.push(habit);

    // 清空输入
    document.getElementById('anchorInput').value = '';
    document.getElementById('behaviorInput').value = '';

    checkAchievements();
    saveGameData();
    renderUI();
}

// 完成习惯
function completeHabit(index) {
    const habit = gameData.habits[index];
    const today = new Date().toDateString();

    if (habit.lastCompleted === today) {
        return;
    }

    // 更新习惯数据
    habit.completedCount++;
    habit.lastCompleted = today;

    // 更新游戏数据
    const points = 10 + gameData.streak * 2; // 连续天数越多奖励越高
    gameData.score += points;
    gameData.totalCompleted++;

    // 更新连续天数
    if (!gameData.lastCompletedDate || gameData.lastCompletedDate === today) {
        // 今天已经完成过其他习惯，不增加连续天数
    } else {
        const lastDate = new Date(gameData.lastCompletedDate);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastDate.toDateString() === yesterday.toDateString()) {
            gameData.streak++;
        } else {
            gameData.streak = 1;
        }
    }

    gameData.lastCompletedDate = today;

    // 更新最佳连续天数
    if (gameData.streak > gameData.bestStreak) {
        gameData.bestStreak = gameData.streak;
    }

    // 更新等级
    updateLevel();

    // 显示庆祝
    showCelebration(points);

    // 触发掉落物品雨
    startItemRain(5);

    checkAchievements();
    saveGameData();
    renderUI();
}

// 删除习惯
function deleteHabit(index) {
    if (confirm('确定要删除这个习惯吗？')) {
        gameData.habits.splice(index, 1);
        saveGameData();
        renderUI();
    }
}

// 更新等级
function updateLevel() {
    for (let i = levels.length - 1; i >= 0; i--) {
        if (gameData.score >= levels[i].threshold) {
            gameData.level = levels[i].name;
            break;
        }
    }
}

// 显示庆祝动画
function showCelebration(points) {
    const celebration = document.getElementById('celebration');
    const text = celebration.querySelector('.celebration-text');

    const randomMessage = celebrations[Math.floor(Math.random() * celebrations.length)];
    text.innerHTML = `${randomMessage}<br><span style="font-size: 0.8em;">+${points} 分</span>`;

    celebration.classList.add('show');

    setTimeout(() => {
        celebration.classList.remove('show');
    }, 2000);
}

// 检查成就
function checkAchievements() {
    let newAchievements = [];

    achievementDefinitions.forEach(achievement => {
        if (!gameData.achievements.includes(achievement.id) && achievement.check(gameData)) {
            gameData.achievements.push(achievement.id);
            newAchievements.push(achievement);
        }
    });

    // 显示新解锁的成就
    newAchievements.forEach((achievement, i) => {
        setTimeout(() => {
            showAchievementUnlock(achievement);
        }, (i + 1) * 2500);
    });
}

// 显示成就解锁
function showAchievementUnlock(achievement) {
    const celebration = document.getElementById('celebration');
    const emoji = celebration.querySelector('.celebration-emoji');
    const text = celebration.querySelector('.celebration-text');

    emoji.textContent = achievement.icon;
    text.innerHTML = `解锁成就：${achievement.name}<br><span style="font-size: 0.7em;">${achievement.desc}</span>`;

    celebration.classList.add('show');

    setTimeout(() => {
        celebration.classList.remove('show');
        emoji.textContent = '🎉';
    }, 2500);
}

// 重置游戏
function resetGame() {
    if (confirm('确定要重置游戏吗？所有数据将被清除！')) {
        localStorage.removeItem('tinyhabits_game');
        gameData = {
            score: 0,
            streak: 0,
            bestStreak: 0,
            level: '新手',
            habits: [],
            totalCompleted: 0,
            lastCompletedDate: null,
            achievements: []
        };
        renderUI();
    }
}

// 创建掉落物品
function createFallingItem() {
    const canvas = document.getElementById('gameCanvas');
    const item = fallingItems[Math.floor(Math.random() * fallingItems.length)];

    const fallingDiv = document.createElement('div');
    fallingDiv.className = 'falling-item';
    fallingDiv.textContent = item.emoji;
    fallingDiv.dataset.points = item.points;
    fallingDiv.dataset.name = item.name;

    // 随机水平位置
    const randomX = Math.random() * (window.innerWidth - 80);
    fallingDiv.style.left = randomX + 'px';

    // 随机掉落速度
    const duration = 3 + Math.random() * 2; // 3-5秒
    fallingDiv.style.animationDuration = duration + 's';

    canvas.appendChild(fallingDiv);
    activeFallingItems.push(fallingDiv);

    // 点击收集
    fallingDiv.addEventListener('click', function(e) {
        collectItem(this, item);
        e.stopPropagation();
    });

    // 掉落结束后移除
    setTimeout(() => {
        if (fallingDiv.parentNode) {
            fallingDiv.remove();
            activeFallingItems = activeFallingItems.filter(i => i !== fallingDiv);
        }
    }, duration * 1000);
}

// 收集物品
function collectItem(element, item) {
    // 添加分数
    gameData.score += item.points;

    // 显示收集效果
    const collectEffect = document.createElement('div');
    collectEffect.className = 'collect-effect';
    collectEffect.textContent = `+${item.points}`;
    collectEffect.style.left = element.style.left;
    collectEffect.style.top = element.offsetTop + 'px';

    document.getElementById('gameCanvas').appendChild(collectEffect);

    // 移除物品
    element.remove();
    activeFallingItems = activeFallingItems.filter(i => i !== element);

    // 移除收集效果
    setTimeout(() => {
        collectEffect.remove();
    }, 1000);

    // 更新UI
    updateScoreBoard();
    saveGameData();

    // 播放收集音效（可选）
    playCollectSound();
}

// 播放收集音效（简单的视觉反馈）
function playCollectSound() {
    // 这里可以添加实际的音效
    // 目前使用视觉震动效果
    const scoreElement = document.getElementById('totalScore');
    scoreElement.style.transform = 'scale(1.2)';
    setTimeout(() => {
        scoreElement.style.transform = 'scale(1)';
    }, 200);
}

// 开始掉落物品雨
function startItemRain(count = 5) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            createFallingItem();
        }, i * 300); // 每300ms掉落一个
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
