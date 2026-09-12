import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  try {
    const { imageBase64 } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY mancante nelle variabili d ambiente' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analizza questa immagine di una ricetta ed estrai i dati strutturandoli in JSON rigido secondo queste regole professionali di cucina:
1. Adatta tutte le dosi degli ingredienti esattamente per 20 PORZIONI, dosando spezie/sale con senso professionale (senza moltiplicazioni lineari eccessive).
2. Converti OGNI singola unità di misura esclusivamente in GRAMMI (g).
3. Gli ingredienti devono essere formattati come elenco verticale con sintassi: "Nome Ingrediente: PesoInGrammig" (esempio: "Farina 00: 500g").
4. Restituisci SOLO un oggetto JSON valido senza blocchi markdown con la seguente struttura esatta:
{
  "nome": "Nome Ricetta (20 porzioni)",
  "categoria": "Antipasti" | "Primi" | "Secondi" | "Dolci" | "Preparazioni Base / Semilavorati",
  "tempi": "Prep: XX min | Cottura: XX min",
  "ingredienti": "Ingrediente 1: Xg\\nIngrediente 2: Yg",
  "procedimento": "1. Passaggio uno...\\n2. Passaggio due...",
  "impiattamento": "Descrizione stile trattoria moderna",
  "conservazione": "Norme di conservazione e tempistiche HACCP",
  "criticita": "Punti critici di controllo CCP e suggerimenti tecnici"
}`;

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: "image/jpeg"
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text().replace(/```json|```/g, '').trim();
    const recipeData = JSON.parse(responseText);

    return res.status(200).json({ success: true, ricetta: recipeData });
  } catch (error) {
    console.error("Errore API parse-recipe:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}