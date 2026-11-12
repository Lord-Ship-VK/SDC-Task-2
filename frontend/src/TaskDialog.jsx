import { useLayoutEffect, useRef, useState } from 'react'
import { LoaderCircle, Trash2, X } from 'lucide-react'
import { taskInput } from './tasks.js'

const emptyTask = { title: '', description: '', priority: 'medium', completed: false }

export default function TaskDialog({ action, task, pending, error, onClose, onSave, onDelete }) {
  const dialogRef = useRef(null)
  const [draft, setDraft] = useState(() => task ? taskInput(task) : emptyTask)
  const deleting = action === 'delete'
  const title = deleting ? 'Delete task?' : task ? 'Edit task' : 'New task'

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    dialog.querySelector('[data-initial-focus]').focus()
    return () => dialog.close()
  }, [])

  function updateField(event) {
    const { name, value } = event.target
    event.target.setCustomValidity('')
    setDraft((previous) => ({ ...previous, [name]: value }))
  }

  function save(event) {
    event.preventDefault()
    if (!draft.title.trim()) {
      const field = event.currentTarget.elements.namedItem('title')
      field.setCustomValidity('Enter a title with at least one non-space character.')
      field.reportValidity()
      return
    }
    onSave({ ...draft, title: draft.title.trim(), description: draft.description.trim() })
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="dialog-title"
      aria-describedby={deleting ? 'delete-description' : undefined}
      onCancel={(event) => {
        event.preventDefault()
        if (!pending) onClose()
      }}
      className="task-dialog"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="dialog-title" className="text-xl font-semibold tracking-tight">{title}</h2>
        <button type="button" className="icon-button" onClick={onClose} disabled={pending} aria-label="Close dialog">
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={deleting ? (event) => { event.preventDefault(); onDelete() } : save} aria-busy={pending}>
        {deleting ? (
          <p id="delete-description" className="mt-4 text-sm leading-relaxed text-muted [overflow-wrap:anywhere]">
            “{task.title}” will be permanently removed.
          </p>
        ) : (
          <fieldset className="mt-5 grid gap-4" disabled={pending}>
            <label className="form-label">
              Title
              <input
                data-initial-focus
                name="title"
                value={draft.title}
                onChange={updateField}
                maxLength={120}
                required
                placeholder="What needs to be done?"
                className="form-field"
              />
            </label>
            <label className="form-label">
              <span>Description <span className="font-normal text-muted">(optional)</span></span>
              <textarea
                name="description"
                value={draft.description}
                onChange={updateField}
                maxLength={2000}
                rows={4}
                placeholder="Add context or a next step"
                className="form-field resize-y"
              />
            </label>
            <label className="form-label">
              Priority
              <select name="priority" value={draft.priority} onChange={updateField} className="form-field">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </fieldset>
        )}

        {error && <p role="alert" className="error-banner mt-4">{error}</p>}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={pending}
            data-initial-focus={deleting ? true : undefined}
          >
            Cancel
          </button>
          <button type="submit" disabled={pending} className={deleting ? 'danger-button' : 'primary-button'}>
            {pending ? (
              <>
                <LoaderCircle size={16} className="motion-safe:animate-spin" aria-hidden="true" />
                {deleting ? 'Deleting…' : 'Saving…'}
              </>
            ) : deleting ? (
              <>
                <Trash2 size={16} aria-hidden="true" /> Delete task
              </>
            ) : task ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
