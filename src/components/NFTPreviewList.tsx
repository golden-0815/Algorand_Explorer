import React, { useState, useRef, useEffect } from 'react';
import { Image, ExternalLink, ChevronLeft, ChevronRight, Search, List as ListIcon, LayoutGrid, ChevronUp, ChevronDown } from 'lucide-react';
import { NFTCollection } from '../types/asastats';
import { NFTDetailsModal } from './NFTDetailsModal';
import { getOptimizedImageUrl, isVideoUrl, is3DModelUrl, convertToOptimizedGateway } from '../lib/utils/imageOptimization';

interface NFTPreviewListProps {
  nftcollections: NFTCollection[];
}

function CardImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const [optimizedUrl, setOptimizedUrl] = useState<{ webp: string; fallback: string } | null>(null);

  useEffect(() => {
    setError(false);
    setLoaded(false);
    if (!src) return;
    
    // Get optimized URL
    const optimized = convertToOptimizedGateway(src);
    setOptimizedUrl(optimized);
    
    timeoutRef.current = window.setTimeout(() => {
      if (!loaded) setError(true);
    }, 5000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  if (!src || error) {
    return (
      <div className="w-full h-full flex items-center justify-center" role="img" aria-label="No image available">
        <Image className="w-8 h-8 text-algo-gray-light" aria-hidden="true" />
      </div>
    );
  }

  // Handle video files
  if (isVideoUrl(src)) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-500/30 rounded-lg flex items-center justify-center mb-2">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs text-blue-300">Video</p>
        </div>
      </div>
    );
  }

  // Handle 3D model files
  if (is3DModelUrl(src)) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-blue-500/20">
        <div className="text-center">
          <div className="w-12 h-12 bg-purple-500/30 rounded-lg flex items-center justify-center mb-2">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-xs text-purple-300">3D Model</p>
        </div>
      </div>
    );
  }

  // Use optimized image with WebP support
  if (optimizedUrl) {
    return (
      <picture className="w-full h-full">
        {/* WebP source for modern browsers */}
        <source
          srcSet={optimizedUrl.webp}
          type="image/webp"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
        {/* Fallback for older browsers */}
        <img
          src={optimizedUrl.fallback}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
          sizes="(max-width: 768px) 50vw, 33vw"
          onLoad={() => {
            setLoaded(true);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
          onError={() => {
            setError(true);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
        />
      </picture>
    );
  }

  // Fallback to original image
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      loading="lazy"
      onLoad={() => {
        setLoaded(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }}
      onError={() => {
        setError(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }}
    />
  );
}

export function NFTPreviewList({ nftcollections }: NFTPreviewListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'unit' | 'id' | 'collection' | 'creator' | 'value'>('value');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 12; // Show 12 NFTs per page (3x4 grid)

  const formatALGO = (num?: number) => {
    if (num === undefined || num === null) return 'N/A';
    if (num === 0) return '0 Ⱥ';
    if (num < 0) return `${num.toFixed(2)} Ⱥ`;
    if (num > 0 && num < 1) return `${num.toFixed(6)} Ⱥ`;
    if (num < 1000) return `${num.toFixed(2)} Ⱥ`;
    if (num < 1_000_000) return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Ⱥ`;
    return `${(num / 1_000_000).toFixed(2)}M Ⱥ`;
  };

  const allNfts = nftcollections.flatMap(collection => 
    collection.nfts.map(nft => ({
      ...nft,
      collectionName: collection.name
    }))
  );

  const filteredNfts = allNfts.filter(nft => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nftName = nft.nft?.name?.toLowerCase() || '';
    const collectionName = nft.collectionName?.toLowerCase() || '';
    const unit = nft.nft?.unit?.toLowerCase() || '';
    const creator = nft.nft?.creator?.toLowerCase() || '';
    const id = nft.nft?.id?.toString() || '';
    return nftName.includes(query) || 
           collectionName.includes(query) || 
           unit.includes(query) || 
           creator.includes(query) || 
           id.includes(query);
  });

  // Sort the filtered NFTs
  const sortedNfts = [...filteredNfts].sort((a, b) => {
    let aValue: string | number = '';
    let bValue: string | number = '';

    switch (sortBy) {
      case 'name':
        aValue = (a.nft?.name || '').toLowerCase();
        bValue = (b.nft?.name || '').toLowerCase();
        break;
      case 'unit':
        aValue = (a.nft?.unit || '').toLowerCase();
        bValue = (b.nft?.unit || '').toLowerCase();
        break;
      case 'id':
        aValue = parseInt(String(a.nft?.id || '0'));
        bValue = parseInt(String(b.nft?.id || '0'));
        break;
      case 'collection':
        aValue = (a.collectionName || '').toLowerCase();
        bValue = (b.collectionName || '').toLowerCase();
        break;
      case 'creator':
        aValue = (a.nft?.creator || '').toLowerCase();
        bValue = (b.nft?.creator || '').toLowerCase();
        break;
      case 'value':
        aValue = parseFloat(a.value || '0');
        bValue = parseFloat(b.value || '0');
        break;
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const totalPages = Math.ceil(sortedNfts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNfts = sortedNfts.slice(startIndex, endIndex);

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortedNfts.length]);

  const handleOpenModal = (nft: any) => {
    setSelectedNFT(nft);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNFT(null);
  };

  if (allNfts.length === 0) {
    return (
      <div className="p-8 text-center">
        <Image className="w-12 h-12 text-algo-gray-light mx-auto mb-4" />
        <p className="text-algo-gray-light tracking-tight">No NFTs found</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8" role="region" aria-label="NFT Collection">
      {/* Top Bar: Search left, Toggle right */}
      <div className="flex items-center justify-between gap-3 mb-4">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-algo-gray-light" aria-hidden="true" />
          <input
            type="text"
            id="nft-search"
            name="nft-search"
            placeholder="Search NFTs by name, collection, unit, creator, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-algo-dark/50 border border-algo-gray-light rounded-md 
                     text-algo-text placeholder-algo-gray-light focus:outline-none focus:border-algo-accent 
                     transition-colors duration-200 text-sm tracking-tight"
            aria-label="Search NFTs"
          />
        </div>
        {/* View Toggle */}
        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
          <button
            className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium border transition-colors duration-200 ${viewMode === 'list' ? 'bg-algo-accent/20 border-algo-accent text-algo-accent' : 'bg-algo-dark/50 border-algo-gray-light text-algo-text hover:bg-algo-dark/70'}`}
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <ListIcon className="w-3 h-3 sm:w-4 sm:h-4" /> 
            <span className="hidden sm:inline">List</span>
          </button>
          <button
            className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium border transition-colors duration-200 ${viewMode === 'gallery' ? 'bg-algo-accent/20 border-algo-accent text-algo-accent' : 'bg-algo-dark/50 border-algo-gray-light text-algo-text hover:bg-algo-dark/70'}`}
            onClick={() => setViewMode('gallery')}
            aria-label="Gallery view"
          >
            <LayoutGrid className="w-3 h-3 sm:w-4 sm:h-4" /> 
            <span className="hidden sm:inline">Gallery</span>
          </button>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="overflow-x-auto rounded-lg border border-algo-gray-light bg-algo-dark/50 mb-6">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-algo-gray-light">
                <th className="px-4 py-3 font-semibold text-algo-text">
                  <button
                    onClick={() => {
                      if (sortBy === 'name') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('name');
                        setSortDirection('asc');
                      }
                    }}
                    className="flex items-center gap-1 hover:text-algo-accent transition-colors"
                    aria-label={`Sort by name ${sortBy === 'name' ? (sortDirection === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}
                  >
                    Name
                    {sortBy === 'name' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold text-algo-text hidden md:table-cell">
                  <button
                    onClick={() => {
                      if (sortBy === 'unit') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('unit');
                        setSortDirection('asc');
                      }
                    }}
                    className="flex items-center gap-1 hover:text-algo-accent transition-colors"
                    aria-label={`Sort by unit ${sortBy === 'unit' ? (sortDirection === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}
                  >
                    Unit
                    {sortBy === 'unit' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold text-algo-text hidden md:table-cell">
                  <button
                    onClick={() => {
                      if (sortBy === 'id') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('id');
                        setSortDirection('asc');
                      }
                    }}
                    className="flex items-center gap-1 hover:text-algo-accent transition-colors"
                    aria-label={`Sort by ID ${sortBy === 'id' ? (sortDirection === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}
                  >
                    ID
                    {sortBy === 'id' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold text-algo-text">
                  <button
                    onClick={() => {
                      if (sortBy === 'collection') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('collection');
                        setSortDirection('asc');
                      }
                    }}
                    className="flex items-center gap-1 hover:text-algo-accent transition-colors"
                    aria-label={`Sort by collection ${sortBy === 'collection' ? (sortDirection === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}
                  >
                    Collection
                    {sortBy === 'collection' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold text-algo-text hidden md:table-cell">
                  <button
                    onClick={() => {
                      if (sortBy === 'creator') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('creator');
                        setSortDirection('asc');
                      }
                    }}
                    className="flex items-center gap-1 hover:text-algo-accent transition-colors"
                    aria-label={`Sort by creator ${sortBy === 'creator' ? (sortDirection === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}
                  >
                    Creator
                    {sortBy === 'creator' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold text-algo-text">
                  <button
                    onClick={() => {
                      if (sortBy === 'value') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('value');
                        setSortDirection('desc');
                      }
                    }}
                    className="flex items-center gap-1 hover:text-algo-accent transition-colors"
                    aria-label={`Sort by value ${sortBy === 'value' ? (sortDirection === 'asc' ? 'descending' : 'ascending') : 'descending'}`}
                  >
                    Value
                    {sortBy === 'value' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold text-algo-text">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentNfts.map((nft, idx) => (
                <tr key={nft.nft?.id || idx} className="border-b border-algo-gray-light hover:bg-algo-dark/70 transition-colors">
                  <td className="px-4 py-3 text-algo-text font-medium truncate max-w-xs">{nft.nft?.name || 'Unknown NFT'}</td>
                  <td className="px-4 py-3 text-algo-text font-mono hidden md:table-cell">{nft.nft?.unit || '-'}</td>
                  <td className="px-4 py-3 text-algo-text font-mono hidden md:table-cell">{nft.nft?.id || '-'}</td>
                  <td className="px-4 py-3 text-algo-text truncate max-w-[120px] sm:max-w-xs">{nft.collectionName || '-'}</td>
                  <td className="px-4 py-3 text-algo-text font-mono truncate max-w-xs hidden md:table-cell">{nft.nft?.creator ? nft.nft.creator.slice(0, 10) + '...' : '-'}</td>
                  <td className="px-4 py-3 text-algo-accent font-medium">{nft.value ? formatALGO(parseFloat(nft.value)) : '-'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleOpenModal(nft)}
                      className="px-3 py-1.5 text-xs bg-algo-accent/20 text-algo-accent rounded-md hover:bg-algo-accent/30 transition-colors flex items-center gap-1"
                      aria-label={`View details for ${nft.nft?.name || 'NFT'}`}
                    >
                      <ExternalLink className="w-3 h-3" /> 
                      <span className="hidden sm:inline">View Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Gallery View */}
      {viewMode === 'gallery' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6">
          {currentNfts.map((nft, index) => {
            // Get image URL using the same logic as the modal
            const getImageUrl = (nft: any): string | null => {
              if (nft?.nft?.urls && nft.nft.urls.length > 0) {
                const imageUrl = nft.nft.urls.find((url: any) => {
                  const isImage = url?.typ === 'image' || 
                                 url?.url?.includes('image') || 
                                 url?.url?.includes('thumbnail') ||
                                 url?.url?.includes('ipfs');
                  return isImage && !url?.url?.includes('.mp4') && !url?.url?.includes('.webm') && !url?.url?.includes('.mov') && !url?.url?.includes('.glb') && !url?.url?.includes('.gltf');
                });
                if (imageUrl?.url) return imageUrl.url;
              }
              
              if (nft?.nft?.image) return nft.nft.image;
              if (nft?.nft?.thumbnail) return nft.nft.thumbnail;
              return null;
            };
            
            // Get the image URL using the same logic as modal
            const imageUrl = getImageUrl(nft);
            
            // Use helper function to get optimized image URL
            let optimizedImageUrl: string | undefined = undefined;
            
            if (imageUrl) {
              // Simple check if URL is an image (has image extension or contains image-related terms)
              const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(imageUrl) || 
                             imageUrl.includes('image') || 
                             imageUrl.includes('thumbnail') ||
                             imageUrl.includes('ipfs');
              
              if (isImage) {
                optimizedImageUrl = getOptimizedImageUrl(imageUrl) || imageUrl;
              }
            }
            
            // Add support for NFD placeholder images
            if (!optimizedImageUrl && nft.nft?.name?.includes('.algo')) {
              optimizedImageUrl = 'https://app.nf.domains/img/nfd-image-placeholder_gray.jpg';
            }
            
            return (
              <div 
                key={nft.nft?.id}
                className="bg-algo-dark/50 rounded-lg p-3 sm:p-4 hover:bg-algo-dark/70 hover:scale-105 transition-all duration-200 flex flex-col h-full"
                role="article"
                aria-label={`NFT: ${nft.nft?.name || 'Unknown NFT'}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                  }
                }}
              >
                <div className="aspect-square mb-3 sm:mb-4 bg-algo-gray-light rounded-lg overflow-hidden flex-shrink-0" role="img" aria-label={`Image for ${nft.nft?.name || 'NFT'}`}> 
                  {optimizedImageUrl ? (
                    <CardImage src={optimizedImageUrl} alt={nft.nft?.name || 'NFT'} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" role="img" aria-label="No image available">
                      <Image className="w-8 h-8 text-algo-gray-light" aria-hidden="true" />
                </div>
              )}
            </div>
                <div className="flex flex-col flex-grow">
                  <h4 className="font-medium text-algo-text text-sm sm:text-base truncate mb-1 tracking-tight">
                    {nft.nft?.name || 'Unknown NFT'}
              </h4>
                  <p className="text-xs sm:text-sm text-algo-text mb-2 tracking-tight">
                    {nft.nft?.unit} • ID: {nft.nft?.id}
                  </p>
                  {nft.collectionName && (
                    <p className="text-xs sm:text-sm text-algo-text mb-1 tracking-tight">
                      Collection: {nft.collectionName}
                    </p>
                  )}
                  {nft.nft?.creator && (
                    <p className="text-xs sm:text-sm text-algo-text mb-1 tracking-tight">
                      Creator: {nft.nft.creator.slice(0, 8)}...
                    </p>
                  )}
                  {nft.value && (
                    <p className="text-xs sm:text-sm text-algo-accent font-medium tracking-tight mb-3">
                      {formatALGO(parseFloat(nft.value))}
                </p>
              )}
                  <div className="mt-auto">
                    <button 
                      onClick={() => handleOpenModal(nft)}
                      className="w-full px-2 py-1 text-xs sm:text-sm bg-algo-accent/20 text-algo-accent 
                               rounded-md hover:bg-algo-accent/30 transition-colors duration-200 
                               flex items-center justify-center gap-1 tracking-tight"
                      aria-label={`View details for ${nft.nft?.name || 'NFT'}`}
                    >
                      <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                View Details
              </button>
            </div>
          </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-algo-gray-light" aria-label="NFT pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-algo-dark/50 text-algo-text 
                     rounded-md hover:bg-algo-dark/70 disabled:opacity-50 disabled:cursor-not-allowed 
                     transition-colors duration-200 tracking-tight"
            aria-label="Go to previous page"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            Previous
          </button>
          <div className="flex items-center gap-2" role="group" aria-label="Page navigation">
            <span className="text-sm text-algo-gray-light tracking-tight">Page</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={(e) => {
                const value = parseInt(e.target.value);
                if (value >= 1 && value <= totalPages) {
                  setCurrentPage(value);
                } else {
                  setPageInput(currentPage.toString());
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="w-16 px-3 py-2 text-sm bg-algo-dark/50 text-algo-text rounded-md border border-algo-gray-light 
                       hover:bg-algo-dark/70 focus:outline-none focus:border-algo-accent transition-colors duration-200 tracking-tight text-center"
              aria-label={`Page ${currentPage} of ${totalPages}`}
            />
            <span className="text-sm text-algo-gray-light tracking-tight">of {totalPages}</span>
      </div>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-algo-dark/50 text-algo-text 
                     rounded-md hover:bg-algo-dark/70 disabled:opacity-50 disabled:cursor-not-allowed 
                     transition-colors duration-200 tracking-tight"
            aria-label="Go to next page"
          >
            Next
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </nav>
      )}

      {/* NFT Details Modal */}
      {selectedNFT && (
        <NFTDetailsModal
          nft={selectedNFT}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}