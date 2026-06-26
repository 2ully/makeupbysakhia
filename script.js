// ═══════════════════════════════════════════
//  i18n — English / Arabic with RTL support
// ═══════════════════════════════════════════
var currentLang = 'en';

var TRANSLATIONS = {
  en: {
    'nav.services': 'Services',
    'nav.gallery': 'Gallery',
    'nav.contact': 'Contact',
    'nav.book': 'Book Online',

    'hero.tag': '✦ Professional Makeup Artist',
    'hero.title': 'Look Your Most <em>Radiant</em> Self',
    'hero.sub': 'Bridal, glam, editorial, and everyday looks crafted with precision and artistry — tailored to celebrate your unique beauty.',
    'hero.book': 'Book a Session',
    'hero.viewGallery': 'View Gallery',

    'explore.label': 'Browse My Work',
    'explore.title': 'Explore by Category',
    'explore.bridal': 'Bridal Looks',
    'explore.glam': 'Glam & Special Events',
    'explore.editorial': 'Editorial & Graduation',
    'explore.more': 'Explore More',

    'services.label': 'What I Offer',
    'services.title': 'Services',
    'services.sub': 'From intimate ceremonies to bold editorial shoots, every service is tailored to your vision.',
    'services.glam.title': 'Glam & Special Events',
    'services.glam.desc': 'Full-glam looks for galas, parties, proms, and celebrations — bold or soft, your choice.',
    'services.glam.price': '23 OMR/person',
    'services.grad.title': 'Graduation makeup',
    'services.grad.desc': 'Fresh, flawless, and photo-ready graduation glam.',
    'services.grad.price': '20 OMR/person',
    'services.note': 'the prices may vary depends on the location',

    'gallery.label': 'Portfolio',
    'gallery.title': 'Gallery',
    'gallery.sub': 'A glimpse into recent work — hover to explore, click to expand.',
    'gallery.all': 'All',
    'gallery.bridal': 'Bridal',
    'gallery.glam': 'Glam',
    'gallery.editorial': 'Editorial',
    'filter.glam': 'Glam & Special Events',
    'filter.editorial': 'Editorial & Graduation',
    'gallery.soon': 'Coming Soon',

    'g1.title': 'Romantic Bridal', 'g1.sub': 'Soft glam · 2025',
    'g2.title': 'Golden Hour Glam', 'g2.sub': 'Evening gala · 2025',
    'g3.title': 'Dark Fantasy', 'g3.sub': 'Fashion editorial · 2024',
    'g4.title': 'Classic Bride', 'g4.sub': 'Wedding · 2024',
    'g5.title': 'Smoky Glam', 'g5.sub': 'Birthday shoot · 2025',
    'g6.title': 'Avant-Garde', 'g6.sub': 'Magazine shoot · 2024',

    'booking.label': "Let's Connect",
    'booking.title': 'Book a Session',
    'booking.sub': "Ready to glow? Fill out the form and I'll get back to you within 24 hours to confirm availability and discuss your vision.",
    'contact.location': 'Available for travel & on-location',
    'contact.hours': 'Sunday – Friday · 1pm – 6pm',

    'form.fname': 'First Name',
    'form.lname': 'Last Name',
    'form.email': 'Email',
    'form.phone': 'Phone',
    'form.service': 'Service',
    'form.date': 'Preferred Date',
    'form.time': 'Preferred Time',
    'form.message': 'Tell Me About Your Vision',
    'form.fnamePh': 'Jane',
    'form.lnamePh': 'Doe',
    'form.messagePh': 'Describe the look you have in mind, event details, skin concerns, inspo images…',
    'form.selectService': 'Select a service',
    'form.selectTime': 'Select a time',
    'opt.glam': 'Glam & Special Events',
    'opt.grad': 'Graduation Makeup',
    'form.submit': 'Send Booking Request ✦',
    'success.title': 'Request Sent!',
    'success.text': "Thank you! I'll be in touch within 24 hours to confirm your session details.",

    'footer.desc': 'Professional makeup artistry for weddings, events, and editorial projects. Making you shine is my passion.',
    'footer.quick': 'Quick Links',
    'footer.bookNow': 'Book Now',
    'footer.glamEvents': 'Glam Events',
    'footer.graduations': 'Graduations',
    'footer.bottom': '© 2026 Mekup by Skhia · All rights reserved · Made with ♥',

    'js.sending': 'Sending…',
    'js.checking': 'Checking availability…',
    'js.booked': ' — booked',
    'js.full': '✕ Fully booked on this date — please choose another day.',
    'js.availError': "Couldn't check availability — you can still submit and we'll confirm.",
    'js.networkError': 'Network error. Please check your connection and try again.',
    'js.genericError': 'Something went wrong. Please try again.',
    'js.slotTaken': 'That time was just booked. Please pick another.',
    'js.dayFull': 'That day is fully booked. Please choose another day.',
  },
  ar: {
    'nav.services': 'الخدمات',
    'nav.gallery': 'المعرض',
    'nav.contact': 'تواصل',
    'nav.book': 'احجزي اونلاين',

    'hero.tag': '✦ خبيرة مكياج محترفة',
    'hero.title': 'إطلالة في غاية <em>الإشراق</em>',
    'hero.sub': 'إطلالات للعرائس والمناسبات والجلسات والمكياج اليومي، مصمّمة بدقّة وإتقان لتُبرز جمالكِ الفريد.',
    'hero.book': 'احجزي جلسة',
    'hero.viewGallery': 'شاهدي الأعمال',

    'explore.label': 'تصفّحي أعمالي',
    'explore.title': 'استكشفي حسب الفئة',
    'explore.bridal': 'إطلالات العرائس',
    'explore.glam': 'الجلام والمناسبات الخاصة',
    'explore.editorial': 'التصوير والتخرّج',
    'explore.more': 'اكتشفي المزيد',

    'services.label': 'ما أُقدّمه',
    'services.title': 'الخدمات',
    'services.sub': 'من المناسبات الخاصة إلى الجلسات الجريئة، كل خدمة مصمّمة حسب رؤيتكِ.',
    'services.glam.title': 'الجلام والمناسبات الخاصة',
    'services.glam.desc': 'إطلالات جلام كاملة للحفلات والمناسبات والاحتفالات — جريئة أو ناعمة، الخيار لكِ.',
    'services.glam.price': '٢٣ ر.ع / للشخص',
    'services.grad.title': 'مكياج التخرّج',
    'services.grad.desc': 'إطلالة تخرّج مشرقة ومثالية وجاهزة للصور.',
    'services.grad.price': '٢٠ ر.ع / للشخص',
    'services.note': 'قد تختلف الأسعار حسب الموقع',

    'gallery.label': 'معرض الأعمال',
    'gallery.title': 'المعرض',
    'gallery.sub': 'لمحة من أحدث الأعمال — مرّري للاستكشاف واضغطي للتكبير.',
    'gallery.all': 'الكل',
    'gallery.bridal': 'عرائس',
    'gallery.glam': 'جلام',
    'gallery.editorial': 'تصوير فنّي',
    'filter.glam': 'الجلام والمناسبات الخاصة',
    'filter.editorial': 'التصوير والتخرّج',
    'gallery.soon': 'قريباً',

    'g1.title': 'عروس رومانسية', 'g1.sub': 'جلام ناعم · ٢٠٢٥',
    'g2.title': 'جلام الساعة الذهبية', 'g2.sub': 'حفل مسائي · ٢٠٢٥',
    'g3.title': 'خيال داكن', 'g3.sub': 'تصوير أزياء · ٢٠٢٤',
    'g4.title': 'عروس كلاسيكية', 'g4.sub': 'زفاف · ٢٠٢٤',
    'g5.title': 'جلام سموكي', 'g5.sub': 'جلسة عيد ميلاد · ٢٠٢٥',
    'g6.title': 'طليعيّ', 'g6.sub': 'تصوير مجلة · ٢٠٢٤',

    'booking.label': 'لنتواصل',
    'booking.title': 'احجزي جلسة',
    'booking.sub': 'جاهزة للتألّق؟ املئي النموذج وسأعاودِ التواصل معكِ خلال ٢٤ ساعة لتأكيد التوفّر ومناقشة رؤيتكِ.',
    'contact.location': 'متاحة للتنقّل والعمل في الموقع',
    'contact.hours': 'الأحد – الجمعة · ١ ظهراً – ٦ مساءً',

    'form.fname': 'الاسم الأول',
    'form.lname': 'اسم العائلة',
    'form.email': 'البريد الإلكتروني',
    'form.phone': 'رقم الهاتف',
    'form.service': 'الخدمة',
    'form.date': 'التاريخ المفضّل',
    'form.time': 'الوقت المفضّل',
    'form.message': 'أخبريني عن رؤيتكِ',
    'form.fnamePh': 'سارة',
    'form.lnamePh': 'الهنائي',
    'form.messagePh': 'صِفي الإطلالة التي تتخيّلينها، تفاصيل المناسبة، أي ملاحظات أو صور ملهمة…',
    'form.selectService': 'اختاري الخدمة',
    'form.selectTime': 'اختاري الوقت',
    'opt.glam': 'الجلام والمناسبات الخاصة',
    'opt.grad': 'مكياج التخرّج',
    'form.submit': 'أرسلي طلب الحجز ✦',
    'success.title': 'تم إرسال الطلب!',
    'success.text': 'شكراً لكِ! سأتواصل معكِ خلال ٢٤ ساعة لتأكيد تفاصيل جلستكِ.',

    'footer.desc': 'فنّ مكياج احترافي للأعراس والمناسبات والجلسات. تألّقكِ هو شغفي.',
    'footer.quick': 'روابط سريعة',
    'footer.bookNow': 'احجزي الآن',
    'footer.glamEvents': 'الجلام والمناسبات',
    'footer.graduations': 'التخرّج',
    'footer.bottom': '© ٢٠٢٦ Makeup by Sakhia · جميع الحقوق محفوظة · صُنع بحب ♥',

    'js.sending': 'جارٍ الإرسال…',
    'js.checking': 'جارٍ التحقّق من التوفّر…',
    'js.booked': ' — محجوز',
    'js.full': '✕ محجوز بالكامل في هذا اليوم — يرجى اختيار يوم آخر.',
    'js.availError': 'تعذّر التحقّق من التوفّر — يمكنكِ الإرسال وسنؤكّد لكِ.',
    'js.networkError': 'خطأ في الاتصال. يرجى التحقّق من اتصالكِ والمحاولة مرة أخرى.',
    'js.genericError': 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
    'js.slotTaken': 'تم حجز هذا الوقت للتو. يرجى اختيار وقت آخر.',
    'js.dayFull': 'هذا اليوم محجوز بالكامل. يرجى اختيار يوم آخر.',
  },
};

