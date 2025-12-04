/**
 * キャスト収益シミュレーター
 * メインJavaScriptファイル
 */

// 現在の計算モード
let currentMode = 'session'; // 'session' or 'hourly'

// Chart.jsのインスタンス
let pieChartInstance = null;
let barChartInstance = null;

// 数値をカンマ区切りの通貨形式に変換
function formatCurrency(amount) {
    return '¥' + Math.round(amount).toLocaleString('ja-JP');
}

// 計算モードを切り替える
function switchCalculationMode(mode) {
    currentMode = mode;
    
    // タブのactive状態を切り替え
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.closest('.tab-btn').classList.add('active');
    
    // フォームの表示を切り替え
    if (mode === 'session') {
        document.getElementById('sessionForm').style.display = 'block';
        document.getElementById('hourlyForm').style.display = 'none';
    } else {
        document.getElementById('sessionForm').style.display = 'none';
        document.getElementById('hourlyForm').style.display = 'block';
    }
    
    // 再計算
    calculateEarnings();
}

// 収益を計算する関数
function calculateEarnings() {
    const livingCost = parseFloat(document.getElementById('livingCost').value) || 0;
    let dailyEarnings, weeklyEarnings, monthlyBase, daysPerWeek, monthlyWorkDays;
    let monthlyTotalSessions = 0;
    let pricePerSession = 0;
    let sessionsPerDay = 0;
    
    const weeksPerMonth = 4.33;

    if (currentMode === 'session') {
        // 本数ベース計算
        pricePerSession = parseFloat(document.getElementById('pricePerSession').value) || 0;
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
        const hourlyRate = parseFloat(document.getElementById('hourlyRate').value) || 0;
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

    // 結果を画面に表示
    document.getElementById('dailyEarnings').textContent = formatCurrency(dailyEarnings);
    document.getElementById('weeklyEarnings').textContent = formatCurrency(weeklyEarnings);
    document.getElementById('monthlyBase').textContent = formatCurrency(monthlyBase);
    document.getElementById('monthlyTotal').textContent = formatCurrency(monthlyTotal);
    document.getElementById('yearlyEarnings').textContent = formatCurrency(yearlyEarnings);
    document.getElementById('livingCostDisplay').textContent = formatCurrency(livingCost);
    document.getElementById('savingsDisplay').textContent = formatCurrency(savingsAmount);

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
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 14,
                            family: "'Noto Sans JP', sans-serif"
                        },
                        padding: 15
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
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '¥' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 14,
                            family: "'Noto Sans JP', sans-serif"
                        },
                        padding: 15
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

// ========================================
// ダウンロード機能
// ========================================

