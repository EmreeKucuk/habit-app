const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = [
  ...walk('./app'),
  ...walk('./components')
];

let updatedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('Colors') || !content.includes('@/constants/theme')) continue;
  
  // Skip ThemeContext itself
  if (file.includes('ThemeContext')) continue;
  if (file.includes('_layout.tsx') && file.includes('app\\_layout.tsx')) continue; // Already manually fixed

  let originalContent = content;

  // 1. Fix the import
  content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]@\/constants\/theme['"];/g, (match, p1) => {
    let newImports = p1.split(',').map(s => s.trim()).filter(s => s !== 'Colors' && s !== '');
    if (newImports.length === 0) return '';
    return `import { ${newImports.join(', ')} } from '@/constants/theme';`;
  });

  // Add the useTheme import if we removed Colors
  if (originalContent !== content) {
    // Insert after the last import
    content = content.replace(/(import.*?;(\r?\n))+/, match => {
      return match + `import { useTheme } from '@/context/ThemeContext';\n`;
    });

    // 2. Modify StyleSheet.create to createStyles
    let hasStyles = content.includes('const styles = StyleSheet.create(');
    if (hasStyles) {
      content = content.replace(/const styles = StyleSheet\.create\(/g, 'const createStyles = (Colors: any) => StyleSheet.create(');
    }

    // 3. Inject into the main React component
    // Find the export default function or export function
    content = content.replace(/export (default )?function ([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*\{/, (match, p1, p2, p3) => {
      let injection = `\n  const { Colors, isDark } = useTheme();\n`;
      if (hasStyles) {
        injection += `  const styles = React.useMemo(() => createStyles(Colors), [Colors]);\n`;
      }
      return match + injection;
    });

    // Write back
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated:', file);
    updatedCount++;
  }
}

console.log(`Updated ${updatedCount} files.`);
