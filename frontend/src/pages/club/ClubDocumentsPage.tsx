import { useRef, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { PlusIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { uploadDocument } from '@/api/admin'
import { DataTable } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePortalData } from '@/context/PortalDataContext'
import { useTransfers } from '@/context/TransferContext'
import { USE_API } from '@/lib/api-config'
import type { DocumentRecord } from '@/types'
import PortalLayout from '@/layouts/PortalLayout'

const uploadSchema = z.object({
  transferId: z.string().min(1, 'Select a transfer'),
  documentType: z.string().optional(),
})

type UploadForm = z.infer<typeof uploadSchema>

const columns: ColumnDef<DocumentRecord, unknown>[] = [
  { accessorKey: 'title', header: 'Document' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'linkedTo', header: 'Linked to' },
  { accessorKey: 'uploadedAt', header: 'Uploaded' },
]

export default function ClubDocumentsPage() {
  const { documents, refresh } = usePortalData()
  const { transfers } = useTransfers()
  const [open, setOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const form = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { transferId: '', documentType: '' },
  })

  const onUpload = async (data: UploadForm) => {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      toast.error('Choose a file to upload.')
      return
    }
    if (!USE_API) {
      toast.message('Enable VITE_USE_API to upload documents.')
      return
    }

    const formData = new FormData()
    formData.append('transfer_id', data.transferId)
    formData.append('file', file)
    if (data.documentType) {
      formData.append('document_type', data.documentType)
    }

    try {
      await uploadDocument(formData)
      await refresh()
      toast.success('Document uploaded.')
      setOpen(false)
      form.reset()
      if (fileRef.current) fileRef.current.value = ''
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed.')
    }
  }

  return (
    <PortalLayout portalLabel="Club portal">
      <div className="space-y-6">
        <div className="flex justify-between gap-4">
          <div><h1 className="text-2xl font-semibold">Documents</h1></div>
          <Button onClick={() => setOpen(true)} disabled={!transfers.length}>
            <PlusIcon data-icon="inline-start" />Upload
          </Button>
        </div>
        {!transfers.length && (
          <Alert>
            <AlertTitle>No transfers yet</AlertTitle>
            <AlertDescription>Documents are linked to transfer requests. Create or receive a transfer before uploading.</AlertDescription>
          </Alert>
        )}
        <Alert>
          <AlertTitle>Accepted formats</AlertTitle>
          <AlertDescription>PDF, JPG, PNG, WebP. Maximum size: 10 MB.</AlertDescription>
        </Alert>
        <DataTable columns={columns} data={documents} searchKey="title" searchPlaceholder="Search documents..." />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload document</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onUpload)} className="space-y-4">
                <FormField control={form.control} name="transferId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transfer</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select transfer" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {transfers.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.playerName}: {t.fromClub} → {t.toClub}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="documentType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document type (optional)</FormLabel>
                    <FormControl><Input placeholder="e.g. transfer_agreement" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <FormControl>
                    <Input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" />
                  </FormControl>
                </FormItem>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit">Upload</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </PortalLayout>
  )
}
