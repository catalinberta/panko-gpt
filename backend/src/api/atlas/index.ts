import express from 'express';
import {
	getAtlasIndexController,
	createAtlasIndexController,
	getAtlasClustersController
} from '../../controllers/atlas';

export default (router: express.Router) => {
	router.get('/atlas-index', getAtlasIndexController);
	router.post('/atlas-index', createAtlasIndexController);
	router.get('/atlas-clusters', getAtlasClustersController);
};
