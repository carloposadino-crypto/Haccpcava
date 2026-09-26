module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(200).json({ error: 'Chiave GEMINI_API_KEY non trovata nelle Environment Variables su Vercel.' });

    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const { url, image, file, mimeType } = body;
    let pageText = '';

    if (url) {
      try {
        const parsedUrl = new URL(url);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Protocollo non valido');
        const fetchRes = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' }
        });
        if (fetchRes.ok) {
          const html = await fetchRes.text();
          pageText = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 15000);
        }
      } catch (err) {
        console.warn("Impossibile scaricare l'URL:", err.message);
      }
    }

    const promptText = `Sei un assistente tecnico per le schede ricetta HACCP di La Cava dei Vini.
Analizza la ricetta fornita e trasformala in una scheda strutturata per 20 PORZIONI, salvo che la ricetta indichi chiaramente un numero diverso.
REGOLE IMPORTANTI:
1. Non inventare ingredienti o quantità che non risultano dalla fonte. Se una quantità è assente o è "q.b.", lasciala vuota e segnala "Da verificare".
2. Normalizza le quantità nell'output in GRAMMI. Per kg usa kg x 1000; per litri/ml usa una conversione operativa solo quando ragionevole per un ingrediente alimentare, ma indica sempre la conversione nel campo "conversione" così l'utente può controllarla.
3. Se la fonte usa cucchiai, cucchiaini, bicchieri, mazzi, spicchi o altre unità non convertibili con sicurezza, non inventare il peso: lascia grammi vuoti e indica l'unità originale nel campo "conversione".
4. Mantieni il nome originale dell'ingrediente il più possibile. Non sostituire ingredienti.
5. Procedimento breve e numerato, senza aggiungere tecniche non presenti nella fonte. Se sono presenti tempi o temperature, conservarli.
6. Individua, solo quando chiaramente ricavabili dagli ingredienti o dal processo, pericoli, misure di controllo e CCP. Non inventare temperature o limiti normativi.
7. Individua gli allergeni evidenti, usando i nomi standard UE: Glutine, Crostacei, Uova, Pesce, Arachidi, Soia, Latte, Frutta a guscio, Sedano, Senape, Sesamo, Anidride solforosa/Solfiti, Lupini, Molluschi. Per allergeni dipendenti dalla marca/etichetta (es. vino/solfiti), indica "da verificare in etichetta".

Restituisci ESCLUSIVAMENTE JSON valido, senza markdown, con questa struttura:
{
  "nome": "Nome ricetta",
  "categoria": "Primo/Secondo/Dessert/Altro",
  "porzioni": 20,
  "ingredienti": [
    {"nome":"Ossobuco di vitello","grammi":2500,"conversione":""},
    {"nome":"Vino","grammi":400,"conversione":"400 ml → 400 g, da verificare"}
  ],
  "procedimento": "1. ...\\n2. ...",
  "pericoli": "...",
  "misureControllo": "...",
  "ccp": "...",
  "haccpNote": "...",
  "allergeni": ["Sedano", "Latte"]
}

Ricorda: i grammi devono essere numeri oppure null. Non scrivere "g" dentro il valore numerico.`;

    const parts = [{ text: promptText }];
    if (pageText) parts.push({ text: `\n\nTESTO DELLA PAGINA WEB:\n${pageText}` });
    else if (url) return res.status(200).json({ error: 'Non riesco a leggere il contenuto di questo sito dal link. Prova con uno screenshot della ricetta oppure con un PDF.' });

    const documento = file || image;
    if (documento) {
      if (typeof documento !== 'string' || !documento.startsWith('data:')) return res.status(400).json({ error: 'Il file non è in un formato valido.' });
      const base64Data = documento.split(',')[1] || '';
      const tipoDocumento = mimeType || documento.split(';')[0].split(':')[1] || 'image/jpeg';
      const tipiConsentiti = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      if (!tipiConsentiti.includes(tipoDocumento)) return res.status(400).json({ error: 'Formato non supportato. Usa PDF, JPG, PNG o WEBP.' });
      if (!base64Data) return res.status(400).json({ error: 'Il file è vuoto o non leggibile.' });
      const byteStimati = Math.floor(base64Data.length * 0.75);
      if (tipoDocumento === 'application/pdf' && byteStimati > 3300000) return res.status(400).json({ error: 'Il PDF è troppo grande per l’importazione automatica (oltre circa 3,3 MB). Usa un PDF più leggero oppure uno screenshot.' });
      parts.push({ inline_data: { mime_type: tipoDocumento, data: base64Data } });
    }

    const modelli = ['gemini-flash-latest', 'gemini-flash-latest', 'gemini-3.5-flash-lite'];
    let response = null;
    let data = null;
    let ultimoErrore = null;
    for (let i = 0; i < modelli.length; i++) {
      if (i > 0) await new Promise((resolve) => setTimeout(resolve, 900));
      try {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelli[i]}:generateContent?key=${apiKey}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts }] })
        });
        data = await response.json();
        if (response.ok) break;
        ultimoErrore = data.error?.message || `HTTP ${response.status}`;
        if (response.status !== 503 && response.status !== 429) break;
      } catch (err) { ultimoErrore = err.message; }
    }

    if (!response || !response.ok) return res.status(200).json({ error: `Errore Gemini API (${response?.status || 500}): ${ultimoErrore || 'servizio non disponibile'}` });

    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) return res.status(200).json({ error: "Nessuna risposta ricevuta dall'IA." });

    const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    let recipeData;
    try { recipeData = JSON.parse(cleanJson); }
    catch (e) { console.error('Errore parsing JSON:', e); return res.status(200).json({ error: "Errore nella risposta dell'IA (JSON non valido)." }); }

    const nome = recipeData.nome || recipeData.titolo || recipeData.nomeRicetta || recipeData.title || '';
    const categoria = recipeData.categoria || '';
    const porzioni = Number(recipeData.porzioni) || 20;
    const ingredienti = Array.isArray(recipeData.ingredienti)
      ? recipeData.ingredienti.map((i) => ({
          nome: String(i?.nome || '').trim(),
          grammi: i?.grammi == null || i?.grammi === '' ? '' : Number(i.grammi),
          conversione: String(i?.conversione || '')
        })).filter((i) => i.nome)
      : [];
    const procStr = Array.isArray(recipeData.procedimento)
      ? recipeData.procedimento.map((s, i) => `${i + 1}. ${String(s).replace(/^\d+\.\s*/, '')}`).join('\n')
      : String(recipeData.procedimento || '');

    return res.status(200).json({
      nome, titolo: nome, nomeRicetta: nome, title: nome, categoria, porzioni,
      ingredienti, ingredientiText: ingredienti.map((i) => `${i.nome}: ${i.grammi === '' ? 'q.b.' : `${i.grammi}g`}`).join('\n'),
      procedimento: procStr, procedimentoNumerato: procStr,
      pericoli: recipeData.pericoli || '',
      misureControllo: recipeData.misureControllo || recipeData.misure_controllo || '',
      ccp: recipeData.ccp || '',
      haccpNote: recipeData.haccpNote || recipeData.noteHaccp || recipeData.haccp || recipeData.note || '',
      allergeni: Array.isArray(recipeData.allergeni) ? recipeData.allergeni : []
    });
  } catch (error) {
    return res.status(200).json({ error: "Errore durante l'elaborazione: " + error.message });
  }
};
