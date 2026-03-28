/**
 * Microsoft Planner Graph API Client
 * 
 * Client for Microsoft Graph API operations on Planner.
 * Handles authentication, task CRUD, and plan management.
 * 
 * @module lib/planner/client
 */

import {
  PlannerConfig,
  PlannerPlan,
  PlannerBucket,
  PlannerTask,
  PlannerTaskDetails,
  PlannerPagedResponse,
  PlannerApiError,
  PlannerErrorCode,
  CreatePlannerTaskRequest,
  UpdatePlannerTaskRequest,
  UpdatePlannerTaskDetailsRequest,
  CreatePlannerBucketRequest,
  defaultPlannerConfig,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Microsoft Planner Graph API scopes required
export const PLANNER_SCOPES = [
  'Tasks.Read',
  'Tasks.ReadWrite',
  'Group.Read.All',
  'Group.ReadWrite.All',
];

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Parse Graph API error response
 */
function parseGraphError(response: Response, body: unknown): PlannerApiError {
  const error = (body as { error?: { code?: string; message?: string; innerError?: unknown } })?.error;
  
  return {
    code: (error?.code as PlannerErrorCode) || 'unknown',
    message: error?.message || `HTTP ${response.status}: ${response.statusText}`,
    innerError: error?.innerError as PlannerApiError['innerError'],
    statusCode: response.status,
  };
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: PlannerApiError): boolean {
  const retryableCodes: PlannerErrorCode[] = [
    'serviceNotAvailable',
    'throttledRequest',
    'tooManyRequests',
    'generalException',
  ];
  return retryableCodes.includes(error.code) || error.statusCode >= 500;
}

// ============================================================================
// Planner Client Class
// ============================================================================

export class PlannerClient {
  private config: PlannerConfig;
  private getAccessToken: () => Promise<string | null>;
  
  constructor(
    getAccessToken: () => Promise<string | null>,
    config: Partial<PlannerConfig> = {}
  ) {
    this.getAccessToken = getAccessToken;
    this.config = { ...defaultPlannerConfig, ...config };
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Make authenticated Graph API request
   */
  private async graphRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = MAX_RETRIES
  ): Promise<T> {
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('No access token available. Please sign in.');
    }

    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.config.graphBaseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Handle successful responses
    if (response.ok) {
      if (response.status === 204) {
        return {} as T;
      }
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return response.json();
      }
      return {} as T;
    }

    // Parse error
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = { error: { message: response.statusText } };
    }

    const apiError = parseGraphError(response, errorBody);

    // Retry logic
    if (retries > 0 && isRetryableError(apiError)) {
      const delay = RETRY_DELAY * (MAX_RETRIES - retries + 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.graphRequest<T>(endpoint, options, retries - 1);
    }

    throw apiError;
  }

  // ==========================================================================
  // Plan Operations
  // ==========================================================================

  /**
   * Get all plans for the current user
   */
  async getMyPlans(): Promise<PlannerPlan[]> {
    const response = await this.graphRequest<PlannerPagedResponse<PlannerPlan>>(
      '/me/planner/plans'
    );
    return response.value;
  }

  /**
   * Get plans for a specific group
   */
  async getGroupPlans(groupId: string): Promise<PlannerPlan[]> {
    const response = await this.graphRequest<PlannerPagedResponse<PlannerPlan>>(
      `/groups/${groupId}/planner/plans`
    );
    return response.value;
  }

  /**
   * Get a specific plan by ID
   */
  async getPlan(planId: string): Promise<PlannerPlan> {
    return this.graphRequest<PlannerPlan>(`/planner/plans/${planId}`);
  }

  /**
   * Get plan details (categories, etc.)
   */
  async getPlanDetails(planId: string): Promise<{
    id: string;
    categoryDescriptions: Record<string, string>;
    '@odata.etag': string;
  }> {
    return this.graphRequest(`/planner/plans/${planId}/details`);
  }

  // ==========================================================================
  // Bucket Operations
  // ==========================================================================

  /**
   * Get all buckets for a plan
   */
  async getBuckets(planId: string): Promise<PlannerBucket[]> {
    const response = await this.graphRequest<PlannerPagedResponse<PlannerBucket>>(
      `/planner/plans/${planId}/buckets`
    );
    return response.value;
  }

  /**
   * Create a new bucket
   */
  async createBucket(request: CreatePlannerBucketRequest): Promise<PlannerBucket> {
    return this.graphRequest<PlannerBucket>('/planner/buckets', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Update a bucket
   */
  async updateBucket(
    bucketId: string,
    update: Partial<Pick<PlannerBucket, 'name' | 'orderHint'>>,
    etag: string
  ): Promise<PlannerBucket> {
    return this.graphRequest<PlannerBucket>(`/planner/buckets/${bucketId}`, {
      method: 'PATCH',
      headers: {
        'If-Match': etag,
      },
      body: JSON.stringify(update),
    });
  }

  /**
   * Delete a bucket
   */
  async deleteBucket(bucketId: string, etag: string): Promise<void> {
    await this.graphRequest<void>(`/planner/buckets/${bucketId}`, {
      method: 'DELETE',
      headers: {
        'If-Match': etag,
      },
    });
  }

  // ==========================================================================
  // Task Operations
  // ==========================================================================

  /**
   * Get all tasks for a plan
   */
  async getTasks(planId: string): Promise<PlannerTask[]> {
    const response = await this.graphRequest<PlannerPagedResponse<PlannerTask>>(
      `/planner/plans/${planId}/tasks`
    );
    return response.value;
  }

  /**
   * Get tasks assigned to the current user
   */
  async getMyTasks(): Promise<PlannerTask[]> {
    const response = await this.graphRequest<PlannerPagedResponse<PlannerTask>>(
      '/me/planner/tasks'
    );
    return response.value;
  }

  /**
   * Get tasks for a specific bucket
   */
  async getBucketTasks(bucketId: string): Promise<PlannerTask[]> {
    const response = await this.graphRequest<PlannerPagedResponse<PlannerTask>>(
      `/planner/buckets/${bucketId}/tasks`
    );
    return response.value;
  }

  /**
   * Get a specific task by ID
   */
  async getTask(taskId: string): Promise<PlannerTask> {
    return this.graphRequest<PlannerTask>(`/planner/tasks/${taskId}`);
  }

  /**
   * Get task details (description, checklist, references)
   */
  async getTaskDetails(taskId: string): Promise<PlannerTaskDetails> {
    return this.graphRequest<PlannerTaskDetails>(`/planner/tasks/${taskId}/details`);
  }

  /**
   * Create a new task
   */
  async createTask(request: CreatePlannerTaskRequest): Promise<PlannerTask> {
    return this.graphRequest<PlannerTask>('/planner/tasks', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Update an existing task
   */
  async updateTask(
    taskId: string,
    update: UpdatePlannerTaskRequest,
    etag: string
  ): Promise<PlannerTask> {
    return this.graphRequest<PlannerTask>(`/planner/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'If-Match': etag,
      },
      body: JSON.stringify(update),
    });
  }

  /**
   * Update task details (description, checklist, references)
   */
  async updateTaskDetails(
    taskId: string,
    update: UpdatePlannerTaskDetailsRequest,
    etag: string
  ): Promise<PlannerTaskDetails> {
    return this.graphRequest<PlannerTaskDetails>(`/planner/tasks/${taskId}/details`, {
      method: 'PATCH',
      headers: {
        'If-Match': etag,
      },
      body: JSON.stringify(update),
    });
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string, etag: string): Promise<void> {
    await this.graphRequest<void>(`/planner/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'If-Match': etag,
      },
    });
  }

  /**
   * Mark a task as complete (sets percentComplete to 100)
   */
  async completeTask(taskId: string, etag: string): Promise<PlannerTask> {
    return this.updateTask(taskId, { percentComplete: 100 }, etag);
  }

  /**
   * Mark a task as incomplete (sets percentComplete to 0)
   */
  async uncompleteTask(taskId: string, etag: string): Promise<PlannerTask> {
    return this.updateTask(taskId, { percentComplete: 0 }, etag);
  }

  /**
   * Assign a task to a user
   */
  async assignTask(
    taskId: string,
    userId: string,
    etag: string
  ): Promise<PlannerTask> {
    return this.updateTask(
      taskId,
      {
        assignments: {
          [userId]: {
            '@odata.type': 'microsoft.graph.plannerAssignment',
            orderHint: ' !',
          },
        },
      } as UpdatePlannerTaskRequest,
      etag
    );
  }

  /**
   * Unassign a task from a user
   */
  async unassignTask(
    taskId: string,
    userId: string,
    etag: string
  ): Promise<PlannerTask> {
    return this.updateTask(
      taskId,
      {
        assignments: {
          [userId]: null,
        },
      } as unknown as UpdatePlannerTaskRequest,
      etag
    );
  }

  // ==========================================================================
  // User Lookup
  // ==========================================================================

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<{
    id: string;
    displayName: string;
    mail: string;
    userPrincipalName: string;
  }> {
    return this.graphRequest('/me?$select=id,displayName,mail,userPrincipalName');
  }

  /**
   * Search users by email or name
   */
  async searchUsers(query: string): Promise<Array<{
    id: string;
    displayName: string;
    mail: string;
    userPrincipalName: string;
  }>> {
    const filter = encodeURIComponent(
      `startswith(displayName,'${query}') or startswith(mail,'${query}') or startswith(userPrincipalName,'${query}')`
    );
    const response = await this.graphRequest<{ value: Array<{
      id: string;
      displayName: string;
      mail: string;
      userPrincipalName: string;
    }> }>(
      `/users?$filter=${filter}&$select=id,displayName,mail,userPrincipalName&$top=10`
    );
    return response.value;
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<{
    id: string;
    displayName: string;
    mail: string;
    userPrincipalName: string;
  }> {
    return this.graphRequest(`/users/${userId}?$select=id,displayName,mail,userPrincipalName`);
  }

  // ==========================================================================
  // Group Operations
  // ==========================================================================

  /**
   * Get groups the current user is a member of
   */
  async getMyGroups(): Promise<Array<{
    id: string;
    displayName: string;
    description?: string;
    groupTypes: string[];
  }>> {
    const response = await this.graphRequest<{ value: Array<{
      id: string;
      displayName: string;
      description?: string;
      groupTypes: string[];
    }> }>('/me/memberOf/microsoft.graph.group?$select=id,displayName,description,groupTypes');
    // Filter to Microsoft 365 groups (which can have Planner plans)
    return response.value.filter(g => g.groupTypes?.includes('Unified'));
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let plannerClientInstance: PlannerClient | null = null;

/**
 * Get or create the Planner client singleton
 */
export function getPlannerClient(
  getAccessToken: () => Promise<string | null>,
  config?: Partial<PlannerConfig>
): PlannerClient {
  if (!plannerClientInstance) {
    plannerClientInstance = new PlannerClient(getAccessToken, config);
  }
  return plannerClientInstance;
}

/**
 * Reset the Planner client (useful for testing or logout)
 */
export function resetPlannerClient(): void {
  plannerClientInstance = null;
}
