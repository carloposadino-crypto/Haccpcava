// Legge un listino prezzi fornitore (PDF o foto) e restituisce l'elenco
// degli ingredienti con il prezzo al kg riconosciuto, usando Gemini.
// L'utente controlla e conferma ogni riga prima che venga salvata.
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito. Usa POST.' });
  }

  try {
    let body = req.body || {};
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) {} }
    const { file, mimeType } = body;

    if (!file) {
      return res.status(400).json({ error: 'Nessun file fornito.' });
    }

    if (typeof file !== 'string' || !file.startsWith('data:')) {
      return res.status(400).json({ error: 'Il file non è in un formato valido.' });
    }

    const cleanBase64 = file.split(',')[1] || '';
    if (!cleanBase64) {
      return res.status(400).json({ error: 'Il file è vuoto o non leggibile.' });
    }

    const tipo = mimeType || file.slice(5, file.indexOf(';')) || 'application/pdf';
    const tipiConsentiti = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!tipiConsentiti.includes(tipo)) {
      return res.status(400).json({ error: 'Formato non supportato. Usa PDF, JPG, PNG, WEBP o HEIC/HEIF.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        error: 'Chiave GEMINI_API_KEY non configurata su Vercel: la lettura automatica del listino non è ancora attiva.',
      });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: 'Analizza questo listino prezzi di un fornitore per un ristorante. '
                + 'Per ogni riga/prodotto del listino, individua il nome dell\'ingrediente e il prezzo per kg in euro '
                + '(se il prezzo è indicato per litro, pezzo o altra unità, riportalo comunque nel campo prezzo_kg così com\'è, '
                + 'segnalandolo nel campo unita_originale). '
                + 'Restituisci ESCLUSIVAMENTE un oggetto JSON con questo formato esatto, senza markdown né altro testo:\n'
                + '{\n'
                + '  "fornitore": "Nome Fornitore (se indicato nel documento, altrimenti stringa vuota)",\n'
                + '  "voci": [\n'
                + '    { "nome": "Nome Ingrediente", "prezzo_kg": 12.50, "unita_originale": "kg" }\n'
                + '  ]\n'
                + '}',
            },
            { inline_data: { mime_type: tipo, data: cleanBase64 } },
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
      return res.status(200).json({ error: 'La risposta dell\'IA non era in un formato leggibile. Riprova, oppure con un file più leggibile.' });
    }

    return res.status(200).json({ success: true, data: parsedData });
  } catch (error) {
    console.error('Errore lettura listino:', error);
    return res.status(500).json({ error: 'Errore durante l\'elaborazione del file.' });
  }
};
