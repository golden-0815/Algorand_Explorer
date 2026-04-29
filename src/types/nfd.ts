export interface NFDResponse {
  [key: string]: NFDAccount;
}

export interface NFDAccount {
  name: string;
  owner: string;
  depositAccount: string;
  caAlgo: string[];
  nfdAccount: string;
  saleType: string;
  state: string;
  tags: Record<string, string>;
  timeChanged: number;
  timeCreated: number;
  timePurchased: number;
  unverifiedCaAlgo: string[];
}