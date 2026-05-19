export function renderConfigPanel(sistemi, onSelect) {
   const panel = document.createElement('div');
   panel.className = 'config-panel';

   panel.innerHTML = `
       <h2>Scegli il Sistema di Gioco</h2>
       <div class="sistema-grid">
           ${sistemi.map(s => `
               <div class="sistema-card" data-id="${s.id}">
                   <h3>${s.nome}</h3>
                   <p>${s.descrizione}</p>
               </div>
           `).join('')}
       </div>
   `;

   panel.querySelectorAll('.sistema-card').forEach(card => {
       card.addEventListener('click', () => {
           panel.querySelectorAll('.sistema-card').forEach(c => c.classList.remove('selected'));
           card.classList.add('selected');
           onSelect(card.dataset.id);
       });
   });

   return panel;
}