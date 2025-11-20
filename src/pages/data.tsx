import { Card } from '#/components/card'
import Icon from '#/components/ui/icon'
import { Separator } from '#/components/ui/separator'
import { createRoute } from 'solid-file-router'

export default createRoute({
  info: {
    title: 'Data Utilities',
    description: 'Various data manipulation and analysis tools',
    category: 'Data',
    icon: 'lucide:database',
  },
  component: Data,
})

function Data() {
  return (
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl text-foreground font-bold">Data Utilities</h1>
        <p class="text-muted-foreground mt-2">
          Various data manipulation and analysis tools
        </p>
      </div>

      <Separator />

      <div class="gap-6 grid lg:grid-cols-2">
        <Card
          title="Coming Soon"
          description="More data utilities will be available here"
          content={(
            <div class="text-muted-foreground flex gap-2 items-center">
              <Icon name="lucide:info" class="h-4 w-4" />
              <span class="text-sm">Data tools are under development</span>
            </div>
          )}
        />
      </div>
    </div>
  )
}
