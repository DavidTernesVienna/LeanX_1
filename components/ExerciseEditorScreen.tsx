import React, { useState, useEffect } from 'react';
import type { Exercise } from '../types';
import { BackArrowIcon, CameraIcon, PhotoIcon, UserIcon as ImageIcon, VideoCameraIcon, FilmIcon, YouTubeIcon } from './icons';

interface ExerciseEditorScreenProps {
  exerciseData: Partial<Exercise>;
  onDataChange: (data: Partial<Exercise>) => void;
  originalName: string | null; // If not null, we are in "edit" mode
  onSave: () => void;
  onBack: () => void;
  onTakePhoto: () => void;
  onRecordVideo: () => void;
  onSelectThumbnail: () => void;
  onChooseFromGallery: () => void;
}

const parseYouTubeUrl = (url: string): string | null => {
    if (!url) return null;
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regExp);
    return (match && match[1]) ? match[1] : null;
};

export const ExerciseEditorScreen: React.FC<ExerciseEditorScreenProps> = ({
  exerciseData,
  onDataChange,
  originalName,
  onSave,
  onBack,
  onTakePhoto,
  onRecordVideo,
  onSelectThumbnail,
  onChooseFromGallery,
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [mediaMode, setMediaMode] = useState<'upload' | 'youtube'>('upload');
  const [error, setError] = useState('');

  const isEditMode = originalName !== null;

  useEffect(() => {
    if (exerciseData.youtubeId) {
        setMediaMode('youtube');
        setYoutubeUrl(`https://www.youtube.com/watch?v=${exerciseData.youtubeId}`);
    } else {
        setMediaMode('upload');
        setYoutubeUrl('');
    }
  }, [exerciseData.youtubeId]);

  const handleYoutubeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setYoutubeUrl(url);
    const id = parseYouTubeUrl(url);
    if (id) {
        onDataChange({
            ...exerciseData,
            youtubeId: id,
            image: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
            video: undefined,
        });
    } else if (exerciseData.youtubeId) {
        onDataChange({ ...exerciseData, youtubeId: undefined, image: '' });
    }
  };
  
  const switchMediaMode = (mode: 'upload' | 'youtube') => {
    setMediaMode(mode);
    setError('');
    if (mode === 'upload') {
        onDataChange({ ...exerciseData, youtubeId: undefined });
        setYoutubeUrl('');
    } else {
        onDataChange({ ...exerciseData, video: undefined, image: '' });
    }
  };

  const handleSave = () => {
    if (!exerciseData.name?.trim()) {
      setError('Exercise name is required.');
      return;
    }
    if (!exerciseData.image) {
      setError('A media source (upload or YouTube link) is required.');
      return;
    }
    setError('');
    onSave();
  };
  
  const descriptionText = Array.isArray(exerciseData.description) 
    ? exerciseData.description.join('\n') 
    : '';

  return (
    <div className="min-h-screen flex flex-col p-4">
      <header className="flex items-center mb-6">
        <button onClick={onBack} className="p-2 -ml-2">
          <BackArrowIcon className="w-6 h-6" />
        </button>
        <h1 className="font-semibold text-xl mx-auto">{isEditMode ? 'Edit Exercise' : 'Create Exercise'}</h1>
        <div className="w-6 h-6"></div>
      </header>

      <main className="flex-grow overflow-y-auto space-y-6">
        <div className="space-y-2">
          <label htmlFor="exercise-name" className="font-semibold text-gray-text">Name</label>
          <input
            id="exercise-name"
            type="text"
            placeholder="e.g., Diamond Push-ups"
            value={exerciseData.name || ''}
            onChange={(e) => onDataChange({ ...exerciseData, name: e.target.value })}
            className={`w-full bg-gray-dark text-off-white p-3 rounded-md border border-gray-light ${isEditMode ? 'disabled:bg-gray-light disabled:opacity-70' : ''}`}
            disabled={isEditMode}
          />
        </div>
        
        <div className="space-y-2">
            <p className="font-semibold text-gray-text">Media</p>
            <div className="w-full p-1 bg-gray-dark rounded-xl flex items-center mb-2">
                <button 
                    onClick={() => switchMediaMode('upload')}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mediaMode === 'upload' ? 'bg-gray-light text-off-white' : 'text-gray-text'}`}
                >
                    Upload Media
                </button>
                <button 
                    onClick={() => switchMediaMode('youtube')}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1 ${mediaMode === 'youtube' ? 'bg-gray-light text-off-white' : 'text-gray-text'}`}
                >
                    <YouTubeIcon className="w-5 h-5" /> YouTube
                </button>
            </div>
            <div className="relative w-full aspect-square rounded-lg bg-gray-dark flex items-center justify-center overflow-hidden">
                {exerciseData.image ? (
                  <>
                     <img src={exerciseData.image} alt="Exercise preview" className="w-full h-full rounded-lg object-cover" />
                    {exerciseData.video && (
                         <button 
                           onClick={onSelectThumbnail}
                           className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white font-semibold py-2 px-4 rounded-full text-sm flex items-center gap-2 hover:bg-black/80 transition-colors"
                         >
                           <FilmIcon className="w-5 h-5" /> Change Thumbnail
                         </button>
                      )}
                  </>
                ) : (
                    <ImageIcon className="w-20 h-20 text-gray-light" />
                )}
            </div>
             
             {mediaMode === 'upload' && (
                <div className="grid grid-cols-3 gap-2 w-full mt-2">
                    <button onClick={onTakePhoto} className="bg-gray-light text-off-white font-semibold py-2 px-4 rounded-xl text-sm flex flex-col items-center justify-center gap-1">
                        <CameraIcon className="w-5 h-5" /> <span>Photo</span>
                    </button>
                    <button onClick={onRecordVideo} className="bg-gray-light text-off-white font-semibold py-2 px-4 rounded-xl text-sm flex flex-col items-center justify-center gap-1">
                        <VideoCameraIcon className="w-5 h-5" /> <span>Video</span>
                    </button>
                    <button onClick={onChooseFromGallery} className="bg-gray-light text-off-white font-semibold py-2 px-4 rounded-xl text-sm flex flex-col items-center justify-center gap-1">
                        <PhotoIcon className="w-5 h-5" /> <span>Gallery</span>
                    </button>
                </div>
            )}
            
            {mediaMode === 'youtube' && (
                 <div className="mt-2">
                    <input
                        type="url"
                        placeholder="Paste YouTube video link here"
                        value={youtubeUrl}
                        onChange={handleYoutubeUrlChange}
                        className="w-full bg-gray-dark text-off-white p-3 rounded-md border border-gray-light"
                    />
                </div>
            )}
        </div>

        <div className="space-y-2">
          <label htmlFor="exercise-description" className="font-semibold text-gray-text">Description</label>
          <textarea
            id="exercise-description"
            placeholder="Enter instructions, one per line."
            value={descriptionText}
            onChange={(e) => onDataChange({ ...exerciseData, description: e.target.value.split('\n') })}
            className="w-full bg-gray-dark text-off-white p-3 rounded-md border border-gray-light h-32 resize-none"
          />
        </div>

        {error && <p className="text-red-500 text-center">{error}</p>}
      </main>

      <footer className="mt-auto pt-4">
        <button
          onClick={handleSave}
          className="w-full bg-accent text-off-white font-bold py-3 rounded-full text-lg transition-transform active:scale-95"
        >
          Save Exercise
        </button>
      </footer>
    </div>
  );
};