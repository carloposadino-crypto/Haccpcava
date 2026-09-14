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
            .slice(0, 12000);
        }
      } catch (err) {
        console.warn("Impossibile scaricare l'URL:", err.message);
      }
    }

    let promptText = `Sei un assistente per cucina professionale HACCP. Estrai la ricetta restituendo ESCLUSIVAMENTE un JSON valido senza formattazione Markdown con questa struttura esatta:
{
  "titolo": "Nome Ricetta",
  "categoria": "Secondi",
  "porzioni": 20,
  "tempoPrep": "40 min",
  "tempoCottura": "4 ore",
  "abbattimento": "60 min",
  "ingredienti": ["Ingrediente 1: quantità", "Ingrediente 2: quantità"],
  "procedimento": ["Passaggio 1", "Passaggio 2"],
  "haccpNote": "Istruzioni conservazione e allergeni"
}`;

    if (pageText) {
      promptText += `\n\nEcco il testo della ricetta estratto dalla pagina web:\n${pageText}`;
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
    const recipeData = JSON.parse(cleanJson);

    return res.status(200).json(recipeData);

  } catch (error) {
    return res.status(200).json({ error: "Errore durante l'elaborazione: " + error.message });
  }
};
