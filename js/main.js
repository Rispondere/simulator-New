/**
 * キャスト収益シミュレーター
 * メインJavaScriptファイル
 */

// 現在の計算モード
let currentMode = 'session'; // 'session' or 'hourly'

// Chart.jsのインスタンス
let pieChartInstance = null;
let barChartInstance = null;
let savingsChartInstance = null;

// 数値をカンマ区切りの通貨形式に変換
function formatCurrency(amount) {
    return '¥' + Math.round(amount).toLocaleString('ja-JP');
}

// カンマ区切りの文字列を数値に変換
function parseFormattedNumber(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        // カンマと円マークを削除して数値に変換
        return parseFloat(value.replace(/[,¥]/g, '')) || 0;
    }
    return 0;
}

// 入力フィールドに数値をカンマ区切りでフォーマット
function formatNumberInput(value) {
    const num = parseFormattedNumber(value);
    return num.toLocaleString('ja-JP');
}

// すべての金額入力フィールドのフォーマット設定
function setupNumberFormatting() {
    const numberInputs = [
        'goalAmount', 
        'goalPricePerSession', 
        'goalLivingCost',
        'pricePerSession',    // 本数ベースの単価
        'hourlyRate',         // 時給
        'livingCost'          // 月の固定費
    ];
    
    numberInputs.forEach(id => {
        const input = document.getElementById(id);
        if (!input) return;
        
        // フォーカス時：全選択で編集しやすく
        input.addEventListener('focus', function() {
            this.select();
        });
        
        // 入力時：数字のみ許可し、自動的にカンマ区切りでフォーマット
        input.addEventListener('input', function(e) {
            let value = this.value.replace(/[^\d]/g, ''); // 数字以外を削除
            if (value) {
                this.value = formatNumberInput(value);
            }
        });
        
        // フォーカス解除時：最終フォーマット適用
        input.addEventListener('blur', function() {
            let value = parseFormattedNumber(this.value);
            if (value > 0) {
                this.value = formatNumberInput(value);
            } else {
                this.value = '0';
            }
        });
    });
}

// ページ読み込み時にフォーマット設定を適用
window.addEventListener('DOMContentLoaded', function() {
    setupNumberFormatting();
});

// 計算モードを切り替える
function switchCalculationMode(mode) {
    currentMode = mode;
    
    // タブのactive状態を切り替え
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.closest('.tab-btn').classList.add('active');
    
    // フォームの表示を切り替え
    document.getElementById('sessionForm').style.display = mode === 'session' ? 'block' : 'none';
    document.getElementById('hourlyForm').style.display = mode === 'hourly' ? 'block' : 'none';
    document.getElementById('goalForm').style.display = mode === 'goal' ? 'block' : 'none';
    
    // オプションセクションと固定費フィールドの表示切り替え
    const optionalSection = document.getElementById('optionalSection');
    const livingCostField = document.getElementById('livingCostField');
    const calculateBtn = document.getElementById('calculateBtn');
    const goalCalculateBtn = document.getElementById('goalCalculateBtn');
    
    if (mode === 'goal') {
        optionalSection.style.display = 'none';
        livingCostField.style.display = 'none';
        calculateBtn.style.display = 'none';
        goalCalculateBtn.style.display = 'block';
    } else {
        optionalSection.style.display = 'block';
        livingCostField.style.display = 'block';
        calculateBtn.style.display = 'block';
        goalCalculateBtn.style.display = 'none';
    }
    
    // 結果表示の切り替え
    document.getElementById('normalResults').style.display = mode === 'goal' ? 'none' : 'block';
    document.getElementById('goalResults').style.display = mode === 'goal' ? 'block' : 'none';
    
    // グラフセクションの表示切り替え
    const graphSection = document.querySelector('.graph-section');
    if (graphSection) {
        graphSection.style.display = mode === 'goal' ? 'none' : 'block';
    }
    
    // 再計算
    if (mode === 'goal') {
        calculateGoal();
    } else {
        calculateEarnings();
    }
}

