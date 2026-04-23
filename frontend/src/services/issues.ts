import axios from 'axios';
import type {
  IssueType as IssueTypeValue,
  IssueStatus as IssueStatusValue,
} from './enums/issue.enums';
import { getApiBaseUrl } from './apiBase';

const API_URL = getApiBaseUrl();

export interface Issue {
  _id?: string;
  issueNumber: number;
  createdByUserId:
    | {
        _id: string;
        name: string;
        phoneNumber?: string;
      }
    | string;
  issueType: IssueTypeValue;
  description: string;
  status: IssueStatusValue;
  resolvedByUserId?:
    | {
        _id: string;
        name: string;
        phoneNumber?: string;
      }
    | string
    | null;
  resolvedAt?: string | null;
  cancelledByUserId?:
    | {
        _id: string;
        name: string;
        phoneNumber?: string;
      }
    | string
    | null;
  cancelledAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetIssuesResponse {
  message: string;
  data: Issue[];
}

export interface IssueResponse {
  message: string;
  data: Issue;
}

export const issueService = {
  async getAllIssues(): Promise<Issue[]> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.get<GetIssuesResponse>(`${API_URL}/issues`);

      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to fetch issues';
      throw new Error(message);
    }
  },

  async getUserIssues(): Promise<Issue[]> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.get<GetIssuesResponse>(`${API_URL}/issues/my-issues`);

      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to fetch user issues';
      throw new Error(message);
    }
  },

  async getIssue(issueId: string): Promise<Issue> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.get<IssueResponse>(`${API_URL}/issues/${issueId}`);

      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to fetch issue';
      throw new Error(message);
    }
  },

  async createIssue(issue: { issueType: IssueTypeValue; description: string }): Promise<Issue> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.post<IssueResponse>(`${API_URL}/issues`, issue);

      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to create issue';
      throw new Error(message);
    }
  },

  async editUserIssue(
    issueId: string,
    updates: { issueType?: IssueTypeValue; description?: string },
  ): Promise<Issue> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.patch<IssueResponse>(
        `${API_URL}/issues/edit-my-issue/${issueId}`,
        updates,
      );

      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to edit issue';
      throw new Error(message);
    }
  },

  async changeIssueStatus(issueId: string, status: IssueStatusValue): Promise<Issue> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.patch<IssueResponse>(
        `${API_URL}/issues/change-status/${issueId}`,
        { status },
      );

      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to change issue status';
      throw new Error(message);
    }
  },

  async deleteIssue(issueId: string): Promise<Issue> {
    try {
      axios.defaults.withCredentials = true;

      const response = await axios.delete<IssueResponse>(`${API_URL}/issues/delete/${issueId}`);

      return response.data.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to delete issue';
      throw new Error(message);
    }
  },
};
