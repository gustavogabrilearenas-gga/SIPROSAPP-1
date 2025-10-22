import { toUserMessage } from '@/lib/errors';

describe('Gestor de errores', () => {
  const cases: Array<[number, string]> = [
    [400, 'Datos inválidos'],
    [401, 'Sesión expirada'],
    [403, 'No autorizado'],
    [404, 'No encontrado'],
    [500, 'Error del servidor'],
  ];

  it.each(cases)('mappea el código %s al mensaje esperado', (status, expected) => {
    expect(toUserMessage({ status, message: 'Otro' })).toBe(expected);
  });

  it('retorna error inesperado cuando no es ApiError', () => {
    expect(toUserMessage(new Error('falló'))).toBe('Error inesperado');
  });
});
