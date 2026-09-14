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

    const { url, image } = body;
    let pageText = "";

    if (url) {
      try {
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
      promptText += `\n\nAnalizza questa ricetta dal link: ${url}`;
    }

    const parts = [{ text: promptText }];

    if (image) {
      const base64Data = image.includes(',') ? image.split(',')[1] : image;
      const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Data
        }
      });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }] })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({ 
        error: `Errore Gemini API (${response.status}): ${data.error?.message || 'Chiave non valida o quota superata'}` 
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
