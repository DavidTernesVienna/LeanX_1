import React, { useState, useEffect } from 'react';
import { loadAssetIndex, AssetIndex, isImage, isVideo, isText } from '../services/assetIndex';

const PreviewModal: React.FC<{ assetPath: string; onClose: () => void }> = ({ assetPath, onClose }) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isText(assetPath)) {
      setIsLoading(true);
      setError(null);
      fetch(assetPath, { cache: 'no-store' })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.text();
        })
        .then(text => {
          setTextContent(text);
          setIsLoading(false);
        })
        .catch(e => {
          setError(`Failed to load text content: ${e.message}`);
          setIsLoading(false);
        });
    }
  }, [assetPath]);

  const renderContent = () => {
    if (isImage(assetPath)) {
      return <img src={assetPath} alt={assetPath} className="max-w-full max-h-full object-contain" />;
    }
    if (isVideo(assetPath)) {
      return <video src={assetPath} controls playsInline preload="metadata" className="max-w-full max-h-full" />;
    }
    if (isText(assetPath)) {
      if (isLoading) return <p>Loading...</p>;
      if (error) return <p className="text-red-500">{error}</p>;
      return <pre className="text-left whitespace-pre-wrap break-all">{textContent}</pre>;
    }
    return <p>Unsupported asset type.</p>;
  };

  return (
    <div 
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        onClick={onClose}
    >
      <div 
        className="bg-gray-dark p-4 rounded-lg max-w-3xl max-h-[90vh] overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-text break-all">{assetPath}</p>
            <button onClick={onClose} className="text-2xl font-bold leading-none">&times;</button>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export const AssetBrowser: React.FC = () => {
  const [index, setIndex] = useState<AssetIndex | null>(null);
  const [previewAsset, setPreviewAsset] = useState<string | null>(null);

  useEffect(() => {
    loadAssetIndex().then(setIndex);
  }, []);

  if (!index) {
    return <div className="p-4 text-center">Loading asset index...</div>;
  }

  const allAssets = [...index.images, ...index.videos, ...index.texts];
  if (allAssets.length === 0) {
    return <div className="p-4 text-center">Keine Assets gefunden</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-center">Asset Browser</h1>
      {previewAsset && <PreviewModal assetPath={previewAsset} onClose={() => setPreviewAsset(null)} />}
      
      {index.images.length > 0 && (
        <section className="bg-gray-dark p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Images ({index.images.length})</h2>
          <ul className="space-y-1">
            {index.images.map(path => (
              <li key={path} onClick={() => setPreviewAsset(path)} className="cursor-pointer hover:bg-gray-light p-2 rounded">
                {path}
              </li>
            ))}
          </ul>
        </section>
      )}

      {index.videos.length > 0 && (
        <section className="bg-gray-dark p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Videos ({index.videos.length})</h2>
          <ul className="space-y-1">
            {index.videos.map(path => (
              <li key={path} onClick={() => setPreviewAsset(path)} className="cursor-pointer hover:bg-gray-light p-2 rounded">
                {path}
              </li>
            ))}
          </ul>
        </section>
      )}

      {index.texts.length > 0 && (
        <section className="bg-gray-dark p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Texts ({index.texts.length})</h2>
          <ul className="space-y-1">
            {index.texts.map(path => (
              <li key={path} onClick={() => setPreviewAsset(path)} className="cursor-pointer hover:bg-gray-light p-2 rounded">
                {path}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
