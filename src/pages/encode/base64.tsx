import { createRoute } from '#/route'

export default createRoute({
  component: Base64Encoder,
})

function Base64Encoder() {
  return (
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl text-foreground font-bold">Base64 Encoder/Decoder</h1>
        <p class="text-muted-foreground mt-2">
          Encode and decode Base64 strings
        </p>
      </div>

      <div class="gap-6 grid lg:grid-cols-2">
        <div class="space-y-4">
          <div>
            <label class="text-sm text-foreground font-medium mb-2 block">
              Input Text
            </label>
            <textarea
              class="text-sm font-mono p-4 border border-border rounded-md bg-background h-64 w-full"
              placeholder="Enter text to encode..."
            />
          </div>
          <div class="flex gap-2">
            <button class="text-primary-foreground px-4 py-2 rounded-md bg-primary hover:bg-primary/90">
              Encode to Base64
            </button>
            <button class="text-secondary-foreground px-4 py-2 rounded-md bg-secondary hover:bg-secondary/90">
              Clear
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="text-sm text-foreground font-medium mb-2 block">
              Base64 Output
            </label>
            <textarea
              class="text-sm font-mono p-4 border border-border rounded-md bg-muted/50 h-64 w-full"
              placeholder="Base64 encoded text will appear here..."
              readOnly
            />
          </div>
          <div class="flex gap-2">
            <button class="text-secondary-foreground px-4 py-2 rounded-md bg-secondary hover:bg-secondary/90">
              Decode from Base64
            </button>
            <button class="text-secondary-foreground px-4 py-2 rounded-md bg-secondary hover:bg-secondary/90">
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
