const clients = new Map();

class ClientManager {
	static add(configId: string, client: any) {
		if (!configId) {
			throw new Error('Config ID is required');
		}
		if (clients.has(configId)) {
			console.warn(`Client for _id ${configId} already exists`);
		}
		clients.set(configId, client);
		return client;
	}

	static get(configId: string) {
		return clients.get(configId);
	}

	static remove(configId: string) {
		if (clients.has(configId)) {
			clients.delete(configId);
			console.log(`Client with _id ${configId} removed from ClientManager`);
		} else {
			console.warn(`No client found for _id ${configId}`);
		}
	}
}

export default ClientManager;
