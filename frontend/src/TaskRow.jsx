import { Check, LoaderCircle, Pencil, Trash2 } from 'lucide-react'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short', day: 'numeric', year: 'numeric',
})

export default function TaskRow({ task, disabled, updating, onToggle, onEdit, onDelete }) {
  return (
    <li className="task-row">
      <label className="completion-control">
        <input
          type="checkbox"
          checked={task.completed}
          disabled={disabled}
          onChange={() => onToggle(task)}
          aria-label={`Mark ${task.title} as ${task.completed ? 'active' : 'completed'}`}
        />
        <span aria-hidden="true">
          {updating ? <LoaderCircle size={14} className="motion-safe:animate-spin" /> : <Check size={14} strokeWidth={3} />}
        </span>
      </label>
      <div className="min-w-0 [overflow-wrap:anywhere]">
        <h3 className={task.completed ? 'font-medium text-muted line-through' : 'font-medium text-ink'}>
          {task.title}
        </h3>
        {task.description && (
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted">{task.description}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className={`priority-chip priority-${task.priority}`}>{task.priority} priority</span>
          <time className="text-xs text-muted" dateTime={task.created_at}>
            {dateFormatter.format(new Date(task.created_at))}
          </time>
        </div>
      </div>
      <div className="task-actions flex items-start gap-1">
        <button type="button" className="icon-button" disabled={disabled} onClick={() => onEdit(task)} aria-label={`Edit ${task.title}`}>
          <Pencil size={16} aria-hidden="true" />
        </button>
        <button type="button" className="icon-button delete-action" disabled={disabled} onClick={() => onDelete(task)} aria-label={`Delete ${task.title}`}>
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}
