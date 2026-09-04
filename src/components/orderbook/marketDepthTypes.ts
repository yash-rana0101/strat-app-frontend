export interface MarketDepthStatsData {
  open?: number | null;
  high?: number | null;
  low?: number | null;
  close?: number | null; // prev close
  last_price?: number | null;
  volume?: number | null;
  average_price?: number | null;
  lower_circuit_limit?: number | null;
  upper_circuit_limit?: number | null;
  ref_price?: number | null;
  indicative_close?: number | null;
  total_imbalance?: number | null;
  last_quantity?: number | null;
  last_trade_time?: string | null;
}

