let wState = {};
let hasGenerated = false;

// Word Bank Logic
function renderWordBank() {
    const d = getDict();
    const keys = Object.keys(d).sort();
    const search = (document.getElementById('bankSearch').value || '').toLowerCase();
    
    const currentWords = document.getElementById('words').value.split('\n').map(w => w.trim().toLowerCase());
    
    const filtered = search ? keys.filter(k => 
        k.includes(search) || 
        (d[k].h || '').includes(search) || 
        (d[k].kt || '').includes(search) || 
        (d[k].k || '').includes(search)
    ) : keys;
    
    const el = document.getElementById('bankList');
    
    if (!filtered.length) {
        el.innerHTML = `<div style="padding:10px;text-align:center;color:var(--ink3);font-size:12px">No words found.</div>`;
        return;
    }

    // Count how many of the filtered words are already added
    const addedCount = filtered.filter(k => currentWords.includes(k.toLowerCase())).length;
    const allAdded = addedCount === filtered.length;
    const noneAdded = addedCount === 0;

    let html = `<div class="bank-bulk-actions">
        <button class="btn-xs bank-bulk-btn" onclick="bankAddAll()" ${allAdded ? 'disabled' : ''}>
            <svg class="icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg> Add All${search ? ' Filtered' : ''}
        </button>
        <button class="btn-xs bank-bulk-btn" onclick="bankRemoveAll()" style="color:var(--red)" ${noneAdded ? 'disabled' : ''}>
            <svg class="icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Remove All${search ? ' Filtered' : ''}
        </button>
    </div>`;
    
    for (const k of filtered) {
        const isInList = currentWords.includes(k.toLowerCase());
        
        if (isInList) {
            html += `
                <div class="bank-item added" onclick="bankRemoveWord('${esc(k)}')">
                    <span>${esc(k)}</span>
                    <svg class="icon tick-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <svg class="icon remove-icon" viewBox="0 0 24 24" style="display:none;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </div>
            `;
        } else {
            html += `
                <div class="bank-item" onclick="bankAddWord('${esc(k)}')">
                    <span>${esc(k)}</span>
                    <svg class="icon" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </div>
            `;
        }
    }
    el.innerHTML = html;
}

function bankAddAll() {
    const d = getDict();
    const keys = Object.keys(d).sort();
    const search = (document.getElementById('bankSearch').value || '').toLowerCase();
    
    const filtered = search ? keys.filter(k => 
        k.includes(search) || 
        (d[k].h || '').includes(search) || 
        (d[k].kt || '').includes(search) || 
        (d[k].k || '').includes(search)
    ) : keys;
    
    const ta = document.getElementById('words');
    const currentWords = ta.value.split('\n').map(w => w.trim().toLowerCase()).filter(w => w);
    
    // Add only words not already in the list
    const toAdd = filtered.filter(k => !currentWords.includes(k.toLowerCase()));
    
    if (toAdd.length) {
        let val = ta.value.trimEnd();
        if (val && !val.endsWith('\n')) val += '\n';
        val += toAdd.join('\n') + '\n';
        ta.value = val;
    }
    
    renderWordBank();
}

function bankRemoveAll() {
    const d = getDict();
    const keys = Object.keys(d).sort();
    const search = (document.getElementById('bankSearch').value || '').toLowerCase();
    
    const filtered = search ? keys.filter(k => 
        k.includes(search) || 
        (d[k].h || '').includes(search) || 
        (d[k].kt || '').includes(search) || 
        (d[k].k || '').includes(search)
    ) : keys;
    
    const filteredSet = new Set(filtered.map(k => k.toLowerCase()));
    
    const ta = document.getElementById('words');
    let lines = ta.value.split('\n');
    lines = lines.filter(l => !filteredSet.has(l.trim().toLowerCase()));
    ta.value = lines.join('\n').replace(/\n{2,}/g, '\n').trim();
    if (ta.value) ta.value += '\n';
    
    renderWordBank();
}

