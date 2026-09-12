export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito. Usa POST.' });
  }

  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Nessuna immagine fornita' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // Se hai configurato GEMINI_API_KEY su Vercel:
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

    if (apiKey && process.env.GEMINI_API_KEY) {
      // Chiamata all'API Google Gemini Vision
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "Analizza questa bolla di accompagnamento / DDT / fattura di consegna per un ristorante. " +
                      "Restituisci ESCLUSIVAMENTE un oggetto JSON con questo formato esatto (senza markdown o altro testo):\n" +
                      "{\n" +
                      '  "fornitore": "Nome Fornitore",\n' +
                      '  "numeroDocumento": "Numero DDT/Bolla",\n' +
                      '  "dataDocumento": "YYYY-MM-DD",\n' +
                      '  "prodotti": [\n' +
                      '    { "nome": "Nome Prodotto", "quantita": "Quantita in g o kg", "lotto": "Numero Lotto se presente" }\n' +
                      '  ]\n' +
                      "}"
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: cleanBase64
                }
              }
            ]
          }]
        })
      });

      const geminiData = await response.json();
      const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      // Pulizia eventuale formattazione markdown ```json ... ```
      const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanedJson);

      return res.status(200).json({ success: true, data: parsedData });
    }

    // Modalità demo/fallback se non è ancora inserita la chiave API
    const fallbackData = {
      fornitore: "Fornitore Rilevato (Demo OCR)",
      numeroDocumento: "DDT-" + Math.floor(1000 + Math.random() * 9000),
      dataDocumento: new Date().toISOString().split('T')[0],
      prodotti: [
        { nome: "Farina Tipo 00", quantita: "25000g", lotto: "L-" + Math.floor(1000 + Math.random() * 9000) },
        { nome: "Olio EVO Cava", quantita: "5000g", lotto: "L-" + Math.floor(1000 + Math.random() * 9000) }
      ]
    };

    return res.status(200).json({ success: true, data: fallbackData, isDemo: true });

  } catch (error) {
    console.error("Errore OCR Serverless:", error);
    return res.status(500).json({ error: "Errore durante l'elaborazione dell'immagine" });
  }
}