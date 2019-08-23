/* eslint-disable import/no-unresolved */
import { Mongo } from 'meteor/mongo';
import { _ } from 'meteor/underscore';
/* eslint-enable import/no-unresolved */

/**
 * Constructor for the execution-context cache instance
 * @param  {Object} options            Mandatory options for the cache to work properly.
 *                                     Available options are:
 *                                     - {Integer} contextId
 *                                     - {Integer} subContextId
 * @param  {Object} initalCacheContent This contains the cache content from which the cache will get populated.
 *                                     Available settings
 *                                     - {String} context (Key) The collection to which the data will get attached
 *                                     - {[Object]} dataEntries (Value) The data which should get attached to the context
 */
export default function(options, initalCacheContent) {
    if (!options || !options.contextId || !options.subContextId) {
        throw new Error('missing configuration options');
    }

    const { contextId, subContextId } = options;
    const cacheStore = {};

    const insertOne = (collection, dataEntry) => {
        /* eslint-disable-next-line no-underscore-dangle */
        if (!dataEntry._id) {
            return;
        }

        // fake an upsert because it has issues on local collections
        /* eslint-disable no-underscore-dangle */
        if (collection.findOne({ _id: dataEntry._id })) {
            collection.update({ _id: dataEntry._id }, dataEntry);
        } else {
            collection.insert(dataEntry);
        }
        /* eslint-enable no-underscore-dangle */
    };

    const getCacheEntries = () =>
        _.flatten(
            _.map(_.values(cacheStore), cacheStoreEntry =>
                cacheStoreEntry.collection.find().fetch()
            )
        );

    const getNewMongoCollection = () => {
        const collection = new Mongo.Collection(null);

        collection.allow({
            insert: () => true,
            update: () => true,
            remove: () => true
        });

        return collection;
    };

    const findOneLocal = (query, context) => {
        if (context) {
            if (!cacheStore[context] || !cacheStore[context].collection) {
                return null;
            }

            return cacheStore[context].collection.findOne({
                ...query,
                contextId,
                subContextId
            });
        }

        // when no context had been specified, we will search through all existing contexts
        let result = null;
        _.each(_.keys(cacheStore), collectionName => {
            if (!result) {
                const firstResult = cacheStore[
                    collectionName
                ].collection.findOne({ ...query, contextId, subContextId });

                if (firstResult) {
                    result = firstResult;
                }
            }
        });

        return result;
    };

    /**
     * Resets the cache to its initial state
     */
    this.reset = () =>
        _.each(_.keys(cacheStore), collectionName =>
            cacheStore[collectionName].collection.remove({})
        );

    /**
     * Inserts one element into the cache
     * @param  {String} context The context like e.g. Projects-context into which the content should get inserted
     * @param  {Object} content The actual data which should get inserted. The data however needs to contain
     *                          an `_id`-field in order to work.
     */
    this.insert = (context, content) => {
        if (!content) {
            return;
        }

        if (!cacheStore[context]) {
            cacheStore[context] = { collection: getNewMongoCollection() };
        }

        if (Array.isArray(content)) {
            _.each(content, contentEntry =>
                insertOne(cacheStore[context].collection, contentEntry)
            );
        } else {
            insertOne(cacheStore[context].collection, content);
        }
    };

    /**
     * Retrieve statistical data on the current state of the cache
     * @param  {Boolean} debug In case this optional-flag is set, the cache stats will also include the acutal data entries
     * @return {Object}        [description]
     */
    this.cacheStats = (debug = false) => {
        const entries = getCacheEntries();

        const stats = {
            contextId,
            subContextId,
            collections: _.keys(cacheStore),
            noOfEntries: entries.length
        };

        if (!debug) {
            return stats;
        }

        return { ...stats, entries };
    };

    /**
     * Replace the current cache state with the new cache content.
     * @param  {Object} cacheContent This contains the cache content from which the cache will get populated.
     *                               Available settings
     *                               - {String} context (Key) The collection to which the data will get attached
     *                               - {[Object]} dataEntries (Value) The data which should get attached to the context
     */
    this.fill = cacheContent => {
        this.reset();

        _.extend(
            cacheStore,
            _.indexBy(
                _.map(_.keys(cacheContent), collectionName => ({
                    context: collectionName,
                    collection: getNewMongoCollection()
                })),
                'context'
            )
        );

        _.each(_.keys(cacheContent), collectionName => {
            const collectionEntries = cacheContent[collectionName];

            _.each(collectionEntries, dataEntry => {
                insertOne(cacheStore[collectionName].collection, dataEntry);
            });
        });

        if (process.env.DEBUG) {
            /* eslint-disable-next-line no-console */
            console.log(
                `Cache Stats:\n${JSON.stringify(
                    this.cacheStats(true),
                    null,
                    2
                )}`
            );
        }
    };

    /**
     * Finds one data entry by a mongo-query
     * @param  {String} query   Definition of the query of what to search for..
     * @param  {String} context In case no context is specified, all possible contexts are getting checked.
     *                          Checking all possible contexts of course means more operations, which is why
     *                          the ordinary call of this method should include a context.
     * @return {Object}         The actual data entry in case it's available in the cache.
     */
    this.findOne = (query, context) => findOneLocal(query, context);

    /**
     * Alias method to find one data entry by its ID from the the `_id`-field
     * @param  {String} id      The data entry ID which to search for
     * @param  {String} context In case no context is specified, all possible contexts are getting checked.
     *                          Checking all possible contexts of course means more operations, which is why
     *                          the ordinary call of this method should include a context.
     * @return {Object}         The actual data entry in case it's available in the cache.
     */
    this.findOneById = (id, context) => findOneLocal({ _id: id }, context);

    /**
     * Invalidates / Removes a data entry from the cache
     * @param  {String} id      The data entry ID which should get removed from the cache
     * @param  {String} context In case no context is specified, all possible contexts are getting checked.
     *                          Checking all possible contexts of course means more operations, which is why
     *                          the ordinary call of this method should include a context.
     */
    this.invalidateOneById = (id, context) => {
        if (context) {
            cacheStore[context].collection.remove({
                _id: id,
                contextId,
                subContextId
            });
        } else {
            _.each(_.keys(cacheStore), collectionName =>
                cacheStore[collectionName].remove({
                    _id: id,
                    contextId,
                    subContextId
                })
            );
        }
    };

    /**
     * Alias method to check if one data entry exists with the ID from the the `_id`-field
     * @param  {String} id      The data entry ID which to check for
     * @param  {String} context In case no context is specified, all possible contexts are getting checked.
     *                          Checking all possible contexts of course means more operations, which is why
     *                          the ordinary call of this method should include a context.
     * @return {Boolean}        Result of the check if the data entry is included in the cache
     */
    this.isHitById = (id, context) => !!findOneLocal({ _id: id }, context);

    /**
     * Alias method to check if one data entry exists based on the provided query
     * @param  {Object} query   The data entry query which to check for
     * @param  {String} context In case no context is specified, all possible contexts are getting checked.
     *                          Checking all possible contexts of course means more operations, which is why
     *                          the ordinary call of this method should include a context.
     * @return {Boolean}        Result of the check if the data entry is included in the cache
     */
    this.isHit = (query, context) => !!findOneLocal(query, context);

    /**
     * Fills the cache for its first initial state
     * @param  {Object} initalCacheContent Initial content for the cache
     */
    this.fill(initalCacheContent || {});
}
