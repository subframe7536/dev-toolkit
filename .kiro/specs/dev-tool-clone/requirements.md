# Requirements Document

## Introduction

This document specifies the requirements for a comprehensive web-based developer toolkit that provides essential utilities for developers. The toolkit will be privacy-first (all processing happens client-side), fast, and accessible. It will include tools for JSON manipulation, encoding/decoding, cryptography, regular expressions, color utilities, QR codes, UUIDs, text comparison, and SQL utilities.

## Glossary

- **Dev Toolkit**: The complete web application providing all developer utilities
- **Tool Page**: An individual utility within the Dev Toolkit (e.g., JSON Formatter, Base64 Encoder)
- **Client-Side Processing**: All data processing occurs in the user's browser without server transmission
- **Input Area**: The text area or form where users provide data to be processed
- **Output Area**: The display area showing processed results
- **Copy Button**: A button that copies output to the user's clipboard
- **Format Converter**: A utility that transforms data between different formats (e.g., JSON to CSV)
- **Encoder/Decoder**: A utility that encodes or decodes data using a specific algorithm
- **Validator**: A component that checks data against a schema or pattern

## Requirements

### Requirement 1: Home Page and Navigation

**User Story:** As a developer, I want to see all available tools on a home page, so that I can quickly find and access the utility I need.

#### Acceptance Criteria

1. WHEN a user visits the home page, THEN the Dev Toolkit SHALL display a grid of tool cards organized by category
2. WHEN a user views a tool card, THEN the Dev Toolkit SHALL display the tool name and a brief description
3. WHEN a user clicks on a tool card, THEN the Dev Toolkit SHALL navigate to that tool's dedicated page
4. WHEN the home page loads, THEN the Dev Toolkit SHALL group tools into categories: JSON, Encode/Decode, Crypto, Text, Color, and SQL
5. WHEN a user views the home page, THEN the Dev Toolkit SHALL indicate which tools are already implemented

### Requirement 2: JSON Formatter and Minifier

**User Story:** As a developer, I want to format, minify, and sort JSON data, so that I can improve readability or reduce file size.

#### Acceptance Criteria

1. WHEN a user pastes JSON text into the input area, THEN the JSON Tool SHALL parse and display it in a formatted, readable structure with proper indentation
2. WHEN a user clicks minify, THEN the JSON Tool SHALL remove all unnecessary whitespace and display compact JSON
3. WHEN a user clicks sort, THEN the JSON Tool SHALL alphabetically sort all object keys while preserving the data structure
4. WHEN the JSON Tool receives invalid JSON, THEN the JSON Tool SHALL display a clear error message indicating the parsing failure location
5. WHEN a user clicks a copy button, THEN the JSON Tool SHALL copy the processed JSON to the clipboard

### Requirement 3: JSON Import and Export

**User Story:** As a developer, I want to convert JSON to and from various formats, so that I can work with data in different contexts.

#### Acceptance Criteria

1. WHEN a user provides JSON, THEN the JSON Tool SHALL export it to CSV, YAML, Markdown Table, HTML Query Parameters, or Java Map & List log format
2. WHEN a user provides CSV with headers, THEN the JSON Tool SHALL import it as a JSON array of objects
3. WHEN a user provides YAML, THEN the JSON Tool SHALL parse and convert it to JSON
4. WHEN a user provides HTML query parameters, THEN the JSON Tool SHALL parse and convert them to a JSON object
5. WHEN the JSON Tool converts between formats, THEN the JSON Tool SHALL preserve data types and structure where possible

### Requirement 4: JSON Key Style Converter

**User Story:** As a developer, I want to convert JSON key naming conventions, so that I can adapt data to different coding standards.

#### Acceptance Criteria

1. WHEN a user provides JSON with keys in any naming convention, THEN the JSON Tool SHALL convert all keys to camelCase, snake_case, kebab-case, PascalCase, or CONSTANT_CASE
2. WHEN the JSON Tool converts key styles, THEN the JSON Tool SHALL recursively process all nested objects and arrays
3. WHEN a user selects a target key style, THEN the JSON Tool SHALL preserve all values while transforming only the keys
4. WHEN the JSON Tool encounters special characters in keys, THEN the JSON Tool SHALL handle them appropriately for the target convention
5. WHEN a user copies the output, THEN the JSON Tool SHALL copy the JSON with converted keys to the clipboard

### Requirement 5: JSON Schema Validator and Generator

**User Story:** As a developer, I want to validate JSON against schemas and generate schemas from JSON, so that I can ensure data integrity.

#### Acceptance Criteria

