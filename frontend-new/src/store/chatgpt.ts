import { create } from 'zustand';

interface ChatgptState {
	models: string[];
	updateModels: (models: string[]) => void;
}

const useChatgptStore = create<ChatgptState>(set => ({
	models: [],
	updateModels: models => set({ models })
}));

export default useChatgptStore;
