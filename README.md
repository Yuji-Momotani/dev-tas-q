# tas-q

## 起動方法
### dockerでの起動
- 前提：dockerがインストールされていること

```sh
# オプション-dはお好きにどうぞ
docker compose up
```

### ローカル起動
- 前提：node.jsがインストールされていること

初回のみ「依存関係のインストール」を実行。2回目以降は`npm run dev`のみでOK
```sh
# 依存関係のインストール
npm install

# ローカルで起動
npm run dev
```

- 管理者のログイン画面
	- `/admin/login`
- 作業者のログイン画面
	- `/user/login`
