(function(){
  // Note: the clock/greeting/date widget now lives in the floating study
  // widget (assets/study-widget.js), so this file only handles the stat
  // counters, skill bars, and the course term toggle.

  function animateCounts(){
    document.querySelectorAll('.stat .num').forEach(function(el){
      var target = parseInt(el.dataset.count, 10);
      var suffix = el.dataset.suffix || '';
      var start = null;
      var dur = 1100;
      function step(ts){
        if(!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if(p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  function animateSkills(){
    document.querySelectorAll('#skillsWrap .skill-fill').forEach(function(bar){
      var target = bar.dataset.target;
      requestAnimationFrame(function(){ bar.style.width = target + '%'; });
    });
  }

  var statRow = document.querySelector('.stat-row');
  if(statRow) statRow.addEventListener('revealed', animateCounts);
  var skillsWrap = document.getElementById('skillsWrap');
  if(skillsWrap) skillsWrap.closest('.reveal') && skillsWrap.closest('.reveal').addEventListener('revealed', animateSkills);

  // Fallback: if IntersectionObserver already fired before listeners attached (fast load), trigger once immediately for above-the-fold stats
  window.addEventListener('load', function(){
    if(statRow && statRow.classList.contains('in')) animateCounts();
  });

  function autoTerm(){
    var d = new Date();
    var m = d.getMonth();
    var day = d.getDate();
    if(m >= 8 || m === 0 || (m === 1 && day < 28)) return 'fall';
    return 'spring';
  }

  var wrap = document.getElementById('termToggle');
  var grid = document.getElementById('courseGrid');
  var currentTerm = autoTerm();

  function renderGrid(){
    if(!grid) return;
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.course-card, .exam-card'));
    var visible = cards.filter(function(c){
      return c.classList.contains('exam-card') ? false : (c.dataset.term || '').indexOf(currentTerm) !== -1;
    });
    var examCard = grid.querySelector('.exam-card');

    // hide everything first
    cards.forEach(function(c){ c.style.display = 'none'; });
    visible.forEach(function(c){ c.style.display = ''; });

    // re-insert the exam card right after the 5th visible course (or at the end if fewer than 5)
    if(examCard){
      examCard.style.display = '';
      var insertAfter = visible[4] || visible[visible.length - 1];
      if(insertAfter && insertAfter.nextSibling !== examCard){
        insertAfter.parentNode.insertBefore(examCard, insertAfter.nextSibling);
      } else if(!insertAfter){
        grid.appendChild(examCard);
      }
    }
  }

  if(wrap){
    wrap.querySelectorAll('button').forEach(function(btn){
      btn.classList.toggle('active', btn.dataset.term === currentTerm);
      btn.addEventListener('click', function(){
        currentTerm = btn.dataset.term;
        wrap.querySelectorAll('button').forEach(function(b){ b.classList.toggle('active', b.dataset.term === currentTerm); });
        renderGrid();
      });
    });
  }
  window.renderCourseGrid = renderGrid;
  renderGrid();
})();
