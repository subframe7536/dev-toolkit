import { Card } from '#/components/card'
import { Button } from '#/components/ui/button'
import Icon from '#/components/ui/icon'
import { Separator } from '#/components/ui/separator'
import { A } from '@solidjs/router'
import { createRoute } from 'solid-file-router'

export default createRoute({
  component: NestValue,
})

function NestValue(props: Record<string, unknown>) {
  return (
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl text-foreground font-bold">Static Nested Route</h1>
        <p class="text-muted-foreground mt-2">
          This is a static nested route at /nest/value
        </p>
      </div>

      <Card
        title="Route Props"
        description="Component props and route information"
        content={(
          <div class="space-y-4">
            <div>
              <div class="text-sm text-muted-foreground mb-2">Component Props (JSON):</div>
              <pre class="text-xs font-mono p-3 border border-border rounded-md bg-muted/50 overflow-auto">
                {JSON.stringify(props, null, 2)}
              </pre>
            </div>
            <Separator />
            <A href="/nest">
              <Button variant="outline">
                <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
                Back to Nest Index
              </Button>
            </A>
          </div>
        )}
      />
    </div>
  )
}