// 収益を計算する関数
function calculateEarnings() {
    const livingCost = parseFormattedNumber(document.getElementById('livingCost').value);
    let dailyEarnings, weeklyEarnings, monthlyBase, daysPerWeek, monthlyWorkDays;
    let monthlyTotalSessions = 0;
    let pricePerSession = 0;
    let sessionsPerDay = 0;
    
    const weeksPerMonth = 4.33;

    if (currentMode === 'session') {
        // 本数ベース計算
        pricePerSession = parseFormattedNumber(document.getElementById('pricePerSession').value);
        sessionsPerDay = parseFloat(document.getElementById('sessionsPerDay').value) || 0;
        daysPerWeek = parseFloat(document.getElementById('daysPerWeek').value) || 0;

        dailyEarnings = pricePerSession * sessionsPerDay;
        weeklyEarnings = dailyEarnings * daysPerWeek;
        monthlyBase = weeklyEarnings * weeksPerMonth;
        monthlyWorkDays = Math.round(daysPerWeek * weeksPerMonth);
        monthlyTotalSessions = Math.round(sessionsPerDay * monthlyWorkDays);

        // 収益内訳を表示
        document.getElementById('breakdownPrice').textContent = formatCurrency(pricePerSession);
        document.getElementById('breakdownSessions').textContent = sessionsPerDay + '本';
        document.getElementById('breakdownDays').textContent = daysPerWeek + '日';
        document.getElementById('breakdownMonthDays').textContent = '約' + monthlyWorkDays + '日';
        document.getElementById('breakdownMonthSessions').textContent = '約' + monthlyTotalSessions + '本';
    } else {
        // 時給ベース計算
        const hourlyRate = parseFormattedNumber(document.getElementById('hourlyRate').value);
        const workHours = parseFloat(document.getElementById('workHours').value) || 0;
        const waitingHours = parseFloat(document.getElementById('waitingHours').value) || 0;
        daysPerWeek = parseFloat(document.getElementById('daysPerWeekHourly').value) || 0;

        // 待機時間は時給の50%で計算
        const waitingPay = hourlyRate * 0.5 * waitingHours;
        const workPay = hourlyRate * workHours;
        dailyEarnings = workPay + waitingPay;
        
        weeklyEarnings = dailyEarnings * daysPerWeek;
        monthlyBase = weeklyEarnings * weeksPerMonth;
        monthlyWorkDays = Math.round(daysPerWeek * weeksPerMonth);

        // 収益内訳を表示
        document.getElementById('breakdownPrice').textContent = formatCurrency(hourlyRate);
        document.getElementById('breakdownSessions').textContent = workHours + '時間 + 待機' + waitingHours + '時間';
        document.getElementById('breakdownDays').textContent = daysPerWeek + '日';
        document.getElementById('breakdownMonthDays').textContent = '約' + monthlyWorkDays + '日';
        document.getElementById('breakdownMonthSessions').textContent = '時給: ' + formatCurrency(hourlyRate);
    }

    const monthlyTotal = monthlyBase;
    const savingsAmount = monthlyTotal - livingCost;
    const yearlyEarnings = monthlyTotal * 12;
    const yearlySavings = savingsAmount * 12;

    // 結果を画面に表示
    document.getElementById('dailyEarnings').textContent = formatCurrency(dailyEarnings);
    document.getElementById('weeklyEarnings').textContent = formatCurrency(weeklyEarnings);
    document.getElementById('monthlyBase').textContent = formatCurrency(monthlyBase);
    document.getElementById('monthlyTotal').textContent = formatCurrency(monthlyTotal);
    document.getElementById('yearlyEarnings').textContent = formatCurrency(yearlyEarnings);
    document.getElementById('livingCostDisplay').textContent = formatCurrency(livingCost);
    document.getElementById('savingsDisplay').textContent = formatCurrency(savingsAmount);
    document.getElementById('yearlySavingsDisplay').textContent = formatCurrency(yearlySavings);

    // アニメーション効果を追加
    addCalculationAnimation();
    
    // グラフを更新
    updateCharts(dailyEarnings, weeklyEarnings, monthlyBase, livingCost, savingsAmount);
}

// 計算時のアニメーション効果
function addCalculationAnimation() {
    const resultCards = document.querySelectorAll('.result-card');
    resultCards.forEach((card, index) => {
        card.style.animation = 'none';
        setTimeout(() => {
            card.style.animation = `fadeIn 0.5s ease ${index * 0.1}s`;
        }, 10);
    });
}

