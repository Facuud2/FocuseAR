import cors from 'cors';

// Dominios permitidos para CORS (pueden especificarse mediante la variable de entorno ALLOWED_ORIGINS)
const defaultAllowedOrigins = [
  'http://localhost:5173', // Desarrollo local Vite (principal)
  'http://localhost:3000', // Desarrollo local React
  'http://localhost:4173', // Preview Vite
  'https://focuse-ar.vercel.app', // Producción Vercel
];

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  : defaultAllowedOrigins;

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
  // Sólo establecer Access-Control-Allow-Origin si el origin está permitido
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With',
  );
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight por 24 horas

  if (process.env.CORS_DEBUG === 'true') {
    // Logueo opcional para depuración de orígenes
     
    console.log(
      '[CORS] addCorsHeaders origin=',
      origin,
      'allowed=',
      Boolean(origin && allowedOrigins.includes(origin)),
    );
  }
}

// Helper para manejar preflight OPTIONS
export function handleOptionsRequest(
  res: {
    setHeader: (name: string, value: string) => void;
    status: (code: number) => { send: (data: string) => void };
  },
  origin?: string,
) {
  // Validar origin explícitamente en preflight
  if (origin && !allowedOrigins.includes(origin)) {
     
    console.warn('[CORS] Forbidden preflight origin=', origin);
    res.status(403).send('Forbidden');
    return;
  }

  addCorsHeaders(res, origin);
  res.status(204).send('');
}

// Middleware adicional para validar origin en requests específicos
export function validateOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // Permitir requests sin origin
  return allowedOrigins.includes(origin);
}
