import React from 'react';
import type { Settings } from '../types';
import { BackArrowIcon } from './icons';

interface SettingsScreenProps {
  settings: Settings;
  onUpdateSettings: (settings: Settings) => void;
  onBack: () => void;
}

const ToggleSwitch: React.FC<{
  label: string;
  labelId: string;
  checked: boolean;
  onChange: () => void;
}> = ({ label, labelId, checked, onChange }) => (
  <div className="flex justify-between items-center">
    <label id={labelId} className="font-medium">{label}</label>
    <button
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      onClick={onChange}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-gray-light'}`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-7' : 'translate-x-1'}`}
      />
    </button>
  </div>
);

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ settings, onUpdateSettings, onBack }) => {
  const handleSettingChange = (key: keyof Settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    onUpdateSettings(newSettings);
  };

  return (
    <div className="min-h-screen flex flex-col p-4">
      <header className="flex items-center mb-6">
        <button onClick={onBack} className="p-2 -ml-2">
          <BackArrowIcon className="w-6 h-6" />
        </button>
        <h1 className="font-semibold text-xl mx-auto">Settings</h1>
        <div className="w-6 h-6"></div>
      </header>

      <main className="flex-grow">
        <div className="bg-gray-dark rounded-xl p-4">
            <h2 className="font-bold text-lg text-center mb-4 sr-only">App Settings</h2>
            <div className="space-y-4">
                <ToggleSwitch label="Audio Cues" labelId="audio-cues" checked={settings.audioCues} onChange={() => handleSettingChange('audioCues', !settings.audioCues)} />
                <ToggleSwitch label="Track Reps In-Workout" labelId="track-reps" checked={settings.trackReps} onChange={() => handleSettingChange('trackReps', !settings.trackReps)} />
                <ToggleSwitch label="Enable Warm Up" labelId="enable-warmup" checked={settings.enableWarmup} onChange={() => handleSettingChange('enableWarmup', !settings.enableWarmup)} />
                <ToggleSwitch label="Enable Cool Down" labelId="enable-cooldown" checked={settings.enableCooldown} onChange={() => handleSettingChange('enableCooldown', !settings.enableCooldown)} />
                <ToggleSwitch label="Motion" labelId="enable-glass-motion" checked={settings.enableGlassMotion} onChange={() => handleSettingChange('enableGlassMotion', !settings.enableGlassMotion)} />
            </div>
        </div>
      </main>
    </div>
  );
};
