
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, RotateCcw, Languages, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import ArrowRight from './ArrowRight';

const TranscriptionApp = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('es-ES');
  const [translationDirection, setTranslationDirection] = useState('es-en');
  const [translationText, setTranslationText] = useState('');
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState('');
  const transcriptionBoxRef = useRef<HTMLDivElement>(null);
  const translationBoxRef = useRef<HTMLDivElement>(null);

  const {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition(selectedLanguage);

  const languages = [
    { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
    { code: 'en-US', name: 'English', flag: '🇺🇸' }
  ];

  // Enhanced translation function with comprehensive dictionary
  const translateText = (text: string, direction: string) => {
    console.log('Translating completed text:', text, 'Direction:', direction);
    
    const translations = {
      'es-en': {
        // Frases y expresiones comunes
        'muy bien': 'very well',
        'buenos días': 'good morning',
        'buenas tardes': 'good afternoon',
        'buenas noches': 'good night',
        'por favor': 'please',
        'de nada': "you're welcome",
        'lo siento': 'I am sorry',
        'cómo estás': 'how are you',
        'qué tal': 'how are you',
        'cómo te llamas': 'what is your name',
        'cuántos años tienes': 'how old are you',
        'de dónde eres': 'where are you from',
        'qué hora es': 'what time is it',
        'me llamo': 'my name is',
        'mi nombre es': 'my name is',
        'hasta luego': 'see you later',
        'hasta mañana': 'see you tomorrow',
        'nos vemos': 'see you',
        'que tengas buen día': 'have a good day',
        'vivo en': 'I live in',
        'trabajo de': 'I work as',
        'trabajo como': 'I work as',
        'estoy haciendo': 'I am doing',
        'estoy bien': 'I am fine',
        'estoy mal': 'I am not well',
        'hace calor': 'it is hot',
        'hace frío': 'it is cold',
        'tengo hambre': 'I am hungry',
        'tengo sed': 'I am thirsty',
        'tengo sueño': 'I am sleepy',
        'me gusta': 'I like',
        'no me gusta': 'I do not like',
        'qué haces': 'what are you doing',
        'dónde vives': 'where do you live',
        'cuál es tu trabajo': 'what is your job',
        'pruebas de traducción': 'translation tests',
        'en vivo': 'live',
        
        // Palabras individuales
        'hola': 'hello',
        'adiós': 'goodbye',
        'gracias': 'thank you',
        'perdón': 'sorry',
        'disculpe': 'excuse me',
        'sí': 'yes',
        'no': 'no',
        'tal vez': 'maybe',
        'quizás': 'perhaps',
        'mañana': 'tomorrow',
        'ayer': 'yesterday',
        'hoy': 'today',
        'ahora': 'now',
        'después': 'later',
        'antes': 'before',
        'siempre': 'always',
        'nunca': 'never',
        'familia': 'family',
        'padre': 'father',
        'madre': 'mother',
        'hermano': 'brother',
        'hermana': 'sister',
        'hijo': 'son',
        'hija': 'daughter',
        'casa': 'house',
        'hogar': 'home',
        'trabajo': 'work',
        'escuela': 'school',
        'universidad': 'university',
        'hospital': 'hospital',
        'restaurante': 'restaurant',
        'tienda': 'store',
        'comida': 'food',
        'agua': 'water',
        'pan': 'bread',
        'carne': 'meat',
        'pollo': 'chicken',
        'pescado': 'fish',
        'verduras': 'vegetables',
        'fruta': 'fruit',
        'amigo': 'friend',
        'persona': 'person',
        'gente': 'people',
        'hombre': 'man',
        'mujer': 'woman',
        'niño': 'child',
        'bebé': 'baby',
        'bien': 'well',
        'mal': 'bad',
        'feliz': 'happy',
        'triste': 'sad',
        'cansado': 'tired',
        'enfermo': 'sick',
        'comer': 'eat',
        'beber': 'drink',
        'dormir': 'sleep',
        'trabajar': 'work',
        'estudiar': 'study',
        'caminar': 'walk',
        'correr': 'run',
        'hablar': 'speak',
        'escuchar': 'listen',
        'ver': 'see',
        'leer': 'read',
        'escribir': 'write',
        'soy': 'I am',
        'eres': 'you are',
        'es': 'is',
        'somos': 'we are',
        'son': 'they are',
        'tengo': 'I have',
        'tienes': 'you have',
        'tiene': 'has',
        'tenemos': 'we have',
        'tienen': 'they have',
        'estoy': 'I am',
        'estás': 'you are',
        'está': 'is',
        'estamos': 'we are',
        'están': 'they are',
        'años': 'years old',
        'año': 'year',
        'día': 'day',
        'semana': 'week',
        'mes': 'month',
        'tiempo': 'time',
        'hora': 'hour',
        'minuto': 'minute',
        'segundo': 'second',
        'hablo': 'I speak',
        'hablas': 'you speak',
        'habla': 'speaks',
        'hablamos': 'we speak',
        'hablan': 'they speak',
        'inglés': 'English',
        'español': 'Spanish',
        'idioma': 'language',
        'idiomas': 'languages',
        'muy': 'very',
        'mucho': 'much',
        'poco': 'little',
        'más': 'more',
        'menos': 'less',
        'grande': 'big',
        'pequeño': 'small',
        'nuevo': 'new',
        'viejo': 'old',
        'joven': 'young',
        'bueno': 'good',
        'malo': 'bad',
        'bonito': 'beautiful',
        'feo': 'ugly',
        'nombre': 'name',
        'cómo': 'how',
        'qué': 'what',
        'quién': 'who',
        'dónde': 'where',
        'cuándo': 'when',
        'por qué': 'why',
        'todos': 'everyone',
        'nada': 'nothing',
        'algo': 'something',
        'todo': 'everything',
        'hacer': 'do',
        'haciendo': 'doing',
        'hago': 'I do',
        'haces': 'you do',
        'hace': 'does',
        'hacemos': 'we do',
        'hacen': 'they do',
        'prueba': 'test',
        'pruebas': 'tests',
        'traducción': 'translation'
      },
      'en-es': {
        // Frases y expresiones comunes
        'very well': 'muy bien',
        'good morning': 'buenos días',
        'good afternoon': 'buenas tardes',
        'good night': 'buenas noches',
        'thank you': 'gracias',
        "you're welcome": 'de nada',
        'excuse me': 'disculpe',
        'I am sorry': 'lo siento',
        'how are you': 'cómo estás',
        'what is your name': 'cómo te llamas',
        'how old are you': 'cuántos años tienes',
        'where are you from': 'de dónde eres',
        'what time is it': 'qué hora es',
        'my name is': 'me llamo',
        'see you later': 'hasta luego',
        'see you tomorrow': 'hasta mañana',
        'see you': 'nos vemos',
        'have a good day': 'que tengas buen día',
        'I live in': 'vivo en',
        'I work as': 'trabajo como',
        'I am doing': 'estoy haciendo',
        'I am fine': 'estoy bien',
        'I am not well': 'estoy mal',
        'it is hot': 'hace calor',
        'it is cold': 'hace frío',
        'I am hungry': 'tengo hambre',
        'I am thirsty': 'tengo sed',
        'I am sleepy': 'tengo sueño',
        'I like': 'me gusta',
        'I do not like': 'no me gusta',
        'what are you doing': 'qué haces',
        'where do you live': 'dónde vives',
        'what is your job': 'cuál es tu trabajo',
        'years old': 'años',
        'I speak': 'hablo',
        'translation tests': 'pruebas de traducción',
        
        // Palabras individuales
        'hello': 'hola',
        'goodbye': 'adiós',
        'please': 'por favor',
        'sorry': 'perdón',
        'yes': 'sí',
        'no': 'no',
        'maybe': 'tal vez',
        'perhaps': 'quizás',
        'tomorrow': 'mañana',
        'yesterday': 'ayer',
        'today': 'hoy',
        'now': 'ahora',
        'later': 'después',
        'before': 'antes',
        'always': 'siempre',
        'never': 'nunca',
        'family': 'familia',
        'father': 'padre',
        'mother': 'madre',
        'brother': 'hermano',
        'sister': 'hermana',
        'son': 'hijo',
        'daughter': 'hija',
        'house': 'casa',
        'home': 'hogar',
        'work': 'trabajo',
        'school': 'escuela',
        'university': 'universidad',
        'hospital': 'hospital',
        'restaurant': 'restaurante',
        'store': 'tienda',
        'food': 'comida',
        'water': 'agua',
        'bread': 'pan',
        'meat': 'carne',
        'chicken': 'pollo',
        'fish': 'pescado',
        'vegetables': 'verduras',
        'fruit': 'fruta',
        'friend': 'amigo',
        'person': 'persona',
        'people': 'gente',
        'man': 'hombre',
        'woman': 'mujer',
        'child': 'niño',
        'baby': 'bebé',
        'well': 'bien',
        'bad': 'malo',
        'happy': 'feliz',
        'sad': 'triste',
        'tired': 'cansado',
        'sick': 'enfermo',
        'eat': 'comer',
        'drink': 'beber',
        'sleep': 'dormir',
        'study': 'estudiar',
        'walk': 'caminar',
        'run': 'correr',
        'speak': 'hablar',
        'listen': 'escuchar',
        'see': 'ver',
        'read': 'leer',
        'write': 'escribir',
        'I am': 'soy',
        'you are': 'eres',
        'is': 'es',
        'we are': 'somos',
        'they are': 'son',
        'I have': 'tengo',
        'you have': 'tienes',
        'has': 'tiene',
        'we have': 'tenemos',
        'they have': 'tienen',
        'year': 'año',
        'day': 'día',
        'week': 'semana',
        'month': 'mes',
        'time': 'tiempo',
        'hour': 'hora',
        'minute': 'minuto',
        'second': 'segundo',
        'speaks': 'habla',
        'we speak': 'hablamos',
        'they speak': 'hablan',
        'English': 'inglés',
        'Spanish': 'español',
        'language': 'idioma',
        'languages': 'idiomas',
        'very': 'muy',
        'much': 'mucho',
        'little': 'poco',
        'more': 'más',
        'less': 'menos',
        'big': 'grande',
        'small': 'pequeño',
        'new': 'nuevo',
        'old': 'viejo',
        'young': 'joven',
        'good': 'bueno',
        'beautiful': 'bonito',
        'ugly': 'feo',
        'name': 'nombre',
        'how': 'cómo',
        'what': 'qué',
        'who': 'quién',
        'where': 'dónde',
        'when': 'cuándo',
        'why': 'por qué',
        'everyone': 'todos',
        'nothing': 'nada',
        'something': 'algo',
        'everything': 'todo',
        'do': 'hacer',
        'doing': 'haciendo',
        'I do': 'hago',
        'you do': 'haces',
        'does': 'hace',
        'we do': 'hacemos',
        'they do': 'hacen',
        'test': 'prueba',
        'tests': 'pruebas',
        'translation': 'traducción',
        'live': 'en vivo'
      }
    };

    let translatedText = text.toLowerCase().trim();
    const translationMap = translations[direction as keyof typeof translations];
    
    if (translationMap) {
      // Sort by length (longest first) to handle phrases before individual words
      const sortedEntries = Object.entries(translationMap).sort((a, b) => b[0].length - a[0].length);
      
      sortedEntries.forEach(([original, translated]) => {
        // Use word boundaries for better matching
        const regex = new RegExp(`\\b${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        translatedText = translatedText.replace(regex, translated);
      });
    }

    // Capitalize first letter and clean up spacing
    translatedText = translatedText.trim();
    if (translatedText) {
      translatedText = translatedText.charAt(0).toUpperCase() + translatedText.slice(1);
    }
    
    console.log('Translation result:', translatedText);
    return translatedText;
  };

  // Process translation only when transcript changes and contains complete sentences
  useEffect(() => {
    if (transcript && transcript !== lastProcessedTranscript) {
      // Check if the transcript ends with punctuation (complete sentence)
      const hasCompleteSentence = /[.!?]$/.test(transcript.trim());
      
      if (hasCompleteSentence || !isListening) {
        console.log('Processing complete transcript for translation');
        setTranslationText(translateText(transcript, translationDirection));
        setLastProcessedTranscript(transcript);
      }
    } else if (!transcript) {
      setTranslationText('');
      setLastProcessedTranscript('');
    }
  }, [transcript, translationDirection, isListening, lastProcessedTranscript]);

  // Auto-scroll for transcript box
  useEffect(() => {
    if (transcriptionBoxRef.current) {
      transcriptionBoxRef.current.scrollTop = transcriptionBoxRef.current.scrollHeight;
    }
  }, [transcript]);

  // Auto-scroll for translation box
  useEffect(() => {
    if (translationBoxRef.current) {
      translationBoxRef.current.scrollTop = translationBoxRef.current.scrollHeight;
    }
  }, [translationText]);

  const handleDirectionChange = (value: string) => {
    if (value) {
      setTranslationDirection(value);
      
      // Update selected language based on translation direction
      if (value === 'es-en') {
        setSelectedLanguage('es-ES');
      } else {
        setSelectedLanguage('en-US');
      }
      
      // Re-translate current transcript with new direction
      if (transcript) {
        setTranslationText(translateText(transcript, value));
      }
    }
  };

  const handleReset = () => {
    resetTranscript();
    setTranslationText('');
    setLastProcessedTranscript('');
  };

  const getLanguageName = (code: string) => {
    return languages.find(lang => lang.code === code)?.name || code;
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Navegador no compatible
          </h2>
          <p className="text-gray-600">
            Tu navegador no soporta reconocimiento de voz. 
            Prueba con Chrome, Edge o Safari.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header - Simplified */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
              <Mic className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Translation Direction Selector */}
        <div className="flex justify-center mb-6">
          <Card className="p-4 shadow-md">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center gap-2">
                <Languages className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-gray-700">Traducción:</span>
              </div>
              
              <ToggleGroup 
                type="single" 
                value={translationDirection} 
                onValueChange={handleDirectionChange}
                className="border rounded-md"
              >
                <ToggleGroupItem value="es-en" className="px-3 flex items-center gap-1">
                  <span>🇪🇸</span>
                  <ArrowRight />
                  <span>🇺🇸</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="en-es" className="px-3 flex items-center gap-1">
                  <span>🇺🇸</span>
                  <ArrowRight />
                  <span>🇪🇸</span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </Card>
        </div>

        {/* Transcription Box */}
        <Card className="mb-4 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {translationDirection === 'es-en' ? 'Texto Original (Español)' : 'Original Text (English)'}
              </h2>
              {isListening && (
                <div className="flex items-center gap-2 text-red-500">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Escuchando...</span>
                </div>
              )}
            </div>
            
            <div 
              ref={transcriptionBoxRef}
              className="min-h-[150px] max-h-[250px] overflow-y-auto"
            >
              {transcript ? (
                <div className="text-lg leading-relaxed text-gray-800 whitespace-pre-wrap">
                  {transcript}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[150px] text-gray-400">
                  <div className="text-center">
                    <Mic className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">
                      {isListening 
                        ? "Comienza a hablar..." 
                        : "Presiona el botón de micrófono para empezar"
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
        
        {/* Translation Box */}
        <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {translationDirection === 'es-en' ? 'Translation (English)' : 'Traducción (Español)'}
              </h2>
              <div className="flex items-center gap-2 text-blue-500">
                <ArrowDown className="w-4 h-4" />
                <span className="text-sm font-medium">Traducción</span>
              </div>
            </div>
            
            <div 
              ref={translationBoxRef}
              className="min-h-[150px] max-h-[250px] overflow-y-auto"
            >
              {translationText ? (
                <div className="text-lg leading-relaxed text-gray-800 whitespace-pre-wrap">
                  {translationText}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[150px] text-gray-400">
                  <div className="text-center">
                    <ArrowDown className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">
                      La traducción aparecerá aquí cuando termine la oración
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={isListening ? stopListening : startListening}
            size="lg"
            className={`px-8 py-6 text-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                : 'bg-blue-500 hover:bg-blue-600 shadow-blue-200'
            } shadow-lg`}
          >
            {isListening ? (
              <>
                <MicOff className="w-6 h-6 mr-2" />
                Detener
              </>
            ) : (
              <>
                <Mic className="w-6 h-6 mr-2" />
                Iniciar
              </>
            )}
          </Button>

          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            className="px-6 py-6 text-lg font-semibold border-2 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
            disabled={!transcript}
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Limpiar
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p className="text-sm">
            Funciona mejor en ambientes silenciosos • Compatible con Chrome, Edge y Safari
          </p>
          <p className="text-xs mt-1">
            La traducción se procesa cuando terminas de hablar una oración completa
          </p>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionApp;
