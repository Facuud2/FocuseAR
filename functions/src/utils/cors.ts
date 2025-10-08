import cors from 'cors';

export const corsHandler = cors({ origin: true });

// Helper para añadir cabeceras CORS explícitas (útil para Cloud Run / Gen2)
export function addCorsHeaders(res: {
  setHeader: (name: string, value: string) => void;
}) {
  // Ajusta el origen según tu entorno de producción
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Helper para manejar preflight OPTIONS
export function handleOptionsRequest(res: {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => { send: (data: string) => void };
}) {
  addCorsHeaders(res);
  res.status(204).send('');
}
