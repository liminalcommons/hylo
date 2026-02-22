#!/usr/bin/env node

// Manual test script for password validator
// This tests the password validation logic without requiring Jest to be installed

const compact = (arr) => arr.filter(x => x)

// Helper functions from Validators.js
const onlyWhitespace = s =>
  s.trim() === '' ? 'must not consist solely of whitespace' : null

const lengthLessThan = length =>
  s => s.length < length ? `must be at least ${length} characters` : null

// The password validator function
const validatePassword = (password) => {
  if (typeof password !== 'string') return 'Password must be a string'

  const validators = [onlyWhitespace, lengthLessThan(12)]
  const invalidReasons = compact(validators.map(validator => validator(password)))

  // Check for common weak passwords
  const weakPasswords = ['password', 'password123', '123456', 'qwerty', 'abc123', '12345678', 'letmein', 'welcome', 'monkey', 'dragon', '1234567890', 'passw0rd']
  if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
    invalidReasons.push('contains a common weak password pattern')
  }

  // Require at least one number or special character
  if (!/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    invalidReasons.push('must contain at least one number or special character')
  }

  return invalidReasons.length ? `Password ${invalidReasons.join(', ')}.` : null
}

// Test cases
const tests = [
  // Should fail - whitespace only
  { password: ' \t\t ', shouldFail: true, name: 'whitespace only' },

  // Should fail - too short
  { password: 'Aaa123', shouldFail: true, name: 'too short (less than 12 chars)' },

  // Should fail - no numbers or special chars
  { password: 'PasswordOnly', shouldFail: true, name: 'no numbers or special characters' },

  // Should fail - contains "password"
  { password: 'Password123!', shouldFail: true, name: 'contains "password"' },

  // Should fail - contains "123456"
  { password: 'MyPassw123456', shouldFail: true, name: 'contains "123456"' },

  // Should fail - contains "qwerty"
  { password: 'Qwerty123!@', shouldFail: true, name: 'contains "qwerty"' },

  // Should pass - good password with numbers and special chars
  { password: '4#V;^9wLt6z G2CYa', shouldFail: false, name: 'good password with numbers and special chars' },

  // Should pass - 12+ chars with number
  { password: 'MySecurePass123', shouldFail: false, name: 'password with 12+ chars and number' },

  // Should pass - 12+ chars with special char
  { password: 'MySecurePass!@#', shouldFail: false, name: 'password with 12+ chars and special char' },

  // Should fail - old weak passwords that would have passed before
  { password: 'password', shouldFail: true, name: 'weak password "password"' },
  { password: 'password123', shouldFail: true, name: 'weak password "password123"' },
  { password: '123456', shouldFail: true, name: 'weak password "123456"' },
  { password: 'qwerty', shouldFail: true, name: 'weak password "qwerty"' },
]

console.log('Running Password Validator Tests\n')
console.log('=' .repeat(70))

let passed = 0
let failed = 0

tests.forEach((test, index) => {
  const result = validatePassword(test.password)
  const isInvalid = result !== null
  const testPassed = isInvalid === test.shouldFail

  const status = testPassed ? '✓ PASS' : '✗ FAIL'
  console.log(`\n[${index + 1}] ${status} - ${test.name}`)
  console.log(`    Password: "${test.password}"`)
  console.log(`    Expected: ${test.shouldFail ? 'INVALID' : 'VALID'}`)
  console.log(`    Got: ${isInvalid ? 'INVALID' : 'VALID'}`)
  if (result) {
    console.log(`    Error: ${result}`)
  }

  if (testPassed) {
    passed++
  } else {
    failed++
  }
})

console.log('\n' + '='.repeat(70))
console.log(`\nResults: ${passed} passed, ${failed} failed out of ${tests.length} tests`)

if (failed === 0) {
  console.log('\n✓ All tests passed!')
  process.exit(0)
} else {
  console.log('\n✗ Some tests failed!')
  process.exit(1)
}
