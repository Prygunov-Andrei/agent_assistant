import { LLMService, useLLM } from '../llm';
import api from '../api';
import type { LLMAnalysisResult, LLMStatus, AnalysisStatus } from '../../types/llm';

// Mock api
jest.mock('../api', () => ({
  default: {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('LLMService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeRequest', () => {
    it('should analyze request successfully', async () => {
      const mockAnalysisResult: LLMAnalysisResult = {
        project_type: 'Фильм',
        project_type_raw: 'художественный фильм',
        genre: 'Драма',
        description: 'Драматическая история о...',
        roles: [],
        suggested_persons: [],
        suggested_companies: [],
        suggested_projects: [],
      };

      const mockResponse = {
        data: {
          success: true,
          data: mockAnalysisResult,
        },
      };

      mockApi.post.mockResolvedValueOnce(mockResponse);

      const result = await LLMService.analyzeRequest(1);

      expect(mockApi.post).toHaveBeenCalledWith('/api/requests/1/analyze/');
      expect(result).toEqual(mockAnalysisResult);
    });

    it('should throw error when analysis fails', async () => {
      const mockResponse = {
        data: {
          success: false,
          error: 'Ошибка анализа',
        },
      };

      mockApi.post.mockResolvedValueOnce(mockResponse);

      await expect(LLMService.analyzeRequest(1)).rejects.toThrow('Ошибка анализа');
    });

    it('should throw error when API call fails', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(LLMService.analyzeRequest(1)).rejects.toThrow('Network error');
    });
  });

  describe('getAnalysisStatus', () => {
    it('should get analysis status successfully', async () => {
      const mockResponse = {
        data: {
          status: 'analyzed' as AnalysisStatus,
        },
      };

      mockApi.get.mockResolvedValueOnce(mockResponse);

      const result = await LLMService.getAnalysisStatus(1);

      expect(mockApi.get).toHaveBeenCalledWith('/api/requests/1/analysis-status/');
      expect(result).toBe('analyzed');
    });

    it('should throw error when API call fails', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(LLMService.getAnalysisStatus(1)).rejects.toThrow('Network error');
    });
  });

  describe('getLLMStatus', () => {
    it('should get LLM status successfully', async () => {
      const mockStatus: LLMStatus = {
        is_available: true,
        is_analyzing: false,
        error_count: 0,
        success_count: 10,
      };

      const mockResponse = {
        data: mockStatus,
      };

      mockApi.get.mockResolvedValueOnce(mockResponse);

      const result = await LLMService.getLLMStatus();

      expect(mockApi.get).toHaveBeenCalledWith('/api/llm/status/');
      expect(result).toEqual(mockStatus);
    });

    it('should throw error when API call fails', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(LLMService.getLLMStatus()).rejects.toThrow('Network error');
    });
  });

  describe('getLLMConfig', () => {
    it('should get LLM config successfully', async () => {
      const mockConfig = {
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 2000,
      };

      const mockResponse = {
        data: mockConfig,
      };

      mockApi.get.mockResolvedValueOnce(mockResponse);

      const result = await LLMService.getLLMConfig();

      expect(mockApi.get).toHaveBeenCalledWith('/api/llm/config/');
      expect(result).toEqual(mockConfig);
    });

    it('should throw error when API call fails', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(LLMService.getLLMConfig()).rejects.toThrow('Network error');
    });
  });

  describe('updateRequestStatus', () => {
    it('should update request status successfully', async () => {
      mockApi.patch.mockResolvedValueOnce({ data: {} });

      await LLMService.updateRequestStatus(1, 'analyzed');

      expect(mockApi.patch).toHaveBeenCalledWith('/api/requests/1/', {
        analysis_status: 'analyzed',
      });
    });

    it('should throw error when API call fails', async () => {
      mockApi.patch.mockRejectedValueOnce(new Error('Network error'));

      await expect(LLMService.updateRequestStatus(1, 'analyzed')).rejects.toThrow('Network error');
    });
  });
});

describe('useLLM', () => {
  it('should return all LLM service methods', () => {
    const llm = useLLM();

    expect(typeof llm.analyzeRequest).toBe('function');
    expect(typeof llm.getAnalysisStatus).toBe('function');
    expect(typeof llm.getLLMStatus).toBe('function');
    expect(typeof llm.updateRequestStatus).toBe('function');
  });

  it('should call LLMService methods', async () => {
    const mockAnalysisResult: LLMAnalysisResult = {
      project_type: 'Фильм',
      project_type_raw: 'художественный фильм',
      genre: 'Драма',
      description: 'Драматическая история о...',
      roles: [],
      suggested_persons: [],
      suggested_companies: [],
      suggested_projects: [],
    };

    const mockResponse = {
      data: {
        success: true,
        data: mockAnalysisResult,
      },
    };

    mockApi.post.mockResolvedValueOnce(mockResponse);

    const llm = useLLM();
    const result = await llm.analyzeRequest(1);

    expect(result).toEqual(mockAnalysisResult);
  });
});
