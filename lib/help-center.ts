"use server";

import { CLIENT_KEY } from "./help-center-config";

const base_url = 'https://v2.starko.one';
// const base_url = 'http://localhost:3000';

export const getWorkspaceInfo = async (): Promise<{
  ok: boolean;
  message: string;
  data: {
    logo: string | null;
    name: string | null;
    description?: string | null;
    color: string | null;
    greeting_message: string | null;
    translations?: {
      navigation?: {
        messages_page?: string;
      };
    };
  };
}> => {
  try {
    const response = await fetch(`${base_url}/api/v1/workspace`, {
      headers: {
        'x-starko-workspace-id': CLIENT_KEY
      },
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    throw error;
  }
}

export const getCategories = async (): Promise<{
  ok: boolean;
  message: string;
  data: Array<{
    id: string;
    name: string;
    description: string;
    created_at: string;
    updated_at: string | null;
    thumbnail_url: string | null;
  }>;
}> => {
  try {
    const response = await fetch(`${base_url}/api/v1/categories`, {
      headers: {
        'x-starko-workspace-id': CLIENT_KEY
      },
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    throw error;
  }
}

export const getSingleCategory = async (id: string): Promise<{
  ok: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    description: string;
    created_at: string;
    updated_at: string | null;
    thumbnail_url: string | null;
    sub_categories: Array<{
      id: string;
      name: string;
      description: string;
      created_at: string;
      updated_at: string | null;
      thumbnail_url: string | null;
    }>;
  };
}> => {
  try {
    const response = await fetch(`${base_url}/api/v1/categories/${id}`, {
      headers: {
        'x-starko-workspace-id': CLIENT_KEY
      },
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    throw error;
  }
}

export const getArticles = async (params?: { 
  title?: string; 
  id?: string; 
  page?: number; 
  limit?: number; 
  categoryid?: string; 
  sub_category?: string 
}): Promise<{
  ok: boolean;
  message: string;
  data: {
    articles: Array<{
      id: string;
      title: string;
      content: string;
      text_content: string;
      created_at: string;
      updated_at: string | null;
      thumbnail: string | null;
      category_name: string;
      category_id: string;
    }>;
    pagination: {
      total_count: number;
      has_next: boolean;
      has_previous: boolean;
      next_page: number;
      previous_page: number;
      current_page: number;
      total_pages: number;
    };
  };
}> => {
  try {
    let url = `${base_url}/api/v1/articles`;
    const queryParams = new URLSearchParams();
    queryParams.append('extended', 'true');
    
    if (params) {
      if (params.title) queryParams.append('title', params.title);
      if (params.id) queryParams.append('id', params.id);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.categoryid) queryParams.append('category', params.categoryid);
      if (params.sub_category) queryParams.append('sub_category', params.sub_category);
    }
    
    const queryString = queryParams.toString();
    url += `?${queryString}`;

    const response = await fetch(url, {
      headers: {
        'x-starko-workspace-id': CLIENT_KEY,
      },
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    throw error;
  }
}

export const getSingleArticle = async (articleId: string): Promise<{
  ok: boolean;
  message: string;
  data: {
    id: string;
    title: string;
    content: string;
    created_at: string;
    updated_at: string | null;
    thumbnail: string | null;
    author_name: string | null;
    author_email: string | null;
    author_image: string | null;
    author_id: string | null;
    category_name: string | null;
    category_id: string | null;
  };
}> => {
  try {
    const response = await fetch(`${base_url}/api/v1/articles/${articleId}`, {
      headers: {
        'x-starko-workspace-id': CLIENT_KEY,
      },
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    throw error;
  }
}

export const submitArticleFeedback = async (
  articleId: string, 
  score: 'positive' | 'neutral' | 'negative'
): Promise<{
  ok: boolean;
  message: string;
}> => {
  try {
    const response = await fetch(`${base_url}/api/v1/articles/${articleId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-starko-workspace-id': CLIENT_KEY,
      },
      body: JSON.stringify({ score }),
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Submitted feedback:", data);
    return data;

  } catch (error) {
    console.error("Failed to submit feedback:", error);
    throw error;
  }
}



///User Managment

/**
 * Parse API response that may be plain JSON or a stream/multiplexed format
 * (e.g. "1:{\"ok\":true,\"data\":{...}}" or multiple such lines).
 */
function parseUserApiResponse(text: string): any {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Stream format: lines like "0:{...}" or "1:D{...}" or "1:{\"ok\":true,...}"
    let lastOk: any = null;
    for (const line of trimmed.split("\n")) {
      const afterColon = line.indexOf(":");
      if (afterColon === -1) continue;
      let jsonStr = line.slice(afterColon + 1).trim();
      if (jsonStr.length > 1 && jsonStr[1] === "{") {
        jsonStr = jsonStr.slice(1);
      }
      if (jsonStr.startsWith("{")) {
        try {
          const obj = JSON.parse(jsonStr);
          if (obj && typeof obj === "object" && "ok" in obj) lastOk = obj;
        } catch {
          /* ignore */
        }
      }
    }
    if (lastOk) return lastOk;
    throw new SyntaxError("No valid JSON in response");
  }
}

export const registerUser = async (email: string, clientKey: string, name: string): Promise<any> => {
    try {
        const response = await fetch(`${base_url}/api/v1/user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-starko-workspace-id': clientKey
            },
            // Remove no-cors mode since it prevents reading response data
            body: JSON.stringify({
                email: email,
                type: 'register',
                name: name
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        return parseUserApiResponse(text);
    } catch (error) {
        // Re-throw error to be handled by caller
        throw error;
    }
}

export const verifyEmail = async (code: string, email: string, clientKey: string): Promise<any> => {
    try {
        const response = await fetch(`${base_url}/api/v1/user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-starko-workspace-id': clientKey
            },
            body: JSON.stringify({
                email: email,
                type: 'verify',
                code: code
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        return parseUserApiResponse(text);
    } catch (error) {
        throw error;
    }
}

export const resendVerificationEmail = async (email: string, clientKey: string): Promise<any> => {
    try {
        const response = await fetch(`${base_url}/api/v1/user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-starko-workspace-id': clientKey
            },
            body: JSON.stringify({
                email: email,
                type: 'resend-code'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        return parseUserApiResponse(text);
    } catch (error) {
        throw error;
    }
}

export const getUser = async (clientKey: string, token: string): Promise<any> => {
    try {
        const response = await fetch(`${base_url}/api/v1/user`, {
            headers: {
                'x-starko-workspace-id': clientKey,
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            localStorage.removeItem("starko-token");
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        throw error;
    }
}

///Inbox Management
export const getMessages = async (clientKey: string, token: string): Promise<any> => {
    try {
        const response = await fetch(`${base_url}/api/v1/chat`, {
            headers: {
                'x-starko-workspace-id': clientKey,
                'Authorization': `Bearer ${token}`
            },
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        throw error;
    }
}

export const sendMessage = async (clientKey: string, token: string, message: string, blocks: any): Promise<any> => {
    try {
        const response = await fetch(`${base_url}/api/v1/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-starko-workspace-id': clientKey,
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ blocks: blocks, message: message })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        throw error;
    }
}

export const getTickets = async (
    clientKey: string,
    token: string,
    params?: { search?: string }
): Promise<any> => {
    try {
        const url = new URL(`${base_url}/api/v1/ticket`);
        if (params?.search?.trim()) {
            url.searchParams.set("search", params.search.trim());
        }
        const response = await fetch(url.toString(), {
            headers: {
                "x-starko-workspace-id": clientKey,
                Authorization: `Bearer ${token}`,
            },
            method: "GET",
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return { ok: false, message: "Unauthorized" };
        }
        throw error;
    }
};

export const getSingleTicket = async (
    clientKey: string,
    token: string,
    ticketId: string
): Promise<any> => {
    try {
        const response = await fetch(`${base_url}/api/v1/ticket/${ticketId}`, {
            headers: {
                "x-starko-workspace-id": clientKey,
                Authorization: `Bearer ${token}`,
            },
            method: "GET",
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return { ok: false, message: "Unauthorized" };
        }
        throw error;
    }
};

export const createTicket = async (
    clientKey: string,
    token: string,
    title: string,
    description: string,
    attachments: string[] = [],
    priority?: string
): Promise<any> => {
    try {
        const body: { title: string; description: string; attachments: string[]; priority?: string } = {
            title,
            description,
            attachments,
        };
        if (priority != null && priority !== "") {
            body.priority = priority;
        }
        const response = await fetch(`${base_url}/api/v1/ticket`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-starko-workspace-id": clientKey,
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        throw error;
    }
};
