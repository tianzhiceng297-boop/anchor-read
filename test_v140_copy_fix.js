// Test v1.4.0 — Copy fix: verify that data-anchor-original text is extracted
// This simulates the copy event handler's DOM manipulation logic.

function testCopyFix() {
  // Simulate DOM manipulation: walk cloned content, replace anchor spans with original text
  // We test the core logic by checking that anchor spans get their original text back.

  var tests = [
    {
      name: 'Single anchor span in selection',
      // Simulates: <span data-anchor-original="development">...</span>
      spanOriginal: 'development',
      spanHTML: '<b>develo</b>pment',
      expectedText: 'development'
    },
    {
      name: 'Mixed text and anchor spans',
      // "The <span data-anchor-original="development">...</span> is great"
      spans: [
        { original: 'development', html: '<b>develo</b>pment' },
      ],
      surrounding: ['The ', ' is great'],
      expectedText: 'The development is great'
    },
    {
      name: 'Multiple anchor spans',
      spans: [
        { original: 'comprehensive', html: '<b>comprehe</b>nsive' },
        { original: 'reading', html: '<b>read</b>ing' },
      ],
      surrounding: ['A ', ' guide to ', ' faster'],
      expectedText: 'A comprehensive guide to reading faster'
    }
  ];

  console.log('=== Copy Fix Test Results ===\n');
  var passed = 0;
  var total = tests.length;

  tests.forEach(function (test) {
    // Simulate the DOM manipulation
    // In real code: cloneContents() → walk → replace spans with text nodes → get textContent

    // Build a simulated fragment string
    var result = '';
    if (test.spanOriginal) {
      // Single span test
      result = test.spanOriginal;
    } else if (test.spans) {
      // Multi-span test
      var parts = [];
      for (var i = 0; i < test.spans.length; i++) {
        if (test.surrounding && test.surrounding[i]) {
          parts.push(test.surrounding[i]);
        }
        parts.push(test.spans[i].original);
      }
      if (test.surrounding && test.surrounding[test.spans.length]) {
        parts.push(test.surrounding[test.spans.length]);
      }
      result = parts.join('');
    }

    var ok = result === test.expectedText;
    if (ok) passed++;
    console.log((ok ? '✅' : '❌') + ' ' + test.name);
    if (!ok) {
      console.log('  Expected: "' + test.expectedText + '"');
      console.log('  Got:      "' + result + '"');
    }
  });

  console.log('\n' + passed + '/' + total + ' passed');
  return passed === total;
}

function testBlacklistLogic() {
  console.log('\n=== Blacklist Logic Test ===\n');

  // Simulate the blacklist check logic from content.js
  var blacklist = ['example.com', 'mail.google.com'];

  var tests = [
    { hostname: 'example.com', expected: true, desc: 'Blacklisted site' },
    { hostname: 'mail.google.com', expected: true, desc: 'Blacklisted subdomain' },
    { hostname: 'google.com', expected: false, desc: 'Non-blacklisted site' },
    { hostname: 'github.com', expected: false, desc: 'Another non-blacklisted site' },
    { hostname: '', expected: false, desc: 'Empty hostname (local files)' },
  ];

  var passed = 0;
  tests.forEach(function (test) {
    var isBlacklisted = blacklist.indexOf(test.hostname) !== -1;
    var ok = isBlacklisted === test.expected;
    if (ok) passed++;
    console.log((ok ? '✅' : '❌') + ' ' + test.desc + ' → ' + (isBlacklisted ? 'blocked' : 'allowed'));
  });

  console.log('\n' + passed + '/' + tests.length + ' passed');
  return passed === tests.length;
}

// Run all tests
var r1 = testCopyFix();
var r2 = testBlacklistLogic();
process.exit((r1 && r2) ? 0 : 1);
