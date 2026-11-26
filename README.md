# Chzzk Notify (Chrome Extension)

[日本語](#日本語) | [한국어](#한국어) | [English](#english)

---

## 日本語

Chzzk（치지직）でフォローしているストリーマーの配信ステータスを監視し、配信開始・終了・カテゴリ変更をChromeデスクトップ通知およびダッシュボードUIでリアルタイムに知らせるChrome拡張機能です。

### 主な機能

1. **Chzzkログイン自動連動**:
   - ブラウザでChzzkにログインしていれば、認証セッションを自動利用してフォロー中の配信者を自動取得。
2. **デスクトップ通知**:
   - **配信開始通知**: 配信が始まった瞬間にトースト通知でお知らせ。
   - **配信終了通知**: 配信がオフラインになった時に直前の配信タイトル付きでお知らせ。
   - **カテゴリ変更通知**: 配信中にプレイ中のゲームやカテゴリが切り替わった時にお知らせ。
   - **起動・スリープ復帰時の通知ラッシュ防止**: ブラウザ起動直後やPCスリープ復帰時は自動でサイレント同期を行い、過去の放送分の通知が一気に届くのを防ぎます。
3. **ステータス一覧ダッシュボード (Popup UI)**:
   - アイコンをクリックすると、現在配信中のストリーマー（サムネイル、タイトル、ゲーム名、視聴者数、配信時間）とオフラインのストリーマーを一覧表示。
   - 配信者名・ゲーム名・タイトルでのインクリメンタル検索。
4. **配信者ごとの通知ON/OFF設定**:
   - 各ストリーマーのカードや行にあるベルマーク（🔔）をクリックすることで、個別に通知をミュート・有効化できます。
5. **PiP（ミニプレイヤー）対応**:
   - 各配信カードの「🗔 PiP」ボタンをクリックすると、別作業を邪魔しない枠なし小型ウィンドウで配信プレイヤーを起動できます。
6. **カスタムサウンド & おやすみモード (Do Not Disturb)**:
   - 3種類の通知音（チャイム / ポップ / ベル）と音量調整。
   - 指定した時間帯（例: 00:00〜08:00）の通知と音を停止するおやすみモード。
7. **多言語対応（日本語 / 한국어 / English）**:
   - ブラウザの言語設定に応じた自動切り替え、および設定画面からの手動言語切り替えに対応。
8. **拡張アイコンバッジ**:
   - 現在配信中の人数を拡張機能アイコン上にリアルタイムバッジ表示。

### インストール・使用方法

1. **Google Chrome** を起動します。
2. アドレスバーに `chrome://extensions` と入力して拡張機能管理画面を開きます。
3. 画面右上の **「デベロッパー モード」** のトグルスイッチを **ON** にします。
4. 左上に表示される **「パッケージ化されていない拡張機能を読み込む」** をクリックします。
5. ダウンロード（または `git clone`）した本プロジェクトのフォルダを選択します。
6. 拡張機能一覧に **「Chzzk Notify」** が追加されます。ツールバーのパズルアイコンからピン留めすると便利です。

### 免責事項

本拡張機能は個人によって開発された**非公式（Unofficial）ツール**であり、NAVER Corporation および 치지직（Chzzk）とは一切関係がありません。
提供されるデータの著作権および商標は、それぞれの権利所有者（NAVER Corporation および各配信者）に帰属します。

---

## 한국어

치지직(Chzzk)에서 팔로우 중인 스트리머의 방송 상태를 모니터링하고, 방송 시작·종료·카테고리 변경을 Chrome 데스크톱 알림 및 대시보드 UI로 실시간으로 알려주는 Chrome 확장 프로그램입니다.

### 주요 기능

1. **치지직 로그인 자동 연동**:
   - 브라우저에서 치지직에 로그인되어 있으면 인증 세션을 자동으로 활용하여 팔로우 중인 스트리머 목록을 불러옵니다.
2. **데스크톱 알림**:
   - **방송 시작 알림**: 방송이 시작되는 순간 토스트 알림으로 알려줍니다.
   - **방송 종료 알림**: 방송이 오프라인으로 전환될 때 이전 방송 제목과 함께 알려줍니다.
   - **카테고리 변경 알림**: 방송 중 플레이 중인 게임이나 카테고리가 변경되면 알려줍니다.
   - **시작 및 절전 복귀 시 알림 폭주 방지**: 브라우저 시작 직후나 PC 절전 모드 복귀 시 자동으로 조용히 동기화하여, 지난 방송 알림이 한꺼번에 쏟아지는 것을 방지합니다.
3. **상태 목록 대시보드 (Popup UI)**:
   - 확장 프로그램 아이콘을 클릭하면 현재 생방송 중인 스트리머(썸네일, 제목, 게임명, 시청자 수, 방송 시간)와 오프라인 스트리머를 한눈에 확인할 수 있습니다.
   - 스트리머명, 게임명, 제목으로 실시간 검색을 지원합니다.
4. **스트리머별 알림 ON/OFF 설정**:
   - 각 스트리머 카드 또는 행에 있는 종 아이콘(🔔)을 클릭하여 개별적으로 알림을 음소거하거나 활성화할 수 있습니다.
5. **PiP (미니 플레이어) 지원**:
   - 각 방송 카드의 「🗔 PiP」 버튼을 클릭하면 다른 작업을 방해하지 않는 테두리 없는 소형 창으로 방송 플레이어를 실행할 수 있습니다.
6. **커스텀 알림음 & 방해 금지 모드 (Do Not Disturb)**:
   - 3가지 알림음(차임 / 팝 / 벨) 선택 및 음량 조절을 지원합니다.
   - 지정한 시간대(예: 00:00~08:00) 동안 알림과 소리를 끄는 방해 금지 모드를 제공합니다.
7. **다국어 지원 (日本語 / 한국어 / English)**:
   - 브라우저 언어 설정에 따른 자동 전환 및 설정 화면에서의 수동 언어 변경을 지원합니다.
8. **확장 아이콘 배지**:
   - 현재 생방송 중인 채널 수를 확장 프로그램 아이콘 위에 실시간 배지로 표시합니다.

### 설치 및 사용 방법

1. **Google Chrome**을 실행합니다.
2. 주소창에 `chrome://extensions`를 입력하여 확장 프로그램 관리 페이지를 엽니다.
3. 화면 오른쪽 상단의 **「개발자 모드」** 토글 스위치를 **ON**으로 설정합니다.
4. 왼쪽 상단에 표시되는 **「압축해제된 확장 프로그램을 로드합니다」**를 클릭합니다.
5. 다운로드(또는 `git clone`)한 본 프로젝트 폴더를 선택합니다.
6. 확장 프로그램 목록에 **「Chzzk Notify」**가 추가됩니다. 툴바의 퍼즐 아이콘에서 고정하면 더욱 편리하게 사용할 수 있습니다.

### 면책 조항

본 확장 프로그램은 개인이 개발한 **비공식(Unofficial) 도구**이며, NAVER Corporation 및 치지직(Chzzk)과 아무런 관련이 없습니다.
표시되는 데이터의 저작권 및 상표권은 각 권리 소유자(NAVER Corporation 및 각 스트리머)에게 있습니다.

---

## English

A Chrome extension that monitors followed streamers on Chzzk (치지직) and delivers real-time desktop notifications and a popup dashboard for stream start, stream end, and category changes.

### Key Features

1. **Automatic Chzzk Login Sync**:
   - Automatically uses your active Chzzk browser session to fetch followed streamers—no manual API keys required.
2. **Desktop Notifications**:
   - **Live Start Notification**: Instant toast notification when a followed streamer goes live.
   - **Live End Notification**: Notifies you when a stream goes offline, including the last stream title.
   - **Category Change Notification**: Alerts you when a streamer switches games or categories mid-stream.
   - **Startup & Sleep-Wake Flood Suppression**: Performs a silent sync when Chrome starts or your PC wakes from sleep, preventing a flood of past notifications.
3. **Live Status Dashboard (Popup UI)**:
   - Click the extension icon to view currently live streamers (thumbnail, title, category, viewer count, uptime) and offline channels.
   - Incremental search by streamer name, game/category, or stream title.
4. **Per-Streamer Notification Toggle**:
   - Click the bell icon (🔔) on any streamer card or row to mute or enable notifications individually.
5. **PiP (Mini Player) Support**:
   - Click the "🗔 PiP" button on any live card to open the stream in a compact, frameless popup window.
6. **Custom Notification Sounds & Do Not Disturb**:
   - Choose from 3 synthesized alert tones (Chime / Pop / Bell) with adjustable volume.
   - Configure quiet hours (e.g., 00:00–08:00) to mute notifications and sounds.
7. **Multi-Language Support (日本語 / 한국어 / English)**:
   - Automatically matches your browser UI language or lets you switch manually in Settings.
8. **Live Count Badge**:
   - Displays the number of currently live followed channels directly on the extension icon badge.

### Installation & Usage

1. Open **Google Chrome**.
2. Navigate to `chrome://extensions` in the address bar.
3. Turn **ON** the **Developer mode** toggle in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the downloaded (or `git clone`d) project folder.
6. **Chzzk Notify** will appear in your extensions list. Pin it from the toolbar puzzle icon for quick access.

### Disclaimer

This extension is an **unofficial** tool developed independently and is not affiliated with NAVER Corporation or Chzzk (치지직).
All copyrights and trademarks for displayed data belong to their respective owners (NAVER Corporation and each streamer).

---

## Directory Structure / ディレクトリ構成 / 디렉터리 구조

```
chzzk-notify/
├── _locales/                # Chrome i18n locales (en, ja, ko)
├── manifest.json            # Manifest V3 configuration
├── background.js            # Main background service worker
├── icons/                   # Extension icons (16, 32, 48, 128px)
├── modules/
│   ├── api.js               # Chzzk Web API client
│   ├── audio.js             # Web Audio tone synthesizer
│   ├── i18n.js              # Multi-language translation helper
│   ├── notifications.js     # Desktop notifications, audio & badge manager
│   └── storage.js           # chrome.storage settings & state cache
├── offscreen/
│   ├── offscreen.html       # Offscreen document for Web Audio
│   └── offscreen.js         # Synthesized audio player
├── popup/
│   ├── popup.html           # Status dashboard HTML
│   ├── popup.css            # Chzzk neon green & dark UI styles
│   └── popup.js             # Dashboard rendering, search & settings logic
├── scripts/
│   └── generate_icons.js    # Icon generator script
└── LICENSE                  # MIT License
```

---

## License

[MIT License](LICENSE)
