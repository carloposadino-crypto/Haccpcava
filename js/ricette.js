// Schede HACCP: ricette sempre modificabili durante lo sviluppo.
// L'importazione automatica prepara la scheda, l'utente verifica e poi salva.
import { leggiTutti, aggiungi, aggiorna, elimina, orderBy } from './store.js';

const ALLERGENI = ['Glutine','Crostacei','Uova','Pesce','Arachidi','Soia','Latte','Frutta a guscio','Sedano','Senape','Sesamo','Anidride solforosa/Solfiti','Lupini','Molluschi'];
let righeCorrenti = [];
let listinoCorrente = [];
let prodottiCorrenti = [];
let importazioneDaVerificare = false;
let importazioneVerificata = false;
let modificaId = null;

const rigaVuota = () => ({ nome:'', grammi:'', conversione:'' });
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const norm = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\b(igp|dop|doc|docg|bio|italiano|italiana|fresco|fresca|freschi|fresche|professionale|premium)\b/g,' ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const num = (v) => v == null || v === '' ? NaN : Number(String(v).replace(',','.'));

function trovaListino(nome) {
  const n = norm(nome); if (!n) return null;
  let x = listinoCorrente.find(v => norm(v.nome) === n);
  if (x) return x;
  x = listinoCorrente.find(v => { const a=norm(v.nome); return a.includes(n) || n.includes(a); });
  if (x) return x;
  const p=n.split(' ').filter(x=>x.length>=4);
  return p.length>=2 ? listinoCorrente.find(v => p.every(w=>norm(v.nome).split(' ').includes(w))) || null : null;
}
function trovaProdotto(nome) {
  const n=norm(nome); if(!n) return null;
  return prodottiCorrenti.find(v=>norm(v.denominazione)===n) || prodottiCorrenti.find(v=>{const a=norm(v.denominazione);return a.includes(n)||n.includes(a);}) || null;
}
function allergeniNome(nome) {
  const n=norm(nome), out=new Set();
  const r=[['Glutine',/farina|pasta|tagliatell|agnolott|raviol|pane|pangratt|orzo|segale|avena|grano|semola/],['Uova',/uovo|uova|tuorlo|albume|maionese/],['Pesce',/acciug|alice|alici|tonno|salmone|pesce|colatura/],['Latte',/latte|burro|panna|formaggio|parmigiano|grana|mascarpone|mozzarella|ricotta|yogurt/],['Sedano',/sedano/],['Senape',/senape/],['Soia',/soia/],['Frutta a guscio',/nocciol|mandorl|noce|noci|pistac|anacard/],['Sesamo',/sesamo/],['Anidride solforosa/Solfiti',/vino|marsala|aceto|solfit/],['Crostacei',/gamber|scamp|aragost|granch/],['Molluschi',/cozze|vongol|calamar|sepp|ostric/],['Lupini',/lupin/],['Arachidi',/arachid/]];
  r.forEach(([a,re])=>{if(re.test(n))out.add(a);}); return [...out];
}
function analizza(r) {
  const voce=trovaListino(r.nome), prod=trovaProdotto(r.nome), a=new Set(allergeniNome(r.nome));
  (prod?.allergeni||[]).forEach(x=>a.add(x.allergene||x));
  return {voce,prod,allergeni:[...a],prezzoKg:voce?.prezzo_kg!=null?Number(voce.prezzo_kg):null};
}
function parseIngredientiTesto(testo) {
  if(!testo)return[rigaVuota()];
  const out=String(testo).split('\n').map(x=>x.trim()).filter(Boolean).map(line=>{
    const m=line.match(/^(.+?)(?:\s*:\s*|\s+-\s*)([\d.,]+)\s*(kg|g|ml|l)?\s*$/i);
    if(!m){const q=line.match(/^(.+?)(?:\s*:\s*|\s+-\s*)q\.?b\.?$/i);return q?{nome:q[1].trim(),grammi:'',conversione:'q.b. — quantità da definire'}:{nome:line.replace(/^[-•]\s*/,''),grammi:'',conversione:'Da verificare'};}
    const n=num(m[2]), u=(m[3]||'g').toLowerCase(); let g=n;
    if(u==='kg'||u==='l')g=n*1000; if(u==='ml')g=n;
    return {nome:m[1].trim(),grammi:Number.isFinite(g)?String(g).replace(/\.0$/,''):'',conversione:u!=='g'?`${m[2]} ${u} → ${g} g`:''};
  }); return out.length?out:[rigaVuota()];
}

