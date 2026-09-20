import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as freelancerService from '../../../services/freelancerService'

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  title: '',
  skills: '',
  experience: '',
  bio: '',
  portfolioUrl: '',
  hourlyRate: '',
  availability: '',
  status: 'AVAILABLE',
}

function FreelancerForm() {
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
    freelancerService
      .getFreelancer(id)
      .then((res) => {
        const f = res.freelancer
        setForm({
          name: f.user.name || '',
          email: f.user.email || '',
          phone: f.user.phone || '',
          title: f.title || '',
          skills: (f.skills || []).join(', '),
          experience: f.experience || '',
          bio: f.bio || '',
          portfolioUrl: f.portfolioUrl || '',
          hourlyRate: f.hourlyRate ?? '',
          availability: f.availability || '',
          status: f.status || 'AVAILABLE',
        })
      })
      .catch(() => setError('Could not load freelancer'))
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
      const skillsArray = form.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      if (isEdit) {
        const { email, ...updatable } = form
        await freelancerService.updateFreelancer(id, { ...updatable, skills: skillsArray })
        navigate(`/freelancers/${id}`)
      } else {
        const res = await freelancerService.createFreelancer({ ...form, skills: skillsArray })
        setTempPassword(res.tempPassword)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save freelancer')
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
        <h1 className="text-xl font-semibold text-gray-800">Freelancer account created</h1>
        <p className="mt-2 text-sm text-gray-600">
          Share these login credentials with the freelancer. The temporary password is shown only once.
        </p>
        <div className="mt-4 rounded-md bg-gray-50 p-4 text-sm">
          <p><span className="font-medium">Email:</span> {form.email}</p>
          <p><span className="font-medium">Temporary password:</span> {tempPassword}</p>
        </div>
        <button
          onClick={() => navigate('/freelancers')}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to freelancers
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-800">{isEdit ? 'Edit Freelancer' : 'Add Freelancer'}</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-800">Personal information</h2>
          <Field label="Full name" value={form.name} onChange={handleChange('name')} required />
          <Field label="Email" type="email" value={form.email} onChange={handleChange('email')} required disabled={isEdit} />
          <Field label="Phone" value={form.phone} onChange={handleChange('phone')} />
        </section>

        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium text-gray-800">Professional information</h2>
          <Field label="Title" value={form.title} onChange={handleChange('title')} placeholder="e.g. React Developer" />
          <Field label="Skills (comma-separated)" value={form.skills} onChange={handleChange('skills')} placeholder="React, Node.js, TypeScript" />
          <Field label="Experience" value={form.experience} onChange={handleChange('experience')} placeholder="e.g. 5 years" />
          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              value={form.bio}
              onChange={handleChange('bio')}
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <Field label="Portfolio URL" value={form.portfolioUrl} onChange={handleChange('portfolioUrl')} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Hourly rate" type="number" value={form.hourlyRate} onChange={handleChange('hourlyRate')} />
            <Field label="Availability" value={form.availability} onChange={handleChange('availability')} placeholder="e.g. Full-time, 20 hrs/week" />
          </div>
        </section>

        {isEdit && (
          <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-medium text-gray-800">Status</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={form.status}
                onChange={handleChange('status')}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="AVAILABLE">Available</option>
                <option value="BUSY">Busy</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </section>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create freelancer'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required, disabled, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
      />
    </div>
  )
}

export default FreelancerForm
