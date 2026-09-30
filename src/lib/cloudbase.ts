import cloudbase from "@cloudbase/node-sdk";

/** CloudBase App 单例缓存. */
let _app: ReturnType<typeof cloudbase.init> | null = null;

/**
 * 获取 CloudBase App 单例（懒加载）。
 * 云托管环境用 env + accessKey 鉴权；accessKey 从环境变量 CLOUDBASE_APIKEY 读取。
 * ⚠️ 只能在请求处理函数内部调用，禁止在模块顶层调用（否则 next build 阶段会崩）。
 */
export function getApp() {
  if (!_app) {
    _app = cloudbase.init({
      env: process.env.CLOUDBASE_ENV_ID,
      accessKey: process.env.CLOUDBASE_APIKEY,
    });
  }
  return _app;
}

/** 获取数据库实例（同样只能在请求处理函数内调用）. */
export function getDb() {
  return getApp().database();
}
