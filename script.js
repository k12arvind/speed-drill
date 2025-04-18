// script.js
document.addEventListener('DOMContentLoaded', () => {
    // —— Screen containers
    const settingsScreen     = document.getElementById('settings-screen');
    const gameScreen         = document.getElementById('game-screen');
    const resultScreen       = document.getElementById('result-screen');
    const reviewScreen       = document.getElementById('review-screen');
    const historyScreen      = document.getElementById('history-screen');
    const leaderboardScreen  = document.getElementById('leaderboard-screen');
    const achievementsScreen = document.getElementById('achievements-screen');
  
    // —— Buttons & displays
    const startBtn            = document.getElementById('start-btn');
    const viewHistoryBtn      = document.getElementById('view-history-btn');
    const viewHistory2Btn     = document.getElementById('view-history-2-btn');
    const viewLeaderboardBtn  = document.getElementById('view-leaderboard-btn');
    const viewLeaderboard2Btn = document.getElementById('view-leaderboard-2-btn');
    const viewAchievementsBtn = document.getElementById('view-achievements-btn');
    const viewAchievements2Btn= document.getElementById('view-achievements-2-btn');
    const playAgainBtn        = document.getElementById('play-again-btn');
    const reviewBtn           = document.getElementById('review-btn');
    const backToResultsBtn    = document.getElementById('back-to-results-btn');
    const backBtn             = document.getElementById('back-btn');
    const backToSettingsBtn   = document.getElementById('back-to-settings-btn');
    const backToSettingsBtn2  = document.getElementById('back-to-settings-btn-2');
    const resetAchievementsBtn= document.getElementById('reset-achievements-btn');
    const timerEl             = document.getElementById('timer');
    const scoreEl             = document.getElementById('score');
    const problemEl           = document.getElementById('problem');
    const answerInput         = document.getElementById('answer-input');
    const finalScoreEl        = document.getElementById('final-score');
    const slowList            = document.getElementById('slow-list');
    const historyBody         = document.querySelector('#history-table tbody');
    const leaderboardContainer= document.getElementById('leaderboard-container');
    const achievementsList    = document.getElementById('achievements-list');
    const nameError           = document.getElementById('name-error');
    const toastContainer      = document.getElementById('toast-container');
  
    // —— Settings inputs
    const playerNameInput = document.getElementById('player-name');
    const enableMul       = document.getElementById('enable-mul');
    const mul1Min         = document.getElementById('mul1-min');
    const mul1Max         = document.getElementById('mul1-max');
    const mul2Min         = document.getElementById('mul2-min');
    const mul2Max         = document.getElementById('mul2-max');
    const enableDiv       = document.getElementById('enable-div');
    const divDMin         = document.getElementById('div-d-min');
    const divDMax         = document.getElementById('div-d-max');
    const divQMin         = document.getElementById('div-q-min');
    const divQMax         = document.getElementById('div-q-max');
    const enablePct       = document.getElementById('enable-pct');
    const enableSolve     = document.getElementById('enable-solve');
    const durationEl      = document.getElementById('duration');
  
    // —— Fixed fractions
    const FRACS = [
      [1,3],[2,3],[1,4],[3,4],[1,5],[2,5],[3,5],[4,5],[6,5],
      [1,6],[5,6],[1,7],[2,7],[3,7],[4,7],[5,7],[6,7],
      [1,8],[3,8],[5,8],[7,8],
      [1,9],[2,9],[4,9],[5,9],[7,9],[8,9],
      [1,11],[2,11],[3,11],[4,11],[5,11],[6,11],[7,11],[8,11],[9,11],[10,11],
      [1,12],[5,12],[7,12],[11,12],
      [1,15],[1,20],[1,25],[3,25],[7,25]
    ];
  
    let timerID, remaining, score, genProblem, currentPlayer;
    let questionLog = [], currentStartTime, sessionCounted = false;
  
    // —— Disable Start until name entered
    startBtn.classList.add('btn-disabled');
    playerNameInput.addEventListener('input', () => {
      if (playerNameInput.value.trim()) {
        startBtn.classList.remove('btn-disabled');
        nameError.textContent = '';
      } else {
        startBtn.classList.add('btn-disabled');
      }
    });
  
    // —— Toast helper
    function showToast(message, duration = 10000) {
      toastContainer.classList.remove('hidden');
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = message;
      toastContainer.appendChild(toast);
      setTimeout(() => {
        toast.remove();
        if (!toastContainer.children.length) {
          toastContainer.classList.add('hidden');
        }
      }, duration);
    }
  
    // —— Daily streak helpers
    function loadDailyData() {
      return JSON.parse(localStorage.getItem('speedDrillDaily') || '{}');
    }
    function saveDailyData(d) {
      localStorage.setItem('speedDrillDaily', JSON.stringify(d));
    }
    function recordTodayRound() {
      const today = new Date().toISOString().slice(0,10);
      const d = loadDailyData();
      d[today] = (d[today]||0) + 1;
      saveDailyData(d);
    }
    function computeStreak() {
      const d = loadDailyData(), oneDay = 86400000;
      let streak = 0, date = new Date();
      while (d[date.toISOString().slice(0,10)] > 0) {
        streak++;
        date = new Date(date - oneDay);
      }
      return streak;
    }
    function updateStatsDisplay() {
      const today = new Date().toISOString().slice(0,10), d = loadDailyData();
      document.getElementById('rounds-today').textContent    = d[today] || 0;
      document.getElementById('current-streak').textContent = computeStreak();
    }
  
    // —— Achievement definitions
    // —— Achievement definitions (Score ≥10…500)
    // —— Achievement definitions (Score ≥10…500)
const ACH_THRESHOLDS = Array.from({length:50}, (_,i) => (i+1)*10);
const ACHIEVEMENTS = ACH_THRESHOLDS.map(th => ({
  id:    `score_${th}`,
  name:  `Score ≥ ${th}`,
  // you may have omitted icon here since score ones use medals
  check: session => session.score >= th
}));

// ← Insert the new badge here:
ACHIEVEMENTS.push({
  id:   'master_of_chaos',
  name: 'Master of Chaos',
  icon: '💥',
  check: session => {
    const unlocked = loadUnlocked();
    // count only the score_### badges
    const count = unlocked.filter(id => id.startsWith('score_')).length;
    return count === ACH_THRESHOLDS.length;  // all 50
  }
});


    function loadUnlocked() { return JSON.parse(localStorage.getItem('speedDrillAch')||'[]'); }
    function saveUnlocked(a) { localStorage.setItem('speedDrillAch', JSON.stringify(a)); }
    function updateAchievements(session) {
      const unlocked = loadUnlocked(), newly = [];
      ACHIEVEMENTS.forEach(a => {
        if (!unlocked.includes(a.id) && a.check(session)) {
          unlocked.push(a.id);
          newly.push(a);
        }
      });
      saveUnlocked(unlocked);
      newly.forEach(a => {
        const th   = +a.id.split('_')[1];
        const icon = th >= 400 ? '🥇' : th >= 200 ? '🥈' : '🥉';
        showToast(`${icon} Unlocked: ${a.name}`);
      });
    }
    function showAchievements() {
        const unlocked = loadUnlocked();
      
        achievementsList.innerHTML = ACHIEVEMENTS.map(a => {
          const isLocked = !unlocked.includes(a.id);
          // use custom icon (💥) or fallback to lock/medal logic
          const icon = isLocked
            ? '🔒'
            : (a.icon 
                ? a.icon 
                : (+a.id.split('_')[1] >= 400 ? '🥇'
                   : +a.id.split('_')[1] >= 200 ? '🥈'
                   : '🥉'));
      
          return `
            <li class="${isLocked ? 'locked' : 'unlocked'}">
              <span class="icon">${icon}</span>
              ${a.name}
            </li>
          `;
        }).join('');
      
        showScreen(achievementsScreen);
      }      
  
    // —— Screen helper
    function showScreen(screen) {
      [settingsScreen,gameScreen,resultScreen,reviewScreen,historyScreen,leaderboardScreen,achievementsScreen]
        .forEach(s => s.classList.add('hidden'));
      screen.classList.remove('hidden');
      if (screen === settingsScreen) updateStatsDisplay();
    }
  
    // —— Utilities
    function fmtTime(sec) {
      const m = String(Math.floor(sec/60)).padStart(2,'0');
      const s = String(sec % 60).padStart(2,'0');
      return `${m}:${s}`;
    }
    function randInt(min,max) {
      return Math.floor(Math.random()*(max-min+1)) + min;
    }
  
    // —— Problem generators
    function genMul() {
      const a = randInt(+mul1Min.value, +mul1Max.value);
      const b = randInt(+mul2Min.value, +mul2Max.value);
      return { text: `${a} × ${b} =`, answer: a*b };
    }
    function genDiv() {
      const dvdMin = +divDMin.value, dvdMax = +divDMax.value;
      const dMin   = +divQMin.value, dMax   = +divQMax.value;
      const d      = randInt(dMin, dMax);
      const minQ   = Math.ceil(dvdMin/d), maxQ = Math.floor(dvdMax/d);
      let q, dividend;
      if (maxQ >= minQ) {
        q = randInt(minQ, maxQ);
        dividend = d*q;
      } else {
        let tries = 0;
        do {
          dividend = randInt(dvdMin, dvdMax);
          tries++;
        } while (dividend % d !== 0 && tries < 1000);
        q = (dividend % d === 0) ? dividend/d : minQ;
        dividend = d*q;
      }
      return { text: `${dividend} ÷ ${d} =`, answer: q };
    }
    function genPct() {
      const [n,d] = FRACS[randInt(0,FRACS.length-1)];
      const pct   = ((n/d*100).toFixed(2)).replace(/\.00$/,'') + '%';
      let N;
      do { N = randInt(10,100); } while (N % d !== 0);
      return { text: `${pct} of ${N} =`, answer: (N*n)/d };
    }
    function genSolve() {
      const [n,d] = FRACS[randInt(0,FRACS.length-1)];
      let X,R;
      do { X = randInt(1,50); R = (X*n)/d; } while (!Number.isInteger(R));
      return { text: `${n}/${d} of x is ${R}. Find x:`, answer: X };
    }
  
    // —— Next problem
    function nextProblem() {
      const { text, answer } = genProblem();
      problemEl.textContent      = text;
      answerInput.value          = '';
      answerInput.dataset.answer = answer;
      currentStartTime           = remaining;
    }
  
    // —— Start game
    function startGame() {
      const name = playerNameInput.value.trim();
      if (!name) {
        nameError.textContent = 'Please enter your name';
        playerNameInput.focus();
        return;
      }
      nameError.textContent = '';
      currentPlayer = name;
      remaining     = +durationEl.value;
      score         = 0;
      questionLog   = [];
      sessionCounted= false;
  
      scoreEl.textContent = `Score: ${score}`;
      timerEl.textContent = `Time: ${fmtTime(remaining)}`;
  
      const types = [];
      if (enableMul.checked)   types.push(genMul);
      if (enableDiv.checked)   types.push(genDiv);
      if (enablePct.checked)   types.push(genPct);
      if (enableSolve.checked) types.push(genSolve);
      genProblem = () => types[randInt(0, types.length-1)]();
  
      showScreen(gameScreen);
      answerInput.focus();
      nextProblem();
  
      timerID = setInterval(() => {
        remaining--;
        timerEl.textContent = `Time: ${fmtTime(remaining)}`;
        if (remaining <= 0) {
          clearInterval(timerID);
          endGame();
        }
      }, 1000);
    }
  
    // —— Answer checking
    answerInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const userVal    = parseFloat(answerInput.value);
        const correctVal = parseFloat(answerInput.dataset.answer);
        if (userVal === correctVal) {
          questionLog.push({ text: problemEl.textContent, time: currentStartTime - remaining });
          score++;
          scoreEl.textContent = `Score: ${score}`;
          nextProblem();
        } else {
          answerInput.classList.add('wrong');
          setTimeout(() => answerInput.classList.remove('wrong'), 200);
        }
      }
    });
  
    // —— End game
    function endGame() {
      finalScoreEl.textContent = `You got ${score} right.`;
      saveHistory();
      if (!sessionCounted) {
        recordTodayRound();
        sessionCounted = true;
      }
      updateStatsDisplay();
      updateAchievements({ score });
      showScreen(resultScreen);
    }
  
    // —— Save history
    function saveHistory() {
      const hist = JSON.parse(localStorage.getItem('speedDrillHistory') || '[]');
      hist.unshift({
        name:     currentPlayer,
        when:     new Date().toLocaleString(),
        duration: +durationEl.value,
        score:    score,
        slowest:  questionLog.slice().sort((a,b)=>b.time-a.time).slice(0,10)
      });
      localStorage.setItem('speedDrillHistory', JSON.stringify(hist));
    }
  
    // —— Delete helper
    function deleteHistoryEntry(idx) {
      const hist = JSON.parse(localStorage.getItem('speedDrillHistory') || '[]');
      if (idx >= 0 && idx < hist.length) {
        hist.splice(idx, 1);
        localStorage.setItem('speedDrillHistory', JSON.stringify(hist));
      }
    }
  
    // —— Review slowest
    function showReview() {
      slowList.innerHTML = '';
      questionLog
        .slice()
        .sort((a,b)=>b.time-a.time)
        .slice(0,10)
        .forEach(q => {
          const li = document.createElement('li');
          li.textContent = `${q.text} (${q.time}s)`;
          slowList.appendChild(li);
        });
      showScreen(reviewScreen);
    }
  
    // —— Show history with delete buttons
    function showHistory() {
      historyBody.innerHTML = '';
      const hist = JSON.parse(localStorage.getItem('speedDrillHistory') || '[]');
      hist.forEach((item, idx) => {
        const slow5 = (item.slowest || [])
          .slice(0,5)
          .map(q => `${q.text} (${q.time}s)`)
          .join('<br>');
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.name}</td>
          <td>${item.when}</td>
          <td>${item.duration}s</td>
          <td>${item.score}</td>
          <td style="text-align:left;">${slow5}</td>
          <td><button class="delete-btn" data-index="${idx}">Delete</button></td>
        `;
        historyBody.appendChild(tr);
      });
      showScreen(historyScreen);
    }
    historyBody.addEventListener('click', e => {
      const btn = e.target.closest('.delete-btn');
      if (btn) {
        const idx = parseInt(btn.dataset.index, 10);
        deleteHistoryEntry(idx);
        showHistory();
      }
    });
  
    // —— Leaderboard
    function showLeaderboard() {
      const hist = JSON.parse(localStorage.getItem('speedDrillHistory') || '[]');
      leaderboardContainer.innerHTML = '';
      if (!hist.length) {
        leaderboardContainer.innerHTML = '<p>No data yet.</p>';
        showScreen(leaderboardScreen);
        return;
      }
      hist.sort((a,b)=>b.score-a.score);
      const maxScore = hist[0].score;
      hist.slice(0,10).forEach((item, idx) => {
        const bar = document.createElement('div');
        bar.className = 'leaderboard-bar';
        bar.style.width = `${Math.round(item.score/maxScore*100)}%`;
        const medal = idx===0?'🥇':idx===1?'🥈':idx===2?'🥉':'';
        if (medal) {
          const span = document.createElement('span');
          span.className = 'medal';
          span.textContent = medal;
          bar.appendChild(span);
        }
        bar.appendChild(document.createTextNode(' ' + item.score));
        leaderboardContainer.appendChild(bar);
      });
      showScreen(leaderboardScreen);
    }
  
    // —— Hook up buttons
    startBtn            .addEventListener('click', startGame);
    viewHistoryBtn      .addEventListener('click', showHistory);
    viewHistory2Btn     .addEventListener('click', showHistory);
    viewLeaderboardBtn  .addEventListener('click', showLeaderboard);
    viewLeaderboard2Btn .addEventListener('click', showLeaderboard);
    viewAchievementsBtn .addEventListener('click', showAchievements);
    viewAchievements2Btn.addEventListener('click', showAchievements);
    playAgainBtn        .addEventListener('click', () => showScreen(settingsScreen));
    reviewBtn           .addEventListener('click', showReview);
    backBtn             .addEventListener('click', () => showScreen(settingsScreen));
    backToResultsBtn    .addEventListener('click', () => showScreen(resultScreen));
    backToSettingsBtn   .addEventListener('click', () => showScreen(settingsScreen));
    backToSettingsBtn2  .addEventListener('click', () => showScreen(settingsScreen));
  
    // —— Initial screen
    showScreen(settingsScreen);
  });
  
