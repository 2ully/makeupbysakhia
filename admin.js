// ═══════════════════════════════════════════
//  Owner dashboard — bookings, gallery, closed days
//  Everything here talks to /api/admin/*, which checks the session cookie.
// ═══════════════════════════════════════════

var WHATSAPP_COUNTRY = '968'; // Oman, used when a phone number has no country code.
var state = { scope: 'upcoming', images: [], categories: [], blocks: [] };

// ── Small helpers ──
function $(id) { return document.getElementById(id); }

function api(path, options) {
  var opts = options || {};
  if (opts.body && typeof opts.body !== 'string') {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(opts.body);
  }
  return fetch(path, opts).then(function (res) {
    return res.json().catch(function () { return {}; }).then(function (body) {
      if (res.status === 401) { showLogin(); throw new Error('Signed out'); }
      if (!res.ok) throw new Error(body.error || 'Something went wrong');
      return body;
    });
  });
}

function toast(message, isError) {
  var el = $('toast');
  el.textContent = message;
  el.className = 'toast' + (isError ? ' error' : '');
  el.hidden = false;
  clearTimeout(el._timer);
  el._timer = setTimeout(function () { el.hidden = true; }, 3200);
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Turn whatever the customer typed into a wa.me number: digits only, with a
// country code. "9065 3614" and "0090653614" both become 96890653614.
function waNumber(phone) {
  var digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.slice(0, 2) === '00') digits = digits.slice(2);
  if (digits.length === 8) digits = WHATSAPP_COUNTRY + digits;          // local Omani number
  if (digits.length === 9 && digits.charAt(0) === '0') digits = WHATSAPP_COUNTRY + digits.slice(1);
  return digits;
}

