import { renderCharacterSheet } from '../components/CharacterSheet.js';

export function displayCharacter(personaggio) {
    const container = document.getElementById('sheet-container');
    container.innerHTML = '';
    container.appendChild(renderCharacterSheet(personaggio));
}

export function showError(message) {
    const container = document.getElementById('sheet-container');
    container.innerHTML = `<div class="error-message">⚠️ ${message}</div>`;
}