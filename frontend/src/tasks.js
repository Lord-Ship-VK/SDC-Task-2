const apiBase = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')

export const docsUrl = `${apiBase}/docs`

export async function requestTasks(path = '', { body, headers, ...options } = {}) {
  let response
  try {
    response = await fetch(`${apiBase}/tasks${path}`, {
      ...options,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: body === undefined ? headers : { ...headers, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Could not reach the task API. Check that the backend is running and try again.')
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    if (response.status === 404) {
      throw new Error('This task no longer exists. Refresh the list to see the latest tasks.')
    }
    if (response.status === 422) {
      throw new Error('Check that the title, description, and priority meet the form requirements.')
    }
    const detail = payload?.detail
    throw new Error(typeof detail === 'string' ? detail : 'The server could not complete the request. Try again.')
  }

  return response.status === 204 ? null : response.json()
}

export function taskInput(task) {
  const { title, description, priority, completed } = task
  return { title, description, priority, completed }
}
