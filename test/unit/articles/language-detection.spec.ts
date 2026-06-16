import { LanguageDetectionService } from '../../../src/articles/pipeline/language-detection.service';

describe('LanguageDetectionService', () => {
  let service: LanguageDetectionService;

  beforeAll(() => {
    service = new LanguageDetectionService();
  });

  it('should use primary language when available', () => {
    const result = service.detect('Hello World', 'Some content', 'fr');
    expect(result.language).toBe('fr');
    expect(result.source).toBe('primary');
    expect(result.confidence).toBe(0.9);
  });

  it('should detect English from content', () => {
    const result = service.detect(
      'The quick brown fox jumps over the lazy dog',
      'This is some additional English content for testing purposes',
    );
    expect(result.language).toBe('en');
    expect(result.source).toBe('detected');
  });

  it('should detect Spanish from content', () => {
    const result = service.detect(
      'El zorro marrón salta sobre el perro perezoso',
      'Este es un contenido de prueba en español para detectar el idioma',
    );
    expect(result.language).toBe('es');
    expect(result.source).toBe('detected');
  });

  it('should fallback to English for short text', () => {
    const result = service.detect('Hi', null);
    expect(result.language).toBe('en');
    expect(result.source).toBe('fallback');
    expect(result.confidence).toBe(0.3);
  });

  it('should fallback to English for empty text', () => {
    const result = service.detect('', null);
    expect(result.language).toBe('en');
    expect(result.source).toBe('fallback');
  });

  it('should handle null primary language', () => {
    const result = service.detect('Some English text here', null, null);
    expect(result.language).toBe('en');
    expect(result.source).toBe('detected');
  });

  it('should ignore invalid primary language', () => {
    const result = service.detect('Hello World', null, 'invalid');
    expect(result.language).toBe('en');
  });
});
