import { Button } from '#/components/ui/button'
import Icon from '#/components/ui/icon'
import { useNavigate } from '@solidjs/router'
import { createRoute } from 'solid-file-router'

function NotFound() {
  const navigate = useNavigate()

  return (
    <div class="px-4 text-center flex flex-col min-h-[calc(100vh-4rem)] items-center justify-center">
      <div class="mb-8">
        <Icon name="lucide:search-x" class="text-muted-foreground h-24 w-24" />
      </div>

      <h1 class="text-4xl font-bold mb-2">404</h1>
      <h2 class="text-2xl text-muted-foreground font-semibold mb-4">
        Page Not Found
      </h2>

      <p class="text-muted-foreground mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved.
        Let's get you back to the toolkit.
      </p>

      <div class="flex gap-4">
        <Button onClick={() => navigate('/')}>
          <Icon name="lucide:home" class="mr-2 h-4 w-4" />
          Go Home
        </Button>
        <Button variant="outline" onClick={() => window.history.back()}>
          <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    </div>
  )
}

export default createRoute({
  component: NotFound,
})
