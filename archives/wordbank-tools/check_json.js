const data = require('./dist/data/二年级上册.json');
console.log('Count:', data.count);
console.log('First 5 words:');
data.wordBank.slice(0, 5).forEach(w => console.log({ word: w.word, lessonName: w.lessonName }));
console.log('Last 5 words:');
data.wordBank.slice(-5).forEach(w => console.log({ word: w.word, lessonName: w.lessonName }));