// リアルタイム計算機能：入力値が変更されたら自動で再計算
function setupRealtimeCalculation() {
    const inputs = [
        'pricePerSession',
        'sessionsPerDay',
        'daysPerWeek',
        'hourlyRate',
        'workHours',
        'waitingHours',
        'daysPerWeekHourly',
        'livingCost'
    ];

    inputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            element.addEventListener('input', calculateEarnings);
        }
    });
}

// バリデーション：負の値を防ぐ
function setupValidation() {
    const inputs = document.querySelectorAll('input[type="number"]');
    
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.value < 0) {
                this.value = 0;
            }
        });
    });
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    // 初期計算を実行
    calculateEarnings();
    
    // リアルタイム計算を有効化
    setupRealtimeCalculation();
    
    // バリデーションを設定
    setupValidation();
    
    // ウェルカムメッセージ（コンソール）
    console.log('✨ キャスト収益シミュレーター起動完了！');
    console.log('💰 あなたの収入をシミュレーションしましょう！');
});

// エンターキーでの計算実行
document.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        calculateEarnings();
    }
});

// 数値入力のフォーカス時に全選択
document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('focus', function() {
        this.select();
    });
});

/**
 * プリセット設定機能（将来の拡張用）
 */
const presets = {
    beginner: {
        pricePerSession: 8000,
        sessionsPerDay: 2,
        daysPerWeek: 4,
        livingCost: 100000
    },
    standard: {
        pricePerSession: 10000,
        sessionsPerDay: 3,
        daysPerWeek: 5,
        livingCost: 150000
    },
    premium: {
        pricePerSession: 15000,
        sessionsPerDay: 4,
        daysPerWeek: 6,
        livingCost: 200000
    }
};

// プリセットを適用する関数（今後のUI拡張用）
function applyPreset(presetName) {
    const preset = presets[presetName];
    if (preset) {
        document.getElementById('pricePerSession').value = preset.pricePerSession;
        document.getElementById('sessionsPerDay').value = preset.sessionsPerDay;
        document.getElementById('daysPerWeek').value = preset.daysPerWeek;
        document.getElementById('livingCost').value = preset.livingCost;
        calculateEarnings();
    }
}

// デバッグ用：現在の設定を出力
function debugCurrentSettings() {
    const settings = {
        mode: currentMode,
        pricePerSession: document.getElementById('pricePerSession').value,
        sessionsPerDay: document.getElementById('sessionsPerDay').value,
        daysPerWeek: document.getElementById('daysPerWeek').value,
        hourlyRate: document.getElementById('hourlyRate').value,
        workHours: document.getElementById('workHours').value,
        waitingHours: document.getElementById('waitingHours').value,
        livingCost: document.getElementById('livingCost').value
    };
    console.table(settings);
    return settings;
}

// ========================================
// Chart.js グラフ描画
// ========================================

function updateCharts(daily, weekly, monthly, livingCost, savings) {
    // 円グラフ（収益内訳）
    updatePieChart(daily, weekly, monthly, livingCost, savings);
    
    // 棒グラフ（月別収入推移）
    updateBarChart(monthly, livingCost, savings);
    
    // 貯金額累積グラフ
    updateSavingsChart(savings);
}

