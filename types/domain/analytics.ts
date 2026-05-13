export type PortfolioStats = {
  total_value: number;
  avg_yield: number;
  occupancy_rate: number;
  total_properties: number;
  total_arrears?: number;
  total_revenue?: number;
  total_expenses?: number;
  net_operating_income?: number;
};

export type PortfolioSnapshot = {
  id: string;
  tenant_id?: string;
  snapshot_date: string;
  total_value: number;
  avg_yield: number;
  occupancy_rate: number;
  total_arrears: number;
  net_operating_income: number;
};
