/**
 * fileHelper.ts
 *
 * Résolution des URIs Android pour les uploads de fichiers.
 *
 * Sur Android, DocumentPicker peut renvoyer deux types d'URIs :
 *  - file:///...    → accessible directement (cas normal avec copyToCacheDirectory: true)
 *  - content://...  → URI opaque du Content Provider Android (cas rare)
 *
 * expo-file-system 19 (SDK 54) n'expose PLUS l'ancienne API (copyAsync, cacheDirectory…).
 * Ces méthodes existent encore dans les types mais LÈVENT UNE EXCEPTION à l'exécution.
 * On utilise exclusivement la nouvelle API : File et Paths.
 *
 * Note : File.copy() est SYNCHRONE (retourne File, pas Promise).
 * Le await est inutile mais inoffensif ; on l'omet ici pour plus de clarté.
 */

import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";

export interface ResolvedFile {
  uri: string;
  name: string;
  mimeType: string;
}

export async function resolveAndroidContentUri(
  uri: string,
  fileName: string,
  mimeType: string,
): Promise<ResolvedFile> {
  // iOS ou URI déjà en file:// : rien à faire.
  // Avec copyToCacheDirectory: true dans DocumentPicker, c'est toujours ce cas.
  if (Platform.OS !== "android" || !uri.startsWith("content://")) {
    return { uri, name: fileName, mimeType };
  }

  // Sécurité : content:// → on copie physiquement le fichier dans le cache,
  // puis on retourne son URI file:// accessible par XHR / FormData.
  const extension = fileName.split(".").pop() || "epub";
  const destName = `upload_${Date.now()}.${extension}`;

  const source = new File(uri);
  const dest = new File(Paths.cache, destName);

  // copy() est synchrone : copie le fichier et retourne le File destination.
  source.copy(dest);

  console.log(`[fileHelper] content:// copié → ${dest.uri}`);

  return { uri: dest.uri, name: fileName, mimeType };
}