// 計算データを取得する関数
function getCalculationData() {
    const livingCost = parseFloat(document.getElementById('livingCost').value) || 0;
    let data = {
        mode: currentMode,
        livingCost: livingCost
    };

    if (currentMode === 'session') {
        const pricePerSession = parseFloat(document.getElementById('pricePerSession').value) || 0;
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
        const hourlyRate = parseFloat(document.getElementById('hourlyRate').value) || 0;
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

// PDF出力
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const data = getCalculationData();
    const today = new Date().toLocaleDateString('ja-JP');

    // タイトル
    doc.setFontSize(20);
    doc.text('キャスト収益シミュレーション結果', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`作成日: ${today}`, 20, 30);

    // 入力条件
    doc.setFontSize(14);
    doc.text('【入力条件】', 20, 45);
    doc.setFontSize(11);
    
    if (data.mode === 'session') {
        doc.text(`計算方法: 本数ベース`, 25, 55);
        doc.text(`1本あたりの単価: ¥${data.pricePerSession.toLocaleString()}`, 25, 62);
        doc.text(`1日の本数: ${data.sessionsPerDay}本`, 25, 69);
        doc.text(`週の勤務日数: ${data.daysPerWeek}日`, 25, 76);
    } else {
        doc.text(`計算方法: 時給ベース`, 25, 55);
        doc.text(`時給: ¥${data.hourlyRate.toLocaleString()}`, 25, 62);
        doc.text(`勤務時間: ${data.workHours}時間`, 25, 69);
        doc.text(`待機時間: ${data.waitingHours}時間`, 25, 76);
        doc.text(`週の勤務日数: ${data.daysPerWeek}日`, 25, 83);
    }
    doc.text(`月の固定費: ¥${data.livingCost.toLocaleString()}`, 25, data.mode === 'session' ? 83 : 90);

    // 計算結果
    doc.setFontSize(14);
    doc.text('【収益計算結果】', 20, data.mode === 'session' ? 100 : 107);
    doc.setFontSize(11);
    const resultY = data.mode === 'session' ? 110 : 117;
    doc.text(`日給: ¥${Math.round(data.dailyEarnings).toLocaleString()}`, 25, resultY);
    doc.text(`週給: ¥${Math.round(data.weeklyEarnings).toLocaleString()}`, 25, resultY + 7);
    doc.text(`月給（基本）: ¥${Math.round(data.monthlyBase).toLocaleString()}`, 25, resultY + 14);
    doc.text(`月収（手取り）: ¥${Math.round(data.monthlyTotal).toLocaleString()}`, 25, resultY + 21);
    doc.text(`年収見込み: ¥${Math.round(data.yearlyEarnings).toLocaleString()}`, 25, resultY + 28);

    // 貯金
    doc.setFontSize(14);
    doc.text('【貯金・生活費】', 20, resultY + 45);
    doc.setFontSize(11);
    doc.text(`月の固定費: ¥${data.livingCost.toLocaleString()}`, 25, resultY + 55);
    doc.text(`貯金可能額（月）: ¥${Math.round(data.savingsAmount).toLocaleString()}`, 25, resultY + 62);
    doc.text(`貯金可能額（年）: ¥${Math.round(data.savingsAmount * 12).toLocaleString()}`, 25, resultY + 69);

    // 詳細内訳
    doc.setFontSize(14);
    doc.text('【詳細内訳】', 20, resultY + 86);
    doc.setFontSize(11);
    doc.text(`月の勤務日数（概算）: 約${data.monthlyWorkDays}日`, 25, resultY + 96);
    if (data.mode === 'session' && data.monthlyTotalSessions) {
        doc.text(`月の総本数（概算）: 約${data.monthlyTotalSessions}本`, 25, resultY + 103);
    }

    // フッター
    doc.setFontSize(9);
    doc.text('※この計算結果はあくまで概算です。実際の収入は状況により異なる場合があります。', 20, 280);

    doc.save('キャスト収益シミュレーション.pdf');
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
    if (data.mode === 'session') {
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

// Word出力（HTMLベースで簡易的に実装）
function downloadWord() {
    const data = getCalculationData();
    const today = new Date().toLocaleDateString('ja-JP');

    // 入力条件のテーブル行を生成
    let inputRows = '';
    if (data.mode === 'session') {
        inputRows = `
            <tr><td>計算方法</td><td>本数ベース</td></tr>
            <tr><td>1本あたりの単価</td><td>¥${data.pricePerSession.toLocaleString()}</td></tr>
            <tr><td>1日の本数</td><td>${data.sessionsPerDay}本</td></tr>
            <tr><td>週の勤務日数</td><td>${data.daysPerWeek}日</td></tr>
        `;
    } else {
        inputRows = `
            <tr><td>計算方法</td><td>時給ベース</td></tr>
            <tr><td>時給</td><td>¥${data.hourlyRate.toLocaleString()}</td></tr>
            <tr><td>勤務時間</td><td>${data.workHours}時間</td></tr>
            <tr><td>待機時間</td><td>${data.waitingHours}時間</td></tr>
            <tr><td>週の勤務日数</td><td>${data.daysPerWeek}日</td></tr>
        `;
    }

    // 詳細内訳の行を生成
    let detailRows = `<tr><td>月の勤務日数（概算）</td><td>約${data.monthlyWorkDays}日</td></tr>`;
    if (data.mode === 'session' && data.monthlyTotalSessions) {
        detailRows += `<tr><td>月の総本数（概算）</td><td>約${data.monthlyTotalSessions}本</td></tr>`;
    }

    // HTMLコンテンツを作成
    let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Meiryo', sans-serif; padding: 40px; }
                h1 { color: #e91e63; border-bottom: 3px solid #e91e63; padding-bottom: 10px; }
                h2 { color: #9c27b0; margin-top: 30px; border-left: 5px solid #9c27b0; padding-left: 10px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #ff69b4; color: white; }
                .highlight { background-color: #fff5f8; font-weight: bold; }
                .date { color: #666; font-size: 0.9em; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }
            </style>
        </head>
        <body>
            <h1>キャスト収益シミュレーション結果</h1>
            <p class="date">作成日: ${today}</p>

            <h2>入力条件</h2>
            <table>https://github.com/Rispondere/simulator-New/blob/main/js/main.js
                <tr><th>項目</th><th>値</th></tr>
                ${inputRows}
                <tr><td>月の固定費</td><td>¥${data.livingCost.toLocaleString()}</td></tr>
            </table>

            <h2>収益計算結果</h2>
            <table>
                <tr><th>項目</th><th>金額</th></tr>
                <tr><td>日給</td><td>¥${Math.round(data.dailyEarnings).toLocaleString()}</td></tr>
                <tr><td>週給</td><td>¥${Math.round(data.weeklyEarnings).toLocaleString()}</td></tr>
                <tr><td>月給（基本）</td><td>¥${Math.round(data.monthlyBase).toLocaleString()}</td></tr>
                <tr class="highlight"><td>月収（手取り）</td><td>¥${Math.round(data.monthlyTotal).toLocaleString()}</td></tr>
                <tr class="highlight"><td>年収見込み</td><td>¥${Math.round(data.yearlyEarnings).toLocaleString()}</td></tr>
            </table>

            <h2>貯金・生活費</h2>
            <table>
                <tr><th>項目</th><th>金額</th></tr>
                <tr><td>月の固定費</td><td>¥${data.livingCost.toLocaleString()}</td></tr>
                <tr class="highlight"><td>貯金可能額（月）</td><td>¥${Math.round(data.savingsAmount).toLocaleString()}</td></tr>
                <tr class="highlight"><td>貯金可能額（年）</td><td>¥${Math.round(data.savingsAmount * 12).toLocaleString()}</td></tr>
            </table>

            <h2>詳細内訳</h2>
            <table>
                <tr><th>項目</th><th>値</th></tr>
                ${detailRows}
            </table>

            <div class="footer">
                <p>※この計算結果はあくまで概算です。実際の収入は勤務状況や店舗の規定により異なる場合があります。</p>
            </div>
        </body>
        </html>
    `;

    // BlobとしてHTML形式で保存（Wordで開ける）
    const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'キャスト収益シミュレーション.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