1. WHEN a user provides JSON and a JSON Schema, THEN the JSON Tool SHALL validate the JSON and display validation results
2. WHEN validation fails, THEN the JSON Tool SHALL display specific error messages indicating which fields failed and why
3. WHEN a user provides sample JSON, THEN the JSON Tool SHALL generate a corresponding JSON Schema
4. WHEN the JSON Tool generates a schema, THEN the JSON Tool SHALL infer types, required fields, and constraints from the sample data
5. WHEN validation succeeds, THEN the JSON Tool SHALL display a success message

### Requirement 6: JSON Path and Repair

**User Story:** As a developer, I want to query JSON with JSONPath and repair malformed JSON, so that I can extract data and fix errors.

#### Acceptance Criteria

1. WHEN a user provides JSON and a JSONPath expression, THEN the JSON Tool SHALL evaluate the path and display matching results
2. WHEN the JSONPath expression is invalid, THEN the JSON Tool SHALL display an error message explaining the syntax issue
3. WHEN a user provides malformed JSON, THEN the JSON Tool SHALL attempt to repair it by fixing common issues
4. WHEN the JSON Tool repairs JSON, THEN the JSON Tool SHALL display both the original and repaired versions
5. WHEN repair is successful, THEN the JSON Tool SHALL highlight the changes made to fix the JSON

### Requirement 7: Text Compare Tool

**User Story:** As a developer, I want to compare two pieces of text, so that I can identify differences between versions or configurations.

#### Acceptance Criteria

1. WHEN a user provides two text inputs, THEN the Text Compare Tool SHALL display a side-by-side or unified diff view
2. WHEN differences exist between texts, THEN the Text Compare Tool SHALL highlight additions in one color and deletions in another color
3. WHEN the texts are identical, THEN the Text Compare Tool SHALL display a message indicating no differences found
4. WHEN a user views the comparison, THEN the Text Compare Tool SHALL show line numbers for both text inputs
5. WHEN a user switches between diff modes, THEN the Text Compare Tool SHALL preserve the input text content

### Requirement 8: Base64 Encoder/Decoder

**User Story:** As a developer, I want to compare two pieces of text, so that I can identify differences between versions or configurations.

#### Acceptance Criteria

1. WHEN a user provides two text inputs, THEN the Text Compare Tool SHALL display a side-by-side or unified diff view
2. WHEN differences exist between texts, THEN the Text Compare Tool SHALL highlight additions in one color and deletions in another color
3. WHEN the texts are identical, THEN the Text Compare Tool SHALL display a message indicating no differences found
4. WHEN a user views the comparison, THEN the Text Compare Tool SHALL show line numbers for both text inputs
5. WHEN a user switches between diff modes, THEN the Text Compare Tool SHALL preserve the input text content

### Requirement 8: Base64 Encoder/Decoder

**User Story:** As a developer, I want to encode and decode Base64 strings, so that I can work with encoded data in APIs and configurations.

#### Acceptance Criteria

1. WHEN a user inputs plain text and selects encode, THEN the Base64 Encoder SHALL convert it to Base64 encoding
2. WHEN a user inputs Base64 text and selects decode, THEN the Base64 Encoder SHALL convert it to plain text
3. WHEN the Base64 Encoder receives invalid Base64 during decoding, THEN the Base64 Encoder SHALL display an error message
4. WHEN a user switches between encode and decode modes, THEN the Base64 Encoder SHALL clear previous results
5. WHEN a user copies output, THEN the Base64 Encoder SHALL copy the encoded or decoded result to the clipboard

### Requirement 9: Hex Encoder/Decoder

**User Story:** As a developer, I want to encode and decode hexadecimal strings, so that I can work with binary data representations.

#### Acceptance Criteria

1. WHEN a user inputs plain text and selects encode, THEN the Hex Encoder SHALL convert it to hexadecimal representation
2. WHEN a user inputs hex text and selects decode, THEN the Hex Encoder SHALL convert it to plain text
3. WHEN the Hex Encoder receives invalid hexadecimal during decoding, THEN the Hex Encoder SHALL display an error message
4. WHEN a user views hex output, THEN the Hex Encoder SHALL display it in a readable format with optional spacing
5. WHEN a user copies output, THEN the Hex Encoder SHALL copy the encoded or decoded result to the clipboard

### Requirement 10: URL Encoder/Decoder

**User Story:** As a developer, I want to encode and decode URLs, so that I can safely pass data in query parameters and URIs.

#### Acceptance Criteria

1. WHEN a user inputs a URL or text and selects encode, THEN the URL Encoder SHALL apply URL encoding to special characters
2. WHEN a user inputs encoded text and selects decode, THEN the URL Encoder SHALL decode it to the original text
3. WHEN the URL Encoder processes encoding, THEN the URL Encoder SHALL handle spaces, special characters, and Unicode correctly
4. WHEN a user switches between encode and decode modes, THEN the URL Encoder SHALL clear previous results
5. WHEN a user copies output, THEN the URL Encoder SHALL copy the encoded or decoded result to the clipboard

