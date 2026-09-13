import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Imposta sempre l'header per risposte JSON
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Metodo non consentito' });
  }

  try {
    const { imageBase64, recipeUrl } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'GEMINI_API_KEY mancante nelle variabili d ambiente su Vercel' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const promptText = `Analizza il contenuto della ricetta ed estrai i dati strutturandoli in JSON rigido secondo queste regole professionali di cucina:
1. Adatta tutte le dosi degli ingredienti esattamente per 20 PORZIONI, dosando spezie/sale con senso professionale (senza moltiplicazioni lineari eccessive).
2. Converti OGNI singola unità di misura esclusivamente in GRAMMI (g).
3. Gli ingredienti devono essere formattati come elenco verticale con sintassi: "Nome Ingrediente: PesoInGrammig" (esempio: "Farina 00: 500g").
4. Restituisci SOLO un oggetto JSON valido senza blocchi markdown o testo aggiuntivo con la seguente struttura esatta:
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

    let contents = [];

    if (imageBase64) {
      contents = [
        promptText,
        {
          inlineData: {
            data: imageBase64,
            mimeType: "image/jpeg"
          }
        }
      ];
    } else if (recipeUrl) {
      // Headers per simulare un browser ed evitare blocchi 403
      const webRes = await fetch(recipeUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (!webRes.ok) {
        return res.status(400).json({ success: false, error: `Impossibile accedere alla pagina web (Errore HTTP: ${webRes.status})` });
      }

      const htmlText = await webRes.text();
      
      // Pulizia HTML
      const cleanText = htmlText
        .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
        .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .slice(0, 10000);

      contents = [`${promptText}\n\nTesto della pagina web:\n${cleanText}`];
    } else {
      return res.status(400).json({ success: false, error: 'Nessun dato inviato (fornire imageBase64 o recipeUrl)' });
    }

    const result = await model.generateContent(contents);
    const responseText = result.response.text().replace(/```json|```/g, '').trim();
    
    let recipeData;
    try {
      recipeData = JSON.parse(responseText);
    } catch (parseErr) {
      return res.status(500).json({ success: false, error: 'L IA non ha restituito un JSON valido. Risposta: ' + responseText });
    }

    return res.status(200).json({ success: true, ricetta: recipeData });

  } catch (error) {
    console.error("Errore server API parse-recipe:", error);
    return res.status(500).json({ success: false, error: error.message || 'Errore interno durante l elaborazione' });
  }
}