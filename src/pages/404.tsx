import { useNavigate } from '@solidjs/router'
import { Button, Icon } from 'moraine'
import { createRoute } from 'solid-file-router'

function NotFound() {
  const navigate = useNavigate()

  return (
    <div class="px-4 py-12 text-center flex flex-col min-h-[60dvh] items-center justify-center">
      <div class="mb-8">
        <Icon name="i-lucide-search-x" class="text-muted-foreground h-24 w-24" />
      </div>

      <h1 class="font-bold mb-2 text-4xl">404</h1>
      <h2 class="text-muted-foreground font-semibold mb-4 text-2xl">Page Not Found</h2>

      <p class="text-muted-foreground mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved. Let's get you back to the
        toolkit.
      </p>

      <div class="flex flex-wrap gap-3 items-center justify-center">
        <Button onClick={() => navigate('/')} leading="i-lucide-home">
          Go Home
        </Button>
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          leading="i-lucide-arrow-left"
        >
          Go Back
        </Button>
      </div>
    </div>
  )
}

export default createRoute({
  component: NotFound,
})
