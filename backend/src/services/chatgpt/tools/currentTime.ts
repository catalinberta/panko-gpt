import { tool } from '@langchain/core/tools';

const getCurrentTime = () => {
	const currentTime = String(new Date());
	return currentTime;
};

const currentTimeTool = tool(getCurrentTime, {
	name: 'currentTime',
	description: 'Get the current time in UTC'
});

export default currentTimeTool;
