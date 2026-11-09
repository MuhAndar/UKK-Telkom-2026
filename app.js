// ============================================================
// Penilaian UKK SMK Rekayasa Perangkat Lunak - Tenaga Ahli
// Responsive Mobile Web App - Optimized for Poco F7 & Mobile
// ============================================================

// App State
const state = {
  students: [],
  indicators: [],
  examDays: [],
  currentDayId: null,
  currentStudentId: null,
  activeFilter: 'all',
  searchQuery: '',
  historyStack: ['days'],
  googleSheetUrl: localStorage.getItem('ukk_gsheet_url') || '',
  isDarkMode: localStorage.getItem('ukk_theme') !== 'light' // default dark
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadData();
  renderDaysView();
  setupEventListeners();

  // Listen for browser/Android back button
  window.addEventListener('popstate', (e) => {
    if (state.historyStack.length > 1) {
      state.historyStack.pop();
      const prevView = state.historyStack[state.historyStack.length - 1];
      showView(prevView, false);
    }
  });

  // Pre-fill Google Sheet URL input if saved
  const gsheetInput = document.getElementById('google-sheet-url');
  if (gsheetInput && state.googleSheetUrl) {
    gsheetInput.value = state.googleSheetUrl;
  }
});

// Theme Management (Fully responsive Dark & Light Mode)
function initTheme() {
  const html = document.documentElement;
  const sunIcon = document.getElementById('theme-icon-sun');
  const moonIcon = document.getElementById('theme-icon-moon');
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');

  if (state.isDarkMode) {
    html.classList.add('dark');
    if (document.body) document.body.classList.add('dark');
    if (sunIcon) sunIcon.classList.remove('hidden');
    if (moonIcon) moonIcon.classList.add('hidden');
    if (metaThemeColor) metaThemeColor.setAttribute('content', '#090d16');
  } else {
    html.classList.remove('dark');
    if (document.body) document.body.classList.remove('dark');
    if (sunIcon) sunIcon.classList.add('hidden');
    if (moonIcon) moonIcon.classList.remove('hidden');
    if (metaThemeColor) metaThemeColor.setAttribute('content', '#f8fafc');
  }
}

function toggleDarkMode() {
  vibrate(15);
  state.isDarkMode = !state.isDarkMode;
  localStorage.setItem('ukk_theme', state.isDarkMode ? 'dark' : 'light');
  initTheme();
}

// Data Loader & Storage
function loadData() {
  state.indicators = window.INITIAL_INDICATORS || [];
  state.examDays = window.EXAM_DAYS || [];

  const savedStudents = localStorage.getItem('ukk_students_v1');
  if (savedStudents) {
    try {
      state.students = JSON.parse(savedStudents);
    } catch (e) {
      console.error('Failed to parse local storage, loading default data', e);
      state.students = JSON.parse(JSON.stringify(window.INITIAL_STUDENTS || []));
    }
  } else {
    state.students = JSON.parse(JSON.stringify(window.INITIAL_STUDENTS || []));
    saveToLocalStorage();
  }
}

function saveToLocalStorage() {
  try {
    localStorage.setItem('ukk_students_v1', JSON.stringify(state.students));
  } catch (e) {
    console.error('Storage full or error saving to localStorage', e);
  }
}

// Mobile Haptic Vibration Helper
function vibrate(ms = 15) {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(ms);
    } catch (e) {}
  }
}

// Navigation & View Routing
function showView(viewName, pushHistory = true) {
  const views = ['days', 'students', 'assessment', 'rekap'];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.add('hidden');
  });

  const targetEl = document.getElementById(`view-${viewName}`);
  if (targetEl) targetEl.classList.remove('hidden');

  const bottomBar = document.getElementById('bottom-bar-assessment');
  const backBtn = document.getElementById('btn-header-back');
  const titleEl = document.getElementById('header-title');
  const subtitleEl = document.getElementById('header-subtitle');

  if (viewName === 'days') {
    backBtn.classList.add('hidden');
    bottomBar.classList.add('hidden');
    titleEl.innerHTML = `Penilaian UKK RPL <span class="text-[10px] uppercase font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">Penguji</span>`;
    subtitleEl.textContent = 'SMK Telkom • Tenaga Ahli';
    renderDaysView();
  } else if (viewName === 'students') {
    backBtn.classList.remove('hidden');
    bottomBar.classList.add('hidden');
    const day = state.examDays.find(d => d.id === state.currentDayId);
    titleEl.textContent = day ? `Jadwal ${day.hari}` : 'Daftar Siswa';
    subtitleEl.textContent = day ? day.tanggal : 'Pilih Siswa';
    renderStudentsView();
  } else if (viewName === 'assessment') {
    backBtn.classList.remove('hidden');
    bottomBar.classList.remove('hidden');
    const stu = getCurrentStudent();
    titleEl.textContent = 'Lembar Penilaian';
    subtitleEl.textContent = stu ? stu.nama : 'Penilaian Siswa';
  } else if (viewName === 'rekap') {
    backBtn.classList.remove('hidden');
    bottomBar.classList.add('hidden');
    titleEl.textContent = 'Rekapitulasi Nilai';
    subtitleEl.textContent = 'Semua Siswa Terdaftar';
    renderRekapView();
  }

  // Scroll to top smoothly
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (pushHistory) {
    state.historyStack.push(viewName);
    history.pushState({ view: viewName }, '');
  }
}

