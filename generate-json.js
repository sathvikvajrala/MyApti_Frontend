import fs from 'fs';
import { topicsData } from './src/data/aptitudeData.js';
import { generateQuestions } from './src/data/questionGenerator.js';

console.log("Generating static JSON databases...");
const questions = generateQuestions();

fs.writeFileSync('topics.json', JSON.stringify(topicsData, null, 2));
fs.writeFileSync('questions.json', JSON.stringify(questions, null, 2));

console.log(`Successfully generated:`);
console.log(`- topics.json (${topicsData.length} topics)`);
console.log(`- questions.json (${questions.length} questions)`);
