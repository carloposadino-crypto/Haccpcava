// Legge una foto di un documento di trasporto (DDT/bolla) e restituisce
// fornitore, numero documento, data e l'elenco completo dei prodotti riconosciuti,
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

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        error: 'Chiave GEMINI_API_KEY non configurata su Vercel: la lettura automatica della bolla non è attiva.',
      });
    }

    const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/i);
    const mimeType = mimeMatch?.[1] || 'image/jpeg';

    const prompt = `Analizza questa bolla di accompagnamento / DDT / documento di consegna per un ristorante.

OBIETTIVO PRINCIPALE: TRASCRIVERE LE RIGHE DEI PRODOTTI IN MODO COMPLETO E FEDELE AL DOCUMENTO.

Per ogni riga prodotto:
- trascrivi il nome e la descrizione COMPLETI così come compaiono nel documento;
- NON abbreviare mai il nome;
- NON sostituire una descrizione con un nome generico o con una tua interpretazione;
- mantieni marca, specie, taglio, formato, pezzatura, qualità, origine, codice articolo o altre informazioni descrittive quando sono presenti nella riga;
- se il documento usa abbreviazioni, prova a leggerle e trascriverle esattamente, ma NON inventare l'espansione dell'abbreviazione;
- conserva quantità e unità di misura esattamente come riportate;\n- leggi anche il PREZZO UNITARIO della riga, se presente nel documento;\n- leggi il TOTALE RIGA della merce, se presente;\n- non confondere prezzo unitario, totale riga, quantità, codice articolo, sconto o numero di documento;\n- se il prezzo non è chiaramente leggibile o non è presente, restituisci null; NON inventare o stimare il prezzo;
- conserva il numero di lotto esattamente come riportato;
- includi TUTTE le righe prodotto leggibili, anche se la descrizione è ripetitiva;
- non unire prodotti diversi;
- non eliminare una riga perché sembra poco importante;
- se una parte della descrizione è illeggibile, mantieni la parte leggibile e usa null solo per il campo che non può essere letto;
- NON inventare dati mancanti.

Leggi con attenzione anche testo piccolo e le colonne della tabella. Prima di restituire il risultato controlla di non aver abbreviato o semplificato i nomi dei prodotti.

Restituisci ESCLUSIVAMENTE un oggetto JSON valido, senza markdown e senza commenti, con questo formato:
{
  "fornitore": "Nome completo del fornitore",
  "numeroDocumento": "Numero DDT/Bolla",
  "dataDocumento": "YYYY-MM-DD",
  "prodotti": [
    {
      "nome": "Descrizione COMPLETA della riga così come appare sul documento",
      "quantita": "Quantità e unità esattamente come riportate",
      "lotto": "Numero lotto esattamente come riportato oppure null",\n      "scadenza": "Scadenza/TMC se presente oppure null",\n      "prezzo_unitario": null,\n      "unita_prezzo": "kg/pezzo/confezione/altro oppure null",\n      "totale_riga": null
    }
  ]
}`;

    const modelli = ['gemini-flash-latest', 'gemini-3.5-flash-lite'];
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

          if (response.status !== 503 && response.status !== 429) break;

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
    const cleanedJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

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
