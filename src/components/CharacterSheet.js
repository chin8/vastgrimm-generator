import { formatModifier } from '../scripts/tables/index.js';

export function renderCharacterSheet(personaggio) {
    if (personaggio.sistemaId === 'vast-grimm') return renderVastGrimm(personaggio);
    return renderGenerico(personaggio);
}

// ─── VAST GRIMM ──────────────────────────────────────────────────────────────

function renderVastGrimm(p) {
    const sheet = document.createElement('div');
    sheet.className = 'character-sheet vg-sheet';

    sheet.innerHTML = `
        ${p.banner ? `<div class="vg-banner"><img src="${p.banner}" alt="banner"></div>` : ''}

        <div class="vg-stats-row">
            ${Object.values(p.statistiche).map(s => renderVgStat(s)).join('')}
        </div>

        <div class="vg-meta-row">
            ${renderVgMeta('PF', p.hp, `d${10} + ${p.hpBonus >= 0 ? '+' : ''}${p.hpBonus}`)}
            ${p.crediti    !== null ? renderVgMeta('CREDITI',     p.crediti,     '') : ''}
            ${p.favori     !== null ? renderVgMeta('FAVORI',      p.favori,      'd4') : ''}
            ${p.neuromanzia !== null ? renderVgMeta('NEUROMANZIA', p.neuromanzia, 'Presenza + dado') : ''}
        </div>

        <div class="vg-body">
            <div class="vg-col-left">
                ${renderVgNarrativa(p)}
            </div>
            <div class="vg-col-right">
                ${renderVgClasse(p)}
            </div>
        </div>

        <div class="vg-footer">
            ${renderVgEquipaggiamento(p)}
        </div>
    `;

    return sheet;
}

function renderVgStat(stat) {
    const mod = formatModifier(stat.modificatore);
    const diceStr = `[${stat.rolls.join(',')}${stat.bonus !== 0 ? (stat.bonus > 0 ? `+${stat.bonus}` : stat.bonus) : ''}]`;
    const modClass = stat.modificatore > 0 ? 'pos' : stat.modificatore < 0 ? 'neg' : '';
    return `
        <div class="vg-stat">
            <div class="vg-stat-desc">${stat.descrizione}</div>
            <div class="vg-stat-mod ${modClass}">${mod}</div>
                        <div class="vg-stat-dice">${diceStr}</div>
            <div class="vg-stat-name">${stat.abbr}</div>
            <div class="vg-stat-label">${stat.label_formula?stat.label_formula:''}</div>
        </div>
    `;
}

function renderVgMeta(label, valore, formula) {
    return `
        <div class="vg-meta-block">
            <div class="vg-meta-label">${label}</div>
            <div class="vg-meta-value">${valore}</div>
            
            ${formula ? `<div class="vg-meta-formula">${formula}</div>` : ''}
        </div>
    `;
}

function renderVgNarrativa(p) {
    const n = p.narrativa;
    if (!n) return '';
    return `
        <div class="vg-section">
            <div class="vg-section-title">BACKGROUND</div>
            <div class="vg-narrative">            
                <p>Il tuo nome è andato perduto nel vuoto gelido dello spazio, tutto ciò che chiunque ricorda è il tuo nome di battaglia:
                <span class="vg-highlight">"${p.callsign}"</span>.</p>
 <p>Dove sei stato/a e cosa hai fatto è solo una piccola goccia nel cesso della tua vita.
                Le atrocità che hai visto, tuttavia, ti hanno reso
                <span class="vg-highlight">${n.conseguenza1}</span>
                e <span class="vg-highlight">${n.conseguenza2}</span>.</p>
                <p>Chiunque ti guardi nota subito: <span class="vg-highlight">${n.tratto_fisico}</span></p>
                <p>Lo stress di essere sopravvissuto/a a malapena nel Vasto ti ha instillato
                <span class="vg-highlight">${n.tratto_carattere}</span>.</p>
            </div>
        </div>
    `;
}

