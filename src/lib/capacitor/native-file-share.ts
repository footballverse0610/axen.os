import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

/**
 * サーバーがContent-Dispositionでダウンロードさせようとしているレスポンスを、
 * Androidネイティブアプリ内では「端末のキャッシュ領域に保存→OS標準の共有シートを
 * 開く」方式に置き換える。
 *
 * Android WebViewは既定でファイルダウンロードを処理する仕組み
 * (WebView.setDownloadListener等)を持たず、Capacitorもこれを自動では
 * 補ってくれないため、通常の<a href>によるダウンロードはネイティブアプリ内では
 * 機能しない。Capacitor公式のFilesystem/Shareプラグインを使い、取得した
 * ファイルをDirectory.Cache配下に書き出してから共有シート経由で保存・共有
 * させる(AndroidManifestに既存のFileProvider設定をそのまま利用できる)。
 *
 * Capacitor.isNativePlatform()がfalseの場合(Web版、iPhone Safariでの
 * テストを含む)は何もせず、呼び出し元が通常の<a href>ナビゲーションに
 * 任せられるようにする。
 */
export async function shareDownloadNatively(url: string): Promise<{ error: string | null }> {
  if (!Capacitor.isNativePlatform()) {
    return { error: null };
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return { error: "ダウンロードに失敗しました。時間をおいて再度お試しください。" };
    }

    const disposition = res.headers.get("Content-Disposition") ?? "";
    const filenameMatch = disposition.match(/filename="([^"]+)"/);
    const filename = filenameMatch?.[1] ?? "download.csv";

    // サーバー側はUTF-8(BOM付き)の文字列としてCSVを返すため、そのまま
    // テキストとして書き出す(charset変換等は行わない = 内容は一切変更しない)。
    const text = await res.text();

    await Filesystem.writeFile({
      path: filename,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });

    const { uri } = await Filesystem.getUri({
      path: filename,
      directory: Directory.Cache,
    });

    await Share.share({
      title: filename,
      url: uri,
    });

    return { error: null };
  } catch (err) {
    console.error("shareDownloadNatively failed", err);
    return { error: "ダウンロードに失敗しました。時間をおいて再度お試しください。" };
  }
}
