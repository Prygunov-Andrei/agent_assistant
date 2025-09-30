import type { 
  AnalysisStatus, 
  LLMAnalysisResult, 
  LLMAnalysisRequest, 
  LLMAnalysisResponse, 
  LLMConfig, 
  LLMStatus 
} from '../llm';

describe('LLM Types', () => {
  describe('AnalysisStatus', () => {
    it('should have correct values', () => {
      const statuses: AnalysisStatus[] = ['new', 'analyzed', 'processed'];
      
      expect(statuses).toContain('new');
      expect(statuses).toContain('analyzed');
      expect(statuses).toContain('processed');
    });
  });

  describe('LLMAnalysisResult', () => {
    it('should have correct structure', () => {
      const result: LLMAnalysisResult = {
        project_type: 'Фильм',
        project_type_raw: 'художественный фильм',
        genre: 'Драма',
        description: 'Драматическая история о...',
        roles: [
          {
            title: 'Главный герой',
            description: 'Молодой человек 25-30 лет',
            gender: 'male',
            age_range: { min: 25, max: 30 },
            skills_required: ['Актерское мастерство', 'Драма'],
            suggested_artists: [1, 2, 3],
          },
        ],
        suggested_persons: [
          {
            name: 'Иван Петров',
            type: 'director',
            email: 'ivan@example.com',
            phone: '+7-123-456-78-90',
            telegram_username: 'ivan_petrov',
            company: 'Кинокомпания "Студия"',
            confidence: 0.9,
          },
        ],
        suggested_companies: [
          {
            name: 'Кинокомпания "Студия"',
            type: 'production',
            website: 'https://studio.com',
            email: 'info@studio.com',
            phone: '+7-123-456-78-90',
            confidence: 0.8,
          },
        ],
        suggested_projects: [
          {
            title: 'Похожий проект',
            description: 'Описание похожего проекта',
            status: 'draft',
            confidence: 0.7,
          },
        ],
      };

      expect(result.project_type).toBe('Фильм');
      expect(result.project_type_raw).toBe('художественный фильм');
      expect(result.genre).toBe('Драма');
      expect(result.description).toBe('Драматическая история о...');
      expect(result.roles).toHaveLength(1);
      expect(result.suggested_persons).toHaveLength(1);
      expect(result.suggested_companies).toHaveLength(1);
      expect(result.suggested_projects).toHaveLength(1);
    });
  });

  describe('LLMAnalysisRequest', () => {
    it('should have correct structure', () => {
      const request: LLMAnalysisRequest = {
        request_id: 1,
        text: 'Текст запроса',
        images: ['image1.jpg', 'image2.jpg'],
        files: ['document1.pdf', 'document2.docx'],
      };

      expect(request.request_id).toBe(1);
      expect(request.text).toBe('Текст запроса');
      expect(request.images).toHaveLength(2);
      expect(request.files).toHaveLength(2);
    });
  });

  describe('LLMAnalysisResponse', () => {
    it('should have correct structure for success', () => {
      const response: LLMAnalysisResponse = {
        success: true,
        data: {
          project_type: 'Фильм',
          project_type_raw: 'художественный фильм',
          genre: 'Драма',
          description: 'Драматическая история о...',
          roles: [],
          suggested_persons: [],
          suggested_companies: [],
          suggested_projects: [],
        },
        retry_count: 0,
      };

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.retry_count).toBe(0);
    });

    it('should have correct structure for error', () => {
      const response: LLMAnalysisResponse = {
        success: false,
        error: 'Ошибка анализа',
        retry_count: 2,
      };

      expect(response.success).toBe(false);
      expect(response.error).toBe('Ошибка анализа');
      expect(response.retry_count).toBe(2);
    });
  });

  describe('LLMConfig', () => {
    it('should have correct structure', () => {
      const config: LLMConfig = {
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 2000,
        retry_attempts: 3,
        timeout: 30000,
      };

      expect(config.model).toBe('gpt-4o');
      expect(config.temperature).toBe(0.7);
      expect(config.max_tokens).toBe(2000);
      expect(config.retry_attempts).toBe(3);
      expect(config.timeout).toBe(30000);
    });
  });

  describe('LLMStatus', () => {
    it('should have correct structure', () => {
      const status: LLMStatus = {
        is_available: true,
        is_analyzing: false,
        last_analysis: '2023-01-01T00:00:00Z',
        error_count: 5,
        success_count: 100,
      };

      expect(status.is_available).toBe(true);
      expect(status.is_analyzing).toBe(false);
      expect(status.last_analysis).toBe('2023-01-01T00:00:00Z');
      expect(status.error_count).toBe(5);
      expect(status.success_count).toBe(100);
    });
  });
});
