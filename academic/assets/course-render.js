/* ============================================================================
   course-render.js — draws whatever courses.js hands it.
   Runs on the home page (the grid), course.html (one course), and cv.html
   (the "Courses taught" list). No course content is written into the HTML
   files; it all comes from the spreadsheet.
   ========================================================================== */
(function(){
  var CD = window.CourseData;
  if(!CD) return;

  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }
  function safeUrl(u){
    u = String(u || '').trim();
    return /^https?:\/\//i.test(u) ? u : '';
  }

  var ARROW = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">'
            + '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

  /* --------------------------------------------------------------- the grid */
  // A real link to an existing file, so this works whether you double-click
  // index.html straight off your disk or view it on a real server. (The
  // pretty /academic/CE121 form in 404.html is an extra, server-only way to
  // reach the same page — it can't work from a file:// URL, so course cards
  // never depend on it.)
  function courseCard(c){
    var href = 'course.html?c=' + encodeURIComponent(CD.prettyCode(c.code));
    return '<a href="' + esc(href) + '"'
         + ' class="course-card' + (CD.isGrad(c) ? ' grad' : '') + '"'
         + ' data-term="' + esc(CD.termKeys(c)) + '" data-generated="1">'
         + '<span class="cat-dot"><span class="d"></span>' + esc(c.code) + '</span>'
         + '<h3>' + esc(c.name) + '</h3>'
         + '<div class="term">' + esc(CD.termLabel(c)) + '</div>'
         + '<div class="go">Open course ' + ARROW + '</div>'
         + '</a>';
  }

  function renderGrid(courses){
    var grid = document.getElementById('courseGrid');
    if(!grid) return;
    var exam = grid.querySelector('.exam-card');   // stays in the HTML, kept aside
    Array.prototype.slice.call(grid.querySelectorAll('[data-generated]')).forEach(function(el){
      el.parentNode.removeChild(el);
    });
    var html = courses.map(function(c){ return courseCard(c); }).join('');
    if(exam) exam.insertAdjacentHTML('beforebegin', html);
    else grid.insertAdjacentHTML('beforeend', html);
    // let home.js re-apply the Fall/Spring filter to the new cards
    if(typeof window.renderCourseGrid === 'function') window.renderCourseGrid();
  }

  /* ------------------------------------------------------- one course page */
  function linkCard(text, url, label, accent, grad){
    var u = safeUrl(url);
    var btn = u
      ? '<a href="' + esc(u) + '" target="_blank" rel="noopener" class="pill" style="width:100%; '
        + 'justify-content:center; display:flex; border-color:' + accent + ';">' + label + '</a>'
      : '<span class="pill-off">Link coming soon</span>';
    return '<div class="drive-card' + (grad ? ' grad' : '') + '"><p>' + text + '</p>' + btn + '</div>';
  }

  // course.html?c=ce121 still works (query string wins if present). With no
  // query string — which is the normal case for the pretty /academic/CE121
  // URLs served through the 404 fallback — fall back to the last segment of
  // the URL path itself.
  function requestedCode(){
    var q = new URLSearchParams(location.search).get('c');
    if(q) return q;
    var seg = location.pathname.split('/').filter(Boolean).pop() || '';
    if(/\.html?$/i.test(seg)) return '';                          // hit course.html with no ?c=
    if(['academic','index','course','cv','examination'].indexOf(seg.toLowerCase()) !== -1) return '';
    return seg;
  }

  function renderCoursePage(courses){
    var host = document.getElementById('coursePage');
    if(!host) return;

    var want = CD.slug(requestedCode());
    var course = null;
    if(want){
      courses.forEach(function(c){
        if(CD.slug(c.code) === want) course = c;
      });
    }

    if(!course){
      host.innerHTML = '<div class="cp-head"><h1>Course not found</h1></div>'
        + '<p class="cp-desc">This course is not in the current course list. '
        + '<a href="index.html#courses-section" style="color:var(--red);">Back to all courses</a>.</p>';
      document.title = 'Course not found — Marsed Leti';
      return;
    }

    var grad = CD.isGrad(course);
    var accent = grad ? 'var(--gold)' : 'var(--red)';

    var evalHtml;
    if(course.evaluation.length){
      evalHtml = '<ul class="eval-list">' + course.evaluation.map(function(line){
        var i = line.indexOf(':');
        if(i > -1){
          return '<li><span>' + esc(line.slice(0, i).trim()) + '</span>'
               + '<span class="mono">' + esc(line.slice(i + 1).trim()) + '</span></li>';
        }
        return '<li><span>' + esc(line) + '</span></li>';
      }).join('') + '</ul>';
    } else {
      evalHtml = '<div class="cp-note">Evaluation criteria for this course will be published here '
               + 'once they are confirmed for the semester.</div>';
    }

    document.title = course.code + ' — ' + course.name + ' — Marsed Leti';

    host.innerHTML =
        '<a href="index.html#courses-section" class="back-link">&larr; Back to courses</a>'
      + '<div class="cp-head">'
      +   '<span class="cat-dot" style="color:' + accent + '">'
      +     '<span class="d" style="background:' + accent + '"></span>' + esc(course.code) + '</span>'
      +   '<h1>' + esc(course.name) + '</h1>'
      +   '<div class="cp-meta">'
      +     '<div><strong>' + esc(CD.termLabel(course)) + '</strong></div>'
      +     '<div><strong>' + esc(CD.levelLabel(course)) + '</strong></div>'
      +   '</div>'
      + '</div>'
      + '<div class="cp-body">'
      +   '<div><h2>Course evaluation</h2>' + evalHtml + '</div>'
      +   '<div class="cp-side">'
      +     linkCard('Lecture slides, problem sets, and readings for ' + esc(course.code)
                     + ' are kept in a shared Google Drive folder.',
                     course.folder, 'Open materials', accent, grad)
      +     linkCard('The official syllabus, learning outcomes, and weekly plan are published on Epoka EIS.',
                     course.syllabus, 'Open syllabus', accent, grad)
      +     '<div class="side-fact"><div class="k">CONTACT</div><div class="v">'
      +     '<a href="mailto:mleti@epoka.edu.al" style="color:var(--red);">mleti@epoka.edu.al</a></div></div>'
      +   '</div>'
      + '</div>';
  }

  /* ------------------------------------------------- CV: courses taught list */
  function renderTaught(courses){
    var list = document.getElementById('coursesTaught');
    if(!list) return;
    list.innerHTML = courses.map(function(c){
      return '<li><span><strong>' + esc(c.code) + '</strong> — ' + esc(c.name)
           + ' <span class="mono" style="color:var(--gray-dim);">(' + esc(c.semester || '—') + ')</span>'
           + '</span></li>';
    }).join('');
  }

  CD.load(function(courses){
    renderGrid(courses);
    renderCoursePage(courses);
    renderTaught(courses);
  });
})();
