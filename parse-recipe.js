module.exports = async function handler(req, res) {
  // Gestione CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Chiave API Gemini non configurata su Vercel (GEMINI_API_KEY).' });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const { url, image } = body || {};

    let promptText = `Estrai la ricetta restituendo ESCLUSIVAMENTE un JSON valido senza formattazione Markdown con questa struttura esatta:
{
  "titolo": "Nome Ricetta",
  "categoria": "Primi",
  "porzioni": 10,
  "tempoPrep": "30 min",
  "tempoCottura": "2 ore",
  "abbattimento": "60 min",
  "ingredienti": ["Ingrediente 1: quantità", "Ingrediente 2: quantità"],
  "procedimento": ["Passaggio 1", "Passaggio 2"],
  "haccpNote": "Istruzioni conservazione e allergeni"
}`;

    if (url) {
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
      return res.status(response.status).json({ error: data.error?.message || 'Errore nella chiamata a Gemini API' });
    }

    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return res.status(500).json({ error: 'Nessun testo generato dall\'IA.' });
    }

    const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const recipeData = JSON.parse(cleanJson);

    return res.status(200).json(recipeData);

  } catch (error) {
    console.error("Errore API backend:", error);
    return res.status(500).json({ error: "Errore interno server: " + error.message });
  }
};
