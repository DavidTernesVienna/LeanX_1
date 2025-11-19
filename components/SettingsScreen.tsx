
import React from 'react';
import type { Settings } from '../types';
import { BackArrowIcon, SettingsIcon } from './icons';

interface SettingsScreenProps {
  settings: Settings;
  onUpdateSettings: (settings: Settings) => void;
  onBack: () => void;
  isWakeLockSupported: boolean;
}

const ToggleSwitch: React.FC<{
  label: string;
  labelId: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  description?: string;
}> = ({ label, labelId, checked, onChange, disabled = false, description }) => (
  <div className={`flex justify-between items-center py-3 ${disabled ? 'opacity-50' : ''}`}>
    <div className="pr-4">
         <label id={labelId} className="font-bold text-gray-200 block">{label}</label>
         {description && <p className="text-[10px] text-gray-500 mt-0.5">{description}</p>}
    </div>
   
    <button
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 flex-shrink-0 ${checked ? 'bg-accent shadow-[0_0_10px_rgba(74,222,128,0.3)]' : 'bg-gray-700'} ${disabled ? 'cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  </div>
);

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <div className="text-xs font-bold text-accent uppercase tracking-widest mb-2 mt-6 border-b border-gray-800 pb-1">
        {title}
    </div>
);

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ settings, onUpdateSettings, onBack, isWakeLockSupported }) => {
  const handleSettingChange = (key: keyof Settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    onUpdateSettings(newSettings);
  };

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <header className="flex items-center p-4 border-b border-white/5 bg-gray-900/50 backdrop-blur-md sticky top-0 z-20">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
          <BackArrowIcon className="w-6 h-6 text-white" />
        </button>
        <div className="mx-auto flex items-center gap-2">
             <SettingsIcon className="w-5 h-5 text-gray-400" />
            <h1 className="font-bold text-xl tracking-wider uppercase">Settings</h1>
        </div>
        <div className="w-6 h-6"></div>
      </header>

      <main className="flex-grow p-4 max-w-2xl mx-auto w-full">
          <SectionHeader title="Workout Settings" />
          <div className="bg-gray-900/50 rounded-xl border border-white/5 px-4">
                <ToggleSwitch 
                    label="Warm Up Phase" 
                    labelId="enable-warmup" 
                    checked={settings.enableWarmup} 
                    onChange={() => handleSettingChange('enableWarmup', !settings.enableWarmup)}
                    description="Includes pre-warmup and dynamic movements."
                />
                <div className="h-[1px] bg-white/5"></div>
                <ToggleSwitch 
                    label="Cool Down Phase" 
                    labelId="enable-cooldown" 
                    checked={settings.enableCooldown} 
                    onChange={() => handleSettingChange('enableCooldown', !settings.enableCooldown)} 
                    description="Includes post-workout static stretching."
                />
          </div>

          <SectionHeader title="Feedback & Performance" />
          <div className="bg-gray-900/50 rounded-xl border border-white/5 px-4">
                <ToggleSwitch 
                    label="Audio Cues" 
                    labelId="audio-cues" 
                    checked={settings.audioCues} 
                    onChange={() => handleSettingChange('audioCues', !settings.audioCues)}
                    description="Beeps for intervals and phase changes."
                />
                 <div className="h-[1px] bg-white/5"></div>
                <ToggleSwitch 
                    label="Rep Tracking" 
                    labelId="track-reps" 
                    checked={settings.trackReps} 
                    onChange={() => handleSettingChange('trackReps', !settings.trackReps)}
                    description="Log your reps after each exercise."
                />
                {settings.trackReps && (
                    <div className="pl-4 border-l-2 border-gray-800 bg-gray-900/30 -mx-4 px-8 py-1">
                        <ToggleSwitch 
                            label="Auto-Pause Timer" 
                            labelId="pause-on-rep-count" 
                            checked={settings.pauseOnRepCount} 
                            onChange={() => handleSettingChange('pauseOnRepCount', !settings.pauseOnRepCount)} 
                            description="Pause timer while entering reps."
                        />
                    </div>
                )}
          </div>

          <SectionHeader title="Display & System" />
          <div className="bg-gray-900/50 rounded-xl border border-white/5 px-4">
                <ToggleSwitch 
                    label="Immersive Mode" 
                    labelId="enable-color" 
                    checked={settings.enableColor} 
                    onChange={() => handleSettingChange('enableColor', !settings.enableColor)}
                    description="Dynamic background colors based on phase."
                />
                 {settings.enableColor && (
                     <div className="pl-4 border-l-2 border-gray-800 bg-gray-900/30 -mx-4 px-8 py-1">
                         <ToggleSwitch 
                            label="Motion Effects" 
                            labelId="enable-glass-motion" 
                            checked={settings.enableGlassMotion} 
                            onChange={() => handleSettingChange('enableGlassMotion', !settings.enableGlassMotion)} 
                            disabled={!settings.enableColor}
                            description="Glassmorphism animations."
                          />
                      </div>
                 )}
                 <div className="h-[1px] bg-white/5"></div>
                <ToggleSwitch 
                    label="Keep Screen On" 
                    labelId="wake-lock" 
                    checked={settings.enableWakeLock} 
                    onChange={() => handleSettingChange('enableWakeLock', !settings.enableWakeLock)}
                    disabled={!isWakeLockSupported} 
                    description={!isWakeLockSupported ? "Not supported by this browser." : "Prevents device from sleeping during workout."}
                />
          </div>
          
          <div className="mt-8 text-center text-xs text-gray-700 font-mono uppercase">
              App Version 2.0.4
          </div>
      </main>
    </div>
  );
};
