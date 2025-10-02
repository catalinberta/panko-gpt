import mongoose from 'mongoose';

export interface TopicPreviousNews {
	createdAt: Date;
	link: string;
	summary: string;
	selectionReason: string;
}

export interface NewsTopic {
	createdAt: Date;
	lastUpdateAt: Date;
	frequency: number;
	companionId: string;
	platform: string;
	serverId: string;
	channelId: string;
	userId: string;
	userName: string;
	query: string;
	interest: string;
	_id: string;
	previousNews: TopicPreviousNews[];
}

const TopicPreviousNewsSchema = new mongoose.Schema<TopicPreviousNews>({
	createdAt: { type: Date, required: true },
	link: { type: String, required: true },
	summary: { type: String, required: true },
	selectionReason: { type: String, required: true }
});

const NewsTopicSchema = new mongoose.Schema<NewsTopic>({
	createdAt: { type: Date, required: true },
	lastUpdateAt: { type: Date, required: true },
	frequency: { type: Number, required: true },
	platform: { type: String, required: true },
	companionId: { type: String, required: true },
	serverId: { type: String, required: true },
	channelId: { type: String, required: true },
	userId: {
		type: String,
		required: true
	},
	userName: {
		type: String,
		required: true
	},
	query: { type: String, required: true },
	interest: { type: String, required: true },
	previousNews: [TopicPreviousNewsSchema]
});

export const NewsTopicModel = mongoose.model('NewsTopic', NewsTopicSchema);

export const getAllNewsTopics = () => NewsTopicModel.find().lean();
export const getServerNewsTopics = (serverId: string) => NewsTopicModel.find({ serverId }).lean();
export const getNewsTopicById = (_id: String) => NewsTopicModel.findById(_id).lean();
export const removeNewsTopicById = (_id: String) => NewsTopicModel.deleteOne({ _id });
export const getAllNewsTopicsByUserName = (username: String) => NewsTopicModel.find({ userName: username }).lean();
export const addNewsTopic = (values: Record<string, any>) =>
	new NewsTopicModel(values).save().then(data => data.toObject());
export const updateNewsTopic = (_id: String, values: Record<string, any>) =>
	NewsTopicModel.findById(_id).updateOne(values);

export const addPreviousNewsToTopic = (newsTopicId: string, previousNews: TopicPreviousNews) =>
	NewsTopicModel.findByIdAndUpdate(
		newsTopicId,
		{
			$push: {
				previousNews
			}
		},
		{ new: true }
	).lean();
