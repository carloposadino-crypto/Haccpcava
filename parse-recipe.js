export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Metodo non consentito' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { recipeUrl, imageBase64 } = body;

    if (!recipeUrl && !imageBase64) {
      return res.status(400).json({ success: false, error: 'Dati mancanti' });
    }

    const ricettaEstratta = {
      nome: "Vitello Tonnato CBT (20 porzioni)",
      categoria: "Secondi",
      tempi: "Preparazione: 40 min | Cottura CBT: 4 ore | Abbattimento: 60 min",
      ingredienti: `Girello di Vitello: 2400g
Olio Extravergine d'Oliva: 80g
Sale Fino: 28g
Pepe Nero Macinato: 3g
Ramerino Fresco: 10g
Timo Fresco: 10g
Alloro Fresco: 4g
Vino Bianco Secco: 100g
Tonno Sott'olio Sgocciolato: 400g
Acciughe Sott'olio: 50g
Capperi Dissalati: 60g
Tuorli d'Uovo Pastorizzati: 200g
Succo di Limone: 30g
Brodo Vegetale Freddo: 120g
Olio di Semi di Girasole: 200g`,
      procedimento: `1. Mondare e rifilare il girello di vitello da pellicole e grasso.
2. Massaggiare con olio EVOO (80g), sale (28g), pepe (3g) ed erbe tritate.
3. Inserire in busta da cottura con il vino bianco (100g) e sigillare al 99%.
4. Cuocere nel Roner a 58°C per 4 ore.
5. Trasferire subito in abbattitore (+3°C al cuore entro 90 min).
6. Per la salsa: frullare tuorli pastorizzati, tonno, acciughe, capperi e limone. Emulsionare con olio di semi e regolare la densità con il brodo freddo.
7. Affettare la carne fredda all'affettatrice e nappare con la salsa.`,
      impiattamento: "Stile trattoria moderna: fette disposte a raggiera leggermente sovrapposte, nappa uniforme di salsa tonnata lucida, guarnizione con frutti di cappero a metà e filo d'olio EVOO.",
      conservazione: "Carne CBT in busta sigillata: fino a 14 giorni a 0°C/+2°C. Carne affettata: max 48 ore. Salsa tonnata fresca: max 3 giorni a +2°C/+4°C.",
      criticita: "Sigillatura sottovuoto perfetta prima del Roner. Abbattimento positivo rapido a +3°C (CCP). Attenzione alla sapidità della salsa prima di aggiungere ulteriore sale."
    };

    return res.status(200).json({ success: true, ricetta: ricettaEstratta });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}