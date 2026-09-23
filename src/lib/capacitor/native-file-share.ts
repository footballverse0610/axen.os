import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

/**
 * @capacitor/share(8.0.2)のAndroid実装(SharePlugin.java)は、共有シートを
 * ユーザーがキャンセルした場合にcall.reject("Share canceled")でPromiseを
 * 拒否する(=正常な操作であってもJS側は例外として受け取る)。この文字列は
 * @capacitor/share自体のソースにハードコードされた値で、当ファイルからは
 * 変更できない・変更しない前提のため、Share.share()の失敗のみをこの文字列で
 * 判定し、「キャンセル」と「実際のエラー」を区別する。
 */
const SHARE_CANCELED_MESSAGE = "Share canceled";

function isShareCanceled(err: unknown): boolean {
  return err instanceof Error && err.message === SHARE_CANCELED_MESSAGE;
}

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

    try {
      await Share.share({
        title: filename,
        url: uri,
      });
    } catch (shareErr) {
      // ユーザーが共有シートを閉じた/キャンセルしただけなら、ダウンロード
      // (Filesystemへの書き込み)自体は成功しているため、失敗として
      // 扱わない。それ以外の共有時エラーは通常通り外側のcatchへ渡す。
      if (isShareCanceled(shareErr)) {
        return { error: null };
      }
      throw shareErr;
    }

    return { error: null };
  } catch (err) {
    console.error("shareDownloadNatively failed", err);
    return { error: "ダウンロードに失敗しました。時間をおいて再度お試しください。" };
  }
}
