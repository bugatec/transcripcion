
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, RotateCcw, Languages, ArrowDown, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useGoogleTranslate } from '../hooks/useGoogleTranslate';
import { useAudioDevices } from '../hooks/useAudioDevices';
import ArrowRight from './ArrowRight';

const TranscriptionApp = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('es-ES');
  const [translationDirection, setTranslationDirection] = useState('es-en');
  const [translationText, setTranslationText] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const transcriptionBoxRef = useRef<HTMLDivElement>(null);
  const translationBoxRef = useRef<HTMLDivElement>(null);
  const translationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { audioDevices, refreshDevices } = useAudioDevices();
  const { translateText, isTranslating } = useGoogleTranslate();

  const {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition(selectedLanguage, selectedDeviceId);

  const languages = [
    { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
    { code: 'en-US', name: 'English', flag: '🇺🇸' }
  ];

  // Format text into sentences with line breaks for better readability
  const formatTextIntoSentences = (text: string) => {
    if (!text) return '';
    
    // Split by sentence-ending punctuation, colons, and question marks
    const sentences = text.split(/([.!?:]+)/).filter(s => s.trim());
    
    let formattedText = '';
    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i]?.trim();
      const punctuation = sentences[i + 1] || '';
      if (sentence) {
        formattedText += sentence + punctuation + '\n\n';
      }
    }
    
    // Also split by natural breaks (like lists or long pauses)
    return formattedText
      .replace(/,\s+([A-Z])/g, ',\n$1') // Break after commas followed by capital letters
      .replace(/:\s+/g, ':\n') // Break after colons
      .trim();
  };

  // Real-time translation with debouncing
  useEffect(() => {
    const processRealTimeTranslation = async () => {
      if (transcript && transcript.trim()) {
        console.log('Processing real-time translation for:', transcript);
        
        const sourceLanguage = translationDirection === 'es-en' ? 'es' : 'en';
        const targetLanguage = translationDirection === 'es-en' ? 'en' : 'es';
        
        // Clear existing timeout
        if (translationTimeoutRef.current) {
          clearTimeout(translationTimeoutRef.current);
        }
        
        // Set a small delay to avoid too many API calls
        translationTimeoutRef.current = setTimeout(async () => {
          try {
            const translated = await translateText(transcript, sourceLanguage, targetLanguage);
            setTranslationText(translated);
          } catch (error) {
            console.error('Real-time translation error:', error);
            setTranslationText('Error en la traducción');
          }
        }, 500); // 500ms delay to avoid excessive API calls
      } else if (!transcript) {
        setTranslationText('');
      }
    };

    processRealTimeTranslation();

    // Cleanup timeout on unmount
    return () => {
      if (translationTimeoutRef.current) {
        clearTimeout(translationTimeoutRef.current);
      }
    };
  }, [transcript, translationDirection, translateText]);

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
        const sourceLanguage = value === 'es-en' ? 'es' : 'en';
        const targetLanguage = value === 'es-en' ? 'en' : 'es';
        translateText(transcript, sourceLanguage, targetLanguage)
          .then(setTranslationText)
          .catch(() => setTranslationText('Error en la traducción'));
      }
    }
  };

  const handleReset = () => {
    resetTranscript();
    setTranslationText('');
    
    // Clear any pending translation timeout
    if (translationTimeoutRef.current) {
      clearTimeout(translationTimeoutRef.current);
    }
  };

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Translation Direction Selector */}
        <div className="flex justify-center mb-6">
          <Card className="p-4 shadow-md">
            <div className="flex flex-col sm:flex-row items-center gap-4">
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

              {/* Audio Device Selector */}
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-blue-500" />
                <Select value={selectedDeviceId} onValueChange={handleDeviceChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Seleccionar micrófono" />
                  </SelectTrigger>
                  <SelectContent>
                    {audioDevices.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || `Micrófono ${device.deviceId.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>

        {/* Full-width Transcription and Translation Boxes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Transcription Box */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm h-[70vh]">
            <div className="p-6 h-full flex flex-col">
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
                className="flex-1 overflow-y-auto scroll-smooth"
              >
                {transcript ? (
                  <div className="text-lg leading-relaxed text-gray-800 whitespace-pre-wrap">
                    {formatTextIntoSentences(transcript)}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <div className="text-center">
                        <p className="text-lg">
                          {isListening 
                            ? "Comienza a hablar..." 
                            : "Presiona el botón de micrófono para empezar"
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
          
          {/* Translation Box */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm h-[70vh]">
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {translationDirection === 'es-en' ? 'Translation (English)' : 'Traducción (Español)'}
                </h2>
                <div className="flex items-center gap-2 text-blue-500">
                  {isTranslating && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                  <ArrowDown className="w-4 h-4" />
                  <span className="text-sm font-medium">Traducción en tiempo real</span>
                </div>
              </div>
              
              <div 
                ref={translationBoxRef}
                className="flex-1 overflow-y-auto scroll-smooth"
              >
                {translationText ? (
                  <div className="text-lg leading-relaxed text-gray-800 whitespace-pre-wrap">
                    {formatTextIntoSentences(translationText)}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <ArrowDown className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p className="text-lg">
                        La traducción aparecerá en tiempo real mientras hablas
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

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
          <p className="text-xs mt-2 font-medium">
            Bugatecmx - Todos los derechos reservados 2025.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionApp;
