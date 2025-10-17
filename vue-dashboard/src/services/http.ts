import type { ApiResponse } from '@/types'

// HTTP 客户端配置
interface HttpConfig {
  baseURL: string
  timeout: number
  headers: Record<string, string>
}

// 请求配置
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  params?: Record<string, any>
  data?: any
  timeout?: number
}

// 错误类型
export class HttpError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

class HttpClient {
  private config: HttpConfig
  private token: string | null = null

  constructor(config: Partial<HttpConfig> = {}) {
    this.config = {
      baseURL: config.baseURL || '',
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        ...config.headers
      }
    }
  }

  // 设置认证 token
  setToken(token: string) {
    this.token = token
  }

  // 清除 token
  clearToken() {
    this.token = null
  }

  // 构建完整 URL
  private buildURL(url: string, params?: Record<string, any>): string {
    const fullURL = url.startsWith('http') ? url : `${this.config.baseURL}${url}`
    
    if (!params) return fullURL
    
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    
    const queryString = searchParams.toString()
    return queryString ? `${fullURL}?${queryString}` : fullURL
  }

  // 构建请求头
  private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers = { ...this.config.headers }
    
    if (this.token) {
      headers['token'] = this.token
    }
    
    if (customHeaders) {
      Object.assign(headers, customHeaders)
    }
    
    return headers
  }

  // 处理响应
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type')
    const isJson = contentType?.includes('application/json')
    
    let data: any
    try {
      data = isJson ? await response.json() : await response.text()
    } catch (error) {
      throw new HttpError('Failed to parse response', response.status, response)
    }
    
    // 如果响应不是标准的 ApiResponse 格式，包装一下
    if (!data.hasOwnProperty('status') || !data.hasOwnProperty('code')) {
      data = {
        status: response.ok ? 1 : 0,
        code: response.ok ? 'OK' : 'ERROR',
        message: response.ok ? 'Success' : 'Request failed',
        data: data,
        duration: 0,
        errorCode: null,
        success: response.ok
      }
    }
    
    // 检查业务错误
    if (data.status === 0 || data.code !== 'OK') {
      throw new HttpError(
        data.message || 'Request failed',
        response.status,
        data
      )
    }
    
    return data as ApiResponse<T>
  }

  // 通用请求方法
  async request<T = any>(url: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers: customHeaders,
      params,
      data,
      timeout = this.config.timeout
    } = config

    const fullURL = this.buildURL(url, params)
    const headers = this.buildHeaders(customHeaders)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(fullURL, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      return await this.handleResponse<T>(response)
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof HttpError) {
        throw error
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new HttpError('Request timeout')
        }
        throw new HttpError(error.message)
      }
      
      throw new HttpError('Unknown error occurred')
    }
  }

  // GET 请求
  async get<T = any>(url: string, params?: Record<string, any>, config?: Omit<RequestConfig, 'method' | 'params'>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'GET', params })
  }

  // POST 请求
  async post<T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'method' | 'data'>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'POST', data })
  }

  // PUT 请求
  async put<T = any>(url: string, data?: any, config?: Omit<RequestConfig, 'method' | 'data'>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PUT', data })
  }

  // DELETE 请求
  async delete<T = any>(url: string, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE' })
  }
}

// 创建默认实例
export const http = new HttpClient({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://apict.jijiayun.com',
  timeout: 30000
})

// 导出类型和实例
export { HttpClient }
export default http
