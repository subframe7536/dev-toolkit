/**
 * SQL parameter filling utilities
 */

const TYPE_STR = ['String', 'Integer', 'Long', 'Timestamp']

interface Param {
  value: string
  type: string | null
}

/**
 * Convert parameter string to list of value-type objects
 * @param params Parameter string in format: value(type),value(type),...
 * Example: 1(Integer),zhangshan(String),2023-03-23 12:00:00(Timestamp)
 */
export function convertParam(params: string): Param[] {
  if (!params) {
    return []
  }

  const tempList = params.split(',')
  const paramStrList: string[] = []
  let paramIndex = 0
  let combining = false

  tempList.forEach((x) => {
    // Handle null values
    if (x.endsWith('null')) {
      paramStrList.push(x)
      paramIndex++
    } else if (x.endsWith(')')) {
      // End of parameter found
      if (combining) {
        paramStrList[paramIndex] += `,${x}`
        combining = false
      } else {
        paramStrList.push(x)
      }
      paramIndex++
    } else {
      // Continue combining
      const tempStr = paramStrList[paramIndex]
      if (!tempStr) {
        paramStrList.push(x)
        combining = true
      } else {
        paramStrList[paramIndex] += `,${x}`
      }
    }
  })

  return paramStrList.map((x) => {
    const valueEndIndex = x.lastIndexOf('(')
    if (valueEndIndex < 0) {
      return { value: x.trim(), type: null }
    }

    let value = x.substring(0, valueEndIndex).trim()
    // Escape single quotes
    value = value.replaceAll('\'', '\\\'')

    const typeEndIndex = x.lastIndexOf(')')
    const type = x.substring(valueEndIndex + 1, typeEndIndex < 0 ? x.length : typeEndIndex).trim()

    return { value, type }
  })
}

/**
 * Fill SQL template with parameters
 */
export function fillSqlParams(sql: string, params: string): string {
  if (!sql || !params) {
    throw new Error('SQL and parameters are required')
  }

  const paramList = convertParam(params)
  let resultStr = ''
  let paramIndex = 0

  for (let i = 0; i < sql.length; i++) {
    const c = sql.charAt(i)

    if (c === '?') {
      if (paramList.length <= paramIndex) {
        throw new Error('Not enough parameters provided')
      }

      const param = paramList[paramIndex]
      let tempParamStr = ''

      switch (param.type) {
        case TYPE_STR[0]: // String
          tempParamStr = `'${param.value}'`
          break
        case TYPE_STR[1]: // Integer
        case TYPE_STR[2]: // Long
          tempParamStr = param.value
          break
        case TYPE_STR[3]: // Timestamp
          tempParamStr = `Timestamp '${param.value}'`
          break
        default:
          tempParamStr = param.value
      }

      resultStr += tempParamStr
      paramIndex++
    } else {
      resultStr += c
    }
  }

  return resultStr
}

/**
 * Split MyBatis log into SQL template and parameters
 */
export function splitSqlAndParams(input: string): { sql: string, params: string } {
  const result = { sql: '', params: '' }

  // Find SQL start
  const sqlStartStr = 'Preparing:'
  let sqlStartIndex = input.indexOf(sqlStartStr)
  sqlStartIndex = sqlStartIndex < 0 ? 0 : sqlStartIndex + sqlStartStr.length

  // Find SQL end (end of line)
  let sqlEndIndex = input.indexOf('\n', sqlStartIndex)
  sqlEndIndex = sqlEndIndex < 0 ? input.length : sqlEndIndex
  result.sql = input.substring(sqlStartIndex, sqlEndIndex).trim()

  // Find parameters start
  const paramStartStr = 'Parameters:'
  const paramStartIndex = input.indexOf(paramStartStr)

  if (paramStartIndex >= 0) {
    let paramEndIndex = input.indexOf('\n', paramStartIndex)
    paramEndIndex = paramEndIndex < 0 ? input.length : paramEndIndex
    result.params = input.substring(paramStartIndex + paramStartStr.length, paramEndIndex).trim()
  }

  return result
}
