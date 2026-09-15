(function(){
  var TABS = ['clock', 'timer', 'notes', 'calc'];
  var TAB_LABELS = { clock: 'Clock', timer: 'Timer', notes: 'Notes', calc: 'Calc' };
  var NOTES_KEY = 'ml-study-notes';
  var STATE_KEY = 'ml-widget-state';

  function loadState(){
    try{
      var raw = localStorage.getItem(STATE_KEY);
      if(raw){ var parsed = JSON.parse(raw); if(TABS.indexOf(parsed.tab) === -1) parsed.tab = 'clock'; return parsed; }
    }catch(e){}
    return { expanded:false, tab:'clock' };
  }
  function saveState(){
    try{ localStorage.setItem(STATE_KEY, JSON.stringify({ expanded:widgetState.expanded, tab:widgetState.tab })); }catch(e){}
  }

  var widgetState = loadState();

  function clockPage(){
    return '<div class="wpage" data-page="clock">'
      + '<div class="lab">STATUS</div>'
      + '<div class="status-row"><span class="status-dot"></span><span id="greetText">Good evening</span></div>'
      + '<span id="dayDate">—</span>'
      + '<span id="clockTime">--:--:--</span>'
      + '<div class="day-track"><div class="day-fill" id="dayFill" style="width:0%"></div></div>'
      + '</div>';
  }

  function timerPage(){
    return '<div class="wpage" data-page="timer">'
      + '<div class="wtimer-mode">'
      +   '<button type="button" class="wmode active" data-mode="timer">Study timer</button>'
      +   '<button type="button" class="wmode" data-mode="stopwatch">Stopwatch</button>'
      + '</div>'
      + '<div class="wtimer-display mono" id="timerDisplay">25:00</div>'
      + '<div class="wtimer-presets" id="timerPresets">'
      +   '<button type="button" data-min="25" class="active">25m</button>'
      +   '<button type="button" data-min="60">1h</button>'
      +   '<button type="button" data-min="120">2h</button>'
      +   '<button type="button" data-min="180">3h</button>'
      + '</div>'
      + '<div class="wtimer-custom" id="timerCustomWrap">'
      +   '<input type="number" id="timerCustom" min="1" max="480" placeholder="Custom minutes" />'
      +   '<button type="button" id="timerCustomSet">Set</button>'
      + '</div>'
      + '<div class="wtimer-controls">'
      +   '<button type="button" id="timerStart" class="wbtn-primary">Start</button>'
      +   '<button type="button" id="timerReset">Reset</button>'
      + '</div>'
      + '<div class="wtimer-status" id="timerStatus">Pick a study length and hit start.</div>'
      + '</div>';
  }

  function notesPage(){
    return '<div class="wpage" data-page="notes">'
      + '<textarea id="notesArea" class="wnotes" placeholder="Jot down anything — it saves automatically on this device, even after a reload."></textarea>'
      + '<div class="wnotes-status" id="notesStatus">Saved on this device</div>'
      + '</div>';
  }

  function calcPage(){
    var keys = ['7','8','9','÷','4','5','6','×','1','2','3','−','0','.','=','+'];
    var html = '<div class="wpage" data-page="calc">'
      + '<div class="wcalc-display mono" id="calcDisplay">0</div>'
      + '<div class="wcalc-grid">'
      + '<button type="button" class="wcalc-btn wcalc-clear" data-key="C">C</button>';
    keys.forEach(function(k){
      var opClass = (k === '÷' || k === '×' || k === '−' || k === '+' || k === '=') ? ' wcalc-op' : '';
      html += '<button type="button" class="wcalc-btn' + opClass + '" data-key="' + k + '">' + k + '</button>';
    });
    html += '</div></div>';
    return html;
  }

  var root = document.createElement('div');
  root.className = 'study-widget' + (widgetState.expanded ? ' expanded' : '');
  root.id = 'studyWidget';
  root.innerHTML =
      '<button id="widgetFab" class="widget-fab" aria-label="Open study tools" aria-expanded="false">'
    +   '<span class="widget-fab-dot"></span><span class="widget-fab-label">Study tools</span>'
    + '</button>'
    + '<div class="widget-panel" id="widgetPanel">'
    +   '<div class="widget-head">'
    +     '<div class="widget-tabs" id="widgetTabs">'
    +       TABS.map(function(t){ return '<button type="button" class="wtab" data-tab="' + t + '">' + TAB_LABELS[t] + '</button>'; }).join('')
    +     '</div>'
    +     '<button id="widgetCollapse" class="widget-collapse" aria-label="Collapse study tools">&times;</button>'
    +   '</div>'
    +   '<div class="widget-body" id="widgetBody">'
    +     '<div class="widget-track" id="widgetTrack">' + clockPage() + timerPage() + notesPage() + calcPage() + '</div>'
    +   '</div>'
    +   '<div class="widget-dots" id="widgetDots">'
    +     TABS.map(function(t){ return '<span class="wdot" data-dot="' + t + '"></span>'; }).join('')
    +   '</div>'
    + '</div>';

  document.body.appendChild(root);

  var fab = document.getElementById('widgetFab');
  var collapseBtn = document.getElementById('widgetCollapse');
  var track = document.getElementById('widgetTrack');
  var tabButtons = root.querySelectorAll('.wtab');
  var dots = root.querySelectorAll('.wdot');

  function setExpanded(val){
    widgetState.expanded = val;
    root.classList.toggle('expanded', val);
    fab.setAttribute('aria-expanded', val ? 'true' : 'false');
    saveState();
  }
  fab.addEventListener('click', function(){ setExpanded(true); });
  collapseBtn.addEventListener('click', function(){ setExpanded(false); });

  function setActiveTab(name){
    var idx = TABS.indexOf(name);
    if(idx === -1) idx = 0;
    widgetState.tab = TABS[idx];
    track.style.transform = 'translateX(-' + (idx * 100) + '%)';
    tabButtons.forEach(function(b){ b.classList.toggle('active', b.dataset.tab === widgetState.tab); });
    dots.forEach(function(d){ d.classList.toggle('active', d.dataset.dot === widgetState.tab); });
    saveState();
  }
  tabButtons.forEach(function(b){ b.addEventListener('click', function(){ setActiveTab(b.dataset.tab); }); });
  dots.forEach(function(d){ d.addEventListener('click', function(){ setActiveTab(d.dataset.dot); }); });
  setActiveTab(widgetState.tab);

  // swipe support
  var touchStartX = null;
  var body = document.getElementById('widgetBody');
  body.addEventListener('touchstart', function(e){ touchStartX = e.touches[0].clientX; }, { passive:true });
  body.addEventListener('touchend', function(e){
    if(touchStartX === null) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if(Math.abs(dx) < 40) return;
    var idx = TABS.indexOf(widgetState.tab);
    if(dx < 0 && idx < TABS.length - 1) setActiveTab(TABS[idx + 1]);
    if(dx > 0 && idx > 0) setActiveTab(TABS[idx - 1]);
  }, { passive:true });

  /* ---------------- CLOCK ---------------- */
  function greetingWord(){
    var h = new Date().getHours();
    if(h < 5) return 'Good night';
    if(h < 12) return 'Good morning';
    if(h < 17) return 'Good afternoon';
    if(h < 21) return 'Good evening';
    return 'Good night';
  }
  function tickClock(){
    var now = new Date();
    var g = document.getElementById('greetText');
    var d = document.getElementById('dayDate');
    var c = document.getElementById('clockTime');
    var f = document.getElementById('dayFill');
    if(g) g.textContent = greetingWord();
    if(d) d.textContent = now.toLocaleDateString([], { weekday:'long', month:'long', day:'numeric' });
    if(c) c.textContent = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    if(f){
      var secs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      f.style.width = ((secs / 86400) * 100).toFixed(2) + '%';
    }
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ---------------- TIMER / STOPWATCH (persisted across pages) ---------------- */
  var TIMER_KEY = 'ml-widget-timer';

  var timerDisplay  = document.getElementById('timerDisplay');
  var timerStatus   = document.getElementById('timerStatus');
  var timerStartBtn = document.getElementById('timerStart');
  var timerResetBtn = document.getElementById('timerReset');
  var presetsWrap   = document.getElementById('timerPresets');
  var customWrap    = document.getElementById('timerCustomWrap');
  var customInput   = document.getElementById('timerCustom');
  var customSetBtn  = document.getElementById('timerCustomSet');
  var modeButtons   = root.querySelectorAll('.wmode');

  var titleFlashHandle = null;
  var originalTitle = document.title;

  // Everything the timer needs lives in localStorage and is expressed as
  // absolute timestamps, so a running timer/stopwatch keeps counting while
  // the visitor moves between pages (or closes the tab and comes back).
  var TIMER_DEFAULTS = {
    mode: 'timer',
    selectedMinutes: 25,
    timerRunning: false,
    endsAt: 0,          // when the countdown will hit zero (ms epoch)
    remaining: 25 * 60, // seconds left while paused
    swRunning: false,
    swStartedAt: 0,     // when the current stopwatch run began (ms epoch)
    swElapsed: 0,       // seconds banked from previous runs
    finished: false,
    chimed: false
  };

  function loadTimer(){
    var s = {}, k;
    for(k in TIMER_DEFAULTS) s[k] = TIMER_DEFAULTS[k];
    try{
      var raw = localStorage.getItem(TIMER_KEY);
      if(raw){
        var p = JSON.parse(raw);
        for(k in TIMER_DEFAULTS){ if(p[k] !== undefined && p[k] !== null) s[k] = p[k]; }
      }
    }catch(e){}
    if(s.mode !== 'stopwatch') s.mode = 'timer';
    if(s.timerRunning && Date.now() >= s.endsAt){
      // it ran out while we were on another page
      s.timerRunning = false;
      s.remaining = 0;
      s.finished = true;
    }
    return s;
  }
  function saveTimer(){
    try{ localStorage.setItem(TIMER_KEY, JSON.stringify(T)); }catch(e){}
  }

  var T = loadTimer();

  function timerRemaining(){
    if(T.timerRunning) return Math.max(0, (T.endsAt - Date.now()) / 1000);
    return Math.max(0, T.remaining);
  }
  function swSeconds(){
    if(T.swRunning) return T.swElapsed + (Date.now() - T.swStartedAt) / 1000;
    return T.swElapsed;
  }
  function activeRunning(){ return T.mode === 'timer' ? T.timerRunning : T.swRunning; }

  function fmt(totalSeconds){
    totalSeconds = Math.max(0, totalSeconds);
    var h = Math.floor(totalSeconds / 3600);
    var m = Math.floor((totalSeconds % 3600) / 60);
    var s = totalSeconds % 60;
    if(h > 0) return h + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
    return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  }

  function statusText(){
    if(T.mode === 'timer'){
      if(T.finished) return "Time's up — take a break!";
      if(T.timerRunning) return 'Studying — stay focused.';
      if(T.remaining < T.selectedMinutes * 60) return 'Paused.';
      return 'Pick a study length and hit start.';
    }
    if(T.swRunning) return 'Running.';
    if(T.swElapsed > 0) return 'Stopwatch paused.';
    return 'Ready when you are.';
  }

  function renderTimer(){
    if(!timerDisplay) return;
    timerDisplay.textContent = T.mode === 'timer'
      ? fmt(Math.ceil(timerRemaining()))
      : fmt(Math.floor(swSeconds()));
    timerStartBtn.textContent = activeRunning() ? 'Pause' : 'Start';
    timerStatus.textContent = statusText();
    timerStatus.classList.toggle('alarm', T.mode === 'timer' && T.finished);
    presetsWrap.style.display = T.mode === 'timer' ? '' : 'none';
    customWrap.style.display  = T.mode === 'timer' ? '' : 'none';
    modeButtons.forEach(function(b){ b.classList.toggle('active', b.dataset.mode === T.mode); });
    presetsWrap.querySelectorAll('button').forEach(function(b){
      b.classList.toggle('active', parseInt(b.dataset.min, 10) === T.selectedMinutes);
    });
  }

  /* ---- gentle chime ---- */
  var audioCtx = null;
  var pendingChime = false;
  var alarmTimers = [];

  function getCtx(){
    try{
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if(!Ctx) return null;
      if(!audioCtx) audioCtx = new Ctx();
      if(audioCtx.state === 'suspended' && audioCtx.resume) audioCtx.resume();
      return audioCtx;
    }catch(e){ return null; }
  }

  // Soft, warm bell — slow attack, long decay, low volume.
  function gentleChime(){
    var ctx = getCtx();
    if(!ctx || ctx.state !== 'running') return false;
    try{
      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2200;
      var master = ctx.createGain();
      master.gain.value = 0.9;
      filter.connect(master);
      master.connect(ctx.destination);

      // C5 – E5 – G5, each one drifting in a little after the last
      [[523.25, 0.00, 2.4, 0.10],
       [659.25, 0.42, 2.4, 0.085],
       [783.99, 0.84, 2.8, 0.075]].forEach(function(n){
        var freq = n[0], delay = n[1], dur = n[2], vol = n[3];
        var t = ctx.currentTime + delay;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(vol, t + 0.18);   // soft swell, no click
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur); // long, quiet tail
        osc.connect(gain);
        gain.connect(filter);
        osc.start(t);
        osc.stop(t + dur + 0.1);
      });
      return true;
    }catch(e){ return false; }
  }

  function stopAlarmRepeat(){
    alarmTimers.forEach(function(h){ clearTimeout(h); });
    alarmTimers = [];
  }

  function playAlarm(force){
    if(!force){
      if(T.chimed) return;
      // don't startle someone reopening the tab hours later
      if(Date.now() - T.endsAt > 5 * 60 * 1000){ T.chimed = true; saveTimer(); return; }
    }
    if(gentleChime()){
      pendingChime = false;
      T.chimed = true;
      saveTimer();
      stopAlarmRepeat();
      alarmTimers.push(setTimeout(gentleChime, 4000)); // one soft reminder, then silence
    } else {
      pendingChime = true; // browser hasn't allowed audio yet — chime on first interaction
    }
  }

  function unlockAudio(){
    if(!pendingChime) return;
    getCtx();
    setTimeout(function(){ if(pendingChime) playAlarm(true); }, 60);
  }
  document.addEventListener('pointerdown', unlockAudio, true);
  document.addEventListener('keydown', unlockAudio, true);

  function flashTitle(on){
    if(on){
      if(titleFlashHandle) return;
      var toggle = true;
      titleFlashHandle = setInterval(function(){
        document.title = toggle ? "⏰ Time's up!" : originalTitle;
        toggle = !toggle;
      }, 900);
    } else if(titleFlashHandle){
      clearInterval(titleFlashHandle);
      titleFlashHandle = null;
      document.title = originalTitle;
    }
  }

  function clearFinished(){
    T.finished = false;
    T.chimed = false;
    stopAlarmRepeat();
    flashTitle(false);
  }

  function onFinish(){
    // show the countdown page so "Time's up" is actually visible
    if(T.mode !== 'timer'){ T.mode = 'timer'; saveTimer(); }
    flashTitle(true);
    playAlarm(false);
    renderTimer();
  }

  function startPause(){
    if(T.mode === 'timer'){
      if(T.timerRunning){
        T.remaining = Math.round(timerRemaining());
        T.timerRunning = false;
      } else {
        if(T.finished || timerRemaining() <= 0) T.remaining = T.selectedMinutes * 60;
        clearFinished();
        T.endsAt = Date.now() + T.remaining * 1000;
        T.timerRunning = true;
      }
    } else {
      if(T.swRunning){
        T.swElapsed = swSeconds();
        T.swRunning = false;
      } else {
        T.swStartedAt = Date.now();
        T.swRunning = true;
      }
    }
    getCtx(); // warm up audio on a real click so the chime can play later
    saveTimer();
    renderTimer();
  }

  function resetTimer(){
    if(T.mode === 'timer'){
      T.timerRunning = false;
      T.remaining = T.selectedMinutes * 60;
      clearFinished();
    } else {
      T.swRunning = false;
      T.swElapsed = 0;
      T.swStartedAt = 0;
    }
    saveTimer();
    renderTimer();
  }

  function setLength(minutes){
    T.selectedMinutes = minutes;
    T.timerRunning = false;
    T.remaining = minutes * 60;
    clearFinished();
    saveTimer();
    renderTimer();
  }

  timerStartBtn.addEventListener('click', startPause);
  timerResetBtn.addEventListener('click', resetTimer);

  presetsWrap.querySelectorAll('button').forEach(function(btn){
    btn.addEventListener('click', function(){ setLength(parseInt(btn.dataset.min, 10)); });
  });

  customSetBtn.addEventListener('click', function(){
    var val = parseInt(customInput.value, 10);
    if(!val || val < 1) return;
    setLength(Math.min(val, 480));
    timerStatus.textContent = 'Custom length set — hit start.';
  });

  modeButtons.forEach(function(btn){
    btn.addEventListener('click', function(){
      if(btn.dataset.mode === T.mode) return;
      T.mode = btn.dataset.mode;   // the other one keeps running in the background
      saveTimer();
      renderTimer();
    });
  });

  // One heartbeat drives both tools; values are derived from timestamps,
  // so nothing drifts if the tab is throttled or the page changes.
  setInterval(function(){
    if(T.timerRunning && Date.now() >= T.endsAt){
      T.timerRunning = false;
      T.remaining = 0;
      T.finished = true;
      T.chimed = false;
      saveTimer();
      onFinish();
      return;
    }
    if(T.timerRunning || T.swRunning) renderTimer();
  }, 250);

  // Keep other open tabs of the site in sync.
  window.addEventListener('storage', function(e){
    if(e.key !== TIMER_KEY) return;
    T = loadTimer();
    renderTimer();
  });

  renderTimer();
  if(T.finished){ flashTitle(true); playAlarm(false); }

  /* ---------------- NOTES (persisted) ---------------- */
  var notesArea = document.getElementById('notesArea');
  var notesStatus = document.getElementById('notesStatus');
  try{ notesArea.value = localStorage.getItem(NOTES_KEY) || ''; }catch(e){}
  var saveTimeout = null;
  notesArea.addEventListener('input', function(){
    notesStatus.textContent = 'Saving…';
    notesStatus.style.opacity = '1';
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(function(){
      try{ localStorage.setItem(NOTES_KEY, notesArea.value); }catch(e){}
      notesStatus.textContent = 'Saved on this device';
    }, 400);
  });

  /* ---------------- CALCULATOR ---------------- */
  var calcDisplay = document.getElementById('calcDisplay');
  var calcState = { display:'0', prev:null, op:null, waitingForNew:false };

  function calcRender(){ calcDisplay.textContent = calcState.display; }

  function calcCompute(a, b, op){
    switch(op){
      case '+': return a + b;
      case '−': return a - b;
      case '×': return a * b;
      case '÷': return b === 0 ? NaN : a / b;
      default: return b;
    }
  }
  function calcFormat(n){
    if(isNaN(n)) return 'Error';
    var s = Math.round(n * 1e10) / 1e10;
    return String(s);
  }

  root.querySelector('.wcalc-grid').addEventListener('click', function(e){
    var btn = e.target.closest('.wcalc-btn');
    if(!btn) return;
    var key = btn.dataset.key;

    if(key === 'C'){
      calcState = { display:'0', prev:null, op:null, waitingForNew:false };
      calcRender();
      return;
    }
    if(key === '.'){
      if(calcState.waitingForNew){ calcState.display = '0.'; calcState.waitingForNew = false; }
      else if(calcState.display.indexOf('.') === -1) calcState.display += '.';
      calcRender();
      return;
    }
    if(/[0-9]/.test(key)){
      if(calcState.waitingForNew || calcState.display === '0'){ calcState.display = key; calcState.waitingForNew = false; }
      else if(calcState.display.length < 14){ calcState.display += key; }
      calcRender();
      return;
    }
    if(key === '='){
      if(calcState.op !== null && calcState.prev !== null){
        var result = calcCompute(calcState.prev, parseFloat(calcState.display), calcState.op);
        calcState.display = calcFormat(result);
        calcState.prev = null;
        calcState.op = null;
        calcState.waitingForNew = true;
        calcRender();
      }
      return;
    }
    // operator
    var current = parseFloat(calcState.display);
    if(calcState.op !== null && !calcState.waitingForNew){
      var chained = calcCompute(calcState.prev, current, calcState.op);
      calcState.prev = chained;
      calcState.display = calcFormat(chained);
    } else {
      calcState.prev = current;
    }
    calcState.op = key;
    calcState.waitingForNew = true;
    calcRender();
  });
})();
