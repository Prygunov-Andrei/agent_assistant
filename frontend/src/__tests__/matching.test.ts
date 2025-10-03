// Mock apiClient
const mockPost = jest.fn();
const mockGet = jest.fn();

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    post: mockPost,
    get: mockGet,
  }
}));

import { MatchingService, useMatching } from '../services/matching';
// import { API_BASE_URL } from '../config/api';

import type { 
  PersonMatchingRequest,
  PersonMatchingResult,
  CompanyMatchingRequest,
  CompanyMatchingResult,
  ProjectMatchingRequest,
  ProjectMatchingResult,
  SearchConfig 
} from '../types/matching';

describe('MatchingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchPersons', () => {
    it('should search persons successfully', async () => {
      const mockRequest: PersonMatchingRequest = {
        name: 'Иван Петров',
        email: 'ivan@example.com',
        person_type: 'director',
      };

      const mockResults: PersonMatchingResult[] = [
        {
          id: 1,
          name: 'Иван Петров',
          type: 'director',
          email: 'ivan@example.com',
          confidence: 0.95,
          match_type: 'exact',
          matched_fields: ['name', 'email'],
        },
      ];

      const mockResponse = {
        data: mockResults,
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await MatchingService.searchPersons(mockRequest);

      expect(mockPost).toHaveBeenCalledWith('/api/persons/search-matches/', mockRequest);
      expect(result).toEqual(mockResults);
    });

    it('should throw error when API call fails', async () => {
      const mockRequest: PersonMatchingRequest = {
        name: 'Иван Петров',
      };

      mockPost.mockRejectedValueOnce(new Error('Network error'));

      await expect(MatchingService.searchPersons(mockRequest)).rejects.toThrow('Network error');
    });
  });

  describe('searchCompanies', () => {
    it('should search companies successfully', async () => {
      const mockRequest: CompanyMatchingRequest = {
        name: 'Кинокомпания "Студия"',
        website: 'https://studio.com',
      };

      const mockResults: CompanyMatchingResult[] = [
        {
          id: 1,
          name: 'Кинокомпания "Студия"',
          description: 'Производственная компания',
          website: 'https://studio.com',
          confidence: 0.9,
          match_type: 'high',
          matched_fields: ['name', 'website'],
        },
      ];

      const mockResponse = {
        data: mockResults,
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await MatchingService.searchCompanies(mockRequest);

      expect(mockPost).toHaveBeenCalledWith('/api/companies/search-matches/', mockRequest);
      expect(result).toEqual(mockResults);
    });

    it('should throw error when API call fails', async () => {
      const mockRequest: CompanyMatchingRequest = {
        name: 'Кинокомпания "Студия"',
      };

      mockPost.mockRejectedValueOnce(new Error('Network error'));

      await expect(MatchingService.searchCompanies(mockRequest)).rejects.toThrow('Network error');
    });
  });

  describe('searchProjects', () => {
    it('should search projects successfully', async () => {
      const mockRequest: ProjectMatchingRequest = {
        title: 'Новый фильм',
        description: 'Драматическая история',
      };

      const mockResults: ProjectMatchingResult[] = [
        {
          id: 1,
          title: 'Новый фильм',
          description: 'Драматическая история о жизни',
          status: 'draft',
          confidence: 0.85,
          match_type: 'high',
          matched_fields: ['title', 'description'],
        },
      ];

      const mockResponse = {
        data: mockResults,
      };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await MatchingService.searchProjects(mockRequest);

      expect(mockPost).toHaveBeenCalledWith('/api/projects/search-matches/', mockRequest);
      expect(result).toEqual(mockResults);
    });

    it('should throw error when API call fails', async () => {
      const mockRequest: ProjectMatchingRequest = {
        title: 'Новый фильм',
      };

      mockPost.mockRejectedValueOnce(new Error('Network error'));

      await expect(MatchingService.searchProjects(mockRequest)).rejects.toThrow('Network error');
    });
  });

  describe('getSearchConfig', () => {
    it('should get search config successfully', async () => {
      const mockConfig: SearchConfig = {
        thresholds: {
          exact: 0.95,
          high: 0.8,
          medium: 0.6,
          low: 0.4,
        },
        limits: {
          persons: 10,
          companies: 10,
          projects: 10,
        },
      };

      const mockResponse = {
        data: mockConfig,
      };

      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await MatchingService.getSearchConfig();

      expect(mockGet).toHaveBeenCalledWith('/api/search/config/');
      expect(result).toEqual(mockConfig);
    });

    it('should throw error when API call fails', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      await expect(MatchingService.getSearchConfig()).rejects.toThrow('Network error');
    });
  });

  describe('getPersonsByType', () => {
    it('should get persons by type successfully', async () => {
      const mockPersons = [
        {
          id: 1,
          name: 'Иван Петров',
          type: 'director',
          email: 'ivan@example.com',
        },
        {
          id: 2,
          name: 'Петр Иванов',
          type: 'director',
          email: 'petr@example.com',
        },
      ];

      const mockResponse = {
        data: mockPersons,
      };

      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await MatchingService.getPersonsByType('director');

      expect(mockGet).toHaveBeenCalledWith('/api/persons/by-type/?type=director');
      expect(result).toEqual(mockPersons);
    });

    it('should throw error when API call fails', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      await expect(MatchingService.getPersonsByType('director')).rejects.toThrow('Network error');
    });
  });
});

describe('useMatching', () => {
  it('should return all matching service methods', () => {
    const matching = useMatching();

    expect(typeof matching.searchPersons).toBe('function');
    expect(typeof matching.searchCompanies).toBe('function');
    expect(typeof matching.searchProjects).toBe('function');
    expect(typeof matching.getSearchConfig).toBe('function');
    expect(typeof matching.getPersonsByType).toBe('function');
  });

  it('should call MatchingService methods', async () => {
    const mockRequest: PersonMatchingRequest = {
      name: 'Иван Петров',
    };

    const mockResults: PersonMatchingResult[] = [
      {
        id: 1,
        name: 'Иван Петров',
        type: 'director',
        confidence: 0.95,
        match_type: 'exact',
        matched_fields: ['name'],
      },
    ];

    const mockResponse = {
      data: mockResults,
    };

    mockPost.mockResolvedValueOnce(mockResponse);

    const matching = useMatching();
    const result = await matching.searchPersons(mockRequest);

    expect(result).toEqual(mockResults);
  });
});
