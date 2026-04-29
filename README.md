# Algorand Explorer

A comprehensive Algorand portfolio explorer built with React, TypeScript, and Tailwind CSS. View ASA tokens, NFT collections, and DeFi positions across 17+ protocols.

## Features

- **Smart Search**: Search by wallet address or .algo NFD names
- **DeFi Analytics**: Track staking, lending, liquidity, and governance positions
- **Portfolio Insights**: Comprehensive view of ASA tokens and NFT collections
- **Real-time Data**: Powered by ASA Stats API with authentication
- **Asset Caching**: Supabase-backed cache for fast asset lookups and image URLs
- **Sticky Header**: Persistent search bar
- **Responsive Design**: Optimized for desktop and mobile viewing
- **Advanced NFT Gallery**: Optimized image loading with IPFS gateway fallbacks
- **Price Change Tracking**: 1-day price change percentages for all assets using Vestige API data
- **Smart Asset Filtering**: Automatically hides assets with values less than 1 ALGO with "Show All" toggle

## NFT Gallery Features

The NFT gallery includes advanced image loading optimizations:

- **Universal Gateway Conversion**: Automatically converts unreliable IPFS gateways (4everland.io, etc.) to working gateways
- **Comprehensive Image Discovery**: Finds images across multiple URL types and metadata fields
- **Performance Optimizations**: Image preloading, batch caching, and optimized thumbnail generation
- **Robust Fallback System**: Multiple IPFS gateway fallbacks with error handling
- **Gallery & Modal Consistency**: Unified image loading logic between gallery previews and detail modals

### Image Loading Improvements

- **Gateway Conversion**: Converts 4everland.io, ipfs.io, gateway.pinata.cloud, and other gateways to ipfs-pera.algonode.dev
- **Optimized Thumbnails**: Uses `?optimizer=image&width=1152&quality=70` for faster loading
- **CORS Handling**: Proper cross-origin image loading with fallback logic
- **Performance Monitoring**: Real-time tracking of cache requests, preloaded images, and failed loads
- **Non-Image Filtering**: Automatically excludes JSON files and other non-image content

## API Configuration

### ASA Stats API Integration

The app uses the ASA Stats API v2 with the following configuration:

- **Development**: Direct API calls with Bearer token via `VITE_ASA_STATS_TOKEN`
- **Production**: Supabase Edge Functions proxy with internal token management
- **Base URL**: `https://www.asastats.com/api/v2/`
- **Endpoint**: `/{address}/` (no query parameters)
- **Proxy**: Vite dev server proxies `/api/asastats/*` to ASA Stats API

**Important**: The API endpoint was updated to match the exact Swagger test configuration:
- **Current**: `/api/v2/{address}/` (no query parameters)

This ensures the app receives the same data as direct API calls.

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_ASA_STATS_TOKEN=your_access_token_here
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Icons**: Lucide React
- **Charts**: Recharts
- **API**: ASA Stats v2, NFD API, Vestige API
- **Database**: Supabase (PostgreSQL)
- **Caching**: Asset cache with image URLs

## Asset Caching

The app includes a Supabase-backed asset caching system that:

- **Automatically caches** assets when users search wallets
- **Stores image URLs** from Tinyman and Vestige APIs
- **Provides fast lookups** for asset metadata
- **Reduces API calls** and improves performance
- **Includes management tools** in the debug page
- **Tracks request count** for monitoring cache usage

See `docs/SUPABASE_CACHE_SETUP.md` for detailed setup instructions.

## UI/UX Design

- **Sticky Header**: 56px height with search bar
- **Main Page**: Non-scrollable, fits within viewport minus header
- **Dark Theme**: Algorand-inspired color scheme with accent colors
- **Responsive Layout**: Adapts to different screen sizes
- **Loading States**: Smooth transitions and loading indicators