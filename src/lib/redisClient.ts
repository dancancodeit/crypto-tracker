
import { createClient, RedisClientType } from 'redis';

let client: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
        if (!client) {
                client = createClient({
                        socket: {
                                host: 'localhost',
                                port: 6379,
                        },
                });

                client.on('error', (err) => {
                        console.error('Redis Client Error:', err);
                });

                await client.connect();
        }

        return client;
}
