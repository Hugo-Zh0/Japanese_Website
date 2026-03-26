// Global App Logic and Initialization

function switchTab(id) {
    document.querySelectorAll('.tab').forEach((t, i) => {
        t.classList.toggle('active', (id === 'dict' && i === 0) || (id === 'gen' && i === 1));
    });
    
    document.getElementById('panelDict').classList.toggle('active', id === 'dict');
    document.getElementById('panelGen').classList.toggle('active', id === 'gen');
    
    // Control A4 Worksheet visibility based on the active tab
    const wrap = document.getElementById('pageWrap');
    if (id === 'dict') {
        wrap.style.display = 'none';
        renderDictList();
    } else if (id === 'gen') {
        if (hasGenerated) wrap.style.display = 'flex';
        renderWordBank();
    }
}

// Print fix: force the worksheet visible before printing, restore after
window.addEventListener('beforeprint', () => {
    const pw = document.getElementById('pageWrap');
    if (hasGenerated && pw) {
        pw.dataset.preprint = pw.style.display; // save current state
        pw.style.display = 'flex';
    }
});

window.addEventListener('afterprint', () => {
    const pw = document.getElementById('pageWrap');
    if (pw && pw.dataset.preprint !== undefined) {
        pw.style.display = pw.dataset.preprint;
        delete pw.dataset.preprint;
    }
});

// Re-render dictionary list if the window is resized to keep pagination clean
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (document.getElementById('panelDict').classList.contains('active')) {
            renderDictList(); 
        }
    }, 150);
});

// Run this once the HTML has finished loading
document.addEventListener('DOMContentLoaded', () => {
    refreshDictCount();
    renderDictList();
});
