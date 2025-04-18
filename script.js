document.addEventListener('DOMContentLoaded', () => {
    // —— Screen containers
    const settingsScreen = document.getElementById('settings-screen');
    const gameScreen     = document.getElementById('game-screen');
    const resultScreen   = document.getElementById('result-screen');
    const historyScreen  = document.getElementById('history-screen');
  
    // —— Buttons & displays
    const startBtn        = document.getElementById('start-btn');
    const viewHistoryBtn  = document.getElementById('view-history-btn');
    const viewHistory2    = document.getElementById('view-history-2-btn');
    const backBtn         = document.getElementById('back-btn');
    const playAgainBtn    = document.getElementById('play-again-btn');
    const timerEl         = document.getElementById('timer');
    const scoreEl         = document.getElementById('score');
    const problemEl       = document.getElementById('problem');
    const answerInput     = document.getElementById('answer-input');
    const finalScoreEl    = document.getElementById('final-score');
    const historyBody     = document.querySelector('#history-table tbody');
  
    // —— Settings inputs
    const playerNameInput = document.getElementById('player-name');
  
    const enableMul   = document.getElementById('enable-mul');
    const mul1Min     = document.getElementById('mul1-min');
    const mul1Max     = document.getElementById('mul1-max');
    const mul2Min     = document.getElementById('mul2-min');
    const mul2Max     = document.getElementById('mul2-max');
  
    const enableDiv   = document.getElementById('enable-div');
    const divDMin     = document.getElementById('div-d-min');
    const divDMax     = document.getElementById('div-d-max');
    const divQMin     = document.getElementById('div-q-min');
    const divQMax     = document.getElementById('div-q-max');
  
    const enablePct   = document.getElementById('enable-pct');
    const enableSolve = document.getElementById('enable-solve');
    const durationEl  = document.getElementById('duration');
  
    // —— Fixed fractions for % and Solve‑for‑X
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
  
    // —— Helpers
    function showScreen(screen) {
      [settingsScreen, gameScreen, resultScreen, historyScreen]
        .forEach(s => s.classList.add('hidden'));
      screen.classList.remove('hidden');
    }
  
    function fmtTime(sec) {
      const m = String(Math.floor(sec / 60)).padStart(2, '0');
      const s = String(sec % 60).padStart(2, '0');
      return `${m}:${s}`;
    }
  
    function randInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  
    // —— Problem generators
    function genMul() {
      const a = randInt(+mul1Min.value, +mul1Max.value);
      const b = randInt(+mul2Min.value, +mul2Max.value);
      return { text: `${a} × ${b} =`, answer: a * b };
    }
  
    function genDiv() {
      const dvdMin = +divDMin.value;
      const dvdMax = +divDMax.value;
      const dMin   = +divQMin.value;
      const dMax   = +divQMax.value;
  
      const d = randInt(dMin, dMax);
  
      const minQ = Math.ceil(dvdMin / d);
      const maxQ = Math.floor(dvdMax / d);
  
      let q, dividend;
      if (maxQ >= minQ) {
        q = randInt(minQ, maxQ);
        dividend = d * q;
      } else {
        let tries = 0;
        do {
          dividend = randInt(dvdMin, dvdMax);
          tries++;
        } while (dividend % d !== 0 && tries < 1000);
  
        if (dividend % d !== 0) {
          q = minQ;
          dividend = d * q;
        } else {
          q = dividend / d;
        }
      }
      return { text: `${dividend} ÷ ${d} =`, answer: q };
    }
  
    function genPct() {
      const [n, d] = FRACS[randInt(0, FRACS.length - 1)];
      const pct = ((n / d * 100).toFixed(2)).replace(/\.00$/, '') + '%';
      let N;
      do {
        N = randInt(10, 100);
      } while (N % d !== 0);
      return { text: `${pct} of ${N} =`, answer: (N * n) / d };
    }
  
    function genSolve() {
      const [n, d] = FRACS[randInt(0, FRACS.length - 1)];
      let X, R;
      do {
        X = randInt(1, 50);
        R = (X * n) / d;
      } while (!Number.isInteger(R));
      return { text: `${n}/${d} of x is ${R}. Find x:`, answer: X };
    }
  
    function nextProblem() {
      const { text, answer } = genProblem();
      problemEl.textContent      = text;
      answerInput.value          = '';
      answerInput.dataset.answer = answer;
    }
  
    // —— Start game
    function startGame() {
      currentPlayer = playerNameInput.value.trim() || 'Anonymous';
      remaining     = +durationEl.value;
      score         = 0;
  
      scoreEl.textContent = `Score: ${score}`;
      timerEl.textContent = `Time: ${fmtTime(remaining)}`;
  
      const arr = [];
      if (enableMul.checked)   arr.push(genMul);
      if (enableDiv.checked)   arr.push(genDiv);
      if (enablePct.checked)   arr.push(genPct);
      if (enableSolve.checked) arr.push(genSolve);
      genProblem = () => arr[randInt(0, arr.length - 1)]();
  
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
    answerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const userVal    = parseFloat(answerInput.value);
        const correctVal = parseFloat(answerInput.dataset.answer);
        if (userVal === correctVal) {
          score++;
          scoreEl.textContent = `Score: ${score}`;
          nextProblem();
        } else {
          answerInput.classList.add('wrong');
          setTimeout(() => answerInput.classList.remove('wrong'), 200);
        }
      }
    });
  
    // —— End game & history
    function endGame() {
      finalScoreEl.textContent = `You got ${score} right.`;
      saveHistory();
      showScreen(resultScreen);
    }
  
    function saveHistory() {
      const hist = JSON.parse(localStorage.getItem('speedDrillHistory') || '[]');
      hist.unshift({
        name:     currentPlayer,
        when:     new Date().toLocaleString(),
        duration: +durationEl.value,
        score:    score
      });
      localStorage.setItem('speedDrillHistory', JSON.stringify(hist));
    }
  
    function showHistory() {
      historyBody.innerHTML = '';
      const hist = JSON.parse(localStorage.getItem('speedDrillHistory') || '[]');
      hist.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + item.name     + '</td>' +
          '<td>' + item.when     + '</td>' +
          '<td>' + item.duration + ' s</td>' +
          '<td>' + item.score    + '</td>';
        historyBody.appendChild(tr);
      });
      showScreen(historyScreen);
    }
  
    // —— Button hooks
    startBtn       .addEventListener('click', startGame);
    viewHistoryBtn .addEventListener('click', showHistory);
    viewHistory2   .addEventListener('click', showHistory);
    backBtn        .addEventListener('click', () => showScreen(settingsScreen));
    playAgainBtn   .addEventListener('click', () => showScreen(settingsScreen));
  
    // —— Initial view
    showScreen(settingsScreen);
  });
  