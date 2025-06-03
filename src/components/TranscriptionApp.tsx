import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square, Play } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useGoogleTranslate } from '@/hooks/useGoogleTranslate';
import { useAudioDevices } from '@/hooks/useAudioDevices';
import { useTheme } from '@/hooks/useTheme';
import TranscriptionBox from './TranscriptionBox';
import TranslationBox from './TranslationBox';
import LanguageSelector from './LanguageSelector';
import AudioDeviceSelector from './AudioDeviceSelector';
import ControlButtons from './ControlButtons';
import AppHeader from './AppHeader';
import { detectEnvironment } from '@/utils/deviceDetection';
import { checkMicrophonePermission, requestMicrophonePermission } from '@/utils/microphonePermissions';

const TranscriptionApp = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState('es-ES');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [translationDirection, setTranslationDirection] = useState('es-en');
  const [isExpanded, setIsExpanded] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  
  const { theme, toggleTheme } = useTheme();
  const { audioDevices, isLoading: devicesLoading, refreshDevices } = useAudioDevices();
  const { 
    transcript,
    isListening, 
    hasPermission, 
    startListening, 
    stopListening, 
    resetTranscript 
  } = useSpeechRecognition(sourceLanguage, selectedDeviceId);

  const { translateText, isTranslating } = useGoogleTranslate();
  const { isCapacitor, isMobile } = detectEnvironment();

  useEffect(() => {
    console.log('🚀 TranscriptionApp mounted');
    console.log('📱 Environment:', { isCapacitor, isMobile });
    
    const initializePermissions = async () => {
      console.log('🔍 Checking initial microphone permissions...');
      const hasAccess = await checkMicrophonePermission();
      console.log('🎤 Initial permission check result:', hasAccess);
    };
    
    initializePermissions();
    refreshDevices();
  }, []);

  useEffect(() => {
    console.log('🎤 Permission state changed:', hasPermission);
  }, [hasPermission]);

  useEffect(() => {
    if (transcript && transcript.trim()) {
      console.log('📝 Transcript updated, auto-translating...');
      const [source, target] = translationDirection.split('-');
      translateText(transcript, source, target).then(result => {
        setTranslatedText(result);
      }).catch(error => {
        console.error('Translation error:', error);
      });
    }
  }, [transcript, translationDirection, translateText]);

  const handleStartRecording = async () => {
    try {
      console.log('🚀 Starting to listen...');
      setIsRecording(true);
      
      // Para aplicaciones Capacitor
      if (isCapacitor) {
        console.log('📱 Capacitor app - checking permissions...');
        if (hasPermission === null || hasPermission === false) {
          console.log('🔐 Requesting microphone permission...');
          const granted = await requestMicrophonePermission();
          if (!granted) {
            console.error('❌ Permission denied');
            alert('❌ La aplicación necesita acceso al micrófono. Ve a Configuración > Aplicaciones > Transcripción > Permisos y activa el micrófono.');
            setIsRecording(false);
            return;
          }
        }
      } else if (isMobile) {
        // Mobile browser
        if (hasPermission === null || hasPermission === false) {
          const granted = await requestMicrophonePermission();
          if (!granted) {
            console.error('❌ Permission denied');
            alert('❌ Necesitas permitir el acceso al micrófono en la configuración del navegador.');
            setIsRecording(false);
            return;
          }
        }
        
        console.log('⏳ Adding delay for mobile browser...');
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        // Desktop
        if (hasPermission === null || hasPermission === false) {
          const granted = await requestMicrophonePermission();
          if (!granted) {
            console.error('❌ Permission denied');
            alert('❌ Necesitas permitir el acceso al micrófono para usar esta función.');
            setIsRecording(false);
            return;
          }
        }
      }
      
      startListening();
      
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      toast({
        title: "Error",
        description: "No se pudo iniciar la grabación. Verifica los permisos del micrófono.",
        variant: "destructive",
      });
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    console.log('🛑 Stopping recording...');
    setIsRecording(false);
    stopListening();
  };

  const handleClearAll = () => {
    console.log('🧹 Clearing all content...');
    resetTranscript();
    setTranslatedText('');
  };

  const handleCopyTranscript = () => {
    navigator.clipboard.writeText(transcript);
    toast({
      title: "Copiado",
      description: "Transcripción copiada al portapapeles",
    });
  };

  const handleDownloadTranscript = () => {
    const element = document.createElement('a');
    const file = new Blob([transcript], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'transcripcion.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyTranslation = () => {
    navigator.clipboard.writeText(translatedText);
    toast({
      title: "Copiado",
      description: "Traducción copiada al portapapeles",
    });
  };

  const handleDownloadTranslation = () => {
    const element = document.createElement('a');
    const file = new Blob([translatedText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'traduccion.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      <div className="container mx-auto px-4 py-8">
        <AppHeader 
          theme={theme} 
          isMobile={isMobile}
          isExpanded={isExpanded}
          onToggleTheme={toggleTheme}
          onToggleExpanded={() => setIsExpanded(!isExpanded)}
        />
        
        <div className="space-y-6">
          <Card className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-xl`}>
            <CardHeader className="text-center">
              <CardTitle className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                🎤 Transcripción y Traducción en Tiempo Real
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <LanguageSelector
                translationDirection={translationDirection}
                onDirectionChange={setTranslationDirection}
              />

              <AudioDeviceSelector
                selectedDeviceId={selectedDeviceId}
                audioDevices={audioDevices}
                devicesLoading={devicesLoading}
                onDeviceChange={setSelectedDeviceId}
                onRefreshDevices={refreshDevices}
              />

              <ControlButtons
                isListening={isListening}
                hasPermission={hasPermission}
                isMobile={isMobile}
                transcript={transcript}
                onMicrophoneClick={isListening ? handleStopRecording : handleStartRecording}
                onReset={handleClearAll}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TranscriptionBox
                  title="Transcripción"
                  content={transcript}
                  isListening={isListening}
                  placeholder="🎤 Presiona 'Iniciar' para comenzar a transcribir..."
                  onCopy={handleCopyTranscript}
                  onDownload={handleDownloadTranscript}
                  isExpanded={isExpanded}
                />
                <TranscriptionBox
                  title="Traducción"
                  content={translatedText}
                  isListening={isTranslating}
                  placeholder="🌐 La traducción aparecerá aquí automáticamente..."
                  onCopy={handleCopyTranslation}
                  onDownload={handleDownloadTranslation}
                  isExpanded={isExpanded}
                />
              </div>

              {hasPermission === false && (
                <div className={`p-4 rounded-lg border-2 border-dashed ${
                  theme === 'dark' 
                    ? 'border-red-400 bg-red-900/20 text-red-300' 
                    : 'border-red-300 bg-red-50 text-red-700'
                }`}>
                  <p className="text-center">
                    ⚠️ {isCapacitor 
                      ? 'La aplicación necesita acceso al micrófono. Ve a Configuración > Aplicaciones > Transcripción > Permisos y activa el micrófono.' 
                      : 'Necesitas permitir el acceso al micrófono para usar esta función. Ve a la configuración del navegador y permite el micrófono.'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionApp;
