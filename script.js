// Vercel Web Analytics
import { inject } from '@vercel/analytics';
inject();

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

// ── Booking availability ──
// Stop users picking past dates (min = today, in the visitor's local time).
(function setDateMin() {
  var dateInput = document.getElementById('date');
  if (!dateInput) return;
  var t = new Date();
  var iso = t.getFullYear() + '-' +
    String(t.getMonth() + 1).padStart(2, '0') + '-' +
    String(t.getDate()).padStart(2, '0');
  dateInput.min = iso;
})();

// When a date is chosen, ask the server which time slots are still open and
// grey out the taken ones. Disables the submit button if the day is full.
function loadAvailability() {
  var date = document.getElementById('date').value;
  var note = document.getElementById('availability-note');
  var timeSelect = document.getElementById('time');
  var submitBtn = document.querySelector('#booking-form button[type="submit"]');
  if (!date) return;

  note.className = 'availability-note';
  note.textContent = 'Checking availability…';

  fetch('/api/availability?date=' + encodeURIComponent(date))
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var taken = data.taken || [];

      // Reset + re-enable every time option, then disable the taken ones.
      Array.prototype.forEach.call(timeSelect.options, function (opt) {
        if (!opt.value) return; // skip the "Select a time" placeholder
        var isTaken = taken.indexOf(opt.value) !== -1;
        opt.disabled = isTaken;
        opt.textContent = opt.value + (isTaken ? ' — booked' : '');
        if (isTaken && timeSelect.value === opt.value) timeSelect.value = '';
      });

      if (data.full) {
        note.className = 'availability-note full';
        note.textContent = '✕ Fully booked on this date — please choose another day.';
        timeSelect.value = '';
        timeSelect.disabled = true;
        if (submitBtn) submitBtn.disabled = true;
      } else {
        note.className = 'availability-note open';
        note.textContent = '✓ ' + data.remaining + ' session' +
          (data.remaining === 1 ? '' : 's') + ' left on this date.';
        timeSelect.disabled = false;
        if (submitBtn) submitBtn.disabled = false;
      }
    })
    .catch(function () {
      note.className = 'availability-note';
      note.textContent = "Couldn't check availability — you can still submit and we'll confirm.";
    });
}

// Booking form
function submitForm(e) {
  e.preventDefault();

  const form = document.getElementById('booking-form');
  const btn = form.querySelector('button[type="submit"]');
  btn.textContent = 'Sending…';
  btn.disabled = true;

  const data = {
    fname: form.fname.value,
    lname: form.lname.value,
    email: form.email.value,
    phone: form.phone.value,
    service: form.service.value,
    date: form.date.value,
    time: form.time.value,
    message: form.message.value,
  };

  fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then(function (res) {
      return res.json().then(function (body) { return { ok: res.ok, body: body }; });
    })
    .then(function (result) {
      if (result.ok && result.body.success) {
        form.style.display = 'none';
        document.getElementById('form-success').style.display = 'block';
        return;
      }
      // Slot taken or day full between page load and submit — refresh availability.
      if (result.body && (result.body.error === 'slot_taken' || result.body.error === 'full')) {
        alert(result.body.message || 'That time is no longer available. Please pick another.');
        loadAvailability();
      } else {
        alert((result.body && result.body.message) || 'Something went wrong. Please try again.');
      }
      btn.textContent = 'Send Booking Request ✦';
      btn.disabled = false;
    })
    .catch(function () {
      alert('Network error. Please check your connection and try again.');
      btn.textContent = 'Send Booking Request ✦';
      btn.disabled = false;
    });
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
