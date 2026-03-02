import { useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AttributeForm } from '@/components/attributes/AttributeForm'
import { useAttributes, useCreateAttribute, useDeleteAttribute, useUpdateAttribute } from '@/hooks/use-attributes'
import type { AttributeDefinition, AttributeDefinitionCreate } from '@/types/attribute'

export default function ContactAttributesPage() {
  const { data: attributes, isLoading } = useAttributes({ owner_type: 'contact' })
  const createAttribute = useCreateAttribute()
  const deleteAttribute = useDeleteAttribute()
  const updateAttribute = useUpdateAttribute()

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingAttr, setEditingAttr] = useState<AttributeDefinition | null>(null)
  const [editingDisplayName, setEditingDisplayName] = useState('')

  function handleCreateAttribute(data: AttributeDefinitionCreate) {
    createAttribute.mutate(data, { onSuccess: () => setCreateOpen(false) })
  }

  function openEditAttribute(attr: AttributeDefinition) {
    setEditingAttr(attr)
    setEditingDisplayName(attr.display_name)
    setEditOpen(true)
  }

  function handleUpdateAttribute(e: React.FormEvent) {
    e.preventDefault()
    if (!editingAttr) return
    updateAttribute.mutate(
      { id: editingAttr.id, data: { display_name: editingDisplayName } },
      { onSuccess: () => setEditOpen(false) },
    )
  }

  return (
    <div>
      <PageHeader
        title="Contact Attribute Metadata"
        breadcrumbs={[{ label: 'Contacts', to: '/contacts' }, { label: 'Attribute Metadata' }]}
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> Create Attribute</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Contact Attribute</DialogTitle></DialogHeader>
              <AttributeForm
                ownerType="contact"
                onSubmit={handleCreateAttribute}
                loading={createAttribute.isPending}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <p className="text-muted-foreground">Loading attributes...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Display Name</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attributes?.map(attr => (
              <TableRow key={attr.id}>
                <TableCell>{attr.display_name}</TableCell>
                <TableCell className="text-muted-foreground">{attr.name}</TableCell>
                <TableCell><Badge variant="outline">{attr.data_type}</Badge></TableCell>
                <TableCell className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEditAttribute(attr)}>
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteAttribute.mutate(attr.id)}
                    disabled={deleteAttribute.isPending}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(attributes?.length ?? 0) === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No attributes yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Attribute Metadata</DialogTitle></DialogHeader>
          {editingAttr && (
            <form onSubmit={handleUpdateAttribute} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={editingAttr.name} disabled />
              </div>
              <div>
                <Label>Data Type</Label>
                <Input value={editingAttr.data_type} disabled />
              </div>
              <div>
                <Label>Display Name</Label>
                <Input value={editingDisplayName} onChange={e => setEditingDisplayName(e.target.value)} required />
              </div>
              <Button type="submit" disabled={updateAttribute.isPending || !editingDisplayName.trim()}>Save</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
