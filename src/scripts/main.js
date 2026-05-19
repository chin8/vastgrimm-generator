import { generateCharacter } from './generator.js';
import { displayCharacter, showError } from './renderer.js';

// ── TEMA ──
function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    const btn = document.getElementById('btn-theme');
    if (btn) btn.textContent = (saved === 'light') ? '🌑 Dark' : '☀️ Light';
}
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') ?? 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    document.getElementById('btn-theme').textContent = next === 'light' ? '🌑 Dark' : '☀️ Light';
}

// ── FONT SIZE ──
const FONT_SIZES = [0.7, 0.8, 0.9, 1.0, 1.1, 1.25, 1.4];
const FONT_DEFAULT = 3; // indice di 1.0

function initFontSize() {
    const saved = parseInt(localStorage.getItem('fontIdx') ?? FONT_DEFAULT);
    applyFontSize(saved);
}
function applyFontSize(idx) {
    idx = Math.max(0, Math.min(FONT_SIZES.length - 1, idx));
    document.documentElement.style.fontSize = FONT_SIZES[idx] + 'rem';
    localStorage.setItem('fontIdx', idx);
    document.getElementById('btn-font-down').disabled = idx === 0;
    document.getElementById('btn-font-up').disabled   = idx === FONT_SIZES.length - 1;
}
function changeFontSize(delta) {
    const current = parseInt(localStorage.getItem('fontIdx') ?? FONT_DEFAULT);
    applyFontSize(current + delta);
}

// ── MODAL ──
function showModal(onConfirm) {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('hidden');
    const btnConfirm = document.getElementById('modal-confirm');
    const btnCancel  = document.getElementById('modal-cancel');
    function close() {
        overlay.classList.add('hidden');
        btnConfirm.removeEventListener('click', handleConfirm);
        btnCancel.removeEventListener('click', close);
        overlay.removeEventListener('click', handleOverlay);
    }
    function handleConfirm() { close(); onConfirm(); }
    function handleOverlay(e) { if (e.target === overlay) close(); }
    btnConfirm.addEventListener('click', handleConfirm);
    btnCancel.addEventListener('click', close);
    overlay.addEventListener('click', handleOverlay);
}

initTheme();
initFontSize();

async function init() {
    document.getElementById('action-bar').classList.remove('hidden');
    document.getElementById('btn-theme')    ?.addEventListener('click', toggleTheme);
    document.getElementById('btn-font-up')  ?.addEventListener('click', () => changeFontSize(+1));
    document.getElementById('btn-font-down')?.addEventListener('click', () => changeFontSize(-1));
    document.getElementById('btn-stampa')   ?.addEventListener('click', () => window.print());
    document.getElementById('btn-rigenera') ?.addEventListener('click', () => {
        // Prima generazione: nessun modal
        if (!document.getElementById('sheet-container').hasChildNodes()) {
            genera();
        } else {
            showModal(genera);
        }
    });

    genera();

    async function genera() {
        try {
            const personaggio = await generateCharacter('vast-grimm');
            displayCharacter(personaggio);
        } catch (err) {
            showError(err.message);
            console.error(err);
        }
    }
}

init().catch(console.error);