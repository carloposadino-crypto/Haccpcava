// Legge una foto di un documento di trasporto (DDT/bolla) e restituisce
// fornitore, numero documento, data e l'elenco dei prodotti riconosciuti,
// usando Gemini Vision.
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito. Usa POST.' });
  }

  try {
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const { imageBase64 } = body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Nessuna immagine fornita.' });
    }

    const cleanBase64 = imageBase64.includes(',')
      ? imageBase64.split(',')[1]
      : imageBase64;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        error: 'Chiave GEMINI_API_KEY non configurata su Vercel: la lettura automatica della bolla non è attiva.',
      });
    }

    const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/i);
    const mimeType = mimeMatch?.[1] || 'image/jpeg';

    const prompt = 'Analizza questa bolla di accompagnamento / DDT / fattura di consegna per un ristorante. '
      + 'Leggi con attenzione anche testo piccolo, quantità, unità di misura e numeri di lotto. '
      + 'Non inventare dati: se un dato non è leggibile o non è presente usa null. '
      + 'Restituisci ESCLUSIVAMENTE un oggetto JSON valido, senza markdown né altro testo, con questo formato esatto:\n'
      + '{\n'
      + '  "fornitore": "Nome Fornitore",\n'
      + '  "numeroDocumento": "Numero DDT/Bolla",\n'
      + '  "dataDocumento": "YYYY-MM-DD",\n'
      + '  "prodotti": [\n'
      + '    { "nome": "Nome Prodotto", "quantita": "Quantità con unità", "lotto": "Numero lotto se presente" }\n'
      + '  ]\n'
      + '}';

    const modelli = [
      'gemini-flash-latest',
      'gemini-3.5-flash-lite',
    ];

    let geminiData = null;
    let lastStatus = 503;
    let lastError = 'Servizio Gemini temporaneamente non disponibile.';

    for (const modello of modelli) {
      for (let tentativo = 0; tentativo < 3; tentativo++) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modello}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    { text: prompt },
                    { inline_data: { mime_type: mimeType, data: cleanBase64 } },
                  ],
                }],
                generationConfig: {
                  temperature: 0,
                  responseMimeType: 'application/json',
                },
              }),
            }
          );

          const data = await response.json();
          lastStatus = response.status;
          lastError = data.error?.message || 'Errore Gemini API.';

          if (response.ok) {
            geminiData = data;
            break;
          }

          // 503 = sovraccarico temporaneo; 429 = limite/quota temporaneo.
          // In entrambi i casi attendiamo e riproviamo automaticamente.
          if (response.status !== 503 && response.status !== 429) {
            break;
          }

          if (tentativo < 2) {
            const attesa = 1200 * Math.pow(2, tentativo);
            await new Promise(resolve => setTimeout(resolve, attesa));
          }
        } catch (err) {
          lastError = err?.message || 'Errore di collegamento a Gemini.';
          if (tentativo < 2) {
            const attesa = 1200 * Math.pow(2, tentativo);
            await new Promise(resolve => setTimeout(resolve, attesa));
          }
        }
      }

      if (geminiData) break;
    }

    if (!geminiData) {
      return res.status(200).json({
        error: `Errore Gemini API (${lastStatus}): ${lastError}. Ho già effettuato automaticamente i tentativi disponibili. Riprova tra qualche secondo.`,
      });
    }

    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanedJson = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    let parsedData;
    try {
      parsedData = JSON.parse(cleanedJson);
    } catch (e) {
      return res.status(200).json({
        error: 'La risposta dell\'IA non era in un formato leggibile. Riprova con una foto più nitida.',
      });
    }

    return res.status(200).json({ success: true, data: parsedData });
  } catch (error) {
    console.error('Errore OCR:', error);
    return res.status(500).json({ error: 'Errore durante l\'elaborazione dell\'immagine.' });
  }
};
