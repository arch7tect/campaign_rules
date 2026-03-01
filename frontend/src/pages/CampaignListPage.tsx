import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CampaignForm } from '@/components/campaigns/CampaignForm'
import { useCampaigns, useCreateCampaign } from '@/hooks/use-campaigns'
import type { CampaignCreate } from '@/types/campaign'

export default function CampaignListPage() {
  const { data: campaigns, isLoading } = useCampaigns()
  const createMutation = useCreateCampaign()
  const [open, setOpen] = useState(false)

  function handleCreate(data: CampaignCreate) {
    createMutation.mutate(data, { onSuccess: () => setOpen(false) })
  }

  return (
    <div>
      <PageHeader
        title="Campaigns"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> New Campaign</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Campaign</DialogTitle></DialogHeader>
              <CampaignForm onSubmit={handleCreate} loading={createMutation.isPending} />
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
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns?.map(c => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link to={`/campaigns/${c.id}`} className="font-medium hover:underline">{c.name}</Link>
                </TableCell>
                <TableCell><Badge variant="secondary">{c.status}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
            {campaigns?.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No campaigns yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
