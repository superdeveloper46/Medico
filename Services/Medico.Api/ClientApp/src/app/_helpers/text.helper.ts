export class TextHelper {

    static removeDoubleSpaces = (text: string): string => {
      return text.trim().replace(/\&nbsp;/g, "").replace(/<p><\/p>/g, '');
    }

    static applyFormatting = (text: string): string => {

        let cleanedText = text.replace(/[\u200B-\u200D\uFEFF]/g, '');

        let cleanedContent = cleanedText.replace(/^((<p[^>]*>(&nbsp;|\s)*<\/p>(\s*))+)|((\s*)((<p[^>]*>(&nbsp;|\s)*<\/p>)(\s*))+)$/g, '');
        cleanedContent = cleanedContent.replace(/\s+(?=[.,;:!?])/g, '');
        return cleanedContent;
    }
    static findDuplicateWords = (text: string): string[] => {
        const plainText = text.replace(/<[^>]+>/g, " ");
        const removedSpaces =plainText.replace(/&nbsp;\n/g, " ");
        const removedSigns=removedSpaces.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ");
        const removedNewLine=removedSigns.replace(/↵/g, " ");
        const words: string[] = removedNewLine.split(" ");
        let frequencies: Record<string, string[]> = {};
        const wordsCleansed = words.filter(word => word.length > 0);
      wordsCleansed.forEach((word) => {
          if (word.endsWith("s") || word.endsWith("S")) {
            const singularWord = word.slice(0, -1);
            if (frequencies[singularWord.toLowerCase()]) {
              frequencies[singularWord.toLowerCase()].push(word);
            }else {
              frequencies[singularWord.toLowerCase()] = [singularWord];
            }
          }else {
            if (frequencies[word.toLowerCase()]) {
              frequencies[word.toLowerCase()].push(word);
            }else {
              frequencies[word.toLowerCase()] = [word];
            }
          }
        });
        const duplicateWords: string[] = Object.keys(frequencies).filter((key) => frequencies[key].length > 1).map((key) => frequencies[key][frequencies[key].length - 1]);
        return duplicateWords;
      }
}



