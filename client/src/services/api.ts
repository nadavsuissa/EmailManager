import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Define API base URL based on environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Global Axios instance configuration
 */
const config: AxiosRequestConfig = {
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 seconds
};

/**
 * API service class that provides an Axios instance with interceptors
 */
class ApiService {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create(config);
    this.initializeInterceptors();
  }

  /**
   * Set up request and response interceptors
   */
  private initializeInterceptors(): void {
    // Request interceptor to add auth token
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors globally
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        const { response } = error;

        // Handle authentication errors
        if (response && response.status === 401) {
          localStorage.removeItem('token');
          // Redirect to login or dispatch a logout action if needed
          window.location.href = '/login';
        }

        // Network errors or server unavailable
        if (!response) {
          console.error('Network error or server unavailable');
          return Promise.reject({
            message: 'שרת לא זמין. אנא נסה שנית מאוחר יותר.',
          });
        }

        // Server errors
        if (response.status >= 500) {
          console.error('Server error:', response.data);
          return Promise.reject({
            message: 'שגיאת שרת. אנא נסה שנית מאוחר יותר.',
          });
        }

        // Client errors
        return Promise.reject(response.data);
      }
    );
  }

  /**
   * Generic request method
   */
  public async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.instance.request(config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * HTTP GET method
   */
  public get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, config);
  }

  /**
   * HTTP POST method
   */
  public post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, config);
  }

  /**
   * HTTP PUT method
   */
  public put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data, config);
  }

  /**
   * HTTP PATCH method
   */
  public patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.patch<T>(url, data, config);
  }

  /**
   * HTTP DELETE method
   */
  public delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url, config);
  }
}

// Create and export a single instance
export const api = new ApiService(); 