// Servicio para interactuar con la Cloud Function askGeminiBot

export interface AskGeminiBotParams {
  userId: string;
  material: string;
  topic: string;
  question: string;
}

export interface AskGeminiBotResponse {
  answer: string;
  source: string;
}

export async function askGeminiBot({
  userId,
  material,
  topic,
  question,
}: AskGeminiBotParams): Promise<AskGeminiBotResponse> {
  // Cambia esta URL por la de tu función en producción si es necesario
  const endpoint = import.meta.env.VITE_GEMINI_ENDPOINT_BOT;

  // Log de depuración
  console.log('[askGeminiBot] endpoint:', endpoint);
  console.log('[askGeminiBot] payload:', { userId, material, topic, question });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, material, topic, question }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('[askGeminiBot] error response:', error);
    throw new Error(error.error || 'Error al consultar la IA');
  }

  const data = await response.json();
  console.log('[askGeminiBot] respuesta:', data);
  // Normalizar distintos shapes que pueda devolver la Cloud Function:
  // - { response: 'texto', source: 'gemini-bot' }
  // - { answer: 'texto', source: 'gemini-bot' }
  // - { raw_response: 'texto', source: 'gemini' }
  const answer =
    (data &&
      (data.response || data.answer || data.raw_response || data.summary)) ||
    '';
  const source = (data && (data.source || data.from || '')) || '';

  return {
    answer: String(answer),
    source: String(source),
  };
}
