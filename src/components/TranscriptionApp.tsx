
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
  useEffect(() => {
    if (transcript) {
      const translateText = (text: string, direction: string) => {
        console.log('Translating text:', text, 'Direction:', direction);
        
        const translations = {
          'es-en': {
            // Saludos y cortesía
            'hola': 'hello',
            'adiós': 'goodbye',
            'gracias': 'thank you',
            'por favor': 'please',
            'de nada': 'you\'re welcome',
            'perdón': 'sorry',
            'disculpe': 'excuse me',
            'lo siento': 'I am sorry',
            
            // Palabras básicas
            'sí': 'yes',
            'no': 'no',
            'tal vez': 'maybe',
            'quizás': 'perhaps',
            
            // Tiempo
            'buenos días': 'good morning',
            'buenas tardes': 'good afternoon',
            'buenas noches': 'good night',
            'mañana': 'tomorrow',
            'ayer': 'yesterday',
            'hoy': 'today',
            'ahora': 'now',
            
            // Preguntas comunes
            'cómo estás': 'how are you',
            'qué tal': 'how are you',
            'cómo te llamas': 'what is your name',
            'cuántos años tienes': 'how old are you',
            'de dónde eres': 'where are you from',
            'qué hora es': 'what time is it',
            
            // Familia
            'familia': 'family',
            'padre': 'father',
            'madre': 'mother',
            'hermano': 'brother',
            'hermana': 'sister',
            'hijo': 'son',
            'hija': 'daughter',
            
            // Casa y lugares
            'casa': 'house',
            'hogar': 'home',
            'trabajo': 'work',
            'escuela': 'school',
            'hospital': 'hospital',
            'restaurante': 'restaurant',
            'tienda': 'store',
            
            // Comida
            'comida': 'food',
            'agua': 'water',
            'pan': 'bread',
            'carne': 'meat',
            'pollo': 'chicken',
            'pescado': 'fish',
            'verduras': 'vegetables',
            'fruta': 'fruit',
            
            // Personas
            'amigo': 'friend',
            'persona': 'person',
            'hombre': 'man',
            'mujer': 'woman',
            'niño': 'child',
            'bebé': 'baby',
            
            // Estados
            'muy bien': 'very well',
            'bien': 'good',
            'mal': 'bad',
            'feliz': 'happy',
            'triste': 'sad',
            'cansado': 'tired',
            
            // Acciones
            'comer': 'eat',
            'beber': 'drink',
            'dormir': 'sleep',
            'trabajar': 'work',
            'estudiar': 'study',
            'caminar': 'walk',
            'correr': 'run',
            
            // Despedidas
            'hasta luego': 'see you later',
            'hasta mañana': 'see you tomorrow',
            'nos vemos': 'see you',
            'que tengas buen día': 'have a good day'
          },
          'en-es': {
            // Greetings and courtesy
            'hello': 'hola',
            'goodbye': 'adiós',
            'thank you': 'gracias',
            'please': 'por favor',
            'you\'re welcome': 'de nada',
            'sorry': 'perdón',
            'excuse me': 'disculpe',
            'I am sorry': 'lo siento',
            
            // Basic words
            'yes': 'sí',
            'no': 'no',
            'maybe': 'tal vez',
            'perhaps': 'quizás',
            
            // Time
            'good morning': 'buenos días',
            'good afternoon': 'buenas tardes',
            'good night': 'buenas noches',
            'tomorrow': 'mañana',
            'yesterday': 'ayer',
            'today': 'hoy',
            'now': 'ahora',
            
            // Common questions
            'how are you': 'cómo estás',
            'what is your name': 'cómo te llamas',
            'how old are you': 'cuántos años tienes',
            'where are you from': 'de dónde eres',
            'what time is it': 'qué hora es',
            
            // Family
            'family': 'familia',
            'father': 'padre',
            'mother': 'madre',
            'brother': 'hermano',
            'sister': 'hermana',
            'son': 'hijo',
            'daughter': 'hija',
            
            // House and places
            'house': 'casa',
            'home': 'hogar',
            'work': 'trabajo',
            'school': 'escuela',
            'hospital': 'hospital',
            'restaurant': 'restaurante',
            'store': 'tienda',
            
            // Food
            'food': 'comida',
            'water': 'agua',
            'bread': 'pan',
            'meat': 'carne',
            'chicken': 'pollo',
            'fish': 'pescado',
            'vegetables': 'verduras',
            'fruit': 'fruta',
            
            // People
            'friend': 'amigo',
            'person': 'persona',
            'man': 'hombre',
            'woman': 'mujer',
            'child': 'niño',
            'baby': 'bebé',
            
            // States
            'very well': 'muy bien',
            'good': 'bien',
            'bad': 'mal',
            'happy': 'feliz',
            'sad': 'triste',
            'tired': 'cansado',
            
            // Actions
            'eat': 'comer',
            'drink': 'beber',
            'sleep': 'dormir',
            'work': 'trabajar',
            'study': 'estudiar',
            'walk': 'caminar',
            'run': 'correr',
            
            // Farewells
            'see you later': 'hasta luego',
            'see you tomorrow': 'hasta mañana',
            'see you': 'nos vemos',
            'have a good day': 'que tengas buen día'
          }
        };

        let translatedText = text.toLowerCase();
        const translationMap = translations[direction as keyof typeof translations];
        
        if (translationMap) {
          // Sort by length (longest first) to handle phrases before individual words
          const sortedEntries = Object.entries(translationMap).sort((a, b) => b[0].length - a[0].length);
          
          sortedEntries.forEach(([original, translated]) => {
            const regex = new RegExp(`\\b${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            translatedText = translatedText.replace(regex, translated);
          });
        }

        // Capitalize first letter
        translatedText = translatedText.charAt(0).toUpperCase() + translatedText.slice(1);
        
        console.log('Translation result:', translatedText);
        return translatedText;
      };
      
      setTranslationText(translateText(transcript, translationDirection));
    } else {
      setTranslationText('');
    }
  }, [transcript, translationDirection]);

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
    }
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
                      La traducción aparecerá aquí
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
            onClick={resetTranscript}
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
        </div>
      </div>
    </div>
  );
};

export default TranscriptionApp;
