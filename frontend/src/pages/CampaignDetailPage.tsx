import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Plus, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CampaignForm } from '@/components/campaigns/CampaignForm'
import { AttributeForm } from '@/components/attributes/AttributeForm'
import { useCampaign, useUpdateCampaign } from '@/hooks/use-campaigns'
import { useRules, useCreateRule, useUpdateRule, useDeleteRule } from '@/hooks/use-rules'
import { useCampaignMembers, useCreateCampaignMember, useDeleteCampaignMember } from '@/hooks/use-campaign-members'
import { useAttributes, useCreateAttribute, useDeleteAttribute } from '@/hooks/use-attributes'
import { useCommunications, useCancelCommunication } from '@/hooks/use-communications'
import { useContacts } from '@/hooks/use-contacts'
import type { CampaignCreate } from '@/types/campaign'
import type { AttributeDefinitionCreate } from '@/types/attribute'

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const campaignId = Number(id)
  const { data: campaign, isLoading } = useCampaign(campaignId)
  const updateCampaign = useUpdateCampaign()

  const [editOpen, setEditOpen] = useState(false)

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>
  if (!campaign) return <p>Campaign not found</p>

  return (
    <div>
      <PageHeader
        title={campaign.name}
        breadcrumbs={[{ label: 'Campaigns', to: '/campaigns' }, { label: campaign.name }]}
        actions={
          <>
            <Badge variant="secondary">{campaign.status}</Badge>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Edit Campaign</DialogTitle></DialogHeader>
                <CampaignForm
                  initial={campaign}
                  onSubmit={(data: CampaignCreate) =>
                    updateCampaign.mutate({ id: campaignId, data }, { onSuccess: () => setEditOpen(false) })
                  }
                  loading={updateCampaign.isPending}
                />
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="attributes">Attributes</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
        </TabsList>

        <TabsContent value="rules"><RulesTab campaignId={campaignId} /></TabsContent>
        <TabsContent value="members"><MembersTab campaignId={campaignId} /></TabsContent>
        <TabsContent value="attributes"><AttributesTab campaignId={campaignId} /></TabsContent>
        <TabsContent value="communications"><CommunicationsTab campaignId={campaignId} /></TabsContent>
      </Tabs>
    </div>
  )
}

function RulesTab({ campaignId }: { campaignId: number }) {
  const { data: rules } = useRules(campaignId)
  const createRule = useCreateRule()
  const updateRule = useUpdateRule()
  const deleteRule = useDeleteRule()
  const [newName, setNewName] = useState('')
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-4">
      <div className="flex justify-end mb-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Rule</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Rule</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); createRule.mutate({ campaign_id: campaignId, name: newName }, { onSuccess: () => { setOpen(false); setNewName('') } }) }} className="space-y-4">
              <div><Label>Name</Label><Input value={newName} onChange={e => setNewName(e.target.value)} required /></div>
              <Button type="submit" disabled={createRule.isPending || !newName}>Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules?.map(r => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell>
                <Switch
                  checked={r.is_active}
                  onCheckedChange={checked => updateRule.mutate({ id: r.id, data: { is_active: checked } })}
                />
              </TableCell>
              <TableCell className="space-x-2">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/campaigns/${campaignId}/rules/${r.id}`}>Edit</Link>
                </Button>
                <Button variant="destructive" size="sm" onClick={() => deleteRule.mutate(r.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
          {rules?.length === 0 && (
            <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No rules yet</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function MembersTab({ campaignId }: { campaignId: number }) {
  const { data: members } = useCampaignMembers({ campaign_id: campaignId })
  const { data: contacts } = useContacts()
  const createMember = useCreateCampaignMember()
  const deleteMember = useDeleteCampaignMember()
  const [open, setOpen] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState('')

  const memberContactIds = new Set(members?.map(m => m.contact_id) ?? [])
  const availableContacts = contacts?.filter(c => !memberContactIds.has(c.id)) ?? []

  return (
    <div className="mt-4">
      <div className="flex justify-end mb-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Member</DialogTitle></DialogHeader>
            <form onSubmit={e => {
              e.preventDefault()
              createMember.mutate(
                { contact_id: Number(selectedContactId), campaign_id: campaignId },
                { onSuccess: () => { setOpen(false); setSelectedContactId('') } }
              )
            }} className="space-y-4">
              <div>
                <Label>Contact</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={selectedContactId}
                  onChange={e => setSelectedContactId(e.target.value)}
                  required
                >
                  <option value="">Select a contact...</option>
                  {availableContacts.map(c => (
                    <option key={c.id} value={c.id}>
                      {[c.first_name, c.last_name].filter(Boolean).join(' ') || c.email || `Contact #${c.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={createMember.isPending || !selectedContactId}>Add</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contact ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members?.map(m => (
            <TableRow key={m.id}>
              <TableCell>{m.contact_id}</TableCell>
              <TableCell><Badge variant="secondary">{m.status}</Badge></TableCell>
              <TableCell className="text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button variant="destructive" size="sm" onClick={() => deleteMember.mutate(m.id)}>Remove</Button>
              </TableCell>
            </TableRow>
          ))}
          {members?.length === 0 && (
            <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No members yet</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function AttributesTab({ campaignId }: { campaignId: number }) {
  const { data: attrs } = useAttributes({ campaign_id: campaignId })
  const createAttr = useCreateAttribute()
  const deleteAttr = useDeleteAttribute()
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-4">
      <div className="flex justify-end mb-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Attribute</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Attribute</DialogTitle></DialogHeader>
            <AttributeForm
              campaignId={campaignId}
              ownerType="campaign_member"
              onSubmit={(data: AttributeDefinitionCreate) =>
                createAttr.mutate(data, { onSuccess: () => setOpen(false) })
              }
              loading={createAttr.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Display Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attrs?.map(a => (
            <TableRow key={a.id}>
              <TableCell className="font-medium">{a.name}</TableCell>
              <TableCell>{a.display_name}</TableCell>
              <TableCell><Badge variant="outline">{a.data_type}</Badge></TableCell>
              <TableCell>{a.owner_type}</TableCell>
              <TableCell>
                <Button variant="destructive" size="sm" onClick={() => deleteAttr.mutate(a.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
          {attrs?.length === 0 && (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No attributes defined</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function CommunicationsTab({ campaignId }: { campaignId: number }) {
  const { data: comms } = useCommunications({ campaign_id: campaignId })
  const cancelComm = useCancelCommunication()

  return (
    <div className="mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Channel</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comms?.map(c => (
            <TableRow key={c.id}>
              <TableCell>{c.channel}</TableCell>
              <TableCell>{c.contact_id}</TableCell>
              <TableCell><Badge variant="secondary">{c.status}</Badge></TableCell>
              <TableCell className="text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                {c.status === 'pending' && (
                  <Button variant="destructive" size="sm" onClick={() => cancelComm.mutate(c.id)}>Cancel</Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {comms?.length === 0 && (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No communications</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
