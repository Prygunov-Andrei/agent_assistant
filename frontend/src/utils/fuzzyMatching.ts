// Утилиты для fuzzy matching

import Fuse, { type FuseResultMatch } from 'fuse.js';

// Конфигурация для поиска
export interface FuzzySearchConfig {
  threshold: number; // 0.0 = точное совпадение, 1.0 = любое совпадение
  keys: string[]; // поля для поиска
  includeScore: boolean;
  includeMatches: boolean;
}

// Результат поиска
export interface FuzzySearchResult<T> {
  item: T;
  score?: number;
  matches?: FuseResultMatch[];
  confidence: number; // 0-1, обратно пропорционально score
}

// Базовый класс для fuzzy поиска
export class FuzzySearch<T> {
  private fuse: Fuse<T>;
  private config: FuzzySearchConfig;

  constructor(items: T[], config: FuzzySearchConfig) {
    this.config = config;
    this.fuse = new Fuse(items, {
      keys: config.keys,
      threshold: config.threshold,
      includeScore: config.includeScore,
      includeMatches: config.includeMatches,
    });
  }

  // Поиск с ограничением результатов
  search(query: string, limit?: number): FuzzySearchResult<T>[] {
    const results = this.fuse.search(query);
    
    let limitedResults = results;
    if (limit && limit > 0) {
      limitedResults = results.slice(0, limit);
    }

    return limitedResults.map(result => ({
      item: result.item,
      score: result.score,
      matches: result.matches ? [...result.matches] : undefined,
      confidence: this.calculateConfidence(result.score || 0),
    }));
  }

  // Поиск с минимальным порогом уверенности
  searchWithMinConfidence(query: string, minConfidence: number, limit?: number): FuzzySearchResult<T>[] {
    const results = this.search(query, limit);
    return results.filter(result => result.confidence >= minConfidence);
  }

  // Расчет уверенности на основе score
  private calculateConfidence(score: number): number {
    if (score === 0) return 1.0; // Точное совпадение
    if (score >= 1) return 0.0; // Нет совпадений
    return Math.max(0, 1 - score);
  }

  // Обновление данных для поиска
  updateItems(items: T[]): void {
    this.fuse = new Fuse(items, {
      keys: this.config.keys,
      threshold: this.config.threshold,
      includeScore: this.config.includeScore,
      includeMatches: this.config.includeMatches,
    });
  }
}

// Предустановленные конфигурации
export const FUZZY_CONFIGS = {
  // Поиск артистов
  ARTISTS: {
    threshold: 0.3,
    keys: ['first_name', 'last_name', 'stage_name', 'full_name'],
    includeScore: true,
    includeMatches: true,
  },
  
  // Поиск персон
  PERSONS: {
    threshold: 0.4,
    keys: ['name', 'email', 'phone', 'telegram_username'],
    includeScore: true,
    includeMatches: true,
  },
  
  // Поиск компаний
  COMPANIES: {
    threshold: 0.4,
    keys: ['name', 'website', 'email'],
    includeScore: true,
    includeMatches: true,
  },
  
  // Поиск проектов
  PROJECTS: {
    threshold: 0.4,
    keys: ['title', 'description'],
    includeScore: true,
    includeMatches: true,
  },
} as const;

// Утилиты для работы с результатами поиска
export class SearchUtils {
  // Группировка результатов по типу совпадения
  static groupByMatchType<T>(results: FuzzySearchResult<T>[]): {
    exact: FuzzySearchResult<T>[];
    high: FuzzySearchResult<T>[];
    medium: FuzzySearchResult<T>[];
    low: FuzzySearchResult<T>[];
  } {
    return {
      exact: results.filter(r => r.confidence >= 0.95),
      high: results.filter(r => r.confidence >= 0.8 && r.confidence < 0.95),
      medium: results.filter(r => r.confidence >= 0.6 && r.confidence < 0.8),
      low: results.filter(r => r.confidence >= 0.4 && r.confidence < 0.6),
    };
  }

  // Получение цвета для индикации совпадения
  static getMatchColor(confidence: number): 'green' | 'yellow' | 'orange' | 'red' {
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.6) return 'yellow';
    if (confidence >= 0.4) return 'orange';
    return 'red';
  }

  // Получение текста для индикации совпадения
  static getMatchText(confidence: number): string {
    if (confidence >= 0.95) return 'Точное совпадение';
    if (confidence >= 0.8) return 'Высокое совпадение';
    if (confidence >= 0.6) return 'Среднее совпадение';
    if (confidence >= 0.4) return 'Низкое совпадение';
    return 'Слабое совпадение';
  }
}
