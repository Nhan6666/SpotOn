export interface BookingRules {
  deposit_percent: number;
  min_advance_hours: number;
  max_advance_days: number;
  max_party_size: number;
  service_periods: {
    lunch: { start: string; end: string; last_booking: string; last_order: string; };
    dinner: { start: string; end: string; last_booking: string; last_order: string; };
  };
  no_show_minutes: number;
}
