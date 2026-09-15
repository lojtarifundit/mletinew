// Shared across all pages: mobile menu toggle + scroll progress bar
(function(){
  var navToggle = document.getElementById('navToggle');
  var mobileMenu = document.getElementById('mobileMenu');
  var progress = document.getElementById('progress');

  if(navToggle && mobileMenu){
    navToggle.addEventListener('click', function(){
      var open = mobileMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mobileMenu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        mobileMenu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  if(progress){
    window.addEventListener('scroll', function(){
      var h = document.documentElement;
      var scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
      progress.style.width = (scrolled || 0) + '%';
    });
  }


  // Academic year label: term + current calendar year, rolls over every January.
  var y = new Date().getFullYear();
  document.querySelectorAll('[data-year]').forEach(function(el){ el.textContent = y; });

  var els = document.querySelectorAll('.reveal');
  if(els.length && 'IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          entry.target.dispatchEvent(new CustomEvent('revealed'));
          io.unobserve(entry.target);
        }
      });
    }, { threshold:0.15 });
    els.forEach(function(el){ io.observe(el); });
  } else {
    els.forEach(function(el){ el.classList.add('in'); });
  }
})();
