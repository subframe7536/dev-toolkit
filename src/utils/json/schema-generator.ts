export interface SchemaOptions {
  required?: boolean
  additionalProperties?: boolean
  title?: string
  description?: string
}

export function generateJsonSchema(json: string, options: SchemaOptions = {}): string {
  const data = JSON.parse(json)

  const schema: any = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    ...(options.title && { title: options.title }),
    ...(options.description && { description: options.description }),
  }

  Object.assign(schema, inferType(data, options))

  return JSON.stringify(schema, null, 2)
}

function inferType(value: any, options: SchemaOptions): any {
  if (value === null) {
    return { type: 'null' }
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { type: 'array', items: {} }
    }

    const itemSchemas = value.map(item => inferType(item, options))
    const firstSchema = itemSchemas[0]
    const allSameType = itemSchemas.every(s => s.type === firstSchema.type)

    return {
      type: 'array',
      items: allSameType ? firstSchema : { oneOf: itemSchemas },
    }
  }

  const type = typeof value

  switch (type) {
    case 'string':
      return { type: 'string' }

    case 'number':
      return { type: Number.isInteger(value) ? 'integer' : 'number' }

    case 'boolean':
      return { type: 'boolean' }

    case 'object': {
      const properties: Record<string, any> = {}
      const required: string[] = []

      for (const [key, val] of Object.entries(value)) {
        properties[key] = inferType(val, options)
        if (options.required && val !== null && val !== undefined) {
          required.push(key)
        }
      }

      const schema: any = {
        type: 'object',
        properties,
      }

      if (required.length > 0) {
        schema.required = required
      }

      if (options.additionalProperties !== undefined) {
        schema.additionalProperties = options.additionalProperties
      }

      return schema
    }

    default:
      return {}
  }
}
