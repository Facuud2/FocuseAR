// Configuración de CORS basada en variables de entorno
export const getCorsConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const customOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

  const baseOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:4173',
  ];

  const productionOrigins = [
    'https://focusear.web.app',
    'https://focusear.firebaseapp.com',
    ...customOrigins,
  ];

  return isDevelopment
    ? [...baseOrigins, ...productionOrigins]
    : productionOrigins;
};
