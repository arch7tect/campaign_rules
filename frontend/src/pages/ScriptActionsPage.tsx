import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScriptActionForm } from '@/components/script-actions/ScriptActionForm'
import { useCreateScriptAction, useDeleteScriptAction, useScriptActions, useUpdateScriptAction } from '@/hooks/use-script-actions'
import type { ScriptAction, ScriptActionCreate } from '@/types/script-action'

export default function ScriptActionsPage() {
  const { data: actions, isLoading } = useScriptActions()
  const createAction = useCreateScriptAction()
  const updateAction = useUpdateScriptAction()
  const deleteAction = useDeleteScriptAction()

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<ScriptAction | null>(null)

  function handleCreate(data: ScriptActionCreate) {
    createAction.mutate(data, { onSuccess: () => setCreateOpen(false) })
  }

  function openEdit(action: ScriptAction) {
    setEditing(action)
    setEditOpen(true)
  }

  function handleUpdate(data: ScriptActionCreate) {
    if (!editing) return
    updateAction.mutate(
      {
        id: editing.id,
        data,
      },
      {
        onSuccess: () => {
          setEditOpen(false)
          setEditing(null)
        },
      },
    )
  }

  return (
    <div>
      <PageHeader
        title="Script Actions"
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> New Script Action</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Script Action</DialogTitle></DialogHeader>
              <ScriptActionForm onSubmit={handleCreate} loading={createAction.isPending} />
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
              <TableHead>Description</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Delete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actions?.map(action => (
              <TableRow key={action.id}>
                <TableCell className="font-medium">
                  <button type="button" onClick={() => openEdit(action)} className="hover:underline text-left">
                    {action.name}
                  </button>
                </TableCell>
                <TableCell className="text-muted-foreground">{action.description || '-'}</TableCell>
                <TableCell className="text-muted-foreground">{new Date(action.updated_at).toLocaleDateString()}</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="destructive" size="sm" onClick={() => deleteAction.mutate(action.id)}>
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {actions?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">No script actions yet</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Script Action</DialogTitle></DialogHeader>
          {editing && (
            <ScriptActionForm
              initial={editing}
              onSubmit={handleUpdate}
              loading={updateAction.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
