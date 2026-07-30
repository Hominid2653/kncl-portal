import type { ColumnDef } from '@tanstack/react-table'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'

import { DataTable } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { documents } from '@/data/mockData'
import type { DocumentRecord } from '@/types'
import PortalLayout from '@/layouts/PortalLayout'

const columns: ColumnDef<DocumentRecord, unknown>[] = [
  { accessorKey: 'title', header: 'Document' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'linkedTo', header: 'Linked to' },
  { accessorKey: 'uploadedAt', header: 'Uploaded' },
]

export default function ClubDocumentsPage() {
  return (
    <PortalLayout portalLabel="Club portal">
      <div className="space-y-6">
        <div className="flex justify-between gap-4">
          <div><h1 className="text-2xl font-semibold">Documents</h1></div>
          <Button onClick={() => toast.success('Upload dialog would open (mock)')}><PlusIcon data-icon="inline-start" />Upload</Button>
        </div>
        <Alert><AlertTitle>Accepted formats</AlertTitle><AlertDescription>PDF, JPG, PNG, WebP. Maximum size: 10 MB.</AlertDescription></Alert>
        <DataTable columns={columns} data={documents} searchKey="title" searchPlaceholder="Search documents..." />
      </div>
    </PortalLayout>
  )
}
