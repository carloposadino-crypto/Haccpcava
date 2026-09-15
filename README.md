# HACCP La Cava — guida rapida dopo il rifacimento

## Cosa è cambiato
Il progetto aveva diversi tentativi mescolati insieme (più "cabine di
comando" scollegate, una struttura dati "fatta in casa" diversa da
quella approvata, e un file mancante che impediva il login). È stato
tutto ricostruito su un'unica base, quella corretta e approvata
(vedi `SCHEMA.md` e `firestore.rules`).

Ogni sezione ora scrive sulle collezioni giuste e registra sempre chi
ha fatto cosa (obbligatorio per l'HACCP). Le registrazioni operative
(temperature, cotture, pulizie, ricevimenti) non si possono cancellare
una volta salvate — solo le non conformità si possono chiudere.

## I 3 passaggi che devi fare tu prima di usarla

### 1. Inserisci le credenziali Firebase
Apri `js/config.js` e sostituisci i valori segnaposto con quelli veri
del tuo progetto Firebase:
- Vai su console.firebase.google.com → il tuo progetto → icona ⚙️ →
  "Impostazioni progetto" → sezione "Le tue app"
- Se non c'è un'app web, clicca "Aggiungi app" → icona `</>`
- Copia i valori (apiKey, appId, ecc.) dentro `js/config.js`

### 2. Attiva il login (Firebase Authentication)
- Nella console Firebase → "Authentication" → "Sign-in method" →
  attiva "Email/Password"
- Poi in "Users" crea il primo utente (es. la tua email + una password)
- Copia l'UID di quell'utente (lo vedi nella lista utenti)
- Vai su "Firestore Database" → crea manualmente un documento nella
  collezione `profili` con **ID documento = quell'UID**, e questi campi:
  - `nome`: il tuo nome
  - `ruolo`: `responsabile`
  - `attivo`: `true`

Senza questo passaggio l'app ti fa accedere ma si blocca subito dopo,
perché non trova il profilo collegato.

### 3. Inserisci i dati di base (una volta sola)
Sempre da Firestore Database, crea a mano:
- Collezione `apparecchiature`: un documento per ogni frigo/freezer
  (campi: `nome`, `tipo`, `temperatura_target`, `limite_minimo`,
  `limite_massimo`, `attivo: true`, `ordine: 1,2,3...`)
- Collezione `piano_pulizie`: un documento per ogni voce di pulizia
  (campi: `nome`, `frequenza: giornaliera/settimanale/mensile`,
  `attivo: true`, `ordine`)

Senza questi due, le sezioni Temperature e Pulizie restano vuote (te
lo dice anche l'app se ci entri prima di averli inseriti).

## Come pubblicarla
Il progetto è pronto per Vercel (c'è già `vercel.json`): basta
collegare la cartella al tuo account Vercel, oppure caricarla su
GitHub e collegare il repo da Vercel. Non serve nessun comando di
build: sono solo file HTML/JS/CSS.

## Novità: foto per le ricette e per le bolle di consegna
- In **Schede HACCP** ora c'è un riquadro per importare una bozza da
  una foto/screenshot o da un link — l'IA riempie i campi, tu controlli
  e correggi prima di salvare.
- In **Ricevimento merci** c'è un pulsante "Fotografa la bolla": legge
  fornitore e prodotti dalla foto e li mette in un elenco che puoi
  correggere, aggiungere o togliere righe prima di registrare.

### 4. Attiva la chiave IA (Gemini) su Vercel
Queste due funzioni foto/link usano l'IA di Google (Gemini) tramite
due piccoli file già pronti (`api/ocr.js` e `api/parse-recipe.js`).
Senza una chiave configurata, l'app te lo segnala con un messaggio
chiaro invece di sbagliare in silenzio. Per attivarla:
1. Vai su aistudio.google.com/apikey e crea una chiave gratuita (o usa
   quella che hai già)
2. Su Vercel → il tuo progetto → "Settings" → "Environment Variables"
3. Aggiungi una variabile: nome `GEMINI_API_KEY`, valore la chiave
   copiata, poi salva e rifai il deploy del progetto (Vercel te lo
   chiede automaticamente, o basta un "Redeploy" dal pannello)

## Novità: food cost delle preparazioni
- Nuova sezione **Listino prezzi** (dentro "Altro"): un prezzo al kg
  per ogni ingrediente, inserito e aggiornato a mano quando arriva un
  nuovo listino dal fornitore.
- Nelle **Schede HACCP**, gli ingredienti si scrivono ora come righe
  "nome + grammi" (mai altre unità): l'app calcola da sola il costo
  della preparazione e il costo a porzione, leggendo i prezzi dal
  Listino. Se un ingrediente non è ancora nel listino, te lo segnala e
  il costo resta parziale finché non lo aggiungi.
- L'importazione automatica (foto/link) continua a funzionare: riempie
  gli ingredienti, tu controlli i grammi e il calcolo si aggiorna da solo.

## Cosa NON c'è ancora (di proposito, per non complicare)
- Leggere i prezzi direttamente da una foto della bolla/listino e
  aggiornare da sola il Listino prezzi: per ora resta volutamente a
  mano, per non rischiare che un prezzo letto male sballi il food
  cost senza che nessuno se ne accorga
- Lo storico completo (per ora mostra temperature e non conformità;
  si estende facilmente allo stesso modo per le altre sezioni)
