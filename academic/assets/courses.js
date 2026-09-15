/* ============================================================================
   courses.js — reads the course list LIVE from the Google Sheet, every time.

   IMPORTANT — why this version is different from a plain fetch():
   A plain `fetch()` of a Google Sheets export URL is subject to the browser's
   CORS rules, and Google does not reliably send the header that allows a
   fetch from another domain to read the response — so the previous version
   of this file was quietly failing and showing the cached/snapshot data
   instead of the live sheet. This version uses JSONP instead: it loads the
   data through a <script> tag, the same technique Google's own charting
   library documents for exactly this use case, and browsers do not apply
   CORS restrictions to script tags. This is why it works.

   No "Publish to web" step is required — this reads the same
   "anyone with the link can view" sheet you already have shared.

   REFRESH BEHAVIOUR:
     - Reads the sheet as soon as the page loads.
     - Re-reads it every 20 seconds while the tab is open.
     - Re-reads it immediately whenever the tab becomes visible again or the
       window regains focus (so switching back from the spreadsheet to the
       site tab shows the edit right away, no reload needed).
     - Re-renders only when the fetched data actually differs from what's
       on screen, so nothing flickers on every poll.
   ========================================================================== */
(function(){

  var SHEET_ID = '1sCscSRbpt8wYuAxO9grbnk-2SEglSrUjDQ_qtlYYWeQ';
  var GID      = '1195204326';   // the "Courses" tab
  var POLL_MS  = 20000;

  var CACHE_KEY = 'ml-courses-cache-v2';

  // Used only if the sheet has never once been reachable from this device
  // (fully offline, or the sheet's sharing has been turned off).
  var FALLBACK = [
    { code:'CE 121',  name:'Civil Engineering Drawing', semester:'Fall',
      folder:'https://drive.google.com/drive/folders/1zF_rjGFeMU_G3ipZfw5OKW9SR8bm7ER4',
      syllabus:'https://eis.epoka.edu.al/curricula/syllabus/24551/1/35',
      evaluation:['Quizzes: 30% (3x10%)','Midterm Exam: 30%','Final Exam: 40%'] },
    { code:'CEN 104', name:'Python', semester:'Spring',
      folder:'https://drive.google.com/drive/folders/1zF_rjGFeMU_G3ipZfw5OKW9SR8bm7ER4',
      syllabus:'https://eis.epoka.edu.al/curricula/syllabus/24551/1/35',
      evaluation:['Quizzes: 30% (3x10%)','Midterm Exam: 30%','Final Exam: 40%'] }
  ];

  function norm(s){ return String(s == null ? '' : s).trim(); }

  /* ------------------------------------------------------------ JSONP load */
  // Loads a URL via a <script> tag and resolves with whatever value the
  // sheet's own callback mechanism passes in. Not subject to CORS.
  function jsonp(url, timeoutMs){
    return new Promise(function(resolve, reject){
      var cbName = '__courseData_' + Math.random().toString(36).slice(2);
      var script = document.createElement('script');
      var timer = setTimeout(function(){ cleanup(); reject(new Error('timeout')); }, timeoutMs || 9000);

      function cleanup(){
        clearTimeout(timer);
        try{ delete window[cbName]; }catch(e){ window[cbName] = undefined; }
        if(script.parentNode) script.parentNode.removeChild(script);
      }

      window[cbName] = function(data){ cleanup(); resolve(data); };
      script.onerror = function(){ cleanup(); reject(new Error('script load failed')); };
      script.src = url + '&tqx=out:json;responseHandler:' + cbName;
      document.head.appendChild(script);
    });
  }

  function sheetUrl(){
    // headers=1 forces row 1 to be treated as column headers (rather than
    // Google guessing from cell types), and the timestamp defeats caching
    // so an edit shows up on the very next poll, not "eventually".
    return 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/gviz/tq?gid=' + GID
         + '&headers=1&_=' + Date.now();
  }

  /* --------------------------------------------------- gviz JSON -> courses */
  // Matches headers loosely: renaming "Course evaluation" to "Evaluation",
  // or reordering columns, still works.
  function columnIndex(labels, names){
    for(var i = 0; i < labels.length; i++){
      var h = norm(labels[i]).toLowerCase();
      for(var j = 0; j < names.length; j++){
        if(h.indexOf(names[j]) !== -1) return i;
      }
    }
    return -1;
  }

  function splitEvaluation(raw){
    raw = norm(raw);
    if(!raw) return [];
    var parts = raw.split(/\r?\n/);
    if(parts.length === 1) parts = raw.split(/\s*;\s*/);
    return parts.map(function(p){ return p.trim(); }).filter(Boolean);
  }

  function cellText(cell){
    if(!cell) return '';
    // Hyperlinked cells (Insert > Link) surface the URL separately from the
    // display text; prefer the link target when the cell itself is a link.
    if(cell.hasOwnProperty('v') && cell.v && typeof cell.v === 'object' && cell.v.f) return norm(cell.v.f);
    if(cell.v == null) return '';
    return norm(cell.v);
  }

  function gvizToCourses(data){
    if(!data || !data.table || !data.table.cols) return [];
    var labels = data.table.cols.map(function(c){ return c.label || ''; });
    var iCode  = columnIndex(labels, ['code']);
    var iName  = columnIndex(labels, ['name','title']);
    var iSem   = columnIndex(labels, ['semester','term']);
    var iFold  = columnIndex(labels, ['folder','material','drive']);
    var iSyl   = columnIndex(labels, ['syllabus']);
    var iEval  = columnIndex(labels, ['evaluation','assessment','grading']);
    var iLevel = columnIndex(labels, ['level','program','degree']);
    if(iCode === -1 || iName === -1) return [];

    var rows = data.table.rows || [];
    var out = [];
    rows.forEach(function(row){
      var c = row.c || [];
      var code = cellText(c[iCode]);
      var name = cellText(c[iName]);
      if(!code && !name) return;   // blank spreadsheet row
      out.push({
        code: code,
        name: name || code,
        semester: iSem   > -1 ? cellText(c[iSem])   : '',
        folder:   iFold  > -1 ? cellText(c[iFold])  : '',
        syllabus: iSyl   > -1 ? cellText(c[iSyl])   : '',
        level:    iLevel > -1 ? cellText(c[iLevel]) : '',
        evaluation: splitEvaluation(iEval > -1 ? cellText(c[iEval]) : '')
      });
    });
    return out;
  }

  /* ------------------------------------------------------------- utilities */
  // Bare, no-dash slug — "CE 121" -> "ce121" — used for matching only.
  function slug(code){ return norm(code).toLowerCase().replace(/[^a-z0-9]/g, ''); }

  // Same idea but keeps the sheet's original casing, for building the
  // pretty URL shown in links: "CE 121" -> "CE121".
  function prettyCode(code){ return norm(code).replace(/[^a-zA-Z0-9]/g, ''); }

  function isGrad(c){
    if(c.level) return /grad|master|msc|phd/i.test(c.level) && !/under/i.test(c.level);
    var n = parseInt((c.code.match(/(\d{3})/) || [])[1], 10);
    return !isNaN(n) && n >= 500;
  }

  function levelLabel(c){ return c.level ? c.level : (isGrad(c) ? 'Graduate' : 'Undergraduate'); }

  function termLabel(c){
    var sem = norm(c.semester);
    var year = new Date().getFullYear();
    return sem ? sem + ' ' + year : String(year);
  }

  function termKeys(c){
    var s = norm(c.semester).toLowerCase();
    var keys = [];
    if(s.indexOf('fall') !== -1) keys.push('fall');
    if(s.indexOf('spring') !== -1) keys.push('spring');
    if(!keys.length) keys = ['fall','spring'];
    return keys.join(' ');
  }

  /* ---------------------------------------------------------------- cache */
  function readCache(){
    try{
      var parsed = JSON.parse(localStorage.getItem(CACHE_KEY));
      if(parsed && parsed.courses && parsed.courses.length) return parsed.courses;
    }catch(e){}
    return null;
  }
  function writeCache(courses){
    try{ localStorage.setItem(CACHE_KEY, JSON.stringify({ ts:Date.now(), courses:courses })); }catch(e){}
  }

  /* --------------------------------------------------------------- engine */
  var listeners = [];
  var lastServedJSON = null;
  var pollHandle = null;
  var lastFetchAt = 0;

  function deliver(courses, source){
    var asJSON = JSON.stringify(courses);
    if(asJSON === lastServedJSON) return;   // identical to what's on screen already
    lastServedJSON = asJSON;
    listeners.forEach(function(fn){ fn(courses, source); });
  }

  function fetchOnce(){
    lastFetchAt = Date.now();
    return jsonp(sheetUrl()).then(function(data){
      var courses = gvizToCourses(data);
      if(!courses.length) throw new Error('sheet returned no rows');
      writeCache(courses);
      deliver(courses, 'live');
    });
  }

  function fetchThrottled(){
    if(Date.now() - lastFetchAt < 4000) return;   // ignore rapid double-triggers
    fetchOnce()['catch'](function(){ /* keep whatever is currently shown */ });
  }

  function startPolling(){
    if(pollHandle) return;
    pollHandle = setInterval(fetchThrottled, POLL_MS);
    document.addEventListener('visibilitychange', function(){
      if(document.visibilityState === 'visible') fetchThrottled();
    });
    window.addEventListener('focus', fetchThrottled);
  }

  /**
   * load(cb) calls cb immediately with whatever is already known (cache, or
   * the built-in snapshot), then again every time fresh sheet data differs
   * from what was last shown. Pages just re-render each time cb fires.
   */
  function load(cb){
    listeners.push(cb);
    deliver(readCache() || FALLBACK, 'cached');
    if(load._started) return;
    load._started = true;
    if(typeof document === 'undefined') return;
    fetchOnce()['catch'](function(){ /* sheet unreachable on first try; cache/snapshot stands */ })
      .then(startPolling);
  }

  window.CourseData = {
    load: load,
    slug: slug,
    prettyCode: prettyCode,
    isGrad: isGrad,
    levelLabel: levelLabel,
    termLabel: termLabel,
    termKeys: termKeys,
    refresh: fetchThrottled,
    sheetUrl: 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit?gid=' + GID
  };

  // exposed for testing only
  window.__gvizToCourses = gvizToCourses;
})();
