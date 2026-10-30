# GameTrack — трекер бэклога и каталога игр (веб-версия)

Клиент-серверное приложение: свой бэкенд на **Node.js + Express**, база данных **PostgreSQL**,
фронтенд на **React + Vite + Tailwind CSS**. Всё запускается одной командой в **Docker**.

```
 Браузер ──► frontend (React, Nginx) ──/api──► backend (Node.js + Express) ──SQL──► PostgreSQL
            http://localhost:8080             http://localhost:3000/api            localhost:5432
```

```
gametrack/
├── docker-compose.yml                — три контейнера: db, backend, frontend
├── GameTrack.postman_collection.json — 18 готовых API-запросов для Postman
├── backend/                          — СЕРВЕР (бэкенд)
│   ├── db/schema.sql                 — таблицы базы данных
│   ├── src/index.js                  — запуск сервера, подключение маршрутов, обработка ошибок
│   ├── src/db.js                     — подключение к PostgreSQL (пул соединений)
│   ├── src/seed.js                   — создание таблиц и демо-аккаунта при старте
│   ├── src/middleware/auth.js        — проверка JWT-токена
│   ├── src/routes/                   — обработчики API: auth, library, sessions, goals, games, stats
│   ├── src/data/                     — встроенный каталог игр и демо-данные
│   └── Dockerfile
└── frontend/                         — КЛИЕНТ (сайт)
    ├── src/api/index.js              — все запросы к серверу (fetch + токен)
    ├── src/pages/, src/components/   — страницы и элементы интерфейса
    ├── nginx.conf                    — раздаёт сайт и пересылает /api на бэкенд
    └── Dockerfile
```


## 1. Запуск в Docker (основной способ)

### Шаг 1. Установить Docker Desktop (один раз)

1. Скачай **Docker Desktop for Windows**: https://www.docker.com/products/docker-desktop/
2. Установи, оставив галочку **Use WSL 2**. Если установщик попросит — перезагрузи ПК.
3. Запусти Docker Desktop и дождись внизу слева зелёной надписи **Engine running**.
4. Проверь в cmd: `docker --version` — должна появиться версия.

### Шаг 2. Распаковать проект

