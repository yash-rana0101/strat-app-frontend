import type { ChartTimeframe } from '../../../store/useTradeStore';

export interface TimeframeOption {
  value: ChartTimeframe;
  label: string;
}

export interface TimeframeGroup {
  category: 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';
  options: TimeframeOption[];
}

export const TIMEFRAME_GROUPS: TimeframeGroup[] = [
  {
    category: 'MINUTES',
    options: [
      { value: '1m', label: '1 minute' },
      { value: '2m', label: '2 minutes' },
      { value: '3m', label: '3 minutes' },
      { value: '4m', label: '4 minutes' },
      { value: '5m', label: '5 minutes' },
      { value: '10m', label: '10 minutes' },
      { value: '15m', label: '15 minutes' },
      { value: '30m', label: '30 minutes' },
      { value: '75m', label: '75 minutes' },
      { value: '125m', label: '125 minutes' },
    ],
  },
  {
    category: 'HOURS',
    options: [
      { value: '1h', label: '1 hour' },
      { value: '2h', label: '2 hours' },
      { value: '3h', label: '3 hours' },
      { value: '4h', label: '4 hours' },
    ],
  },
  {
    category: 'DAYS',
    options: [{ value: '1D', label: '1 day' }],
  },
  {
    category: 'WEEKS',
    options: [{ value: '1W', label: '1 week' }],
  },
  {
    category: 'MONTHS',
    options: [{ value: '1M', label: '1 month' }],
  },
];