function renderVgClasse(p) {
    if (!p.classe) {
        return `<div class="vg-section"><div class="vg-section-title">CLASSE</div><p>${p.classeStringa ?? '—'}</p></div>`;
    }
    const c = p.classe;
    const noteHtml = c.note_speciali?.map(n => `<li>${n}</li>`).join('') ?? '';
    const tabelleHtml = p.tabelle_classe_risultati?.map(t => `
        <div class="vg-classe-table">
            <div class="vg-classe-table-title">${t.titolo}</div>
            <div class="vg-classe-table-result">${t.risultato}</div>
        </div>
    `).join('') ?? '';

    const creazioniHtml = p.creazioni ? `
        <div class="vg-creazioni">
            <div class="vg-classe-table-title">CREAZIONI (d${p.creazioni.tutte.length})</div>
            <div class="vg-creazioni-regola">
                Ogni giorno ricevi <strong>${p.creazioni.oggi.length} creazioni casuali</strong> 
                con un totale di <strong>d${p.creazioni.dosi_dado} dosi</strong>. 
                Al termine della giornata il database si cancella.
            </div>
            <ol class="vg-creazioni-lista">
                ${p.creazioni.tutte.map((v, i) => {
                    const isOggi = p.creazioni.oggi.includes(v);
                    return `<li class="${isOggi ? 'creazione-attiva' : 'creazione-inattiva'}">${v}</li>`;
                }).join('')}
            </ol>
        </div>
    ` : '';

    return `
        <div class="vg-section">
            <div class="vg-section-title">CLASSE</div>
            <div class="vg-classe-nome">${c.nome}</div>
            <div class="vg-classe-desc">${c.descrizione}</div>
            ${noteHtml ? `<ul class="vg-classe-note">${noteHtml}</ul>` : ''}
            ${c.attacco_classe ? `<div class="vg-classe-attacco"><strong>Attacco:</strong> ${c.attacco_classe}</div>` : ''}
            ${tabelleHtml}
            ${creazioniHtml}
        </div>
    `;
}

function renderVgEquipaggiamento(p) {
    if (!p.equipaggiamento?.length && !p.creazioni) return '';

    const items = p.equipaggiamento?.map(e => `<div class="vg-gear-item">${e}</div>`).join('') ?? '';

    const creazioniGearHtml = p.creazioni ? `
        <div class="vg-gear-item vg-gear-creazioni">
            <strong>CREAZIONI DI OGGI</strong> — ${p.creazioni.dosi} dosi totali (d${p.creazioni.dosi_dado}):
            <ul>
                ${p.creazioni.oggi.map(cr => `<li>${cr}</li>`).join('')}
            </ul>
        </div>
    ` : '';

    return `
        <div class="vg-section-title">EQUIPAGGIAMENTO</div>
        <div class="vg-gear-grid">
            ${items}
            ${creazioniGearHtml}
        </div>
    `;
}

// ─── GENERICO ────────────────────────────────────────────────────────────────

function renderGenerico(p) {
    const sheet = document.createElement('div');
    sheet.className = 'character-sheet';
    sheet.innerHTML = `
        <div class="sheet-header">
            <div>
                <div class="sheet-title">${p.callsign ?? p.nome ?? '—'}</div>
                <div class="sheet-system">${p.sistema}</div>
            </div>
            <div class="hp-block">
                <div class="hp-label">PF</div>
                <div class="hp-value">${p.hp}</div>
            </div>
        </div>
        <div class="sheet-body">
            ${renderGenStats(p.statistiche)}
        </div>
    `;
    return sheet;
}

function renderGenStats(statistiche) {
    const items = Object.values(statistiche).map(s => `
        <div class="stat-block">
            <div class="stat-name">${s.abbr}</div>
            <div class="stat-modifier">${formatModifier(s.modificatore)}</div>
            <div class="stat-value">${s.valore}</div>
        </div>
    `).join('');
    return `<div class="sheet-section"><div class="section-title">Statistiche</div><div class="stats-grid">${items}</div></div>`;
}