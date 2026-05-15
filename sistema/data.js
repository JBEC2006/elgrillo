/* ─── El Grillo — Data Layer ─────────────────────────────────────────────── */
(function () {
  'use strict';

  var STORAGE_KEY = 'elgrillo_appointments';
  var SESSION_KEY = 'elgrillo_session';
  var ADMIN_PIN   = '0000';

  var BARBERS = [
    { id: 'joel',      name: 'Joel Garabato',  pin: '1111', color: '#B8894A', initials: 'JG', note: 'No atiende niñas', photoId: 'photo-1507003211169-0a1dd7228f2d', active: true },
    { id: 'gerardo',   name: 'Gerardo Arocha', pin: '2222', color: '#4A7B6B', initials: 'GA', note: '',                  photoId: 'photo-1506794778202-cad84cf45f1d', active: true },
    { id: 'alejandro', name: 'Alejandro Sugo', pin: '3333', color: '#6B5C4A', initials: 'AS', note: '',                  photoId: 'photo-1500648767791-00dcc994a43e', active: true },
    { id: 'david',     name: 'David',          pin: '4444', color: '#4A5C6B', initials: 'D',  note: 'No atiende niñas', photoId: 'photo-1472099645785-5658abf4ff4e', active: true }
  ];

  var STATUS_LABELS = {
    pending:   'Pendiente',
    confirmed: 'Confirmado',
    completed: 'Completado',
    cancelled: 'Cancelado',
    noshow:    'No vino'
  };

  /* ── Utilities ─────────────────────────────────────────────────────────── */
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function addDays(dateStr, n) {
    var d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function isSunday(dateStr) {
    return new Date(dateStr + 'T12:00:00').getDay() === 0;
  }

  function isSaturday(dateStr) {
    return new Date(dateStr + 'T12:00:00').getDay() === 6;
  }

  var DAYS_ES   = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  var DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  var MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                   'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  function formatDateLong(dateStr) {
    var d   = new Date(dateStr + 'T12:00:00');
    var dow = DAYS_ES[d.getDay()];
    return dow + ' ' + d.getDate() + ' de ' + MONTHS_ES[d.getMonth()] + ' de ' + d.getFullYear();
  }

  function formatDateShort(dateStr) {
    var d   = new Date(dateStr + 'T12:00:00');
    var dow = DAYS_SHORT[d.getDay()];
    return dow + ' ' + d.getDate() + ' ' + MONTHS_ES[d.getMonth()];
  }

  function formatDateMedium(dateStr) {
    var d = new Date(dateStr + 'T12:00:00');
    return DAYS_ES[d.getDay()] + ', ' + d.getDate() + ' de ' + MONTHS_ES[d.getMonth()];
  }

  function genId() {
    return 'apt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  }

  function timeToMinutes(t) {
    var parts = t.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  /* ── Storage ───────────────────────────────────────────────────────────── */
  function loadAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveAll(apts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apts));
  }

  /* ── Auth ──────────────────────────────────────────────────────────────── */
  function authenticate(barberId, pin) {
    var barber = BARBERS.find(function (b) { return b.id === barberId && b.active; });
    if (barber && barber.pin === pin) return barber;
    return null;
  }

  function authenticateAdmin(pin) {
    return pin === ADMIN_PIN;
  }

  /* ── Session ───────────────────────────────────────────────────────────── */
  function getSession() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setSession(barberId, isAdmin) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ barberId: barberId, isAdmin: !!isAdmin }));
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function requireAuth() {
    var s = getSession();
    if (!s) {
      window.location.href = 'login.html';
      return null;
    }
    return s;
  }

  function requireAdmin() {
    var s = getSession();
    if (!s || !s.isAdmin) {
      window.location.href = 'login.html';
      return null;
    }
    return s;
  }

  /* ── Barbers ───────────────────────────────────────────────────────────── */
  function getBarbers() {
    return BARBERS.filter(function (b) { return b.active; });
  }

  function getBarberById(id) {
    return BARBERS.find(function (b) { return b.id === id; }) || null;
  }

  function unsplashUrl(photoId, w, h) {
    return 'https://images.unsplash.com/' + photoId +
      '?w=' + w + '&h=' + h + '&q=80&auto=format&fit=crop&crop=faces';
  }

  /* ── Appointments CRUD ─────────────────────────────────────────────────── */
  function getAll() {
    return loadAll();
  }

  function getByBarberDate(barberId, date) {
    return loadAll()
      .filter(function (a) { return a.barberId === barberId && a.date === date; })
      .sort(function (a, b) { return timeToMinutes(a.time) - timeToMinutes(b.time); });
  }

  function getAllByDate(date) {
    return loadAll()
      .filter(function (a) { return a.date === date; })
      .sort(function (a, b) { return timeToMinutes(a.time) - timeToMinutes(b.time); });
  }

  function add(data) {
    var apts = loadAll();
    var apt = Object.assign({
      id: genId(),
      status: 'pending',
      whatsapp: false,
      notes: '',
      createdAt: new Date().toISOString()
    }, data);
    apts.push(apt);
    saveAll(apts);
    return apt;
  }

  function updateStatus(id, status) {
    var apts = loadAll();
    var apt  = apts.find(function (a) { return a.id === id; });
    if (apt) {
      apt.status = status;
      saveAll(apts);
    }
    return apt || null;
  }

  function deleteApt(id) {
    var apts = loadAll().filter(function (a) { return a.id !== id; });
    saveAll(apts);
  }

  /* ── Stats ─────────────────────────────────────────────────────────────── */
  function calcStats(list) {
    var s = { total: list.length, pending: 0, confirmed: 0, completed: 0, cancelled: 0, noshow: 0 };
    list.forEach(function (a) { if (s[a.status] !== undefined) s[a.status]++; });
    return s;
  }

  function getDayStats(date) {
    return calcStats(getAllByDate(date));
  }

  function getBarberDayStats(barberId, date) {
    return calcStats(getByBarberDate(barberId, date));
  }

  /* ── Seed demo data ────────────────────────────────────────────────────── */
  function seedIfEmpty() {
    var today = todayStr();
    var existing = loadAll().filter(function (a) { return a.date === today; });
    if (existing.length > 0) return;

    var demos = [
      { barberId: 'joel',      clientName: 'Matías Rodríguez', clientPhone: '099 112 233', date: today, time: '08:30', status: 'completed', whatsapp: true  },
      { barberId: 'joel',      clientName: 'Sebastián Torres',  clientPhone: '098 445 566', date: today, time: '09:30', status: 'confirmed', whatsapp: false },
      { barberId: 'joel',      clientName: 'Lucas Fernández',   clientPhone: '097 778 899', date: today, time: '11:00', status: 'pending',   whatsapp: true  },
      { barberId: 'joel',      clientName: 'Andrés Méndez',     clientPhone: '096 001 122', date: today, time: '14:00', status: 'pending',   whatsapp: false },
      { barberId: 'gerardo',   clientName: 'Carlos García',     clientPhone: '099 334 455', date: today, time: '09:00', status: 'confirmed', whatsapp: true  },
      { barberId: 'gerardo',   clientName: 'Felipe Morales',    clientPhone: '098 667 788', date: today, time: '10:30', status: 'pending',   whatsapp: false },
      { barberId: 'gerardo',   clientName: 'Diego Suárez',      clientPhone: '097 990 011', date: today, time: '13:00', status: 'noshow',    whatsapp: true  },
      { barberId: 'alejandro', clientName: 'Nicolás Pérez',     clientPhone: '099 223 344', date: today, time: '08:00', status: 'completed', whatsapp: false },
      { barberId: 'alejandro', clientName: 'Pablo Gómez',       clientPhone: '098 556 677', date: today, time: '10:00', status: 'confirmed', whatsapp: true  },
      { barberId: 'alejandro', clientName: 'Ramiro Castro',     clientPhone: '097 889 900', date: today, time: '12:30', status: 'pending',   whatsapp: true  },
      { barberId: 'david',     clientName: 'Emilio Vargas',     clientPhone: '099 445 556', date: today, time: '09:00', status: 'completed', whatsapp: false },
      { barberId: 'david',     clientName: 'Tomás Herrera',     clientPhone: '098 778 889', date: today, time: '11:30', status: 'pending',   whatsapp: true  }
    ];

    var apts = loadAll();
    demos.forEach(function (d) {
      apts.push(Object.assign({ id: genId(), notes: '', createdAt: new Date().toISOString() }, d));
    });
    saveAll(apts);
  }

  /* ── Public API ─────────────────────────────────────────────────────────── */
  window.GrilloData = {
    BARBERS: BARBERS,
    STATUS_LABELS: STATUS_LABELS,

    authenticate: authenticate,
    authenticateAdmin: authenticateAdmin,

    getSession: getSession,
    setSession: setSession,
    clearSession: clearSession,
    requireAuth: requireAuth,
    requireAdmin: requireAdmin,

    getBarbers: getBarbers,
    getBarberById: getBarberById,
    unsplashUrl: unsplashUrl,

    getAll: getAll,
    getByBarberDate: getByBarberDate,
    getAllByDate: getAllByDate,
    add: add,
    updateStatus: updateStatus,
    deleteApt: deleteApt,

    getDayStats: getDayStats,
    getBarberDayStats: getBarberDayStats,

    todayStr: todayStr,
    addDays: addDays,
    isSunday: isSunday,
    isSaturday: isSaturday,
    formatDateLong: formatDateLong,
    formatDateShort: formatDateShort,
    formatDateMedium: formatDateMedium,
    timeToMinutes: timeToMinutes,

    seedIfEmpty: seedIfEmpty
  };

}());
