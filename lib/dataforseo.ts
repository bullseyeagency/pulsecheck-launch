/**
 * DataForSEO API Client
 * Documentation: https://docs.dataforseo.com/v3/
 */

interface DataForSEOCredentials {
  login: string;
  password: string;
}

interface KeywordData {
  keyword: string;
  search_volume?: number;
  competition?: string; // "HIGH", "MEDIUM", "LOW"
  competition_index?: number; // 0-100 numeric value
  cpc?: number;
  monthly_searches?: Array<{
    year: number;
    month: number;
    search_volume: number;
  }>;
}

interface AdTrafficData {
  keyword: string;
  location_code: number;
  language_code: string;
  search_partners: boolean;
  competition?: string;
  competition_index?: number;
  search_volume?: number;
  low_top_of_page_bid?: number;
  high_top_of_page_bid?: number;
  cpc?: number;
  monthly_searches?: Array<{
    year: number;
    month: number;
    search_volume: number;
  }>;
  impressions?: number;
  cost?: number;
  clicks?: number;
  ctr?: number;
  average_cpc?: number;
}

interface KeywordResponse {
  status_code: number;
  status_message: string;
  tasks: Array<{
    status_code: number;
    result: KeywordData[];
  }>;
}

interface Location {
  location_code: number;
  location_name: string;
  location_code_parent: number | null;
  country_iso_code: string;
  location_type: string;
}

interface LocationsResponse {
  status_code: number;
  status_message: string;
  tasks: Array<{
    status_code: number;
    result: Location[];
  }>;
}

interface SerpItem {
  type: string;
  rank_group: number;
  rank_absolute: number;
  position: string;
  xpath: string;
  domain: string;
  title?: string;
  description?: string;
  url?: string;
  breadcrumb?: string;
  is_image?: boolean;
  is_video?: boolean;
  is_featured_snippet?: boolean;
  is_malicious?: boolean;
  rating?: {
    rating_type: string;
    value: number;
    votes_count: number;
    rating_max: number;
  };
  highlighted?: string[];
}

interface SerpResult {
  keyword: string;
  type: string;
  se_domain: string;
  location_code: number;
  language_code: string;
  check_url: string;
  datetime: string;
  spell?: any;
  item_types: string[];
  se_results_count: number;
  items_count: number;
  items: SerpItem[];
}

interface SerpResponse {
  status_code: number;
  status_message: string;
  tasks: Array<{
    status_code: number;
    result: SerpResult[];
  }>;
}

interface AdTrafficResponse {
  status_code: number;
  status_message: string;
  tasks: Array<{
    status_code: number;
    result: AdTrafficData[];
  }>;
}

interface MerchantProduct {
  type: string;
  rank_group?: number;
  rank_absolute?: number;
  position?: string;
  xpath?: string;
  title?: string;
  description?: string;
  url?: string;
  domain?: string;
  tags?: string[] | null;
  // API returns price as a simple number for carousel elements
  price?: number | {
    current: number;
    regular?: number;
    max_value?: number;
    currency: string;
    is_price_range: boolean;
    displayed_price?: string;
  };
  currency?: string; // For carousel elements, currency is separate
  // API uses product_rating for carousel elements
  product_rating?: {
    type: string;
    position: string;
    rating_type: string;
    value: number;
    votes_count: number;
    rating_max: number;
  };
  rating?: {
    rating_type: string;
    value: number;
    votes_count: number;
    rating_max: number;
  };
  product_images?: string[];
  shop_ad_aclk?: string;
  shopping_url?: string;
  seller?: string; // For carousel elements
  seller_name?: string; // For SERP elements
  delivery_info?: {
    delivery_message: string;
    delivery_price?: {
      current: number;
      regular?: number | null;
      max_value?: number | null;
      currency: string;
      is_price_range: boolean;
      displayed_price: string;
    };
  } | string;
  special_offer_info?: any;
  product_id?: string;
  data_docid?: string;
  gid?: string;
}

