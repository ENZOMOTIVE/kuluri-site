// Share a generated file: native share sheet on Android (Capacitor), Web Share API in supporting browsers,
// otherwise a normal download.
import { Capacitor } from '@capacitor/core'

export async function sharePdf(doc, filename, title) {
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')
    const { Share } = await import('@capacitor/share')
    const base64 = doc.output('datauristring').split(',')[1]
    const { uri } = await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache })
    await Share.share({ title, files: [uri], dialogTitle: title })
    return 'shared'
  }
  const file = new File([doc.output('blob')], filename, { type: 'application/pdf' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title })
      return 'shared'
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled'
    }
  }
  doc.save(filename)
  return 'downloaded'
}
