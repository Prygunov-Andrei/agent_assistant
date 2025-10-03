import { FuzzySearch, SearchUtils, FUZZY_CONFIGS } from '../utils/fuzzyMatching';

interface TestItem {
  id: number;
  name: string;
  email: string;
  description: string;
}

const mockItems: TestItem[] = [
  { id: 1, name: 'Иван Петров', email: 'ivan@example.com', description: 'Режиссер' },
  { id: 2, name: 'Петр Иванов', email: 'petr@example.com', description: 'Продюсер' },
  { id: 3, name: 'Сидор Сидоров', email: 'sidor@example.com', description: 'Актер' },
  { id: 4, name: 'Анна Смирнова', email: 'anna@example.com', description: 'Актриса' },
  { id: 5, name: 'Мария Козлова', email: 'maria@example.com', description: 'Кастинг-директор' },
];

describe('FuzzySearch', () => {
  let fuzzySearch: FuzzySearch<TestItem>;

  beforeEach(() => {
    fuzzySearch = new FuzzySearch(mockItems, {
      threshold: 0.3,
      keys: ['name', 'email', 'description'],
      includeScore: true,
      includeMatches: true,
    });
  });

  describe('search', () => {
    it('finds exact matches', () => {
      const results = fuzzySearch.search('Иван Петров');
      
      expect(results).toHaveLength(1);
      expect(results[0].item.name).toBe('Иван Петров');
      expect(results[0].confidence).toBeCloseTo(1.0, 10);
    });

    it('finds partial matches', () => {
      const results = fuzzySearch.search('Иван');
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].item.name).toBe('Иван Петров');
      expect(results[0].confidence).toBeGreaterThan(0.5);
    });

    it('finds matches by email', () => {
      const results = fuzzySearch.search('ivan@example.com');
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].item.email).toBe('ivan@example.com');
      expect(results[0].confidence).toBeCloseTo(1.0, 10);
    });

    it('finds matches by description', () => {
      const results = fuzzySearch.search('Режиссер');
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].item.description).toBe('Режиссер');
      expect(results[0].confidence).toBeCloseTo(1.0, 10);
    });

    it('returns empty array for no matches', () => {
      const results = fuzzySearch.search('Несуществующий');
      
      expect(results).toHaveLength(0);
    });

    it('limits results when limit is provided', () => {
      const results = fuzzySearch.search('а', 2);
      
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('returns all results when no limit provided', () => {
      const results = fuzzySearch.search('а');
      
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('searchWithMinConfidence', () => {
    it('filters results by minimum confidence', () => {
      const results = fuzzySearch.searchWithMinConfidence('Иван', 0.8);
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('returns empty array when no results meet confidence threshold', () => {
      const results = fuzzySearch.searchWithMinConfidence('Несуществующий', 0.8);
      
      expect(results).toHaveLength(0);
    });
  });

  describe('updateItems', () => {
    it('updates items for search', () => {
      const newItems: TestItem[] = [
        { id: 6, name: 'Новый Пользователь', email: 'new@example.com', description: 'Новая роль' },
      ];
      
      fuzzySearch.updateItems(newItems);
      const results = fuzzySearch.search('Новый');
      
      expect(results).toHaveLength(1);
      expect(results[0].item.name).toBe('Новый Пользователь');
    });
  });

  describe('calculateConfidence', () => {
    it('returns 1.0 for exact match (score 0)', () => {
      const results = fuzzySearch.search('Иван Петров');
      expect(results[0].confidence).toBeCloseTo(1.0, 10);
    });

    it('returns 0.0 for no match (score 1)', () => {
      const results = fuzzySearch.search('Несуществующий');
      expect(results).toHaveLength(0);
    });

    it('returns decreasing confidence for increasing score', () => {
      const exactResults = fuzzySearch.search('Иван Петров');
      const partialResults = fuzzySearch.search('Иван');
      
      if (exactResults.length > 0 && partialResults.length > 0) {
        expect(exactResults[0].confidence).toBeGreaterThan(partialResults[0].confidence);
      }
    });
  });
});

describe('SearchUtils', () => {
  const mockResults = [
    { item: mockItems[0], confidence: 0.95, score: 0.05, matches: [] },
    { item: mockItems[1], confidence: 0.85, score: 0.15, matches: [] },
    { item: mockItems[2], confidence: 0.65, score: 0.35, matches: [] },
    { item: mockItems[3], confidence: 0.45, score: 0.55, matches: [] },
  ];

  describe('groupByMatchType', () => {
    it('groups results by match type correctly', () => {
      const grouped = SearchUtils.groupByMatchType(mockResults);
      
      expect(grouped.exact).toHaveLength(1);
      expect(grouped.high).toHaveLength(1);
      expect(grouped.medium).toHaveLength(1);
      expect(grouped.low).toHaveLength(1);
    });

    it('places results in correct confidence ranges', () => {
      const grouped = SearchUtils.groupByMatchType(mockResults);
      
      expect(grouped.exact[0].confidence).toBeGreaterThanOrEqual(0.95);
      expect(grouped.high[0].confidence).toBeGreaterThanOrEqual(0.8);
      expect(grouped.high[0].confidence).toBeLessThan(0.95);
      expect(grouped.medium[0].confidence).toBeGreaterThanOrEqual(0.6);
      expect(grouped.medium[0].confidence).toBeLessThan(0.8);
      expect(grouped.low[0].confidence).toBeGreaterThanOrEqual(0.4);
      expect(grouped.low[0].confidence).toBeLessThan(0.6);
    });
  });

  describe('getMatchColor', () => {
    it('returns green for high confidence', () => {
      expect(SearchUtils.getMatchColor(0.9)).toBe('green');
      expect(SearchUtils.getMatchColor(0.8)).toBe('green');
    });

    it('returns yellow for medium confidence', () => {
      expect(SearchUtils.getMatchColor(0.7)).toBe('yellow');
      expect(SearchUtils.getMatchColor(0.6)).toBe('yellow');
    });

    it('returns orange for low confidence', () => {
      expect(SearchUtils.getMatchColor(0.5)).toBe('orange');
      expect(SearchUtils.getMatchColor(0.4)).toBe('orange');
    });

    it('returns red for very low confidence', () => {
      expect(SearchUtils.getMatchColor(0.3)).toBe('red');
      expect(SearchUtils.getMatchColor(0.1)).toBe('red');
    });
  });

  describe('getMatchText', () => {
    it('returns correct text for different confidence levels', () => {
      expect(SearchUtils.getMatchText(0.95)).toBe('Точное совпадение');
      expect(SearchUtils.getMatchText(0.85)).toBe('Высокое совпадение');
      expect(SearchUtils.getMatchText(0.65)).toBe('Среднее совпадение');
      expect(SearchUtils.getMatchText(0.45)).toBe('Низкое совпадение');
      expect(SearchUtils.getMatchText(0.25)).toBe('Слабое совпадение');
    });
  });
});

describe('FUZZY_CONFIGS', () => {
  it('has correct configuration for artists', () => {
    expect(FUZZY_CONFIGS.ARTISTS.threshold).toBe(0.3);
    expect(FUZZY_CONFIGS.ARTISTS.keys).toEqual(['first_name', 'last_name', 'stage_name', 'full_name']);
    expect(FUZZY_CONFIGS.ARTISTS.includeScore).toBe(true);
    expect(FUZZY_CONFIGS.ARTISTS.includeMatches).toBe(true);
  });

  it('has correct configuration for persons', () => {
    expect(FUZZY_CONFIGS.PERSONS.threshold).toBe(0.4);
    expect(FUZZY_CONFIGS.PERSONS.keys).toEqual(['name', 'email', 'phone', 'telegram_username']);
    expect(FUZZY_CONFIGS.PERSONS.includeScore).toBe(true);
    expect(FUZZY_CONFIGS.PERSONS.includeMatches).toBe(true);
  });

  it('has correct configuration for companies', () => {
    expect(FUZZY_CONFIGS.COMPANIES.threshold).toBe(0.4);
    expect(FUZZY_CONFIGS.COMPANIES.keys).toEqual(['name', 'website', 'email']);
    expect(FUZZY_CONFIGS.COMPANIES.includeScore).toBe(true);
    expect(FUZZY_CONFIGS.COMPANIES.includeMatches).toBe(true);
  });

  it('has correct configuration for projects', () => {
    expect(FUZZY_CONFIGS.PROJECTS.threshold).toBe(0.4);
    expect(FUZZY_CONFIGS.PROJECTS.keys).toEqual(['title', 'description']);
    expect(FUZZY_CONFIGS.PROJECTS.includeScore).toBe(true);
    expect(FUZZY_CONFIGS.PROJECTS.includeMatches).toBe(true);
  });
});