function goBack() {
  vibrate(15);
  if (state.historyStack.length > 1) {
    state.historyStack.pop();
    const prevView = state.historyStack[state.historyStack.length - 1];
    showView(prevView, false);
  } else {
    showView('days', false);
  }
}

// Student Scoring Calculations
function calculateStudentScore(student) {
  const scores = student.nilai || {};
  const values = Object.values(scores).filter(v => v !== null && v !== '' && !isNaN(Number(v))).map(Number);
  const count = values.length;
  const totalIndicators = 18;

  let average = null;
  if (count > 0) {
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    average = Math.round((sum / count) * 10) / 10;
  }

  let status = 'unscored'; // 'unscored', 'draft', 'completed'
  if (count === totalIndicators) {
    status = 'completed';
  } else if (count > 0) {
    status = 'draft';
  }

  // Predikat kelulusan berdasarkan nilai rata-rata
  let predicate = 'Belum Ada';
  let predicateColor = 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';

  if (average !== null) {
    if (average >= 90) {
      predicate = 'Sangat Kompeten';
      predicateColor = 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30';
    } else if (average >= 75) {
      predicate = 'Kompeten';
      predicateColor = 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 border-indigo-200 dark:border-indigo-500/30';
    } else {
      predicate = 'Belum Kompeten';
      predicateColor = 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/30';
    }
  }

  return {
    count,
    totalIndicators,
    average,
    status,
    predicate,
    predicateColor
  };
}

