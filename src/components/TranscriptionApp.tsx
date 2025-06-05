import React, { useState, useEffect, useRef } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useNativeSpeechRecognition } from '../hooks/useNativeSpeechRecognition';
import { useGoogleTranslate } from '../hooks/useGoogleTranslate';
import { useAudioDevices } from '../hooks/useAudioDevices';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import AppHeader from './AppHeader';
import LanguageSelector from './LanguageSelector';
import AudioDeviceSelector from './AudioDeviceSelector';
import TranscriptionBox from './TranscriptionBox';
import TranslationBox from './TranslationBox';
import ControlButtons from './ControlButtons';

const TranscriptionApp = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('es-ES');
  const [translationDirection, setTranslationDirection] = useState('es-en');
  const [translationText, setTranslationText] = useState('');
  const [fullTranslationText, setFullTranslationText] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('default');
  const [fullTranscript, setFullTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [useNativeMode, setUseNativeMode] = useState(false);
  
  const translationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { audioDevices, isLoading: devicesLoading, permissionGranted, refreshDevices, testDevice } = useAudioDevices();
  const { translateText, isTranslating } = useGoogleTranslate();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  // Hook para reconocimiento web estándar
  const webSpeechRecognition = useSpeechRecognition(selectedLanguage, selectedDeviceId === 'default' ? '' : selectedDeviceId);

  // Hook para reconocimiento nativo
  const nativeSpeechRecognition = useNativeSpeechRecognition(selectedLanguage);

  // Determinar qué hook usar basado en disponibilidad y configuración
  const speechRecognition = useNativeMode ? nativeSpeechRecognition : webSpeechRecognition;

  const {
    transcript,
    isListening,
    isSupported,
    hasPermission,
    isMobile,
    isCapacitor,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
    requestPermission: requestMicrophonePermission
  } = speechRecognition;

  console.log('App environment:', { 
    isMobile, 
    isCapacitor, 
    isExpanded, 
    useNativeMode,
    isSupported,
    hasPermission,
    speechError
  });

  // Detectar automáticamente si usar modo nativo en móvil
  useEffect(() => {
    if ((isMobile || isCapacitor) && !webSpeechRecognition.isSupported && nativeSpeechRecognition.isSupported) {
      console.log('🔄 Cambiando a modo nativo automáticamente...');
      setUseNativeMode(true);
    }
  }, [isMobile, isCapacitor, webSpeechRecognition.isSupported, nativeSpeechRecognition.isSupported]);

  // Mostrar errores de reconocimiento de voz
  useEffect(() => {
    if (speechError) {
      toast({
        title: "Error de Reconocimiento",
        description: speechError,
        variant: "destructive"
      });
    }
  }, [speechError, toast]);

  // Acumular transcripción completa sin repeticiones
  useEffect(() => {
    if (transcript && isRecording) {
      if (transcript !== fullTranscript) {
        setFullTranscript(transcript);
      }
    }
  }, [transcript, isRecording]);

  // Real-time translation with debouncing
  useEffect(() => {
    const processRealTimeTranslation = async () => {
      if (transcript && transcript.trim()) {
        console.log('Processing real-time translation for:', transcript);
        
        const sourceLanguage = translationDirection === 'es-en' ? 'es' : 'en';
        const targetLanguage = translationDirection === 'es-en' ? 'en' : 'es';
        
        if (translationTimeoutRef.current) {
          clearTimeout(translationTimeoutRef.current);
        }
        
        translationTimeoutRef.current = setTimeout(async () => {
          try {
            const translated = await translateText(transcript, sourceLanguage, targetLanguage);
            setTranslationText(translated);
            setFullTranslationText(translated);
          } catch (error) {
            console.error('Real-time translation error:', error);
            setTranslationText('Error en la traducción');
          }
        }, 500);
      } else if (!transcript) {
        setTranslationText('');
      }
    };

    processRealTimeTranslation();

    return () => {
      if (translationTimeoutRef.current) {
        clearTimeout(translationTimeoutRef.current);
      }
    };
  }, [transcript, translationDirection, translateText]);

  const handleDirectionChange = (value: string) => {
    if (value) {
      setTranslationDirection(value);
      
      if (value === 'es-en') {
        setSelectedLanguage('es-ES');
      } else {
        setSelectedLanguage('en-US');
      }
      
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
    
    if (translationTimeoutRef.current) {
      clearTimeout(translationTimeoutRef.current);
    }
  };

  const handleDeviceChange = async (deviceId: string) => {
    if (useNativeMode) {
      toast({
        title: "Modo Nativo Activo",
        description: "En modo nativo se usa el micrófono predeterminado del dispositivo.",
      });
      return;
    }

    console.log('Changing audio device to:', deviceId);
    setSelectedDeviceId(deviceId);
    
    if (deviceId !== 'default') {
      const isWorking = await testDevice(deviceId);
      if (!isWorking) {
        alert('El dispositivo seleccionado no parece estar funcionando correctamente. Intenta con otro dispositivo.');
      }
    }
  };

  const toggleRecognitionMode = () => {
    if (isListening) {
      stopListening();
      setIsRecording(false);
    }
    
    setUseNativeMode(!useNativeMode);
    resetTranscript();
    
    toast({
      title: `Modo ${!useNativeMode ? 'Nativo' : 'Web'} Activado`,
      description: `Cambiando a reconocimiento de voz ${!useNativeMode ? 'nativo' : 'web'}.`,
    });
  };

  const handleMicrophoneClick = async () => {
    console.log('🎤 Botón de micrófono presionado');
    console.log('Estado actual:', { 
      isListening, 
      hasPermission, 
      isMobile, 
      isCapacitor, 
      useNativeMode,
      speechError
    });
    
    if (isListening) {
      console.log('🛑 Deteniendo grabación...');
      stopListening();
      setIsRecording(false);
    } else {
      console.log('🚀 Iniciando grabación...');
      setIsRecording(true);
      
      // Si no tenemos permisos o hay un error, solicitar permisos primero
      if (hasPermission === false || hasPermission === null || speechError) {
        console.log('🔐 Solicitando permisos de micrófono...');
        
        const granted = await requestMicrophonePermission();
        if (!granted) {
          console.error('❌ Permisos denegados');
          
          toast({
            title: "Permisos Requeridos",
            description: "Necesitas permitir el acceso al micrófono para usar esta función. Verifica la configuración de tu navegador o dispositivo.",
            variant: "destructive"
          });
          
          setIsRecording(false);
          return;
        }
      }
      
      // Pequeño delay para dispositivos móviles
      if (isMobile || isCapacitor) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      try {
        await startListening();
      } catch (error) {
        console.error('❌ Error iniciando reconocimiento:', error);
        toast({
          title: "Error al Iniciar",
          description: "No se pudo iniciar el reconocimiento de voz. Verifica los permisos del micrófono.",
          variant: "destructive"
        });
        setIsRecording(false);
      }
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
            Reconocimiento de voz no disponible
          </h2>
          <p className="text-gray-600 mb-4">
            No se detectó soporte para reconocimiento de voz en este dispositivo o navegador.
          </p>
          {(isMobile || isCapacitor) && (
            <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded">
              <p className="font-medium mb-1">Para dispositivos móviles:</p>
              <ul className="text-left list-disc list-inside space-y-1">
                <li>Verifica que tengas permisos de micrófono habilitados</li>
                <li>Usa un navegador compatible (Chrome, Safari)</li>
                <li>Asegúrate de tener conexión a internet</li>
              </ul>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <AppHeader 
          theme={theme}
          isMobile={isMobile}
          isExpanded={isExpanded}
          onToggleTheme={toggleTheme}
          onToggleExpanded={() => setIsExpanded(!isExpanded)}
        />

        {/* Mode Toggle for Mobile */}
        {(isMobile || isCapacitor) && !isExpanded && (
          <div className="flex justify-center mb-4">
            <Card className="p-3 shadow-md dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Modo:</span>
                <button
                  onClick={toggleRecognitionMode}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    useNativeMode
                      ? 'bg-green-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {useNativeMode ? '📱 Nativo' : '🌐 Web'}
                </button>
                <span className="text-xs text-gray-500">
                  {useNativeMode ? 'Micrófono del sistema' : 'API del navegador'}
                </span>
              </div>
            </Card>
          </div>
        )}

        {/* Language Selector - Hidden when expanded */}
        <LanguageSelector 
          translationDirection={translationDirection}
          onDirectionChange={handleDirectionChange}
          isHidden={isExpanded}
        />

        {/* Audio Device Selector - Hidden when expanded or in native mode */}
        {!isExpanded && !useNativeMode && (
          <div className="flex justify-center mb-6">
            <Card className="p-4 shadow-md dark:bg-gray-800">
              <AudioDeviceSelector
                selectedDeviceId={selectedDeviceId}
                audioDevices={audioDevices}
                devicesLoading={devicesLoading}
                permissionGranted={permissionGranted}
                onDeviceChange={handleDeviceChange}
                onRefreshDevices={refreshDevices}
                isHidden={isExpanded}
              />
            </Card>
          </div>
        )}

        {/* Text Boxes */}
        <div className={`grid gap-6 mb-8 ${
          isExpanded 
            ? 'grid-cols-1 md:grid-cols-2' 
            : 'grid-cols-1 lg:grid-cols-2'
        }`}>
          {/* Transcription Box */}
          <TranscriptionBox
            title={translationDirection === 'es-en' ? 'Texto Original (Español)' : 'Original Text (English)'}
            content={transcript}
            isListening={isListening}
            placeholder={isListening ? "Comienza a hablar..." : "Presiona el botón de micrófono para empezar"}
            onCopy={() => copyText('original')}
            onDownload={() => downloadTranscript('original')}
            isExpanded={isExpanded}
          />
          
          {/* Translation Box */}
          <TranslationBox
            title={translationDirection === 'es-en' ? 'Translation (English)' : 'Traducción (Español)'}
            content={translationText}
            isTranslating={isTranslating}
            placeholder="La traducción aparecerá en tiempo real mientras hablas"
            onCopy={() => copyText('translation')}
            onDownload={() => downloadTranscript('translation')}
            isExpanded={isExpanded}
          />
        </div>

        {/* Controls */}
        <ControlButtons
          isListening={isListening}
          hasPermission={hasPermission}
          isMobile={isMobile}
          transcript={transcript}
          onMicrophoneClick={handleMicrophoneClick}
          onReset={handleReset}
        />

        {/* Status Info */}
        {(isMobile || isCapacitor) && (
          <div className="text-center mt-6">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Modo: {useNativeMode ? 'Nativo' : 'Web'} | 
              Estado: {hasPermission ? '✅ Permitido' : '❌ Sin permisos'} |
              Soporte: {isSupported ? '✅ Disponible' : '❌ No disponible'}
            </p>
          </div>
        )}

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
