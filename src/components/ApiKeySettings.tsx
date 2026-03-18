'use client'

import { useState, useEffect } from 'react'

interface KeyState {
  set: boolean
  masked: string | null
}

const KEY_CONFIG = [
  {
    id: 'usda_api_key' as const,
    label: 'USDA API Key',
    description: 'Cross-references USDA FoodData Central for accurate nutrition data.',
    signupUrl: 'https://fdc.nal.usda.gov/api-key-signup',
    signupLabel: 'Get a free key',
  },
  {
    id: 'brave_api_key' as const,
    label: 'Brave Search API Key',
    description: 'Looks up restaurant menu nutrition info via web search.',
    signupUrl: 'https://brave.com/search/api/',
    signupLabel: 'Get a free key',
  },
]

export default function ApiKeySettings() {
  const [keys, setKeys] = useState<Record<string, KeyState>>({})
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState<{ key: string; text: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => setKeys(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (keyId: string) => {
    const value = inputs[keyId]?.trim()
    if (!value) return

    setSaving(keyId)
    setMessage(null)

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [keyId]: value }),
      })

      if (res.ok) {
        setKeys((prev) => ({
          ...prev,
          [keyId]: { set: true, masked: '****' + value.slice(-4) },
        }))
        setInputs((prev) => ({ ...prev, [keyId]: '' }))
        setMessage({ key: keyId, text: 'Saved', ok: true })
      } else {
        setMessage({ key: keyId, text: 'Failed to save', ok: false })
      }
    } catch {
      setMessage({ key: keyId, text: 'Failed to save', ok: false })
    } finally {
      setSaving(null)
    }
  }

  const handleClear = async (keyId: string) => {
    setSaving(keyId)
    setMessage(null)

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [keyId]: '' }),
      })

      if (res.ok) {
        setKeys((prev) => ({
          ...prev,
          [keyId]: { set: false, masked: null },
        }))
        setMessage({ key: keyId, text: 'Removed', ok: true })
      }
    } catch {
      setMessage({ key: keyId, text: 'Failed to remove', ok: false })
    } finally {
      setSaving(null)
    }
  }

  if (loading) return null

  return (
    <div className="bg-surface/80 backdrop-blur rounded-2xl border border-white/[0.06] p-4 space-y-4">
      <div>
        <p className="text-xs text-text-dim">API Keys</p>
        <p className="text-xs text-text-dim mt-0.5">
          Optional — these improve nutrition accuracy.
        </p>
      </div>

      {KEY_CONFIG.map((config) => {
        const keyState = keys[config.id]
        const isSet = keyState?.set
        const isSaving = saving === config.id

        return (
          <div key={config.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-white font-medium">{config.label}</label>
              {isSet && (
                <button
                  onClick={() => handleClear(config.id)}
                  disabled={isSaving}
                  className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </div>

            {isSet ? (
              <div className="flex items-center gap-2">
                <code className="text-xs text-zinc-400 bg-zinc-800/50 px-2 py-1.5 rounded flex-1">
                  {keyState.masked}
                </code>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Paste your key"
                  value={inputs[config.id] || ''}
                  onChange={(e) =>
                    setInputs((prev) => ({ ...prev, [config.id]: e.target.value }))
                  }
                  className="flex-1 bg-zinc-800/50 border border-white/[0.06] rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20"
                />
                <button
                  onClick={() => handleSave(config.id)}
                  disabled={isSaving || !inputs[config.id]?.trim()}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-lg border border-white/[0.06] transition-colors disabled:opacity-40"
                >
                  {isSaving ? '...' : 'Save'}
                </button>
              </div>
            )}

            <p className="text-xs text-zinc-500">
              {config.description}{' '}
              <a
                href={config.signupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline underline-offset-2 hover:text-blue-300"
              >
                {config.signupLabel}
              </a>
            </p>

            {message?.key === config.id && (
              <p className={`text-xs ${message.ok ? 'text-green-400' : 'text-red-400'}`}>
                {message.text}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