export async function renderRicettePage(container, profilo) {
  container.innerHTML='<div class="empty-state">Caricamento…</div>';
  const [schede,listino,prodotti]=await Promise.all([
    leggiTutti('schede_haccp',[orderBy('creato_il','desc')]).catch(()=>[]),
    leggiTutti('listino_prezzi').catch(()=>[]),leggiTutti('prodotti').catch(()=>[])
  ]);
  listinoCorrente=listino; prodottiCorrenti=prodotti; righeCorrenti=[rigaVuota()]; modificaId=null; importazioneDaVerificare=false; importazioneVerificata=false;

  container.innerHTML=`
    <div class="top-bar"><h2>Schede HACCP</h2></div>
    <div class="list-card" style="border:1px dashed #2b5c3a;">
      <div style="font-size:13px;font-weight:bold;color:#2b5c3a;margin-bottom:6px;">✨ Importazione automatica</div>
      <div style="font-size:12px;color:#475569;margin-bottom:10px;">Importa una foto, un PDF o un link. L'app normalizza ingredienti e grammature, confronta il listino, individua gli allergeni e ti fa verificare tutto prima del salvataggio.</div>
      <input type="file" id="sc-file-input" accept="image/*,application/pdf" style="display:none;">
      <button type="button" class="btn btn-secondary btn-block" id="sc-btn-foto" style="margin-bottom:10px;">📷 Foto / screenshot</button>
      <button type="button" class="btn btn-secondary" id="sc-btn-pdf" style="margin-bottom:10px;">📄 PDF</button>
      <div class="form-row"><input type="url" id="sc-url-input" placeholder="https://sito-ricette.it/ricetta..."><button type="button" class="btn btn-secondary" id="sc-btn-url" style="flex:0 0 auto;">🔗 Importa</button></div>
      <div id="sc-import-status" style="display:none;font-size:12px;color:#2b5c3a;font-weight:bold;text-align:center;margin-top:6px;"></div>
    </div>
    <div id="sc-verifica" class="list-card" style="display:none;border:1px solid #f59e0b;background:#fffbeb;"></div>
    <div class="list-card">
      <div id="sc-form-title" style="font-size:14px;font-weight:bold;color:#334155;margin-bottom:10px;">➕ Nuova ricetta — sempre in sviluppo</div>
      <label class="field-label">Nome preparazione</label><input type="text" id="sc-nome" placeholder="Es. Vitello Tonnato CBT">
      <div class="form-row"><div><label class="field-label">Codice</label><input type="text" id="sc-codice" placeholder="Es. SEC-01"></div><div><label class="field-label">Numero porzioni</label><input type="number" id="sc-porzioni" value="20"></div><div><label class="field-label">Prezzo vendita (€)</label><input type="number" step="0.01" id="sc-prezzo-vendita" placeholder="Es. 18.00"></div></div>
      <label class="field-label">Ingredienti (sempre in grammi)</label><div id="sc-righe"></div>
      <button type="button" class="btn btn-secondary" id="sc-add-riga" style="margin-bottom:6px;">+ Aggiungi ingrediente</button>
      <div id="sc-costo-box" style="background:#f0fdf4;border-radius:8px;padding:10px 12px;margin:10px 0 14px;font-size:13px;color:#166534;"></div>
      <label class="field-label">Allergeni rilevati</label><div id="sc-allergeni" style="font-size:13px;color:#374151;margin-bottom:14px;">Nessuno rilevato</div>
      <label class="field-label">Processo / procedimento</label><textarea id="sc-processo" placeholder="Passaggi principali, tempi e temperature"></textarea>
      <label class="field-label">Pericoli individuati</label><textarea id="sc-pericoli" placeholder="Es. sviluppo microbico, contaminazione crociata"></textarea>
      <label class="field-label">Misure di controllo</label><textarea id="sc-misure" placeholder="Come si tengono sotto controllo i pericoli"></textarea>
      <label class="field-label">CCP (punti critici di controllo)</label><textarea id="sc-ccp" placeholder="Punti critici e limiti applicabili alla ricetta"></textarea>
      <label class="field-label">Note</label><textarea id="sc-note"></textarea>
      <button class="btn btn-primary btn-block" id="sc-salva">Salva ricetta</button>
      <button class="btn btn-secondary btn-block" id="sc-annulla-modifica" style="display:none;margin-top:8px;">Annulla modifica</button>
    </div>
    <h3 style="font-size:14px;color:#64748b;margin:16px 0 8px;">Ricette in sviluppo (${schede.length})</h3>
    ${schede.length===0?'<div class="empty-state">Nessuna ricetta ancora creata.</div>':`<div class="list-card">${schede.map(s=>`
      <div class="check-row" data-scheda="${s.id}">
        <div class="rt"><div class="t">${esc(s.nome)}</div><div class="s">${esc(s.codice||'')}${s.costo_a_porzione!=null?` · € ${Number(s.costo_a_porzione).toFixed(2)} a porzione`:''}${s.food_cost_percentuale!=null?` · FC ${Number(s.food_cost_percentuale).toFixed(1)}%`:''}</div></div>
        <span class="badge badge-pending">In sviluppo</span><span class="chev">▾</span>
      </div>
      <div class="sc-dettaglio" data-dettaglio="${s.id}" style="display:none;padding:4px 4px 16px;">
        <div style="font-size:13px;color:#374151;line-height:1.6;"><strong>Porzioni:</strong> ${s.porzioni||'—'}<br><strong>Ingredienti:</strong><br>${Array.isArray(s.contenuto?.ingredienti)&&s.contenuto.ingredienti.length?s.contenuto.ingredienti.map(i=>`&nbsp;&nbsp;• ${esc(i.nome)} — ${esc(i.grammi)} g`).join('<br>'):'&nbsp;&nbsp;(nessun ingrediente inserito)'}<br><br><strong>Allergeni:</strong> ${(s.contenuto?.allergeni||[]).map(esc).join(', ')||'—'}<br><br><strong>Processo:</strong><br>${esc(s.contenuto?.processo||'—').replace(/\n/g,'<br>')}<br><br><strong>Pericoli:</strong><br>${esc(s.contenuto?.pericoli||'—').replace(/\n/g,'<br>')}<br><br><strong>Misure:</strong><br>${esc(s.contenuto?.misure_controllo||'—').replace(/\n/g,'<br>')}<br><br><strong>CCP:</strong><br>${esc(s.contenuto?.ccp||'—').replace(/\n/g,'<br>')}<br><br><strong>Note:</strong><br>${esc(s.contenuto?.note||'—').replace(/\n/g,'<br>')}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;"><button class="btn btn-secondary sc-modifica" data-modifica="${s.id}">✏️ Modifica ricetta</button><button class="btn btn-danger sc-elimina" data-elimina="${s.id}">🗑️ Elimina ricetta</button></div>
      </div>`).join('')}</div>`}
  `;

  const costo=()=>{
    let totale=0,senza=0; righeCorrenti.forEach(r=>{const g=num(r.grammi);if(!r.nome.trim()||!Number.isFinite(g))return;const x=analizza(r);if(x.prezzoKg==null){senza++;return;}totale+=g/1000*x.prezzoKg;});
    const por=parseInt(container.querySelector('#sc-porzioni').value,10)||1, cp=totale/por, pv=num(container.querySelector('#sc-prezzo-vendita').value)||0, fc=pv>0?cp/pv*100:null;
    container.querySelector('#sc-costo-box').innerHTML=`Costo ingredienti: <strong>€ ${totale.toFixed(2)}</strong> — a porzione: <strong>€ ${cp.toFixed(2)}</strong>${fc!=null?` — Food cost: <strong>${fc.toFixed(1)}%</strong>`:''}${senza?`<br><span style="color:#b45309;">⚠️ ${senza} ingrediente/i senza prezzo nel listino: costo parziale.</span>`:''}`;
    return{totale,cp,por,pv,fc};
  };
  const allergeni=()=>{const set=new Set();righeCorrenti.filter(r=>r.nome.trim()).forEach(r=>analizza(r).allergeni.forEach(a=>set.add(a)));const a=ALLERGENI.filter(x=>set.has(x));container.querySelector('#sc-allergeni').innerHTML=a.length?a.map(x=>`<span style="display:inline-block;background:#fef3c7;border:1px solid #f59e0b;border-radius:999px;padding:4px 8px;margin:2px;">${esc(x)}</span>`).join(''):'Nessuno rilevato';return a;};
  const disegnaRighe=()=>{const w=container.querySelector('#sc-righe');w.innerHTML=righeCorrenti.map((r,i)=>{const x=analizza(r),p=x.prezzoKg!=null?`€ ${x.prezzoKg.toFixed(2)}/kg`:'⚠️ prezzo non trovato';return `<div style="margin-bottom:8px" data-riga="${i}"><div class="form-row"><input type="text" placeholder="Ingrediente" data-campo="nome" value="${esc(r.nome)}"><input type="number" placeholder="g" data-campo="grammi" value="${esc(r.grammi)}" style="flex:0 0 90px;">${righeCorrenti.length>1?'<button type="button" class="btn btn-danger sc-rimuovi" style="flex:0 0 auto;padding:8px 10px;">✕</button>':''}</div><span style="color:${x.voce?'#166534':'#b45309'};font-size:11px;">${x.voce?'✓ '+esc(x.voce.nome)+' · ':''}${p}</span>${r.conversione?`<div style="font-size:11px;color:#64748b;">↳ ${esc(r.conversione)}</div>`:''}</div>`}).join('');w.querySelectorAll('[data-riga]').forEach(el=>{const i=+el.dataset.riga;el.querySelectorAll('[data-campo]').forEach(inp=>inp.addEventListener('input',()=>{righeCorrenti[i][inp.dataset.campo]=inp.value;if(importazioneDaVerificare){importazioneVerificata=false;aggiornaVerifica();}costo();allergeni();}));el.querySelector('.sc-rimuovi')?.addEventListener('click',()=>{righeCorrenti.splice(i,1);disegnaRighe();costo();allergeni();});});};
  const aggiornaVerifica=()=>{const b=container.querySelector('#sc-verifica');if(!importazioneDaVerificare){b.style.display='none';return;}const valid=righeCorrenti.filter(r=>r.nome.trim()),linked=valid.filter(r=>analizza(r).voce).length,missing=valid.filter(r=>!Number.isFinite(num(r.grammi))).length;const a=allergeni();b.style.display='block';b.style.borderColor=importazioneVerificata?'#16a34a':'#f59e0b';b.style.background=importazioneVerificata?'#f0fdf4':'#fffbeb';b.innerHTML=`<div style="font-weight:bold;color:#92400e;margin-bottom:6px;">🔎 VERIFICA IMPORTAZIONE</div><div style="font-size:12px;color:#374151;">Ingredienti: <strong>${valid.length}</strong> · collegati al listino: <strong>${linked}</strong> · allergeni: <strong>${a.length}</strong>${missing?` · ⚠️ senza grammatura: <strong>${missing}</strong>`:''}</div><div style="margin-top:8px;font-size:12px;color:#475569;">Controlla nome, porzioni, grammature, ingredienti e procedimento prima di salvare.</div>${importazioneVerificata?'<div style="margin-top:8px;color:#166534;font-weight:bold;font-size:12px;">✓ Importazione verificata.</div>':'<button type="button" class="btn btn-primary btn-block" id="sc-conferma-verifica" style="margin-top:10px;">✓ Conferma verifica importazione</button>'}`;container.querySelector('#sc-conferma-verifica')?.addEventListener('click',()=>{importazioneVerificata=true;aggiornaVerifica();});};
  const stato=()=>{disegnaRighe();costo();allergeni();aggiornaVerifica();};
  const resetForm=()=>{modificaId=null;righeCorrenti=[rigaVuota()];importazioneDaVerificare=false;importazioneVerificata=false;container.querySelector('#sc-form-title').textContent='➕ Nuova ricetta — sempre in sviluppo';container.querySelector('#sc-nome').value='';container.querySelector('#sc-codice').value='';container.querySelector('#sc-porzioni').value='20';container.querySelector('#sc-prezzo-vendita').value='';['sc-processo','sc-pericoli','sc-misure','sc-ccp','sc-note'].forEach(id=>container.querySelector('#'+id).value='');container.querySelector('#sc-salva').textContent='Salva ricetta';container.querySelector('#sc-annulla-modifica').style.display='none';stato();window.scrollTo({top:0,behavior:'smooth'});};
  const caricaNelForm=s=>{modificaId=s.id;container.querySelector('#sc-form-title').textContent='✏️ Modifica ricetta — sempre in sviluppo';container.querySelector('#sc-nome').value=s.nome||'';container.querySelector('#sc-codice').value=s.codice||'';container.querySelector('#sc-porzioni').value=s.porzioni||20;container.querySelector('#sc-prezzo-vendita').value=s.prezzo_vendita??'';const c=s.contenuto||{};righeCorrenti=(c.ingredienti||[]).map(i=>({nome:i.nome||'',grammi:i.grammi??'',conversione:i.conversione||''}));if(!righeCorrenti.length)righeCorrenti=[rigaVuota()];container.querySelector('#sc-processo').value=c.processo||'';container.querySelector('#sc-pericoli').value=c.pericoli||'';container.querySelector('#sc-misure').value=c.misure_controllo||'';container.querySelector('#sc-ccp').value=c.ccp||'';container.querySelector('#sc-note').value=c.note||'';importazioneDaVerificare=false;importazioneVerificata=false;container.querySelector('#sc-salva').textContent='Aggiorna ricetta';container.querySelector('#sc-annulla-modifica').style.display='block';stato();window.scrollTo({top:0,behavior:'smooth'});};

  disegnaRighe();costo();allergeni();
  container.querySelector('#sc-add-riga').addEventListener('click',()=>{righeCorrenti.push(rigaVuota());disegnaRighe();costo();allergeni();});
  container.querySelector('#sc-porzioni').addEventListener('input',costo);container.querySelector('#sc-prezzo-vendita').addEventListener('input',costo);container.querySelector('#sc-annulla-modifica').addEventListener('click',resetForm);
  const status=container.querySelector('#sc-import-status'), show=m=>{status.style.display='block';status.textContent=m}, hide=()=>status.style.display='none';
  const applica=data=>{container.querySelector('#sc-nome').value=data.nome||data.titolo||'';if(data.porzioni)container.querySelector('#sc-porzioni').value=data.porzioni;righeCorrenti=Array.isArray(data.ingredienti)?data.ingredienti.map(i=>({nome:i.nome||'',grammi:i.grammi??'',conversione:i.conversione||''})):parseIngredientiTesto(data.ingredienti||data.ingredientiText||'');container.querySelector('#sc-processo').value=data.procedimento||data.procedimentoNumerato||'';container.querySelector('#sc-note').value=data.haccpNote||data.noteHaccp||data.haccp||'';container.querySelector('#sc-pericoli').value=data.pericoli||'';container.querySelector('#sc-misure').value=data.misureControllo||'';container.querySelector('#sc-ccp').value=data.ccp||'';importazioneDaVerificare=true;importazioneVerificata=false;stato();container.querySelector('#sc-verifica').scrollIntoView({behavior:'smooth',block:'center'});};
  container.querySelector('#sc-btn-url').addEventListener('click',async()=>{const url=container.querySelector('#sc-url-input').value.trim();if(!url)return alert('Inserisci un link valido.');show('⚙️ Lettura della ricetta in corso…');try{const r=await fetch('/api/parse-recipe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})}),d=await r.json();if(d.error)throw new Error(d.error);applica(d);hide();}catch(e){console.error(e);alert(e.message||'Errore di importazione.');hide();}});
  const input=container.querySelector('#sc-file-input');container.querySelector('#sc-btn-foto').addEventListener('click',()=>input.click());container.querySelector('#sc-btn-pdf').addEventListener('click',()=>input.click());input.addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const pdf=f.type==='application/pdf'||f.name.toLowerCase().endsWith('.pdf');show(pdf?'📄 Lettura del PDF in corso…':'📷 Lettura dell’immagine in corso…');const rd=new FileReader();rd.onload=async()=>{try{const r=await fetch('/api/parse-recipe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({file:rd.result,mimeType:f.type||(pdf?'application/pdf':'image/jpeg')})}),d=await r.json();if(d.error)throw new Error(d.error);applica(d);hide();}catch(e){console.error(e);alert(e.message||'Errore durante la lettura del file.');hide();}};rd.readAsDataURL(f);});
  container.querySelector('#sc-salva').addEventListener('click',async e=>{const nome=container.querySelector('#sc-nome').value.trim();if(!nome)return alert('Inserisci il nome della preparazione.');if(importazioneDaVerificare&&!importazioneVerificata)return alert('Prima di salvare devi confermare la verifica dell’importazione.');const righe=righeCorrenti.filter(r=>r.nome.trim()),c=costo(),a=allergeni();if(righe.some(r=>!Number.isFinite(num(r.grammi)))&&!confirm('Una o più righe non hanno una grammatura numerica. Vuoi salvare comunque?'))return;e.currentTarget.disabled=true;const dati={nome,codice:container.querySelector('#sc-codice').value,porzioni:c.por,stato:'bozza',contenuto:{ingredienti:righe.map(r=>({nome:r.nome.trim(),grammi:r.grammi,conversione:r.conversione||''})),allergeni:a,processo:container.querySelector('#sc-processo').value,pericoli:container.querySelector('#sc-pericoli').value,misure_controllo:container.querySelector('#sc-misure').value,ccp:container.querySelector('#sc-ccp').value,note:container.querySelector('#sc-note').value},costo_totale:Math.round(c.totale*100)/100,costo_a_porzione:Math.round(c.cp*100)/100,prezzo_vendita:c.pv>0?Math.round(c.pv*100)/100:null,food_cost_percentuale:c.fc!=null?Math.round(c.fc*10)/10:null,autore_id:profilo.id,modificato_da:profilo.id};try{if(modificaId){await aggiorna('schede_haccp',modificaId,{...dati,modificato_il:new Date()});}else{await aggiungi('schede_haccp',dati,'creato_il');}renderRicettePage(container,profilo);}catch(err){console.error(err);alert('Errore durante il salvataggio della ricetta.');e.currentTarget.disabled=false;}});
  container.querySelectorAll('[data-scheda]').forEach(row=>row.addEventListener('click',e=>{if(e.target.closest('.sc-modifica')||e.target.closest('.sc-elimina'))return;const d=container.querySelector(`[data-dettaglio="${row.dataset.scheda}"]`),open=d.style.display!=='none';d.style.display=open?'none':'block';row.querySelector('.chev').textContent=open?'▾':'▴';}));
  schede.forEach(s=>container.querySelector(`[data-modifica="${s.id}"]`)?.addEventListener('click',e=>{e.stopPropagation();caricaNelForm(s);}));
  schede.forEach(s=>container.querySelector(`[data-elimina="${s.id}"]`)?.addEventListener('click',async e=>{e.stopPropagation();if(!confirm(`Eliminare definitivamente la ricetta “${s.nome}”?\n\nLa ricetta è in sviluppo: se non è più adatta puoi eliminarla.`))return;e.currentTarget.disabled=true;try{await elimina('schede_haccp',s.id);renderRicettePage(container,profilo);}catch(err){console.error(err);alert('Errore durante l’eliminazione.');e.currentTarget.disabled=false;}}));
}
