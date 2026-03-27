import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface Address {
  country: string;
  governate: string;
  city: string;
  street: string;
}

export interface Customer {
  _id?: string;
  name: string;
  company?: string;
  phoneNumber: string;
  address: Address;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetCustomersResponse {
  message: string;
  data: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    customers: Customer[];
  };
}

export interface CustomerResponse {
  message: string;
  data: Customer;
}

export const customerService = {
  async getCustomers({
    search,
    page = 1,
    limit = 20,
  }: {
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<GetCustomersResponse['data']> {
    try {
      axios.defaults.withCredentials = true;

      const params = {
        ...(search ? { search } : {}),
        page,
        limit,
      };
      const response = await axios.get<GetCustomersResponse>(`${API_URL}/customers`, { params });

      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to fetch customers';
      throw new Error(message);
    }
  },

  async getCustomer(customerId: string): Promise<Customer> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.get<CustomerResponse>(`${API_URL}/customers/${customerId}`);

      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to fetch customer';
      throw new Error(message);
    }
  },

  async createCustomer(
    customer: Omit<Customer, '_id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Customer> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.post<CustomerResponse>(`${API_URL}/customers`, customer);

      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to create customer';
      throw new Error(message);
    }
  },

  async editCustomer(
    customerId: string,
    updates: Partial<Omit<Customer, '_id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Customer> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.patch<CustomerResponse>(
        `${API_URL}/customers/edit/${customerId}`,
        updates,
      );

      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to edit customer';
      throw new Error(message);
    }
  },

  async deleteCustomer(customerId: string): Promise<Customer> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.delete<CustomerResponse>(
        `${API_URL}/customers/delete/${customerId}`,
      );

      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to delete customer';
      throw new Error(message);
    }
  },
};