function prettyDate(iso) {
  var parts = String(iso || '').split('-');
  if (parts.length !== 3) return iso || '';
  var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function todayIso() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

// ── Sign in / out ──
function showLogin() {
  $('login-view').hidden = false;
  $('dash-view').hidden = true;
}

function showDashboard() {
  $('login-view').hidden = true;
  $('dash-view').hidden = false;
  loadBookings(state.scope);
  refreshGallery();
  loadBlocks();
}

function signIn(e) {
  e.preventDefault();
  var btn = $('login-btn');
  var error = $('login-error');
  error.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Checking…';

  api('/api/admin/login', { method: 'POST', body: { password: $('password').value } })
    .then(function () {
      $('password').value = '';
      showDashboard();
    })
    .catch(function (err) { error.textContent = err.message; })
    .then(function () {
      btn.disabled = false;
      btn.textContent = 'Sign In';
    });
}

function signOut() {
  api('/api/admin/login', { method: 'DELETE' })
    .catch(function () { /* signing out locally is enough */ })
    .then(showLogin);
}

// ── Tabs ──
function showTab(name) {
  ['bookings', 'gallery', 'blocks'].forEach(function (tab) {
    $('tab-' + tab).hidden = tab !== name;
  });
  document.querySelectorAll('.tab').forEach(function (b) {
    b.classList.toggle('active', b.dataset.tab === name);
  });
}

// ── Bookings ──
function loadBookings(scope) {
  state.scope = scope || state.scope;
  document.querySelectorAll('.chip').forEach(function (b) {
    b.classList.toggle('active', b.dataset.scope === state.scope);
  });
  $('bookings-list').innerHTML = '<p class="empty">Loading…</p>';

  api('/api/admin/bookings?scope=' + encodeURIComponent(state.scope))
    .then(function (data) {
      $('stat-pending').textContent = data.stats.pending;
      $('stat-upcoming').textContent = data.stats.upcoming;
      renderBookings(data.bookings);
    })
    .catch(function (err) {
      $('bookings-list').innerHTML = '<p class="empty">' + escapeHtml(err.message) + '</p>';
    });
}

function renderBookings(bookings) {
  var list = $('bookings-list');
  if (!bookings.length) {
    list.innerHTML = '<p class="empty">Nothing here yet.</p>';
    return;
  }

  list.innerHTML = bookings.map(function (b) {
    var name = escapeHtml((b.fname || '') + ' ' + (b.lname || '')).trim();
    var wa = waNumber(b.phone);
    var contact = [];
    if (b.phone) contact.push('<a href="tel:' + escapeHtml(b.phone) + '">' + escapeHtml(b.phone) + '</a>');
    if (b.email) contact.push('<a href="mailto:' + escapeHtml(b.email) + '">' + escapeHtml(b.email) + '</a>');

    var actions = [];
    if (b.status !== 'confirmed') {
      actions.push('<button class="btn btn-small" onclick="setStatus(\'' + b.id + '\',\'confirmed\')">✓ Confirm</button>');
    }
    if (b.status !== 'declined') {
      actions.push('<button class="ghost-btn" onclick="setStatus(\'' + b.id + '\',\'declined\')">✕ Decline</button>');
    }
    if (wa) {
      actions.push('<a class="wa-btn" target="_blank" rel="noopener" href="' + whatsappReply(b, wa) + '">💬 WhatsApp</a>');
    }
    actions.push('<button class="ghost-btn danger" onclick="deleteBooking(\'' + b.id + '\')">Delete</button>');

    return '<article class="card status-' + escapeHtml(b.status) + '">' +
      '<div class="card-top">' +
        '<div><h3>' + name + '</h3>' +
          '<p class="card-when">' + escapeHtml(prettyDate(b.date)) + ' · ' + escapeHtml(b.time) + '</p></div>' +
        '<span class="badge badge-' + escapeHtml(b.status) + '">' + escapeHtml(b.status) + '</span>' +
      '</div>' +
      '<p class="card-service">' + escapeHtml(b.service || 'No service chosen') +
        (b.source === 'manual' ? ' <span class="tag">added by hand</span>' : '') + '</p>' +
      (contact.length ? '<p class="card-contact">' + contact.join(' · ') + '</p>' : '') +
      (b.message ? '<p class="card-note">“' + escapeHtml(b.message) + '”</p>' : '') +
      '<div class="card-actions">' + actions.join('') + '</div>' +
    '</article>';
  }).join('');
}

// Pre-written WhatsApp reply to the customer, in the language they booked in.
function whatsappReply(b, number) {
  var text = b.lang === 'ar'
    ? 'مرحباً ' + (b.fname || '') + '، تم تأكيد حجزكِ يوم ' + b.date + ' الساعة ' + b.time + ' ✦'
    : 'Hi ' + (b.fname || '') + ', your booking on ' + b.date + ' at ' + b.time + ' is confirmed ✦';
  return 'https://wa.me/' + number + '?text=' + encodeURIComponent(text);
}

function setStatus(id, status) {
  api('/api/admin/bookings', { method: 'PATCH', body: { id: id, status: status } })
    .then(function () {
      toast(status === 'confirmed' ? 'Booking confirmed' : 'Booking declined — the slot is open again');
      loadBookings();
    })
    .catch(function (err) { toast(err.message, true); });
}

function deleteBooking(id) {
  if (!confirm('Delete this booking for good?')) return;
  api('/api/admin/bookings', { method: 'DELETE', body: { id: id } })
    .then(function () { toast('Booking deleted'); loadBookings(); })
    .catch(function (err) { toast(err.message, true); });
}

function toggleAddBooking() {
  var form = $('add-booking');
  form.hidden = !form.hidden;
  if (!form.hidden) form.date.value = todayIso();
}

function addBooking(e) {
  e.preventDefault();
  var form = e.target;
  api('/api/admin/bookings', {
    method: 'POST',
    body: {
      fname: form.fname.value, lname: form.lname.value, phone: form.phone.value,
      email: form.email.value, date: form.date.value, time: form.time.value,
      service: form.service.value, message: form.message.value,
    },
  })
    .then(function () {
      form.reset();
      form.hidden = true;
      toast('Booking added');
      loadBookings();
    })
    .catch(function (err) { toast(err.message, true); });
}

// ── Gallery ──
function loadGallery() {
  return api('/api/admin/gallery')
    .then(function (data) {
      state.images = data.images;
      $('stat-images').textContent = data.images.length;
      renderGallery();
    })
    .catch(function (err) {
      $('gallery-list').innerHTML = '<p class="empty">' + escapeHtml(err.message) + '</p>';
    });
}

// Photos and cards affect each other's display (counts, dropdowns), so after
// changing either, reload both.
function refreshGallery() {
  return loadGallery().then(loadCategories);
}

function renderGallery() {
  var list = $('gallery-list');
  if (!state.images.length) {
    list.innerHTML = '<p class="empty">No images yet — add your first photo above.</p>';
    return;
  }

  list.innerHTML = state.images.map(function (img, i) {
    var options = state.categories.map(function (c) {
      return '<option value="' + escapeHtml(c.key) + '"' +
        (img.category === c.key ? ' selected' : '') + '>' + escapeHtml(c.title_en) + '</option>';
    }).join('');

    return '<figure class="img-card">' +
      '<img src="' + escapeHtml(img.url) + '" alt="' + escapeHtml(img.title || '') + '" loading="lazy" />' +
      '<figcaption>' +
        '<input class="img-title" value="' + escapeHtml(img.title || '') + '" placeholder="Title (optional)" ' +
          'onchange="updateImage(\'' + img.id + '\', { title: this.value })" />' +
        '<select onchange="updateImage(\'' + img.id + '\', { category: this.value })">' + options + '</select>' +
        '<div class="img-actions">' +
          '<button class="ghost-btn" title="Move earlier"' + (i === 0 ? ' disabled' : '') +
            ' onclick="updateImage(\'' + img.id + '\', { move: \'up\' })">↑</button>' +
          '<button class="ghost-btn" title="Move later"' + (i === state.images.length - 1 ? ' disabled' : '') +
            ' onclick="updateImage(\'' + img.id + '\', { move: \'down\' })">↓</button>' +
          '<button class="ghost-btn danger" onclick="deleteImage(\'' + img.id + '\')">Delete</button>' +
        '</div>' +
      '</figcaption>' +
    '</figure>';
  }).join('');
}

// ── Category cards ──
// Each card is one "Explore by Category" tile and one gallery filter button.
// With no photo, a card keeps the colour gradient built into the site.
function loadCategories() {
  return api('/api/admin/categories')
    .then(function (data) {
      state.categories = data.categories;
      renderCategories();
      fillCategorySelect();
    })
    .catch(function (err) { toast(err.message, true); });
}

function renderCategories() {
  var wrap = $('covers');
  if (!state.categories.length) {
    wrap.innerHTML = '<p class="empty">No cards yet — add one below.</p>';
    return;
  }

  wrap.innerHTML = state.categories.map(function (c, i) {
    var style = c.cover_url ? ' style="background-image:url(\'' + escapeHtml(c.cover_url) + '\')"' : '';
    return '<div class="cover-card">' +
      '<div class="cover-preview"' + style + '>' + (c.cover_url ? '' : 'No photo — plain colour') + '</div>' +
      '<div class="cover-meta">' +
        '<input class="img-title" value="' + escapeHtml(c.title_en) + '" placeholder="Title in English" ' +
          'onchange="updateCategory(\'' + c.id + '\', { title_en: this.value })" />' +
        '<input class="img-title" dir="rtl" value="' + escapeHtml(c.title_ar || '') + '" placeholder="Title in Arabic" ' +
          'onchange="updateCategory(\'' + c.id + '\', { title_ar: this.value })" />' +
        '<p class="cover-count">' + c.image_count + ' photo' + (c.image_count === 1 ? '' : 's') + '</p>' +
        '<div class="img-actions">' +
          '<label class="ghost-btn cover-pick">Photo' +
            '<input type="file" accept="image/jpeg,image/png,image/webp" hidden ' +
              'onchange="uploadCover(\'' + c.id + '\', this.files[0]); this.value=\'\';" /></label>' +
          '<button class="ghost-btn" title="Move earlier"' + (i === 0 ? ' disabled' : '') +
            ' onclick="updateCategory(\'' + c.id + '\', { move: \'up\' })">↑</button>' +
          '<button class="ghost-btn" title="Move later"' + (i === state.categories.length - 1 ? ' disabled' : '') +
            ' onclick="updateCategory(\'' + c.id + '\', { move: \'down\' })">↓</button>' +
        '</div>' +
        '<div class="img-actions">' +
          (c.cover_url
            ? '<button class="ghost-btn" onclick="updateCategory(\'' + c.id + '\', { clearCover: true })">Clear photo</button>'
            : '') +
          '<button class="ghost-btn danger" onclick="deleteCategory(\'' + c.id + '\')">Delete card</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

// Keep the "Add to:" dropdown in step with the cards that exist.
function fillCategorySelect() {
  var select = $('upload-category');
  var chosen = select.value;
  select.innerHTML = state.categories.map(function (c) {
    return '<option value="' + escapeHtml(c.key) + '">' + escapeHtml(c.title_en) + '</option>';
  }).join('');
  if (chosen) select.value = chosen;
}

function addCategory(e) {
  e.preventDefault();
  var form = e.target;
  api('/api/admin/categories', {
    method: 'POST',
    body: { title_en: form.title_en.value, title_ar: form.title_ar.value },
  })
    .then(function () {
      form.reset();
      toast('Card added');
      return loadCategories();
    })
    .catch(function (err) { toast(err.message, true); });
}

function updateCategory(id, patch) {
  patch.id = id;
  api('/api/admin/categories', { method: 'PATCH', body: patch })
    .then(function () { return loadCategories(); })
    .catch(function (err) { toast(err.message, true); });
}

function deleteCategory(id) {
  if (!confirm('Delete this card from the home page?')) return;
  api('/api/admin/categories', { method: 'DELETE', body: { id: id } })
    .then(function () { toast('Card deleted'); return loadCategories(); })
    .catch(function (err) { toast(err.message, true); });
}

function uploadCover(id, file) {
  if (!file) return;
  toast('Uploading…');
  shrinkImage(file, 1400)
    .then(function (dataUrl) {
      return api('/api/admin/categories', { method: 'PATCH', body: { id: id, dataUrl: dataUrl } });
    })
    .then(function () { toast('Card photo updated'); return loadCategories(); })
    .catch(function (err) { toast(err.message, true); });
}

function updateImage(id, patch) {
  patch.id = id;
  api('/api/admin/gallery', { method: 'PATCH', body: patch })
    .then(function () { refreshGallery(); })
    .catch(function (err) { toast(err.message, true); });
}

function deleteImage(id) {
  if (!confirm('Remove this image from the gallery?')) return;
  api('/api/admin/gallery', { method: 'DELETE', body: { id: id } })
    .then(function () { toast('Image removed'); refreshGallery(); })
    .catch(function (err) { toast(err.message, true); });
}

// Shrink a photo in the browser before uploading: phone photos are often 5MB+,
// which is bigger than the server accepts and far bigger than the page needs.
function shrinkImage(file, maxSize) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onerror = function () { reject(new Error('Could not read that file')); };
    reader.onload = function () {
      var img = new Image();
      img.onerror = function () { reject(new Error('That file is not an image')); };
      img.onload = function () {
        var scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function uploadFiles(files) {
  var queue = Array.prototype.slice.call(files);
  if (!queue.length) return;
  $('file-input').value = '';

  var category = $('upload-category').value;
  var progress = $('upload-progress');
  progress.hidden = false;

  var done = 0;
  function next() {
    if (!queue.length) {
      progress.hidden = true;
      refreshGallery();
      return;
    }
    var file = queue.shift();
    progress.textContent = 'Uploading ' + (done + 1) + ' of ' + (done + queue.length + 1) + '…';

    shrinkImage(file, 1600)
      .then(function (dataUrl) {
        return api('/api/admin/gallery', {
          method: 'POST',
          body: { dataUrl: dataUrl, category: category, title: file.name.replace(/\.[^.]+$/, '') },
        });
      })
      .then(function () { done += 1; })
      .catch(function (err) { toast(file.name + ': ' + err.message, true); })
      .then(next);
  }
  next();
}

// ── Closed days ──
function loadBlocks() {
  api('/api/admin/blocks')
    .then(function (data) {
      state.blocks = data.blocks;
      $('stat-blocks').textContent = data.blocks.length;
      renderBlocks();
    })
    .catch(function (err) {
      $('blocks-list').innerHTML = '<p class="empty">' + escapeHtml(err.message) + '</p>';
    });
}

function renderBlocks() {
  var list = $('blocks-list');
  if (!state.blocks.length) {
    list.innerHTML = '<p class="empty">Nothing closed — every day is open for booking.</p>';
    return;
  }

  list.innerHTML = state.blocks.map(function (b) {
    return '<article class="card block-card">' +
      '<div class="card-top">' +
        '<div><h3>' + escapeHtml(prettyDate(b.date)) + '</h3>' +
          '<p class="card-when">' + (b.time ? escapeHtml(b.time) + ' only' : 'Whole day closed') +
          (b.reason ? ' · ' + escapeHtml(b.reason) : '') + '</p></div>' +
        '<button class="ghost-btn danger" onclick="deleteBlock(\'' + b.id + '\')">Reopen</button>' +
      '</div>' +
    '</article>';
  }).join('');
}

function addBlock(e) {
  e.preventDefault();
  var form = e.target;
  api('/api/admin/blocks', {
    method: 'POST',
    body: { date: form.date.value, time: form.time.value, reason: form.reason.value },
  })
    .then(function () {
      form.reset();
      toast('Closed for booking');
      loadBlocks();
    })
    .catch(function (err) { toast(err.message, true); });
}

function deleteBlock(id) {
  api('/api/admin/blocks', { method: 'DELETE', body: { id: id } })
    .then(function () { toast('Open for booking again'); loadBlocks(); })
    .catch(function (err) { toast(err.message, true); });
}

// ── Start ──
// Ask the server whether the cookie from a previous visit is still valid.
api('/api/admin/login')
  .then(function (data) { if (data.authenticated) showDashboard(); else showLogin(); })
  .catch(showLogin);
