function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-800">{value}</p>
    </div>
  )
}

export default StatCard
