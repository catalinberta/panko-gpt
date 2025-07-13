import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/api'; // your axios wrapper or fetch util
import ApiPaths from '@/constants/ApiPaths';

export const fetchChatGptModels = async (): Promise<string[]> => {
	const { data } = await apiClient.get<string[]>(ApiPaths.ChatgptModels); // or your path
	return data;
};

export const useChatGptModels = () => {
	return useQuery({
		queryKey: ['chatgptModels'],
		queryFn: fetchChatGptModels,
		staleTime: 1000 * 60 * 60
	});
};
