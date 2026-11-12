import { useEffect, useState } from 'react'
import {
  AlertCircle, ArrowUpRight, CheckCircle2, CircleDashed, ClipboardList,
  ListChecks, LoaderCircle, Plus, RefreshCw,
} from 'lucide-react'
import TaskDialog from './TaskDialog.jsx'
import TaskRow from './TaskRow.jsx'
import { docsUrl, requestTasks, taskInput } from './tasks.js'

const filters = ['All', 'Active', 'Completed']
const emptyMessages = {
  All: 'Create your first task to start organizing your work.',
  Active: 'There are no active tasks.',
  Completed: 'Tasks you mark complete will appear here.',
}

export default function App() {
  const [tasks, setTasks] = useState([])
  const [load, setLoad] = useState({ status: 'loading', error: '' })
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [filter, setFilter] = useState('All')
  const [dialog, setDialog] = useState(null)
  const [dialogError, setDialogError] = useState('')
  const [notice, setNotice] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const [mutation, setMutation] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadTasks() {
      try {
        const result = await requestTasks('', { signal: controller.signal })
        if (controller.signal.aborted) return
        setTasks(result)
        setHasLoaded(true)
        setLoad({ status: 'ready', error: '' })
      } catch (error) {
        if (controller.signal.aborted) return
        setLoad({ status: 'error', error: error.message })
      }
    }

    loadTasks()
    return () => controller.abort()
  }, [loadAttempt])

  const completed = tasks.filter((task) => task.completed).length
  const active = tasks.length - completed
  const percentage = tasks.length ? Math.round(completed / tasks.length * 100) : 0
  const visibleTasks = filter === 'All' ? tasks : tasks.filter((task) => task.completed === (filter === 'Completed'))
  const busy = mutation !== null
  const canChange = load.status === 'ready' && !busy
  const isLoading = load.status === 'loading'

  function refresh() {
    setNotice('')
    setLoad({ status: 'loading', error: '' })
    setLoadAttempt((attempt) => attempt + 1)
  }

  function openDialog(type, task) {
    setNotice('')
    setDialogError('')
    setDialog({ type, task })
  }

  async function changeTasks(key, run, onSuccess) {
    if (!canChange) return
    setNotice('')
    setDialogError('')
    setAnnouncement('')
    setMutation(key)
    try {
      const result = await run()
      onSuccess(result)
    } catch (error) {
      if (dialog) setDialogError(error.message)
      else setNotice(error.message)
    } finally {
      setMutation(null)
    }
  }

  function saveTask(input) {
    const previous = dialog.task
    changeTasks('save', () => requestTasks(previous ? `/${previous.id}` : '', {
      method: previous ? 'PUT' : 'POST', body: input,
    }), (saved) => {
      setTasks((current) => previous
        ? current.map((task) => task.id === saved.id ? saved : task)
        : [saved, ...current])
      if (!previous && filter === 'Completed') setFilter('All')
      setAnnouncement(previous ? 'Task updated.' : 'Task created.')
      setDialog(null)
    })
  }

  function toggleTask(task) {
    changeTasks(task.id, () => requestTasks(`/${task.id}`, {
      method: 'PUT',
      body: { ...taskInput(task), completed: !task.completed },
    }), (saved) => {
      setTasks((current) => current.map((entry) => entry.id === saved.id ? saved : entry))
      setAnnouncement(saved.completed ? 'Task completed.' : 'Task marked active.')
    })
  }

  function deleteTask() {
    const { id } = dialog.task
    changeTasks('delete', () => requestTasks(`/${id}`, { method: 'DELETE' }), () => {
      setTasks((current) => current.filter((task) => task.id !== id))
      setAnnouncement('Task deleted.')
      setDialog(null)
    })
  }

  return (
    <>
      <header className="site-header">
        <div className="workspace flex min-h-17 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="brand-icon"><ListChecks size={21} aria-hidden="true" /></span>
            <span className="text-sm font-semibold tracking-tight">Task Manager</span>
          </div>
          <a className="docs-link" href={docsUrl} target="_blank" rel="noreferrer">
            API docs <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </div>
      </header>

      <main className="workspace py-8 sm:py-11">
        <section className="hero-panel" aria-labelledby="page-title">
          <div className="relative min-w-0">
            <p className="mb-3 font-mono text-xs font-medium text-accent">SDC TASK 02</p>
            <h1 id="page-title" className="text-4xl font-semibold tracking-tight sm:text-5xl">Your task board</h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
              Track priorities, manage your to-dos, and see what’s done.
            </p>
            <button type="button" className="primary-button mt-6" disabled={!canChange} onClick={() => openDialog('create')}>
              <Plus size={18} aria-hidden="true" /> New task
            </button>
          </div>
          <div className="progress-panel">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-muted">Completion</span>
              <span className="font-mono text-xl font-semibold text-accent">{hasLoaded ? `${percentage}%` : '—'}</span>
            </div>
            <progress aria-label="Task completion" className="progress-bar" value={percentage} max={100} />
            <p className="text-xs text-muted">
              {hasLoaded ? `${completed} of ${tasks.length} tasks completed` : 'Waiting for tasks'}
            </p>
          </div>
        </section>

        <div className="summary-grid" aria-label="Task summary">
          {[
            { label: 'Total', count: tasks.length, Icon: ClipboardList },
            { label: 'Active', count: active, Icon: CircleDashed },
            { label: 'Completed', count: completed, Icon: CheckCircle2 },
          ].map(({ label, count, Icon }) => (
            <div key={label} className="summary-card">
              <Icon size={18} className="shrink-0 text-accent" aria-hidden="true" />
              <div>
                <p className="text-xs text-muted">{label}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{hasLoaded ? count : '—'}</p>
              </div>
            </div>
          ))}
        </div>

        <section className="mt-9" aria-labelledby="tasks-title">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="tasks-title" className="text-xl font-semibold tracking-tight">Tasks</h2>
            <button type="button" className="secondary-button" disabled={isLoading || busy} onClick={refresh}>
              <RefreshCw size={15} className={isLoading ? 'motion-safe:animate-spin' : ''} aria-hidden="true" />
              {isLoading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
          <div className="filter-bar" role="group" aria-label="Filter tasks">
            {filters.map((label) => (
              <button key={label} type="button" aria-pressed={filter === label} onClick={() => setFilter(label)}>
                {label}
              </button>
            ))}
          </div>

          {(load.error || notice) && (
            <div role="alert" className="error-banner mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <AlertCircle size={17} className="shrink-0" aria-hidden="true" />
              <p className="min-w-0 flex-1">{load.error || notice}</p>
              {load.error && <button type="button" className="secondary-button" onClick={refresh}>Retry</button>}
            </div>
          )}

          <div role="status" className="sr-only">{announcement}</div>
          {visibleTasks.length > 0 ? (
            <ul className="grid gap-2.5" aria-busy={isLoading}>
              {visibleTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  disabled={!canChange}
                  updating={mutation === task.id}
                  onToggle={toggleTask}
                  onEdit={(entry) => openDialog('edit', entry)}
                  onDelete={(entry) => openDialog('delete', entry)}
                />
              ))}
            </ul>
          ) : (
            <div className="empty-panel">
              {isLoading ? (
                <>
                  <LoaderCircle size={23} className="mx-auto text-accent motion-safe:animate-spin" aria-hidden="true" />
                  <p role="status" className="mt-3 text-sm text-muted">Loading tasks…</p>
                </>
              ) : (
                <>
                  <ClipboardList size={24} className="mx-auto text-accent" aria-hidden="true" />
                  <p className="mt-3 font-medium">{load.error ? 'Tasks unavailable' : 'No tasks here yet'}</p>
                  {!load.error && <p className="mt-1 text-sm text-muted">{emptyMessages[filter]}</p>}
                </>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="workspace flex flex-wrap items-center justify-between gap-2 border-t border-line py-5 text-xs text-muted">
        <span>Android Club · VIT Bhopal</span>
        <a href="https://github.com/Lord-Ship-VK" className="hover:text-accent">Venkatesh Kalyane</a>
      </footer>

      {dialog && (
        <TaskDialog
          action={dialog.type}
          task={dialog.task}
          pending={busy}
          error={dialogError}
          onClose={() => setDialog(null)}
          onSave={saveTask}
          onDelete={deleteTask}
        />
      )}
    </>
  )
}
