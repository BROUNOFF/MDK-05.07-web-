import { STATUSES } from '../utils/constants';

// В монохроме статусы различаем заливкой и обводкой
const styles = {
  playing: 'bg-black text-white border-black',
  backlog: 'bg-white text-neutral-700 border-neutral-300',
  completed: 'bg-neutral-200 text-neutral-900 border-neutral-300',
  dropped: 'bg-white text-neutral-400 border-dashed border-neutral-300 line-through',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block text-xs font-mono px-2 py-0.5 rounded border ${styles[status]}`}>
      {STATUSES[status]}
    </span>
  );
}