### Requirement 11: Unicode Encoder/Decoder

**User Story:** As a developer, I want to encode and decode Unicode escape sequences, so that I can work with internationalized text in code.

#### Acceptance Criteria

1. WHEN a user inputs text with Unicode characters, THEN the Unicode Encoder SHALL convert it to Unicode escape sequences
2. WHEN a user inputs Unicode escape sequences, THEN the Unicode Encoder SHALL decode them to readable text
3. WHEN the Unicode Encoder processes text, THEN the Unicode Encoder SHALL support both \\uXXXX and \\u{XXXXXX} formats
4. WHEN a user views encoded output, THEN the Unicode Encoder SHALL display escape sequences in a copyable format
5. WHEN the Unicode Encoder receives invalid escape sequences, THEN the Unicode Encoder SHALL display an error message

### Requirement 12: HTML Entity Encoder/Decoder

**User Story:** As a developer, I want to encode and decode HTML entities, so that I can safely display text in HTML contexts.

#### Acceptance Criteria

1. WHEN a user inputs text with special HTML characters, THEN the HTML Encoder SHALL convert them to HTML entities
2. WHEN a user inputs HTML entities, THEN the HTML Encoder SHALL decode them to readable characters
3. WHEN the HTML Encoder processes encoding, THEN the HTML Encoder SHALL handle &lt;, &gt;, &amp;, &quot;, and other special characters
4. WHEN a user switches between encode and decode modes, THEN the HTML Encoder SHALL preserve the input text
5. WHEN a user copies output, THEN the HTML Encoder SHALL copy the encoded or decoded result to the clipboard

### Requirement 13: AES/DES Encryption/Decryption

**User Story:** As a developer, I want to encrypt and decrypt data using AES or DES, so that I can secure sensitive information.

#### Acceptance Criteria

1. WHEN a user provides plaintext and a key, THEN the Crypto Tool SHALL encrypt the data using AES-256 or DES algorithm
2. WHEN a user provides ciphertext and the correct key, THEN the Crypto Tool SHALL decrypt it to the original plaintext
3. WHEN the Crypto Tool encrypts data, THEN the Crypto Tool SHALL display the ciphertext in Base64 or hexadecimal format
4. WHEN a user provides an incorrect key for decryption, THEN the Crypto Tool SHALL display an error message
5. WHEN a user selects an algorithm, THEN the Crypto Tool SHALL allow choosing between AES-128, AES-192, AES-256, and DES

### Requirement 14: RSA Encryption/Decryption

**User Story:** As a developer, I want to encrypt and decrypt data using RSA, so that I can implement public-key cryptography.

#### Acceptance Criteria

1. WHEN a user generates an RSA key pair, THEN the Crypto Tool SHALL create public and private keys
2. WHEN a user provides plaintext and a public key, THEN the Crypto Tool SHALL encrypt the data using RSA
3. WHEN a user provides ciphertext and the corresponding private key, THEN the Crypto Tool SHALL decrypt it to plaintext
4. WHEN the Crypto Tool generates keys, THEN the Crypto Tool SHALL support key sizes of 1024, 2048, and 4096 bits
5. WHEN a user exports keys, THEN the Crypto Tool SHALL provide them in PEM format

### Requirement 15: MD5 Hash Generator

**User Story:** As a developer, I want to generate MD5 hashes, so that I can create checksums and verify data integrity.

#### Acceptance Criteria

1. WHEN a user inputs text, THEN the MD5 Tool SHALL compute and display the MD5 hash
2. WHEN the input changes, THEN the MD5 Tool SHALL recalculate the hash in real-time
3. WHEN a user copies the hash, THEN the MD5 Tool SHALL copy the MD5 value to the clipboard
4. WHEN the input is empty, THEN the MD5 Tool SHALL display the hash of an empty string
5. WHEN a user views the hash, THEN the MD5 Tool SHALL display it in hexadecimal format

### Requirement 16: Regular Expression Tester

**User Story:** As a developer, I want to test regular expressions, so that I can validate patterns and extract data from text.

#### Acceptance Criteria

1. WHEN a user inputs a regex pattern, THEN the Regex Tester SHALL validate the pattern syntax
2. WHEN a user provides test text, THEN the Regex Tester SHALL highlight all matches in the text
3. WHEN the Regex Tester finds matches, THEN the Regex Tester SHALL display match groups and capture groups separately
4. WHEN a user modifies the regex flags, THEN the Regex Tester SHALL re-evaluate matches with the new flags
5. WHEN the Regex Tester receives invalid regex syntax, THEN the Regex Tester SHALL display a detailed error message

