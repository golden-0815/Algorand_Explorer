import { useState, useEffect } from 'react';
import { getAssetImage, OptimizedImage } from '../lib/utils/imageOptimization';

export interface UseAssetImageResult {
  image: OptimizedImage | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * React hook for getting optimized asset images with fallback
 */
export function useAssetImage(
  assetId: number | null, 
  allowExternalFallback: boolean = true
): UseAssetImageResult {
  const [image, setImage] = useState<OptimizedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImage = async () => {
    if (!assetId) {
      setImage(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getAssetImage(assetId, allowExternalFallback);
      setImage(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load image');
      setImage(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImage();
  }, [assetId, allowExternalFallback]);

  const refetch = () => {
    fetchImage();
  };

  return { image, loading, error, refetch };
}

/**
 * React hook for getting multiple asset images
 */
export function useAssetImages(
  assetIds: number[], 
  allowExternalFallback: boolean = true
): {
  images: Map<number, OptimizedImage>;
  loading: boolean;
  errors: Map<number, string>;
  refetch: () => void;
} {
  const [images, setImages] = useState<Map<number, OptimizedImage>>(new Map());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Map<number, string>>(new Map());

  const fetchImages = async () => {
    if (assetIds.length === 0) {
      setImages(new Map());
      setLoading(false);
      setErrors(new Map());
      return;
    }

    setLoading(true);
    setErrors(new Map());

    const newImages = new Map<number, OptimizedImage>();
    const newErrors = new Map<number, string>();

    // Fetch images in parallel
    const promises = assetIds.map(async (assetId) => {
      try {
        const result = await getAssetImage(assetId, allowExternalFallback);
        if (result) {
          newImages.set(assetId, result);
        }
      } catch (err) {
        newErrors.set(assetId, err instanceof Error ? err.message : 'Failed to load image');
      }
    });

    await Promise.all(promises);

    setImages(newImages);
    setErrors(newErrors);
    setLoading(false);
  };

  useEffect(() => {
    fetchImages();
  }, [assetIds.join(','), allowExternalFallback]);

  const refetch = () => {
    fetchImages();
  };

  return { images, loading, errors, refetch };
} 