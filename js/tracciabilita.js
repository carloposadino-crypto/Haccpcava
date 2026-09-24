import { leggiTutti, orderBy } from './store.js';

function esc(v) {
  return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
function dataBreve(v) {
  if (!v) return '—';
  const p = String(v).split('-');
  return p.length === 3 ? p.reverse().join('/') : String(v);
}

export async function renderTracciabilitaPage(container) {
  container.innerHTML = '<div class="empty-state">Caricamento tracciabilità…</div>';
  const [ricevimenti, processi, conservazioni, servizi] = await Promise.all([
    leggiTutti('ricevimenti',[orderBy('registrato_il','desc')]).catch(()=>[]),
    leggiTutti('registrazioni_processo',[orderBy('registrato_il','desc')]).catch(()=>[]),
    leggiTutti('conservazioni',[orderBy('registrato_il','desc')]).catch(()=>[]),
    leggiTutti('servizi',[orderBy('registrato_il','desc')]).catch(()=>[])
  ]);

  const lotti = new Set();
  ricevimenti.forEach(r => (r.voci||[]).forEach(v => { if(v.lotto) lotti.add(String(v.lotto).trim()); }));
  processi.forEach(p => { if(p.valori?.lotto_materia_prima) lotti.add(String(p.valori.lotto_materia_prima).trim()); });
  conservazioni.forEach(c => { if(c.lotto) lotti.add(String(c.lotto).trim()); });
  servizi.forEach(s => { if(s.lotto) lotti.add(String(s.lotto).trim()); });
  const elenco = [...lotti].filter(Boolean).sort();

  container.innerHTML = `
    <div class="top-bar"><h2>Tracciabilità lotti</h2></div>
    <div class="list-card">
      <label class="field-label">Cerca lotto</label>
      <input type="search" id="tr-cerca" placeholder="Es. LOTTO123">
      <div style="font-size:12px;color:#64748b;margin-top:6px;">Mostra il percorso del lotto: ricevimento → processo → conservazione → servizio.</div>
    </div>
    <div id="tr-risultati"></div>`;

  function render() {
    const q = container.querySelector('#tr-cerca').value.trim().toLowerCase();
    const trovati = elenco.filter(l => !q || l.toLowerCase().includes(q));
    const out = container.querySelector('#tr-risultati');
    if (!q) { out.innerHTML='<div class="empty-state">Inserisci un lotto per iniziare la ricerca.</div>'; return; }
    if (!trovati.length) { out.innerHTML='<div class="empty-state">Nessun lotto trovato.</div>'; return; }

    out.innerHTML = trovati.map(lotto => {
      const rice = [];
      ricevimenti.forEach(r => (r.voci||[]).forEach(v => {
        if(String(v.lotto||'').trim().toLowerCase() === lotto.toLowerCase()) rice.push({r,v});
      }));
      const proc = processi.filter(p => String(p.valori?.lotto_materia_prima||'').trim().toLowerCase() === lotto.toLowerCase());
      const cons = conservazioni.filter(c => String(c.lotto||'').trim().toLowerCase() === lotto.toLowerCase());
      const serv = servizi.filter(s => String(s.lotto||'').trim().toLowerCase() === lotto.toLowerCase());

      const blocco = (titolo, html, vuoto) => `
        <div style="font-size:13px;font-weight:bold;color:#475569;margin:12px 0 6px;">${titolo}</div>
        ${html || '<div style="font-size:12px;color:#94a3b8;">'+vuoto+'</div>'}`;
      return `
        <div class="list-card" style="border:1px solid #cbd5e1;margin-bottom:12px;">
          <div style="font-size:17px;font-weight:bold;margin-bottom:8px;">Lotto: ${esc(lotto)}</div>
          ${blocco('1 · RICEVIMENTO', rice.map(({r,v}) => `
            <div style="padding:8px;background:#f8fafc;border-radius:8px;margin-bottom:5px;">
              <strong>${esc(v.nome)}</strong> · ${esc(r.fornitore_nome||'—')}
              <div style="font-size:12px;color:#64748b;">Data ${esc(dataBreve(r.data_riferimento))}${r.numero_documento ? ' · DDT '+esc(r.numero_documento) : ''}${v.scadenza ? ' · Scad. '+esc(v.scadenza) : ''}</div>
            </div>`).join(''),'Nessun ricevimento collegato.')}
          ${blocco('2 · PROCESSI / PREPARAZIONI', proc.map(p => `
            <div style="padding:8px;background:#f8fafc;border-radius:8px;margin-bottom:5px;">
              <strong>${esc(p.prodotto||'—')}</strong> · ${esc(p.tipo||'processo')}
              <div style="font-size:12px;color:#64748b;">Data ${esc(dataBreve(p.data_riferimento))}${p.valori?.temperatura_fine_c ? ' · '+esc(p.valori.temperatura_fine_c)+' °C' : ''}</div>
            </div>`).join(''),'Nessun processo collegato.')}
          ${blocco('3 · CONSERVAZIONE', cons.map(c => `
            <div style="padding:8px;background:#f8fafc;border-radius:8px;margin-bottom:5px;">
              <strong>${esc(c.prodotto||'—')}</strong> · ${esc(c.tipo_conservazione_label||c.tipo_conservazione||'—')}
              <div style="font-size:12px;color:#64748b;">Produzione ${esc(dataBreve(c.data_produzione))} · Scad. ${esc(dataBreve(c.scadenza))}${c.apparecchiatura_nome ? ' · '+esc(c.apparecchiatura_nome) : ''}</div>
            </div>`).join(''),'Nessuna conservazione collegata.')}
          ${blocco('4 · SERVIZIO', serv.map(s => `
            <div style="padding:8px;background:#f8fafc;border-radius:8px;margin-bottom:5px;">
              <strong>${esc(s.piatto||s.prodotto||'—')}</strong> · ${esc(dataBreve(s.data_riferimento))}
              <div style="font-size:12px;color:#64748b;">${s.quantita ? 'Quantità '+esc(s.quantita) : ''}${s.coperti ? ' · Coperti '+esc(s.coperti) : ''}</div>
            </div>`).join(''),'Nessun servizio collegato.')}
        </div>`;
    }).join('');
  }

  container.querySelector('#tr-cerca').addEventListener('input', render);
}
