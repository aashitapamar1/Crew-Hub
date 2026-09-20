import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../../services/authService'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)
    try {
      const res = await forgotPassword(email)
      setMessage(res.message)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-800">Forgot password</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter your email and we'll send you a reset link.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          {message && <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{message}</div>}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <Link to="/login" className="mt-4 block text-center text-sm text-blue-600 hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  )
}

export default ForgotPassword
