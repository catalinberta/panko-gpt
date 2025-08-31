import { Settings } from '@/services/api/types';
import { create } from 'zustand';

interface SettingsState {
	settings: Settings;
	updateSettings: (settings: Settings) => void;
}

const useSettingsStore = create<SettingsState>(set => ({
	settings: {} as Settings,
	updateSettings: settings =>
		set(state => ({
			settings: {
				...state.settings,
				...settings
			}
		}))
}));

export default useSettingsStore;