function bankAddWord(word) {
    const ta = document.getElementById('words');
    let val = ta.value;
    
    if (val && !val.endsWith('\n')) {
        ta.value += '\n' + word + '\n';
    } else {
        ta.value += word + '\n';
    }
    renderWordBank();
}

function bankRemoveWord(word) {
    const ta = document.getElementById('words');
    let lines = ta.value.split('\n');
    
    lines = lines.filter(l => l.trim().toLowerCase() !== word.toLowerCase());
    ta.value = lines.join('\n').replace(/\n{2,}/g, '\n'); 
    
    renderWordBank();
}

function addToGenerator(btn, word) {
    const ta = document.getElementById('words');
    let val = ta.value;
    
    if (val && !val.endsWith('\n')) {
        ta.value += '\n' + word + '\n';
    } else {
        ta.value += word + '\n';
    }
    
    const originalIcon = btn.innerHTML;
    btn.classList.add('success');
    btn.innerHTML = '<svg class="icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    setTimeout(() => {
        btn.classList.remove('success');
        btn.innerHTML = originalIcon;
    }, 1000);
}

// Worksheet Generation Logic
function getPrimary(str) { 
    return str ? str.split('/')[0].trim() : ''; 
}

function getTarget(entry, mode) {
    if (mode === 'hiragana') return getPrimary(entry.h || entry.kt || entry.k);
    if (mode === 'katakana') return getPrimary(entry.kt || entry.h || entry.k);
    if (mode === 'kanji' || mode === 'both') return getPrimary(entry.k || entry.h || entry.kt);
    return '';
}

function getJpLabel(entry, mode) {
    const target = getTarget(entry, mode);
    if (mode === 'both') {
        const reading = getPrimary(entry.h || entry.kt);
        return reading && reading !== target ? `${target}` : target;
    }
    return target;
}

function getHint(entry, mode) { 
    return mode === 'both' ? `(${getPrimary(entry.h || entry.kt)})` : ''; 
}

function renderBoxes(container, key) {
    const st = wState[key];
    container.innerHTML = '';
    
    for (let i = 0; i < st.count; i++) {
        const bx = document.createElement('div');
        bx.className = 'bx';
        
        if (st.layout && st.layout[i]) {
            bx.classList.add('gap-left');
            if (container.lastChild) {
                container.lastChild.classList.add('gap-right');
            }
        }
        
        const rm = document.createElement('div');
        rm.className = 'rm';
        rm.innerHTML = '<svg class="icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        rm.onclick = () => changeBoxes(key, -1);
        bx.appendChild(rm);
        container.appendChild(bx);
    }
}

function changeBoxes(key, delta) {
    const st = wState[key];
    if (!st) return;
    st.count = Math.max(1, st.count + delta);
    saveOverride(key, st.count);
    st.layout = Array(st.count).fill(false); 
    document.querySelectorAll(`[data-key="${CSS.escape(key)}"] .bx-row`).forEach(r => renderBoxes(r, key));
}

function createWordEl(line) {
    const key = line.toLowerCase().trim();
    const st = wState[key];
    if (!st) return null;

    const wi = document.createElement('div');
    wi.className = 'wi';
    wi.setAttribute('data-key', key);

    const top = document.createElement('div');
    top.className = 'wi-top';
    const engFormatted = line.charAt(0).toUpperCase() + line.slice(1);
    top.innerHTML = `<span class="wi-eng">${engFormatted}</span><span class="wi-jp">${st.jpLabel || ''}</span>`;
    wi.appendChild(top);

    const wrap = document.createElement('div');
    wrap.className = 'bx-wrap';
    const row = document.createElement('div');
    row.className = 'bx-row';
    renderBoxes(row, key);
    
    const add = document.createElement('div');
    add.className = 'add-bx';
    add.innerHTML = '<svg class="icon" viewBox="0 0 24 24" style="width:12px;height:12px"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
    add.onclick = () => changeBoxes(key, 1);
    wrap.appendChild(row);
    wrap.appendChild(add);
    wi.appendChild(wrap);

    if (st.hint) {
        const h = document.createElement('div');
        h.className = 'wi-hint';
        h.textContent = st.hint;
        wi.appendChild(h);
    }

    return wi;
}

