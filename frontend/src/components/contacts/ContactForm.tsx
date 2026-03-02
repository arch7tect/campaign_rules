import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAttributes } from '@/hooks/use-attributes'
import type { Contact, ContactCreate } from '@/types/contact'
import type { AttributeDefinition } from '@/types/attribute'

interface ContactFormProps {
  initial?: Contact
  onSubmit: (data: ContactCreate) => void
  loading?: boolean
}

export function ContactForm({ initial, onSubmit, loading }: ContactFormProps) {
  const { data: attrDefs } = useAttributes({ owner_type: 'contact' })
  const [firstName, setFirstName] = useState(initial?.first_name ?? '')
  const [lastName, setLastName] = useState(initial?.last_name ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [attrValues, setAttrValues] = useState<Record<string, string>>({})

  const defs = attrDefs ?? []
  const extraAttrKeys = useMemo(() => {
    const existing = Object.keys(initial?.attributes ?? {})
    const defined = new Set(defs.map(def => def.name))
    return existing.filter(key => !defined.has(key))
  }, [defs, initial?.attributes])

  useEffect(() => {
    const next: Record<string, string> = {}
    const existing = initial?.attributes ?? {}
    for (const [key, value] of Object.entries(existing)) {
      next[key] = formatAttributeForInput(value)
    }
    for (const def of defs) {
      if (!(def.name in next)) next[def.name] = ''
    }
    setAttrValues(next)
  }, [defs, initial?.attributes])

  function setAttr(name: string, value: string) {
    setAttrValues(prev => ({ ...prev, [name]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const attributes: Record<string, unknown> = {}
    for (const def of defs) {
      attributes[def.name] = parseAttributeInput(attrValues[def.name] ?? '', def)
    }
    for (const key of extraAttrKeys) {
      attributes[key] = attrValues[key] ?? null
    }
    onSubmit({
      first_name: firstName || null,
      last_name: lastName || null,
      email: email || null,
      phone: phone || null,
      attributes,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="first_name">First Name</Label>
        <Input id="first_name" value={firstName} onChange={e => setFirstName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="last_name">Last Name</Label>
        <Input id="last_name" value={lastName} onChange={e => setLastName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
      </div>

      {(defs.length > 0 || extraAttrKeys.length > 0) && (
        <div className="space-y-3 border-t pt-3">
          <Label>Attributes</Label>
          {defs.map(def => (
            <div key={def.id} className="space-y-1">
              <Label className="text-xs">{def.display_name} ({def.name})</Label>
              {def.data_type === 'bool' ? (
                <Select
                  value={(attrValues[def.name] ?? '') || '__empty__'}
                  onValueChange={v => setAttr(def.name, v === '__empty__' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select boolean value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">true</SelectItem>
                    <SelectItem value="false">false</SelectItem>
                    <SelectItem value="__empty__">(empty)</SelectItem>
                  </SelectContent>
                </Select>
              ) : def.data_type === 'list' ? (
                <Textarea
                  className="font-mono text-xs"
                  rows={3}
                  value={attrValues[def.name] ?? ''}
                  onChange={e => setAttr(def.name, e.target.value)}
                  placeholder='["a","b"]'
                />
              ) : (
                <Input
                  type={def.data_type === 'int' || def.data_type === 'float' ? 'number' : 'text'}
                  value={attrValues[def.name] ?? ''}
                  onChange={e => setAttr(def.name, e.target.value)}
                />
              )}
            </div>
          ))}

          {extraAttrKeys.map(key => (
            <div key={key} className="space-y-1">
              <Label className="text-xs">{key} (custom)</Label>
              <Input value={attrValues[key] ?? ''} onChange={e => setAttr(key, e.target.value)} />
            </div>
          ))}
        </div>
      )}

      <Button type="submit" disabled={loading}>{initial ? 'Update' : 'Create'}</Button>
    </form>
  )
}

function formatAttributeForInput(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function parseAttributeInput(value: string, def: AttributeDefinition): unknown {
  const trimmed = value.trim()
  if (trimmed === '') return null

  if (def.data_type === 'int') {
    const parsed = Number.parseInt(trimmed, 10)
    return Number.isNaN(parsed) ? trimmed : parsed
  }

  if (def.data_type === 'float') {
    const parsed = Number.parseFloat(trimmed)
    return Number.isNaN(parsed) ? trimmed : parsed
  }

  if (def.data_type === 'bool') {
    if (trimmed.toLowerCase() === 'true') return true
    if (trimmed.toLowerCase() === 'false') return false
    return trimmed
  }

  if (def.data_type === 'list') {
    try {
      const parsed = JSON.parse(trimmed)
      return Array.isArray(parsed) ? parsed : trimmed
    } catch {
      return trimmed
    }
  }

  return trimmed
}
