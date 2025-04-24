// script.js

// 將問題號碼映射到其所屬的維度
const dimensionMap = {
    q1: 'EI', q5: 'EI', q9: 'EI',
    q2: 'SN', q6: 'SN', q10: 'SN',
    q3: 'TF', q7: 'TF', q11: 'TF',
    q4: 'JP', q8: 'JP', q12: 'JP'
};

// 映射 Adaptive 傾向點 (簡化規則：基於特定選項)
// Q5 A, Q7 B, Q10 B 各記為 1 個 Adaptive 點
const adaptivePointsMap = {
    q5: 'A',
    q7: 'B',
    q10: 'B'
};

// Adaptive 傾向的閾值 (例如： >= 2 個 Adaptive 點則為 Adaptive)
const adaptiveThreshold = 2;

// 保存答案並導航到下一頁
function saveAnswerAndNavigate(questionNum, answer) {
    let answers = sessionStorage.getItem('quizAnswers');
    if (answers) {
        answers = JSON.parse(answers);
    } else {
        answers = {};
    }

    answers['q' + questionNum] = answer;
    sessionStorage.setItem('quizAnswers', JSON.stringify(answers));

    if (questionNum < 12) {
        window.location.href = 'q' + (questionNum + 1) + '.html';
    } else {
        // 這是最後一題，導航到計分頁
        window.location.href = 'scoring.html';
    }
}

// 在計分頁調用此函數來計算結果並重定向
function scoreQuiz() {
    const answers = sessionStorage.getItem('quizAnswers');
    if (!answers) {
        // 如果沒有答案，可能從中間頁面進入，導回首頁或提示錯誤
        alert('未能載入測試結果，請重新開始。');
        window.location.href = 'index.html';
        return;
    }

    const userAnswers = JSON.parse(answers);
    console.log("User Answers:", userAnswers); // 調試用

    // 1. 計算 MBTI 四個維度得分
    const scores = { EI: { A: 0, B: 0 }, SN: { A: 0, B: 0 }, TF: { A: 0, B: 0 }, JP: { A: 0, B: 0 } };
    let adaptivePoints = 0;

    for (const qNum in userAnswers) {
        const answer = userAnswers[qNum];
        const dimension = dimensionMap[qNum];
        if (dimension) {
            scores[dimension][answer]++;

            // 檢查是否獲得 Adaptive 點 (使用簡化規則)
            const qIndex = parseInt(qNum.substring(1)); // 提取問題號碼數字
            if (adaptivePointsMap['q' + qIndex] === answer) {
                 // 檢查這個問題是否在 Adaptive 記分問題列表中 (Q5, Q7, Q10)
                 if (qIndex === 5 || qIndex === 7 || qIndex === 10) {
                     adaptivePoints++;
                 }
            }
             // 根據原規則提示，Q12 兩個選項都可能指向 Adaptive，這裡我們為了簡化，
             // 並且確保 Adaptive 點數來源較廣，可以考慮 Q12 的某個選項也計入，
             // 但更符合簡化原則的是只選取明確傾向的選項。
             // 維持只計 Q5:A, Q7:B, Q10:B 三個 Adaptive 點。
        }
    }

    console.log("Dimension Scores:", scores); // 調試用
    console.log("Adaptive Points:", adaptivePoints); // 調試用


    // 2. 判斷 MBTI 四個維度傾向
    let mbtiType = '';
    mbtiType += (scores.EI.A > scores.EI.B) ? 'E' : 'I';
    mbtiType += (scores.SN.A > scores.SN.B) ? 'S' : 'N';
    mbtiType += (scores.TF.A > scores.TF.B) ? 'T' : 'F';
    mbtiType += (scores.JP.A > scores.JP.B) ? 'J' : 'P';

    // 如果分數相同，簡單處理：EI -> I, SN -> N, TF -> T, JP -> P (這是一種處理平手的方式，實際可更複雜)
     if (scores.EI.A === scores.EI.B) mbtiType = mbtiType[0].replace('E', 'I') + mbtiType.substring(1);
     if (scores.SN.A === scores.SN.B) mbtiType = mbtiType.substring(0,1) + mbtiType[1].replace('S', 'N') + mbtiType.substring(2);
     if (scores.TF.A === scores.TF.B) mbtiType = mbtiType.substring(0,2) + mbtiType[2].replace('F', 'T') + mbtiType.substring(3);
     if (scores.JP.A === scores.JP.B) mbtiType = mbtiType.substring(0,3) + mbtiType[3].replace('P', 'J');


    console.log("Calculated MBTI:", mbtiType); // 調試用

    // 3. 判斷核心穩定性傾向
    const stability = (adaptivePoints >= adaptiveThreshold) ? 'Adaptive' : 'Robust';
    console.log("Calculated Stability:", stability); // 調試用

    // 4. 確定最終機器人型號並重定向到結果頁
    let resultPage = '';
    const splitTypes = ['INFJ', 'ESTP', 'INTJ', 'ESFJ']; // 需要根據 Stability 細分的類型

    if (splitTypes.includes(mbtiType)) {
        resultPage = `result_${mbtiType}_${stability}.html`;
    } else {
        resultPage = `result_${mbtiType}.html`; // 其他類型只用 MBTI 命名結果頁
    }

    console.log("Redirecting to:", resultPage); // 調試用

    // 清除 sessionStorage 中的答案，以便重新測試
    sessionStorage.removeItem('quizAnswers');

    // 重定向到結果頁
    window.location.href = resultPage;
}

// 在頁面載入時根據需要調用 scoreQuiz
// 注意：scoreQuiz 應只在 scoring.html 頁面載入時運行一次
// 其他頁面只需要 saveAnswerAndNavigate 函數，可以通過在各自頁面調用它來觸發流程。

// 初始化 session storage (可選，確保第一次測試時是空的)
// 可以在 index.html 加載時執行一次，或在開始按鈕點擊時清除舊答案
function startQuiz() {
    sessionStorage.removeItem('quizAnswers'); // 清除之前的答案
    window.location.href = 'q1.html'; // 跳轉到第一題
}
