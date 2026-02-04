import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 基本情報技術者試験 一問一答クイズデータ
// IPAの公開過去問を参考にオリジナル問題を作成
const feQuizzes = [
  // テクノロジ系 - 基礎理論
  {
    title: "基本情報技術者試験【基礎理論】",
    description: "基本情報技術者試験の基礎理論分野（2進数、論理演算、アルゴリズムなど）の一問一答です。",
    categorySlug: "certification",
    questions: [
      {
        text: "10進数の「13」を2進数で表すと？",
        options: ["1101", "1011", "1110", "1001"],
        correctIndex: 0,
        explanation: "13 = 8+4+1 = 2³+2²+2⁰ なので、2進数では1101になります。",
      },
      {
        text: "16進数の「2F」を10進数で表すと？",
        options: ["47", "31", "45", "63"],
        correctIndex: 0,
        explanation: "2F = 2×16¹ + 15×16⁰ = 32 + 15 = 47",
      },
      {
        text: "論理演算 A AND B の結果が1となるのは？",
        options: ["A=1, B=1のとき", "A=1, B=0のとき", "A=0, B=1のとき", "A=0, B=0のとき"],
        correctIndex: 0,
        explanation: "AND演算は両方の入力が1のときのみ出力が1になります。",
      },
      {
        text: "論理演算 A OR B の結果が0となるのは？",
        options: ["A=0, B=0のとき", "A=1, B=0のとき", "A=0, B=1のとき", "A=1, B=1のとき"],
        correctIndex: 0,
        explanation: "OR演算は両方の入力が0のときのみ出力が0になります。",
      },
      {
        text: "NOT演算（否定）で0を入力すると出力は？",
        options: ["1", "0", "-1", "2"],
        correctIndex: 0,
        explanation: "NOT演算は入力を反転するため、0を入力すると1が出力されます。",
      },
      {
        text: "排他的論理和（XOR）で A=1, B=1 のときの結果は？",
        options: ["0", "1", "-1", "2"],
        correctIndex: 0,
        explanation: "XORは入力が異なるときに1、同じときに0を出力します。1 XOR 1 = 0",
      },
      {
        text: "8ビットで表現できる符号なし整数の最大値は？",
        options: ["255", "256", "127", "128"],
        correctIndex: 0,
        explanation: "8ビットの符号なし整数は0〜255（2⁸-1）の範囲を表現できます。",
      },
      {
        text: "1バイトは何ビット？",
        options: ["8ビット", "4ビット", "16ビット", "32ビット"],
        correctIndex: 0,
        explanation: "1バイト（Byte）= 8ビット（bit）です。",
      },
      {
        text: "1KBは何バイト？（IEC規格）",
        options: ["1,024バイト", "1,000バイト", "10,000バイト", "100バイト"],
        correctIndex: 0,
        explanation: "IEC規格では1KB（キビバイト）= 1,024バイト = 2¹⁰バイトです。",
      },
      {
        text: "データを小さい順に並べる操作を何という？",
        options: ["昇順ソート", "降順ソート", "マージ", "サーチ"],
        correctIndex: 0,
        explanation: "昇順ソート（Ascending Sort）はデータを小さい順（A→Z、1→9）に並べます。",
      },
      {
        text: "線形探索の計算量（オーダー）は？",
        options: ["O(n)", "O(1)", "O(log n)", "O(n²)"],
        correctIndex: 0,
        explanation: "線形探索は最悪の場合、全要素を調べるためO(n)です。",
      },
      {
        text: "2分探索の計算量（オーダー）は？",
        options: ["O(log n)", "O(n)", "O(1)", "O(n²)"],
        correctIndex: 0,
        explanation: "2分探索は毎回探索範囲を半分にするためO(log n)です。",
      },
      {
        text: "スタックの特徴を表す用語は？",
        options: ["LIFO（後入れ先出し）", "FIFO（先入れ先出し）", "FILO（先入れ後出し）", "LOFI（後入れ先入れ）"],
        correctIndex: 0,
        explanation: "スタックはLIFO（Last In First Out：後入れ先出し）の構造です。",
      },
      {
        text: "キューの特徴を表す用語は？",
        options: ["FIFO（先入れ先出し）", "LIFO（後入れ先出し）", "FILO（先入れ後出し）", "LOFI（後入れ先入れ）"],
        correctIndex: 0,
        explanation: "キューはFIFO（First In First Out：先入れ先出し）の構造です。",
      },
      {
        text: "クイックソートの平均計算量は？",
        options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"],
        correctIndex: 0,
        explanation: "クイックソートの平均計算量はO(n log n)です。最悪はO(n²)。",
      },
    ],
  },
  // テクノロジ系 - コンピュータシステム
  {
    title: "基本情報技術者試験【コンピュータシステム】",
    description: "基本情報技術者試験のコンピュータシステム分野（CPU、メモリ、入出力装置など）の一問一答です。",
    categorySlug: "certification",
    questions: [
      {
        text: "CPUの主な3つの機能のうち、計算を行う部分は？",
        options: ["ALU（演算装置）", "制御装置", "レジスタ", "キャッシュ"],
        correctIndex: 0,
        explanation: "ALU（Arithmetic Logic Unit）は算術演算や論理演算を行う装置です。",
      },
      {
        text: "プログラムの命令を解読して実行を制御するCPU内の装置は？",
        options: ["制御装置", "演算装置", "レジスタ", "バス"],
        correctIndex: 0,
        explanation: "制御装置は命令のフェッチ、デコード、実行の制御を行います。",
      },
      {
        text: "CPUとメモリの速度差を埋める高速な記憶装置は？",
        options: ["キャッシュメモリ", "仮想メモリ", "補助記憶装置", "レジスタ"],
        correctIndex: 0,
        explanation: "キャッシュメモリはCPUとメインメモリの間に配置され、高速アクセスを実現します。",
      },
      {
        text: "電源を切ると内容が消えてしまうメモリは？",
        options: ["RAM", "ROM", "SSD", "フラッシュメモリ"],
        correctIndex: 0,
        explanation: "RAM（Random Access Memory）は揮発性メモリで、電源を切ると内容が消えます。",
      },
      {
        text: "電源を切っても内容が保持される読み出し専用メモリは？",
        options: ["ROM", "RAM", "DRAM", "SRAM"],
        correctIndex: 0,
        explanation: "ROM（Read Only Memory）は不揮発性で、電源を切っても内容が保持されます。",
      },
      {
        text: "CPUのクロック周波数の単位は？",
        options: ["Hz（ヘルツ）", "bps", "dpi", "rpm"],
        correctIndex: 0,
        explanation: "クロック周波数はHz（ヘルツ）で表します。現代のCPUはGHz単位です。",
      },
      {
        text: "複数のCPUコアを持つプロセッサを何という？",
        options: ["マルチコアプロセッサ", "シングルコアプロセッサ", "RISC", "CISC"],
        correctIndex: 0,
        explanation: "マルチコアプロセッサは1つのCPUパッケージに複数のコアを搭載しています。",
      },
      {
        text: "ハードディスクの読み書きを行う部品は？",
        options: ["磁気ヘッド", "プラッタ", "スピンドル", "アクチュエータ"],
        correctIndex: 0,
        explanation: "磁気ヘッドがプラッタ（ディスク）表面のデータを読み書きします。",
      },
      {
        text: "SSDの記憶方式は？",
        options: ["フラッシュメモリ", "磁気ディスク", "光ディスク", "磁気テープ"],
        correctIndex: 0,
        explanation: "SSD（Solid State Drive）はフラッシュメモリを使用した記憶装置です。",
      },
      {
        text: "OSがメモリ不足時にハードディスクの一部をメモリとして使う機能は？",
        options: ["仮想メモリ", "キャッシュ", "バッファ", "スワップ"],
        correctIndex: 0,
        explanation: "仮想メモリは物理メモリが不足した際に補助記憶装置を活用する技術です。",
      },
      {
        text: "RAID0の特徴は？",
        options: ["ストライピング（高速化）", "ミラーリング（冗長化）", "パリティ", "ホットスペア"],
        correctIndex: 0,
        explanation: "RAID0はストライピングでデータを分散し、読み書きを高速化します（冗長性なし）。",
      },
      {
        text: "RAID1の特徴は？",
        options: ["ミラーリング（冗長化）", "ストライピング（高速化）", "パリティ", "ホットスペア"],
        correctIndex: 0,
        explanation: "RAID1はミラーリングで同じデータを2台のディスクに書き込み、冗長性を確保します。",
      },
      {
        text: "GPUが得意とする処理は？",
        options: ["並列処理・グラフィックス処理", "逐次処理", "文字列処理", "ファイル処理"],
        correctIndex: 0,
        explanation: "GPU（Graphics Processing Unit）は大量の並列処理やグラフィックス処理が得意です。",
      },
      {
        text: "USBの正式名称は？",
        options: ["Universal Serial Bus", "Ultra Speed Bus", "Unified System Bus", "Universal System Board"],
        correctIndex: 0,
        explanation: "USBはUniversal Serial Busの略で、汎用的なシリアルバス規格です。",
      },
      {
        text: "OSの役割として正しいものは？",
        options: ["ハードウェアとソフトウェアの仲介", "文書作成", "ウイルス検出", "データ暗号化"],
        correctIndex: 0,
        explanation: "OSはハードウェアを抽象化し、アプリケーションに統一的なインターフェースを提供します。",
      },
    ],
  },
  // テクノロジ系 - ネットワーク
  {
    title: "基本情報技術者試験【ネットワーク】",
    description: "基本情報技術者試験のネットワーク分野（TCP/IP、プロトコル、セキュリティなど）の一問一答です。",
    categorySlug: "certification",
    questions: [
      {
        text: "IPアドレスを人間が覚えやすい名前に変換するシステムは？",
        options: ["DNS", "DHCP", "NAT", "ARP"],
        correctIndex: 0,
        explanation: "DNS（Domain Name System）はドメイン名とIPアドレスを相互変換します。",
      },
      {
        text: "IPアドレスを自動的に割り当てるプロトコルは？",
        options: ["DHCP", "DNS", "HTTP", "FTP"],
        correctIndex: 0,
        explanation: "DHCP（Dynamic Host Configuration Protocol）はIPアドレスを自動割当します。",
      },
      {
        text: "Webページを閲覧するためのプロトコルは？",
        options: ["HTTP", "FTP", "SMTP", "POP3"],
        correctIndex: 0,
        explanation: "HTTP（HyperText Transfer Protocol）はWebページの転送に使われます。",
      },
      {
        text: "暗号化されたHTTP通信は何という？",
        options: ["HTTPS", "HTTP/2", "HTTP/3", "SHTTP"],
        correctIndex: 0,
        explanation: "HTTPS（HTTP over SSL/TLS）はSSL/TLSで暗号化されたHTTP通信です。",
      },
      {
        text: "メールを送信するためのプロトコルは？",
        options: ["SMTP", "POP3", "IMAP", "HTTP"],
        correctIndex: 0,
        explanation: "SMTP（Simple Mail Transfer Protocol）はメール送信に使用されます。",
      },
      {
        text: "メールをサーバから受信するプロトコルで、サーバにメールを残す設定ができるのは？",
        options: ["IMAP", "POP3", "SMTP", "MIME"],
        correctIndex: 0,
        explanation: "IMAP（Internet Message Access Protocol）はサーバ上でメールを管理できます。",
      },
      {
        text: "OSI参照モデルは何層？",
        options: ["7層", "4層", "5層", "6層"],
        correctIndex: 0,
        explanation: "OSI参照モデルは物理層〜アプリケーション層の7層で構成されています。",
      },
      {
        text: "TCP/IPモデルは何層？",
        options: ["4層", "7層", "5層", "3層"],
        correctIndex: 0,
        explanation: "TCP/IPモデルはネットワークインターフェース、インターネット、トランスポート、アプリケーションの4層です。",
      },
      {
        text: "信頼性のある通信を提供するトランスポート層プロトコルは？",
        options: ["TCP", "UDP", "IP", "ICMP"],
        correctIndex: 0,
        explanation: "TCP（Transmission Control Protocol）はコネクション型で信頼性のある通信を提供します。",
      },
      {
        text: "高速だが信頼性を保証しないトランスポート層プロトコルは？",
        options: ["UDP", "TCP", "IP", "HTTP"],
        correctIndex: 0,
        explanation: "UDP（User Datagram Protocol）は軽量で高速ですが、到達保証はありません。",
      },
      {
        text: "IPv4アドレスは何ビット？",
        options: ["32ビット", "64ビット", "128ビット", "48ビット"],
        correctIndex: 0,
        explanation: "IPv4アドレスは32ビット（4バイト）で、約43億個のアドレスを表現できます。",
      },
      {
        text: "IPv6アドレスは何ビット？",
        options: ["128ビット", "64ビット", "32ビット", "256ビット"],
        correctIndex: 0,
        explanation: "IPv6アドレスは128ビットで、IPv4のアドレス枯渇問題を解決します。",
      },
      {
        text: "プライベートIPアドレスの範囲として正しいものは？",
        options: ["192.168.0.0 〜 192.168.255.255", "8.8.8.0 〜 8.8.8.255", "1.1.1.0 〜 1.1.1.255", "200.0.0.0 〜 200.255.255.255"],
        correctIndex: 0,
        explanation: "192.168.0.0/16はクラスCのプライベートIPアドレス範囲です。",
      },
      {
        text: "ネットワーク機器のMACアドレスは何ビット？",
        options: ["48ビット", "32ビット", "64ビット", "128ビット"],
        correctIndex: 0,
        explanation: "MACアドレスは48ビット（6バイト）で、ネットワーク機器を一意に識別します。",
      },
      {
        text: "複数のネットワークを接続し、最適経路でパケットを転送する機器は？",
        options: ["ルータ", "スイッチ", "ハブ", "リピータ"],
        correctIndex: 0,
        explanation: "ルータはネットワーク層で動作し、IPアドレスを基に経路制御を行います。",
      },
    ],
  },
  // テクノロジ系 - セキュリティ
  {
    title: "基本情報技術者試験【セキュリティ】",
    description: "基本情報技術者試験のセキュリティ分野（暗号化、認証、攻撃手法など）の一問一答です。",
    categorySlug: "certification",
    questions: [
      {
        text: "暗号化と復号に同じ鍵を使う方式は？",
        options: ["共通鍵暗号方式", "公開鍵暗号方式", "ハイブリッド暗号方式", "ハッシュ関数"],
        correctIndex: 0,
        explanation: "共通鍵暗号方式（対称鍵暗号）は暗号化と復号に同じ鍵を使用します。",
      },
      {
        text: "暗号化と復号に異なる鍵（公開鍵と秘密鍵）を使う方式は？",
        options: ["公開鍵暗号方式", "共通鍵暗号方式", "ストリーム暗号", "ブロック暗号"],
        correctIndex: 0,
        explanation: "公開鍵暗号方式（非対称鍵暗号）は公開鍵で暗号化、秘密鍵で復号します。",
      },
      {
        text: "代表的な共通鍵暗号アルゴリズムは？",
        options: ["AES", "RSA", "DSA", "ECC"],
        correctIndex: 0,
        explanation: "AES（Advanced Encryption Standard）は現在最も広く使われる共通鍵暗号です。",
      },
      {
        text: "代表的な公開鍵暗号アルゴリズムは？",
        options: ["RSA", "AES", "DES", "Blowfish"],
        correctIndex: 0,
        explanation: "RSAは素因数分解の困難性を利用した公開鍵暗号アルゴリズムです。",
      },
      {
        text: "データから固定長の値（ダイジェスト）を生成する一方向関数は？",
        options: ["ハッシュ関数", "暗号化関数", "復号関数", "乱数生成関数"],
        correctIndex: 0,
        explanation: "ハッシュ関数は入力データから固定長のハッシュ値を生成し、元データの復元はできません。",
      },
      {
        text: "デジタル署名で保証されるものは？",
        options: ["送信者の認証と改ざん検知", "機密性", "可用性", "匿名性"],
        correctIndex: 0,
        explanation: "デジタル署名は送信者の認証（なりすまし防止）と改ざん検知を実現します。",
      },
      {
        text: "偽のWebサイトに誘導してID・パスワードを盗む攻撃は？",
        options: ["フィッシング", "DoS攻撃", "SQLインジェクション", "XSS"],
        correctIndex: 0,
        explanation: "フィッシングは正規サイトを装った偽サイトで認証情報を詐取する攻撃です。",
      },
      {
        text: "大量のリクエストでサーバをダウンさせる攻撃は？",
        options: ["DoS攻撃", "フィッシング", "マルウェア", "ソーシャルエンジニアリング"],
        correctIndex: 0,
        explanation: "DoS（Denial of Service）攻撃はサービス妨害を目的とした攻撃です。",
      },
      {
        text: "Webアプリケーションの入力欄からデータベースを不正操作する攻撃は？",
        options: ["SQLインジェクション", "XSS", "CSRF", "DoS攻撃"],
        correctIndex: 0,
        explanation: "SQLインジェクションは入力値に悪意あるSQLを挿入してDBを操作する攻撃です。",
      },
      {
        text: "悪意のあるスクリプトをWebページに埋め込む攻撃は？",
        options: ["XSS（クロスサイトスクリプティング）", "SQLインジェクション", "CSRF", "DoS攻撃"],
        correctIndex: 0,
        explanation: "XSSはWebページに悪意あるスクリプトを埋め込み、閲覧者のブラウザで実行させる攻撃です。",
      },
      {
        text: "ファイアウォールの主な機能は？",
        options: ["不正アクセスの遮断", "ウイルス検出", "データ暗号化", "バックアップ"],
        correctIndex: 0,
        explanation: "ファイアウォールは通信を監視し、不正なアクセスを遮断するセキュリティ機器です。",
      },
      {
        text: "認証の3要素のうち「知識」に該当するものは？",
        options: ["パスワード", "指紋", "ICカード", "顔認証"],
        correctIndex: 0,
        explanation: "認証の3要素は「知識（パスワード等）」「所有（ICカード等）」「生体（指紋等）」です。",
      },
      {
        text: "2つ以上の異なる認証要素を組み合わせる認証は？",
        options: ["多要素認証", "シングルサインオン", "ワンタイムパスワード", "生体認証"],
        correctIndex: 0,
        explanation: "多要素認証（MFA）は複数の認証要素を組み合わせてセキュリティを強化します。",
      },
      {
        text: "電子証明書を発行する機関は？",
        options: ["認証局（CA）", "ISP", "DNS", "DHCP"],
        correctIndex: 0,
        explanation: "認証局（Certificate Authority）は公開鍵の正当性を証明する電子証明書を発行します。",
      },
      {
        text: "情報セキュリティの3要素（CIA）に含まれないものは？",
        options: ["可逆性", "機密性", "完全性", "可用性"],
        correctIndex: 0,
        explanation: "CIAは機密性（Confidentiality）、完全性（Integrity）、可用性（Availability）です。",
      },
    ],
  },
  // マネジメント系 - プロジェクトマネジメント
  {
    title: "基本情報技術者試験【マネジメント】",
    description: "基本情報技術者試験のマネジメント分野（プロジェクト管理、品質管理など）の一問一答です。",
    categorySlug: "certification",
    questions: [
      {
        text: "プロジェクトの作業を階層的に分解した図は？",
        options: ["WBS", "ガントチャート", "PERT図", "フローチャート"],
        correctIndex: 0,
        explanation: "WBS（Work Breakdown Structure）は作業を階層的に分解して管理する手法です。",
      },
      {
        text: "作業の開始日・終了日を横棒で表示するスケジュール表は？",
        options: ["ガントチャート", "WBS", "PERT図", "DFD"],
        correctIndex: 0,
        explanation: "ガントチャートは横軸に時間、縦軸に作業を取り、進捗を視覚化します。",
      },
      {
        text: "作業間の依存関係と所要時間からクリティカルパスを求める手法は？",
        options: ["PERT", "WBS", "ガントチャート", "EVM"],
        correctIndex: 0,
        explanation: "PERT（Program Evaluation and Review Technique）は作業の順序関係を分析します。",
      },
      {
        text: "プロジェクト全体の所要時間を決定する最長経路は？",
        options: ["クリティカルパス", "フロート", "マイルストーン", "イテレーション"],
        correctIndex: 0,
        explanation: "クリティカルパスは余裕時間がゼロの経路で、プロジェクト期間を決定します。",
      },
      {
        text: "品質管理で使われる「特性要因図」の別名は？",
        options: ["フィッシュボーンチャート（魚の骨図）", "パレート図", "管理図", "散布図"],
        correctIndex: 0,
        explanation: "特性要因図は結果と原因の関係を魚の骨状に図示したものです。",
      },
      {
        text: "不具合の原因を重要度順に並べ、累積比率を示すグラフは？",
        options: ["パレート図", "ヒストグラム", "散布図", "管理図"],
        correctIndex: 0,
        explanation: "パレート図は問題を重要度順に並べ、重点的に対処すべき項目を特定します。",
      },
      {
        text: "ソフトウェア開発の工程を順番に進める開発モデルは？",
        options: ["ウォーターフォールモデル", "アジャイル", "スクラム", "プロトタイピング"],
        correctIndex: 0,
        explanation: "ウォーターフォールモデルは要件定義→設計→実装→テストを順次進めます。",
      },
      {
        text: "短い反復期間で開発を繰り返す手法の総称は？",
        options: ["アジャイル開発", "ウォーターフォール", "V字モデル", "RAD"],
        correctIndex: 0,
        explanation: "アジャイル開発は変化に適応しながら短いサイクルで開発を繰り返します。",
      },
      {
        text: "アジャイル開発のフレームワークで、スプリントという期間を設けるのは？",
        options: ["スクラム", "XP", "かんばん", "リーン"],
        correctIndex: 0,
        explanation: "スクラムは1〜4週間のスプリントで開発を進めるアジャイルフレームワークです。",
      },
      {
        text: "開発→テスト→リリースを自動化する手法は？",
        options: ["CI/CD", "DevOps", "ITIL", "CMMI"],
        correctIndex: 0,
        explanation: "CI/CD（継続的インテグレーション/継続的デリバリー）は自動化によりリリースを効率化します。",
      },
      {
        text: "ソフトウェアの欠陥を発見するためのテストは？",
        options: ["デバッグテスト・バグテスト", "負荷テスト", "回帰テスト", "受入テスト"],
        correctIndex: 0,
        explanation: "テストの主目的はソフトウェアのバグ（欠陥）を発見することです。",
      },
      {
        text: "システムが要件通りに動作するか確認するテストは？",
        options: ["受入テスト", "単体テスト", "結合テスト", "負荷テスト"],
        correctIndex: 0,
        explanation: "受入テスト（UAT）はユーザー観点で要件を満たすか検証します。",
      },
      {
        text: "プログラムの内部構造を意識せずに行うテストは？",
        options: ["ブラックボックステスト", "ホワイトボックステスト", "グレーボックステスト", "単体テスト"],
        correctIndex: 0,
        explanation: "ブラックボックステストは入力と出力のみに着目してテストします。",
      },
      {
        text: "プログラムの内部構造を意識して行うテストは？",
        options: ["ホワイトボックステスト", "ブラックボックステスト", "システムテスト", "負荷テスト"],
        correctIndex: 0,
        explanation: "ホワイトボックステストはプログラムの内部ロジックを検証します。",
      },
      {
        text: "変更による既存機能への影響を確認するテストは？",
        options: ["回帰テスト（リグレッションテスト）", "単体テスト", "結合テスト", "性能テスト"],
        correctIndex: 0,
        explanation: "回帰テストは変更が既存機能に悪影響を与えていないか確認します。",
      },
    ],
  },
  // ストラテジ系 - 経営・法務
  {
    title: "基本情報技術者試験【ストラテジ】",
    description: "基本情報技術者試験のストラテジ分野（経営戦略、法務、会計など）の一問一答です。",
    categorySlug: "certification",
    questions: [
      {
        text: "自社の強み・弱み、機会・脅威を分析するフレームワークは？",
        options: ["SWOT分析", "PEST分析", "バリューチェーン", "PPM"],
        correctIndex: 0,
        explanation: "SWOTは Strengths, Weaknesses, Opportunities, Threats の頭文字です。",
      },
      {
        text: "市場成長率と市場シェアでビジネスを分類するフレームワークは？",
        options: ["PPM（プロダクト・ポートフォリオ・マネジメント）", "SWOT分析", "バリューチェーン", "ファイブフォース"],
        correctIndex: 0,
        explanation: "PPMは事業を「花形」「金のなる木」「問題児」「負け犬」に分類します。",
      },
      {
        text: "業界の競争状態を5つの力で分析するフレームワークは？",
        options: ["ファイブフォース分析", "SWOT分析", "PPM", "バリューチェーン"],
        correctIndex: 0,
        explanation: "ポーターのファイブフォース分析は業界の競争環境を分析します。",
      },
      {
        text: "著作権の保護期間（日本）は原則として著作者の死後何年？",
        options: ["70年", "50年", "100年", "20年"],
        correctIndex: 0,
        explanation: "日本の著作権保護期間は2018年の法改正で死後70年に延長されました。",
      },
      {
        text: "発明を保護する知的財産権は？",
        options: ["特許権", "著作権", "商標権", "意匠権"],
        correctIndex: 0,
        explanation: "特許権は発明（技術的なアイデア）を保護する産業財産権です。",
      },
      {
        text: "商品やサービスのマーク・名称を保護する権利は？",
        options: ["商標権", "特許権", "著作権", "実用新案権"],
        correctIndex: 0,
        explanation: "商標権はブランド名やロゴなどの識別標識を保護します。",
      },
      {
        text: "個人情報保護法で、個人情報取扱事業者に義務付けられていないものは？",
        options: ["すべての個人情報の公開", "利用目的の特定", "安全管理措置", "第三者提供の制限"],
        correctIndex: 0,
        explanation: "個人情報保護法は個人情報の適正な取扱いを求めており、公開義務はありません。",
      },
      {
        text: "ソフトウェアの不正コピーを禁止する法律は？",
        options: ["著作権法", "特許法", "商標法", "不正競争防止法"],
        correctIndex: 0,
        explanation: "ソフトウェアは著作物として著作権法で保護されます。",
      },
      {
        text: "売上高から変動費を引いたものは？",
        options: ["限界利益（貢献利益）", "営業利益", "経常利益", "純利益"],
        correctIndex: 0,
        explanation: "限界利益 = 売上高 − 変動費 で、固定費回収に貢献する利益です。",
      },
      {
        text: "固定費を限界利益率で割った値は？",
        options: ["損益分岐点売上高", "目標利益", "変動費率", "安全余裕率"],
        correctIndex: 0,
        explanation: "損益分岐点売上高 = 固定費 ÷ 限界利益率 で、利益ゼロとなる売上高です。",
      },
      {
        text: "BtoB の意味は？",
        options: ["企業間取引", "企業と消費者間取引", "消費者間取引", "政府と企業間取引"],
        correctIndex: 0,
        explanation: "BtoB（Business to Business）は企業間の取引を指します。",
      },
      {
        text: "ERPの正式名称は？",
        options: ["Enterprise Resource Planning", "Enterprise Requirement Planning", "Extended Resource Planning", "Efficient Resource Processing"],
        correctIndex: 0,
        explanation: "ERPは企業全体の経営資源を統合的に管理するシステムです。",
      },
      {
        text: "顧客との関係を管理するシステムは？",
        options: ["CRM", "ERP", "SCM", "SFA"],
        correctIndex: 0,
        explanation: "CRM（Customer Relationship Management）は顧客情報を一元管理します。",
      },
      {
        text: "サプライチェーン（供給連鎖）を最適化するシステムは？",
        options: ["SCM", "CRM", "ERP", "BPR"],
        correctIndex: 0,
        explanation: "SCM（Supply Chain Management）は調達から販売までの流れを最適化します。",
      },
      {
        text: "クラウドサービスで、インフラのみを提供するモデルは？",
        options: ["IaaS", "PaaS", "SaaS", "DaaS"],
        correctIndex: 0,
        explanation: "IaaS（Infrastructure as a Service）は仮想サーバやネットワークを提供します。",
      },
    ],
  },
];

