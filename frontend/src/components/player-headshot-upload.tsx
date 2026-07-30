import { useCallback, useRef, useState } from 'react'
import { ImageIcon, LinkIcon, UploadIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { initials } from '@/context/PlayerListingsContext'

interface PlayerHeadshotUploadProps {
  playerName: string
  headshotUrl: string
  onSave: (url: string) => void
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_MB = 5

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function validateImageFile(file: File) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error('Use JPG, PNG, or WebP images.')
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`Image must be under ${MAX_SIZE_MB}MB.`)
  }
}

export default function PlayerHeadshotUpload({ playerName, headshotUrl, onSave }: PlayerHeadshotUploadProps) {
  const [urlInput, setUrlInput] = useState(headshotUrl)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const applyUrl = useCallback(
    (url: string) => {
      const trimmed = url.trim()
      if (!trimmed) {
        toast.error('Enter a valid image URL.')
        return
      }
      onSave(trimmed)
      setUrlInput(trimmed)
      toast.success('Headshot updated (mock)')
    },
    [onSave],
  )

  const handleFile = useCallback(
    async (file: File) => {
      try {
        validateImageFile(file)
        const dataUrl = await readFileAsDataUrl(file)
        onSave(dataUrl)
        setUrlInput(dataUrl)
        toast.success('Headshot uploaded (mock)')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not upload image.')
      }
    },
    [onSave],
  )

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setDragging(false)
      const file = event.dataTransfer.files?.[0]
      if (file) await handleFile(file)
    },
    [handleFile],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile photo</CardTitle>
        <CardDescription>Add a headshot via link, upload, or drag and drop. Shown on public player listings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar size="lg" className="size-20">
            <AvatarImage src={headshotUrl} alt={playerName} />
            <AvatarFallback className="text-lg">{initials(playerName)}</AvatarFallback>
          </Avatar>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{playerName}</p>
            <p>Recommended: square image, at least 400×400px.</p>
          </div>
        </div>

        <Tabs defaultValue="upload">
          <TabsList>
            <TabsTrigger value="upload"><UploadIcon className="size-4" data-icon="inline-start" />Upload</TabsTrigger>
            <TabsTrigger value="link"><LinkIcon className="size-4" data-icon="inline-start" />Link</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div
              role="button"
              tabIndex={0}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${dragging ? 'border-kenya-green bg-kenya-green/5' : 'border-muted-foreground/30'}`}
            >
              <ImageIcon className="size-8 text-muted-foreground" />
              <div>
                <p className="font-medium">Drag and drop your headshot here</p>
                <p className="text-sm text-muted-foreground">JPG, PNG, or WebP up to {MAX_SIZE_MB}MB</p>
              </div>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                Choose file
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) await handleFile(file)
                  e.target.value = ''
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="link" className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="headshot-url">Image URL</Label>
              <Input
                id="headshot-url"
                placeholder="https://example.com/photo.jpg"
                value={urlInput.startsWith('data:') ? '' : urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
            </div>
            <Button type="button" onClick={() => applyUrl(urlInput)}>Save from URL</Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
