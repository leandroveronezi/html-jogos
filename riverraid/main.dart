import 'dart:io';

import 'package:image/image.dart' as img;

// --- Definição das Cores e Emojis ---
// Usando Record para agrupar emoji e valor RGB
typedef EmojiColor = ({String emoji, int r, int g, int b});

// Paleta 1: Quadrados
final List<EmojiColor> emojiSquarePalette = [
  (emoji: '🟥', r: 255, g: 0, b: 0), // Vermelho
  (emoji: '🟧', r: 255, g: 165, b: 0), // Laranja
  (emoji: '🟨', r: 255, g: 255, b: 0), // Amarelo
  (emoji: '🟩', r: 0, g: 128, b: 0), // Verde
  (emoji: '🟦', r: 0, g: 0, b: 255), // Azul
  (emoji: '🟪', r: 128, g: 0, b: 128), // Roxo
  (emoji: '🟫', r: 165, g: 42, b: 42), // Marrom
  (emoji: '⬛', r: 0, g: 0, b: 0), // Preto
  (emoji: '⬜', r: 255, g: 255, b: 255), // Branco
];

// Paleta 2: Círculos
final List<EmojiColor> emojiCirclePalette = [
  (emoji: '🔴', r: 255, g: 0, b: 0), // Vermelho
  (emoji: '🟠', r: 255, g: 165, b: 0), // Laranja
  (emoji: '🟡', r: 255, g: 255, b: 0), // Amarelo
  (emoji: '🟢', r: 0, g: 128, b: 0), // Verde
  (emoji: '🔵', r: 0, g: 0, b: 255), // Azul
  (emoji: '🟣', r: 128, g: 0, b: 128), // Roxo
  (emoji: '🟤', r: 165, g: 42, b: 42), // Marrom
  (emoji: '⚫', r: 0, g: 0, b: 0), // Preto
  (emoji: '⚪', r: 255, g: 255, b: 255), // Branco
];

// Paleta 3: Corações
final List<EmojiColor> emojiHeartPalette = [
  (emoji: '❤️', r: 255, g: 0, b: 0), // Vermelho
  (emoji: '🧡', r: 255, g: 165, b: 0), // Laranja
  (emoji: '💛', r: 255, g: 255, b: 0), // Amarelo
  (emoji: '💚', r: 0, g: 128, b: 0), // Verde
  (emoji: '💙', r: 0, g: 0, b: 255), // Azul
  (emoji: '💜', r: 128, g: 0, b: 128), // Roxo
  (emoji: '🤎', r: 165, g: 42, b: 42), // Marrom
  (emoji: '🖤', r: 0, g: 0, b: 0), // Preto
  (emoji: '🤍', r: 255, g: 255, b: 255), // Branco
];

// Enum para representar a escolha da paleta
enum EmojiPaletteType {
  squares, // Paleta 1
  circles, // Paleta 2
  hearts // Paleta 3
}
// ------------------------------------

/// Calcula a distância Euclidiana ao quadrado entre duas cores RGB.
int _colorDistanceSquared(int r1, int g1, int b1, int r2, int g2, int b2) {
  final dr = r1 - r2;
  final dg = g1 - g2;
  final db = b1 - b2;
  return dr * dr + dg * dg + db * db;
}

/// Encontra o emoji da paleta fornecida cuja cor é mais próxima da cor do pixel.
/// [palette]: A lista de EmojiColor a ser usada para a busca.
String _getClosestEmoji(int r, int g, int b, List<EmojiColor> palette) {
  // Garante que a paleta não está vazia para evitar erros
  if (palette.isEmpty) {
    // Retorna um caractere padrão ou lança um erro se a paleta estiver vazia
    return '❓'; // Ou: throw ArgumentError('A paleta de emojis não pode estar vazia.');
  }

  int minDistance = -1; // Usar -1 para indicar que a primeira distância sempre será menor
  String closestEmoji = palette.first.emoji; // Começa com o primeiro emoji da paleta fornecida

  for (final colorEntry in palette) {
    final distance = _colorDistanceSquared(r, g, b, colorEntry.r, colorEntry.g, colorEntry.b);

    if (minDistance == -1 || distance < minDistance) {
      minDistance = distance;
      closestEmoji = colorEntry.emoji;
    }
  }
  return closestEmoji;
}

