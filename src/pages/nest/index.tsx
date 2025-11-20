import { Card } from '#/components/card'
import { Button } from '#/components/ui/button'
import Icon from '#/components/ui/icon'
import { A } from '@solidjs/router'
import { createRoute } from 'solid-file-router'
import { generatePath } from 'solid-file-router'

export default createRoute({
  component: NestIndex,
})

function NestIndex() {
  return (
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl text-foreground font-bold">Nested Routes Example</h1>
        <p class="text-muted-foreground mt-2">
          This is an example of nested routing in solid-file-router
        </p>
      </div>

      <div class="gap-4 grid md:grid-cols-2">
        <Card
          title="Dynamic Route"
          description="Example of a dynamic route with ID parameter"
          content={(
            <div class="space-y-2">
              <p class="text-sm text-muted-foreground">
                Navigate to a dynamic route with an ID parameter
              </p>
              <A href={generatePath('/nest/:id', { $id: '123' })}>
                <Button variant="outline" size="sm">
                  <Icon name="lucide:arrow-right" class="mr-2 h-4 w-4" />
                  Go to /nest/123
                </Button>
              </A>
            </div>
          )}
        />

        <Card
          title="Static Route"
          description="Example of a static nested route"
          content={(
            <div class="space-y-2">
              <p class="text-sm text-muted-foreground">
                Navigate to a static nested route
              </p>
              <A href="/nest/value">
                <Button variant="outline" size="sm">
                  <Icon name="lucide:arrow-right" class="mr-2 h-4 w-4" />
                  Go to /nest/value
                </Button>
              </A>
            </div>
          )}
        />
      </div>
    </div>
  )
}
