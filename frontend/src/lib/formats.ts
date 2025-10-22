const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  year: 'numeric',
  month: 'long',
  day: '2-digit',
});

const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatDate = (value: string | number | Date) =>
  dateFormatter.format(new Date(value));

export const formatDateTime = (value: string | number | Date) =>
  dateTimeFormatter.format(new Date(value));
