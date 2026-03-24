let currentPage = 1;
let editingWordKey = null; // Tracks the word currently being edited

function calculateItemsPerPage() {
    const headH = document.getElementById('appHead')?.offsetHeight || 0;
    const tabsH = document.getElementById('appTabs')?.offsetHeight || 0;
    const formH = document.getElementById('appForm')?.offsetHeight || 0;
    const barH = document.getElementById('appBar')?.offsetHeight || 0;
    
    const overheadSpace = headH + tabsH + formH + barH + 250; 
    const rowHeight = 45; 
    
    const availableHeight = window.innerHeight - overheadSpace;
    const itemsThatFit = Math.floor(availableHeight / rowHeight);
    
    return Math.max(5, itemsThatFit);
}

// Unified Save Function (Handles both Add and Edit)
function saveWordEntry() {
    const engInput = document.getElementById('addEng');
    const hiraInput = document.getElementById('addHira');
    const kataInput = document.getElementById('addKata');
    const kanjiInput = document.getElementById('addKanji');

    const eng = engInput.value.trim().toLowerCase();
    const hira = hiraInput.value.trim();
    const kata = kataInput.value.trim();
    const kanji = kanjiInput.value.trim();

    if (!eng) return engInput.focus();
    if (!hira && !kata && !kanji) return hiraInput.focus();

    const d = getDict();
    
    // Duplicate Protection Logic
    if (editingWordKey === null) {
        // We are adding a NEW word. Check if it already exists.
        if (d[eng]) {
            showFormError(`"${eng}" already exists in your dictionary.`);
            return;
        }
    } else {
        // We are EDITING an existing word. 
        // If they changed the English word to something that already exists, block it.
        if (eng !== editingWordKey && d[eng]) {
            showFormError(`Cannot rename. "${eng}" already exists.`);
            return;
        }
    }

    // If we are editing and the English key changed, we must delete the old record
    if (editingWordKey !== null && eng !== editingWordKey) {
        delete d[editingWordKey];
    }

    // Save the entry
    d[eng] = { h: hira, kt: kata, k: kanji };
    saveDict(d);

    // Show appropriate success message
    showFormSuccess(editingWordKey ? "Changes saved!" : "Added!");
    
    // Reset the form and UI back to default
    cancelEdit();
    
    // Refresh tables
    renderDictList(true); 
    renderWordBank();
}

// Enter Edit Mode
function editWord(eng) {
    const d = getDict();
    const e = d[eng];
    if (!e) return;
    
    editingWordKey = eng; // Lock in the edit state
    
    // Populate inputs
    document.getElementById('addEng').value = eng;
    document.getElementById('addHira').value = e.h || '';
    document.getElementById('addKata').value = e.kt || '';
    document.getElementById('addKanji').value = e.k || '';
    
    // Swap UI buttons
    document.getElementById('btnAdd').style.display = 'none';
    document.getElementById('btnSaveEdit').style.display = 'inline-flex';
    document.getElementById('btnCancelEdit').style.display = 'inline-flex';
    document.getElementById('errMsg').style.display = 'none';
    
    // Scroll up and focus
    document.getElementById('addEng').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    switchTab('dict');
}

// Exit Edit Mode
function cancelEdit() {
    editingWordKey = null; // Clear the edit state
    
    // Clear inputs
    document.getElementById('addEng').value = ''; 
    document.getElementById('addHira').value = ''; 
    document.getElementById('addKata').value = ''; 
    document.getElementById('addKanji').value = '';
    
    // Swap UI buttons back to default
    document.getElementById('btnAdd').style.display = 'inline-flex';
    document.getElementById('btnSaveEdit').style.display = 'none';
    document.getElementById('btnCancelEdit').style.display = 'none';
    document.getElementById('errMsg').style.display = 'none';
    
    document.getElementById('addEng').focus();
}

function deleteWord(eng) {
    const d = getDict();
    delete d[eng];
    saveDict(d);
    
    // If they delete the word they are currently editing, cancel the edit
    if (editingWordKey === eng) {
        cancelEdit();
    }
    
    renderDictList();
    renderWordBank();
}

// Form Feedback Helpers
function showFormSuccess(msg) {
    const el = document.getElementById('addMsg');
    document.getElementById('addMsgText').textContent = msg;
    document.getElementById('errMsg').style.display = 'none';
    
    el.style.display = 'inline-flex';
    setTimeout(() => el.style.display = 'none', 2000);
}

function showFormError(msg) {
    const el = document.getElementById('errMsg');
    document.getElementById('errMsgText').textContent = msg;
    document.getElementById('addMsg').style.display = 'none';
    
    el.style.display = 'inline-flex';
    setTimeout(() => el.style.display = 'none', 3000);
}

function renderDictList(resetPage = false) {
    if (resetPage) currentPage = 1;
    
    const d = getDict();
    const keys = Object.keys(d).sort();
    const search = (document.getElementById('dictSearch').value || '').toLowerCase();
    const itemsPerPage = calculateItemsPerPage();
    
    const filtered = search ? keys.filter(k => 
        k.includes(search) || 
        (d[k].h || '').includes(search) || 
        (d[k].kt || '').includes(search) || 
        (d[k].k || '').includes(search)
    ) : keys;

    const el = document.getElementById('dictList');

    if (!keys.length) {
        el.innerHTML = `
            <div class="empty-msg">
                <strong>Your dictionary is empty</strong>
                Add words above — they'll be available in the Generator tab.<br>
                You can also <b>Import</b> a dictionary CSV or JSON file to get started quickly.
            </div>`;
        return;
    }
    if (!filtered.length) {
        el.innerHTML = `<div class="empty-msg">No matches for "${search}"</div>`;
        return;
    }

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedList = filtered.slice(startIdx, startIdx + itemsPerPage);

    let html = `
        <table class="dict-table">
            <thead>
                <tr>
                    <th>English</th>
                    <th>Hiragana</th>
                    <th>Katakana</th>
                    <th>Kanji</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>`;

    for (const k of paginatedList) {
        const e = d[k];
        // Highlight row if it's currently being edited
        const rowClass = (editingWordKey === k) ? 'style="background-color: var(--blue-light);"' : '';
        
        html += `
            <tr ${rowClass}>
                <td><b>${esc(k)}</b></td>
                <td class="jp">${esc(e.h || '—')}</td>
                <td class="jp">${esc(e.kt || '—')}</td>
                <td class="jp">${esc(e.k || '—')}</td>
                <td class="acts">
                    <button class="icon-btn" onclick="addToGenerator(this, '${esc(k)}')" title="Quick Add to Generator">
                        <svg class="icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                    </button>
                    <button class="icon-btn" onclick="editWord('${esc(k)}')" title="Edit">
                        <svg class="icon" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="icon-btn danger" onclick="deleteWord('${esc(k)}')" title="Delete">
                        <svg class="icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </td>
            </tr>`;
    }
    html += '</tbody></table>';

    if (totalPages > 1) {
        html += `
            <div class="pagination">
                <button class="page-btn" onclick="changePage(-1)" ${currentPage === 1 ? 'disabled' : ''}>◀ Prev</button>
                <span>Page ${currentPage} of ${totalPages}</span>
                <button class="page-btn" onclick="changePage(1)" ${currentPage === totalPages ? 'disabled' : ''}>Next ▶</button>
            </div>`;
    }

    el.innerHTML = html;
}

function changePage(delta) {
    currentPage += delta;
    renderDictList(false);
}