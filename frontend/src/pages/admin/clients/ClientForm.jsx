import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as clientService from '../../../services/clientService'

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  companyName: '',
  industry: '',
  website: '',
  companyDescription: '',
  street: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  internalNotes: '',
}

function ClientForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [tempPassword, setTempPassword] = useState('')

  useEffect(() => {
    if (!isEdit) return
    clientService
      .getClient(id)
      .then((res) => {
        const c = res.client
        setForm({
          name: c.user.name || '',
          email: c.user.email || '',
          phone: c.user.phone || '',
          companyName: c.companyName || '',
          industry: c.industry || '',
          website: c.website || '',
          companyDescription: c.companyDescription || '',
          street: c.street || '',
          city: c.city || '',
          state: c.state || '',
          country: c.country || '',
          postalCode: c.postalCode || '',
          internalNotes: c.internalNotes || '',
        })
      })
      .catch(() => setError('Could not load client'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (isEdit) {
        const { email, ...updatable } = form
        await clientService.updateClient(id, updatable)
        navigate(`/clients/${id}`)
      } else {
        const res = await clientService.createClient(form)
        setTempPassword(res.tempPassword)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save client')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="text-gray-500">Loading...</p>
  }

  if (tempPassword) {
    return (
      <div className="max-w-lg rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-800">Client account created</h1>
        <p className="mt-2 text-sm text-gray-600">
          Share these login credentials with the client. The temporary password is shown only once.
        </p>
        <div className="mt-4 rounded-md bg-gray-50 p-4 text-sm">
          <p><span className="font-medium">Email:</span> {form.email}</p>
          <p><span className="font-medium">Temporary password:</span> {tempPassword}</p>
        </div>
        <button
          onClick={() => navigate('/clients')}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to clients
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-800">{isEdit ? 'Edit Client' : 'Add Client'}</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-800">Personal information</h2>
          <Field label="Full name" value={form.name} onChange={handleChange('name')} required />
          <Field label="Email" type="email" value={form.email} onChange={handleChange('email')} required disabled={isEdit} />
          <Field label="Phone" value={form.phone} onChange={handleChange('phone')} />
        </section>

        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-800">Company information</h2>
          <Field label="Company name" value={form.companyName} onChange={handleChange('companyName')} />
          <Field label="Industry" value={form.industry} onChange={handleChange('industry')} />
          <Field label="Website" value={form.website} onChange={handleChange('website')} />
          <div>
            <label className="block text-sm font-medium text-gray-700">Company description</label>
            <textarea
              value={form.companyDescription}
              onChange={handleChange('companyDescription')}
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-800">Address</h2>
          <Field label="Street" value={form.street} onChange={handleChange('street')} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="City" value={form.city} onChange={handleChange('city')} />
            <Field label="State" value={form.state} onChange={handleChange('state')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Country" value={form.country} onChange={handleChange('country')} />
            <Field label="Postal code" value={form.postalCode} onChange={handleChange('postalCode')} />
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-800">Internal notes</h2>
          <p className="text-xs text-gray-500">Not visible to the client.</p>
          <textarea
            value={form.internalNotes}
            onChange={handleChange('internalNotes')}
            rows={3}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </section>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create client'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required, disabled }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
      />
    </div>
  )
}

export default ClientForm
