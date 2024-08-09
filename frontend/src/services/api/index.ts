import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

class HttpClient {
	private readonly instance: AxiosInstance

	constructor(baseURL: string) {
		this.instance = axios.create({
			baseURL
		})

		this.initializeResponseInterceptor()
	}

	private initializeResponseInterceptor() {
		this.instance.interceptors.response.use(
			this.handleResponse,
			this.handleError
		)
	}

	private handleResponse(response: AxiosResponse) {
		return response
	}

	private handleError(error: Error) {
		return Promise.reject(error)
	}

	public get<T>(
		url: string,
		config?: AxiosRequestConfig
	): Promise<AxiosResponse<T>> {
		return this.instance.get<T>(url, config)
	}

	public post<T>(url: string, data?: object, config?: AxiosRequestConfig) {
		return this.instance.post<T>(url, data, config)
	}

	public patch<T>(url: string, data?: object, config?: AxiosRequestConfig) {
		return this.instance.patch<T>(url, data, config)
	}

	public put<T>(
		url: string,
		data?: object,
		config?: AxiosRequestConfig
	): Promise<AxiosResponse<T>> {
		return this.instance.put<T>(url, data, config)
	}

	public delete<T>(
		url: string,
		config?: AxiosRequestConfig
	): Promise<AxiosResponse<T>> {
		return this.instance.delete<T>(url, config)
	}
}
const apiUrl = import.meta.env.VITE_API_URL || document.location.origin
const apiClient = new HttpClient(apiUrl)

export default apiClient
