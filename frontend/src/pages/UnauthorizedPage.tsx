import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Access denied</CardTitle>
          <CardDescription>You do not have permission to view this page with your current role.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button render={<Link to="/login" />}>Return to sign in</Button>
        </CardContent>
      </Card>
    </div>
  )
}
