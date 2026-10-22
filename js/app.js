/**
 * AL-MUNTALAQ PWA - CORE LOGIC V2 (EDISI LENGKAP & SEMAKAN RASMI)
 * Titik Tolak Dakwah & Landasan Harakah Islamiyyah
 * As-Syeikh Muhammad Ahmad Ar-Rasyid (رحمه الله)
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Data Initialization
  const data = window.ALMUNTALAQ_DATA || null;
  if (!data || !data.chapters) {
    console.error('Data Al-Muntalaq tidak dijumpai!');
    return;
  }

  // Ekstrak 46 Koleksi Mutiara Hikmah Dakwah daripada ringkasan bab
  const allHikmahQuotes = (typeof window !== 'undefined' && window.ALMUNTALAQ_QUOTES && window.ALMUNTALAQ_QUOTES.length > 0)
    ? window.ALMUNTALAQ_QUOTES
    : [];

  
  // Dynamic update promo title & sub counters
  const promoTitleEl = document.querySelector('.hikmah-promo-title');
  const promoSubEl = document.querySelector('.hikmah-promo-sub');
  if (promoTitleEl && allHikmahQuotes.length > 0) {
    promoTitleEl.textContent = `${allHikmahQuotes.length} Mutiara Kata`;
  }
  if (promoSubEl) {
    promoSubEl.textContent = "(Hadis Nabi SAW + Tokoh & Pejuang)";
  }
if (allHikmahQuotes.length === 0) {
  data.chapters.forEach((ch, chIdx) => {
    const s = ch.summary || '';
    if (s.includes('💎 Mutiara')) {
      const parts = s.split('💎 Mutiara');
      if (parts.length > 1) {
        const sub = parts[1].split('⚔️ Tambahan')[0];
        const lines = sub.split('\n').map(l => l.trim()).filter(l => l.startsWith('•') || l.startsWith('-'));
        lines.forEach(l => {
          let text = l.replace(/^[•\-]\s*/, '').trim();
          let speaker = 'Nukilan Tokoh & Salaf';
          if (text.includes(':')) {
            const splitColon = text.split(':');
            speaker = splitColon[0].replace(/\*\*/g, '').replace(/\*/g, '').trim();
            text = splitColon.slice(1).join(':').trim();
          }
          allHikmahQuotes.push({
            id: allHikmahQuotes.length + 1,
            chapterIndex: chIdx,
            chapterNumber: ch.number,
            chapterTitle: ch.title,
            speaker: speaker,
            quote: text,
            fullText: l.replace(/^[•\-]\s*/, '').trim()
          });
        });
      }
    }
  });

  
  }

  // App State
  const state = {
    currentChapter: 0,
    currentSubtopic: 0,
    activeSearchQuery: '',
    activeMatchIndex: -1,
    searchResults: [],
    currentSearchResultIndex: -1,
    layer: localStorage.getItem('almuntalaq_layer') || 'layer1', // 'layer1' = Lengkap, 'layer2' = Ringkasan
    theme: localStorage.getItem('almuntalaq_theme') || 'dark',
    fontSize: parseFloat(localStorage.getItem('almuntalaq_fontsize') || '1.05'),
    bookmarks: JSON.parse(localStorage.getItem('almuntalaq_bookmarks') || '[]'),
    mobileNavOpen: false
  };

  // DOM Elements
  const chapterNavList = document.getElementById('chapterNavList');
  const heroCard = document.getElementById('heroCard');
  const readerContainer = document.getElementById('readerContainer');
  const contentBody = document.getElementById('contentBody');
  
  const layerBtnLengkap = document.getElementById('btnLayerLengkap');
  const layerBtnRingkasan = document.getElementById('btnLayerRingkasan');
  const layerBtnHikmah = document.getElementById('btnLayerHikmah');
  const sidebarHikmahBtn = document.getElementById('sidebarHikmahBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const fontDecBtn = document.getElementById('fontDecBtn');
  const fontIncBtn = document.getElementById('fontIncBtn');
  const fontResetBtn = document.getElementById('fontResetBtn');
  const bookmarkBtn = document.getElementById('bookmarkBtn');
  const copyBtn = document.getElementById('copyBtn');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const appSidebar = document.getElementById('appSidebar');

  const prevChapterBtn = document.getElementById('prevChapterBtn');
  const nextChapterBtn = document.getElementById('nextChapterBtn');

  const searchInput = document.getElementById('searchInput');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchResultsList = document.getElementById('searchResultsList');
  const closeSearchBtn = document.getElementById('closeSearchBtn');
  const searchCountBadge = document.getElementById('searchCountBadge');

  const toast = document.getElementById('toastNotice');
  const toastMsg = document.getElementById('toastMsg');

  // 2. Initialize Theme & Font Size
  document.documentElement.setAttribute('data-theme', state.theme);
  updateThemeIcon();
  applyFontSize();

  // 3. Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('Service Worker Registered:', reg.scope);
        reg.update();
      })
      .catch(err => console.log('Service Worker Failed:', err));
  }

  // 4. Render Sidebar List with Subtopics Support (Persis al-Masar)
  function renderSidebar() {
    chapterNavList.innerHTML = '';

    data.chapters.forEach((ch, chIdx) => {
      const isCurrent = (chIdx === state.currentChapter);
      const li = document.createElement('li');
      li.className = `chapter-nav-item ${isCurrent ? 'active-chapter' : ''}`;
      li.id = `nav-ch-${chIdx}`;

      const btn = document.createElement('button');
      btn.className = 'chapter-header-btn';
      btn.innerHTML = `
        <span class="chapter-num-badge">${ch.number.replace('BAB ', 'B').replace('MUKADIMAH', 'M')}</span>
        <div class="ch-nav-label-box" style="flex: 1; text-align: left; overflow: hidden;">
          <div class="chapter-title-text" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${ch.title}">${ch.title}</div>
          <small style="color: var(--gold-light); font-family: 'Amiri', serif; font-size: 0.85rem;">${ch.title_ar || ''}</small>
        </div>
        <span class="chevron-icon">›</span>
      `;

      btn.addEventListener('click', () => {
        state.activeSearchQuery = null;
        removeFloatingSearchToolbar();

        const isOpen = li.classList.contains('open');
        document.querySelectorAll('.chapter-nav-item').forEach(item => item.classList.remove('open'));
        if (!isOpen) {
          li.classList.add('open');
        }

        // Apabila Tajuk Bab di'klik', terus buka & navigasi ke Mukadimah Bab (Subtopik 0)
        // Ini memastikan paparan kanan terus keluar kandungannya dan tidak kosong
        navigateTo(chIdx, 0);
        if (window.innerWidth <= 900) {
          toggleMobileNav(false);
        }
      });

      li.appendChild(btn);

      // Render Subtopics list under chapter
      if (ch.subtopics && ch.subtopics.length > 0) {
        const subUl = document.createElement('ul');
        subUl.className = 'subtopic-list';

        ch.subtopics.forEach((sub, sIdx) => {
          const subLi = document.createElement('li');
          const subBtn = document.createElement('button');
          subBtn.className = `subtopic-nav-btn ${chIdx === state.currentChapter && sIdx === state.currentSubtopic ? 'active-sub' : ''}`;
          subBtn.innerHTML = `
            <span class="subtopic-num">${sIdx + 1}.</span>
            <span class="subtopic-title-text">${sub.title}</span>
          `;
          subBtn.title = sub.title;

          subBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            state.activeSearchQuery = null;
            removeFloatingSearchToolbar();
            navigateTo(chIdx, sIdx);
            if (window.innerWidth <= 900) {
              toggleMobileNav(false);
            }
          });

          subLi.appendChild(subBtn);
          subUl.appendChild(subLi);
        });

        li.appendChild(subUl);
      }

      chapterNavList.appendChild(li);
    });

    // Auto-open current chapter in sidebar accordion
    const currentNavItem = document.getElementById(`nav-ch-${state.currentChapter}`);
    if (currentNavItem) {
      currentNavItem.classList.add('open');
    }
  }

  // 5. Navigate to Chapter and Subtopic (Persis al-Masar)
  window.navigateTo = function(chIdx, sIdx = 0, targetLayer = null) { return navigateTo(chIdx, sIdx, targetLayer); };
  function navigateTo(chIdx, sIdx = 0, targetLayer = null) {
    if (chIdx < 0 || chIdx >= data.chapters.length) return;
    state.currentChapter = chIdx;

    const ch = data.chapters[chIdx];
    if (typeof sIdx !== 'number' || sIdx < 0 || (ch.subtopics && sIdx >= ch.subtopics.length)) {
      sIdx = 0;
    }
    state.currentSubtopic = sIdx;

    if (targetLayer && (targetLayer === 'layer1' || targetLayer === 'layer2')) {
      state.layer = targetLayer;
      localStorage.setItem('almuntalaq_layer', targetLayer);
      layerBtnLengkap.classList.toggle('active', targetLayer === 'layer1');
      layerBtnRingkasan.classList.toggle('active', targetLayer === 'layer2');
      if (layerBtnHikmah) layerBtnHikmah.classList.remove('active');
    }

    if (state.layer === 'layer3') {
      state.layer = 'layer1';
      localStorage.setItem('almuntalaq_layer', 'layer1');
      layerBtnLengkap.classList.add('active');
      layerBtnRingkasan.classList.remove('active');
      if (layerBtnHikmah) layerBtnHikmah.classList.remove('active');
      layerBtnLengkap.setAttribute('aria-selected', 'true');
      layerBtnRingkasan.setAttribute('aria-selected', 'false');
      if (layerBtnHikmah) layerBtnHikmah.setAttribute('aria-selected', 'false');
    }

    // Update active classes in sidebar
    document.querySelectorAll('.chapter-nav-item').forEach((item, idx) => {
      const isCur = (idx === chIdx);
      item.classList.toggle('active-chapter', isCur);
      if (isCur) item.classList.add('open');
    });

    document.querySelectorAll('.subtopic-nav-btn').forEach(btn => {
      btn.classList.remove('active-sub');
    });

    const activeChElem = document.getElementById(`nav-ch-${chIdx}`);
    if (activeChElem) {
      const subBtns = activeChElem.querySelectorAll('.subtopic-nav-btn');
      if (subBtns && subBtns[sIdx]) {
        subBtns[sIdx].classList.add('active-sub');
      }
    }

    renderContent();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 6. Render Reader Content: Papar bahagian subtopik yang dipilih SAHAJA (Persis al-Masar)
  function renderContent() {
    const ch = data.chapters[state.currentChapter];
    if (!ch) return;

    const sub = (ch.subtopics && ch.subtopics[state.currentSubtopic]) || (ch.subtopics ? ch.subtopics[0] : null) || {
      title: ch.title,
      paragraphs: ch.paragraphs || [],
      footnotes: ch.footnotes || []
    };

    if (state.layer === 'layer3') {
      heroCard.style.display = 'none';
      readerContainer.style.display = 'block';

      document.getElementById('chBadgePill').textContent = '💎 KOLEKSI EMAS DAKWAH';
      document.getElementById('chArabicTitle').textContent = 'درر الحكمة والدعوة';
      document.getElementById('chapterMainTitle').textContent = 'Mutiara Hikmah & Kata-Kata Tokoh';
      const subTitleEl = document.getElementById('subtopicMainTitle');
      if (subTitleEl) subTitleEl.textContent = 'Mutiara Hadis & Kalam Rijal';

      const modeBadge = document.getElementById('activeModeBadge');
      modeBadge.textContent = `${allHikmahQuotes.length} Mutiara Kata (Hadis Nabi SAW + Tokoh & Pejuang)`;

      updateBookmarkBtnStatus();
      const contentBody = document.getElementById('contentBody');
      contentBody.innerHTML = '';
      renderHikmahView(contentBody);
      updateBottomNav();
      return;
    }

    // Hero visible only on Mukadimah Chapter & Subtopik 0
    heroCard.style.display = (state.currentChapter === 0 && state.currentSubtopic === 0) ? 'block' : 'none';
    readerContainer.style.display = 'block';

    // Banner metadata
    document.getElementById('chBadgePill').textContent = ch.number;
    document.getElementById('chArabicTitle').textContent = ch.title_ar || '';
    document.getElementById('chapterMainTitle').textContent = ch.title;

    const subTitleEl = document.getElementById('subtopicMainTitle');
    if (subTitleEl) {
      subTitleEl.textContent = sub.title;
      subTitleEl.style.display = 'block';
    }

    // Active layer indicator text
    const modeBadge = document.getElementById('activeModeBadge');
    const subFnCount = (sub.footnotes && sub.footnotes.length > 0) ? sub.footnotes.length : 0;
    modeBadge.textContent = state.layer === 'layer1' 
      ? `Versi Lengkap (${sub.paragraphs ? sub.paragraphs.length : 0} Perenggan${subFnCount > 0 ? ` & ${subFnCount} Nota Kaki` : ''})` 
      : 'Ringkasan Eksklusif (Layer 2 - Fiqh Haraki & Intipati)';

    // Update bookmark status
    updateBookmarkBtnStatus();

    // Render Body according to layer
    const contentBody = document.getElementById('contentBody');
    contentBody.innerHTML = '';

    if (state.layer === 'layer1') {
      // ==================== LAYER 1: VERSI PENUH SUBTOPIK INI SAHAJA ====================
      if (sub.paragraphs && sub.paragraphs.length > 0) {
        sub.paragraphs.forEach(para => {
          const pType = para.type || 'text';
          const pText = para.text || '';

          if (pType === 'heading2') {
            const h3 = document.createElement('h3');
            h3.className = 'reader-subheading';
            h3.innerHTML = `
              <div class="sub-heading-content">
                <span class="sub-ornament">❖</span>
                <span class="sub-heading-text">${pText}</span>
              </div>
            `;
            contentBody.appendChild(h3);
          } else if (pType === 'quran') {
            const qBox = document.createElement('div');
            qBox.className = 'reader-quran-box';
            qBox.innerHTML = `<div class="quran-ayah">${pText}</div>`;
            contentBody.appendChild(qBox);
          } else if (pType === 'arabic') {
            const arBox = document.createElement('div');
            arBox.className = 'arabic-text';
            arBox.innerHTML = pText;
            contentBody.appendChild(arBox);
          } else if (pType === 'quote') {
            const qBox = document.createElement('blockquote');
            qBox.className = 'quote-highlight-box';
            qBox.innerHTML = formatQuoteText(pText);
            contentBody.appendChild(qBox);
          } else {
            const p = document.createElement('p');
            p.className = 'reader-paragraph';
            p.innerHTML = pText;
            contentBody.appendChild(p);
          }
        });

        // ==================== NOTA KAKI BAGI BAHAGIAN SUBTOPIK INI SAHAJA ====================
        if (sub.footnotes && sub.footnotes.length > 0) {
          const fnSection = document.createElement('div');
          fnSection.className = 'chapter-footnotes-section';
          fnSection.id = 'chapterFootnotes';

          fnSection.innerHTML = `
            <div class="footnotes-title-bar">
              <div class="fn-title-group">
                <div class="fn-title-icon-wrap" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                </div>
                <div class="fn-title-text">
                  <h4>Nota Kaki & Rujukan Ilmiah</h4>
                  <span class="fn-arabic-subtitle">المراجع والهوامش</span>
                </div>
              </div>
              <span class="fn-total-pill">${sub.footnotes.length} Rujukan Bahagian Ini</span>
            </div>
            <div class="footnotes-list-box">
              ${sub.footnotes.map(fn => `
                <div id="fn-item-${fn.id}" class="footnote-card">
                  <div class="fn-card-topbar">
                    <button type="button" class="fn-card-badge-btn" data-fn-id="${fn.id}" aria-label="Kembali ke perenggan [${fn.id}] untuk sambung bacaan" title="Kembali ke perenggan [${fn.id}] (Klik untuk sambung bacaan)">
                      <span class="fn-islamic-star" aria-hidden="true">❖</span>
                      <svg class="fn-badge-arrow" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M7.5 5L2.5 10L7.5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M2.5 10H13.5C15.7091 10 17.5 11.7909 17.5 14V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      <span class="fn-card-badge-num">[${fn.id}]</span>
                    </button>
                  </div>
                  <div class="fn-card-body">${formatFootnoteBody(fn.text)}</div>
                </div>
              `).join('')}
            </div>
          `;

          contentBody.appendChild(fnSection);
        }

        // 1. Attach interactive Click Handlers on in-text Footnote Citations (.fn-ref)
        contentBody.querySelectorAll('.fn-ref').forEach(el => {
          const fnId = el.getAttribute('data-fn-id');
          if (!el.id) {
            el.id = `fnref-${fnId}`;
          }
          el.setAttribute('role', 'button');
          el.setAttribute('tabindex', '0');
          el.title = el.getAttribute('title') || `Lihat Nota Kaki [${fnId}]`;

          el.addEventListener('click', (e) => {
            e.preventDefault();
            const targetFn = document.getElementById(`fn-item-${fnId}`);
            if (targetFn) {
              targetFn.scrollIntoView({ behavior: 'smooth', block: 'center' });
              targetFn.classList.remove('fn-highlight');
              void targetFn.offsetWidth; // trigger reflow for animation
              targetFn.classList.add('fn-highlight');
              setTimeout(() => targetFn.classList.remove('fn-highlight'), 3000);
            }
            const fnData = sub.footnotes ? sub.footnotes.find(f => f.id == fnId) : null;
            if (fnData) {
              showToast(`[${fnId}] ${fnData.text.replace(/\*/g, '')}`);
            }
          });
        });

        // 2. Attach Click Handlers to the Left Badge Button (.fn-card-badge-btn) to jump back to text
        contentBody.querySelectorAll('.fn-card-badge-btn, .fn-back-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            const fnId = btn.getAttribute('data-fn-id');
            const targetRef = document.getElementById(`fnref-${fnId}`) || contentBody.querySelector(`.fn-ref[data-fn-id="${fnId}"]`);
            if (targetRef) {
              targetRef.scrollIntoView({ behavior: 'smooth', block: 'center' });

              targetRef.classList.remove('fn-ref-return-highlight');
              void targetRef.offsetWidth;
              targetRef.classList.add('fn-ref-return-highlight');
              setTimeout(() => targetRef.classList.remove('fn-ref-return-highlight'), 3200);

              const parentBlock = targetRef.closest('.reader-paragraph, .reader-quran-box, .quote-highlight-box, .arabic-text, p');
              if (parentBlock) {
                parentBlock.classList.remove('para-return-glow');
                void parentBlock.offsetWidth;
                parentBlock.classList.add('para-return-glow');
                setTimeout(() => parentBlock.classList.remove('para-return-glow'), 2500);
              }

              showToast(`Kembali ke perenggan [${fnId}] • Sila sambung bacaan 📖`);
            } else {
              showToast(`Perenggan rujukan [${fnId}] tidak ditemui pada paparan ini.`);
            }
          });
        });

      } else {
        contentBody.innerHTML = '<p class="text-muted">Tiada teks lanjutan bagi bahagian ini.</p>';
      }
    } else {
      // ==================== LAYER 2: RINGKASAN EKSKLUSIF SUBTOPIK INI ====================
      const summaryBox = document.createElement('div');
      summaryBox.className = 'summary-container';

      const hasSubSummary = sub.summary && sub.summary.trim() !== '';
      if (hasSubSummary) {
        summaryBox.innerHTML = `
          <div class="subtopic-summary-card-direct" style="background: rgba(6, 21, 18, 0.7); border: 1px solid rgba(212, 175, 55, 0.35); border-radius: 12px; padding: 22px 26px; margin-bottom: 2rem; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 1.2rem; padding-bottom: 0.8rem; border-bottom: 1px solid rgba(212, 175, 55, 0.25);">
              <span style="font-size: 1.35rem;">⚡</span>
              <div>
                <h3 style="color: var(--gold-light); margin: 0; font-size: 1.2rem;">Intipati Ringkasan Bahagian Ini</h3>
                <span style="color: var(--emerald-light); font-size: 0.88rem;">${sub.title}</span>
              </div>
            </div>
            <div style="font-size: 1.02rem; line-height: 1.8; color: var(--text-main);">
              ${formatMarkdownSummary(sub.summary)}
            </div>
          </div>
        `;
      }

      // Jika Subtopik 0 (Mukadimah Bab), tampilkan juga Rumusan Keseluruhan Bab
      if (state.currentSubtopic === 0 && ch.summary && ch.summary.trim() !== '') {
        const chSumWrap = document.createElement('div');
        chSumWrap.style.marginTop = hasSubSummary ? '2.5rem' : '0';
        chSumWrap.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 1.2rem; padding-bottom: 0.8rem; border-bottom: 2px solid rgba(16, 185, 129, 0.35);">
            <span style="font-size: 1.4rem;">📖</span>
            <div>
              <h3 style="color: var(--emerald-light); margin: 0; font-size: 1.25rem;">Rumusan Keseluruhan Bab (${ch.number})</h3>
              <span style="color: var(--text-muted); font-size: 0.85rem;">Dimensi Asas & Pemetaan Fiqh Haraki</span>
            </div>
          </div>
          <div style="font-size: 1rem; line-height: 1.75; color: var(--text-main);">
            ${formatMarkdownSummary(ch.summary)}
          </div>
        `;
        summaryBox.appendChild(chSumWrap);
      } else if (!hasSubSummary) {
        summaryBox.innerHTML = `
          <div style="text-align: center; padding: 2.5rem;">
            <p style="color: var(--gold-light); font-weight: 600; font-size: 1.1rem;">Ringkasan Bahagian Ini Sedang Dikemas Kini</p>
            <p style="color: var(--text-muted); font-size: 0.92rem;">Sahabat boleh membaca Versi Lengkap (Layer 1) sementara ringkasan dimantapkan sepenuhnya.</p>
          </div>
        `;
      }

      contentBody.appendChild(summaryBox);
    }

    // Paparan Jalur Mutiara Hikmah Bab Ini (jika ada mutiara hikmah berkaitan)
    const currentChQuotes = allHikmahQuotes.filter(q => q.chapterIndex === state.currentChapter);
    if (currentChQuotes.length > 0 && (state.layer === 'layer1' || state.layer === 'layer2')) {
      const chHikmahWrap = document.createElement('div');
      chHikmahWrap.className = 'chapter-hikmah-box';
      chHikmahWrap.innerHTML = `
        <div class="chapter-hikmah-title">
          <span>💎</span>
          <span>Mutiara Hikmah Bab Ini (${currentChQuotes.length} Mutiara Emas)</span>
          <button class="hikmah-card-btn" id="btnViewChapterHikmah" style="margin-left: auto; color: var(--gold-light); border-color: rgba(212, 175, 55, 0.4);">
            Buka Semua Mutiara →
          </button>
        </div>
        <div style="font-size: 0.95rem; line-height: 1.7; color: var(--text-main);">
          <span class="hikmah-speaker-pill" style="font-size: 0.78rem; margin-bottom: 6px;">👤 ${currentChQuotes[0].speaker}</span>
          <div style="margin-top: 6px;">${formatHikmahQuote(currentChQuotes[0].quote)}</div>
        </div>
      `;
      contentBody.appendChild(chHikmahWrap);

      const btnViewAll = chHikmahWrap.querySelector('#btnViewChapterHikmah');
      if (btnViewAll) {
        btnViewAll.addEventListener('click', () => {
          setLayer('layer3');
        });
      }
    }

    // Update Bottom Navigation buttons (Navigasi Antara Subtopik)
    updateBottomNav();

    // Sorotan Carian Dalam Laman & Navigasi Baris (In-Page Search Highlight)
    if (state.activeSearchQuery && (state.layer === 'layer1' || state.layer === 'layer2')) {
      setTimeout(() => {
        let matchCount = highlightTextInElement(contentBody, state.activeSearchQuery);
        if (matchCount > 0) {
          showFloatingSearchToolbar(state.activeSearchQuery, matchCount);
          setTimeout(() => {
            focusSearchMatch(0);
          }, 180);
        } else {
          removeFloatingSearchToolbar();
        }
      }, 80);
    } else {
      removeFloatingSearchToolbar();
    }
  }

  // 7. Bottom Navigation (Prev / Next Subtopic - Persis al-Masar)
  function updateBottomNav() {
    if (state.layer === 'layer3') {
      prevChapterBtn.disabled = false;
      nextChapterBtn.disabled = false;
      prevChapterBtn.innerHTML = '← Baca Versi Lengkap';
      prevChapterBtn.title = 'Buka Versi Lengkap Bab Semasa';
      nextChapterBtn.innerHTML = 'Baca Ringkasan Bab →';
      nextChapterBtn.title = 'Buka Ringkasan Bab Semasa';
      return;
    }

    const ch = data.chapters[state.currentChapter];
    if (!ch || !ch.subtopics) return;

    // Tombol Sebelumnya (Previous)
    if (state.currentSubtopic > 0) {
      prevChapterBtn.disabled = false;
      const pSub = ch.subtopics[state.currentSubtopic - 1];
      prevChapterBtn.innerHTML = `← ${pSub.title}`;
      prevChapterBtn.title = pSub.title;
    } else if (state.currentChapter > 0) {
      const prevCh = data.chapters[state.currentChapter - 1];
      prevChapterBtn.disabled = false;
      prevChapterBtn.innerHTML = `← ${prevCh.number}: ${prevCh.title}`;
      prevChapterBtn.title = prevCh.title;
    } else {
      prevChapterBtn.disabled = true;
      prevChapterBtn.innerHTML = '← Permulaan Kitab';
    }

    // Tombol Seterusnya (Next)
    if (state.currentSubtopic < ch.subtopics.length - 1) {
      nextChapterBtn.disabled = false;
      const nSub = ch.subtopics[state.currentSubtopic + 1];
      nextChapterBtn.innerHTML = `${nSub.title} →`;
      nextChapterBtn.title = nSub.title;
    } else if (state.currentChapter < data.chapters.length - 1) {
      const nextCh = data.chapters[state.currentChapter + 1];
      nextChapterBtn.disabled = false;
      nextChapterBtn.innerHTML = `${nextCh.number}: ${nextCh.title} →`;
      nextChapterBtn.title = nextCh.title;
    } else {
      nextChapterBtn.disabled = true;
      nextChapterBtn.innerHTML = 'Tamat Kitab ✓';
    }
  }

  prevChapterBtn.addEventListener('click', () => {
    if (state.layer === 'layer3') {
      setLayer('layer1');
      return;
    }
    if (state.currentSubtopic > 0) {
      navigateTo(state.currentChapter, state.currentSubtopic - 1);
    } else if (state.currentChapter > 0) {
      const prevChIdx = state.currentChapter - 1;
      const prevCh = data.chapters[prevChIdx];
      const lastSubIdx = (prevCh.subtopics && prevCh.subtopics.length > 0) ? prevCh.subtopics.length - 1 : 0;
      navigateTo(prevChIdx, lastSubIdx);
    }
  });

  nextChapterBtn.addEventListener('click', () => {
    if (state.layer === 'layer3') {
      setLayer('layer2');
      return;
    }
    const ch = data.chapters[state.currentChapter];
    if (ch && state.currentSubtopic < ch.subtopics.length - 1) {
      navigateTo(state.currentChapter, state.currentSubtopic + 1);
    } else if (state.currentChapter < data.chapters.length - 1) {
      navigateTo(state.currentChapter + 1, 0);
    }
  });

  // ================= IN-PAGE SEARCH HIGHLIGHTING (Penyelidikan Lapangan) =================
  function highlightTextInElement(element, query) {
    if (!query || !element) return 0;
    removeHighlightsInElement(element);

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flexible = escaped.replace(/['\u2018\u2019\u02bb\u02bc`]/g, "['\\u2018\\u2019\\u02bb\\u02bc`]");
    const regex = new RegExp(`(${flexible})`, 'gi');
    const textNodes = [];
    const walk = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (parent && (
            parent.tagName === 'SCRIPT' ||
            parent.tagName === 'STYLE' ||
            parent.classList.contains('content-search-match') ||
            parent.classList.contains('chapter-hikmah-box') ||
            parent.closest('.chapter-hikmah-box')
          )) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while ((node = walk.nextNode())) {
      if (regex.test(node.nodeValue)) {
        textNodes.push(node);
      }
      regex.lastIndex = 0;
    }

    let matchCount = 0;
    textNodes.forEach(tNode => {
      const parent = tNode.parentNode;
      if (!parent) return;
      const text = tNode.nodeValue;
      const parts = text.split(regex);

      const fragment = document.createDocumentFragment();
      for (let i = 0; i < parts.length; i++) {
        if (regex.test(parts[i])) {
          const mark = document.createElement('mark');
          mark.className = 'content-search-match';
          mark.setAttribute('data-match-idx', matchCount);
          mark.textContent = parts[i];
          fragment.appendChild(mark);
          matchCount++;
        } else if (parts[i]) {
          fragment.appendChild(document.createTextNode(parts[i]));
        }
        regex.lastIndex = 0;
      }
      parent.replaceChild(fragment, tNode);
    });

    return matchCount;
  }

  function removeHighlightsInElement(element) {
    if (!element) return;
    const marks = element.querySelectorAll('mark.content-search-match');
    marks.forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
      }
    });
  }

  function focusSearchMatch(idx) {
    const marks = contentBody.querySelectorAll('mark.content-search-match');
    if (!marks || marks.length === 0) return;

    marks.forEach(m => m.classList.remove('active-match'));

    const safeIdx = (idx + marks.length) % marks.length;
    state.activeMatchIndex = safeIdx;

    const targetMark = marks[safeIdx];
    if (targetMark) {
      targetMark.classList.add('active-match');

      // Auto-buka details / accordion jika match berada di dalamnya
      const parentDetails = targetMark.closest('details');
      if (parentDetails) {
        parentDetails.open = true;
      }

      // Auto-buka kotak sub-summary jika match berada di dalamnya
      const parentSubBox = targetMark.closest('.sub-summary-box');
      if (parentSubBox) {
        parentSubBox.style.display = 'block';
        const closeBtn = parentSubBox.querySelector('.btn-close-subsum');
        const parentH3 = parentSubBox.previousElementSibling;
        if (parentH3) {
          const tBtn = parentH3.querySelector('.btn-sub-summary-toggle');
          if (tBtn) tBtn.innerHTML = '✕ Tutup Ringkasan';
        }
      }

      targetMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const countEl = document.getElementById('sfbCount');
    if (countEl) {
      countEl.textContent = `${safeIdx + 1}/${marks.length}`;
    }
  }

  function showFloatingSearchToolbar(query, totalMatches) {
    removeFloatingSearchToolbar();

    // Pastikan senarai hasil sentiasa diisi jika ada activeSearchQuery
    if ((!state.searchResults || state.searchResults.length === 0) && query) {
      performSearch(query);
    }
    const totalTopics = state.searchResults ? state.searchResults.length : 0;
    let curTopicIdx = state.currentSearchResultIndex;
    if (curTopicIdx < 0 && state.searchResults) {
      curTopicIdx = state.searchResults.findIndex(r => r.chIdx === state.currentChapter);
      if (curTopicIdx >= 0) state.currentSearchResultIndex = curTopicIdx;
    }

    const hasMultiTopics = totalTopics > 0;
    const topicLabel = hasMultiTopics ? `📋 Hasil (${Math.max(1, curTopicIdx + 1)}/${totalTopics})` : `📋 Hasil Carian`;

    const bar = document.createElement('div');
    bar.className = 'search-floating-bar';
    bar.id = 'searchFloatingBar';
    bar.innerHTML = `
      <div class="sfb-badge">
        <span class="sfb-icon">🔍</span>
        <span class="sfb-text">"<span class="sfb-query" title="${query}">${query}</span>"</span>
        <span class="sfb-count" id="sfbCount" title="Kedudukan baris dalam bab ini">1/${totalMatches}</span>
      </div>
      <div class="sfb-actions">
        <button class="sfb-btn" id="sfbPrevBtn" title="Baris Sebelumnya Dalam Bab Ini" aria-label="Baris Sebelumnya">▲</button>
        <button class="sfb-btn" id="sfbNextBtn" title="Baris Seterusnya Dalam Bab Ini" aria-label="Baris Seterusnya">▼</button>
        
        ${hasMultiTopics ? `
          <div class="sfb-divider"></div>
          <button class="sfb-topic-btn" id="sfbTopicListBtn" title="Buka Semula Senarai Semua ${totalTopics} Hasil Carian">${topicLabel}</button>
          <button class="sfb-btn" id="sfbPrevTopicBtn" title="Bab Hasil Carian Sebelumnya" aria-label="Bab Sebelumnya" ${curTopicIdx <= 0 ? 'disabled' : ''}>⏮</button>
          <button class="sfb-btn" id="sfbNextTopicBtn" title="Bab Hasil Carian Seterusnya" aria-label="Bab Seterusnya" ${curTopicIdx >= totalTopics - 1 ? 'disabled' : ''}>⏭</button>
        ` : ''}

        <div class="sfb-divider"></div>
        <button class="sfb-btn sfb-close-btn" id="sfbCloseBtn" title="Padam Sorotan & Tutup" aria-label="Padam Sorotan">✕</button>
      </div>
    `;

    document.body.appendChild(bar);

    const prevBtn = bar.querySelector('#sfbPrevBtn');
    const nextBtn = bar.querySelector('#sfbNextBtn');
    const topicListBtn = bar.querySelector('#sfbTopicListBtn');
    const prevTopicBtn = bar.querySelector('#sfbPrevTopicBtn');
    const nextTopicBtn = bar.querySelector('#sfbNextTopicBtn');
    const closeBtn = bar.querySelector('#sfbCloseBtn');

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        focusSearchMatch(state.activeMatchIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        focusSearchMatch(state.activeMatchIndex + 1);
      });
    }

    if (topicListBtn) {
      topicListBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.searchResults && state.searchResults.length > 0) {
          renderSearchResults(state.searchResults, state.activeSearchQuery);
        } else if (state.activeSearchQuery) {
          performSearch(state.activeSearchQuery);
        }
        searchOverlay.classList.add('open');
      });
    }

    if (prevTopicBtn) {
      prevTopicBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.searchResults && curTopicIdx > 0) {
          const prevRes = state.searchResults[curTopicIdx - 1];
          state.currentSearchResultIndex = curTopicIdx - 1;
          navigateTo(prevRes.chIdx, prevRes.targetLayer);
        }
      });
    }

    if (nextTopicBtn) {
      nextTopicBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.searchResults && curTopicIdx < totalTopics - 1) {
          const nextRes = state.searchResults[curTopicIdx + 1];
          state.currentSearchResultIndex = curTopicIdx + 1;
          navigateTo(nextRes.chIdx, nextRes.targetLayer);
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.activeSearchQuery = null;
        state.searchResults = [];
        state.currentSearchResultIndex = -1;
        searchInput.value = '';
        removeFloatingSearchToolbar();
        removeHighlightsInElement(contentBody);
      });
    }
  }

  function removeFloatingSearchToolbar() {
    const existing = document.getElementById('searchFloatingBar');
    if (existing) {
      existing.remove();
    }
  }

  // Markdown formatter for Layer 2
  function formatMarkdownSummary(raw) {
    let lines = raw.split('\n');
    let html = '';
    let inUl = false;

    lines.forEach(line => {
      let l = line.trim();
      if (!l) {
        if (inUl) { html += '</ul>'; inUl = false; }
        return;
      }

      // Check headings
      if (l.startsWith('### ')) {
        if (inUl) { html += '</ul>'; inUl = false; }
        html += `<h3 style="color: var(--gold-light); margin-top: 1.5rem; margin-bottom: 0.5rem;">${l.substring(4)}</h3>`;
      } else if (l.startsWith('#### ')) {
        if (inUl) { html += '</ul>'; inUl = false; }
        html += `<h4 style="color: var(--emerald-primary); margin-top: 1.2rem; margin-bottom: 0.4rem;">${l.substring(5)}</h4>`;
      } else if (l.startsWith('• ') || l.startsWith('- ') || l.startsWith('* ')) {
        if (!inUl) { html += '<ul style="padding-left: 1.5rem; margin-bottom: 1rem;">'; inUl = true; }
        let bulletContent = l.substring(2)
          .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--gold-light);">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>');
        html += `<li style="margin-bottom: 8px;">${bulletContent}</li>`;
      } else if (l.startsWith('➤ ')) {
        if (inUl) { html += '</ul>'; inUl = false; }
        let itemContent = l.substring(2)
          .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--gold-light);">$1</strong>');
        html += `<div style="background: rgba(41, 128, 185, 0.1); border-left: 3px solid var(--gold-primary); padding: 8px 12px; margin-bottom: 8px; border-radius: 4px;">➤ ${itemContent}</div>`;
      } else if (l.startsWith('—')) {
        if (inUl) { html += '</ul>'; inUl = false; }
        html += '<hr style="border: none; border-top: 1px solid var(--border-card); margin: 1.5rem 0;">';
      } else {
        if (inUl) { html += '</ul>'; inUl = false; }
        let pContent = l
          .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--gold-light);">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>');
        html += `<p style="margin-bottom: 1rem; line-height: 1.8;">${pContent}</p>`;
      }
    });

    if (inUl) { html += '</ul>'; }
    return html;
  }

  function formatQuoteText(text) {
    if (!text) return '';
    // Protect HTML tags (especially footnote spans so title attributes are not corrupted)
    const tokens = [];
    let formatted = text.replace(/<[^>]+>/g, (match) => {
      tokens.push(match);
      return `___HTML_TOKEN_${tokens.length - 1}___`;
    });

    const names = [
      'Rasulullah SAW', 'Nabi SAW', 'Sayyidina Umar', 'Umar bin al-Khattab',
      'Muadz bin Jabal', 'Mu\'az bin Jabal', 'Ibnu Taimiyah',
      'Iqbal', 'Muhammad Iqbal', 'Imam Ahmad', 'Fudhail bin \'Iyadh',
      'Abdullah bin al-Mubarak', 'Yahya bin Mu\'aaz', 'Ibnu al-Qayyim',
      'Maimun bin Mahran', 'Asy-Syatibi', 'Hasan al-Banna', 'Hasan al-Hudhaibi', 'Syed Qutb'
    ];
    names.forEach(name => {
      const regex = new RegExp(`(${name})`, 'gi');
      formatted = formatted.replace(regex, '<span class="tokoh-name" style="color: var(--gold-light); font-weight: 600;">$1</span>');
    });

    // Restore protected HTML tags
    return formatted.replace(/___HTML_TOKEN_(\d+)___/g, (_, i) => tokens[parseInt(i, 10)]);
  }

  // 7. Bottom Navigation (Prev / Next)
  function updateBottomNav() {
    if (state.layer === 'layer3') {
      prevChapterBtn.disabled = false;
      nextChapterBtn.disabled = false;
      prevChapterBtn.innerHTML = '← Baca Versi Lengkap';
      prevChapterBtn.title = 'Buka Versi Lengkap Bab Semasa';
      nextChapterBtn.innerHTML = 'Baca Ringkasan Bab →';
      nextChapterBtn.title = 'Buka Ringkasan Bab Semasa';
      return;
    }

    prevChapterBtn.disabled = (state.currentChapter <= 0);
    nextChapterBtn.disabled = (state.currentChapter >= data.chapters.length - 1);

    if (state.currentChapter > 0) {
      const prevCh = data.chapters[state.currentChapter - 1];
      prevChapterBtn.innerHTML = `← ${prevCh.number}`;
      prevChapterBtn.title = prevCh.title;
    } else {
      prevChapterBtn.innerHTML = '← Permulaan';
    }

    if (state.currentChapter < data.chapters.length - 1) {
      const nextCh = data.chapters[state.currentChapter + 1];
      nextChapterBtn.innerHTML = `${nextCh.number} →`;
      nextChapterBtn.title = nextCh.title;
    } else {
      nextChapterBtn.innerHTML = 'Tamat Kitab ✓';
    }
  }

  prevChapterBtn.addEventListener('click', () => {
    if (state.layer === 'layer3') {
      setLayer('layer1');
      return;
    }
    if (state.currentChapter > 0) {
      navigateTo(state.currentChapter - 1);
    }
  });

  nextChapterBtn.addEventListener('click', () => {
    if (state.layer === 'layer3') {
      setLayer('layer2');
      return;
    }
    if (state.currentChapter < data.chapters.length - 1) {
      navigateTo(state.currentChapter + 1);
    }
  });

  // 8. Layer Switcher (Lengkap vs Ringkasan vs Mutiara Hikmah)
  layerBtnLengkap.addEventListener('click', () => {
    setLayer('layer1');
  });

  layerBtnRingkasan.addEventListener('click', () => {
    setLayer('layer2');
  });

  if (layerBtnHikmah) {
    layerBtnHikmah.addEventListener('click', () => {
      setLayer('layer3');
    });
  }

  if (sidebarHikmahBtn) {
    sidebarHikmahBtn.addEventListener('click', () => {
      setLayer('layer3');
      if (state.mobileNavOpen) {
        toggleMobileNav();
      }
    });
  }

  function setLayer(layer) {
    state.layer = layer;
    localStorage.setItem('almuntalaq_layer', layer);

    layerBtnLengkap.classList.toggle('active', layer === 'layer1');
    layerBtnRingkasan.classList.toggle('active', layer === 'layer2');
    if (layerBtnHikmah) {
      layerBtnHikmah.classList.toggle('active', layer === 'layer3');
      layerBtnHikmah.setAttribute('aria-selected', layer === 'layer3');
    }
    layerBtnLengkap.setAttribute('aria-selected', layer === 'layer1');
    layerBtnRingkasan.setAttribute('aria-selected', layer === 'layer2');

    renderContent();
    let toastText = 'Mod Versi Lengkap diaktifkan';
    if (layer === 'layer2') toastText = 'Mod Ringkasan Eksklusif diaktifkan';
    if (layer === 'layer3') toastText = 'Mod Mutiara Hikmah Dakwah dibuka 💎';
    showToast(toastText);
  }

  // 9. Theme Toggle (Dark / Light)
  themeToggleBtn.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('almuntalaq_theme', state.theme);
    updateThemeIcon();
    showToast(`Tema ${state.theme === 'dark' ? 'Gelap' : 'Cerah'} dipilih`);
  });

  function updateThemeIcon() {
    themeToggleBtn.innerHTML = state.theme === 'dark' ? '☀️' : '🌙';
  }

  // 10. Font Size Controls
  fontIncBtn.addEventListener('click', () => {
    if (state.fontSize < 1.45) {
      state.fontSize = +(state.fontSize + 0.08).toFixed(2);
      applyFontSize();
    }
  });

  fontDecBtn.addEventListener('click', () => {
    if (state.fontSize > 0.85) {
      state.fontSize = +(state.fontSize - 0.08).toFixed(2);
      applyFontSize();
    }
  });

  fontResetBtn.addEventListener('click', () => {
    state.fontSize = 1.05;
    applyFontSize();
  });

  function applyFontSize() {
    document.documentElement.style.setProperty('--font-base', `${state.fontSize}rem`);
    localStorage.setItem('almuntalaq_fontsize', state.fontSize);
  }

  // 11. Bookmarks
  function updateBookmarkBtnStatus() {
    const isBookmarked = state.bookmarks.includes(state.currentChapter);
    bookmarkBtn.innerHTML = isBookmarked ? '★ Disimpan' : '☆ Tanda Buku';
    bookmarkBtn.style.color = isBookmarked ? 'var(--gold-light)' : 'var(--text-muted)';
  }

  bookmarkBtn.addEventListener('click', () => {
    const chIdx = state.currentChapter;
    const pos = state.bookmarks.indexOf(chIdx);
    if (pos > -1) {
      state.bookmarks.splice(pos, 1);
      showToast('Tanda buku dipadam');
    } else {
      state.bookmarks.push(chIdx);
      showToast('Bab berjaya ditanda!');
    }
    localStorage.setItem('almuntalaq_bookmarks', JSON.stringify(state.bookmarks));
    updateBookmarkBtnStatus();
  });

  // 12. Copy Content
  copyBtn.addEventListener('click', () => {
    if (state.layer === 'layer3') {
      const item = allHikmahQuotes[currentFeaturedHikmahIndex] || allHikmahQuotes[0];
      copyHikmahToClipboard(item);
      return;
    }

    const ch = data.chapters[state.currentChapter];
    const textToCopy = `Al-Muntalaq (${ch.number}: ${ch.title})\n\n` + 
      (state.layer === 'layer1' && ch.paragraphs ? ch.paragraphs.slice(0, 3).map(p => (typeof p === 'string' ? p : p.text)).join('\n\n') : ch.summary);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => showToast('Petikan bab berjaya disalin!'))
        .catch(() => fallbackCopyText(textToCopy));
    } else {
      fallbackCopyText(textToCopy);
    }
  });

  // 13. Search Engine
  function normalizeSearchText(str) {
    return (str || '')
      .toLowerCase()
      .replace(/[\u2018\u2019\u02bb\u02bc`]/g, "'");
  }

  function getApostropheRegex(query) {
    const escaped = (query || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flexible = escaped.replace(/['\u2018\u2019\u02bb\u02bc`]/g, "['\\u2018\\u2019\\u02bb\\u02bc`]");
    return new RegExp(`(${flexible})`, 'gi');
  }

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    if (query.length < 2) {
      searchOverlay.classList.remove('open');
      return;
    }
    performSearch(query);
  });

  function performSearch(query) {
    const results = [];
    const normQuery = normalizeSearchText(query);
    if (!normQuery) return;

    data.chapters.forEach((ch, chIdx) => {
      // Cari dalam setiap subtopik
      if (ch.subtopics && ch.subtopics.length > 0) {
        ch.subtopics.forEach((sub, sIdx) => {
          let foundInSub = false;

          // 1. Semak perenggan subtopik (Layer 1)
          if (sub.paragraphs) {
            for (let pObj of sub.paragraphs) {
              const pStr = (typeof pObj === 'string') ? pObj : (pObj.text || '');
              const normPStr = normalizeSearchText(pStr);
              if (normPStr.includes(normQuery)) {
                const cleanStr = pStr.replace(/<[^>]+>/g, '');
                const normCleanStr = normalizeSearchText(cleanStr);
                const startIdx = Math.max(0, normCleanStr.indexOf(normQuery) - 35);
                const snippet = cleanStr.substring(startIdx, startIdx + 130);
                results.push({
                  chIdx,
                  subIdx: sIdx,
                  targetLayer: 'layer1',
                  layerLabel: 'Versi Penuh',
                  title: `${ch.number} • ${sub.title}`,
                  snippet: highlightText(snippet, query)
                });
                foundInSub = true;
                break;
              }
            }
          }

          // 2. Semak tajuk subtopik jika belum jumpa
          if (!foundInSub && normalizeSearchText(sub.title).includes(normQuery)) {
            results.push({
              chIdx,
              subIdx: sIdx,
              targetLayer: 'layer1',
              layerLabel: 'Versi Penuh',
              title: `${ch.number} • ${sub.title}`,
              snippet: `Tajuk sepadan: ${highlightText(sub.title, query)}`
            });
            foundInSub = true;
          }

          // 3. Semak ringkasan subtopik (Layer 2) jika belum jumpa
          if (!foundInSub && sub.summary && normalizeSearchText(sub.summary).includes(normQuery)) {
            const normSubSum = normalizeSearchText(sub.summary);
            const startIdx = Math.max(0, normSubSum.indexOf(normQuery) - 30);
            const snippet = sub.summary.substring(startIdx, startIdx + 120);
            results.push({
              chIdx,
              subIdx: sIdx,
              targetLayer: 'layer2',
              layerLabel: 'Ringkasan',
              title: `${ch.number} • ${sub.title}`,
              snippet: highlightText(snippet, query)
            });
          }
        });
      }
    });

    state.searchResults = results;
    state.activeSearchQuery = query;
    renderSearchResults(results, query);
  }

  function highlightText(text, query) {
    if (!text || !query) return text || '';
    const regex = getApostropheRegex(query);
    return text.replace(regex, '<mark style="background: var(--gold-primary); color: #000; padding: 1px 4px; border-radius: 3px;">$1</mark>');
  }

  function renderSearchResults(results, query) {
    searchResultsList.innerHTML = '';
    searchCountBadge.textContent = `${results.length} padanan untuk "${query}"`;

    if (results.length === 0) {
      searchResultsList.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          Tiada hasil dijumpai untuk carian ini.
        </div>
      `;
    } else {
      results.forEach((res, rIdx) => {
        const isCurrentReading = (res.chIdx === state.currentChapter);
        const isLayer1 = (res.targetLayer !== 'layer2');
        const badgeClass = isLayer1 ? 'badge-layer1' : 'badge-layer2';
        const badgeText = isLayer1 ? '📖 Versi Penuh' : '📑 Ringkasan';

        const item = document.createElement('div');
        item.className = 'search-result-item' + (isCurrentReading ? ' active-reading' : '');
        item.style.padding = '12px';
        item.style.borderBottom = '1px solid var(--border-card)';
        item.style.cursor = 'pointer';
        item.innerHTML = `
          <div class="search-result-title" style="color: var(--gold-light); font-weight: 600; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
            <span>${res.title}</span>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="search-layer-badge ${badgeClass}">${badgeText}</span>
              ${isCurrentReading ? '<span class="search-result-current-badge">Sedang Dibaca 📖</span>' : ''}
            </div>
          </div>
          <div class="search-result-snippet" style="color: var(--text-light); font-size: 0.9rem; margin-top: 6px;">...${res.snippet}...</div>
        `;
        item.addEventListener('click', () => {
          searchOverlay.classList.remove('open');
          state.activeSearchQuery = query.trim();
          state.activeMatchIndex = 0;
          state.searchResults = results;
          state.currentSearchResultIndex = rIdx;
          searchInput.value = query.trim();
          
          // Default ke targetLayer (Versi Penuh didahulukan)
          const chosenLayer = res.targetLayer || 'layer1';
          navigateTo(res.chIdx, res.subIdx || 0, chosenLayer);
        });
        searchResultsList.appendChild(item);
      });
    }

    searchOverlay.classList.add('open');
  }

  closeSearchBtn.addEventListener('click', () => {
    searchOverlay.classList.remove('open');
  });

  // 14. Mobile Drawer Toggle
  function toggleMobileNav(force) {
    state.mobileNavOpen = typeof force === 'boolean' ? force : !state.mobileNavOpen;
    appSidebar.classList.toggle('open-mobile', state.mobileNavOpen);
  }

  mobileMenuBtn.addEventListener('click', () => toggleMobileNav());

  // Close search when pressing ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchOverlay.classList.remove('open');
      toggleMobileNav(false);
    }
  });

  // Brand click reset to chapter 0
  document.getElementById('brandHomeBtn').addEventListener('click', (e) => {
    if (e.target !== mobileMenuBtn) {
      navigateTo(0);
    }
  });

  // ==========================================================================
  // MUTIARA HIKMAH DAKWAH (LAYER 3 LOGIC)
  // ==========================================================================
  let currentFeaturedHikmahIndex = Math.floor(Math.random() * (allHikmahQuotes.length || 1));
  let activeHikmahCategory = 'all';
  let hikmahSearchQuery = '';

  function renderHikmahView(container) {
    if (!allHikmahQuotes || allHikmahQuotes.length === 0) {
      container.innerHTML = '<p class="text-muted" style="text-align:center; padding: 2rem;">Koleksi mutiara hikmah sedang dikemas kini.</p>';
      return;
    }

    const wrap = document.createElement('div');
    wrap.className = 'hikmah-container';

    // 1. Featured Hero Random Quote Card
    const heroCardEl = document.createElement('div');
    heroCardEl.className = 'hikmah-hero-card';
    heroCardEl.id = 'hikmahFeaturedCard';
    wrap.appendChild(heroCardEl);

    // 2. Toolbar (Search & Filter Chips)
    const toolbarEl = document.createElement('div');
    toolbarEl.className = 'hikmah-toolbar';
    toolbarEl.innerHTML = `
      <div class="hikmah-search-wrap">
        <span class="hikmah-search-icon">🔍</span>
        <input type="text" class="hikmah-search-input" id="hikmahSearchInput" placeholder="Cari kata hikmah, nama tokoh, dalil, atau bab..." value="${hikmahSearchQuery}">
      </div>
      <div class="hikmah-filter-chips" id="hikmahFilterChips">
        <button class="hikmah-chip-btn ${activeHikmahCategory === 'all' ? 'active' : ''}" data-cat="all">Semua (${allHikmahQuotes.length})</button>
        <button class="hikmah-chip-btn ${activeHikmahCategory === 'sahabat' ? 'active' : ''}" data-cat="sahabat">Sahabat & Khulafa' RA</button>
        <button class="hikmah-chip-btn ${activeHikmahCategory === 'banna' ? 'active' : ''}" data-cat="banna">Imam Hasan Al-Banna</button>
        <button class="hikmah-chip-btn ${activeHikmahCategory === 'qutb' ? 'active' : ''}" data-cat="qutb">Sayyid Qutb</button>
        <button class="hikmah-chip-btn ${activeHikmahCategory === 'salaf' ? 'active' : ''}" data-cat="salaf">Aimmah & Ulama Salaf</button>
        <button class="hikmah-chip-btn ${activeHikmahCategory === 'syair' ? 'active' : ''}" data-cat="syair">Syair Perjuangan</button>
        <button class="hikmah-chip-btn ${activeHikmahCategory === 'hadis' ? 'active' : ''}" data-cat="hadis">Hadis & Atsar</button>
        <button class="hikmah-chip-btn ${activeHikmahCategory === 'rasyid' ? 'active' : ''}" data-cat="rasyid">Syeikh Ar-Rasyid</button>
      </div>
    `;
    wrap.appendChild(toolbarEl);

    // 3. Grid List of Quotes
    const gridEl = document.createElement('div');
    gridEl.className = 'hikmah-grid';
    gridEl.id = 'hikmahGrid';
    wrap.appendChild(gridEl);

    container.appendChild(wrap);

    // Render Featured Quote and Grid
    updateFeaturedCard(heroCardEl);
    updateHikmahGrid(gridEl);

    // Attach Search listener
    const searchInputEl = toolbarEl.querySelector('#hikmahSearchInput');
    searchInputEl.addEventListener('input', (e) => {
      hikmahSearchQuery = e.target.value.toLowerCase().trim();
      updateHikmahGrid(gridEl);
    });

    // Attach Filter Chips listeners
    toolbarEl.querySelectorAll('.hikmah-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        toolbarEl.querySelectorAll('.hikmah-chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeHikmahCategory = btn.getAttribute('data-cat');
        updateHikmahGrid(gridEl);
      });
    });
  }

  function updateFeaturedCard(cardEl) {
    if (!cardEl) cardEl = document.getElementById('hikmahFeaturedCard');
    if (!cardEl) return;

    const item = allHikmahQuotes[currentFeaturedHikmahIndex] || allHikmahQuotes[0];

    cardEl.innerHTML = `
      <div class="hikmah-hero-header">
        <div class="hikmah-tag-group">
          <span class="hikmah-hero-badge">💎 MUTIARA HIKMAH PILIHAN</span>
          <span class="hikmah-speaker-pill">👤 ${item.speaker}</span>
        </div>
        <span style="font-size: 0.8rem; color: var(--gold-light); font-weight: 600;">#${currentFeaturedHikmahIndex + 1} daripada ${allHikmahQuotes.length}</span>
      </div>

      <div class="hikmah-hero-quote">
        ${formatHikmahQuote(item.quote)}
      </div>

      <div class="hikmah-hero-source">
        <span>📚 Sumber:</span>
        <strong>${item.chapterNumber} — ${item.chapterTitle}</strong>
      </div>

      <div class="hikmah-actions-row">
        <button class="hikmah-action-btn hikmah-btn-primary" id="btnNextRandomHikmah">
          <span>🔄</span>
          <span>Jana Hikmah Lain (Rawak)</span>
        </button>
        <button class="hikmah-action-btn hikmah-btn-secondary" id="btnCopyFeaturedHikmah">
          <span>📋</span>
          <span>Salin Hikmah</span>
        </button>
        <button class="hikmah-action-btn hikmah-btn-emerald" id="btnReadChapterFeatured">
          <span>📖</span>
          <span>Buka Bab Lengkap</span>
        </button>
      </div>
    `;

    // Action button listeners
    const btnNext = cardEl.querySelector('#btnNextRandomHikmah');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        let nextIdx = Math.floor(Math.random() * allHikmahQuotes.length);
        if (nextIdx === currentFeaturedHikmahIndex && allHikmahQuotes.length > 1) {
          nextIdx = (nextIdx + 1) % allHikmahQuotes.length;
        }
        currentFeaturedHikmahIndex = nextIdx;
        updateFeaturedCard(cardEl);
      });
    }

    const btnCopy = cardEl.querySelector('#btnCopyFeaturedHikmah');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        copyHikmahToClipboard(item);
      });
    }

    const btnRead = cardEl.querySelector('#btnReadChapterFeatured');
    if (btnRead) {
      btnRead.addEventListener('click', () => {
        navigateTo(item.chapterIndex);
        setLayer('layer1');
      });
    }
  }

  function filterHikmahQuotes() {
    return allHikmahQuotes.filter(item => {
      // 1. Search query match
      if (hikmahSearchQuery) {
        const textToSearch = `${item.speaker} ${item.quote} ${item.chapterNumber} ${item.chapterTitle}`.toLowerCase();
        if (!textToSearch.includes(hikmahSearchQuery)) {
          return false;
        }
      }

      // 2. Category match
      if (activeHikmahCategory === 'sahabat') {
        return item.category === 'sahabat' || item.speaker.toLowerCase().includes('ra');
      } else if (activeHikmahCategory === 'banna') {
        return item.speaker.toLowerCase().includes('banna');
      } else if (activeHikmahCategory === 'qutb') {
        return item.speaker.toLowerCase().includes('qutb');
      } else if (activeHikmahCategory === 'salaf') {
        return item.category === 'salaf' || item.category === 'ulama';
      } else if (activeHikmahCategory === 'syair') {
        return item.category === 'syair';
      } else if (activeHikmahCategory === 'hadis') {
        return item.category === 'hadis';
      } else if (activeHikmahCategory === 'rasyid') {
        return item.speaker.toLowerCase().includes('rasyid');
      }

      return true; // 'all'
    });
  }

  function updateHikmahGrid(gridEl) {
    if (!gridEl) gridEl = document.getElementById('hikmahGrid');
    if (!gridEl) return;

    const filtered = filterHikmahQuotes();
    gridEl.innerHTML = '';

    if (filtered.length === 0) {
      gridEl.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🔍</div>
          <p style="font-weight: 600; color: var(--gold-light);">Tiada kata hikmah ditemui bagi carian ini</p>
          <small>Sila cuba kata kunci lain atau pilih tab 'Semua'.</small>
        </div>
      `;
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'hikmah-card';
      card.innerHTML = `
        <div>
          <div class="hikmah-card-top">
            <span class="hikmah-card-speaker">👤 ${item.speaker}</span>
            <span class="hikmah-card-index">#${item.id}</span>
          </div>
          <div class="hikmah-card-body">
            ${formatHikmahQuote(item.quote)}
          </div>
        </div>
        <div class="hikmah-card-footer">
          <span class="hikmah-card-chapter" title="Buka bab ini">${item.chapterNumber}</span>
          <div class="hikmah-card-actions">
            <button class="hikmah-card-btn btn-copy-card" title="Salin kata hikmah ini">
              <span>📋</span>
              <span>Salin</span>
            </button>
            <button class="hikmah-card-btn btn-read-card" title="Buka bab lengkap">
              <span>📖</span>
              <span>Bab</span>
            </button>
          </div>
        </div>
      `;

      // Copy listener
      card.querySelector('.btn-copy-card').addEventListener('click', () => {
        copyHikmahToClipboard(item);
      });

      // Read Chapter listener
      card.querySelector('.btn-read-card').addEventListener('click', () => {
        navigateTo(item.chapterIndex);
        setLayer('layer1');
      });

      card.querySelector('.hikmah-card-chapter').addEventListener('click', () => {
        navigateTo(item.chapterIndex);
        setLayer('layer1');
      });

      gridEl.appendChild(card);
    });
  }

  function formatHikmahQuote(text) {
    if (!text) return '';
    let formatted = text;
    // Highlight Arabic quotation brackets « ... » with distinct Arabic quote block
    formatted = formatted.replace(/«\s*(.*?)\s*»/g, '<span class="ar-quote">« $1 »</span>');
    // Highlight Malay / English quoted speech “...”
    formatted = formatted.replace(/“\s*(.*?)\s*”/g, '<strong style="color: var(--gold-light);">“$1”</strong>');
    return formatted;
  }

  function copyHikmahToClipboard(item) {
    const textToCopy = `💎 ${allHikmahQuotes.length} MUTIARA KATA\n(Hadis Nabi SAW + Tokoh & Pejuang)\n` +
      `👤 ${item.speaker}\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `"${item.quote}"\n\n` +
      `📚 Sumber: ${item.chapterNumber} - ${item.chapterTitle}\n` +
      `🌟 Kitab Al-Muntalaq — Syeikh Muhammad Ahmad Ar-Rasyid\n` +
      `🌐 https://al-muntalaq-dakwah.netlify.app/?v=2`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('Kata hikmah berjaya disalin! Sedia untuk dikongsi 💎');
      }).catch(() => {
        fallbackCopyText(textToCopy);
      });
    } else {
      fallbackCopyText(textToCopy);
    }
  }

  function fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('Kata hikmah berjaya disalin! Sedia untuk dikongsi 💎');
    } catch (err) {
      showToast('Gagal menyalin teks');
    }
    document.body.removeChild(textArea);
  }

  // Toast Helper
  let toastTimer = null;
  
  // Helper to format Footnote text with proper Italic book titles and bold
  function formatFootnoteBody(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="book-ref-title">$1</em>');
  }

  function showToast(msg) {
    if (!toast || !toastMsg) return;
    toastMsg.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // Initial setup
  renderSidebar();
  if (state.layer === 'layer3') {
    setLayer('layer3');
  } else {
    setLayer(state.layer);
    navigateTo(0);
  }
});
