import { useState } from 'react';
import { mockGames } from '../data/mockData';

export default function Library() {
  const [filter, setFilter] = useState('Все');
  const statuses = ['Все', 'В планах', 'Прохожу', 'Пройдено'];

  const filteredGames = filter === 'Все' 
    ? mockGames 
    : mockGames.filter(game => game.status === filter);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Моя библиотека</h2>
        
        {/* Фильтры */}
        <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          {statuses.map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === status 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Сетка игр (Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredGames.map(game => (
          <div key={game.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
            <div className="h-48 overflow-hidden bg-gray-200">
              <img 
                src={game.cover} 
                alt={game.title} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 truncate" title={game.title}>{game.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{game.platform}</p>
              
              <div className="mt-4 flex items-center justify-between">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  game.status === 'Пройдено' ? 'bg-emerald-100 text-emerald-700' :
                  game.status === 'Прохожу' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {game.status}
                </span>
                {game.hours > 0 && (
                  <span className="text-xs text-gray-400 font-medium">{game.hours} ч.</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}