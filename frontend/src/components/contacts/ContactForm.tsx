import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Contact, ContactCreate } from '@/types/contact'

interface ContactFormProps {
  initial?: Contact
  onSubmit: (data: ContactCreate) => void
  loading?: boolean
}

export function ContactForm({ initial, onSubmit, loading }: ContactFormProps) {
  const [firstName, setFirstName] = useState(initial?.first_name ?? '')
  const [lastName, setLastName] = useState(initial?.last_name ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      first_name: firstName || null,
      last_name: lastName || null,
      email: email || null,
      phone: phone || null,
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
      <Button type="submit" disabled={loading}>{initial ? 'Update' : 'Create'}</Button>
    </form>
  )
}
