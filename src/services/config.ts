import { createClient, type RedisClientType, type RedisClientOptions } from "redis";

/**
 * Redis 연결 풀 설정
 */
export interface RedisPoolConfig {
  /** 연결 타임아웃 (밀리초), 기본값: 10000 */
  connectTimeout?: number;
  /** 연결 유지 활성화 여부, 기본값: true */
  keepAlive?: boolean;
  /** 연결 유지 초기 지연 시간 (밀리초), 기본값: 0 */
  keepAliveInitialDelay?: number;
  /** 재연결 전략: false(재연결 안함), number(밀리초 지연), function(재연결 전략 함수) */
  reconnectStrategy?: false | number | ((retries: number) => number | Error);
  /** 지연 연결 (true면 connect() 호출 시 연결), 기본값: false */
  lazyConnect?: boolean;
  /** 최대 재연결 시도 횟수, 기본값: 10 */
  maxRetriesPerRequest?: number;
}

/**
 * Redis 클라이언트 인스턴스
 * @private
 */
let redisClient: RedisClientType | null = null;

/**
 * Redis 연결 상태
 * @private
 */
let isConnected = false;

/**
 * 환경 변수에서 연결 풀 설정을 읽어옵니다.
 * @returns {RedisPoolConfig} 연결 풀 설정
 */
const getPoolConfigFromEnv = (): Partial<RedisPoolConfig> => {
  const config: Partial<RedisPoolConfig> = {};

  if (process.env.REDIS_CONNECT_TIMEOUT) {
    config.connectTimeout = parseInt(process.env.REDIS_CONNECT_TIMEOUT, 10);
  }
  if (process.env.REDIS_KEEP_ALIVE !== undefined) {
    config.keepAlive = process.env.REDIS_KEEP_ALIVE === "true";
  }
  if (process.env.REDIS_KEEP_ALIVE_DELAY) {
    config.keepAliveInitialDelay = parseInt(process.env.REDIS_KEEP_ALIVE_DELAY, 10);
  }
  if (process.env.REDIS_LAZY_CONNECT === "true") {
    config.lazyConnect = true;
  }
  if (process.env.REDIS_MAX_RETRIES) {
    config.maxRetriesPerRequest = parseInt(process.env.REDIS_MAX_RETRIES, 10);
  }

  return config;
};

/**
 * Redis 클라이언트를 초기화하고 연결합니다.
 * 환경 변수 REDIS_URL이 설정되어 있으면 해당 URL을 사용하고,
 * 없으면 기본값 'redis://localhost:6379'를 사용합니다.
 * 연결 풀 설정은 환경 변수 또는 poolConfig 파라미터로 지정할 수 있습니다.
 *
 * @param {RedisPoolConfig} [poolConfig] - 연결 풀 설정 (선택사항)
 * @throws {Error} Redis 연결에 실패한 경우
 */