function t(key) {
  var dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  return dict[key] != null ? dict[key] : (TRANSLATIONS.en[key] != null ? TRANSLATIONS.en[key] : key);
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
    el.innerHTML = t(el.getAttribute('data-i18n-html'));
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
    el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
  });
}

function setLang(lang) {
  if (lang !== 'ar') lang = 'en';
  currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  try { localStorage.setItem('lang', lang); } catch (e) { /* ignore */ }

  applyTranslations();

  // The toggle shows the OTHER language you can switch to.
  document.querySelectorAll('.lang-toggle').forEach(function (b) {
    b.textContent = lang === 'ar' ? 'English' : 'العربية';
  });

  // If a date is already picked, refresh availability text in the new language.
  var dateInput = document.getElementById('date');
  if (dateInput && dateInput.value) loadAvailability();
}

function toggleLang() {
  setLang(currentLang === 'ar' ? 'en' : 'ar');
}

(function initLang() {
  var saved = null;
  try { saved = localStorage.getItem('lang'); } catch (e) { /* ignore */ }
  var lang = saved;
  if (!lang) {
    var browser = (navigator.language || navigator.userLanguage || '').toLowerCase();
    lang = browser.indexOf('ar') === 0 ? 'ar' : 'en';
  }
  setLang(lang);
})();

