// Validaciones comunes para las funciones
export function validateRequiredFields(
  data: Record<string, unknown>,
  requiredFields: string[],
): string | null {
  for (const field of requiredFields) {
    if (!data[field]) {
      return `El campo '${field}' es requerido`;
    }
  }
  return null;
}

export function validateArrayField(
  data: Record<string, unknown>,
  fieldName: string,
): string | null {
  if (!Array.isArray(data[fieldName])) {
    return `El campo '${fieldName}' debe ser un array`;
  }
  return null;
}
