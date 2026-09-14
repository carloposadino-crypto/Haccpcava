import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { url, image } = req.body;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Chiave API Gemini non configurata su Vercel.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let prompt = `Estrai la ricetta restituendo ESCLUSIVAMENTE un JSON valido senza formattazione Markdown con questa struttura:
{
  "titolo": "Nome Ricetta",
  "categoria": "Primi/Secondi/ecc",
  "porzioni": 10,
  "tempoPrep": "30 min",
  "tempoCottura": "2 ore",
  "abbattimento": "60 min",
  "ingredienti": ["Ingrediente 1: quantità", "Ingrediente 2: quantità"],
  "procedimento": ["Passaggio 1", "Passaggio 2"],
  "haccpNote": "Istruzioni conservazione e allergeni"
}`;

    if (url) {
      prompt += `\n\nAnalizza questa ricetta dal link: ${url}`;
    }

    const result = await model.generateContent(prompt);
    const responseText = await result.response.text();
    
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const recipeData = JSON.parse(cleanJson);

    return res.status(200).json(recipeData);
  } catch (error) {
    console.error("Errore API Gemini:", error);
    return res.status(500).json({ error: "Errore durante l'elaborazione della ricetta con IA: " + error.message });
  }
}
