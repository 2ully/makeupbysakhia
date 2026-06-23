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

  // Clear any previously loaded lightbox image or overlay
  const oldImg = content.querySelector('.lightbox-img');
  if (oldImg) oldImg.remove();
  const oldOverlay = content.querySelector('.gallery-overlay');
  if (oldOverlay) oldOverlay.remove();

  // Check if the gallery item contains an img tag
  const img = el.querySelector('img');
  if (img) {
    // If it has an image, clear the background style and append a new img element
    content.style.background = 'none';
    const newImg = document.createElement('img');
    newImg.src = img.src;
    newImg.alt = img.alt || '';
    newImg.className = 'lightbox-img';
    content.appendChild(newImg);
  } else {
    // Fallback to gradient background if no image is present
    content.style.background = getComputedStyle(el).background;
  }

  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}


function closeLightbox(e) {
  if (!e || e.target === document.getElementById('lightbox') || e.currentTarget === document.querySelector('.lightbox-close')) {
    document.getElementById('lightbox').classList.remove('open');
    document.body.style.overflow = '';
  }
}

document.addEventListener('keydown', function (e) {
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
var observer = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.service-card, .gallery-item, .testimonial-card').forEach(function (el) {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});
