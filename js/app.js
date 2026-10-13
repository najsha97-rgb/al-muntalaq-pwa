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
      .then(reg => console.log('Service Worker Registered:', reg.scope))
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
                    <div class="fn-card-badge-wrap">
                      <span class="fn-islamic-star" aria-hidden="true">❖</span>
                      <span class="fn-card-badge">[${fn.id}]</span>
                    </div>
                    <button type="button" class="fn-back-btn" data-fn-id="${fn.id}" aria-label="Kembali ke perenggan [${fn.id}] untuk sambung bacaan" title="Kembali ke perenggan [${fn.id}]">
                      <svg class="fn-return-svg" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M7.5 5L2.5 10L7.5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M2.5 10H13.5C15.7091 10 17.5 11.7909 17.5 14V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      <span class="fn-back-text">Kembali ke teks</span>
                      <span class="fn-back-pill">[${fn.id}]</span>
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

        // 2. Attach Click Handlers to the "Butang Comel" (.fn-back-btn) to jump back to text
        contentBody.querySelectorAll('.fn-back-btn').forEach(btn => {
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
    if (state.currentChapter > 0) {
      navigateTo(state.currentChapter - 1);
    }
  });

  nextChapterBtn.addEventListener('click', () => {
    if (state.currentChapter < data.chapters.length - 1) {
      navigateTo(state.currentChapter + 1);
    }
  });

  // 8. Layer Switcher (Lengkap vs Ringkasan)
  layerBtnLengkap.addEventListener('click', () => {
    setLayer('layer1');
  });

  layerBtnRingkasan.addEventListener('click', () => {
    setLayer('layer2');
  });

  function setLayer(layer) {
    state.layer = layer;
    localStorage.setItem('almuntalaq_layer', layer);

    layerBtnLengkap.classList.toggle('active', layer === 'layer1');
    layerBtnRingkasan.classList.toggle('active', layer === 'layer2');
    layerBtnLengkap.setAttribute('aria-selected', layer === 'layer1');
    layerBtnRingkasan.setAttribute('aria-selected', layer === 'layer2');

    renderContent();
    showToast(layer === 'layer1' ? 'Mod Versi Lengkap diaktifkan' : 'Mod Ringkasan Eksklusif diaktifkan');
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
    const ch = data.chapters[state.currentChapter];
    const textToCopy = `Al-Muntalaq (${ch.number}: ${ch.title})\n\n` + 
      (state.layer === 'layer1' && ch.paragraphs ? ch.paragraphs.slice(0, 3).map(p => (typeof p === 'string' ? p : p.text)).join('\n\n') : ch.summary);

    navigator.clipboard.writeText(textToCopy)
      .then(() => showToast('Petikan bab berjaya disalin!'))
      .catch(() => showToast('Gagal menyalin petikan.'));
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
  setLayer(state.layer);
  navigateTo(0);
});