// Mobile nav — open/close the dropdown menu (class on <nav>)
function toggleMenu() {
  document.querySelector('nav').classList.toggle('menu-open');
}
function closeMenu() {
  document.querySelector('nav').classList.remove('menu-open');
}

// Close the dropdown when clicking/tapping anywhere outside the nav.
document.addEventListener('click', function (e) {
  var nav = document.querySelector('nav');
  if (nav.classList.contains('menu-open') && !nav.contains(e.target)) {
    closeMenu();
  }
});

// ── Gallery carousel (filter + seamless one-way autoplay + arrows) ──
var galleryStep = 0;       // center-to-center distance between cards (px)
var gallerySetWidth = 0;   // width of one full set of visible cards (px)
var galleryTimer = null;

// Show the chosen category (or all), then append a duplicate set of the
// visible cards so the strip can loop rightward forever with no jump back.
function galleryBuild(cat) {
  var grid = document.getElementById('gallery-grid');
  if (!grid) return;

  // Drop any clones from a previous build.
  Array.prototype.forEach.call(grid.querySelectorAll('.gallery-clone'), function (c) { c.remove(); });

  var originals = Array.prototype.filter.call(
    grid.querySelectorAll('.gallery-item'),
    function (it) { return !it.classList.contains('gallery-clone'); }
  );
  originals.forEach(function (it) {
    it.style.display = (cat === 'all' || it.dataset.category === cat) ? '' : 'none';
  });

  var visible = originals.filter(function (it) { return it.style.display !== 'none'; });
  visible.forEach(function (it) {
    var clone = it.cloneNode(true);
    clone.classList.add('gallery-clone');
    grid.appendChild(clone);
  });

  grid.scrollLeft = 0;
  // Measure once the new layout has settled.
  requestAnimationFrame(function () {
    if (visible.length >= 2) {
      galleryStep = visible[1].getBoundingClientRect().left - visible[0].getBoundingClientRect().left;
    } else if (visible.length === 1) {
      galleryStep = visible[0].getBoundingClientRect().width + 16;
    } else {
      galleryStep = 0;
    }
    gallerySetWidth = galleryStep * visible.length;
  });
}

