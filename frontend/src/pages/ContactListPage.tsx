import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ContactForm } from '@/components/contacts/ContactForm'
import { useContacts, useCreateContact } from '@/hooks/use-contacts'
import type { ContactCreate } from '@/types/contact'

export default function ContactListPage() {
  const { data: contacts, isLoading } = useContacts()
  const createMutation = useCreateContact()
  const [open, setOpen] = useState(false)

  function handleCreate(data: ContactCreate) {
    createMutation.mutate(data, { onSuccess: () => setOpen(false) })
  }

  return (
    <div>
      <PageHeader
        title="Contacts"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> New Contact</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Contact</DialogTitle></DialogHeader>
              <ContactForm onSubmit={handleCreate} loading={createMutation.isPending} />
            </DialogContent>
          </Dialog>
        }
      />
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts?.map(c => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link to={`/contacts/${c.id}`} className="font-medium hover:underline">
                    {[c.first_name, c.last_name].filter(Boolean).join(' ') || `Contact #${c.id}`}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{c.email ?? '-'}</TableCell>
                <TableCell className="text-muted-foreground">{c.phone ?? '-'}</TableCell>
              </TableRow>
            ))}
            {contacts?.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No contacts yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