/// Lê uma imagem e a converte para uma representação textual usando emojis.
///
/// [filePath]: O caminho para o arquivo de imagem.
/// [paletteType]: O tipo de paleta de emoji a ser usada (squares, circles, hearts).
/// Retorna a string com emojis ou uma mensagem de erro.
Future<String> imageToEmojiText(String filePath, EmojiPaletteType paletteType) async {
  try {
    // 1. Ler o arquivo de imagem
    final file = File(filePath);
    if (!await file.exists()) {
      return "Erro: Arquivo não encontrado em '$filePath'";
    }
    final imageBytes = await file.readAsBytes();

    // 2. Decodificar a imagem
    final img.Image? image = img.decodeImage(imageBytes);
    if (image == null) {
      return "Erro: Não foi possível decodificar a imagem. Verifique o formato.";
    }

    // 3. Selecionar a paleta correta com base no parâmetro
    List<EmojiColor> selectedPalette;
    switch (paletteType) {
      case EmojiPaletteType.squares:
        selectedPalette = emojiSquarePalette;
        break;
      case EmojiPaletteType.circles:
        selectedPalette = emojiCirclePalette;
        break;
      case EmojiPaletteType.hearts:
        selectedPalette = emojiHeartPalette;
        break;
      // Não é necessário um 'default' aqui pois o enum cobre todos os casos,
      // mas em outros cenários poderia ser útil.
    }

    // Verificação adicional (boa prática)
    if (selectedPalette.isEmpty) {
      return "Erro: Paleta de emojis selecionada (${paletteType.name}) está vazia.";
    }

    // 4. Construir a string de emojis
    final buffer = StringBuffer();
    for (int y = 0; y < image.height; y++) {
      for (int x = 0; x < image.width; x++) {
        // Obter o pixel
        final pixel = image.getPixel(x, y);

        // Extrair componentes RGB (ignora o canal Alfa por simplicidade)
        final int r = pixel.r.toInt();
        final int g = pixel.g.toInt();
        final int b = pixel.b.toInt();

        // Encontrar o emoji mais próximo usando a paleta selecionada
        // e adicionar ao buffer
        final emoji = _getClosestEmoji(r, g, b, selectedPalette); // Passa a paleta escolhida
        buffer.write(emoji);
      }
      // Adicionar quebra de linha ao final de cada linha da imagem
      buffer.writeln();
    }

    return buffer.toString();
  } catch (e) {
    return "Erro inesperado ao processar a imagem: $e";
  }
}

// --- Função Principal ---
Future<void> main() async {
  // --- CONFIGURAÇÃO ---
  // Substitua pelo caminho da sua imagem
  final String imagePath = './4176.png';

  // Escolha a paleta desejada aqui:
  // EmojiPaletteType.squares  (Paleta 1: Quadrados 🟥)
  // EmojiPaletteType.circles  (Paleta 2: Círculos 🔴)
  // EmojiPaletteType.hearts   (Paleta 3: Corações ❤️)
  final EmojiPaletteType chosenPalette = EmojiPaletteType.circles; // <<< Mude aqui para escolher

  // Nome do arquivo de saída pode incluir a paleta usada (opcional)
  final String outputFileName = '4176_${chosenPalette.name}.txt';
  // --------------------

  print("Processando imagem: $imagePath usando paleta: ${chosenPalette.name}");

  // Chama a função passando o caminho e o tipo de paleta escolhido
  final String result = await imageToEmojiText(imagePath, chosenPalette);

  // Salva o resultado (seja a imagem em emoji ou uma mensagem de erro)
  try {
    var file = File(outputFileName);
    await file.writeAsString(result);
    print("Resultado salvo em '$outputFileName'");
  } catch (e) {
    print("Erro ao salvar o arquivo '$outputFileName': $e");
    // Se não conseguiu salvar, imprime o resultado no console (se for texto)
    if (!result.startsWith("Erro:")) {
      print("\n--- Resultado (não salvo em arquivo) ---");
      print(result);
      print("--------------------------------------");
    } else {
      print(result); // Imprime a mensagem de erro do processamento
    }
  }
}
