/* eslint-disable import/no-unresolved */
import { Mongo } from 'meteor/mongo';
import { Tinytest } from 'meteor/tinytest';
import ExecCache from 'meteor/fschaeffler:execution-cache';
/* eslint-enable import/no-unresolved */

Tinytest.add('ExecCache: self test', test => test.equal(true, true));

Tinytest.add('ExecCache: hit', test => {
    const id1 = new Mongo.ObjectID().valueOf();
    const id2 = new Mongo.ObjectID().valueOf();
    const id3 = new Mongo.ObjectID().valueOf();

    const contextId = 123;
    const subContextId = 456;

    const cache = new ExecCache(
        { contextId, subContextId },
        {
            collection1: [
                { _id: id1, value: 'value1', contextId, subContextId },
                { _id: id2, value: 'value2', contextId, subContextId }
            ],
            collection2: [
                {
                    _id: id3,
                    value: 'value collection2',
                    contextId,
                    subContextId
                }
            ]
        }
    );

    test.equal(cache.isHitById(id2, 'collection1'), true);
    test.equal(cache.isHitById(id3), true);
    test.equal(cache.isHitById(id3, 'collection1'), false);
    test.equal(cache.isHit({ value: 'value2' }, 'collection1'), true);
});

Tinytest.add('ExecCache: invalidate', test => {
    const id1 = new Mongo.ObjectID().valueOf();
    const id2 = new Mongo.ObjectID().valueOf();

    const contextId = 123;
    const subContextId = 456;

    const cache = new ExecCache(
        { contextId, subContextId },
        {
            collection: [
                { _id: id1, value: 'value1', contextId, subContextId },
                { _id: id2, value: 'value2', contextId, subContextId }
            ]
        }
    );

    const id1Entry = cache.findOneById(id1, 'collection');
    const id2Entry = cache.findOneById(id2, 'collection');

    test.equal(id1Entry && id1Entry.value, 'value1');
    test.equal(id2Entry && id2Entry.value, 'value2');

    cache.invalidateOneById(id1, 'collection');

    const id2EntryAfterInvalidation = cache.findOneById(id2, 'collection');

    test.equal(cache.isHitById(id1, 'collection'), false);
    test.equal(
        id2EntryAfterInvalidation && id2EntryAfterInvalidation.value,
        'value2'
    );
});

Tinytest.add('ExecCache: reset', test => {
    const id1 = new Mongo.ObjectID().valueOf();
    const id2 = new Mongo.ObjectID().valueOf();

    const contextId = 123;
    const subContextId = 456;

    const cache = new ExecCache(
        { contextId, subContextId },
        {
            collection: [
                { _id: id1, value: 'value1', contextId, subContextId },
                { _id: id2, value: 'value2', contextId, subContextId }
            ]
        }
    );

    test.equal(cache.isHitById(id1), true);
    test.equal(cache.isHitById(id2), true);

    cache.reset();

    test.equal(cache.isHitById(id1), false);
    test.equal(cache.isHitById(id2), false);
});

Tinytest.add('ExecCache: separate instances', test => {
    const id1 = new Mongo.ObjectID().valueOf();
    const id2 = new Mongo.ObjectID().valueOf();
    const id3 = new Mongo.ObjectID().valueOf();
    const id4 = new Mongo.ObjectID().valueOf();
    const id5 = new Mongo.ObjectID().valueOf();
    const id6 = new Mongo.ObjectID().valueOf();

    const contextId = 123;
    const subContextId = 456;

    const cache1 = new ExecCache(
        { contextId, subContextId },
        {
            collection1: [
                { _id: id1, value: 'value1', contextId, subContextId },
                { _id: id2, value: 'value2', contextId, subContextId }
            ],
            collection2: [
                {
                    _id: id3,
                    value: 'value collection2',
                    contextId,
                    subContextId
                }
            ]
        }
    );

    const cache2 = new ExecCache(
        { contextId, subContextId },
        {
            collection1: [
                { _id: id4, value: 'value1 cache2', contextId, subContextId },
                { _id: id5, value: 'value2 cache2', contextId, subContextId }
            ],
            collection2: [
                {
                    _id: id6,
                    value: 'value collection2 cache2',
                    contextId,
                    subContextId
                }
            ]
        }
    );

    test.equal(cache1.isHitById(id1), true);
    test.equal(cache1.isHitById(id4), false);
    test.equal(cache2.isHitById(id4), true);

    const cacheHit = cache2.findOneById(id6);
    test.equal(cacheHit && cacheHit.value, 'value collection2 cache2');
});

