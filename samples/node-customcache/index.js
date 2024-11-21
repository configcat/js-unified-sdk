const configcat = require("@configcat/sdk/node");
const redis = require("redis");
const configcatRedisCache = require("./configcat-redis-cache");

const redisOptions = { host: "localhost", port: 6379 };

const configCatClient = configcat.getClient("configcat-sdk-1/PKDVCLf-Hq-h-kCzMp-L7Q/tiOvFw5gkky9LFu1Duuvzw", configcat.PollingMode.AutoPoll,
  {
    cache: new configcatRedisCache(redisOptions)
  });

setInterval(() => {
  configCatClient.getValueAsync("isPOCFeatureEnabled", false, new configcat.User("", "configcat@example.com")).then(value => {
    console.log(new Date().toTimeString() + " isPOCFeatureEnabled: " + value);
  });
}, 5000);
