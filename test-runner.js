#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Test Suite for TFE Project...\n');

// Test configurations
const testConfigs = [
  {
    name: 'Unit Tests',
    command: 'npm',
    args: ['test', '--', '--testPathPattern=src/.*\\.test\\.(ts|tsx)$', '--verbose'],
    description: 'Running unit tests for components and hooks'
  },
  {
    name: 'Integration Tests',
    command: 'npm',
    args: ['test', '--', '--testPathPattern=src/__tests__/integration', '--verbose'],
    description: 'Running integration tests for workflows'
  },
  {
    name: 'Performance Tests',
    command: 'npm',
    args: ['test', '--', '--testPathPattern=src/__tests__/performance', '--verbose'],
    description: 'Running performance tests'
  },
  {
    name: 'Full Test Suite',
    command: 'npm',
    args: ['test', '--', '--coverage', '--verbose'],
    description: 'Running complete test suite with coverage'
  }
];

// Function to run tests
function runTests(config) {
  return new Promise((resolve, reject) => {
    console.log(`\n📋 ${config.name}`);
    console.log(`📝 ${config.description}`);
    console.log('─'.repeat(50));

    const child = spawn(config.command, config.args, {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${config.name} completed successfully\n`);
        resolve();
      } else {
        console.log(`❌ ${config.name} failed with code ${code}\n`);
        reject(new Error(`${config.name} failed`));
      }
    });

    child.on('error', (error) => {
      console.error(`❌ Error running ${config.name}:`, error.message);
      reject(error);
    });
  });
}

// Function to run all tests sequentially
async function runAllTests() {
  const results = [];
  
  for (const config of testConfigs) {
    try {
      await runTests(config);
      results.push({ name: config.name, status: 'PASSED' });
    } catch (error) {
      results.push({ name: config.name, status: 'FAILED', error: error.message });
    }
  }

  // Print summary
  console.log('\n📊 Test Results Summary');
  console.log('─'.repeat(50));
  
  results.forEach(result => {
    const status = result.status === 'PASSED' ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  const passedCount = results.filter(r => r.status === 'PASSED').length;
  const totalCount = results.length;
  
  console.log(`\n📈 Overall: ${passedCount}/${totalCount} test suites passed`);
  
  if (passedCount === totalCount) {
    console.log('🎉 All tests passed successfully!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check the output above.');
    process.exit(1);
  }
}

// Function to run specific test type
async function runSpecificTest(testType) {
  const config = testConfigs.find(c => 
    c.name.toLowerCase().includes(testType.toLowerCase())
  );
  
  if (!config) {
    console.log('❌ Test type not found. Available types:');
    testConfigs.forEach(c => console.log(`   - ${c.name}`));
    process.exit(1);
  }
  
  try {
    await runTests(config);
    console.log('🎉 Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.log('❌ Test failed.');
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const testType = args[0];

if (testType && testType !== '--all') {
  runSpecificTest(testType);
} else {
  runAllTests();
}
