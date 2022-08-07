// @ts-check

const babel = require("@babel/core");
const istanbulInstrument = require("istanbul-lib-instrument");

function stringToArray(prop, obj) {
  if (typeof obj[prop] === 'string') {
    obj[prop] = [obj[prop]]
  }

  return obj
}

function combineNycOptions(...options) {
  // last option wins
  const nycOptions = Object.assign({}, ...options)

  // normalize string and [string] props
  stringToArray('reporter', nycOptions)
  stringToArray('extension', nycOptions)
  stringToArray('exclude', nycOptions)

  return nycOptions
}

const defaultNycOptions = {
  'report-dir': './coverage',
  reporter: ['lcov', 'clover', 'json', 'json-summary'],
  extension: ['.js', '.cjs', '.mjs', '.ts', '.tsx', '.jsx'],
  excludeAfterRemap: false
}

/**
 * Returns an object with placeholder properties for files we
 * do not have coverage yet. The result can go into the coverage object
 *
 * @param {string} fullPath Filename
 */
const fileCoveragePlaceholder = (fullPath) => {
  return {
    path: fullPath,
    statementMap: {},
    fnMap: {},
    branchMap: {},
    s: {},
    f: {},
    b: {}
  }
}

const initialCoverageData = (fullPath) => {
  let code;

  // HACK: might be non-Javascript object, use a try/catch block
  try {
    ({ code } = babel.transformFileSync(fullPath));
  } catch(error) {
    return null;
  }

  const coverage = istanbulInstrument.readInitialCoverage(code);

  if (!coverage || !coverage.coverageData) {
    return null;
  }

  return coverage.coverageData;
};

const isPlaceholder = (entry) => {
  // when the file has been instrumented, its entry has "hash" property
  return !('hash' in entry)
}

/**
 * Given a coverage object with potential placeholder entries
 * inserted instead of covered files, removes them. Modifies the object in place
 */
const removePlaceholders = (coverage) => {
  Object.keys(coverage).forEach((key) => {
    if (isPlaceholder(coverage[key])) {
      delete coverage[key]
    }
  })
}

module.exports = {
  combineNycOptions,
  defaultNycOptions,
  fileCoveragePlaceholder,
  initialCoverageData,
  removePlaceholders
}
