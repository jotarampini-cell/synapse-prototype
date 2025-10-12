export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  language: string;
}

export async function transcribeAudio(audioBuffer: Buffer, languageCode: string = 'es-ES'): Promise<TranscriptionResult> {
  try {
    const apiKey = process.env.GEMINI_API_KEY; // Usamos la misma clave que Gemini
    
    if (!apiKey) {
      throw new Error('API Key de Google no configurada');
    }

    const audioBase64 = audioBuffer.toString('base64');
    
    const requestBody = {
      config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: languageCode,
        enableAutomaticPunctuation: true,
        model: 'latest_long'
      },
      audio: {
        content: audioBase64
      }
    };

    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error de API: ${errorData.error?.message || 'Error desconocido'}`);
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      throw new Error('No se pudo transcribir el audio');
    }

    const result = data.results[0];
    const alternative = result.alternatives?.[0];

    if (!alternative) {
      throw new Error('No se encontraron alternativas de transcripción');
    }

    return {
      transcript: alternative.transcript || '',
      confidence: alternative.confidence || 0,
      language: languageCode,
    };
  } catch (error) {
    console.error('Error en transcripción:', error);
    throw new Error('Error al transcribir el audio');
  }
}

// Función alternativa usando Web Speech API (gratuita, solo navegador)
export function createWebSpeechRecognition(languageCode: string = 'es-ES'): Promise<TranscriptionResult> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window)) {
      reject(new Error('Web Speech API no está disponible en este navegador'));
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = languageCode;

    let finalTranscript = '';
    let confidence = 0.8; // Web Speech API no proporciona confianza exacta

    recognition.onresult = (event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
          confidence = event.results[i][0].confidence || 0.8;
        }
      }
    };

    recognition.onend = () => {
      if (finalTranscript) {
        resolve({
          transcript: finalTranscript,
          confidence: confidence,
          language: languageCode,
        });
      } else {
        reject(new Error('No se pudo transcribir el audio'));
      }
    };

    recognition.onerror = (event: { error: string }) => {
      reject(new Error(`Error en reconocimiento: ${event.error}`));
    };

    recognition.start();
  });
}

// Función híbrida que intenta Google Cloud primero, luego Web Speech API
export async function transcribeAudioHybrid(audioBuffer: Buffer, languageCode: string = 'es-ES'): Promise<TranscriptionResult> {
  try {
    // Intentar Google Cloud Speech-to-Text primero
    return await transcribeAudio(audioBuffer, languageCode);
  } catch (error) {
    console.warn('Google Cloud Speech-to-Text falló, usando Web Speech API:', error);
    
    // Fallback a Web Speech API si está disponible
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      return await createWebSpeechRecognition(languageCode);
    }
    
    throw new Error('No hay servicios de transcripción disponibles');
  }
}
