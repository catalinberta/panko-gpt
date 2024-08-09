export interface AtlasSearchIndexDefinition {
	collectionName: string
	database: string
	indexID: string
	mappings: { dynamic: boolean; fields: {} }
	name: string
	status: 'IN_PROGRESS' | 'STEADY' | 'FAILED' | 'MIGRATING'
	synonyms: []
}
