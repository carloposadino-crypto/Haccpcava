module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ 
        error: "Chiave GEMINI_API_KEY non trovata nelle Environment Variables su Vercel." 
      });
    }

    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const { url, image, file, mimeType } = body;
    let pageText = "";

    if (url) {
      try {
        let parsedUrl;
        try {
          parsedUrl = new URL(url);
          if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Protocollo non valido');
        } catch (e) {
          return res.status(400).json({ error: "Il link non è valido. Usa un URL che inizi con http:// o https://." });
        }
        const fetchRes = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
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

    let promptText = `Sei uno chef professionale esperto in cucina tecnica e Food Cost per "La Cava dei Vini".
Estrai e adatta la ricetta per 20 PORZIONI basandoti sulle seguenti regole tassative:
1. CONVERSIONI: Converti ogni unità di misura ESCLUSIVAMENTE in grammi (g). (Es: Olio EVO: 80g).
2. DOSI: Calcola le dosi per 20 porzioni con senso critico da chef per grandi quantità.
3. INGREDIENTI: Elenco verticale puro, un ingrediente per riga con sintassi "Ingrediente: Peso g". Mai tabelle o griglie.
4. PROCEDIMENTO: Passaggi brevi e numerati.

Restituisci ESCLUSIVAMENTE un JSON valido (senza formattazione markdown \`\`\`json) con questa struttura esatta:
{
  "nome": "Nome della Ricetta",
  "categoria": "Secondi",
  "porzioni": 20,
  "tempi": "Prep: 30 min | Cottura: 12 ore CBT | Abbattimento: 60 min",
  "ingredienti": "Punta di Petto di Manzo: 2500g\\nSale Fino: 30g\\nPepe Nero: 5g\\nOlio EVO: 60g",
  "procedimento": "1. Condire la carne con sale, pepe e olio.\\n2. Confezionare sotto vuoto al 99%.\\n3. Cuocere a bagno maria (roner) a 68°C per 12 ore.\\n4. Abbattere a +3°C e conservare.",
  "haccpNote": "Conservazione a +3°C in sottovuoto per max 7 giorni."
}`;

    if (pageText) {
      promptText += `\n\nEcco il testo estratto dalla pagina web della ricetta:\n${pageText}`;
    } else if (url) {
      return res.status(200).json({
        error: "Non riesco a leggere il contenuto di questo sito dal link. Prova con uno screenshot della ricetta oppure incolla qui il testo della ricetta."
      });
    }

    const parts = [{ text: promptText }];

    const documento = file || image;
    if (documento) {
      if (typeof documento !== 'string' || !documento.startsWith('data:')) {
        return res.status(400).json({ error: "Il file non è in un formato valido." });
      }

      const base64Data = documento.split(',')[1] || '';
      const tipoDocumento = mimeType || documento.split(';')[0].split(':')[1] || 'image/jpeg';
      const tipiConsentiti = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

      if (!tipiConsentiti.includes(tipoDocumento)) {
        return res.status(400).json({ error: "Formato non supportato. Usa PDF, JPG, PNG o WEBP." });
      }

      if (!base64Data) {
        return res.status(400).json({ error: "Il file è vuoto o non leggibile." });
      }

      // Evita richieste enormi che possono essere rifiutate dalla funzione serverless.
      const byteStimati = Math.floor(base64Data.length * 0.75);
      if (tipoDocumento === 'application/pdf' && byteStimati > 3300000) {
        return res.status(400).json({
          error: "Il PDF è troppo grande per l'importazione automatica (oltre circa 3,3 MB). Usa un PDF più leggero oppure uno screenshot."
        });
      }

      parts.push({
        inline_data: {
          mime_type: tipoDocumento,
          data: base64Data
        }
      });
    }

    // Gemini può restituire 503 temporanei quando il modello è sotto carico.
    // Proviamo prima il modello principale, poi un retry e infine Flash-Lite.
    const modelli = ['gemini-flash-latest', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];
    let response = null;
    let data = null;
    let ultimoErrore = null;

    for (let i = 0; i < modelli.length; i++) {
      const modello = modelli[i];

      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 900));
      }

      try {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modello}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts }] })
        });

        data = await response.json();

        if (response.ok) break;

        ultimoErrore = data.error?.message || `HTTP ${response.status}`;

        // Fallback automatico solo per errori temporanei di disponibilità.
        if (response.status !== 503 && response.status !== 429) break;
      } catch (err) {
        ultimoErrore = err.message;
      }
    }

    if (!response || !response.ok) {
      return res.status(200).json({
        error: `Errore Gemini API (${response?.status || 500}): ${ultimoErrore || 'servizio non disponibile'}`
      });
    }

    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return res.status(200).json({ error: "Nessuna risposta ricevuta dall'IA." });
    }

    const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    let recipeData = {};
    try {
      recipeData = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Errore parsing JSON:", e);
      return res.status(200).json({ error: "Errore nella risposta dell'IA (JSON non valido)." });
    }

    // NORMALIZZAZIONE CAMPI
    const nome = recipeData.nome || recipeData.titolo || recipeData.nomeRicetta || recipeData.title || "";
    const categoria = recipeData.categoria || "Secondi";
    const porzioni = recipeData.porzioni || 20;

    let ingredientiStr = "";
    if (Array.isArray(recipeData.ingredienti)) {
      ingredientiStr = recipeData.ingredienti.join("\n");
    } else if (typeof recipeData.ingredienti === 'string') {
      ingredientiStr = recipeData.ingredienti;
    }

    let procStr = "";
    if (Array.isArray(recipeData.procedimento)) {
      procStr = recipeData.procedimento.map((step, i) => `${i + 1}. ${step.replace(/^\d+\.\s*/, '')}`).join("\n");
    } else if (typeof recipeData.procedimento === 'string') {
      procStr = recipeData.procedimento;
    }

    const tempiStr = recipeData.tempi || `Prep: ${recipeData.tempoPrep || '30 min'} | Cottura: ${recipeData.tempoCottura || ''} | Abbattimento: ${recipeData.abbattimento || ''}`.replace(/\|\s*\|/g, '|').trim();
    const haccpStr = recipeData.haccpNote || recipeData.noteHaccp || recipeData.haccp || recipeData.note || "";

    const resultJson = {
      nome: nome,
      titolo: nome,
      nomeRicetta: nome,
      title: nome,
      categoria: categoria,
      porzioni: porzioni,
      tempi: tempiStr,
      tempoPrep: recipeData.tempoPrep || "",
      tempoCottura: recipeData.tempoCottura || "",
      abbattimento: recipeData.abbattimento || "",
      ingredienti: ingredientiStr,
      ingredientiText: ingredientiStr,
      procedimento: procStr,
      procedimentoNumerato: procStr,
      haccpNote: haccpStr,
      noteHaccp: haccpStr,
      haccp: haccpStr
    };

    return res.status(200).json(resultJson);

  } catch (error) {
    return res.status(200).json({ error: "Errore durante l'elaborazione: " + error.message });
  }
};
