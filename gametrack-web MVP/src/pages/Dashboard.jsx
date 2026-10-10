import { mockGames } from '../data/mockData';
import { Gamepad2, Clock, Trophy } from 'lucide-react';

export default function Dashboard() {
  const completed = mockGames.filter(g => g.status === 'Пройдено').length;
  const totalHours = mockGames.reduce((acc, game) => acc + game.hours, 0);
  const playingNow = mockGames.find(g => g.status === 'Прохожу');

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Сводка</h2>
      
      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="bg-indigo-100 p-4 rounded-lg mr-4">
            <Gamepad2 className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Игр в библиотеке</p>
            <p className="text-2xl font-bold text-gray-800">{mockGames.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="bg-emerald-100 p-4 rounded-lg mr-4">
            <Trophy className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Пройдено</p>
            <p className="text-2xl font-bold text-gray-800">{completed}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="bg-amber-100 p-4 rounded-lg mr-4">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Наиграно часов</p>
            <p className="text-2xl font-bold text-gray-800">{totalHours} ч.</p>
          </div>
        </div>
      </div>

      {/* Играю сейчас */}
      {playingNow && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Играю сейчас</h3>
          <div className="flex items-center">
            <img src={playingNow.cover} alt={playingNow.title} className="w-24 h-32 object-cover rounded-md shadow" />
            <div className="ml-6">
              <h4 className="text-xl font-bold text-gray-900">{playingNow.title}</h4>
              <p className="text-gray-500 mb-4">{playingNow.platform}</p>
              <div className="flex items-center gap-4">
                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                  {playingNow.hours} часов
                </span>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                  +1 час
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}