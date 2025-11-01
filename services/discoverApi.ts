import { apiClient, ApiResponse } from './apiClient';

// 发现内容接口
export interface DiscoverContent {
  id: string;
  title: string;
  description: string;
  content: string;
  type: 'article' | 'video' | 'image' | 'strategy' | 'news' | 'tutorial';
  category: string;
  tags: string[];
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  thumbnail?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
}

// 发现API服务类
export class DiscoverApi {
  // 获取推荐内容
  async getFeatured(
    page: number = 1,
    limit: number = 20,
    category?: string
  ): Promise<ApiResponse<{
    contents: DiscoverContent[];
    total: number;
    page: number;
    limit: number;
  }>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (category) params.append('category', category);

    return apiClient.get(`/discover/featured?${params.toString()}`);
  }
}

// 创建发现API实例
export const discoverApi = new DiscoverApi();