interface MerchantTaskPostResponse {
  status_code: number;
  status_message: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: Array<{
    id: string;
    status_code: number;
    status_message: string;
    cost: number;
  }>;
}

interface MerchantProductsResult {
  keyword: string;
  type: string;
  se_domain: string;
  location_code: number;
  language_code: string;
  check_url: string;
  datetime: string;
  item_types: string[];
  se_results_count: number;
  items_count: number;
  items: MerchantProduct[];
}

interface MerchantTaskGetResponse {
  status_code: number;
  status_message: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: Array<{
    id: string;
    status_code: number;
    status_message: string;
    cost: number;
    result_count: number;
    path: string[];
    data: {
      api: string;
      function: string;
    };
    result: MerchantProductsResult[];
  }>;
}

interface MerchantSeller {
  type: string;
  seller_name: string;
  seller_url?: string;
  rating?: {
    rating_type: string;
    value: number;
    votes_count: number;
    rating_max: number;
  };
  reviews_count?: number;
  seller_id?: string;
  price_range?: string;
}

interface MerchantSellersResult {
  keyword: string;
  type: string;
  se_domain: string;
  location_code: number;
  language_code: string;
  check_url: string;
  datetime: string;
  items_count: number;
  items: MerchantSeller[];
}

interface MerchantProductInfo {
  product_id: string;
  type: string;
  title?: string;
  description?: string;
  brand?: string;
  manufacturer?: string;
  specifications?: Record<string, string>;
  images?: string[];
  videos?: string[];
  variants?: Array<{
    type: string;
    value: string;
  }>;
}

interface MerchantProductInfoResult {
  product_id: string;
  type: string;
  se_domain: string;
  location_code: number;
  language_code: string;
  datetime: string;
  items_count: number;
  items: MerchantProductInfo[];
}

interface MerchantReview {
  type: string;
  rank_group: number;
  rank_absolute: number;
  rating?: {
    rating_type: string;
    value: number;
    votes_count: number;
    rating_max: number;
  };
  verified?: boolean;
  reviews_count?: number;
  title?: string;
  review_text?: string;
  timestamp?: string;
  helpful_count?: number;
}

interface MerchantReviewsResult {
  product_id: string;
  type: string;
  se_domain: string;
  location_code: number;
  language_code: string;
  check_url: string;
  datetime: string;
  rating?: {
    rating_type: string;
    value: number;
    votes_count: number;
    rating_max: number;
  };
  rating_distribution?: Record<string, number>;
  items_count: number;
  items: MerchantReview[];
}

class DataForSEOClient {
  private baseUrl = 'https://api.dataforseo.com/v3';
  private credentials: DataForSEOCredentials;

  constructor() {
    this.credentials = {
      login: process.env.DATAFORSEO_LOGIN || '',
      password: process.env.DATAFORSEO_PASSWORD || '',
    };

    if (!this.credentials.login || !this.credentials.password) {
      console.warn('DataForSEO credentials not found in environment variables');
    }
  }

