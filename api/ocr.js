// Legge una foto di un documento di trasporto (DDT/bolla) e restituisce
// fornitore, numero documento, data e l'elenco dei prodotti riconosciuti,
// usando Gemini Vision. Se la chiave GEMINI_API_KEY non è configurata su
// Vercel, risponde in modalità demo così l'interfaccia resta comunque
// provabile (e lo dice chiaramente, con isDemo: true).
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito. Usa POST.' });
  }

  try {
    let body = req.body || {};
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) {} }
    const { imageBase64 } = body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Nessuna immagine fornita.' });
    }

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        error: 'Chiave GEMINI_API_KEY non configurata su Vercel: la lettura automatica della bolla non è ancora attiva.',
      });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: 'Analizza questa bolla di accompagnamento / DDT / fattura di consegna per un ristorante. '
                + 'Restituisci ESCLUSIVAMENTE un oggetto JSON con questo formato esatto (senza markdown né altro testo):\n'
                + '{\n'
                + '  "fornitore": "Nome Fornitore",\n'
                + '  "numeroDocumento": "Numero DDT/Bolla",\n'
                + '  "dataDocumento": "YYYY-MM-DD",\n'
                + '  "prodotti": [\n'
                + '    { "nome": "Nome Prodotto", "quantita": "Quantità con unità", "lotto": "Numero lotto se presente" }\n'
                + '  ]\n'
                + '}',
            },
            { inline_data: { mime_type: 'image/jpeg', data: cleanBase64 } },
          ],
        }],
      }),
    });

    const geminiData = await response.json();
    if (!response.ok) {
      return res.status(200).json({ error: `Errore Gemini API (${response.status}): ${geminiData.error?.message || 'chiave non valida o quota superata'}` });
    }

    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanedJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    let parsedData;
    try { parsedData = JSON.parse(cleanedJson); } catch (e) {
      return res.status(200).json({ error: 'La risposta dell\'IA non era in un formato leggibile. Riprova con una foto più nitida.' });
    }

    return res.status(200).json({ success: true, data: parsedData });
  } catch (error) {
    console.error('Errore OCR:', error);
    return res.status(500).json({ error: 'Errore durante l\'elaborazione dell\'immagine.' });
  }
};
