// Встроенный справочник игр. Используется для поиска, пока не указан ключ RAWG API.
// Поля совпадают с таблицей games в Supabase (см. supabase/schema.sql).
// id начинаются с 1000000000, чтобы не пересекаться с настоящими id из RAWG.
// Последнее число в строке — номер игры в Steam, по нему берём обложку.

const raw = [
  ['The Witcher 3: Wild Hunt', 2015, 'CD PROJEKT RED', ['RPG', 'Action'], ['PC', 'PS5', 'PS4', 'Xbox Series', 'Nintendo Switch'], 292030],
  ['Cyberpunk 2077', 2020, 'CD PROJEKT RED', ['RPG', 'Action', 'Shooter'], ['PC', 'PS5', 'Xbox Series'], 1091500],
  ['Elden Ring', 2022, 'FromSoftware', ['RPG', 'Action'], ['PC', 'PS5', 'PS4', 'Xbox Series'], 1245620],
  ['Hollow Knight', 2017, 'Team Cherry', ['Platformer', 'Indie', 'Action'], ['PC', 'PS4', 'Nintendo Switch'], 367520],
  ['Hollow Knight: Silksong', 2025, 'Team Cherry', ['Platformer', 'Indie', 'Action'], ['PC', 'PS5', 'PS4', 'Xbox Series', 'Nintendo Switch'], 1030300],
  ['Final Fantasy VII Rebirth', 2024, 'Square Enix', ['RPG', 'Action'], ['PS5', 'PC'], 2909400],
  ["Baldur's Gate 3", 2023, 'Larian Studios', ['RPG', 'Strategy'], ['PC', 'PS5', 'Xbox Series'], 1086940],
  ['Hades', 2020, 'Supergiant Games', ['Action', 'Indie', 'RPG'], ['PC', 'Nintendo Switch', 'PS5', 'PS4'], 1145360],
  ['Stardew Valley', 2016, 'ConcernedApe', ['Simulation', 'Indie', 'RPG'], ['PC', 'Nintendo Switch', 'PS4', 'Mobile'], 413150],
  ['Celeste', 2018, 'Maddy Makes Games', ['Platformer', 'Indie'], ['PC', 'Nintendo Switch', 'PS4'], 504230],
  ['Disco Elysium', 2019, 'ZA/UM', ['RPG', 'Adventure', 'Indie'], ['PC', 'PS5', 'PS4', 'Nintendo Switch'], 632470],
  ['Frostpunk', 2018, '11 bit studios', ['Strategy', 'Simulation'], ['PC', 'PS4'], 323190],
  ['Ghost of Tsushima', 2020, 'Sucker Punch Productions', ['Action', 'Adventure'], ['PS5', 'PS4', 'PC'], 2215430],
  ['Persona 5 Royal', 2019, 'Atlus', ['RPG'], ['PS5', 'PS4', 'PC', 'Nintendo Switch'], 1687950],
  ['Red Dead Redemption 2', 2018, 'Rockstar Games', ['Action', 'Adventure'], ['PC', 'PS4'], 1174180],
  ['God of War Ragnarök', 2022, 'Santa Monica Studio', ['Action', 'Adventure'], ['PS5', 'PS4', 'PC'], 2322010],
  ['Outer Wilds', 2019, 'Mobius Digital', ['Adventure', 'Indie', 'Puzzle'], ['PC', 'PS4', 'Nintendo Switch'], 753640],
  ['Sekiro: Shadows Die Twice', 2019, 'FromSoftware', ['Action', 'Adventure'], ['PC', 'PS4'], 814380],
  ['Dark Souls III', 2016, 'FromSoftware', ['RPG', 'Action'], ['PC', 'PS4'], 374320],
  ["Sid Meier's Civilization VI", 2016, 'Firaxis Games', ['Strategy'], ['PC', 'PS4', 'Nintendo Switch'], 289070],
  ['Subnautica', 2018, 'Unknown Worlds', ['Adventure', 'Indie', 'Simulation'], ['PC', 'PS4'], 264710],
  ['DOOM Eternal', 2020, 'id Software', ['Shooter', 'Action'], ['PC', 'PS4', 'Nintendo Switch'], 782330],
  ['Half-Life 2', 2004, 'Valve', ['Shooter', 'Action'], ['PC'], 220],
  ['Portal 2', 2011, 'Valve', ['Puzzle', 'Adventure'], ['PC'], 620],
  ['Mass Effect Legendary Edition', 2021, 'BioWare', ['RPG', 'Shooter', 'Action'], ['PC', 'PS4'], 1328670],
  ['Metro Exodus', 2019, '4A Games', ['Shooter', 'Action'], ['PC', 'PS5', 'PS4'], 412020],
  ['Forza Horizon 5', 2021, 'Playground Games', ['Racing', 'Sports'], ['PC', 'Xbox Series'], 1551360],
  ['It Takes Two', 2021, 'Hazelight Studios', ['Platformer', 'Adventure'], ['PC', 'PS5', 'PS4', 'Nintendo Switch'], 1426210],
  ['Terraria', 2011, 'Re-Logic', ['Action', 'Indie', 'Adventure'], ['PC', 'PS4', 'Nintendo Switch', 'Mobile'], 105600],
  ['Clair Obscur: Expedition 33', 2025, 'Sandfall Interactive', ['RPG'], ['PC', 'PS5', 'Xbox Series'], 1903340],
  ['Death Stranding', 2019, 'Kojima Productions', ['Action', 'Adventure'], ['PS5', 'PS4', 'PC'], 1190460],
  ['Hogwarts Legacy', 2023, 'Avalanche Software', ['RPG', 'Action'], ['PC', 'PS5', 'PS4', 'Xbox Series', 'Nintendo Switch'], 990080],
  ['Grand Theft Auto V', 2013, 'Rockstar North', ['Action', 'Adventure'], ['PC', 'PS5', 'PS4', 'Xbox Series'], 271590],
  ['Dead Cells', 2018, 'Motion Twin', ['Platformer', 'Action', 'Indie'], ['PC', 'Nintendo Switch', 'PS4', 'Mobile'], 588650],
  ['Slay the Spire', 2019, 'Mega Crit', ['Strategy', 'Indie'], ['PC', 'PS4', 'Nintendo Switch', 'Mobile'], 646570],
];

// Картинки лежат на сервере Steam: вертикальный постер и запасная горизонтальная шапка
const steamImage = (appId, file) => `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/${file}`;

export function steamCovers(appId) {
  if (!appId) return [];
  return [steamImage(appId, 'library_600x900.jpg'), steamImage(appId, 'header.jpg')];
}

export const catalog = raw.map(([title, release_year, developer, genres, platforms, steamId], i) => ({
  id: 1000000001 + i,
  title,
  release_year,
  developer,
  genres,
  platforms,
  cover_url: steamCovers(steamId)[0],
  steam_id: steamId,
}));

// Обложки по id игры: нужны для записей, сохранённых раньше без картинки
const coversById = new Map(catalog.map((g) => [g.id, steamCovers(g.steam_id)]));

export function catalogCovers(gameId) {
  return coversById.get(gameId) || [];
}
