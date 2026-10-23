export default () => {
    const clientId = process.env.KAFKA_CLIENT_ID
    const brokers = process.env.KAFKA_BROKERS

    if (!clientId || !brokers) {
        throw new Error('Missing Kafka environment variables: KAFKA_CLIENT_ID, KAFKA_BROKERS')
    }

    return {
        kafka: {
            clientId,
            brokers: brokers.split(','),
        },
    }
}
