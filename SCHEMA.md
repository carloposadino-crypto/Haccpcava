# Schema dati — Firestore

Sostituisce lo schema SQL della versione Supabase. Stessa sostanza (stessi
nomi di campo dove possibile), diversa forma: collezioni di documenti
invece di tabelle relazionali.

## Collezioni

### `profili` (id documento = uid di Firebase Auth)
`nome`, `ruolo` ('responsabile' | 'operatore'), `attivo`

### `apparecchiature`
`nome`, `tipo`, `descrizione`, `posizione`,
`temperatura_target`, `limite_minimo`, `limite_massimo`,
`frequenza_controllo`, `attivo`, `ordine`

### `rilevazioni_temperatura`
`apparecchiatura_id`, `valore`, `esito`, `registrato_da`, `registrato_il`

### `procedure_approvate`
`tipo`, `nome`, `parametri`, `stato`, `approvato_da`

### `registrazioni_processo`
`procedura_id`, `tipo`, `prodotto`, `valori`, `esito`,
`registrato_da`, `registrato_il`

### `piano_pulizie`
`nome`, `frequenza`, `attivo`, `ordine`

### `registrazioni_pulizia`
`voce_id`, `registrato_da`, `registrato_il`

### `fornitori`
`nome`, `note`

### `prodotti`
`denominazione`, `ingredienti`, `conservazione`, `stato_verifica`,
`fonte`, `barcode`, `allergeni`, `creato_il`

### `ricevimenti`
`fornitore_id`, `fornitore_nome`, `prodotto_id`, `prodotto_nome`,
`data`, `lotto`, `scadenza`, `temperatura`, `conformita`, `note`,
`registrato_da`, `registrato_il`

### `conservazioni`
`processo_id`, `processo_tipo`, `processo_data`, `prodotto`, `lotto`,
`ricevimento_collegato`, `tipo_conservazione`, `tipo_conservazione_label`,
`apparecchiatura_id`, `apparecchiatura_nome`, `quantita`, `contenitore`,
`data_produzione`, `scadenza`, `note`, `data_riferimento`,
`registrato_da`, `registrato_il`

### `servizi`
`conservazione_id`, `processo_id`, `prodotto`, `lotto`,
`ricevimento_collegato`, `tipo_conservazione`, `apparecchiatura_nome`,
`piatto`, `quantita`, `coperti`, `note`, `data_riferimento`,
`registrato_da`, `registrato_il`

### `schede_haccp`
`nome`, `codice`, `versione`, `stato`, `contenuto`,
`scheda_precedente_id`, `motivo_modifica`, `autore_id`, `approvato_da`,
`creato_il`

### `non_conformita`
`categoria`, `problema`, `origine_tabella`, `origine_id`, `azione`,
`esito`, `verifica`, `stato`, `aperto_da`, `aperto_il`, `chiuso_il`

### `documenti`
`categoria`, `storage_path`, `fonte`, `descrizione`, `versione`,
`caricato_da`, `caricato_il`

### `audit_log`
`utente_id`, `collezione`, `documento_id`, `valore_prima`, `valore_dopo`,
`motivo`, `registrato_il`

## Indici compositi
Le query semplici della sezione Servizio non richiedono nuovi indici
compositi: i record vengono letti e filtrati lato applicazione.
