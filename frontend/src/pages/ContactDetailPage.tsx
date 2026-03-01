import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ContactForm } from '@/components/contacts/ContactForm'
import { useContact, useUpdateContact } from '@/hooks/use-contacts'
import { useCampaignMembers } from '@/hooks/use-campaign-members'
import type { ContactCreate } from '@/types/contact'

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const contactId = Number(id)
  const { data: contact, isLoading } = useContact(contactId)
  const { data: memberships } = useCampaignMembers({ contact_id: contactId })
  const updateContact = useUpdateContact()
  const [editOpen, setEditOpen] = useState(false)

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>
  if (!contact) return <p>Contact not found</p>

  const displayName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || `Contact #${contact.id}`

  return (
    <div>
      <PageHeader
        title={displayName}
        breadcrumbs={[{ label: 'Contacts', to: '/contacts' }, { label: displayName }]}
        actions={
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Contact</DialogTitle></DialogHeader>
              <ContactForm
                initial={contact}
                onSubmit={(data: ContactCreate) =>
                  updateContact.mutate({ id: contactId, data }, { onSuccess: () => setEditOpen(false) })
                }
                loading={updateContact.isPending}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Contact Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Email:</span> {contact.email ?? '-'}</div>
            <div><span className="text-muted-foreground">Phone:</span> {contact.phone ?? '-'}</div>
            <div><span className="text-muted-foreground">Created:</span> {new Date(contact.created_at).toLocaleString()}</div>
          </CardContent>
        </Card>

        {contact.attributes && Object.keys(contact.attributes).length > 0 && (
          <Card>
            <CardHeader><CardTitle>Attributes</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                {Object.entries(contact.attributes).map(([key, val]) => (
                  <div key={key}><span className="text-muted-foreground">{key}:</span> {String(val)}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Campaign Memberships</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {memberships?.map(m => (
              <TableRow key={m.id}>
                <TableCell>{m.campaign_id}</TableCell>
                <TableCell><Badge variant="secondary">{m.status}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
            {memberships?.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No memberships</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
