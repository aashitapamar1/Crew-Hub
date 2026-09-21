function StarRating({ value, onChange, readOnly = false }) {
  const stars = [1, 2, 3, 4, 5]

  return (
    <div className="flex gap-1">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={`text-xl leading-none ${readOnly ? 'cursor-default' : 'cursor-pointer'} ${
            star <= value ? 'text-yellow-400' : 'text-gray-300'
          }`}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default StarRating
