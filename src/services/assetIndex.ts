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
    const response = await fetch('/content/leanx_index.json', { cache: 'no-store' });
    if (!response.ok) {
      console.error(`Failed to fetch asset index: ${response.statusText}`);
      return emptyIndex;
    }
    const data = await response.json();
    if (data && Array.isArray(data.images) && Array.isArray(data.videos) && Array.isArray(data.texts)) {
       return data as AssetIndex;
    }
    console.error('Invalid asset index format.');
    return emptyIndex;
  } catch (error) {
    console.error('Error loading or parsing asset index:', error);
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
