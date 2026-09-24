// Legge un listino prezzi fornitore (PDF o foto) e restituisce l'elenco
// degli ingredienti con il prezzo al kg riconosciuto, usando Gemini.
// L'utente controlla e conferma ogni riga prima che venga salvata.
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito. Usa POST.' });

  try {
    let body = req.body || {};
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) {} }
    const { file, mimeType } = body;

    if (!file) return res.status(400).json({ error: 'Nessun file fornito.' });
    if (typeof file !== 'string' || !file.startsWith('data:')) {
      return res.status(400).json({ error: 'Il file non è in un formato valido.' });
    }

    const cleanBase64 = file.split(',')[1] || '';
    if (!cleanBase64) return res.status(400).json({ error: 'Il file è vuoto o non leggibile.' });

    const tipo = mimeType || file.slice(5, file.indexOf(';')) || 'application/pdf';
    const tipiConsentiti = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!tipiConsentiti.includes(tipo)) {
      return res.status(400).json({ error: 'Formato non supportato. Usa PDF, JPG, PNG, WEBP o HEIC/HEIF.' });
    }

    // Base64 aumenta il peso di circa un terzo. Evitiamo di mandare alla
    // funzione serverless PDF troppo grandi, che possono superare il limite HTTP.
    const byteStimati = Math.floor(cleanBase64.length * 0.75);
    if (tipo === 'application/pdf' && byteStimati > 3300000) {
      return res.status(400).json({
        error: 'Il PDF è troppo grande per l’importazione automatica (oltre circa 3,3 MB). Usa un PDF più leggero oppure una foto/screenshot delle pagine del listino.'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        error: 'Chiave GEMINI_API_KEY non configurata su Vercel: la lettura automatica del listino non è ancora attiva.',
      });
    }

    const prompt = 'Analizza questo listino prezzi di un fornitore per un ristorante. '
      + 'Per ogni riga/prodotto, individua il nome dell’ingrediente e il prezzo. '
      + 'Metti un valore in prezzo_kg SOLO se il documento indica realmente un prezzo per kg. '
      + 'Se il prezzo è per litro, pezzo, confezione o altra unità, usa prezzo_kg: null e indica l’unità in unita_originale. '
      + 'Non inventare conversioni. '
      + 'Restituisci ESCLUSIVAMENTE JSON valido, senza markdown, nel formato: '
      + '{ "fornitore": "Nome o stringa vuota", "voci": [{ "nome": "Nome Ingrediente", "prezzo_kg": 12.50, "unita_originale": "kg" }] }';

    // Usa modelli stabili e multimodali. Il PDF è supportato da Gemini Flash.
    // In caso di sovraccarico o rate limit, prova automaticamente il modello successivo.
    const modelli = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
    let response = null;
    let geminiData = null;
    let ultimoErrore = null;

    for (let i = 0; i < modelli.length; i++) {
      if (i > 0) await new Promise(resolve => setTimeout(resolve, 900));

      try {
        const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/'
          + modelli[i] + ':generateContent?key=' + apiKey;

        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [
              { text: prompt },
              { inline_data: { mime_type: tipo, data: cleanBase64 } },
            ] }],
          }),
        });

        geminiData = await response.json();
        if (response.ok) break;

        ultimoErrore = geminiData.error?.message || 'HTTP ' + response.status;
        if (response.status !== 503 && response.status !== 429) break;
      } catch (err) {
        ultimoErrore = err.message;
      }
    }

    if (!response || !response.ok) {
      return res.status(200).json({
        error: 'Errore Gemini API (' + (response?.status || 500) + '): ' + (ultimoErrore || 'servizio non disponibile')
      });
    }

    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanedJson = rawText.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();

    let parsedData;
    try {
      parsedData = JSON.parse(cleanedJson);
    } catch (e) {
      return res.status(200).json({
        error: 'La risposta dell’IA non era in un formato leggibile. Riprova con un PDF più leggibile oppure con foto/screenshot delle pagine.'
      });
    }

    return res.status(200).json({ success: true, data: parsedData });
  } catch (error) {
    console.error('Errore lettura listino:', error);
    return res.status(500).json({ error: 'Errore durante l’elaborazione del file.' });
  }
};