  private async request<T>(endpoint: string, data?: unknown): Promise<T> {
    const auth = Buffer.from(
      `${this.credentials.login}:${this.credentials.password}`
    ).toString('base64');

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`DataForSEO API error: ${response.statusText}`);
    }

    return response.json();
  }

  private async get<T>(endpoint: string): Promise<T> {
    const auth = Buffer.from(
      `${this.credentials.login}:${this.credentials.password}`
    ).toString('base64');

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      throw new Error(`DataForSEO API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get keyword data for a specific keyword
   * @param keyword - The keyword to research
   * @param location - Location code (default: 2840 for USA)
   * @param language - Language code (default: en)
   */
  async getKeywordData(
    keyword: string,
    location: number = 2840,
    language: string = 'en'
  ): Promise<KeywordData | null> {
    try {
      const response = await this.request<KeywordResponse>(
        '/keywords_data/google_ads/search_volume/live',
        [{
          keywords: [keyword],
          location_code: location,
          language_code: language,
        }]
      );

      // Result is directly in the array
      const result = response.tasks?.[0]?.result?.[0];
      return result || null;
    } catch (error) {
      console.error('Error fetching keyword data:', error);
      throw error;
    }
  }

  /**
   * Get keyword suggestions based on a seed keyword
   * @param keyword - The seed keyword
   * @param location - Location code (default: 2840 for USA)
   * @param language - Language code (default: en)
   * @param limit - Maximum number of suggestions to return
   */
  async getKeywordSuggestions(
    keyword: string,
    location: number = 2840,
    language: string = 'en',
    limit: number = 50
  ): Promise<KeywordData[]> {
    try {
      console.log('DataForSEO API Request:', {
        endpoint: '/keywords_data/google_ads/keywords_for_keywords/live',
        keyword,
        location,
        language,
        limit
      });

      const response = await this.request<KeywordResponse>(
        '/keywords_data/google_ads/keywords_for_keywords/live',
        [{
          keywords: [keyword],
          location_code: location,
          language_code: language,
          search_partners: false,
          include_seed_keyword: true,
          limit: limit,
        }]
      );

      // The result is directly in tasks[0].result array
      const items = response.tasks?.[0]?.result || [];
      console.log('Extracted items:', items.length);

      return items;
    } catch (error) {
      console.error('Error fetching keyword suggestions:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  /**
   * Get batch keyword data for multiple keywords
   * @param keywords - Array of keywords to research
   * @param location - Location code (default: 2840 for USA)
   * @param language - Language code (default: en)
   */
  async getBatchKeywordData(
    keywords: string[],
    location: number = 2840,
    language: string = 'en'
  ): Promise<KeywordData[]> {
    try {
      console.log('DataForSEO Batch Request:', {
        endpoint: '/keywords_data/google_ads/search_volume/live',
        keywords,
        location,
        language
      });

      const response = await this.request<KeywordResponse>(
        '/keywords_data/google_ads/search_volume/live',
        [{
          keywords: keywords,
          location_code: location,
          language_code: language,
        }]
      );

      console.log('DataForSEO Batch Response status:', response.status_code);

      // Result is directly in the array, same as getKeywordSuggestions
      const results = response.tasks?.[0]?.result || [];
      console.log('Extracted batch results:', results.length);

      return results;
    } catch (error) {
      console.error('Error fetching batch keyword data:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      throw error;
    }
  }

  /**
   * Get available locations for keyword research
   * Returns list of countries, states, cities, etc. with their location codes
   * Results are typically cached since locations don't change frequently
   */
  async getLocations(): Promise<Location[]> {
    try {
      console.log('DataForSEO Locations Request');

      const response = await this.get<LocationsResponse>(
        '/keywords_data/google_ads/locations'
      );

      console.log('DataForSEO Locations Response status:', response.status_code);

      const locations = response.tasks?.[0]?.result || [];
      console.log('Extracted locations:', locations.length);

      return locations;
    } catch (error) {
      console.error('Error fetching locations:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      throw error;
    }
  }

  /**
   * Get keyword suggestions based on a competitor's website/URL
   * @param target - The website URL or domain to analyze
   * @param location - Location code (default: 2840 for USA)
   * @param language - Language code (default: en)
   * @param limit - Maximum number of suggestions to return
   */
  async getKeywordsForSite(
    target: string,
    location: number = 2840,
    language: string = 'en',
    limit: number = 50
  ): Promise<KeywordData[]> {
    try {
      console.log('DataForSEO Keywords for Site Request:', {
        endpoint: '/keywords_data/google_ads/keywords_for_site/live',
        target,
        location,
        language,
        limit
      });

      const response = await this.request<KeywordResponse>(
        '/keywords_data/google_ads/keywords_for_site/live',
        [{
          target: target,
          location_code: location,
          language_code: language,
          search_partners: false,
          limit: limit,
        }]
      );

      const items = response.tasks?.[0]?.result || [];
      console.log('Extracted keywords for site:', items.length);

      return items;
    } catch (error) {
      console.error('Error fetching keywords for site:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  /**
   * Get Google SERP (Search Engine Results Page) data for a keyword
   * Shows actual search results, rankings, and SERP features
   * @param keyword - The search query
   * @param location - Location code (default: 2840 for USA)
   * @param language - Language code (default: en)
   * @param depth - Number of results to return (max 100, default 10)
   */
  async getSerpData(
    keyword: string,
    location: number = 2840,
    language: string = 'en',
    depth: number = 10
  ): Promise<SerpResult | null> {
    try {
      console.log('DataForSEO SERP Request:', {
        endpoint: '/serp/google/organic/live/advanced',
        keyword,
        location,
        language,
        depth
      });

      const response = await this.request<SerpResponse>(
        '/serp/google/organic/live/advanced',
        [{
          keyword: keyword,
          location_code: location,
          language_code: language,
          device: 'desktop',
          os: 'windows',
          depth: depth,
          calculate_rectangles: false,
        }]
      );

      const result = response.tasks?.[0]?.result?.[0] || null;
      if (result) {
        console.log('SERP data received:', {
          keyword: result.keyword,
          totalResults: result.se_results_count,
          itemsReturned: result.items_count,
          itemTypes: result.item_types
        });
      }

      return result;
    } catch (error) {
      console.error('Error fetching SERP data:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  /**
   * Get ad traffic estimates for keywords
   * Shows impressions, clicks, cost, and CTR for Google Ads
   * @param keywords - Array of keywords to analyze
   * @param location - Location code (default: 2840 for USA)
   * @param language - Language code (default: en)
   */
  async getAdTrafficByKeywords(
    keywords: string[],
    location: number = 2840,
    language: string = 'en'
  ): Promise<AdTrafficData[]> {
    try {
      console.log('DataForSEO Ad Traffic Request:', {
        endpoint: '/keywords_data/google_ads/ad_traffic_by_keywords/live',
        keywords,
        location,
        language
      });

      const response = await this.request<AdTrafficResponse>(
        '/keywords_data/google_ads/ad_traffic_by_keywords/live',
        [{
          keywords: keywords,
          location_code: location,
          language_code: language,
          search_partners: false,
          date_from: this.getDateMonthsAgo(1), // Last month
          date_to: this.getCurrentDate(),
        }]
      );

      const results = response.tasks?.[0]?.result || [];
      console.log('Ad traffic data received:', results.length, 'keywords');

      return results;
    } catch (error) {
      console.error('Error fetching ad traffic data:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  /**
   * Helper: Get current date in YYYY-MM-DD format
   */
  private getCurrentDate(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  /**
   * Helper: Get date N months ago in YYYY-MM-DD format
   */
  private getDateMonthsAgo(months: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date.toISOString().split('T')[0];
  }

  /**
   * Create a Google Shopping products search task
   * @param keyword - Product search query
   * @param location - Location code (default: 2840 for USA)
   * @param language - Language code (default: en)
   * @returns Task ID for retrieving results
   */
  async createMerchantProductsTask(
    keyword: string,
    location: number = 2840,
    language: string = 'en'
  ): Promise<string> {
    try {
      console.log('DataForSEO Merchant Products Task POST:', {
        endpoint: '/merchant/google/products/task_post',
        keyword,
        location,
        language
      });

      const response = await this.request<MerchantTaskPostResponse>(
        '/merchant/google/products/task_post',
        [{
          keyword: keyword,
          location_code: location,
          language_code: language,
          depth: 100,
          priority: 2,
        }]
      );

      const taskId = response.tasks?.[0]?.id;

      console.log('Full API response:', JSON.stringify(response, null, 2));

      if (!taskId) {
        console.error('❌ No task ID in response!');
        console.error('Response tasks:', response.tasks);
        throw new Error('No task ID returned from DataForSEO API');
      }

      console.log('✅ Task created successfully:', {
        id: taskId,
        cost: response.cost,
        status: response.tasks?.[0]?.status_message,
        status_code: response.tasks?.[0]?.status_code
      });

      return taskId;
    } catch (error) {
      console.error('Error creating merchant products task:', error);
      throw error;
    }
  }

  /**
   * Get Google Shopping products results for a completed task
   * @param taskId - Task ID from createMerchantProductsTask
   * @returns Product listings with prices, ratings, sellers
   */
  async getMerchantProductsResults(
    taskId: string
  ): Promise<MerchantProductsResult | null> {
    try {
      console.log('DataForSEO Merchant Products Task GET:', {
        endpoint: `/merchant/google/products/task_get/advanced/${taskId}`,
        taskId
      });

      const response = await this.get<MerchantTaskGetResponse>(
        `/merchant/google/products/task_get/advanced/${taskId}`
      );

      const result = response.tasks?.[0]?.result?.[0] || null;

      if (result) {
        console.log('✅ Products data received:', {
          keyword: result.keyword,
          totalResults: result.se_results_count,
          itemsReturned: result.items_count,
          items: result.items?.length || 0,
          itemTypes: result.items?.map((i: any) => i.type) || []
        });

        // Return result with original structure (categories preserved)
        // The merchant-report page will handle flattening if needed
        return result;
      } else {
        console.log('⏳ Products task not ready yet');
      }

      return result;
    } catch (error) {
      console.error('⚠️  Error fetching merchant products results:', error);
      // If task not ready or not found, return null (not ready yet)
      // This allows polling to continue
      return null;
    }
  }

  /**
   * Create a Google Shopping sellers search task
   * @param keyword - Product category or keyword
   * @param location - Location code (default: 2840 for USA)
   * @param language - Language code (default: en)
   * @returns Task ID for retrieving results
   */
  async createMerchantSellersTask(
    keyword: string,
    location: number = 2840,
    language: string = 'en'
  ): Promise<string> {
    try {
      console.log('DataForSEO Merchant Sellers Task POST:', {
        endpoint: '/merchant/google/sellers/task_post',
        keyword,
        location,
        language
      });

      const response = await this.request<MerchantTaskPostResponse>(
        '/merchant/google/sellers/task_post',
        [{
          keyword: keyword,
          location_code: location,
          language_code: language,
          // Note: Sellers API doesn't use 'depth' parameter
        }]
      );

      const taskId = response.tasks?.[0]?.id;

      console.log('Full Sellers API response:', JSON.stringify(response, null, 2));

      if (!taskId) {
        console.error('❌ No task ID in sellers response!');
        console.error('Response tasks:', response.tasks);
        throw new Error('No task ID returned from DataForSEO Sellers API');
      }

      console.log('✅ Sellers task created successfully:', {
        id: taskId,
        cost: response.cost,
        status: response.tasks?.[0]?.status_message,
        status_code: response.tasks?.[0]?.status_code
      });

      return taskId;
    } catch (error) {
      console.error('Error creating merchant sellers task:', error);
      throw error;
    }
  }

  /**
   * Get Google Shopping sellers results for a completed task
   * @param taskId - Task ID from createMerchantSellersTask
   * @returns Seller listings with ratings and reviews
   */
  async getMerchantSellersResults(
    taskId: string
  ): Promise<MerchantSellersResult | null> {
    try {
      const response = await this.get<any>(
        `/merchant/google/sellers/task_get/advanced/${taskId}`
      );

      const result = response.tasks?.[0]?.result?.[0] || null;
      if (result) {
        console.log('✅ Sellers data received:', { itemsReturned: result.items_count });
      } else {
        console.log('⏳ Sellers task not ready yet');
      }

      return result;
    } catch (error) {
      console.error('⚠️  Error fetching merchant sellers results:', error);
      // If task not ready or not found, return null (not ready yet)
      // This allows polling to continue
      return null;
    }
  }

  /**
   * Create a product info task for detailed product specifications
   * @param productId - Product ID from products search
   * @param location - Location code (default: 2840 for USA)
   * @param language - Language code (default: en)
   * @returns Task ID for retrieving results
   */
  async createMerchantProductInfoTask(
    productId: string,
    location: number = 2840,
    language: string = 'en'
  ): Promise<string> {
    try {
      console.log('DataForSEO Merchant Product Info Task POST:', {
        endpoint: '/merchant/google/product_info/task_post',
        productId,
        location,
        language
      });

      const response = await this.request<MerchantTaskPostResponse>(
        '/merchant/google/product_info/task_post',
        [{
          product_id: productId,
          location_code: location,
          language_code: language,
          priority: 2,
        }]
      );

      const taskId = response.tasks?.[0]?.id;
      if (!taskId) {
        throw new Error('No task ID returned from API');
      }

      console.log('Product info task created:', { id: taskId, cost: response.cost });
      return taskId;
    } catch (error) {
      console.error('Error creating merchant product info task:', error);
      throw error;
    }
  }

  /**
   * Get product info results for a completed task
   * @param taskId - Task ID from createMerchantProductInfoTask
   * @returns Detailed product specifications
   */
  async getMerchantProductInfoResults(
    taskId: string
  ): Promise<MerchantProductInfoResult | null> {
    try {
      const response = await this.get<any>(
        `/merchant/google/product_info/task_get/advanced/${taskId}`
      );

      const result = response.tasks?.[0]?.result?.[0] || null;
      if (result) {
        console.log('Product info data received:', { productId: result.product_id });
      }

      return result;
    } catch (error) {
      console.error('Error fetching merchant product info results:', error);
      throw error;
    }
  }

  /**
   * Create a product reviews task
   * @param productId - Product ID from products search
   * @param location - Location code (default: 2840 for USA)
   * @param language - Language code (default: en)
   * @returns Task ID for retrieving results
   */
  async createMerchantReviewsTask(
    productId: string,
    location: number = 2840,
    language: string = 'en'
  ): Promise<string> {
    try {
      console.log('DataForSEO Merchant Reviews Task POST:', {
        endpoint: '/merchant/google/reviews/task_post',
        productId,
        location,
        language
      });

      const response = await this.request<MerchantTaskPostResponse>(
        '/merchant/google/reviews/task_post',
        [{
          product_id: productId,
          location_code: location,
          language_code: language,
          depth: 100,
          priority: 2,
        }]
      );

      const taskId = response.tasks?.[0]?.id;
      if (!taskId) {
        throw new Error('No task ID returned from API');
      }

      console.log('Reviews task created:', { id: taskId, cost: response.cost });
      return taskId;
    } catch (error) {
      console.error('Error creating merchant reviews task:', error);
      throw error;
    }
  }

  /**
   * Get product reviews results for a completed task
   * @param taskId - Task ID from createMerchantReviewsTask
   * @returns Product reviews and ratings
   */
  async getMerchantReviewsResults(
    taskId: string
  ): Promise<MerchantReviewsResult | null> {
    try {
      const response = await this.get<any>(
        `/merchant/google/reviews/task_get/advanced/${taskId}`
      );

      const result = response.tasks?.[0]?.result?.[0] || null;
      if (result) {
        console.log('Reviews data received:', {
          productId: result.product_id,
          reviewsCount: result.items_count
        });
      }

      return result;
    } catch (error) {
      console.error('Error fetching merchant reviews results:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const dataForSEO = new DataForSEOClient();

// Export types
export type {
  KeywordData,
  KeywordResponse,
  SerpItem,
  SerpResult,
  SerpResponse,
  AdTrafficData,
  AdTrafficResponse,
  MerchantProduct,
  MerchantProductsResult,
  MerchantTaskPostResponse,
  MerchantTaskGetResponse,
  MerchantSeller,
  MerchantSellersResult,
  MerchantProductInfo,
  MerchantProductInfoResult,
  MerchantReview,
  MerchantReviewsResult
};
