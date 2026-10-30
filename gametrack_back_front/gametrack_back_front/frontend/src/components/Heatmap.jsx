import { toLocalDate } from '../utils/date';

const WEEKS = 26;
const dayNames = ['Пн', '', 'Ср', '', 'Пт', '', ''];

// Чем больше часов за день, тем темнее клетка
function shade(hours) {
  if (hours <= 0) return 'bg-neutral-100';
  if (hours <= 2) return 'bg-neutral-300';
  if (hours <= 4) return 'bg-neutral-500';
  return 'bg-black';
}

// Карта активности как на GitHub: колонки — недели, строки — дни недели
export default function Heatmap({ sessions }) {
  const hoursByDay = {};
  for (const s of sessions) hoursByDay[s.played_on] = (hoursByDay[s.played_on] || 0) + s.hours;

  // Начинаем с понедельника, который был WEEKS недель назад
  const today = new Date();
  const start = new Date(today);
  const weekday = (today.getDay() + 6) % 7; // 0 = понедельник
  start.setDate(today.getDate() - weekday - (WEEKS - 1) * 7);

  const weeks = [];
  let activeDays = 0;
  let periodHours = 0;
  for (let w = 0; w < WEEKS; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      const key = toLocalDate(date);
      const hours = Math.max(0, hoursByDay[key] || 0);
      const future = date > today;
      if (!future && hours > 0) {
        activeDays++;
        periodHours += hours;
      }
      days.push({ key, hours, future, date });
    }
    weeks.push(days);
  }

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-2">
        <div className="flex flex-col gap-1 mr-1">
          {dayNames.map((n, i) => (
            <span key={i} className="h-4 text-[10px] leading-4 text-neutral-400 w-5">{n}</span>
          ))}
        </div>
        {weeks.map((days, i) => (
          <div key={i} className="flex flex-col gap-1">
            {days.map((day) => (
              <div
                key={day.key}
                className={`w-4 h-4 rounded-sm ${day.future ? 'bg-transparent' : shade(day.hours)}`}
                title={day.future ? '' : `${day.date.toLocaleDateString('ru-RU')}: ${day.hours} ч.`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 text-xs text-neutral-500">
        <span>
          За {WEEKS} недель: <b className="text-black">{activeDays}</b> игровых дней, <b className="text-black">{periodHours}</b> ч.
        </span>
        <span className="flex items-center gap-1">
          Меньше
          {[0, 2, 4, 5].map((h) => <span key={h} className={`w-3 h-3 rounded-sm ${shade(h)}`} />)}
          Больше
        </span>
      </div>
    </div>
  );
}
