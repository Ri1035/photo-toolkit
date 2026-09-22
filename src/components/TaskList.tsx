import type { TaskItem as TaskItemType } from '../store/useTaskStore'
import { formatBytes, formatRatio } from '../utils/format'
import { saveBlob } from '../utils/download'

function TaskItem({ task, onRemove }: { task: TaskItemType; onRemove: () => void }) {
  const r = task.result
  return (
    <div className="task-item">
      {task.previewUrl ? (
        <img className="task-thumb" src={task.previewUrl} alt={task.name} />
      ) : (
        <div className="task-thumb task-thumb-placeholder">🖼️</div>
      )}

      <div className="task-info">
        <div className="task-name" title={task.name}>
          {task.name}
        </div>
        <div className="task-meta">
          <span>{formatBytes(task.size)}</span>
          {task.status === 'pending' && <span className="badge status-pending">待处理</span>}
          {task.status === 'running' && (
            <span className="badge status-running">
              <span className="spin">◌</span> 处理中
            </span>
          )}
          {task.status === 'done' && r && (
            <>
              <span>→</span>
              <span>{formatBytes(r.size)}</span>
              <span className={`badge ${r.size <= task.size ? 'shrink' : 'grow'}`}>
                {formatRatio(task.size, r.size)}
              </span>
              {r.meta.width > 0 && r.meta.originalWidth > 0 && (
                <span>
                  {r.meta.originalWidth}×{r.meta.originalHeight} → {r.meta.width}×{r.meta.height}
                </span>
              )}
              {r.meta.format.toUpperCase() && <span>{r.meta.format.toUpperCase()}</span>}
            </>
          )}
          {task.status === 'error' && <span className="badge status-error">失败</span>}
        </div>
        {r?.meta.note && <div className="task-note">⚠ {r.meta.note}</div>}
        {task.error && <div className="task-error">✕ {task.error}</div>}
      </div>

      <div className="task-actions">
        {task.status === 'done' && r && (
          <button
            className="icon-btn"
            title="下载"
            onClick={() => saveBlob(r.blob, r.outName)}
          >
            ⬇
          </button>
        )}
        <button className="icon-btn" title="移除" onClick={onRemove}>
          ✕
        </button>
      </div>
    </div>
  )
}

export function TaskList({
  tasks,
  onRemove,
}: {
  tasks: TaskItemType[]
  onRemove: (id: string) => void
}) {
  if (tasks.length === 0) return null
  return (
    <div className="task-list">
      {tasks.map((t) => (
        <TaskItem key={t.id} task={t} onRemove={() => onRemove(t.id)} />
      ))}
    </div>
  )
}
