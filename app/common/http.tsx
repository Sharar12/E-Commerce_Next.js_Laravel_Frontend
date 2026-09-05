export const apiUrl = 'http://127.0.0.1:8000/api'
export const localBaseUrl = 'http://127.0.0.1:8000'

export const adminToken = () => {
    return localStorage.getItem('adminToken') || '';
}


// Safe image URL helper
export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';  
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('/storage/')) return `${localBaseUrl}${imagePath}`;
  return `${localBaseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

// Safe helper to extract image URL from any product object structure
export const getProductImageUrl = (product: any): string => {
  if (!product) return '';

  // 1. Direct image property
  if (typeof product.image === 'string' && product.image.trim() !== '' && !product.image.includes('placeholder')) {
    return getImageUrl(product.image);
  }

  // 2. Direct image_url property
  if (typeof product.image_url === 'string' && product.image_url.trim() !== '') {
    return getImageUrl(product.image_url);
  }

  // 3. Direct thumbnail property
  if (typeof product.thumbnail === 'string' && product.thumbnail.trim() !== '' && !product.thumbnail.includes('placeholder')) {
    return getImageUrl(product.thumbnail);
  }

  // 4. images array from database relation
  if (Array.isArray(product.images) && product.images.length > 0) {
    const primaryImg = product.images.find((img: any) => img && (img.is_primary || img.isPrimary));
    const firstImg = primaryImg || product.images[0];

    if (typeof firstImg === 'string' && firstImg.trim() !== '') {
      return getImageUrl(firstImg);
    }
    if (firstImg && typeof firstImg.image_url === 'string' && firstImg.image_url.trim() !== '') {
      return getImageUrl(firstImg.image_url);
    }
    if (firstImg && typeof firstImg.url === 'string' && firstImg.url.trim() !== '') {
      return getImageUrl(firstImg.url);
    }
  }

  return '';
};

// Safe JSON response parser helper to prevent "Unexpected token '<' ... is not valid JSON" errors
export const safeParseJson = async (res: Response): Promise<any> => {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (err) {
    console.error("Failed to parse JSON response:", text);
    return { error: `Non-JSON response (${res.status})`, message: text.substring(0, 100) };
  }
};

// Safe placeholder image for SSR
export const getPlaceholderImage = (width: number = 48, height: number = 48, text: string = 'No Image'): string => {
  // Use SVG data URL that works on both server and client
  return `data:image/svg+xml;base64,${Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="10" 
            text-anchor="middle" dy=".3em" fill="#9ca3af">${text}</text>
    </svg>
  `).toString('base64')}`;
};