Tinytest.add('ExecCache: insert after fill', test => {
    const id1 = new Mongo.ObjectID().valueOf();
    const id2 = new Mongo.ObjectID().valueOf();
    const id3 = new Mongo.ObjectID().valueOf();

    const contextId = 123;
    const subContextId = 456;

    const cache = new ExecCache(
        { contextId, subContextId },
        {
            collection1: [
                {
                    _id: id1,
                    value: 'value1 collection1',
                    contextId,
                    subContextId
                }
            ],
            collection2: [
                {
                    _id: id2,
                    value: 'value2 collection2',
                    contextId,
                    subContextId
                }
            ]
        }
    );

    cache.insert('collection2', {
        _id: id3,
        value: 'value3 collection2',
        contextId,
        subContextId
    });
    test.equal(cache.isHitById(id1, 'collection1'), true);
    test.equal(cache.isHitById(id3, 'collection1'), false);
    test.equal(cache.isHitById(id3, 'collection2'), true);
});

Tinytest.add('ExecCache: insert one', test => {
    const id1 = new Mongo.ObjectID().valueOf();

    const contextId = 123;
    const subContextId = 456;

    const cache = new ExecCache({ contextId, subContextId });

    cache.insert('collection', {
        _id: id1,
        value: 'value1',
        contextId,
        subContextId
    });

    test.equal(cache.isHitById(id1, 'collection'), true);
});

Tinytest.add('ExecCache: insert one without any values', test => {
    const idWithoutValues = new Mongo.ObjectID().valueOf();

    const contextId = 123;
    const subContextId = 456;

    const cache = new ExecCache({ contextId, subContextId });

    cache.insert('collection', {
        _id: idWithoutValues,
        contextId,
        subContextId
    });

    test.equal(cache.isHitById(idWithoutValues, 'collection'), true);
});

Tinytest.add('ExecCache: insert bulk', test => {
    const id1 = new Mongo.ObjectID().valueOf();
    const id2 = new Mongo.ObjectID().valueOf();

    const contextId = 123;
    const subContextId = 456;

    const cache = new ExecCache({ contextId, subContextId });

    cache.insert('collection', [
        { _id: id1, value: 'value2', contextId, subContextId },
        { _id: id2, value: 'value3', contextId, subContextId }
    ]);

    test.equal(cache.isHitById(id1, 'collection'), true);
    test.equal(cache.isHitById(id2, 'collection'), true);
});

Tinytest.add('ExecCache: insert many by bulk', test => {
    const contextId = 123;
    const subContextId = 456;
    const cache = new ExecCache({ contextId, subContextId });

    const bulkContent = [];

    /* eslint-disable-next-line no-plusplus */
    for (let i = 0; i < 50000; i++) {
        bulkContent.push({
            _id: new Mongo.ObjectID().valueOf(),
            value: `value${i}`,
            contextId,
            subContextId
        });
    }

    cache.insert('collection', bulkContent);

    /* eslint-disable-next-line no-underscore-dangle */
    test.equal(cache.isHitById(bulkContent[0]._id, 'collection'), true);
    test.equal(
        cache.isHitById(
            /* eslint-disable-next-line no-underscore-dangle */
            bulkContent[bulkContent.length / 2 - 1]._id,
            'collection'
        ),
        true
    );
    test.equal(
        /* eslint-disable-next-line no-underscore-dangle */
        cache.isHitById(bulkContent[bulkContent.length - 1]._id, 'collection'),
        true
    );
});

Tinytest.add('ExecCache: insert duplicate', test => {
    const id = new Mongo.ObjectID().valueOf();

    const contextId = 123;
    const subContextId = 456;

    const cache = new ExecCache({ contextId, subContextId });

    cache.insert('collection', {
        _id: id,
        value: 'value1',
        contextId,
        subContextId
    });

    const cacheHit1 = cache.findOneById(id, 'collection');
    test.equal(cacheHit1 && cacheHit1.value, 'value1');

    cache.insert('collection', {
        _id: id,
        value: 'updatedValue',
        contextId,
        subContextId
    });
    const cacheHit2 = cache.findOneById(id, 'collection');
    test.equal(cacheHit2 && cacheHit2.value, 'updatedValue');
});
