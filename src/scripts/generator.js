import { rollDice, rollDie, getModifier, pickRandom } from './tables/index.js';

let _tables = null;
let _config = null;

async function getTables() {
    if (!_tables) {
        const base = new URL('.', import.meta.url).href;
        const r = await fetch(`${base}../data/tables.json`);
        _tables = await r.json();
    }
    return _tables;
}

async function getConfig() {
    if (!_config) {
        const base = new URL('.', import.meta.url).href;
        const r = await fetch(`${base}../data/config.json`);
        _config = await r.json();
    }
    return _config;
}

// Tira N dadi e restituisce {totale, dadi:[...singoli]}
function rollStatFormula(formula) {
    const rolls = [];
    for (let i = 0; i < formula.dadi; i++) rolls.push(rollDie(formula.facce));
    const totale = Math.max(1, rolls.reduce((a, b) => a + b, 0) + (formula.bonus ?? 0));
    return { totale, rolls, bonus: formula.bonus ?? 0 };
}

function rollStatDefault() {
    const rolls = [rollDie(6), rollDie(6), rollDie(6)];
    const totale = rolls.reduce((a, b) => a + b, 0);
    return { totale, rolls, bonus: 0 };
}

export async function generateCharacter(sistemaId) {
    const [tables, config] = await Promise.all([getTables(), getConfig()]);
    const sistemaConfig = config.sistemi.find(s => s.id === sistemaId);
    const sistemaTables = tables[sistemaId];
    if (!sistemaConfig || !sistemaTables) throw new Error(`Sistema "${sistemaId}" non trovato`);

    // Classe
    const classiData = sistemaTables.classi;
    const classeRicca = classiData && typeof classiData[0] === 'object';
    const classe = classeRicca ? pickRandom(classiData) : pickRandom(classiData);

    // Statistiche
    const statistiche = {};
    for (const stat of sistemaConfig.statistiche) {
        const formula = classe?.statistiche_speciali?.[stat.id] ?? null;
        const result = formula ? rollStatFormula(formula) : rollStatDefault();
        statistiche[stat.id] = {
            ...stat,
            valore: result.totale,
            rolls: result.rolls,
            bonus: result.bonus,
            modificatore: getModifier(result.totale),
            label_formula: formula?.label ?? null
        };
    }

    // HP
    const hpConfig = (classeRicca && classe?.hp) ? classe.hp : sistemaConfig.hp;
    const hpRoll = rollDie(hpConfig.dado);
    const hpBonus = statistiche[hpConfig.statBonus]?.modificatore ?? 0;
    const hp = Math.max(1, hpRoll + hpBonus);

    // Crediti, Favori, Neuromanzia
    const creditiConf = classeRicca ? classe?.crediti : null;
    const favoriConf = classeRicca ? classe?.favori : null;
    const neuroConf = classeRicca ? classe?.neuromanzia : null;

    const creditiRoll = creditiConf ? rollDice(creditiConf.dadi, creditiConf.facce) * creditiConf.moltiplicatore : null;
    const favoriRoll = favoriConf ? rollDie(favoriConf.dado) : null;
    const neuroRoll = neuroConf ? rollDie(neuroConf.dado) : null;

    const personaggio = {
        sistema: sistemaConfig.nome,
        sistemaId,
        banner: sistemaConfig.banner,
        statistiche,
        hp, hpRoll, hpBonus,
        crediti: creditiRoll,
        favori: favoriRoll,
        neuromanzia: neuroRoll,
        classe: classeRicca ? classe : null,
        classeStringa: classeRicca ? null : classe
    };

    // Vast Grimm: narrativa + equipaggiamento
    if (sistemaId === 'vast-grimm') {
        personaggio.callsign = pickRandom(sistemaTables.nomi_callsign);

        const c1 = pickRandom(sistemaTables.conseguenze);
        const c2 = pickRandom(sistemaTables.conseguenze.filter(c => c !== c1));
        personaggio.narrativa = {
            conseguenza1: pickRandom(sistemaTables.conseguenze),
            conseguenza2: pickRandom(sistemaTables.conseguenze),
            tratto_fisico: pickRandom(sistemaTables.tratti_fisici),
            tratto_carattere: pickRandom(sistemaTables.tratti_personalita)
        };

        // Tabelle classe
        if (classe?.tabelle_classe) {
            personaggio.tabelle_classe_risultati = classe.tabelle_classe.map(tab => ({
                titolo: tab.titolo,
                risultato: pickRandom(tab.voci)
            }));
        }

        // Equipaggiamento
        const override = classe?.equipaggiamento_override;
        const gear = [];
        const tributiPersonaggio = [];

        // Helper: risolve un tributo dal testo dell'item
        function risolviTributo(item) {
            const lower = item.toLowerCase();
            if (lower.includes('tributo hackerato')) {
                const t = pickRandom(sistemaTables.tributi_hackerati);
                if (t) tributiPersonaggio.push({ ...t, categoria: 'hackerato' });
                return null; // non aggiungere la stringa all'equipaggiamento
            }
            if (lower.includes('tributo criptato')) {
                const t = pickRandom(sistemaTables.tributi_criptati);
                if (t) tributiPersonaggio.push({ ...t, categoria: 'criptato' });
                return null;
            }
            return item;
        }

        // Tabella 1 — contenitore (d6), sempre
        gear.push(pickRandom(sistemaTables.equipaggiamento_t1));

        // Armi
        if (override?.armi_fissi) {
            gear.push(...override.armi_fissi);
        } else if (override?.armi_dado !== null) {
            const dadoArmi = override?.armi_dado ?? sistemaTables.armi.length;
            const idxArma = rollDie(dadoArmi) - 1;
            if (sistemaTables.armi[idxArma]) gear.push(sistemaTables.armi[idxArma]);
        }

        // Armature
        if (override?.armatura_dado !== null) {
            const dadoArmatura = override?.armatura_dado ?? sistemaTables.armature.length;
            const idxArmatura = rollDie(dadoArmatura) - 1;
            if (sistemaTables.armature[idxArmatura]) gear.push(sistemaTables.armature[idxArmatura]);
        }

        // Tabella 2 (d12)
        if (!override?.salta_t2) {
            const item = pickRandom(sistemaTables.equipaggiamento_t2);
            const risolto = risolviTributo(item);
            if (risolto) gear.push(risolto);
        }

        // Tabella 3 (d12)
        if (!override?.salta_t3) {
            const item = pickRandom(sistemaTables.equipaggiamento_t3);
            const risolto = risolviTributo(item);
            if (risolto) gear.push(risolto);
        }

        // Tributi da override classe
        if (override?.tributi?.length) {
            for (const spec of override.tributi) {
                const lista = spec.tipo === 'hackerato'
                    ? sistemaTables.tributi_hackerati
                    : spec.tipo === 'criptato'
                        ? sistemaTables.tributi_criptati
                        : [...sistemaTables.tributi_criptati, ...sistemaTables.tributi_hackerati];
                for (let i = 0; i < (spec.count ?? 1); i++) {
                    const t = pickRandom(lista);
                    if (t) tributiPersonaggio.push({ ...t, categoria: spec.tipo === 'casuale' ? 'casuale' : spec.tipo });
                }
            }
        }

        if (override?.extra?.length) {
            for (const extraItem of override.extra) {
                // Risolvi "Nx Würm casuali criogenizzati" o "1x Würm casuale criogenizzato"
                const matchWurm = extraItem.match(/^(\d+)x\s+Würm\s+casual[ei]\s+criogenizzat[oi]$/i);
                if (matchWurm && sistemaTables.wurm?.length) {
                    const count = parseInt(matchWurm[1], 10);
                    const wurmDisponibili = [...sistemaTables.wurm];
                    for (let i = 0; i < count; i++) {
                        if (wurmDisponibili.length === 0) break;
                        const idx = Math.floor(Math.random() * wurmDisponibili.length);
                        const w = wurmDisponibili.splice(idx, 1)[0]; // senza ripetizioni
                        gear.push(`${w.nome} (${w.tipo}) — criogenizzato`);
                    }
                } else {
                    gear.push(extraItem);
                }
            }
        }
        personaggio.equipaggiamento = gear;
        personaggio.tributi = tributiPersonaggio;
        personaggio.tributi_regola = sistemaTables.tributi_regola;

        // ── CREAZIONI GIORNALIERE (es. Chimico Ingegnere) ──
        if (classe.creazioni) {
            const cr = classe.creazioni;
            const disponibili = [...cr.voci];
            const selezionate = [];
            for (let i = 0; i < cr.count_giornaliero; i++) {
                if (disponibili.length === 0) break;
                const idx = Math.floor(Math.random() * disponibili.length);
                selezionate.push(disponibili.splice(idx, 1)[0]);
            }
            const dosi = rollDie(cr.dosi_dado);
            personaggio.creazioni = {
                tutte: cr.voci,
                oggi: selezionate,
                dosi,
                dosi_dado: cr.dosi_dado
            };
        } else {
            personaggio.creazioni = null;
        }

    }

    return personaggio;
}