// 円グラフを更新
function updatePieChart(daily, weekly, monthly, livingCost, savings) {
    const ctx = document.getElementById('pieChart');
    if (!ctx) return;
    
    // 既存のチャートを破棄
    if (pieChartInstance) {
        pieChartInstance.destroy();
    }
    
    pieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['月収（基本）', '固定費', '貯金可能額'],
            datasets: [{
                data: [monthly, livingCost, savings < 0 ? 0 : savings],
                backgroundColor: [
                    'rgba(255, 105, 180, 0.8)',
                    'rgba(253, 126, 20, 0.8)',
                    'rgba(25, 135, 84, 0.8)'
                ],
                borderColor: [
                    'rgba(255, 105, 180, 1)',
                    'rgba(253, 126, 20, 1)',
                    'rgba(25, 135, 84, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 5,
                    right: 5,
                    top: 5,
                    bottom: 5
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: window.innerWidth <= 480 ? 11 : 14,
                            family: "'Noto Sans JP', sans-serif"
                        },
                        padding: window.innerWidth <= 480 ? 10 : 15,
                        boxWidth: window.innerWidth <= 480 ? 12 : 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += formatCurrency(context.parsed);
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// 棒グラフを更新（月別収入推移）
function updateBarChart(monthly, livingCost, savings) {
    const ctx = document.getElementById('barChart');
    if (!ctx) return;
    
    // 既存のチャートを破棄
    if (barChartInstance) {
        barChartInstance.destroy();
    }
    
    // 12ヶ月分のデータを生成
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const monthlyData = Array(12).fill(monthly);
    const livingCostData = Array(12).fill(livingCost);
    const savingsData = Array(12).fill(savings < 0 ? 0 : savings);
    
    barChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: '月収（基本）',
                    data: monthlyData,
                    backgroundColor: 'rgba(255, 105, 180, 0.7)',
                    borderColor: 'rgba(255, 105, 180, 1)',
                    borderWidth: 2
                },
                {
                    label: '固定費',
                    data: livingCostData,
                    backgroundColor: 'rgba(253, 126, 20, 0.7)',
                    borderColor: 'rgba(253, 126, 20, 1)',
                    borderWidth: 2
                },
                {
                    label: '貯金可能額',
                    data: savingsData,
                    backgroundColor: 'rgba(25, 135, 84, 0.7)',
                    borderColor: 'rgba(25, 135, 84, 1)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 5,
                    right: 5,
                    top: 5,
                    bottom: 5
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '¥' + value.toLocaleString();
                        },
                        font: {
                            size: window.innerWidth <= 480 ? 9 : 11
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: window.innerWidth <= 480 ? 9 : 11
                        },
                        maxRotation: window.innerWidth <= 480 ? 45 : 0,
                        minRotation: window.innerWidth <= 480 ? 45 : 0
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: window.innerWidth <= 480 ? 11 : 14,
                            family: "'Noto Sans JP', sans-serif"
                        },
                        padding: window.innerWidth <= 480 ? 10 : 15,
                        boxWidth: window.innerWidth <= 480 ? 12 : 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += formatCurrency(context.parsed.y);
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// 貯金額累積グラフを更新
function updateSavingsChart(monthlySavings) {
    const ctx = document.getElementById('savingsChart');
    if (!ctx) return;
    
    // 既存のチャートを破棄
    if (savingsChartInstance) {
        savingsChartInstance.destroy();
    }
    
    // 12ヶ月分の累積貯金額を計算
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const cumulativeSavings = [];
    
    for (let i = 1; i <= 12; i++) {
        cumulativeSavings.push(monthlySavings * i);
    }
    
    savingsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: '累積貯金額',
                    data: cumulativeSavings,
                    backgroundColor: 'rgba(25, 135, 84, 0.2)',
                    borderColor: 'rgba(25, 135, 84, 1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: 'rgba(25, 135, 84, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 5,
                    right: 5,
                    top: 5,
                    bottom: 5
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '¥' + value.toLocaleString();
                        },
                        font: {
                            size: window.innerWidth <= 480 ? 9 : 12
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: window.innerWidth <= 480 ? 9 : 11
                        },
                        maxRotation: window.innerWidth <= 480 ? 45 : 0,
                        minRotation: window.innerWidth <= 480 ? 45 : 0
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: window.innerWidth <= 480 ? 11 : 14,
                            family: "'Noto Sans JP', sans-serif",
                            weight: 'bold'
                        },
                        padding: window.innerWidth <= 480 ? 10 : 15,
                        color: '#198754',
                        boxWidth: window.innerWidth <= 480 ? 12 : 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            const monthNum = context.dataIndex + 1;
                            const total = context.parsed.y;
                            const monthly = monthlySavings;
                            return [
                                `累積貯金: ${formatCurrency(total)}`,
                                `月々の貯金: ${formatCurrency(monthly)}`,
                                `${monthNum}ヶ月目`
                            ];
                        }
                    }
                }
            }
        }
    });
}

// ========================================
// Excelダウンロード機能
// ========================================

