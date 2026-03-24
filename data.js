const DICT_KEY = 'jp_mydict';
const OVER_KEY = 'jp_overrides';

// Core Data Functions
function getDict() { 
    try { return JSON.parse(localStorage.getItem(DICT_KEY) || '{}'); } 
    catch { return {}; } 
}

function saveDict(d) { 
    localStorage.setItem(DICT_KEY, JSON.stringify(d)); 
    refreshDictCount(); 
}

function refreshDictCount() { 
    const countEl = document.getElementById('dictCount');
    if (countEl) countEl.textContent = Object.keys(getDict()).length; 
}

function getOverrides() { 
    try { return JSON.parse(localStorage.getItem(OVER_KEY) || '{}'); } 
    catch { return {}; } 
}

function saveOverride(w, c) { 
    const o = getOverrides(); 
    o[w] = c; 
    localStorage.setItem(OVER_KEY, JSON.stringify(o)); 
}

function clearOverrides() { 
    if (confirm('Clear all box count fixes?')) { 
        localStorage.removeItem(OVER_KEY); 
        alert('Cleared.'); 
    } 
}

// Utility Function used by multiple tabs
function esc(s) { 
    const d = document.createElement('div'); 
    d.textContent = s; 
    return d.innerHTML; 
}

// Import & Export
// Export, Import, Template Functions
function exportDict() {
    const d = getDict();
    if (!Object.keys(d).length) { 
        alert('Dictionary is empty.'); 
        return; 
    }
    const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = 'my_japanese_dict.json'; 
    
    // Append, click, and remove to ensure cross-browser compatibility
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Free up browser memory
    URL.revokeObjectURL(url);
}

function downloadTemplate() {
    const csvContent = "English,Hiragana,Katakana,Kanji\ncat,ねこ,ネコ,猫\nwatch (noun),とけい,トケイ,時計\nteacher,せんせい / きょうし,センセイ / キョウシ,先生 / 教師\n";
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = 'dictionary_template.csv'; 
    
    // Append, click, and remove to ensure cross-browser compatibility
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Free up browser memory
    URL.revokeObjectURL(url);
}

function downloadTemplate() {
    const csvContent = "English,Hiragana,Katakana,Kanji\ncat,ねこ,ネコ,猫\nwatch (noun),とけい,トケイ,時計\nteacher,せんせい / きょうし,センセイ / キョウシ,先生 / 教師\n";
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(blob); 
    a.download = 'dictionary_template.csv'; 
    a.click();
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const isCSV = file.name.toLowerCase().endsWith('.csv');

    file.text().then(text => {
        const current = getDict();
        let added = 0;
        
        if (isCSV) {
            const lines = text.split(/\r?\n/);
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const parts = line.split(',');
                const eng = (parts[0] || '').trim().toLowerCase();
                const hira = (parts[1] || '').trim();
                const kata = (parts[2] || '').trim();
                const kanji = (parts[3] || '').trim();
                
                if (eng && (hira || kata || kanji)) {
                    if (!current[eng]) added++;
                    current[eng] = { h: hira, kt: kata, k: kanji };
                }
            }
        } else {
            try {
                const imported = JSON.parse(text);
                for (const [k, v] of Object.entries(imported)) {
                    if (typeof v === 'object' && (v.h || v.kt || v.k)) {
                        if (!current[k]) added++;
                        current[k] = v;
                    }
                }
            } catch (err) { 
                alert('Invalid JSON file.'); 
                return; 
            }
        }
        saveDict(current);
        renderDictList(true); 
        renderWordBank();
        alert(`Successfully imported!\n${added} new words added or updated.\nTotal dictionary size: ${Object.keys(current).length} words.`);
    }).catch(() => alert('Could not read that file.'));
    
    e.target.value = ''; 
}

function clearDict() {
    const n = Object.keys(getDict()).length;
    if (!n) { 
        alert('Already empty.'); 
        return; 
    }
    if (confirm(`Delete all ${n} words?`)) { 
        localStorage.removeItem(DICT_KEY); 
        refreshDictCount(); 
        renderDictList(); 
        renderWordBank();
    }
}