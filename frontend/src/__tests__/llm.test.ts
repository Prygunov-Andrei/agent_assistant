// Тесты для LLM сервиса

import { LLMService, LLMUtils } from '../services/llm';
import apiClient from '../services/api';
// import { API_BASE_URL } from '../config/api';
import type { 
  LLMAnalysisResult, 
  LLMStatus, 
  AnalysisStatus, 
  LLMConfig,
  LLMMonitoringData,
  DatasetExportRequest,
  TrainingDataset
} from '../types/llm';

// Мокаем API
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
  }
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('LLMService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeRequest', () => {
    it('should analyze request successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            project_analysis: {
              project_title: 'Тестовый проект',
              project_type: 'Фильм',
              genre: 'Драма',
              description: 'Описание проекта',
              premiere_date: '2024-12-31',
              roles: [
                {
                  role_type: 'Актер',
                  character_name: 'Главный герой',
                  description: 'Описание роли',
                  age_range: '25-35',
                  gender: 'male',
                  suggested_artists: [1, 2],
                  skills_required: {
                    acting_skills: ['драма'],
                    physical_skills: [],
                    languages: ['русский'],
                    special_requirements: []
                  }
                }
              ],
              contacts: {
                casting_director: {
                  name: 'Кастинг-директор',
                  phone: '+7(999)123-45-67',
                  email: 'casting@example.com',
                  telegram: '@casting_director'
                },
                director: {
                  name: 'Режиссер',
                  phone: '+7(999)123-45-68',
                  email: 'director@example.com',
                  telegram: '@director'
                },
                producers: [],
                production_company: {
                  name: 'Кинокомпания',
                  phone: '+7(999)123-45-69',
                  email: 'company@example.com',
                  website: 'www.company.com'
                }
              },
              confidence: 0.8
            }
          }
        }
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await LLMService.analyzeRequest(123, true);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/api/requests/123/analyze/',
        { use_emulator: true }
      );
      expect(result.project_analysis.project_title).toBe('Тестовый проект');
      expect(result.project_analysis.roles).toHaveLength(1);
    });

    it('should handle analysis error', async () => {
      const mockResponse = {
        data: {
          success: false,
          error: 'Ошибка анализа'
        }
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      await expect(LLMService.analyzeRequest(123, true)).rejects.toThrow('Ошибка анализа');
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: null
        }
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      await expect(LLMService.analyzeRequest(123, true)).rejects.toThrow('Пустой ответ от LLM');
    });
  });

  describe('getAnalysisStatus', () => {
    it('should get analysis status successfully', async () => {
      const mockResponse = {
        data: {
          status: 'analyzed' as AnalysisStatus
        }
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await LLMService.getAnalysisStatus(123);

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/requests/123/analysis-status/');
      expect(result).toBe('analyzed');
    });
  });

  describe('getLLMStatus', () => {
    it('should get LLM status successfully', async () => {
      const mockResponse = {
        data: {
          is_available: true,
          model: 'gpt-4o',
          use_emulator: true,
          last_check: '2024-01-15T10:30:00Z'
        } as LLMStatus
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await LLMService.getLLMStatus();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/llm/status/');
      expect(result.is_available).toBe(true);
      expect(result.model).toBe('gpt-4o');
    });
  });

  describe('getLLMConfig', () => {
    it('should get LLM config successfully', async () => {
      const mockResponse = {
        data: {
          model: 'gpt-4o',
          temperature: 0.3,
          max_tokens: 2000,
          max_retries: 3,
          timeout: 30,
          use_emulator: true
        } as LLMConfig
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await LLMService.getLLMConfig();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/llm/config/');
      expect(result.model).toBe('gpt-4o');
      expect(result.use_emulator).toBe(true);
    });
  });

  describe('updateLLMConfig', () => {
    it('should update LLM config successfully', async () => {
      const configUpdate = { temperature: 0.5 };
      const mockResponse = {
        data: {
          model: 'gpt-4o',
          temperature: 0.5,
          max_tokens: 2000,
          max_retries: 3,
          timeout: 30,
          use_emulator: true
        } as LLMConfig
      };

      mockApiClient.put.mockResolvedValue(mockResponse);

      const result = await LLMService.updateLLMConfig(configUpdate);

      expect(mockApiClient.put).toHaveBeenCalledWith('/api/llm/config/', configUpdate);
      expect(result.temperature).toBe(0.5);
    });
  });

  describe('updateRequestStatus', () => {
    it('should update request status successfully', async () => {
      mockApiClient.patch.mockResolvedValue({ data: {} });

      await LLMService.updateRequestStatus(123, 'analyzed');

      expect(mockApiClient.patch).toHaveBeenCalledWith('/api/requests/123/', {
        analysis_status: 'analyzed'
      });
    });
  });

  describe('getMonitoringData', () => {
    it('should get monitoring data successfully', async () => {
      const mockResponse = {
        data: {
          metrics: {
            total_requests: 100,
            successful_requests: 95,
            failed_requests: 5,
            average_response_time: 2.5,
            tokens_used: 10000,
            cost: 0.15
          },
          recent_requests: [],
          error_rate: 0.05,
          success_rate: 0.95
        } as LLMMonitoringData
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await LLMService.getMonitoringData();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/llm/monitoring/');
      expect(result.metrics.total_requests).toBe(100);
      expect(result.success_rate).toBe(0.95);
    });
  });

  describe('exportTrainingDataset', () => {
    it('should export training dataset successfully', async () => {
      const exportRequest: DatasetExportRequest = {
        records_per_file: 50,
        include_metadata: true
      };

      const mockResponse = {
        data: {
          success: true,
          dataset_id: 'dataset-123',
          files_created: 3,
          total_records: 150,
          files: ['file1.jsonl', 'file2.jsonl', 'file3.jsonl']
        }
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await LLMService.exportTrainingDataset(exportRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/llm/export-dataset/', exportRequest);
      expect(result.success).toBe(true);
      expect(result.files_created).toBe(3);
    });
  });

  describe('getTrainingDatasets', () => {
    it('should get training datasets successfully', async () => {
      const mockResponse = {
        data: [
          {
            id: 'dataset-1',
            name: 'Dataset 1',
            description: 'First dataset',
            records_count: 100,
            created_at: '2024-01-15T10:30:00Z',
            status: 'ready' as const,
            files: ['file1.jsonl']
          }
        ] as TrainingDataset[]
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await LLMService.getTrainingDatasets();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/llm/datasets/');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Dataset 1');
    });
  });

  describe('testPrompt', () => {
    it('should test prompt successfully', async () => {
      const prompt = 'Test prompt';
      const testData = { text: 'Test data' };

      const mockResponse = {
        data: {
          success: true,
          data: {
            project_analysis: {
              project_title: 'Test Project',
              project_type: 'Фильм',
              genre: 'Драма',
              description: 'Test description',
              premiere_date: '2024-12-31',
              roles: [],
              contacts: {
                casting_director: {
                  name: 'Test',
                  phone: '',
                  email: '',
                  telegram: ''
                },
                director: {
                  name: '',
                  phone: '',
                  email: '',
                  telegram: ''
                },
                producers: [],
                production_company: {
                  name: '',
                  phone: '',
                  email: '',
                  website: ''
                }
              },
              confidence: 0.8
            }
          }
        }
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await LLMService.testPrompt(prompt, testData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/llm/test-prompt/', {
        prompt,
        test_data: testData
      });
      expect(result.project_analysis.project_title).toBe('Test Project');
    });
  });

  describe('validateResponse', () => {
    it('should validate response successfully', async () => {
      const response: LLMAnalysisResult = {
        project_analysis: {
          project_title: 'Test Project',
          project_type: 'Фильм',
          genre: 'Драма',
          description: 'Test description',
          premiere_date: '2024-12-31',
          roles: [],
          contacts: {
            casting_director: {
              name: 'Test',
              phone: '',
              email: '',
              telegram: ''
            },
            director: {
              name: '',
              phone: '',
              email: '',
              telegram: ''
            },
            producers: [],
            production_company: {
              name: '',
              phone: '',
              email: '',
              website: ''
            }
          },
          confidence: 0.8
        }
      };

      const mockResponse = {
        data: {
          is_valid: true,
          errors: []
        }
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await LLMService.validateResponse(response);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/llm/validate-response/', response);
      expect(result).toBe(true);
    });
  });
});

describe('LLMUtils', () => {
  describe('formatConfidence', () => {
    it('should format confidence as percentage', () => {
      expect(LLMUtils.formatConfidence(0.85)).toBe('85%');
      expect(LLMUtils.formatConfidence(0.5)).toBe('50%');
      expect(LLMUtils.formatConfidence(0.123)).toBe('12%');
    });
  });

  describe('getConfidenceColor', () => {
    it('should return correct color for confidence level', () => {
      expect(LLMUtils.getConfidenceColor(0.9)).toBe('text-green-600');
      expect(LLMUtils.getConfidenceColor(0.7)).toBe('text-yellow-600');
      expect(LLMUtils.getConfidenceColor(0.3)).toBe('text-red-600');
    });
  });

  describe('getAnalysisStatusText', () => {
    it('should return correct status text', () => {
      expect(LLMUtils.getAnalysisStatusText('new')).toBe('Новый');
      expect(LLMUtils.getAnalysisStatusText('analyzing')).toBe('Анализируется');
      expect(LLMUtils.getAnalysisStatusText('analyzed')).toBe('Проанализирован');
      expect(LLMUtils.getAnalysisStatusText('processed')).toBe('Обработан');
      expect(LLMUtils.getAnalysisStatusText('error')).toBe('Ошибка');
    });
  });

  describe('getAnalysisStatusColor', () => {
    it('should return correct status color', () => {
      expect(LLMUtils.getAnalysisStatusColor('new')).toBe('bg-gray-100 text-gray-800');
      expect(LLMUtils.getAnalysisStatusColor('analyzing')).toBe('bg-blue-100 text-blue-800');
      expect(LLMUtils.getAnalysisStatusColor('analyzed')).toBe('bg-green-100 text-green-800');
      expect(LLMUtils.getAnalysisStatusColor('processed')).toBe('bg-purple-100 text-purple-800');
      expect(LLMUtils.getAnalysisStatusColor('error')).toBe('bg-red-100 text-red-800');
    });
  });

  describe('isValidResponse', () => {
    it('should validate correct response', () => {
      const validResponse: LLMAnalysisResult = {
        project_analysis: {
          project_title: 'Test Project',
          project_type: 'Фильм',
          genre: 'Драма',
          description: 'Test description',
          premiere_date: '2024-12-31',
          roles: [
            {
              role_type: 'Актер',
              character_name: 'Главный герой',
              description: 'Описание роли',
              age_range: '25-35',
              gender: 'male',
              suggested_artists: [1, 2],
              skills_required: {
                acting_skills: ['драма'],
                physical_skills: [],
                languages: ['русский'],
                special_requirements: []
              }
            }
          ],
          contacts: {
            casting_director: {
              name: 'Test',
              phone: '',
              email: '',
              telegram: ''
            },
            director: {
              name: '',
              phone: '',
              email: '',
              telegram: ''
            },
            producers: [],
            production_company: {
              name: '',
              phone: '',
              email: '',
              website: ''
            }
          },
          confidence: 0.8
        }
      };

      expect(LLMUtils.isValidResponse(validResponse)).toBe(true);
    });

    it('should reject invalid response', () => {
      const invalidResponse: LLMAnalysisResult = {
        project_analysis: {
          project_title: '', // Пустое название
          project_type: 'Фильм',
          genre: 'Драма',
          description: 'Test description',
          premiere_date: '2024-12-31',
          roles: [], // Пустой список ролей
          contacts: {
            casting_director: {
              name: 'Test',
              phone: '',
              email: '',
              telegram: ''
            },
            director: {
              name: '',
              phone: '',
              email: '',
              telegram: ''
            },
            producers: [],
            production_company: {
              name: '',
              phone: '',
              email: '',
              website: ''
            }
          },
          confidence: 0.8
        }
      };

      expect(LLMUtils.isValidResponse(invalidResponse)).toBe(false);
    });
  });

  describe('extractErrors', () => {
    it('should extract errors from invalid response', () => {
      const invalidResponse: LLMAnalysisResult = {
        project_analysis: {
          project_title: '', // Пустое название
          project_type: 'Фильм',
          genre: 'Драма',
          description: 'Test description',
          premiere_date: '2024-12-31',
          roles: [], // Пустой список ролей
          contacts: {
            casting_director: {
              name: 'Test',
              phone: '',
              email: '',
              telegram: ''
            },
            director: {
              name: '',
              phone: '',
              email: '',
              telegram: ''
            },
            producers: [],
            production_company: {
              name: '',
              phone: '',
              email: '',
              website: ''
            }
          },
          confidence: 0.8
        }
      };

      const errors = LLMUtils.extractErrors(invalidResponse);

      expect(errors).toContain('Отсутствует название проекта');
      expect(errors).toContain('Отсутствуют роли');
    });
  });
});