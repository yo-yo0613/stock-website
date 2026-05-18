const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/bg-\[\#13131a\]/g, 'bg-card');
  content = content.replace(/bg-\[\#1a1a24\]/g, 'bg-card-hover');
  content = content.replace(/bg-\[\#0d0d12\]/g, 'bg-background');
  content = content.replace(/bg-\[\#0a0a0f\]/g, 'bg-background');
  content = content.replace(/bg-\[\#2a2a35\]/g, 'bg-border');
  content = content.replace(/text-neutral-(300|400|500)/g, 'text-muted-foreground');
  
  content = content.replace(/text-white/g, 'text-foreground');
  content = content.replace(/bg-primary([^"']*)text-foreground/g, 'bg-primary$1text-white');
  content = content.replace(/text-foreground([^"']*)bg-primary/g, 'text-white$1bg-primary');
  content = content.replace(/bg-success([^"']*)text-foreground/g, 'bg-success$1text-white');
  content = content.replace(/bg-danger([^"']*)text-foreground/g, 'bg-danger$1text-white');

  fs.writeFileSync(filePath, content);
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) walk(fullPath);
    else if (fullPath.endsWith('.tsx')) replaceInFile(fullPath);
  }
}

walk('src');
console.log("Done refactoring UI classes for light/dark mode.");
