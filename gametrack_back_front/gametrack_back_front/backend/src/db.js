// Подключение к PostgreSQL через пул соединений
import pg from 'pg';

// По умолчанию pg отдаёт numeric строкой ("12.5"), а date превращает в Date со сдвигом часового пояса.
// Настраиваем: numeric -> число, date -> строка "YYYY-MM-DD", bigint -> число (id игр помещаются в Number)
pg.types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)));
pg.types.setTypeParser(1082, (v) => v);
pg.types.setTypeParser(20, (v) => Number(v));

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://gametrack:gametrack@localhost:5432/gametrack',
});

export function query(text, params) {
  return pool.query(text, params);
}
