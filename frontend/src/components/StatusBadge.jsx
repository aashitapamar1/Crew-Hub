const COLORS = {
  ACTIVE: 'bg-green-100 text-green-700',
  AVAILABLE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-700',
  BUSY: 'bg-yellow-100 text-yellow-700',
  ARCHIVED: 'bg-red-100 text-red-700',
  PLANNED: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  ON_HOLD: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  TODO: 'bg-gray-100 text-gray-700',
  IN_REVIEW: 'bg-purple-100 text-purple-700',
  BLOCKED: 'bg-red-100 text-red-700',
}

function StatusBadge({ status }) {
  const colorClass = COLORS[status] || 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
      {status?.replace('_', ' ')}
    </span>
  )
}

export default StatusBadge
