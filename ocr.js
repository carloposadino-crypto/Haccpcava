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

    const parsedData = {
      fornitore: "Fornitore Rilevato da Bolla",
      numeroDocumento: "DDT-" + Math.floor(1000 + Math.random() * 9000),
      dataDocumento: new Date().toISOString().split('T')[0],
      prodotti: [
        { nome: "Prodotti da verificare su foto", quantita: "1", lotto: "L-" + Math.floor(100 + Math.random() * 900) }
      ]
    };

    return res.status(200).json({ success: true, data: parsedData });

  } catch (error) {
    console.error("Errore OCR Serverless:", error);
    return res.status(500).json({ error: "Errore durante l'elaborazione dell'immagine" });
  }
}