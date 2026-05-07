
export type AssetIndex = {
  images: string[];
  videos: string[];
  texts: string[];
  content: string[];
};

const emptyIndex: AssetIndex = {
  images: [],
  videos: [],
  texts: [],
  content: [],
};

export async function loadAssetIndex(): Promise<AssetIndex> {
  try {
    const response = await fetch('content/leanx_index.json', { cache: 'no-store' });
    if (!response.ok) {
      console.warn(`Asset index not found (status: ${response.status}). If you have local videos, ensure public/content/leanx_index.json exists.`);
      return emptyIndex;
    }
    const data = await response.json();
    if (data && (Array.isArray(data.images) || Array.isArray(data.videos))) {
       return {
           images: Array.isArray(data.images) ? data.images : [],
           videos: Array.isArray(data.videos) ? data.videos : [],
           texts: Array.isArray(data.texts) ? data.texts : [],
           content: Array.isArray(data.content) ? data.content : [],
       };
    }
    return emptyIndex;
  } catch (error) {
    console.warn('Error loading asset index. Defaulting to built-in GIFs.', error);
    return emptyIndex;
  }
}

export function isImage(path: string): boolean {
  return /\.(jpe?g|png|gif|webp|svg)$/i.test(path);
}

export function isVideo(path: string): boolean {
  return /\.(mp4|webm|mov|ogg)$/i.test(path);
}

export function isText(path: string): boolean {
  return /\.(txt|json|md|html|css|js)$/i.test(path);
}