// After any scroll settles, fold the position back into the first set — the
// duplicate set makes this instant shift invisible.
function galleryNormalize() {
  var grid = document.getElementById('gallery-grid');
  if (!grid || !gallerySetWidth) return;
  if (grid.scrollLeft >= gallerySetWidth - 1) {
    grid.scrollLeft -= gallerySetWidth;
  } else if (grid.scrollLeft < 0) {
    grid.scrollLeft += gallerySetWidth;
  }
}

function galleryShift(dir) {
  var grid = document.getElementById('gallery-grid');
  if (!grid || !galleryStep) return;
  // Going back from the very start: hop into the duplicate first (seamless).
  if (dir < 0 && grid.scrollLeft < galleryStep * 0.5) {
    grid.scrollLeft += gallerySetWidth;
  }
  grid.scrollBy({ left: dir * galleryStep, behavior: 'smooth' });
}

function galleryAuto() {
  if (galleryTimer) clearInterval(galleryTimer);
  galleryTimer = setInterval(function () { galleryShift(1); }, 4000);
}

// Arrows also reset the timer so it doesn't tick right after a tap.
function galleryNext() { galleryShift(1); galleryAuto(); }
function galleryPrev() { galleryShift(-1); galleryAuto(); }

// Gallery filter — show a category (or all) and (re)start the loop.
function filterGallery(cat) {
  document.querySelectorAll('.filter-btn').forEach(function (b) {
    b.classList.toggle('active', b.dataset.cat === cat);
  });
  galleryBuild(cat);
  galleryAuto();
}

// Default to All on load.
filterGallery('all');

// Pause autoplay on hover (desktop); fold the loop after any scroll settles.
(function () {
  var grid = document.getElementById('gallery-grid');
  var carousel = document.querySelector('.gallery-carousel');
  if (!grid) return;
  if (carousel) {
    carousel.addEventListener('mouseenter', function () {
      if (galleryTimer) { clearInterval(galleryTimer); galleryTimer = null; }
    });
    carousel.addEventListener('mouseleave', galleryAuto);
  }
  var debounce;
  grid.addEventListener('scroll', function () {
    clearTimeout(debounce);
    debounce = setTimeout(galleryNormalize, 150);
  });
})();

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
  var d = new Date();
  var iso = d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
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
  note.textContent = t('js.checking');

  fetch('/api/availability?date=' + encodeURIComponent(date))
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var taken = data.taken || [];

      // Reset + re-enable every time option, then disable the taken ones.
      Array.prototype.forEach.call(timeSelect.options, function (opt) {
        if (!opt.value) return; // skip the "Select a time" placeholder
        var isTaken = taken.indexOf(opt.value) !== -1;
        opt.disabled = isTaken;
        opt.textContent = opt.value + (isTaken ? t('js.booked') : '');
        if (isTaken && timeSelect.value === opt.value) timeSelect.value = '';
      });

      if (data.full) {
        note.className = 'availability-note full';
        note.textContent = t('js.full');
        timeSelect.value = '';
        timeSelect.disabled = true;
        if (submitBtn) submitBtn.disabled = true;
      } else {
        note.className = 'availability-note open';
        if (currentLang === 'ar') {
          note.textContent = '✓ المتبقّي ' + data.remaining + ' من 4 جلسات في هذا اليوم.';
        } else {
          note.textContent = '✓ ' + data.remaining + ' session' +
            (data.remaining === 1 ? '' : 's') + ' left on this date.';
        }
        timeSelect.disabled = false;
        if (submitBtn) submitBtn.disabled = false;
      }
    })
    .catch(function () {
      note.className = 'availability-note';
      note.textContent = t('js.availError');
    });
}

// Booking form
function submitForm(e) {
  e.preventDefault();

  const form = document.getElementById('booking-form');
  const btn = form.querySelector('button[type="submit"]');
  btn.textContent = t('js.sending');
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
    lang: currentLang,
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
      if (result.body && result.body.error === 'slot_taken') {
        alert(t('js.slotTaken'));
        loadAvailability();
      } else if (result.body && result.body.error === 'full') {
        alert(t('js.dayFull'));
        loadAvailability();
      } else {
        alert(t('js.genericError'));
      }
      btn.textContent = t('form.submit');
      btn.disabled = false;
    })
    .catch(function () {
      alert(t('js.networkError'));
      btn.textContent = t('form.submit');
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