Распакуй архив, например, в `C:\Projects\`. Должна получиться папка `C:\Projects\gametrack\`,
внутри которой лежат `docker-compose.yml`, `backend` и `frontend`.

### Шаг 3. Запустить

```
cd C:\Projects\gametrack
docker compose up --build
```

Первый запуск займёт 3–5 минут: Docker скачает PostgreSQL, Node.js, Nginx и соберёт проект.
Готово, когда в логах появится строка:

```
backend-1  | Сервер GameTrack запущен: http://localhost:3000/api/health
```

### Шаг 4. Открыть

- Сайт: **http://localhost:8080** → «Подставить данные» → «Войти» (`demo@gametrack.ru` / `demo123`)
- Проверка API: http://localhost:3000/api/health

### Остановить и запустить снова

- Остановить: **Ctrl + C** в окне с логами (или `docker compose down`).
- Запустить снова: `docker compose up` (флаг `--build` нужен только после изменения кода).
- Стереть базу и начать с нуля: `docker compose down -v` — данные удалятся, демо-аккаунт создастся заново.


## 2. Запуск без Docker (для разработки)

Нужны Node.js и PostgreSQL. Базу проще всего всё равно поднять в Docker одной командой:

```
cd C:\Projects\gametrack
docker compose up db
```

<details>
<summary>Если ставишь PostgreSQL на Windows без Docker</summary>

Установи PostgreSQL с https://www.postgresql.org/download/windows/ (запомни пароль пользователя postgres),
затем в cmd:

```
psql -U postgres -c "create user gametrack with password 'gametrack';"
psql -U postgres -c "create database gametrack owner gametrack;"
```
</details>

Дальше открой **два** окна cmd.

**Окно 1 — сервер:**
```
cd C:\Projects\gametrack\backend
copy .env.example .env
npm install
npm run dev
```

**Окно 2 — сайт:**
```
cd C:\Projects\gametrack\frontend
npm install
npm run dev
```

Сайт откроется на http://localhost:5173, а его запросы `/api/...` Vite сам перешлёт на сервер (порт 3000).
`npm run dev` у бэкенда перезапускает сервер при каждом сохранении файла.


## 3. Что показать преподавателю

### Бэкенд — это папка `backend`

Supabase больше не используется: регистрацию, проверку паролей, токены и все запросы к базе
выполняет наш сервер. Главное, что стоит открыть:

| Файл | Что показать |
|---|---|
| `backend/db/schema.sql` | 5 таблиц, связи (foreign key), ограничения `check` и `unique` |
| `backend/src/index.js` | Express-сервер, подключение маршрутов, единый обработчик ошибок |
| `backend/src/routes/auth.js` | регистрация и вход: пароль хэшируется bcrypt, выдаётся JWT-токен |
| `backend/src/middleware/auth.js` | проверка токена: без него закрытые маршруты отвечают 401 |
| `backend/src/routes/library.js` | CRUD библиотеки: SQL с параметрами `$1, $2` (защита от SQL-инъекций), валидация |
| `backend/src/routes/stats.js` | аналитика в SQL: `count`, `sum`, `avg`, `group by`, `filter` |
| `docker-compose.yml` | как три контейнера связаны между собой |

### Список API

| Метод | Адрес | Что делает | Токен |
|---|---|---|---|
| GET | `/api/health` | сервер жив, связь с БД есть | — |
| POST | `/api/auth/register` | регистрация | — |
| POST | `/api/auth/login` | вход, возвращает токен | — |
| GET | `/api/auth/me` | текущий пользователь | ✓ |
| PATCH | `/api/auth/me` | сменить имя | ✓ |
| GET | `/api/games/search?q=...` | поиск по справочнику игр | — |
| GET | `/api/library` | вся библиотека | ✓ |
| GET | `/api/library/:id` | одна запись | ✓ |
| POST | `/api/library` | добавить игру | ✓ |
| PATCH | `/api/library/:id` | изменить статус, оценку, часы, цену... | ✓ |
| DELETE | `/api/library/:id` | удалить игру | ✓ |
| GET / POST | `/api/sessions` | игровые сессии | ✓ |
| GET / PUT | `/api/goals/:year` | цель на год | ✓ |
| GET | `/api/stats/summary` | сводная статистика | ✓ |
| POST | `/api/demo/import` | заполнить библиотеку демо-играми | ✓ |

### API-запросы в Postman

1. Открой Postman → **Import** → выбери файл `GameTrack.postman_collection.json`.
2. Слева появится коллекция **GameTrack API** с 18 запросами.
3. Сначала выполни **«3. Вход (демо-аккаунт)»** — токен сам сохранится и подставится в остальные запросы.
4. Для показа хватит четырёх запросов:
   - **7. Моя библиотека** — `GET`, список игр из PostgreSQL;
   - **8. Добавить игру** — `POST`, ответ `201 Created`;
   - **10. Изменить игру** — `PATCH`, меняем статус и оценку;
   - **18. Запрос без токена** — сервер отвечает `401`, то есть защита работает.
5. Можно запустить всю коллекцию сразу: на коллекции **⋯ → Run collection → Run**. Каждый запрос
   содержит автотест кода ответа, все 18 должны быть зелёными.

После запросов обнови сайт — добавленная через Postman игра появится в библиотеке.

### Посмотреть данные прямо в базе

```
docker compose exec db psql -U gametrack -c "select id, email, name from users;"
docker compose exec db psql -U gametrack -c "select g.title, ug.status, ug.playtime_hours from user_games ug join games g on g.id = ug.game_id;"
```

Или подключись через pgAdmin / DBeaver: хост `localhost`, порт `5432`, база `gametrack`,
пользователь `gametrack`, пароль `gametrack`.


## 4. Если что-то не работает

| Проблема | Что сделать |
|---|---|
| `docker` не является командой / `cannot connect to the Docker daemon` | Запусти Docker Desktop и дождись «Engine running» |
| `port is already allocated` для 5432 | На ПК уже стоит PostgreSQL. В `docker-compose.yml` замени `"5432:5432"` на `"5433:5432"` |
| `port is already allocated` для 8080 или 3000 | Закрой программу, занявшую порт, или замени левое число в `ports` (например, `"8081:80"`) |
| На сайте «Не удалось связаться с сервером» | Бэкенд не запущен: проверь логи `docker compose logs backend` или окно с `npm run dev` в `backend` |
| Бэкенд пишет «Не удалось подключиться к базе данных» | PostgreSQL не запущен или неверный `DATABASE_URL` в `backend/.env` |
| Изменил код, а в Docker ничего не поменялось | Пересобери: `docker compose up --build` |
| В VS Code жёлтые предупреждения в `index.css` | Это нормально: VS Code не знает команды Tailwind. Поставь расширение «Tailwind CSS IntelliSense» |
