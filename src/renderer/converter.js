import languages from './assets/data/languages';

const converter = {
  languageToExtension(language) {
    if (languages.filter(l => l.name === language).length > 0) {
      return languages.filter(l => l.name === language)[0].extension;
    }
    return 'txt';
  },
  extensionToLanguage(extension) {
    if (languages.filter(l => l.extension === extension).length > 0) {
      return languages.filter(l => l.extension === extension)[0].name;
    }
    return 'text';
  },
  gistToNote(gist) {
    const files = [];

    Object.keys(gist.files).forEach(key => {
      files.push({
        name: key.split('.')[0],
        language: this.extensionToLanguage(key.split('.')[1]),
        content: gist.files[key].content
      });
    });

    return {
      name: 'Gist',
      description: gist.description,
      files
    };
  }
};

export default converter;