// 計算データを取得する関数
function getCalculationData() {
    let data = {
        mode: currentMode
    };

    if (currentMode === 'goal') {
        // 目標金額モードのデータ（カンマ区切りの文字列を数値に変換）
        const goalAmount = parseFormattedNumber(document.getElementById('goalAmount').value);
        const goalMonths = parseFloat(document.getElementById('goalMonths').value) || 1;
        const pricePerSession = parseFormattedNumber(document.getElementById('goalPricePerSession').value);
        const sessionsPerDay = parseFloat(document.getElementById('goalSessionsPerDay').value) || 0;
        const livingCost = parseFormattedNumber(document.getElementById('goalLivingCost').value);
        
        const weeksPerMonth = 4.33;
        const requiredMonthlySavings = goalAmount / goalMonths;
        const requiredMonthlyIncome = requiredMonthlySavings + livingCost;
        const dailyIncome = pricePerSession * sessionsPerDay;
        const requiredDaysPerWeek = requiredMonthlyIncome / (dailyIncome * weeksPerMonth);
        const requiredDaysPerMonth = Math.ceil(requiredDaysPerWeek * weeksPerMonth);
        const projectedYearlyIncome = requiredMonthlyIncome * 12;
        
        data = {
            ...data,
            goalAmount,
            goalMonths,
            pricePerSession,
            sessionsPerDay,
            livingCost,
            requiredMonthlySavings,
            requiredMonthlyIncome,
            dailyIncome,
            requiredDaysPerWeek,
            requiredDaysPerMonth,
            projectedYearlyIncome
        };
    } else {
        const livingCost = parseFormattedNumber(document.getElementById('livingCost').value);
        data.livingCost = livingCost;
    }

    if (currentMode === 'session') {
        const pricePerSession = parseFormattedNumber(document.getElementById('pricePerSession').value);
        const sessionsPerDay = parseFloat(document.getElementById('sessionsPerDay').value) || 0;
        const daysPerWeek = parseFloat(document.getElementById('daysPerWeek').value) || 0;

        const dailyEarnings = pricePerSession * sessionsPerDay;
        const weeklyEarnings = dailyEarnings * daysPerWeek;
        const monthlyBase = weeklyEarnings * 4.33;
        const monthlyTotal = monthlyBase;
        const savingsAmount = monthlyTotal - livingCost;
        const yearlyEarnings = monthlyTotal * 12;
        const monthlyWorkDays = Math.round(daysPerWeek * 4.33);
        const monthlyTotalSessions = Math.round(sessionsPerDay * monthlyWorkDays);

        data = {
            ...data,
            pricePerSession,
            sessionsPerDay,
            daysPerWeek,
            dailyEarnings,
            weeklyEarnings,
            monthlyBase,
            monthlyTotal,
            savingsAmount,
            yearlyEarnings,
            monthlyWorkDays,
            monthlyTotalSessions
        };
    } else {
        const hourlyRate = parseFormattedNumber(document.getElementById('hourlyRate').value);
        const workHours = parseFloat(document.getElementById('workHours').value) || 0;
        const waitingHours = parseFloat(document.getElementById('waitingHours').value) || 0;
        const daysPerWeek = parseFloat(document.getElementById('daysPerWeekHourly').value) || 0;

        const waitingPay = hourlyRate * 0.5 * waitingHours;
        const workPay = hourlyRate * workHours;
        const dailyEarnings = workPay + waitingPay;
        const weeklyEarnings = dailyEarnings * daysPerWeek;
        const monthlyBase = weeklyEarnings * 4.33;
        const monthlyTotal = monthlyBase;
        const savingsAmount = monthlyTotal - livingCost;
        const yearlyEarnings = monthlyTotal * 12;
        const monthlyWorkDays = Math.round(daysPerWeek * 4.33);

        data = {
            ...data,
            hourlyRate,
            workHours,
            waitingHours,
            daysPerWeek,
            dailyEarnings,
            weeklyEarnings,
            monthlyBase,
            monthlyTotal,
            savingsAmount,
            yearlyEarnings,
            monthlyWorkDays
        };
    }

    return data;
}