const initializeRedis = async (poolConfig?: RedisPoolConfig): Promise<void> => {
  const redisUrl = process.env.REDIS_PORT ? `redis://localhost:${process.env.REDIS_PORT}` : process.env.REDIS_URL;
  if (!redisUrl) {
    const error = new Error("Redis configuration error: REDIS_URL or REDIS_PORT environment variable is not set");
    console.error("[Redis Wizard] Initialization failed:", error.message);
    throw error;
  }

  if (redisClient && isConnected) {
    console.log("[Redis Wizard] Client already connected, skipping initialization");
    return;
  }

  // 환경 변수에서 연결 풀 설정 읽기
  const envPoolConfig = getPoolConfigFromEnv();
  
  // 파라미터와 환경 변수 설정 병합 (파라미터 우선)
  const finalPoolConfig: RedisPoolConfig = {
    connectTimeout: 10000,
    keepAlive: true,
    keepAliveInitialDelay: 0,
    lazyConnect: false,
    maxRetriesPerRequest: 10,
    ...envPoolConfig,
    ...poolConfig,
  };

  const socketConfig: any = {
    connectTimeout: finalPoolConfig.connectTimeout,
  };

  if (finalPoolConfig.keepAlive !== undefined) {
    socketConfig.keepAlive = finalPoolConfig.keepAlive;
  }
  if (finalPoolConfig.keepAliveInitialDelay !== undefined) {
    socketConfig.keepAliveInitialDelay = finalPoolConfig.keepAliveInitialDelay;
  }
  if (finalPoolConfig.reconnectStrategy !== undefined) {
    socketConfig.reconnectStrategy = finalPoolConfig.reconnectStrategy;
  } else {
    socketConfig.reconnectStrategy = (retries: number) => {
      if (retries > 10) {
        return new Error("Too many reconnection attempts");
      }
      return Math.min(retries * 100, 3000);
    };
  }

  const clientOptions: RedisClientOptions = {
    url: redisUrl,
    socket: socketConfig,
    ...(finalPoolConfig.lazyConnect !== undefined && { lazyConnect: finalPoolConfig.lazyConnect }),
    ...(finalPoolConfig.maxRetriesPerRequest !== undefined && { maxRetriesPerRequest: finalPoolConfig.maxRetriesPerRequest }),
  };

  console.log(`[Redis Wizard] Initializing Redis client with URL: ${redisUrl.replace(/:[^:@]+@/, ":****@")}`, {
    poolConfig: {
      connectTimeout: finalPoolConfig.connectTimeout,
      keepAlive: finalPoolConfig.keepAlive,
      keepAliveInitialDelay: finalPoolConfig.keepAliveInitialDelay,
      lazyConnect: finalPoolConfig.lazyConnect,
      maxRetriesPerRequest: finalPoolConfig.maxRetriesPerRequest,
    },
  });

  redisClient = createClient(clientOptions) as RedisClientType;

  redisClient.on("error", (err) => {
    console.error("[Redis Wizard] Connection error occurred:", {
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
    });
    isConnected = false;
  });

  redisClient.on("connect", () => {
    console.log("[Redis Wizard] Connecting to Redis server...");
  });

  redisClient.on("ready", () => {
    console.log("[Redis Wizard] Redis client connected and ready at url: " + redisUrl);
    isConnected = true;
  });

  redisClient.on("reconnecting", () => {
    console.warn("[Redis Wizard] Attempting to reconnect to Redis server...", {
      timestamp: new Date().toISOString(),
    });
    isConnected = false;
  });

  redisClient.on("end", () => {
    console.log("[Redis Wizard] Redis connection ended", {
      timestamp: new Date().toISOString(),
    });
    isConnected = false;
  });

  try {
    console.log("[Redis Wizard] Establishing connection...");
    await redisClient.connect();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Redis Wizard] Failed to connect to Redis:", {
      message: errorMessage,
      url: redisUrl.replace(/:[^:@]+@/, ":****@"),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Redis 클라이언트가 연결되어 있는지 확인합니다.
 * 연결되어 있지 않으면 자동으로 연결을 시도합니다.
 *
 * @param {RedisPoolConfig} [poolConfig] - 연결 풀 설정 (선택사항, 초기화 시에만 적용)
 * @returns {Promise<RedisClientType>} 연결된 Redis 클라이언트
 * @throws {Error} Redis 클라이언트가 초기화되지 않았거나 연결에 실패한 경우
 */
export const getRedisClient = async (poolConfig?: RedisPoolConfig): Promise<RedisClientType> => {
  if (!redisClient || !isConnected) {
    console.log("[Redis Wizard] Client not available, initializing...");
    await initializeRedis(poolConfig);
  }
  if (!redisClient) {
    const error = new Error("Redis client initialization failed: client is null after initialization attempt");
    console.error("[Redis Wizard]", error.message);
    throw error;
  }
  return redisClient;
};

/**
 * Redis 연결 풀 설정을 업데이트합니다.
 * 이미 연결된 경우에는 재연결이 필요할 수 있습니다.
 *
 * @param {RedisPoolConfig} poolConfig - 새로운 연결 풀 설정
 * @returns {Promise<void>}
 */
export const configurePool = async (poolConfig: RedisPoolConfig): Promise<void> => {
  if (redisClient && isConnected) {
    console.warn("[Redis Wizard] Pool configuration change requires reconnection. Disconnecting current client...");
    await disconnect();
  }
  await initializeRedis(poolConfig);
};

/**
 * Redis 연결을 종료합니다.
 *
 * @returns {Promise<void>}
 */
export const disconnect = async (): Promise<void> => {
  if (redisClient && isConnected) {
    console.log("[Redis Wizard] Disconnecting Redis client...");
    try {
      await redisClient.quit();
      console.log("[Redis Wizard] Redis client disconnected successfully", {
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[Redis Wizard] Error during disconnection:", {
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
    isConnected = false;
    redisClient = null;
  } else {
    console.log("[Redis Wizard] No active connection to disconnect");
  }
};

// 애플리케이션 시작 시 Redis 연결 초기화
initializeRedis().catch((error) => {
  console.error("[Redis Wizard] Failed to initialize Redis on application startup:", {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  });
});