// ==========================================
// VIEW 1: RENDER PILIH HARI
// ==========================================
function renderDaysView() {
  const container = document.getElementById('days-container');
  if (!container) return;

  let overallCompleted = 0;
  let html = '';

  state.examDays.forEach(day => {
    const dayStudents = state.students.filter(s => s.hari === day.nama);
    const totalStudents = dayStudents.length;

    let completedCount = 0;
    let draftCount = 0;
    let sumScore = 0;
    let scoredStudents = 0;

    dayStudents.forEach(stu => {
      const stats = calculateStudentScore(stu);
      if (stats.status === 'completed') completedCount++;
      if (stats.status === 'draft') draftCount++;
      if (stats.average !== null) {
        sumScore += stats.average;
        scoredStudents++;
      }
    });

    overallCompleted += completedCount;
    const progressPercent = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0;
    const dayAverage = scoredStudents > 0 ? (sumScore / scoredStudents).toFixed(1) : '-';

    html += `
      <div onclick="selectDay('${day.id}')" class="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-500/50 p-4 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-indigo-500/10 btn-press">
        <div class="flex items-start justify-between">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/15 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-500/20">
                ${day.hari}
              </span>
              <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">
                ${day.tanggal}
              </span>
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
              ${day.nama}
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              ${day.paketUtama}
            </p>
          </div>

          <div class="text-right shrink-0 ml-3">
            <span class="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${
              completedCount === totalStudents 
                ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30' 
                : completedCount > 0 
                  ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30' 
                  : 'bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300'
            }">
              ${completedCount}/${totalStudents} Selesai
            </span>
            <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Rata-rata: <span class="font-bold text-indigo-600 dark:text-indigo-400">${dayAverage}</span></div>
          </div>
        </div>

        <!-- Progress bar per day -->
        <div class="mt-3.5 space-y-1.5">
          <div class="w-full bg-slate-100 dark:bg-slate-900/80 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-700/50">
            <div class="h-2 rounded-full transition-all duration-300 ${
              progressPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-600 dark:bg-indigo-500'
            }" style="width: ${progressPercent}%"></div>
          </div>
          <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Progress Pengujian</span>
            <span class="font-semibold text-slate-700 dark:text-slate-300">${progressPercent}%</span>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Update Overall Header Stats
  const overallBadge = document.getElementById('overall-progress-badge');
  const overallBar = document.getElementById('overall-progress-bar');
  if (overallBadge) overallBadge.textContent = `${overallCompleted} / ${state.students.length} Selesai`;
  if (overallBar) {
    const totalPercent = state.students.length > 0 ? Math.round((overallCompleted / state.students.length) * 100) : 0;
    overallBar.style.width = `${totalPercent}%`;
  }
}

function selectDay(dayId) {
  vibrate(20);
  state.currentDayId = dayId;
  showView('students');
}

// ==========================================
// VIEW 2: DAFTAR PESERTA (PER HARI)
// ==========================================
function renderStudentsView() {
  const day = state.examDays.find(d => d.id === state.currentDayId);
  if (!day) return;

  const dayTitleEl = document.getElementById('day-title');
  const dayBadgeEl = document.getElementById('day-badge');
  const dayPaketEl = document.getElementById('day-paket');
  const dayCountBadgeEl = document.getElementById('day-count-badge');

  if (dayTitleEl) dayTitleEl.textContent = day.nama;
  if (dayBadgeEl) dayBadgeEl.textContent = `JADWAL ${day.hari.toUpperCase()}`;
  if (dayPaketEl) dayPaketEl.textContent = day.paketUtama;

  const dayStudents = state.students.filter(s => s.hari === day.nama);

  // Calculate count metrics
  let countUnscored = 0;
  let countDraft = 0;
  let countCompleted = 0;

  dayStudents.forEach(s => {
    const st = calculateStudentScore(s);
    if (st.status === 'unscored') countUnscored++;
    else if (st.status === 'draft') countDraft++;
    else if (st.status === 'completed') countCompleted++;
  });

  // Update badges
  document.getElementById('count-all').textContent = dayStudents.length;
  document.getElementById('count-unscored').textContent = countUnscored;
  document.getElementById('count-draft').textContent = countDraft;
  document.getElementById('count-completed').textContent = countCompleted;
  if (dayCountBadgeEl) {
    dayCountBadgeEl.textContent = `${countCompleted}/${dayStudents.length} Selesai`;
  }

  // Filter students
  let filtered = dayStudents.filter(s => {
    const stats = calculateStudentScore(s);
    if (state.activeFilter === 'unscored' && stats.status !== 'unscored') return false;
    if (state.activeFilter === 'draft' && stats.status !== 'draft') return false;
    if (state.activeFilter === 'completed' && stats.status !== 'completed') return false;

    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      const matchName = s.nama.toLowerCase().includes(q);
      const matchNis = s.nis.toLowerCase().includes(q);
      const matchKelas = s.kelas.toLowerCase().includes(q);
      if (!matchName && !matchNis && !matchKelas) return false;
    }
    return true;
  });

  const container = document.getElementById('students-container');
  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-10 px-4 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 shadow-sm">
        <svg class="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Tidak ada siswa ditemukan</p>
        <p class="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau tab filter Anda.</p>
      </div>
    `;
    return;
  }

  let html = '';
  filtered.forEach((stu, idx) => {
    const stats = calculateStudentScore(stu);

    let statusPill = '';
    if (stats.status === 'completed') {
      statusPill = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">Selesai (18/18)</span>`;
    } else if (stats.status === 'draft') {
      statusPill = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">Draft (${stats.count}/18)</span>`;
    } else {
      statusPill = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-transparent">Belum Dinilai</span>`;
    }

    html += `
      <div onclick="selectStudent('${stu.id}')" class="group p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 border ${
        stats.status === 'completed' ? 'border-emerald-200 dark:border-emerald-500/30' : stats.status === 'draft' ? 'border-amber-200 dark:border-amber-500/30' : 'border-slate-200 dark:border-slate-700/70'
      } hover:border-indigo-500/50 transition-all cursor-pointer shadow-sm btn-press">
        <div class="flex items-center justify-between gap-3">
          
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <span class="font-bold text-indigo-600 dark:text-indigo-400">#${stu.no}</span>
              <span>•</span>
              <span>NIS: ${stu.nis}</span>
              <span>•</span>
              <span class="font-semibold text-slate-700 dark:text-slate-300">${stu.kelas}</span>
            </div>
            
            <h4 class="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 truncate mt-0.5">
              ${stu.nama}
            </h4>

            <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              ${stu.paket}
            </p>

            <div class="flex items-center gap-2 mt-2">
              ${statusPill}
              ${stats.predicate !== 'Belum Ada' ? `<span class="text-[10px] font-semibold ${stats.predicateColor} px-2 py-0.5 rounded-md border">${stats.predicate}</span>` : ''}
            </div>
          </div>

          <!-- Score Card -->
          <div class="text-right shrink-0 pl-2">
            <div class="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Nilai Akhir</div>
            <div class="text-xl font-black ${
              stats.average === null ? 'text-slate-400 dark:text-slate-600' : stats.average >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            }">
              ${stats.average !== null ? stats.average : '-'}
            </div>
            <div class="text-[10px] text-indigo-600 dark:text-indigo-400 flex items-center justify-end gap-0.5 mt-0.5">
              <span>Buka</span>
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </div>

        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function setFilterStatus(status) {
  vibrate(10);
  state.activeFilter = status;
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.remove('bg-indigo-600', 'text-white', 'shadow-sm');
    tab.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-400');
  });

  const activeTab = document.getElementById(`filter-${status}`);
  if (activeTab) {
    activeTab.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-400');
    activeTab.classList.add('bg-indigo-600', 'text-white', 'shadow-sm');
  }

  renderStudentsView();
}

function filterStudents() {
  const input = document.getElementById('search-student');
  const clearBtn = document.getElementById('btn-clear-search');
  state.searchQuery = input.value;

  if (state.searchQuery.trim()) {
    clearBtn.classList.remove('hidden');
  } else {
    clearBtn.classList.add('hidden');
  }

  renderStudentsView();
}

function clearSearch() {
  const input = document.getElementById('search-student');
  input.value = '';
  state.searchQuery = '';
  document.getElementById('btn-clear-search').classList.add('hidden');
  renderStudentsView();
}

// ==========================================
// VIEW 3: LEMBAR PENILAIAN SISWA
// ==========================================
function selectStudent(studentId) {
  vibrate(20);
  state.currentStudentId = studentId;
  showView('assessment');
  renderAssessmentView();
}

function getCurrentStudent() {
  return state.students.find(s => s.id === state.currentStudentId);
}

function renderAssessmentView() {
  const stu = getCurrentStudent();
  if (!stu) return;

  // Header info
  document.getElementById('assess-student-no').textContent = `#${stu.no}`;
  document.getElementById('assess-student-nis').textContent = `NIS: ${stu.nis}`;
  document.getElementById('assess-student-kelas').textContent = stu.kelas;
  document.getElementById('assess-student-name').textContent = stu.nama;
  document.getElementById('assess-student-paket').textContent = stu.paket;

  // Notes
  const notesEl = document.getElementById('assess-notes');
  if (notesEl) {
    notesEl.value = stu.keterangan || '';
  }

  // Render Indicators (Utama vs Pendukung)
  const containerUtama = document.getElementById('indicators-utama');
  const containerPendukung = document.getElementById('indicators-pendukung');

  let htmlUtama = '';
  let htmlPendukung = '';

  state.indicators.forEach((ind, index) => {
    const scoreVal = (stu.nilai && stu.nilai[index] !== undefined && stu.nilai[index] !== null) 
      ? stu.nilai[index] 
      : '';

    const isFilled = scoreVal !== '';
    const itemHtml = createIndicatorCardHtml(ind, index, scoreVal, isFilled);

    if (ind.cat === 'utama') {
      htmlUtama += itemHtml;
    } else {
      htmlPendukung += itemHtml;
    }
  });

  if (containerUtama) containerUtama.innerHTML = htmlUtama;
  if (containerPendukung) containerPendukung.innerHTML = htmlPendukung;

  updateAssessmentStats();
  updateStudentSwitcherButtons();
}

function createIndicatorCardHtml(ind, index, scoreVal, isFilled) {
  return `
    <div id="card-ind-${index}" class="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border ${
      isFilled ? 'border-indigo-500/50 dark:border-indigo-500/50' : 'border-slate-200 dark:border-slate-700/60'
    } transition-all space-y-2.5 shadow-sm">
      
      <!-- Title & Num -->
      <div class="flex items-start justify-between gap-2">
        <div class="space-y-0.5 flex-1 min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-700/90 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center justify-center">
              ${ind.num}
            </span>
            <span class="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Indikator #${ind.num}</span>
          </div>
          <h4 class="text-xs font-bold text-slate-900 dark:text-white leading-snug pt-1">
            ${ind.title}
          </h4>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            ${ind.desc}
          </p>
        </div>

        <!-- Clean Numeric Input without browser spinner arrows -->
        <div class="shrink-0 flex flex-col items-end">
          <input type="number" 
                 inputmode="numeric"
                 pattern="[0-9]*"
                 id="input-ind-${index}" 
                 min="0" 
                 max="100" 
                 step="1"
                 value="${scoreVal}"
                 placeholder="0 - 100"
                 oninput="handleScoreInput(${index}, this.value)"
                 class="w-20 py-1.5 px-2 text-center text-sm font-extrabold bg-slate-50 dark:bg-slate-900 border ${
                   isFilled ? 'border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30' : 'border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300'
                 } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner">
        </div>
      </div>

      <!-- Quick Preset Buttons & Steppers for Ergonomic Mobile Scoring -->
      <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/40 text-xs">
        
        <!-- Preset values -->
        <div class="flex items-center gap-1 overflow-x-auto py-0.5">
          <span class="text-[10px] text-slate-400 mr-0.5">Preset:</span>
          <button type="button" onclick="setQuickScore(${index}, 75)" class="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-700/70 hover:bg-indigo-600 text-slate-700 dark:text-slate-300 hover:text-white rounded-md border border-slate-200 dark:border-slate-600/50 btn-press">75</button>
          <button type="button" onclick="setQuickScore(${index}, 80)" class="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-700/70 hover:bg-indigo-600 text-slate-700 dark:text-slate-300 hover:text-white rounded-md border border-slate-200 dark:border-slate-600/50 btn-press">80</button>
          <button type="button" onclick="setQuickScore(${index}, 85)" class="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-700/70 hover:bg-indigo-600 text-slate-700 dark:text-slate-300 hover:text-white rounded-md border border-slate-200 dark:border-slate-600/50 btn-press">85</button>
          <button type="button" onclick="setQuickScore(${index}, 90)" class="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-700/70 hover:bg-indigo-600 text-slate-700 dark:text-slate-300 hover:text-white rounded-md border border-slate-200 dark:border-slate-600/50 btn-press">90</button>
          <button type="button" onclick="setQuickScore(${index}, 95)" class="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-700/70 hover:bg-indigo-600 text-slate-700 dark:text-slate-300 hover:text-white rounded-md border border-slate-200 dark:border-slate-600/50 btn-press">95</button>
        </div>

        <!-- Stepper buttons & Clear -->
        <div class="flex items-center gap-1 shrink-0 ml-1">
          <button type="button" onclick="stepScore(${index}, -5)" class="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center btn-press" title="-5">-5</button>
          <button type="button" onclick="stepScore(${index}, 5)" class="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center btn-press" title="+5">+5</button>
          <button type="button" onclick="clearScore(${index})" class="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-slate-500 hover:text-rose-600 dark:hover:text-rose-300 font-bold flex items-center justify-center btn-press" title="Kosongkan">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

      </div>

    </div>
  `;
}

// Handling score input change
function handleScoreInput(index, val) {
  const stu = getCurrentStudent();
  if (!stu) return;

  if (!stu.nilai) stu.nilai = {};

  if (val === '' || val === null || isNaN(val)) {
    delete stu.nilai[index];
  } else {
    let num = Math.min(100, Math.max(0, parseFloat(val)));
    stu.nilai[index] = num;
  }

  // Update card border & color
  const inputEl = document.getElementById(`input-ind-${index}`);
  const cardEl = document.getElementById(`card-ind-${index}`);
  const isFilled = stu.nilai[index] !== undefined;

  if (cardEl && inputEl) {
    if (isFilled) {
      cardEl.classList.remove('border-slate-200', 'dark:border-slate-700/60');
      cardEl.classList.add('border-indigo-500/50', 'dark:border-indigo-500/50');
      inputEl.classList.add('border-indigo-500', 'text-indigo-700', 'dark:text-indigo-300', 'ring-1', 'ring-indigo-500/30');
    } else {
      cardEl.classList.remove('border-indigo-500/50', 'dark:border-indigo-500/50');
      cardEl.classList.add('border-slate-200', 'dark:border-slate-700/60');
      inputEl.classList.remove('border-indigo-500', 'text-indigo-700', 'dark:text-indigo-300', 'ring-1', 'ring-indigo-500/30');
    }
  }

  updateAssessmentStats();
  // Auto-save draft quietly
  saveToLocalStorage();
}

function setQuickScore(index, val) {
  vibrate(10);
  const inputEl = document.getElementById(`input-ind-${index}`);
  if (inputEl) {
    inputEl.value = val;
    handleScoreInput(index, val);
  }
}

function stepScore(index, delta) {
  vibrate(10);
  const stu = getCurrentStudent();
  const current = (stu && stu.nilai && stu.nilai[index] !== undefined) ? Number(stu.nilai[index]) : 80;
  let next = Math.min(100, Math.max(0, current + delta));
  setQuickScore(index, next);
}

function clearScore(index) {
  vibrate(10);
  const inputEl = document.getElementById(`input-ind-${index}`);
  if (inputEl) {
    inputEl.value = '';
    handleScoreInput(index, '');
  }
}

function batchFillScores(val) {
  vibrate(25);
  const stu = getCurrentStudent();
  if (!stu) return;

  if (!stu.nilai) stu.nilai = {};
  state.indicators.forEach((_, idx) => {
    stu.nilai[idx] = val;
    const inputEl = document.getElementById(`input-ind-${idx}`);
    if (inputEl) inputEl.value = val;
    const cardEl = document.getElementById(`card-ind-${idx}`);
    if (cardEl) {
      cardEl.classList.remove('border-slate-200', 'dark:border-slate-700/60');
      cardEl.classList.add('border-indigo-500/50', 'dark:border-indigo-500/50');
    }
  });

  updateAssessmentStats();
  saveToLocalStorage();
  showToast(`Semua kriteria diisi dengan nilai ${val}!`);
}

function updateAssessmentStats() {
  const stu = getCurrentStudent();
  if (!stu) return;

  const stats = calculateStudentScore(stu);

  const avgEl = document.getElementById('assess-live-average');
  const pillEl = document.getElementById('assess-status-pill');

  if (avgEl) {
    avgEl.textContent = stats.average !== null ? stats.average : '-';
  }

  if (pillEl) {
    pillEl.textContent = `${stats.count} / 18 Terisi`;
    if (stats.count === 18) {
      pillEl.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 inline-block';
    } else if (stats.count > 0) {
      pillEl.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 inline-block';
    } else {
      pillEl.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 inline-block';
    }
  }
}

// Student Switcher (Prev / Next)
function updateStudentSwitcherButtons() {
  const day = state.examDays.find(d => d.id === state.currentDayId);
  if (!day) return;

  const dayStudents = state.students.filter(s => s.hari === day.nama);
  const currentIndex = dayStudents.findIndex(s => s.id === state.currentStudentId);

  const prevBtn = document.getElementById('btn-prev-student');
  const nextBtn = document.getElementById('btn-next-student');

  if (prevBtn) {
    if (currentIndex <= 0) {
      prevBtn.classList.add('opacity-40', 'pointer-events-none');
    } else {
      prevBtn.classList.remove('opacity-40', 'pointer-events-none');
    }
  }

  if (nextBtn) {
    if (currentIndex >= dayStudents.length - 1) {
      nextBtn.classList.add('opacity-40', 'pointer-events-none');
    } else {
      nextBtn.classList.remove('opacity-40', 'pointer-events-none');
    }
  }
}

function switchStudent(direction) {
  vibrate(15);
  // Auto save notes first
  saveNotes();

  const day = state.examDays.find(d => d.id === state.currentDayId);
  if (!day) return;

  const dayStudents = state.students.filter(s => s.hari === day.nama);
  const currentIndex = dayStudents.findIndex(s => s.id === state.currentStudentId);
  const nextIndex = currentIndex + direction;

  if (nextIndex >= 0 && nextIndex < dayStudents.length) {
    state.currentStudentId = dayStudents[nextIndex].id;
    renderAssessmentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function saveNotes() {
  const stu = getCurrentStudent();
  const notesEl = document.getElementById('assess-notes');
  if (stu && notesEl) {
    stu.keterangan = notesEl.value.trim();
    saveToLocalStorage();
  }
}

function saveCurrentStudentAssessment(showToastMsg = true) {
  vibrate(25);
  saveNotes();
  saveToLocalStorage();

  const stu = getCurrentStudent();
  const stats = calculateStudentScore(stu);

  if (stats.count === 18 && typeof confetti === 'function') {
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 }
    });
  }

  if (showToastMsg) {
    showToast(`Nilai ${stu.nama} berhasil disimpan (${stats.count}/18 terisi)!`);
  }
}

function saveAndNextStudent() {
  saveCurrentStudentAssessment(false);

  const day = state.examDays.find(d => d.id === state.currentDayId);
  if (!day) return;

  const dayStudents = state.students.filter(s => s.hari === day.nama);
  const currentIndex = dayStudents.findIndex(s => s.id === state.currentStudentId);

  if (currentIndex < dayStudents.length - 1) {
    state.currentStudentId = dayStudents[currentIndex + 1].id;
    renderAssessmentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Tersimpan! Membuka siswa berikutnya...');
  } else {
    showToast('Semua siswa di hari ini telah diperiksa!');
    showView('students');
  }
}

// ==========================================
// VIEW 4: REKAPITULASI SEMUA NILAI
// ==========================================
function openRekapView() {
  vibrate(15);
  showView('rekap');
}

function renderRekapView() {
  const container = document.getElementById('rekap-container');
  if (!container) return;

  let totalCompleted = 0;
  let sumScore = 0;
  let scoredCount = 0;

  state.students.forEach(s => {
    const stats = calculateStudentScore(s);
    if (stats.status === 'completed') totalCompleted++;
    if (stats.average !== null) {
      sumScore += stats.average;
      scoredCount++;
    }
  });

  const totalAvg = scoredCount > 0 ? (sumScore / scoredCount).toFixed(1) : '-';
  document.getElementById('rekap-total-completed').textContent = totalCompleted;
  document.getElementById('rekap-total-average').textContent = totalAvg;

  let html = '';
  state.examDays.forEach(day => {
    const dayStudents = state.students.filter(s => s.hari === day.nama);
    
    html += `
      <div class="mt-4 first:mt-0 space-y-2">
        <div class="flex items-center justify-between px-1">
          <span class="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">${day.nama}</span>
          <span class="text-[10px] text-slate-500 dark:text-slate-400">${dayStudents.length} Peserta</span>
        </div>
    `;

    dayStudents.forEach(stu => {
      const stats = calculateStudentScore(stu);
      html += `
        <div onclick="selectStudentDirect('${stu.id}', '${day.id}')" class="p-3 rounded-xl bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3 cursor-pointer btn-press shadow-sm">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
              <span class="font-bold text-indigo-600 dark:text-indigo-400">#${stu.no}</span>
              <span>•</span>
              <span>${stu.nis}</span>
              <span>•</span>
              <span class="text-slate-700 dark:text-slate-300 font-semibold">${stu.kelas}</span>
            </div>
            <div class="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">${stu.nama}</div>
            <div class="text-[10px] text-slate-500 dark:text-slate-400 truncate">${stu.paket}</div>
          </div>

          <div class="text-right shrink-0">
            <div class="text-sm font-black ${
              stats.average === null ? 'text-slate-400 dark:text-slate-500' : stats.average >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            }">
              ${stats.average !== null ? stats.average : '-'}
            </div>
            <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded ${
              stats.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-transparent' : stats.status === 'draft' ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-transparent' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }">
              ${stats.count}/18
            </span>
          </div>
        </div>
      `;
    });

    html += `</div>`;
  });

  container.innerHTML = html;
}

function selectStudentDirect(studentId, dayId) {
  state.currentDayId = dayId;
  selectStudent(studentId);
}

// ==========================================
// EXCEL EXPORT (USING SHEETJS)
// ==========================================
function exportToExcel() {
  vibrate(20);
  if (typeof XLSX === 'undefined') {
    showToast('Library Excel sedang dimuat, mohon coba sesaat lagi.');
    return;
  }

  showToast('Membuat file Excel...');

  // Build sheet headers identical to original PENILAIAN UKK.xlsx
  const wsData = [];

  // Row 1 - 3: Titles
  wsData.push(['JADWAL UKK JURUSAN REKAYASA PERANGKAT LUNAK']);
  wsData.push(['T.P 2026-2027']);
  wsData.push([]);

  // Row 4: Super headers for criteria
  const row4 = Array(35).fill('');
  row4[0] = '';
  row4[14] = 'KRITERIA ELEMEN KOMPETENSI UTAMA';
  row4[23] = 'KRITERIA ELEMEN KOMPETENSI PENDUKUNG';
  wsData.push(row4);

  // Row 5: Column Headers
  const headers = [
    'NO', 'NIS', 'NAMA MURID', 'KELAS', 'PAKET SOAL', 'HARI/TANGGAL', '', 'RUANGAN / WAKTU',
    '', '', '', '', '', '',
    // 9 Kriteria Utama
    'Menerapkan struktur data dan akses terhadap struktur data tersebut',
    'Menerapkan hasil pemodelan ke dalam pengembangan program',
    'Menerapkan coding guidelines dan best practices dalam penulisan program (kode sumber)',
    'Menerapkan struktur data dan akses terhadap struktur data tersebut',
    'Membuat dokumentasi modul program',
    'Membuat dokumentasi fungsi, prosedur atau method program',
    'Mengenerate dokumentasi',
    'Mempersiapkan data uji',
    'Melaksanakan prosedur uji coba',
    // 9 Kriteria Pendukung
    'Mengidentifikasi konsep data dan struktur data',
    'Menggunakan metode pengembangan program',
    'Melaporkan bahaya-bahaya di tempat kerja',
    'Mengidentifikasi mekanisme running atau eksekusi source code',
    'Mengidentifikasi hasil eksekusi',
    'Menuliskan kode sumber',
    'Melakukan identifikasi kode program',
    'Mengidentifikasi konsep data dan struktur data',
    'Menentukan kebutuhan uji coba dalam pengembangan',
    // Rata-rata & Ket
    'Rata-Rata',
    'Ket'
  ];
  wsData.push(headers);

  // Row 6+: Students data
  state.students.forEach((stu, idx) => {
    const row = Array(35).fill('');
    row[0] = stu.no;
    row[1] = stu.nis;
    row[2] = stu.nama;
    row[3] = stu.kelas;
    row[4] = stu.paket;
    row[5] = stu.hari;
    row[7] = stu.ruangan;

    // Fill indicators (Col 14 to 31 -> 0 to 17 index in array)
    const stats = calculateStudentScore(stu);
    for (let i = 0; i < 18; i++) {
      if (stu.nilai && stu.nilai[i] !== undefined && stu.nilai[i] !== null && stu.nilai[i] !== '') {
        row[14 + i] = Number(stu.nilai[i]);
      } else {
        row[14 + i] = '';
      }
    }

    row[32] = stats.average !== null ? stats.average : '';
    row[33] = stu.keterangan || stats.predicate;

    wsData.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 5 },  // NO
    { wch: 12 }, // NIS
    { wch: 30 }, // NAMA
    { wch: 12 }, // KELAS
    { wch: 45 }, // PAKET
    { wch: 25 }, // HARI
    { wch: 5 },
    { wch: 30 }, // RUANGAN
    ...Array(6).fill({ wch: 5 }),
    ...Array(18).fill({ wch: 10 }), // 18 Kriteria
    { wch: 12 }, // Rata-Rata
    { wch: 25 }  // Ket
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'PENGUJI KOMDIGI 2');

  const filename = `PENILAIAN_UKK_RPL_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);

  showToast('File Excel berhasil diunduh!');
}

// ==========================================
// GOOGLE SHEETS SYNC (WEBHOOK)
// ==========================================
function openSyncModal() {
  vibrate(15);
  const modal = document.getElementById('modal-sync');
  if (modal) modal.classList.remove('hidden');
}

function closeSyncModal() {
  const modal = document.getElementById('modal-sync');
  if (modal) modal.classList.add('hidden');
}

function saveGoogleSheetUrl() {
  const urlInput = document.getElementById('google-sheet-url');
  if (!urlInput) return;

  const url = urlInput.value.trim();
  state.googleSheetUrl = url;
  localStorage.setItem('ukk_gsheet_url', url);
  showToast('URL Google Apps Script disimpan!');
}

async function syncToGoogleSheets() {
  vibrate(20);
  const url = (state.googleSheetUrl || '').trim();
  if (!url) {
    showToast('Masukkan URL Google Apps Script terlebih dahulu!');
    return;
  }

  const btn = document.getElementById('btn-sync-action');
  if (btn) {
    btn.innerHTML = `<span class="animate-spin inline-block mr-1">⌛</span> Sinkronisasi...`;
    btn.disabled = true;
  }

  try {
    const payload = {
      action: 'sync_all',
      timestamp: new Date().toISOString(),
      students: state.students.map(s => {
        const stats = calculateStudentScore(s);
        return {
          id: s.id,
          excel_row: s.excel_row,
          nis: s.nis,
          nama: s.nama,
          kelas: s.kelas,
          paket: s.paket,
          hari: s.hari,
          nilai: s.nilai || {},
          average: stats.average,
          predicate: stats.predicate,
          status: stats.status,
          keterangan: s.keterangan || ''
        };
      })
    };

    // Send payload using no-cors mode to support Google Apps Script web apps directly
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    showToast('Sinkronisasi terkirim ke Google Spreadsheet!');
  } catch (err) {
    console.error('Google Sheets sync error:', err);
    showToast('Gagal terhubung ke Google Sheets: ' + err.message);
  } finally {
    if (btn) {
      btn.innerHTML = `
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
        </svg>
        Sync Sekarang
      `;
      btn.disabled = false;
    }
  }
}

// ==========================================
// BACKUP & RESTORE JSON
// ==========================================
function exportBackupJson() {
  vibrate(15);
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.students, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `backup_penilaian_ukk_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('File backup JSON berhasil diunduh!');
}

function importBackupJson(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        state.students = imported;
        saveToLocalStorage();
        showToast('Data berhasil dipulihkan dari backup!');
        closeSyncModal();
        renderDaysView();
      } else {
        showToast('Format file JSON tidak valid!');
      }
    } catch (err) {
      showToast('Gagal membaca file: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function resetAllDataConfirmation() {
  if (confirm('PERINGATAN: Apakah Anda yakin ingin mereset seluruh data nilai kembali ke awal? Semua perubahan nilai akan hilang.')) {
    localStorage.removeItem('ukk_students_v1');
    state.students = JSON.parse(JSON.stringify(window.INITIAL_STUDENTS || []));
    saveToLocalStorage();
    showToast('Data nilai telah direset ke kondisi awal.');
    closeSyncModal();
    renderDaysView();
  }
}

// ==========================================
// TOAST NOTIFICATION HELPER
// ==========================================
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = msg;
  toast.classList.remove('opacity-0', '-translate-y-20');
  toast.classList.add('opacity-100', 'translate-y-0');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', '-translate-y-20');
  }, 2500);
}

// Event Listeners setup
function setupEventListeners() {
  // Modal click outside to close
  const modalSync = document.getElementById('modal-sync');
  if (modalSync) {
    modalSync.addEventListener('click', (e) => {
      if (e.target === modalSync) closeSyncModal();
    });
  }
}
