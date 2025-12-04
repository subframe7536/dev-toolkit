import { EncoderLayout } from '#/components/encoder-layout'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  jsObjectToJSON,
  jsonToJavaClass,
  jsonToJSObject,
  jsonToQueryParams,
  jsonToTSInterface,
  jsonToYAML,
  queryParamsToJSON,
  yamlToJSON,
} from '#/utils/json/converter'
import { createRoute } from 'solid-file-router'
import { createSignal } from 'solid-js'

export default createRoute({
  info: {
    title: 'JSON Converter',
    description: 'Convert JSON to/from YAML, query parameters, JS object, TypeScript, and Java',
    category: 'JSON',
    icon: 'lucide:repeat',
    tags: ['json', 'yaml', 'converter', 'transform', 'typescript', 'java', 'javascript'],
  },
  component: JSONConverter,
})

type ConversionFormat =
  | 'yaml'
  | 'query'
  | 'jsobject'
  | 'tsinterface'
  | 'javaclass'

function JSONConverter() {
  const [format, setFormat] = createSignal<ConversionFormat>('yaml')

  const formats = [
    { value: 'yaml', label: 'YAML' },
    { value: 'query', label: 'Query Parameters' },
    { value: 'jsobject', label: 'JavaScript Object' },
    { value: 'tsinterface', label: 'TypeScript Interface' },
    { value: 'javaclass', label: 'Java Class' },
  ] as const

  const handleEncode = (input: string): string => {
    const currentFormat = format()

    switch (currentFormat) {
      case 'yaml':
        return jsonToYAML(input).output || ''
      case 'query':
        return jsonToQueryParams(input).output || ''
      case 'jsobject':
        return jsonToJSObject(input).output || ''
      case 'tsinterface':
        return jsonToTSInterface(input).output || ''
      case 'javaclass':
        return jsonToJavaClass(input).output || ''
      default:
        throw new Error('Unknown format')
    }
  }

  const handleDecode = (input: string): string => {
    const currentFormat = format()

    switch (currentFormat) {
      case 'yaml':
        return yamlToJSON(input).output || ''
      case 'query':
        return queryParamsToJSON(input).output || ''
      case 'jsobject':
        return jsObjectToJSON(input).output || ''
      case 'tsinterface':
      case 'javaclass':
        throw new Error('Cannot convert back from type definitions')
      default:
        throw new Error('Unknown format')
    }
  }

  const getFormatLabel = () => {
    return formats.find(f => f.value === format())?.label || 'Format'
  }

  const inputLabel = () => 'JSON'

  const outputLabel = () => (
    <div class="flex gap-2 items-center">
      <label class="text-lg font-medium">Convert to:</label>
      <Select
        value={format()}
        onChange={setFormat}
        options={formats.map(({ value }) => value)}
        placeholder="Select format..."
        itemComponent={props => (
          <SelectItem item={props.item}>
            {formats.find(f => f.value === props.item.rawValue)?.label}
          </SelectItem>
        )}
      >
        <SelectTrigger class="w-52">
          <SelectValue<ConversionFormat>>
            {state => formats.find(f => f.value === state.selectedOption())?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent />
      </Select>
    </div>
  )

  const inputPlaceholder = () => {
    const currentFormat = format()
    if (currentFormat === 'tsinterface' || currentFormat === 'javaclass') {
      return 'Enter JSON to generate type definition...'
    }
    return 'Enter JSON or formatted data...'
  }

  const outputPlaceholder = () => {
    return `${getFormatLabel()} output will appear here...`
  }

  const modeToggleLabel = () => {
    const currentFormat = format()
    if (currentFormat === 'tsinterface' || currentFormat === 'javaclass') {
      return 'Type definitions are one-way only'
    }
    return 'Switch between JSON and format'
  }

  return (
    <EncoderLayout
      mode={getFormatLabel()}
      onEncode={handleEncode}
      onDecode={handleDecode}
      inputLabel={inputLabel}
      outputLabel={outputLabel}
      inputPlaceholder={inputPlaceholder}
      outputPlaceholder={outputPlaceholder}
      modeToggleLabel={modeToggleLabel}
    />
  )
}
