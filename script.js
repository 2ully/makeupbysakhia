// Mobile nav — toggle both left and right lists
function toggleMenu() {
  document.getElementById('nav-links').classList.toggle('open');
  var right = document.getElementById('nav-links-right');
  if (right) right.classList.toggle('open');
}
function closeMenu() {
  document.getElementById('nav-links').classList.remove('open');
  var right = document.getElementById('nav-links-right');
  if (right) right.classList.remove('open');
}

// Gallery filter (btn may be null when called from explore cards)
function filterGallery(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.gallery-item').forEach(item => {
    const match = cat === 'all' || item.dataset.category === cat;
    item.style.display = match ? 'block' : 'none';
  });
}

// Lightbox
function openLightbox(el) {
  const lb = document.getElementById('lightbox');
  const content = document.getElementById('lightbox-content');
  content.style.background = getComputedStyle(el).background;
  let overlay = content.querySelector('.gallery-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'gallery-overlay';
    content.appendChild(overlay);
  }
  overlay.style.opacity = '1';
  overlay.innerHTML =
    '<h4 style="color:#fff;font-size:1.2rem;margin-bottom:8px">' + el.dataset.title + '</h4>' +
    '<span style="color:rgba(255,255,255,.8);font-family:Arial,sans-serif;font-size:.85rem">' + el.dataset.sub + '</span>';
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox(e) {
  if (!e || e.target === document.getElementById('lightbox') || e.currentTarget === document.querySelector('.lightbox-close')) {
    document.getElementById('lightbox').classList.remove('open');
    document.body.style.overflow = '';
  }
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.getElementById('lightbox').classList.remove('open');
    document.body.style.overflow = '';
  }
});

// Booking form
function submitForm(e) {
  e.preventDefault();
  document.getElementById('booking-form').style.display = 'none';
  document.getElementById('form-success').style.display = 'block';
}

// Scroll reveal
var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.service-card, .gallery-item, .testimonial-card').forEach(function(el) {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});
