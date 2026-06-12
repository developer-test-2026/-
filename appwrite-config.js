/**
 * Appwrite Configuration
 * プロジェクト設定時に以下の値を環境変数から読み込んでください
 */

const APPWRITE_CONFIG = {
  endpoint: 'https://cloud.appwrite.io/v1', // Appwrite Cloud エンドポイント
  projectId: 'your-project-id', // 環境変数から設定
  apiKey: 'your-api-key', // サーバー側のみ使用
  databaseId: 'exam-system-db',
  bucketId: 'test-configs',
  
  // コレクション ID
  collections: {
    exams: 'exams-collection',
    results: 'results-collection',
    logs: 'logs-collection',
    users: 'users-collection'
  }
};

// クライアント側の初期化（サーバーサイドレンダリングまたは API ゲートウェイを経由）
let appwriteClient = null;

function initAppwriteClient() {
  const { Client, Databases, Storage, Account } = window.Appwrite;
  
  appwriteClient = {
    client: new Client()
      .setEndpoint(APPWRITE_CONFIG.endpoint)
      .setProject(APPWRITE_CONFIG.projectId),
    
    database: new Databases(new Client()
      .setEndpoint(APPWRITE_CONFIG.endpoint)
      .setProject(APPWRITE_CONFIG.projectId)),
    
    storage: new Storage(new Client()
      .setEndpoint(APPWRITE_CONFIG.endpoint)
      .setProject(APPWRITE_CONFIG.projectId)),
    
    account: new Account(new Client()
      .setEndpoint(APPWRITE_CONFIG.endpoint)
      .setProject(APPWRITE_CONFIG.projectId))
  };
  
  return appwriteClient;
}

// ローカルストレージとAppwriteの同期キュー
class SyncQueue {
  constructor() {
    this.queue = [];
    this.isSyncing = false;
  }
  
  add(operation) {
    this.queue.push({
      ...operation,
      timestamp: Date.now(),
      synced: false
    });
    localStorage.setItem('sync-queue', JSON.stringify(this.queue));
    this.processPending();
  }
  
  async processPending() {
    if (this.isSyncing || !navigator.onLine) return;
    
    this.isSyncing = true;
    const unsyncedItems = this.queue.filter(q => !q.synced);
    
    for (const item of unsyncedItems) {
      try {
        await this.executeOperation(item);
        item.synced = true;
      } catch (e) {
        console.error('Sync error:', e);
        // 失敗したアイテムは再試行待ち
      }
    }
    
    // 同期済みのものをキューから削除
    this.queue = this.queue.filter(q => !q.synced);
    localStorage.setItem('sync-queue', JSON.stringify(this.queue));
    this.isSyncing = false;
  }
  
  async executeOperation(item) {
    // 実装は各操作タイプに応じて
  }
}

const syncQueue = new SyncQueue();

// オンライン/オフライン検知
window.addEventListener('online', () => syncQueue.processPending());
