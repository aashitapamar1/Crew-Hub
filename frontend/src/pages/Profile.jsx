import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import * as authService from '../services/authService'

function Profile() {
  const { user, updateUser } = useAuth()

  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  async function handleProfileSubmit(e) {
    e.preventDefault()
    setProfileError('')
    setProfileMessage('')
    setSavingProfile(true)
    try {
      const res = await authService.updateProfile({ name, phone })
      updateUser(res.user)
      setProfileMessage('Profile updated successfully')
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Could not update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setPasswordError('')
    setPasswordMessage('')
    setSavingPassword(true)
    try {
      await authService.changePassword(currentPassword, newPassword)
      setPasswordMessage('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Could not change password')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="max-w-xl space-y-8">
      <h1 className="text-2xl font-semibold text-gray-800">Profile</h1>

      <form onSubmit={handleProfileSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-medium text-gray-800">Personal information</h2>

        {profileError && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{profileError}</div>}
        {profileMessage && <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{profileMessage}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="mt-1 w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500"
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {savingProfile ? 'Saving...' : 'Save changes'}
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-medium text-gray-800">Change password</h2>

        {passwordError && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{passwordError}</div>}
        {passwordMessage && <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{passwordMessage}</div>}

        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current password</label>
          <input
            id="currentPassword"
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New password</label>
          <input
            id="newPassword"
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={savingPassword}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {savingPassword ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </div>
  )
}

export default Profile
