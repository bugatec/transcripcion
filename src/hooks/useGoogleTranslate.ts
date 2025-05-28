
import { useState, useCallback } from 'react';

const GOOGLE_TRANSLATE_API_KEY = 'AIzaSyA0gTxj4wsJk-FF3MUyHWSiZk1pkY-NBEc';

export const useGoogleTranslate = () => {
  const [isTranslating, setIsTranslating] = useState(false);

  const translateText = useCallback(async (text: string, sourceLanguage: string, targetLanguage: string): Promise<string> => {
    if (!text.trim()) return '';

    setIsTranslating(true);
    
    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            source: sourceLanguage,
            target: targetLanguage,
            format: 'text'
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.data && data.data.translations && data.data.translations[0]) {
        return data.data.translations[0].translatedText;
      } else {
        throw new Error('Invalid response format from translation API');
      }
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  return { translateText, isTranslating };
};
