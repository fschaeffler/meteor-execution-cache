/* global Package */

Package.describe({
    name: 'fschaeffler:execution-cache',
    version: '0.0.1',
    summary: 'cache for execution context',
    documentation: 'README.md',
    git: 'git@bitbucket.org:florian_schaeffler/execution-cache.git'
});

Package.onUse(api => {
    api.versionsFrom('1.7');
    api.use(['modules', 'ecmascript', 'mongo', 'underscore'], 'server');
    api.mainModule('cache.js', 'server');
});

Package.onTest(api => {
    api.use(
        ['tinytest', 'ecmascript', 'mongo', 'fschaeffler:execution-cache'],
        'server'
    );

    api.addFiles('cache-tests.js', 'server');
});
