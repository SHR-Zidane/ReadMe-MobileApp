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
  if (Platform.OS !== "android" || !uri.startsWith("content://")) {
    return { uri, name: fileName, mimeType };
  }

  const extension = fileName.split(".").pop() || "epub";
  const destName = `upload_${Date.now()}.${extension}`;

  const source = new File(uri);
  const dest = new File(Paths.cache, destName);

  source.copy(dest);

  return { uri: dest.uri, name: fileName, mimeType };
}
