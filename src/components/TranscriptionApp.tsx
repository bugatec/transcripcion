import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square, Play } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';
import useGoogleTranslate from '@/hooks/useGoogleTranslate';
import useAudioDevices from '@/hooks/useAudioDevices';
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
  const [transcript, setTranscript] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('es-ES');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState(0);
  
  const { theme, toggleTheme } = useTheme();
  const { devices, refreshDevices } = useAudioDevices();
  const { 
    isListening, 
    hasPermission, 
    startListening, 
    stopListening, 
    clearTranscript 
  } = useSpeechRecognition(
    transcript,
    setTranscript,
    sourceLanguage,
    selectedDeviceId
  );

  const { translatedText, translateText, isTranslating } = useGoogleTranslate();
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
      translateText(transcript, targetLanguage);
    }
  }, [transcript, targetLanguage, translateText]);

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
    clearTranscript();
    setTranscript('');
  };

  const getRecordingButtonColor = () => {
    if (isListening) return 'bg-red-500 hover:bg-red-600';
    if (isRecording) return 'bg-yellow-500 hover:bg-yellow-600';
    return 'bg-blue-500 hover:bg-blue-600';
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      <AppHeader theme={theme} onToggleTheme={toggleTheme} />
      
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Card className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-xl`}>
          <CardHeader className="text-center">
            <CardTitle className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              🎤 Transcripción y Traducción en Tiempo Real
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LanguageSelector
                label="Idioma de origen"
                value={sourceLanguage}
                onChange={setSourceLanguage}
                theme={theme}
                type="speech"
              />
              <LanguageSelector
                label="Idioma de destino"
                value={targetLanguage}
                onChange={setTargetLanguage}
                theme={theme}
                type="translation"
              />
            </div>

            <AudioDeviceSelector
              devices={devices}
              selectedDeviceId={selectedDeviceId}
              onDeviceChange={setSelectedDeviceId}
              onRefresh={refreshDevices}
              theme={theme}
            />

            <ControlButtons
              isRecording={isRecording}
              isListening={isListening}
              hasPermission={hasPermission}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onClearAll={handleClearAll}
              getRecordingButtonColor={getRecordingButtonColor}
              theme={theme}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TranscriptionBox
                transcript={transcript}
                isListening={isListening}
                theme={theme}
              />
              <TranslationBox
                translatedText={translatedText}
                isTranslating={isTranslating}
                theme={theme}
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
  );
};

export default TranscriptionApp;
