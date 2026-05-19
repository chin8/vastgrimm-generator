export function rollDie(sides) { return Math.floor(Math.random() * sides) + 1; }
export function rollDice(count, sides) {
    let t = 0; for (let i = 0; i < count; i++) t += rollDie(sides); return t;
}
export function roll3d6() { return rollDice(3, 6); }
export function getModifier(v) {
    if (v <= 4)  return -3; if (v <= 6)  return -2; if (v <= 8)  return -1;
    if (v <= 12) return  0; if (v <= 14) return  1; if (v <= 16) return  2;
    return 3;
}
export function formatModifier(mod) { return mod >= 0 ? `+${mod}` : `${mod}`; }
export function pickRandom(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
}