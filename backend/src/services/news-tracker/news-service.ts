const NewsAPI = require('newsapi');

export interface NewsApiResult {
	source: {};
	author: string;
	title: string;
	description: string;
	url: string;
	urlToImage: string;
	publishedAt: Date;
	content: string;
}

export interface NewsApiCleanResult {
	title: string;
	description: string;
	url: string;
	urlToImage: string;
	content: string;
}

export const checkNews = async (topic: string): Promise<NewsApiCleanResult[]> => {
	const realNewsApi = new NewsAPI('24589e1ab62140a199e23495c98ed2ae');
	const newsapi = {
		v2: {
			everything: async (opts: any) => {
				const news = await realNewsApi.v2.everything(opts);
				return news;
			}
		}
	};

	const news: { articles: NewsApiResult[] } = await newsapi.v2.everything({
		q: topic,
		// language: 'us',
		sortBy: 'relevancy',
		pageSize: 30,
		from: getFormattedDates().sevenDaysAgo,
		to: getFormattedDates().today
	});

	const cleanedNews = news.articles.map(news => ({
		url: news.url,
		title: news.title,
		description: news.description,
		content: news.content,
		urlToImage: news.urlToImage
	}));

	return cleanedNews;
};

const getFormattedDates = (): { today: string; sevenDaysAgo: string } => {
	const d = (date: Date): string => {
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${y}-${m}-${day}`;
	};

	const today = new Date();
	const sevenDaysAgo = new Date(today);
	sevenDaysAgo.setDate(today.getDate() - 7);

	return {
		today: d(today),
		sevenDaysAgo: d(sevenDaysAgo)
	};
};
