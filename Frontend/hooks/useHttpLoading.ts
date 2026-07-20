import { useEffect } from "react";
import { useLoading } from "../context/LoadingContext";
import { apiClient } from "../services/api";

/**
 * Hook for automatic HTTP request loading state management
 * Attaches interceptors to axios client for show/hide loading
 * Handles concurrent requests with a counter system
 */
export const useHttpLoading = () => {
  const { show, hide } = useLoading();

  useEffect(() => {
    // Request interceptor - show loading on request
    const requestInterceptor = apiClient.interceptors.request.use(
      (config) => {
        show();
        return config;
      },
      (error) => {
        hide();
        return Promise.reject(error);
      }
    );

    // Response interceptor - hide loading on response
    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => {
        hide();
        return response;
      },
      (error) => {
        hide();
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on unmount
    return () => {
      apiClient.interceptors.request.eject(requestInterceptor);
      apiClient.interceptors.response.eject(responseInterceptor);
    };
  }, [show, hide]);
};