function generate() {
    const mode = document.getElementById('mode').value;
    const repeat = Math.max(1, +document.getElementById('repeat').value || 1);
    const doShuffle = document.getElementById('shuffle').checked;
    const doFill = document.getElementById('autofill').checked;
    const pageWrap = document.getElementById('pageWrap');

    const lines = document.getElementById('words').value.split('\n').map(l => l.trim()).filter(l => l);
    if (!lines.length) {
        pageWrap.style.display = 'none'; 
        hasGenerated = false;
        return;
    }

    const dict = getDict();
    const overrides = getOverrides();
    wState = {};
    const missing = [];
    const unique = [...new Set(lines.map(l => l.toLowerCase().trim()))];
    
    for (const word of unique) {
        const entry = dict[word];
        if (!entry) {
            missing.push(word);
            wState[word] = { count: 3, jpLabel: '(?)', hint: '', layout: [false, false, false] };
            continue;
        }
        
        const target = getTarget(entry, mode);
        let layout = [];
        let pendingGap = false;
        
        for (let i = 0; i < target.length; i++) {
            if (/[、，\s　]/.test(target[i])) { 
                pendingGap = true; 
            } else { 
                layout.push(pendingGap); 
                pendingGap = false; 
            }
        }
        if (layout.length === 0) layout = [false, false, false];

        let count = layout.length;
        if (overrides[word] !== undefined) {
            count = overrides[word];
            layout = Array(count).fill(false);
        }
        
        wState[word] = { count, jpLabel: getJpLabel(entry, mode), hint: getHint(entry, mode), layout };
    }

    const alertEl = document.getElementById('missingAlert');
    if (missing.length) {
        alertEl.innerHTML = `
            <div class="missing-alert">
                <strong><svg class="icon" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> ${missing.length} word${missing.length > 1 ? 's' : ''} not in your dictionary:</strong>
                ${missing.map(w => `<code>${esc(w)}</code>`).join(', ')}
                <br>
                <button onclick='addMissing(${JSON.stringify(missing).replace(/'/g, "&#39;")})'>
                    <svg class="icon" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Add them now
                </button>
            </div>`;
    } else { 
        alertEl.innerHTML = ''; 
    }

    let list = [];
    for (let i = 0; i < repeat; i++) {
        list = list.concat(lines);
    }
    
    if (doShuffle) {
        list = shuffleArr(list);
    }

    const ws = document.getElementById('ws');
    ws.innerHTML = '';
    
    for (const line of list) {
        const el = createWordEl(line);
        if (el) {
            ws.appendChild(el);
        }
    }

    if (doFill && lines.length) {
            pageWrap.style.display = 'flex'; 
            const ruler = document.createElement('div');
            ruler.style.cssText = 'height:21cm;position:absolute;visibility:hidden';
            document.body.appendChild(ruler);
            const a4h = ruler.offsetHeight;
            document.body.removeChild(ruler);

            const page = document.getElementById('page');
            const threshold = Math.ceil(page.scrollHeight / a4h) * a4h + 5;
            const fill = doShuffle ? shuffleArr([...lines]) : [...lines];
            
            let idx = 0;
            let failedAttempts = 0;
            
            while (idx < 500 && failedAttempts < fill.length) {
                const el = createWordEl(fill[idx % fill.length]);
                if (!el) { 
                    idx++; 
                    continue; 
                }
                
                ws.appendChild(el);
                
                if (page.scrollHeight > threshold) { 
                    el.remove(); 
                    failedAttempts++; 
                } else {
                    failedAttempts = 0; 
                }
                idx++;
            }
        }
    
    pageWrap.style.display = 'flex';
    hasGenerated = true;
}

function addMissing(words) {
    switchTab('dict');
    if (words.length) {
        document.getElementById('addEng').value = words[0];
        document.getElementById('addHira').focus();
    }
}

function shuffleArr(a) {
    const b = [...a];
    for (let i = b.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
}

function adj(d) {
    const el = document.getElementById('repeat');
    el.value = Math.max(1, (+el.value || 1) + d);
}