### Requirement 17: Color Converter and Picker

**User Story:** As a developer, I want to convert between color formats and pick colors, so that I can work with colors in different contexts.

#### Acceptance Criteria

1. WHEN a user inputs a color in any format, THEN the Color Tool SHALL convert it to RGB, HEX, HSL, HWB, and OKLCH formats
2. WHEN a user uses the color picker, THEN the Color Tool SHALL update all format representations in real-time
3. WHEN a user clicks on a color format, THEN the Color Tool SHALL copy that format value to the clipboard
4. WHEN the Color Tool receives invalid color input, THEN the Color Tool SHALL display an error message
5. WHEN a user adjusts color values, THEN the Color Tool SHALL update the visual preview and all format conversions

### Requirement 18: QR Code Generator

**User Story:** As a developer, I want to create QR codes, so that I can encode URLs, text, and contact information for mobile scanning.

#### Acceptance Criteria

1. WHEN a user inputs text or a URL, THEN the QR Code Generator SHALL generate a scannable QR code image
2. WHEN a QR code is generated, THEN the QR Code Generator SHALL display it at a readable size with proper error correction
3. WHEN a user adjusts size settings, THEN the QR Code Generator SHALL regenerate the QR code at the specified dimensions
4. WHEN a user downloads the QR code, THEN the QR Code Generator SHALL provide it as a PNG image file
5. WHEN the input text is empty, THEN the QR Code Generator SHALL display a message prompting for input

### Requirement 19: UUID Generator

**User Story:** As a developer, I want to generate unique identifiers, so that I can use them in my applications and databases.

#### Acceptance Criteria

1. WHEN a user clicks a generate button, THEN the UUID Generator SHALL create a new UUID v4
2. WHEN a UUID is generated, THEN the UUID Generator SHALL display it in a copyable format
3. WHEN a user clicks a copy button, THEN the UUID Generator SHALL copy the UUID to the clipboard
4. WHEN a user requests bulk generation, THEN the UUID Generator SHALL generate multiple UUIDs at once
5. WHEN a user specifies a quantity, THEN the UUID Generator SHALL generate that exact number of unique UUIDs

### Requirement 20: SQL Utilities

**User Story:** As a developer, I want SQL utilities for data conversion and code generation, so that I can work efficiently with databases.

#### Acceptance Criteria

1. WHEN a user provides MyBatis SQL with parameters, THEN the SQL Tool SHALL parse and display the actual SQL with parameter values substituted
2. WHEN a user provides a JSON array, THEN the SQL Tool SHALL convert it to CSV, Excel, Markdown table, or INSERT SQL statements
3. WHEN a user provides CSV data, THEN the SQL Tool SHALL convert it to JSON array, Excel, Markdown table, or INSERT SQL statements
4. WHEN a user provides SQL CREATE TABLE or SELECT statements, THEN the SQL Tool SHALL generate corresponding Java or TypeScript entity classes
5. WHEN the SQL Tool generates code, THEN the SQL Tool SHALL include proper type annotations and field mappings

### Requirement 21: Privacy and Client-Side Processing

**User Story:** As a privacy-conscious developer, I want all data processing to happen locally, so that my sensitive data never leaves my browser.

#### Acceptance Criteria

1. WHEN a user processes data in any tool, THEN the Dev Toolkit SHALL perform all operations client-side in the browser
2. WHEN a user uses any tool, THEN the Dev Toolkit SHALL NOT transmit user input data to any external server
3. WHEN a user views the privacy policy, THEN the Dev Toolkit SHALL clearly state that no data is collected or transmitted
4. WHEN a user processes sensitive information, THEN the Dev Toolkit SHALL NOT store data in cookies or external storage without explicit consent
5. WHEN the Dev Toolkit loads, THEN the Dev Toolkit SHALL function fully without requiring network connectivity after initial page load

### Requirement 22: Responsive Design and Accessibility

**User Story:** As a developer using various devices, I want the toolkit to work on desktop and mobile, so that I can use tools wherever I work.

#### Acceptance Criteria

1. WHEN a user accesses the Dev Toolkit on mobile devices, THEN the Dev Toolkit SHALL display a responsive layout optimized for smaller screens
2. WHEN a user navigates with keyboard only, THEN the Dev Toolkit SHALL provide full keyboard accessibility for all interactive elements
3. WHEN a user employs screen readers, THEN the Dev Toolkit SHALL provide appropriate ARIA labels and semantic HTML
4. WHEN a user views any tool page, THEN the Dev Toolkit SHALL maintain readability and usability across viewport sizes
5. WHEN a user interacts with buttons and inputs, THEN the Dev Toolkit SHALL provide clear focus indicators and touch targets
