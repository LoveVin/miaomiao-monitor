const types = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert']
const scopes = ['project', 'docs', 'style', 'ci', 'dev', 'deploy', 'other']

module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'scope-enum': [2, 'always', scopes],
        'type-enum': [2, 'always', types],
    },
}
