// Тесты для типов LLM

import type {
  LLMAnalysisResult,
  ProjectAnalysis,
  ProjectRole,
  SkillsRequired,
  ProjectContacts,
  ContactPerson,
  ContactCompany,
  LLMAnalysisRequest,
  LLMAnalysisResponse,
  AnalysisStatus,
  LLMStatus,
  LLMConfig,
  ValidationError,
  LLMValidationResult,
  EmulatorConfig,
  EmulatorScenario,
  PromptTemplate,
  PromptConfig,
  LLMMetrics,
  LLMMonitoringData,
  LLMRequest,
  TrainingDataset,
  DatasetExportRequest,
  DatasetExportResponse
} from '../llm';

describe('LLM Types', () => {
  describe('LLMAnalysisResult', () => {
    it('should have correct structure', () => {
      const result: LLMAnalysisResult = {
        project_analysis: {
          project_title: 'Test Project',
          project_type: 'Фильм',
          project_type_raw: 'Фильм',
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

      expect(result.project_analysis).toBeDefined();
      expect(result.project_analysis.project_title).toBe('Test Project');
      expect(result.project_analysis.confidence).toBe(0.8);
    });
  });

  describe('ProjectAnalysis', () => {
    it('should have all required fields', () => {
      const analysis: ProjectAnalysis = {
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
      };

      expect(analysis.project_title).toBeDefined();
      expect(analysis.project_type).toBeDefined();
      expect(analysis.genre).toBeDefined();
      expect(analysis.description).toBeDefined();
      expect(analysis.premiere_date).toBeDefined();
      expect(analysis.roles).toBeDefined();
      expect(analysis.contacts).toBeDefined();
      expect(analysis.confidence).toBeDefined();
    });
  });

  describe('ProjectRole', () => {
    it('should have all required fields', () => {
      const role: ProjectRole = {
        role_type: 'Актер',
        character_name: 'Главный герой',
        description: 'Описание роли',
        age_range: '25-35',
        gender: 'male',
        suggested_artists: [1, 2, 3],
        skills_required: {
          acting_skills: ['драма'],
          physical_skills: [],
          languages: ['русский'],
          special_requirements: []
        },
        confidence: 0.8
      };

      expect(role.role_type).toBeDefined();
      expect(role.character_name).toBeDefined();
      expect(role.description).toBeDefined();
      expect(role.age_range).toBeDefined();
      expect(role.gender).toBeDefined();
      expect(role.suggested_artists).toBeDefined();
      expect(role.skills_required).toBeDefined();
      expect(role.confidence).toBeDefined();
    });
  });

  describe('SkillsRequired', () => {
    it('should have all skill categories', () => {
      const skills: SkillsRequired = {
        acting_skills: ['драма', 'комедия'],
        physical_skills: ['танцы', 'спорт'],
        languages: ['русский', 'английский'],
        special_requirements: ['вождение', 'плавание']
      };

      expect(skills.acting_skills).toBeDefined();
      expect(skills.physical_skills).toBeDefined();
      expect(skills.languages).toBeDefined();
      expect(skills.special_requirements).toBeDefined();
    });
  });

  describe('ProjectContacts', () => {
    it('should have all contact types', () => {
      const contacts: ProjectContacts = {
        casting_director: {
          name: 'Кастинг-директор',
          phone: '+7(999)123-45-67',
          email: 'casting@example.com',
          telegram: '@casting_director',
          confidence: 0.9
        },
        director: {
          name: 'Режиссер',
          phone: '+7(999)123-45-68',
          email: 'director@example.com',
          telegram: '@director',
          confidence: 0.7
        },
        producers: [
          {
            name: 'Продюсер 1',
            phone: '+7(999)123-45-69',
            email: 'producer1@example.com',
            telegram: '@producer1',
            confidence: 0.8
          }
        ],
        production_company: {
          name: 'Кинокомпания',
          phone: '+7(999)123-45-70',
          email: 'company@example.com',
          website: 'www.company.com',
          confidence: 0.6
        }
      };

      expect(contacts.casting_director).toBeDefined();
      expect(contacts.director).toBeDefined();
      expect(contacts.producers).toBeDefined();
      expect(contacts.production_company).toBeDefined();
    });
  });

  describe('ContactPerson', () => {
    it('should have all required fields', () => {
      const contact: ContactPerson = {
        name: 'Тестовый контакт',
        phone: '+7(999)123-45-67',
        email: 'test@example.com',
        telegram: '@test_contact',
        confidence: 0.8
      };

      expect(contact.name).toBeDefined();
      expect(contact.phone).toBeDefined();
      expect(contact.email).toBeDefined();
      expect(contact.telegram).toBeDefined();
      expect(contact.confidence).toBeDefined();
    });
  });

  describe('ContactCompany', () => {
    it('should have all required fields', () => {
      const company: ContactCompany = {
        name: 'Тестовая компания',
        phone: '+7(999)123-45-67',
        email: 'company@example.com',
        website: 'www.testcompany.com',
        confidence: 0.7
      };

      expect(company.name).toBeDefined();
      expect(company.phone).toBeDefined();
      expect(company.email).toBeDefined();
      expect(company.website).toBeDefined();
      expect(company.confidence).toBeDefined();
    });
  });

  describe('LLMAnalysisRequest', () => {
    it('should have required fields', () => {
      const request: LLMAnalysisRequest = {
        request_id: 123,
        use_emulator: true
      };

      expect(request.request_id).toBeDefined();
      expect(request.use_emulator).toBeDefined();
    });
  });

  describe('LLMAnalysisResponse', () => {
    it('should have success field and optional data/error', () => {
      const successResponse: LLMAnalysisResponse = {
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
      };

      const errorResponse: LLMAnalysisResponse = {
        success: false,
        error: 'Test error'
      };

      expect(successResponse.success).toBe(true);
      expect(successResponse.data).toBeDefined();
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBeDefined();
    });
  });

  describe('AnalysisStatus', () => {
    it('should have correct status values', () => {
      const statuses: AnalysisStatus[] = ['new', 'analyzing', 'analyzed', 'processed', 'error'];
      
      expect(statuses).toContain('new');
      expect(statuses).toContain('analyzing');
      expect(statuses).toContain('analyzed');
      expect(statuses).toContain('processed');
      expect(statuses).toContain('error');
    });
  });

  describe('LLMStatus', () => {
    it('should have all required fields', () => {
      const status: LLMStatus = {
        is_available: true,
        is_analyzing: false,
        model: 'gpt-4o',
        use_emulator: true,
        last_check: '2024-01-15T10:30:00Z',
        error_message: 'Test error'
      };

      expect(status.is_available).toBeDefined();
      expect(status.model).toBeDefined();
      expect(status.use_emulator).toBeDefined();
      expect(status.last_check).toBeDefined();
      expect(status.error_message).toBeDefined();
    });
  });

  describe('LLMConfig', () => {
    it('should have all configuration fields', () => {
      const config: LLMConfig = {
        model: 'gpt-4o',
        temperature: 0.3,
        max_tokens: 2000,
        max_retries: 3,
        timeout: 30,
        use_emulator: true,
        emulator_delay: 2.0
      };

      expect(config.model).toBeDefined();
      expect(config.temperature).toBeDefined();
      expect(config.max_tokens).toBeDefined();
      expect(config.max_retries).toBeDefined();
      expect(config.timeout).toBeDefined();
      expect(config.use_emulator).toBeDefined();
      expect(config.emulator_delay).toBeDefined();
    });
  });

  describe('ValidationError', () => {
    it('should have all required fields', () => {
      const error: ValidationError = {
        field: 'project_title',
        message: 'Field is required',
        code: 'REQUIRED_FIELD'
      };

      expect(error.field).toBeDefined();
      expect(error.message).toBeDefined();
      expect(error.code).toBeDefined();
    });
  });

  describe('LLMValidationResult', () => {
    it('should have validation results', () => {
      const result: LLMValidationResult = {
        is_valid: true,
        errors: [],
        warnings: []
      };

      expect(result.is_valid).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.warnings).toBeDefined();
    });
  });

  describe('EmulatorConfig', () => {
    it('should have emulator configuration', () => {
      const config: EmulatorConfig = {
        enabled: true,
        delay: 2.0,
        scenarios: [
          {
            keywords: ['драма'],
            project_type: 'Фильм',
            genre: 'Драма',
            template: 'drama'
          }
        ]
      };

      expect(config.enabled).toBeDefined();
      expect(config.delay).toBeDefined();
      expect(config.scenarios).toBeDefined();
    });
  });

  describe('EmulatorScenario', () => {
    it('should have scenario fields', () => {
      const scenario: EmulatorScenario = {
        keywords: ['драма', 'серьезный'],
        project_type: 'Фильм',
        genre: 'Драма',
        template: 'drama'
      };

      expect(scenario.keywords).toBeDefined();
      expect(scenario.project_type).toBeDefined();
      expect(scenario.genre).toBeDefined();
      expect(scenario.template).toBeDefined();
    });
  });

  describe('PromptTemplate', () => {
    it('should have template fields', () => {
      const template: PromptTemplate = {
        system: 'System prompt',
        user_template: 'User template with {variable}',
        variables: ['variable']
      };

      expect(template.system).toBeDefined();
      expect(template.user_template).toBeDefined();
      expect(template.variables).toBeDefined();
    });
  });

  describe('PromptConfig', () => {
    it('should have prompt configuration', () => {
      const config: PromptConfig = {
        templates: {
          default: {
            system: 'Default system prompt',
            user_template: 'Default user template',
            variables: []
          }
        },
        default_template: 'default'
      };

      expect(config.templates).toBeDefined();
      expect(config.default_template).toBeDefined();
    });
  });

  describe('LLMMetrics', () => {
    it('should have all metrics fields', () => {
      const metrics: LLMMetrics = {
        total_requests: 100,
        successful_requests: 95,
        failed_requests: 5,
        average_response_time: 2.5,
        tokens_used: 10000,
        cost: 0.15
      };

      expect(metrics.total_requests).toBeDefined();
      expect(metrics.successful_requests).toBeDefined();
      expect(metrics.failed_requests).toBeDefined();
      expect(metrics.average_response_time).toBeDefined();
      expect(metrics.tokens_used).toBeDefined();
      expect(metrics.cost).toBeDefined();
    });
  });

  describe('LLMMonitoringData', () => {
    it('should have monitoring data structure', () => {
      const data: LLMMonitoringData = {
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
      };

      expect(data.metrics).toBeDefined();
      expect(data.recent_requests).toBeDefined();
      expect(data.error_rate).toBeDefined();
      expect(data.success_rate).toBeDefined();
    });
  });

  describe('LLMRequest', () => {
    it('should have request fields', () => {
      const request: LLMRequest = {
        id: 'req-123',
        timestamp: '2024-01-15T10:30:00Z',
        status: 'analyzed',
        response_time: 2.5,
        tokens_used: 1000,
        cost: 0.015,
        error_message: 'Test error'
      };

      expect(request.id).toBeDefined();
      expect(request.timestamp).toBeDefined();
      expect(request.status).toBeDefined();
      expect(request.response_time).toBeDefined();
      expect(request.tokens_used).toBeDefined();
      expect(request.cost).toBeDefined();
      expect(request.error_message).toBeDefined();
    });
  });

  describe('TrainingDataset', () => {
    it('should have dataset fields', () => {
      const dataset: TrainingDataset = {
        id: 'dataset-123',
        name: 'Test Dataset',
        description: 'Test dataset description',
        records_count: 100,
        created_at: '2024-01-15T10:30:00Z',
        status: 'ready',
        files: ['file1.jsonl', 'file2.jsonl']
      };

      expect(dataset.id).toBeDefined();
      expect(dataset.name).toBeDefined();
      expect(dataset.description).toBeDefined();
      expect(dataset.records_count).toBeDefined();
      expect(dataset.created_at).toBeDefined();
      expect(dataset.status).toBeDefined();
      expect(dataset.files).toBeDefined();
    });
  });

  describe('DatasetExportRequest', () => {
    it('should have export request fields', () => {
      const request: DatasetExportRequest = {
        records_per_file: 50,
        include_metadata: true,
        date_range: {
          start: '2024-01-01',
          end: '2024-01-31'
        },
        filters: {
          status: 'analyzed'
        }
      };

      expect(request.records_per_file).toBeDefined();
      expect(request.include_metadata).toBeDefined();
      expect(request.date_range).toBeDefined();
      expect(request.filters).toBeDefined();
    });
  });

  describe('DatasetExportResponse', () => {
    it('should have export response fields', () => {
      const response: DatasetExportResponse = {
        success: true,
        dataset_id: 'dataset-123',
        files_created: 3,
        total_records: 150,
        files: ['file1.jsonl', 'file2.jsonl', 'file3.jsonl'],
        error: 'Test error'
      };

      expect(response.success).toBeDefined();
      expect(response.dataset_id).toBeDefined();
      expect(response.files_created).toBeDefined();
      expect(response.total_records).toBeDefined();
      expect(response.files).toBeDefined();
      expect(response.error).toBeDefined();
    });
  });
});