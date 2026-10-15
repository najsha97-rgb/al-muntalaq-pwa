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
  const allHikmahQuotes = [];
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

  // App State
  const state = {
    currentChapter: 0,
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

  // 4. Render Sidebar List with Subtopics Support
  function renderSidebar() {
    chapterNavList.innerHTML = '';

    data.chapters.forEach((ch, chIdx) => {
      const isCurrent = (chIdx === state.currentChapter);
      const li = document.createElement('li');
      li.className = `chapter-nav-item ${isCurrent ? 'active-chapter open' : ''}`;
      li.id = `nav-ch-${chIdx}`;

      const btn = document.createElement('button');
      btn.className = 'chapter-header-btn';
      btn.innerHTML = `
        <span class="chapter-num-badge">${ch.number.replace('BAB ', 'B').replace('MUKADIMAH', 'M')}</span>
        <div class="ch-nav-label-box" style="flex: 1; text-align: left; overflow: hidden;">
          <div class="chapter-title-text" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${ch.title}">${ch.title}</div>
          <small style="color: var(--gold-light); font-family: 'Amiri', serif; font-size: 0.85rem;">${ch.title_ar || ''}</small>
        </div>
        ${ch.subtopics && ch.subtopics.length > 0 ? '<span class="chevron-icon">›</span>' : ''}
      `;

      btn.addEventListener('click', () => {
        if (state.currentChapter === chIdx) {
          li.classList.toggle('open');
        } else {
          navigateTo(chIdx);
          if (window.innerWidth <= 900) {
            toggleMobileNav(false);
          }
        }
      });

      li.appendChild(btn);

      // Render Subtopics list under chapter
      if (ch.subtopics && ch.subtopics.length > 0) {
        const subUl = document.createElement('ul');
        subUl.className = 'subtopic-list';

        ch.subtopics.forEach((subTitle, sIdx) => {
          const subLi = document.createElement('li');
          const subBtn = document.createElement('button');
          subBtn.className = 'subtopic-nav-btn';
          subBtn.innerHTML = `❖ ${subTitle}`;
          subBtn.title = subTitle;

          subBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (state.currentChapter !== chIdx) {
              navigateTo(chIdx);
            }
            if (state.layer !== 'layer1') {
              setLayer('layer1');
            }
            if (window.innerWidth <= 900) {
              toggleMobileNav(false);
            }
            setTimeout(() => {
              const targetEl = document.getElementById(`sub-${chIdx}-${sIdx}`);
              if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 100);
          });

          subLi.appendChild(subBtn);
          subUl.appendChild(subLi);
        });

        li.appendChild(subUl);
      }

      chapterNavList.appendChild(li);
    });
  }

  // 5. Navigate to Chapter
  function navigateTo(chIdx) {
    if (chIdx < 0 || chIdx >= data.chapters.length) return;
    state.currentChapter = chIdx;

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
      item.classList.toggle('open', isCur);
    });

    renderContent();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 6. Render Reader Content
  function renderContent() {
    const ch = data.chapters[state.currentChapter];
    if (!ch) return;

    if (state.layer === 'layer3') {
      heroCard.style.display = 'none';
      readerContainer.style.display = 'block';

      document.getElementById('chBadgePill').textContent = '💎 KOLEKSI EMAS DAKWAH';
      document.getElementById('chArabicTitle').textContent = 'درر الحكمة والدعوة';
      document.getElementById('chapterMainTitle').textContent = 'Mutiara Hikmah & Kata-Kata Tokoh';

      const modeBadge = document.getElementById('activeModeBadge');
      modeBadge.textContent = `Koleksi 46 Mutiara Hikmah (Nukilan Tokoh Salaf, Hadis & Taujih Ar-Rasyid)`;

      updateBookmarkBtnStatus();
      const contentBody = document.getElementById('contentBody');
      contentBody.innerHTML = '';
      renderHikmahView(contentBody);
      updateBottomNav();
      return;
    }

    // Hero visible only on Mukadimah
    heroCard.style.display = (state.currentChapter === 0) ? 'block' : 'none';
    readerContainer.style.display = 'block';

    // Banner metadata
    document.getElementById('chBadgePill').textContent = ch.number;
    document.getElementById('chArabicTitle').textContent = ch.title_ar || '';
    document.getElementById('chapterMainTitle').textContent = ch.title;

    // Active layer indicator text
    const modeBadge = document.getElementById('activeModeBadge');
    modeBadge.textContent = state.layer === 'layer1' 
      ? `Versi Lengkap (${ch.paragraphs ? ch.paragraphs.length : 0} Perenggan & ${ch.footnotes ? ch.footnotes.length : 0} Nota Kaki)` 
      : 'Ringkasan Eksklusif (Layer 2 - Fiqh Haraki & Intipati)';

    // Update bookmark status
    updateBookmarkBtnStatus();

    // Render Body according to layer
    const contentBody = document.getElementById('contentBody');
    contentBody.innerHTML = '';

    if (state.layer === 'layer1') {
      // ==================== LAYER 1: VERSI PENUH ====================
      if (ch.paragraphs && ch.paragraphs.length > 0) {
        let subCounter = 0;

        ch.paragraphs.forEach(para => {
          const pType = para.type || 'text';
          const pText = para.text || '';

          if (pType === 'heading2') {
            const h3 = document.createElement('h3');
            h3.className = 'reader-subheading';
            h3.id = `sub-${state.currentChapter}-${subCounter}`;
            h3.innerHTML = `<span class="sub-ornament">❖</span> ${pText}`;
            contentBody.appendChild(h3);
            subCounter++;
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

        // Render Footnotes Section at the bottom of the chapter
        if (ch.footnotes && ch.footnotes.length > 0) {
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
              <span class="fn-total-pill">${ch.footnotes.length} Rujukan</span>
            </div>
            <div class="footnotes-list-box">
              ${ch.footnotes.map(fn => `
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
                  <div class="fn-card-body">${fn.text}</div>
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
            const fnData = ch.footnotes ? ch.footnotes.find(f => f.id == fnId) : null;
            if (fnData) {
              showToast(`[${fnId}] ${fnData.text}`);
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

              // Denyutan warna emas/hijau pada nombor rujukan dalam perenggan
              targetRef.classList.remove('fn-ref-return-highlight');
              void targetRef.offsetWidth; // trigger reflow
              targetRef.classList.add('fn-ref-return-highlight');
              setTimeout(() => targetRef.classList.remove('fn-ref-return-highlight'), 3200);

              // Kilauan lembut pada perenggan agar mudah menyambung bacaan
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
        contentBody.innerHTML = '<p class="text-muted">Tiada teks lanjutan bagi bab ini.</p>';
      }
    } else {
      // ==================== LAYER 2: RINGKASAN EKSKLUSIF ====================
      const summaryBox = document.createElement('div');
      summaryBox.className = 'summary-container';

      if (ch.summary && ch.summary.trim() !== '') {
        summaryBox.innerHTML = formatMarkdownSummary(ch.summary);
      } else {
        summaryBox.innerHTML = `
          <div style="text-align: center; padding: 2rem;">
            <p style="color: var(--gold-light); font-weight: 600;">Ringkasan Bab Sedang Dikemas Kini</p>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Sahabat boleh membaca Versi Lengkap (Layer 1).</p>
          </div>
        `;
      }
      contentBody.appendChild(summaryBox);
    }

    // Paparan Jalur Mutiara Hikmah Bab Ini (jika bab mengandungi mutiara hikmah)
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

    // Update Bottom Navigation buttons
    updateBottomNav();
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
    const names = [
      'Rasulullah SAW', 'Nabi SAW', 'Sayyidina Umar', 'Umar bin al-Khattab',
      'Muadz bin Jabal', 'Mu\'az bin Jabal', 'Ibnu Taimiyyah', 'Ibn Taimiyyah',
      'Iqbal', 'Muhammad Iqbal', 'Imam Ahmad', 'Fudhail bin \'Iyadh',
      'Abdullah bin al-Mubarak', 'Yahya bin Mu\'aaz', 'Ibnu al-Qayyim',
      'Maimun bin Mahran', 'Asy-Syatibi', 'Hassan al-Banna', 'Syed Qutb'
    ];
    let formatted = text;
    names.forEach(name => {
      const regex = new RegExp(`(${name})`, 'gi');
      formatted = formatted.replace(regex, '<span class="tokoh-name" style="color: var(--gold-light); font-weight: 600;">$1</span>');
    });
    return formatted;
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

    data.chapters.forEach((ch, chIdx) => {
      // 1. Check title or Arabic title
      if (ch.title.toLowerCase().includes(query) || (ch.title_ar && ch.title_ar.includes(query))) {
        results.push({
          chIdx,
          title: `${ch.number}: ${ch.title}`,
          snippet: `Tajuk sepadan: ${ch.title} (${ch.title_ar || ''})`
        });
        return;
      }

      // 2. Check subtopics
      if (ch.subtopics) {
        for (let st of ch.subtopics) {
          if (st.toLowerCase().includes(query)) {
            results.push({
              chIdx,
              title: `${ch.number}: ${ch.title}`,
              snippet: `Sub-tajuk: ${highlightText(st, query)}`
            });
            return;
          }
        }
      }

      // 3. Check summary
      if (ch.summary && ch.summary.toLowerCase().includes(query)) {
        const startIdx = Math.max(0, ch.summary.toLowerCase().indexOf(query) - 30);
        const snippet = ch.summary.substring(startIdx, startIdx + 120);
        results.push({
          chIdx,
          title: `${ch.number}: ${ch.title}`,
          snippet: highlightText(snippet, query)
        });
        return;
      }

      // 4. Check paragraphs
      if (ch.paragraphs) {
        for (let pObj of ch.paragraphs) {
          const pStr = (typeof pObj === 'string') ? pObj : (pObj.text || '');
          if (pStr.toLowerCase().includes(query)) {
            const cleanStr = pStr.replace(/<[^>]+>/g, '');
            const startIdx = Math.max(0, cleanStr.toLowerCase().indexOf(query) - 35);
            const snippet = cleanStr.substring(startIdx, startIdx + 130);
            results.push({
              chIdx,
              title: `${ch.number}: ${ch.title}`,
              snippet: highlightText(snippet, query)
            });
            break;
          }
        }
      }
    });

    renderSearchResults(results, query);
  }

  function highlightText(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
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
      results.forEach(res => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.style.padding = '12px';
        item.style.borderBottom = '1px solid var(--border-card)';
        item.style.cursor = 'pointer';
        item.innerHTML = `
          <div class="search-result-title" style="color: var(--gold-light); font-weight: 600;">${res.title}</div>
          <div class="search-result-snippet" style="color: var(--text-light); font-size: 0.9rem; margin-top: 4px;">...${res.snippet}...</div>
        `;
        item.addEventListener('click', () => {
          searchOverlay.classList.remove('open');
          searchInput.value = '';
          navigateTo(res.chIdx);
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
        <button class="hikmah-chip-btn ${activeHikmahCategory === 'banna' ? 'active' : ''}" data-cat="banna">Imam Hassan Al-Banna</button>
        <button class="hikmah-chip-btn ${activeHikmahCategory === 'qutb' ? 'active' : ''}" data-cat="qutb">Sayyid Qutb</button>
        <button class="hikmah-chip-btn ${activeHikmahCategory === 'salaf' ? 'active' : ''}" data-cat="salaf">Ulama & Tabi'in</button>
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
        const sp = item.speaker.toLowerCase();
        return sp.includes('ra') || sp.includes('sahabat') || sp.includes('umar') || sp.includes('ali') || sp.includes('muadz') || sp.includes('khalifah') || sp.includes('rawahah');
      } else if (activeHikmahCategory === 'banna') {
        return item.speaker.toLowerCase().includes('banna');
      } else if (activeHikmahCategory === 'qutb') {
        return item.speaker.toLowerCase().includes('qutb');
      } else if (activeHikmahCategory === 'salaf') {
        const sp = item.speaker.toLowerCase();
        return sp.includes('ibn') || sp.includes('imam') || sp.includes('syeikhul') || sp.includes('fudhail') || sp.includes('hasan al-basri') || sp.includes('syatibi') || sp.includes('salaf') || sp.includes('pujangga');
      } else if (activeHikmahCategory === 'rasyid') {
        const sp = item.speaker.toLowerCase();
        return sp.includes('rasyid') || sp.includes('penulis') || sp.includes('syeikh ahmad');
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
            <button class="hikmah-card-btn btn-copy-card" title="Salin kata hikmah ini">📋 Salin</button>
            <button class="hikmah-card-btn btn-read-card" style="color: var(--gold-light);" title="Baca bab lengkap">📖 Bab</button>
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
    const textToCopy = `💎 MUTIARA HIKMAH DAKWAH\n` +
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
