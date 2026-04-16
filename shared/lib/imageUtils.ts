import { documentDirectory, getInfoAsync, makeDirectoryAsync, copyAsync, deleteAsync } from 'expo-file-system/legacy';

const IMAGES_DIR = `${documentDirectory}product_images/`;

/**
 * Copia uma imagem do URI temporário para o diretório permanente do app
 * @param sourceUri URI temporário da imagem (ex: file://... ou ph://...)
 * @param productId ID do produto para nomeação do arquivo
 * @returns URI permanente da imagem salva
 */
export async function persistImage(sourceUri: string, productId: string): Promise<string> {
  try {
    // Criar diretório se não existir
    const dirInfo = await getInfoAsync(IMAGES_DIR);
    if (!dirInfo.exists) {
      await makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const fileName = `${productId}_${timestamp}.jpg`;
    const destinationUri = `${IMAGES_DIR}${fileName}`;

    // Copiar arquivo para diretório permanente
    await copyAsync({
      from: sourceUri,
      to: destinationUri,
    });

    return destinationUri;
  } catch (error) {
    console.error('Erro ao persistir imagem:', error);
    // Se falhar, retornar o URI original (fallback)
    return sourceUri;
  }
}

/**
 * Remove uma imagem salva do diretório permanente
 * @param imageUri URI da imagem a ser removida
 */
export async function deleteImage(imageUri: string): Promise<void> {
  try {
    // Só deletar se for um arquivo no diretório de imagens do app
    if (imageUri && imageUri.startsWith(IMAGES_DIR)) {
      const fileInfo = await getInfoAsync(imageUri);
      if (fileInfo.exists) {
        await deleteAsync(imageUri);
      }
    }
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
  }
}

/**
 * Valida se um URI de imagem ainda é acessível
 * @param imageUri URI da imagem
 */
export async function validateImageUri(imageUri: string): Promise<boolean> {
  try {
    if (!imageUri) return false;
    const fileInfo = await getInfoAsync(imageUri);
    return fileInfo.exists;
  } catch (error) {
    return false;
  }
}
