export interface Product {
  id: string; // UNIQUEID
  nome_prodotto: string;
  codice_ean_qr: string;
  data_scadenza: string | null; // YYYY-MM-DD
  scansionato_il: string; // ISO DateTime
}

export interface CalendarEvent {
  id_evento: string; // UNIQUEID
  prodotto_ref: string; // Foreign Key to Product.id
  nome_prodotto: string; // Denormalized for easier access
  data_scadenza: string; // YYYY-MM-DD
  note: string;
}

export type ViewState = 'dashboard' | 'scan' | 'list' | 'calendar';

export interface ScanResult {
  nome_prodotto: string;
  codice_ean_qr: string;
  data_scadenza: string | null;
}