async function main() {
  console.log("Starting FE (基本情報技術者試験) quiz seeding...");

  // 管理者ユーザーを取得または作成
  const adminEmail = process.env.ADMIN_EMAILS?.split(",")[0]?.trim();
  if (!adminEmail) {
    console.error("ADMIN_EMAILS not set in environment");
    process.exit(1);
  }

  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    console.log("Creating admin user...");
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
      },
    });
  }

  console.log(`Using admin user: ${adminUser.email}`);

  for (const quizData of feQuizzes) {
    console.log(`Creating quiz: ${quizData.title}`);

    // カテゴリを取得
    const category = await prisma.category.findUnique({
      where: { slug: quizData.categorySlug },
    });

    if (!category) {
      console.error(`Category not found: ${quizData.categorySlug}`);
      continue;
    }

    // 既存のクイズをチェック
    const existingQuiz = await prisma.quiz.findFirst({
      where: {
        title: quizData.title,
        authorId: adminUser.id,
      },
    });

    if (existingQuiz) {
      console.log(`Quiz already exists: ${quizData.title}, skipping...`);
      continue;
    }

    // クイズを作成
    const quiz = await prisma.quiz.create({
      data: {
        title: quizData.title,
        description: quizData.description,
        authorId: adminUser.id,
        categoryId: category.id,
        isPublic: true,
        questions: {
          create: quizData.questions.map((q, index) => ({
            content: q.text,
            options: q.options,
            correctIndex: q.correctIndex,
            correctIndices: [q.correctIndex],
            isMultipleChoice: false,
            explanation: q.explanation,
            order: index + 1,
          })),
        },
      },
    });

    // ユーザーのquizzesCreatedを更新
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        quizzesCreated: {
          increment: 1,
        },
      },
    });

    console.log(`Created quiz: ${quiz.title} with ${quizData.questions.length} questions`);
  }

  console.log("FE quiz seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
