# Schema dati — Firestore

Sostituisce lo schema SQL della versione Supabase. Stessa sostanza (stessi
nomi di campo dove possibile), diversa forma: collezioni di documenti
invece di tabelle relazionali. Le relazioni "1 a molti" (es. un prodotto ha
più allergeni) sono incorporate come array dentro al documento invece che
tabelle di giunzione separate — è il modo idiomatico di fare in Firestore
quando i dati collegati "appartengono" a un solo documento padre.

## Collezioni

### `profili` (id documento = uid di Firebase Auth)
`nome`, `ruolo` ('responsabile' | 'operatore'), `attivo`

### `apparecchiature`
`nome`, `tipo` ('frigorifero' | 'freezer'), `descrizione`, `posizione`,
`temperatura_target`, `limite_minimo`, `limite_massimo`,
`frequenza_controllo`, `attivo`, `ordine`

### `rilevazioni_temperatura`
`apparecchiatura_id`, `valore`, `esito` ('nella_norma' | 'fuori_limite'),
`registrato_da`, `registrato_il` (Timestamp)

### `procedure_approvate`
`tipo` ('cbt' | 'abbattimento' | 'rigenerazione' | 'altro'), `nome`,
`parametri` (mappa: `temperatura_min_c`, `temperatura_max_c`,
`tempo_min_min`, `tempo_max_min` — tutti facoltativi), `stato`
('bozza' | 'da_revisionare' | 'approvata'), `approvato_da`

### `registrazioni_processo`
`procedura_id` (nullable), `tipo`, `prodotto`, `valori` (mappa libera,
tipicamente `temperatura_c` / `tempo_min`), `esito` ('ok' | 'fuori_limite' | null),
`registrato_da`, `registrato_il`

### `piano_pulizie`
`nome`, `frequenza` ('giornaliera' | 'settimanale' | 'mensile'), `attivo`, `ordine`

### `registrazioni_pulizia`
`voce_id`, `registrato_da`, `registrato_il`

### `fornitori`
`nome`, `note`

### `prodotti`
`denominazione`, `ingredienti`, `conservazione`, `stato_verifica`
('non_verificato' | 'verificato'), `fonte` ('manuale' | 'ocr_etichetta' | 'barcode'),
`barcode`, **`allergeni`** (array di mappe `{ allergene, tipo_presenza }` —
`tipo_presenza` ∈ 'ingrediente' | 'derivato' | 'traccia' | 'contaminazione_crociata'),
`creato_il`

### `ricevimenti`
`fornitore_id` (nullable), `fornitore_nome`, `prodotto_id` (nullable),
`prodotto_nome`, `data`, `lotto`, `scadenza`, `temperatura`, `conformita`,
`note`, `registrato_da`, `registrato_il`

### `schede_haccp`
`nome`, `codice`, `versione`, `stato` ('bozza' | 'da_revisionare' | 'approvata'),
**`contenuto`** (mappa annidata: `ingredienti`, `processo`, `pericoli`,
`misure_controllo`, `ccp`, `parametri`, `note`), `scheda_precedente_id`,
`motivo_modifica`, `autore_id`, `approvato_da`, `creato_il`

### `non_conformita`
`categoria`, `problema`, `origine_tabella`, `origine_id`, `azione`, `esito`,
`verifica`, `stato` ('aperta' | 'chiusa'), `aperto_da`, `aperto_il`, `chiuso_il`

### `documenti`
`categoria`, `storage_path`, `fonte`, `descrizione`, `versione`,
`caricato_da`, `caricato_il`

### `audit_log`
`utente_id`, `collezione`, `documento_id`, `valore_prima`, `valore_dopo`,
`motivo`, `registrato_il`

## Indici compositi da creare

Firestore richiede un indice composito per ogni query che filtra su un
campo e ne ordina un altro (o filtra su più campi). Al primo utilizzo
dell'app, se manca un indice, la console del browser mostra un errore con
un link diretto per crearlo in un clic — è normale la prima volta, non un
bug. Quelli sicuramente necessari, in base alle query già scritte nel
codice:

- `apparecchiature`: `attivo` (==) + `ordine` (asc)
- `rilevazioni_temperatura`: `registrato_il` (range) + `registrato_il` (orderBy) — di norma auto-generato
- `registrazioni_processo`: `tipo` (==) + `registrato_il` (range/orderBy)
- `piano_pulizie`: `attivo` (==) + `ordine` (asc)
- `procedure_approvate`: `tipo` (==) + `stato` (==)
- `non_conformita`: `aperto_il` (range) + `aperto_il` (orderBy)

Basta usare l'app una volta per ogni schermata dopo il primo deploy: se
manca un indice, il link nell'errore lo crea da solo.
