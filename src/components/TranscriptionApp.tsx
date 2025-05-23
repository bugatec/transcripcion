
import React, { useState } from 'react';
import { Mic, MicOff, RotateCcw, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

const TranscriptionApp = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('es-ES');
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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
              <Mic className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Transcripción en Vivo
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Habla y mira como tus palabras aparecen en tiempo real
          </p>
        </div>

        {/* Language Selector */}
        <div className="flex justify-center mb-6">
          <Card className="p-4 shadow-md">
            <div className="flex items-center gap-3">
              <Languages className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-gray-700">Idioma:</span>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>
        </div>

        {/* Transcription Box */}
        <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <div className="p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Transcripción
              </h2>
              {isListening && (
                <div className="flex items-center gap-2 text-red-500">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Escuchando...</span>
                </div>
              )}
            </div>
            
            <div className="min-h-[300px] max-h-[500px] overflow-y-auto">
              {transcript ? (
                <div className="text-lg leading-relaxed text-gray-800 whitespace-pre-wrap">
                  {transcript}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-400">
                  <div className="text-center">
                    <Mic className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-xl">
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
