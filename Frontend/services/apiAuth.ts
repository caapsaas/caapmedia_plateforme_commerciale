import { api } from './api';
import { Contact } from '../types';

// Interface for login credentials
interface LoginCredentials {
  email: string;
  password: string;
}

// Interface for signup data
interface SignupData {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  password: string;
}

// Interface for auth response
interface AuthResponse {
  customer: Contact;
  token: string;
}

/**
 * Login a customer with email and password
 * @param credentials - Login credentials containing email and password
 * @returns Promise with customer data and auth token
 */
export const loginCustomer = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const { data } = await api.post('/auth/login', credentials);
  return data;
};

/**
 * Signup a new customer
 * @param customerData - Customer signup data
 * @returns Promise with customer data and auth token
 */
export const signupCustomer = async (SignupData: SignupData): Promise<AuthResponse> => {
  const { data } = await api.post('/auth/register', SignupData);
  return data;
};

/**
 * Logout the current customer
 * Clears the auth token from localStorage
 */
export const logoutCustomer = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('customer');
};

/**
 * Get the current authenticated customer from localStorage
 * @returns Customer data or null if not authenticated
 */
export const getCurrentCustomer = (): Contact | null => {
  const customerData = localStorage.getItem('customer');
  return customerData ? JSON.parse(customerData) : null;
};

/**
 * Check if customer is authenticated
 * @returns boolean indicating if customer is logged in
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};