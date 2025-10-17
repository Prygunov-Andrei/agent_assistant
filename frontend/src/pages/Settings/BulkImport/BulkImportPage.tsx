/**
 * Главная страница массового импорта персон
 */
import React, { useState } from 'react';
import type { ImportSession, ImportDecision, ImportResult, ImportStep } from '../../../types/bulkImport';
import bulkImportService from '../../../services/bulkImportService';
import UserInstruction from './UserInstruction';
import FileUploader from './FileUploader';
import ImportPreview from './ImportPreview';
import ConflictResolver from './ConflictResolver';
import ImportResults from './ImportResults';
import './BulkImport.css';

const BulkImportPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<ImportStep>('instruction');
  const [importSession, setImportSession] = useState<ImportSession | null>(null);
  const [results, setResults] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUploaded = (session: ImportSession) => {
    setImportSession(session);
    setError(null);
    
    if (session.status === 'failed') {
      setError(session.error_message || 'Ошибка обработки файла');
      return;
    }
    
    // Если есть валидные строки, переходим к предпросмотру
    if (session.valid_rows > 0) {
      setCurrentStep('preview');
    } else {
      setError('В файле нет валидных строк для импорта');
    }
  };

  const handlePreviewConfirmed = () => {
    if (!importSession) return;

    // Проверяем, есть ли дубликаты
    const hasDuplicates = importSession.records_data.preview.some(
      row => row.potential_duplicates.length > 0
    );

    if (hasDuplicates) {
      setCurrentStep('resolve');
    } else {
      // Если дубликатов нет, сразу импортируем все как новые
      const decisions: ImportDecision[] = importSession.records_data.preview
        .filter(row => row.validation_errors.length === 0)
        .map(row => ({
          row_number: row.row_number,
          action: 'create' as const
        }));
      
      handleDecisionsConfirmed(decisions);
    }
  };

  const handleDecisionsConfirmed = async (decisions: ImportDecision[]) => {
    if (!importSession) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await bulkImportService.confirmImport(
        importSession.id,
        decisions
      );
      
      setResults(result);
      setCurrentStep('results');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ошибка при выполнении импорта';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    setCurrentStep('instruction');
    setImportSession(null);
    setResults(null);
    setError(null);
  };

  const getStepNumber = (step: ImportStep): number => {
    const steps: ImportStep[] = ['instruction', 'upload', 'preview', 'resolve', 'results'];
    return steps.indexOf(step) + 1;
  };

  return (
    <div className="bulk-import-page">
      <h1>Массовый импорт персон</h1>
      
      {/* Stepper */}
      <div className="stepper">
        <div className={`step ${currentStep === 'instruction' ? 'active' : ''} ${getStepNumber(currentStep) > 1 ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Инструкция</div>
        </div>
        <div className={`step ${currentStep === 'upload' ? 'active' : ''} ${getStepNumber(currentStep) > 2 ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Загрузка</div>
        </div>
        <div className={`step ${currentStep === 'preview' ? 'active' : ''} ${getStepNumber(currentStep) > 3 ? 'completed' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Предпросмотр</div>
        </div>
        <div className={`step ${currentStep === 'resolve' ? 'active' : ''} ${getStepNumber(currentStep) > 4 ? 'completed' : ''}`}>
          <div className="step-number">4</div>
          <div className="step-label">Дубликаты</div>
        </div>
        <div className={`step ${currentStep === 'results' ? 'active' : ''}`}>
          <div className="step-number">5</div>
          <div className="step-label">Результаты</div>
        </div>
      </div>

      {/* Контент */}
      <div className="step-content">
        {error && (
          <div className="error-banner">
            <span className="error-icon">❌</span>
            <span>{error}</span>
            <button 
              className="error-close"
              onClick={() => setError(null)}
              type="button"
            >
              ×
            </button>
          </div>
        )}

        {isProcessing && (
          <div className="processing-overlay">
            <div className="spinner large"></div>
            <p>Выполняется импорт...</p>
          </div>
        )}

        {currentStep === 'instruction' && (
          <UserInstruction onStart={() => setCurrentStep('upload')} />
        )}
        
        {currentStep === 'upload' && (
          <FileUploader onFileUploaded={handleFileUploaded} />
        )}
        
        {currentStep === 'preview' && importSession && (
          <ImportPreview
            session={importSession}
            onConfirm={handlePreviewConfirmed}
            onCancel={handleStartOver}
          />
        )}
        
        {currentStep === 'resolve' && importSession && (
          <ConflictResolver
            session={importSession}
            onConfirm={handleDecisionsConfirmed}
            onCancel={handleStartOver}
          />
        )}
        
        {currentStep === 'results' && results && (
          <ImportResults
            results={results}
            onStartOver={handleStartOver}
          />
        )}
      </div>
    </div>
  );
};

export default BulkImportPage;

