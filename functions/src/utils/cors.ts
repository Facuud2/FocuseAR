import cors from 'cors';

// Dominios permitidos para CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
  'https://focuse-ar.vercel.app',
];

// Configuración segura de CORS
export const corsHandler = cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (como desde aplicaciones móviles, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por política CORS'));
    }
  },
  credentials: true, // Permitir cookies y credenciales
  optionsSuccessStatus: 200,
});

// Helper para añadir cabeceras CORS explícitas (útil para Cloud Run / Gen2)
export function addCorsHeaders(
  res: {
    setHeader: (name: string, value: string) => void;
  },
  origin?: string,
) {
  const allowedOrigin =
    origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With',
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight por 24 horas
}

// Helper para manejar preflight OPTIONS
export function handleOptionsRequest(
  res: {
    setHeader: (name: string, value: string) => void;
    status: (code: number) => { send: (data: string) => void };
  },
  origin?: string,
) {
  addCorsHeaders(res, origin);
  res.status(204).send('');
}

// Middleware adicional para validar origin en requests específicos
export function validateOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // Permitir requests sin origin
  return allowedOrigins.includes(origin);
}