// Excel出力
function downloadExcel() {
    const data = getCalculationData();
    const today = new Date().toLocaleDateString('ja-JP');

    // ワークブックとシートを作成
    const wb = XLSX.utils.book_new();
    
    // データを配列形式で準備
    let wsData = [
        ['キャスト収益シミュレーション結果'],
        [`作成日: ${today}`],
        [],
        ['【入力条件】'],
        ['項目', '値']
    ];

    // 計算モードに応じて入力条件を追加
    if (data.mode === 'goal') {
        wsData.push(
            ['計算方法', '目標金額逆算'],
            ['目標金額', `¥${data.goalAmount.toLocaleString()}`],
            ['達成期間', `${data.goalMonths}ヶ月`],
            ['1本あたりの単価', `¥${data.pricePerSession.toLocaleString()}`],
            ['1日の本数', `${data.sessionsPerDay}本`],
            ['月の固定費', `¥${data.livingCost.toLocaleString()}`],
            [],
            ['【目標達成プラン】'],
            ['項目', '値'],
            ['毎月の必要貯金額', `¥${Math.round(data.requiredMonthlySavings).toLocaleString()}`],
            ['必要な月収（手取り）', `¥${Math.round(data.requiredMonthlyIncome).toLocaleString()}`],
            ['必要な週の勤務日数', `${data.requiredDaysPerWeek.toFixed(1)}日`],
            ['必要な月の勤務日数', `約${data.requiredDaysPerMonth}日`],
            ['必要な日給', `¥${Math.round(data.dailyIncome).toLocaleString()}`],
            ['予想年収', `¥${Math.round(data.projectedYearlyIncome).toLocaleString()}`],
            [],
            ['※この計算結果はあくまで概算です。']
        );
    } else if (data.mode === 'session') {
        wsData.push(
            ['計算方法', '本数ベース'],
            ['1本あたりの単価', `¥${data.pricePerSession.toLocaleString()}`],
            ['1日の本数', `${data.sessionsPerDay}本`],
            ['週の勤務日数', `${data.daysPerWeek}日`]
        );
    } else {
        wsData.push(
            ['計算方法', '時給ベース'],
            ['時給', `¥${data.hourlyRate.toLocaleString()}`],
            ['勤務時間', `${data.workHours}時間`],
            ['待機時間', `${data.waitingHours}時間`],
            ['週の勤務日数', `${data.daysPerWeek}日`]
        );
    }

    wsData.push(
        ['月の固定費', `¥${data.livingCost.toLocaleString()}`],
        [],
        ['【収益計算結果】'],
        ['項目', '金額'],
        ['日給', `¥${Math.round(data.dailyEarnings).toLocaleString()}`],
        ['週給', `¥${Math.round(data.weeklyEarnings).toLocaleString()}`],
        ['月給（基本）', `¥${Math.round(data.monthlyBase).toLocaleString()}`],
        ['月収（手取り）', `¥${Math.round(data.monthlyTotal).toLocaleString()}`],
        ['年収見込み', `¥${Math.round(data.yearlyEarnings).toLocaleString()}`],
        [],
        ['【貯金・生活費】'],
        ['項目', '金額'],
        ['月の固定費', `¥${data.livingCost.toLocaleString()}`],
        ['貯金可能額（月）', `¥${Math.round(data.savingsAmount).toLocaleString()}`],
        ['貯金可能額（年）', `¥${Math.round(data.savingsAmount * 12).toLocaleString()}`],
        [],
        ['【詳細内訳】'],
        ['項目', '値'],
        ['月の勤務日数（概算）', `約${data.monthlyWorkDays}日`]
    );

    if (data.mode === 'session' && data.monthlyTotalSessions) {
        wsData.push(['月の総本数（概算）', `約${data.monthlyTotalSessions}本`]);
    }

    wsData.push(
        [],
        ['※この計算結果はあくまで概算です。']
    );

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // 列幅を設定
    ws['!cols'] = [
        { wch: 25 },
        { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, '収益シミュレーション');
    XLSX.writeFile(wb, 'キャスト収益シミュレーション.xlsx');
}

// ========================================
// 目標金額逆算機能
// ========================================

/**
 * 目標金額から必要な勤務条件を逆算する
 */
function calculateGoal() {
    // 入力値を取得（カンマ区切りの文字列を数値に変換）
    const goalAmount = parseFormattedNumber(document.getElementById('goalAmount').value);
    const goalMonths = parseFloat(document.getElementById('goalMonths').value) || 1;
    const pricePerSession = parseFormattedNumber(document.getElementById('goalPricePerSession').value);
    const sessionsPerDay = parseFloat(document.getElementById('goalSessionsPerDay').value) || 0;
    const livingCost = parseFormattedNumber(document.getElementById('goalLivingCost').value);
    
    const weeksPerMonth = 4.33;
    
    // 毎月必要な貯金額を計算
    const requiredMonthlySavings = goalAmount / goalMonths;
    
    // 必要な月収（手取り）= 毎月の貯金額 + 固定費
    const requiredMonthlyIncome = requiredMonthlySavings + livingCost;
    
    // 日給を計算（本数ベース）
    const dailyIncome = pricePerSession * sessionsPerDay;
    
    // 必要な週の勤務日数を計算
    const requiredDaysPerWeek = requiredMonthlyIncome / (dailyIncome * weeksPerMonth);
    
    // 必要な月の勤務日数
    const requiredDaysPerMonth = Math.ceil(requiredDaysPerWeek * weeksPerMonth);
    
    // 予想年収
    const projectedYearlyIncome = requiredMonthlyIncome * 12;
    
    // 結果を表示
    document.getElementById('displayGoalAmount').textContent = formatCurrency(goalAmount);
    document.getElementById('displayGoalMonths').textContent = goalMonths + 'ヶ月';
    document.getElementById('requiredMonthlySavings').textContent = formatCurrency(requiredMonthlySavings);
    document.getElementById('requiredMonthlyIncome').textContent = formatCurrency(requiredMonthlyIncome);
    document.getElementById('requiredDaysPerWeek').textContent = requiredDaysPerWeek.toFixed(1) + '日';
    document.getElementById('requiredDaysPerMonth').textContent = '約' + requiredDaysPerMonth + '日';
    document.getElementById('requiredDailyIncome').textContent = formatCurrency(dailyIncome);
    document.getElementById('projectedYearlyIncome').textContent = formatCurrency(projectedYearlyIncome);
    
    // 達成イメージを更新
    document.getElementById('currentCondition').textContent = 
        `1本 ${formatCurrency(pricePerSession)} × ${sessionsPerDay}本/日`;
    document.getElementById('month1').textContent = 
        '貯金 ' + formatCurrency(requiredMonthlySavings * 1);
    document.getElementById('month3').textContent = 
        '貯金 ' + formatCurrency(requiredMonthlySavings * 3);
    document.getElementById('month6').textContent = 
        '貯金 ' + formatCurrency(requiredMonthlySavings * 6);
    document.getElementById('goalAchieved').textContent = 
        '貯金 ' + formatCurrency(goalAmount);
    
    // 目標達成グラフを描画
    drawGoalChart(requiredMonthlySavings, goalMonths, goalAmount);
}

/**
 * 目標達成グラフを描画
 */
function drawGoalChart(monthlySavings, months, goalAmount) {
    const ctx = document.getElementById('goalChart');
    if (!ctx) return;
    
    // 既存のグラフがあれば破棄
    if (window.goalChartInstance) {
        window.goalChartInstance.destroy();
    }
    
    // 累積データを作成
    const labels = [];
    const cumulativeData = [];
    
    for (let i = 1; i <= months; i++) {
        labels.push(i + 'ヶ月目');
        cumulativeData.push(monthlySavings * i);
    }
    
    // グラフを作成
    window.goalChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '累積貯金額',
                data: cumulativeData,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: 'rgba(255, 99, 132, 1)'
            }, {
                label: '目標金額',
                data: Array(months).fill(goalAmount),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                borderWidth: 2,
                borderDash: [10, 5],
                fill: false,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 2.5,  // グラフの縦横比を調整（横長にする）
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 12,
                            family: "'Noto Sans JP', sans-serif"
                        },
                        padding: 10,
                        usePointStyle: true,
                        boxWidth: 12
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 13
                    },
                    bodyFont: {
                        size: 12
                    },
                    callbacks: {
                        label: function(context) {
                            const datasetLabel = context.dataset.label;
                            const value = context.parsed.y;
                            // 100万円以上の場合は万円も併記
                            if (value >= 1000000) {
                                const manYen = Math.round(value / 10000);
                                return `${datasetLabel}: ${formatCurrency(value)} (${manYen.toLocaleString('ja-JP')}万円)`;
                            }
                            return `${datasetLabel}: ${formatCurrency(value)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            // 100万円以上の場合は「万円」単位で表示
                            if (value >= 1000000) {
                                return '¥' + Math.round(value / 10000).toLocaleString('ja-JP') + '万';
                            }
                            return formatCurrency(value);
                        },
                        font: {
                            size: 10
                        },
                        maxTicksLimit: 6  // Y軸の目盛りを最大6個に制限
                    },
                    grid: {
                        color: 'rgba(200, 200, 200, 0.2)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 10
                        },
                        maxRotation: 45,  // ラベルを45度回転
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}
