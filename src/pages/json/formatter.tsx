import { createRoute } from '#/route'

export default createRoute({
  component: JSONFormatter,
})

function JSONFormatter() {
  return (
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl text-foreground font-bold">JSON Formatter</h1>
        <p class="text-muted-foreground mt-2">
          Format and pretty-print JSON data for better readability
        </p>
      </div>

      <div class="gap-6 grid lg:grid-cols-2">
        <div class="space-y-4">
          <div>
            <label class="text-sm text-foreground font-medium mb-2 block">
              Input JSON
            </label>
            <textarea
              class="text-sm font-mono p-4 border border-border rounded-md bg-background h-96 w-full"
              placeholder="Paste your JSON here..."
            />
          </div>
          <div class="flex gap-2">
            <button class="text-primary-foreground px-4 py-2 rounded-md bg-primary hover:bg-primary/90">
              Format
            </button>
            <button class="text-secondary-foreground px-4 py-2 rounded-md bg-secondary hover:bg-secondary/90">
              Minify
            </button>
            <button class="text-secondary-foreground px-4 py-2 rounded-md bg-secondary hover:bg-secondary/90">
              Clear
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="text-sm text-foreground font-medium mb-2 block">
              Formatted JSON
            </label>
            <textarea
              class="text-sm font-mono p-4 border border-border rounded-md bg-muted/50 h-96 w-full"
              readOnly
              placeholder="Formatted JSON will appear here..."
            />
          </div>
          <div class="flex gap-2">
            <button class="text-secondary-foreground px-4 py-2 rounded-md bg-secondary hover:bg-secondary/90">
              Copy
            </button>
            <button class="text-secondary-foreground px-4 py-2 rounded-md bg-secondary hover:bg-secondary/90">
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
