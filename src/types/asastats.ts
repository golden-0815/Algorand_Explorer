export interface EvaluatedAccount {
  account_info: AccountInfo;
  system_info: SystemInfo;
  total: PortfolioTotal;
  asaitems: ASAItem[];
  nftcollections: NFTCollection[];
  notevals: NotevalItem[];
}

export interface AccountInfo {
  addresses: string[];
  bundle: string | null;
  values_in: "ALGO" | "USD";
  online: boolean | null;
}

export interface SystemInfo {
  warning?: string;
  information?: string;
}

export interface PortfolioTotal {
  algo: string;
  asa: string;
  nft: string;
  total: string;
  totalusdc: string;
  priceusdc: string;
  pricealgo: string;
  noteval: number;
  totalwonft: string;
  totalwonftusdc: string;
  // Additional fields that might be present
  balance?: string;
  staked?: string;
  liquidity?: string;
  defi?: string;
  nft_estimated?: string;
  nft_floor?: string;
}

export interface ASAItem {
  value: string;
  asset: Asset;
  amount: number;
  price: string;
  programs: Program[];
}

export interface Asset {
  id: number;
  name: string;
  unit: string;
  total: number;
  decimals: number;
  url: string;
  links: AssetLink[];
}

export interface AssetLink {
  provider: Provider;
  link: string;
  title: string;
}

export interface Provider {
  name: string;
  info?: string;
}

export interface Program {
  program: ProgramInfo;
  value: string;
  amount: number;
  proxy?: string[];
  distribution?: Distribution[];
  linked?: LinkedItem[];
}

export interface ProgramInfo {
  type: ProgramType;
  name?: string;
  provider?: Provider;
  url?: string;
  code?: string;
}

export type ProgramType = 
  | 'Added'
  | 'Amount'
  | 'Balance'
  | 'Borrowed'
  | 'Claimable'
  | 'Collateral'
  | 'Committed'
  | 'Debt'
  | 'Delegated'
  | 'Deposited'
  | 'Locked'
  | 'Liquidity'
  | 'Pre-minted'
  | 'Size'
  | 'Staked'
  | 'Supplied'
  | 'Value'
  | 'Vault'
  | 'Withdrawal';

export interface Distribution {
  value: string;
  amount: number;
  link?: LinkInfo;
}

export interface LinkInfo {
  provider: Provider;
  text: string;
  url: string;
}

export interface LinkedItem {
  provider: Provider;
  text: string;
  link: string;
  value: string;
  amount: number;
  balance: number;
  info: string;
  id: number;
}

export interface NFTCollection {
  value: string;
  name: string;
  amount: number;
  nfts: NFT[];
}

export interface NFT {
  value: string;
  nft: NFTInfo;
  listings: Listing[];
  floor: FloorPrice[];
  last_purchase?: Purchase;
  max_purchase?: Purchase;
  title?: string;
  description?: string;
  rarity?: string;
  traits: Trait[];
  notevals?: NotevalItem[];
}

export interface NFTInfo {
  id: number;
  name: string;
  unit: string;
  total: number;
  decimals: number;
  creator: string;
  image?: string;
  thumbnail?: string;
  urls: NFTUrl[];
}

export interface NFTUrl {
  typ: string;
  url: string;
}

export interface Listing {
  price: string;
  market: Market;
  currency: Currency;
}

export interface FloorPrice {
  price: string;
  market: Market;
  currency: Currency;
}

export interface Purchase {
  price: string;
  market: Market;
  epoch: number;
  currency: Currency;
}

export interface Market {
  name: string;
  info: string;
  link: string;
}

export interface Currency {
  amount: number;
  asset: Asset;
  links: AssetLink[];
}

export interface Trait {
  name: string;
  value: string;
  amount: number;
  price: string;
}

export interface NotevalItem {
  asset: Asset;
  amount: number;
  programs: Program[];
}

// Legacy type for backward compatibility
export interface ASAStatsResponse extends EvaluatedAccount {}