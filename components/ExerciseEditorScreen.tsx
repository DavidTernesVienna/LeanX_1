
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
    <div className="min-h-screen flex flex-col p-4 bg-black animate-fade-in">
      <header className="flex items-center mb-6">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
          <BackArrowIcon className="w-6 h-6 text-white" />
        </button>
        <h1 className="font-bold text-xl mx-auto uppercase tracking-wide text-white">{isEditMode ? 'Edit Exercise' : 'Create Exercise'}</h1>
        <div className="w-6 h-6"></div>
      </header>

      <main className="flex-grow overflow-y-auto space-y-6">
        <div className="space-y-2">
          <label htmlFor="exercise-name" className="text-xs font-bold text-accent uppercase tracking-widest">Exercise Name</label>
          <input
            id="exercise-name"
            type="text"
            placeholder="e.g. Diamond Push-ups"
            value={exerciseData.name || ''}
            onChange={(e) => onDataChange({ ...exerciseData, name: e.target.value })}
            className={`w-full bg-gray-900 text-white p-4 rounded-xl border border-gray-800 focus:border-accent outline-none font-bold placeholder-gray-600 ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isEditMode}
          />
        </div>
        
        <div className="space-y-3">
            <p className="text-xs font-bold text-accent uppercase tracking-widest">Media Source</p>
            <div className="w-full p-1 bg-gray-900 rounded-xl flex items-center border border-gray-800">
                <button 
                    onClick={() => switchMediaMode('upload')}
                    className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${mediaMode === 'upload' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Upload Video/Photo
                </button>
                <button 
                    onClick={() => switchMediaMode('youtube')}
                    className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${mediaMode === 'youtube' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <YouTubeIcon className="w-4 h-4" /> YouTube
                </button>
            </div>

            <div className="relative w-full aspect-square rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center overflow-hidden group">
                {exerciseData.image ? (
                  <>
                     <img src={exerciseData.image} alt="Exercise preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                     {exerciseData.video && (
                         <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-end">
                             <button 
                               onClick={onSelectThumbnail}
                               className="bg-black/60 backdrop-blur-md text-white font-bold py-2 px-4 rounded-full text-xs flex items-center gap-2 hover:bg-accent hover:text-black transition-all border border-white/10 shadow-lg transform active:scale-95"
                             >
                               <FilmIcon className="w-4 h-4" /> Edit Thumbnail
                             </button>
                         </div>
                      )}
                  </>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-700">
                         <ImageIcon className="w-16 h-16" />
                         <span className="text-xs font-bold uppercase tracking-wide">No Media Selected</span>
                    </div>
                )}
            </div>
             
             {mediaMode === 'upload' && (
                <div className="grid grid-cols-3 gap-3 w-full">
                    <button onClick={onTakePhoto} className="bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white py-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95">
                        <CameraIcon className="w-6 h-6 text-accent" /> 
                        <span className="text-[10px] font-bold uppercase tracking-wider">Photo</span>
                    </button>
                    <button onClick={onRecordVideo} className="bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white py-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95">
                        <VideoCameraIcon className="w-6 h-6 text-accent" /> 
                        <span className="text-[10px] font-bold uppercase tracking-wider">Video</span>
                    </button>
                    <button onClick={onChooseFromGallery} className="bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white py-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95">
                        <PhotoIcon className="w-6 h-6 text-accent" /> 
                        <span className="text-[10px] font-bold uppercase tracking-wider">Gallery</span>
                    </button>
                </div>
            )}
            
            {mediaMode === 'youtube' && (
                 <div>
                    <input
                        type="url"
                        placeholder="Paste YouTube Link"
                        value={youtubeUrl}
                        onChange={handleYoutubeUrlChange}
                        className="w-full bg-gray-900 text-white p-4 rounded-xl border border-gray-800 focus:border-red-500 outline-none font-mono text-sm placeholder-gray-600"
                    />
                    <p className="text-[10px] text-gray-500 mt-2 px-1">
                        Paste a full YouTube URL. The thumbnail will be fetched automatically.
                    </p>
                </div>
            )}
        </div>

        <div className="space-y-2">
          <label htmlFor="exercise-description" className="text-xs font-bold text-accent uppercase tracking-widest">Instructions</label>
          <textarea
            id="exercise-description"
            placeholder="Step 1: Get into position..."
            value={descriptionText}
            onChange={(e) => onDataChange({ ...exerciseData, description: e.target.value.split('\n') })}
            className="w-full bg-gray-900 text-white p-4 rounded-xl border border-gray-800 focus:border-accent outline-none min-h-[120px] resize-none leading-relaxed placeholder-gray-600"
          />
        </div>

        {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <p className="text-red-400 text-sm font-bold">{error}</p>
            </div>
        )}
      </main>

      <footer className="mt-auto pt-4 pb- safe">
        <button
          onClick={handleSave}
          className="w-full bg-accent text-black font-black py-4 rounded-xl text-lg uppercase tracking-widest shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:shadow-[0_0_30px_rgba(74,222,128,0.5)] transition-all active:scale-95"
        >
          {isEditMode ? 'Update Exercise' : 'Save Exercise'}
        </button>
      </footer>
    </div>
  );
};
