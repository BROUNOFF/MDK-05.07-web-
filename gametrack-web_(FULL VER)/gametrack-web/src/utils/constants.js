// Статусы храним в БД латиницей, а пользователю показываем 
export const STATUSES = {
  backlog: 'В планах',
  playing: 'Прохожу',
  completed: 'Пройдено',
  dropped: 'Заброшено',
};

export const STATUS_KEYS = Object.keys(STATUSES);

export const PLATFORMS = ['PC', 'PS5', 'PS4', 'Xbox Series', 'Nintendo Switch', 'Mobile'];
