import mongoose, { Model } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

export const migrateCollectionsToUUIDv4 = async (
	model: Model<any, any, any, any, any, any>
) => {
	const cursor = model.find({}).cursor()

	for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
		if (doc._id instanceof mongoose.Types.ObjectId) {
			const newId = uuidv4()
			const oldId = doc._id

			const newData = { ...doc.toObject(), _id: newId }
			delete newData.__v
			await model.create(newData)
			await model.deleteOne({ _id: oldId })
		}
	}
}
