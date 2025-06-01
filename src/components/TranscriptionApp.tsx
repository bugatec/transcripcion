import React, { useState, useRef, useEffect } from 'react';
import { MicOff, RotateCcw, Languages, ArrowDown, Headphones, RefreshCw, Moon, Sun, Download, Copy, Expand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useGoogleTranslate } from '../hooks/useGoogleTranslate';
import { useAudioDevices } from '../hooks/useAudioDevices';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '@/hooks/use-toast';
import ArrowRight from './ArrowRight';

const TranscriptionApp = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('es-ES');
  const [translationDirection, setTranslationDirection] = useState('es-en');
  const [translationText, setTranslationText] = useState('');
  const [fullTranslationText, setFullTranslationText] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('default');
  const [fullTranscript, setFullTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const transcriptionBoxRef = useRef<HTMLDivElement>(null);
  const translationBoxRef = useRef<HTMLDivElement>(null);
  const translationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { audioDevices, isLoading: devicesLoading, refreshDevices, testDevice } = useAudioDevices();
  const { translateText, isTranslating } = useGoogleTranslate();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const {
    transcript,
    isListening,
    isSupported,
    hasPermission,
    isMobile,
    startListening,
    stopListening,
    resetTranscript,
    requestMicrophonePermission
  } = useSpeechRecognition(selectedLanguage, selectedDeviceId === 'default' ? '' : selectedDeviceId);

  const languages = [
    { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
    { code: 'en-US', name: 'English', flag: '🇺🇸' }
  ];

  // Acumular transcripción completa sin repeticiones
  useEffect(() => {
    if (transcript && isRecording) {
      // Solo agregar si es diferente al texto actual
      if (transcript !== fullTranscript) {
        setFullTranscript(transcript);
      }
    }
  }, [transcript, isRecording]);

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
            // Actualizar la traducción completa también
            setFullTranslationText(translated);
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
    if (transcriptionBoxRef.current && transcript) {
      const element = transcriptionBoxRef.current;
      element.scrollTop = element.scrollHeight;
    }
  }, [transcript]);

  // Auto-scroll for translation box
  useEffect(() => {
    if (translationBoxRef.current && translationText) {
      const element = translationBoxRef.current;
      element.scrollTop = element.scrollHeight;
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
          .then((translated) => {
            setTranslationText(translated);
            setFullTranslationText(translated);
          })
          .catch(() => setTranslationText('Error en la traducción'));
      }
    }
  };

  const handleReset = () => {
    resetTranscript();
    setTranslationText('');
    setFullTranscript('');
    setFullTranslationText('');
    
    // Clear any pending translation timeout
    if (translationTimeoutRef.current) {
      clearTimeout(translationTimeoutRef.current);
    }
  };

  const handleDeviceChange = async (deviceId: string) => {
    console.log('Changing audio device to:', deviceId);
    setSelectedDeviceId(deviceId);
    
    // Test the device if it's not the default
    if (deviceId !== 'default') {
      const isWorking = await testDevice(deviceId);
      if (!isWorking) {
        alert('El dispositivo seleccionado no parece estar funcionando correctamente. Intenta con otro dispositivo.');
      }
    }
  };

  const handleMicrophoneClick = async () => {
    console.log('🎤 Microphone button clicked');
    console.log('Current state:', { isListening, hasPermission, isMobile, selectedDeviceId });
    
    if (isListening) {
      console.log('🛑 Stopping listening...');
      stopListening();
      setIsRecording(false);
    } else {
      console.log('🚀 Starting to listen...');
      setIsRecording(true);
      
      // For mobile devices, always check permissions first
      if (isMobile) {
        console.log('📱 Mobile device - checking permissions...');
        if (hasPermission === null || hasPermission === false) {
          console.log('🔐 Requesting microphone permission for mobile...');
          const granted = await requestMicrophonePermission();
          if (!granted) {
            console.error('❌ Permission denied');
            alert('❌ Necesitas permitir el acceso al micrófono para usar esta función. Ve a la configuración del navegador y permite el micrófono.');
            setIsRecording(false);
            return;
          }
        }
        
        // Add extra delay for mobile devices
        console.log('⏳ Adding delay for mobile device...');
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      startListening();
    }
  };

  const downloadTranscript = (type: 'original' | 'translation') => {
    const text = type === 'original' ? fullTranscript : fullTranslationText;
    const fileName = type === 'original' ? 'transcripcion-original' : 'traduccion';
    
    if (!text.trim()) {
      toast({
        title: "No hay contenido",
        description: `No hay ${type === 'original' ? 'transcripción' : 'traducción'} para descargar.`,
        variant: "destructive"
      });
      return;
    }

    const element = document.createElement("a");
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${fileName}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({
      title: "Descarga completa",
      description: `${type === 'original' ? 'La transcripción' : 'La traducción'} se ha descargado exitosamente.`,
    });
  };

  const copyText = async (type: 'original' | 'translation') => {
    const text = type === 'original' ? fullTranscript : fullTranslationText;
    
    if (!text.trim()) {
      toast({
        title: "No hay contenido",
        description: `No hay ${type === 'original' ? 'transcripción' : 'traducción'} para copiar.`,
        variant: "destructive"
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado al portapapeles",
        description: `${type === 'original' ? 'La transcripción' : 'La traducción'} se ha copiado exitosamente.`,
      });
    } catch (error) {
      toast({
        title: "Error al copiar",
        description: "No se pudo copiar al portapapeles.",
        variant: "destructive"
      });
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header with Theme Toggle - Hidden title on mobile */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 hidden md:block">
            Transcriptor de Voz
          </h1>
          <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            {/* Theme Toggle */}
            <Button
              onClick={toggleTheme}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4" />
                  Claro
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  Oscuro
                </>
              )}
            </Button>
            
            {/* Expand button for mobile */}
            {isMobile && (
              <Button
                onClick={() => setIsExpanded(!isExpanded)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Expand className="w-4 h-4" />
                {isExpanded ? 'Contraer' : 'Expandir'}
              </Button>
            )}
          </div>
        </div>

        {/* Translation Direction Selector */}
        <div className="flex justify-center mb-6">
          <Card className="p-4 shadow-md dark:bg-gray-800">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2">
                <Languages className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-gray-700 dark:text-gray-300">Traducción:</span>
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

              {/* Audio Device Selector - Hidden on mobile when expanded */}
              <div className={`flex items-center gap-2 ${isMobile && isExpanded ? 'hidden' : ''}`}>
                <Headphones className="w-5 h-5 text-blue-500" />
                <Select value={selectedDeviceId} onValueChange={handleDeviceChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Seleccionar micrófono" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Predeterminado</SelectItem>
                    {audioDevices.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshDevices}
                  disabled={devicesLoading}
                  className="px-2"
                >
                  <RefreshCw className={`w-4 h-4 ${devicesLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Full-width Transcription and Translation Boxes */}
        <div className={`grid gap-6 mb-8 ${
          isMobile && isExpanded 
            ? 'grid-cols-1' 
            : 'grid-cols-1 lg:grid-cols-2'
        }`}>
          {/* Transcription Box */}
          <Card className={`shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm ${
            isMobile && isExpanded ? 'h-[80vh]' : 'h-[70vh]'
          }`}>
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  {translationDirection === 'es-en' ? 'Texto Original (Español)' : 'Original Text (English)'}
                </h2>
                <div className="flex items-center gap-2">
                  {isListening && (
                    <div className="flex items-center gap-2 text-red-500 mr-4">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Escuchando...</span>
                    </div>
                  )}
                  {/* Botones de descarga/copia para texto original */}
                  <Button
                    onClick={() => copyText('original')}
                    variant="outline"
                    size="sm"
                    disabled={!fullTranscript.trim()}
                    className="flex items-center gap-1 px-2"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={() => downloadTranscript('original')}
                    variant="outline"
                    size="sm"
                    disabled={!fullTranscript.trim()}
                    className="flex items-center gap-1 px-2"
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <div 
                ref={transcriptionBoxRef}
                className="flex-1 overflow-y-auto scroll-smooth"
              >
                {transcript ? (
                  <div className="text-lg leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {formatTextIntoSentences(transcript)}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
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
          
          {/* Translation Box - Hidden on mobile when expanded to single column */}
          {(!isMobile || !isExpanded) && (
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm h-[70vh]">
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    {translationDirection === 'es-en' ? 'Translation (English)' : 'Traducción (Español)'}
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 text-blue-500 mr-4">
                      {isTranslating && (
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      )}
                      <ArrowDown className="w-4 h-4" />
                      <span className="text-sm font-medium">Traducción en tiempo real</span>
                    </div>
                    {/* Botones de descarga/copia para traducción */}
                    <Button
                      onClick={() => copyText('translation')}
                      variant="outline"
                      size="sm"
                      disabled={!fullTranslationText.trim()}
                      className="flex items-center gap-1 px-2"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => downloadTranscript('translation')}
                      variant="outline"
                      size="sm"
                      disabled={!fullTranslationText.trim()}
                      className="flex items-center gap-1 px-2"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <div 
                  ref={translationBoxRef}
                  className="flex-1 overflow-y-auto scroll-smooth"
                >
                  {translationText ? (
                    <div className="text-lg leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {formatTextIntoSentences(translationText)}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
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
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={handleMicrophoneClick}
            size="lg"
            className={`px-8 py-6 text-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                : 'bg-blue-500 hover:bg-blue-600 shadow-blue-200'
            } shadow-lg`}
            disabled={hasPermission === false && !isMobile}
          >
            {isListening ? (
              <>
                <MicOff className="w-6 h-6 mr-2" />
                Detener
              </>
            ) : (
              <>
                <div className="w-6 h-6 mr-2 bg-white rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-current rounded-full"></div>
                </div>
                {isMobile && hasPermission === false ? 'Permitir Micrófono' : 'Iniciar'}
              </>
            )}
          </Button>

          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            className="px-6 py-6 text-lg font-semibold border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 transform hover:scale-105"
            disabled={!transcript}
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Limpiar
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 dark:text-gray-400">
          <p className="text-xs mt-2 font-medium">
            Bugatecmx - Todos los derechos reservados 2025.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionApp;
