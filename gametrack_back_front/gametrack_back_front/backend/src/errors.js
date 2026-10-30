// Ошибка с HTTP-кодом: бросаем её в обработчиках, а превращает в ответ общий middleware в index.js
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (message) => new HttpError(400, message);
export const notFound = (message = 'Не найдено') => new HttpError(404, message);
