import { ChatCompletionTool } from 'openai/resources/index.mjs'

export const getCurrentTimeFunctionSpec = {
	name: 'currenttime',
	description: 'Get the current time in UTC'
}

export const getWebPageContentFunctionSpec = {
	name: 'webpagecontent',
	description: 'Get webpage content',
	parameters: {
		type: 'object',
		properties: {
			url: {
				type: 'string',
				description: 'The url to the webpage preceeded by https://'
			},
			userquery: {
				type: 'string',
				description:
					"Rewrite the user's full query considering all precious context"
			}
		},
		required: ['url', 'userquery']
	}
}

export const getCurrentTimeTool: ChatCompletionTool = {
	function: getCurrentTimeFunctionSpec,
	type: 'function'
}
export const getWebPageContentTool: ChatCompletionTool = {
	function: getWebPageContentFunctionSpec,
	type: 'function'
}
