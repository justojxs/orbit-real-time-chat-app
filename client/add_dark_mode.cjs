const fs = require('fs');
const path = require('path');

const replacements = {
    'bg-white/80': 'bg-white/80 dark:bg-[#0a0a0f]/80',
    'bg-white/90': 'bg-white/90 dark:bg-[#0a0a0f]/90',
    'bg-white': 'bg-white dark:bg-[#0a0a0f]',
    'bg-gray-50/40': 'bg-gray-50/40 dark:bg-[#0e0e13]/40',
    'bg-gray-50/80': 'bg-gray-50/80 dark:bg-[#0e0e13]/80',
    'bg-gray-50': 'bg-gray-50 dark:bg-[#0e0e13]',
    'bg-gray-100/80': 'bg-gray-100/80 dark:bg-white/5',
    'bg-gray-100': 'bg-gray-100 dark:bg-white/5',
    'bg-gray-200': 'bg-gray-200 dark:bg-white/10',
    'border-gray-200/60': 'border-gray-200/60 dark:border-white/[0.04]',
    'border-gray-200': 'border-gray-200 dark:border-white/5',
    'border-gray-300': 'border-gray-300 dark:border-white/10',
    'text-gray-900': 'text-gray-900 dark:text-white',
    'text-gray-700': 'text-gray-700 dark:text-zinc-200',
    'text-gray-600': 'text-gray-600 dark:text-zinc-300',
    'text-gray-500': 'text-gray-500 dark:text-zinc-400',
    'text-gray-400': 'text-gray-400 dark:text-zinc-500',
    'text-gray-300': 'text-gray-300 dark:text-zinc-600',
    'hover:bg-gray-50': 'hover:bg-gray-50 dark:hover:bg-white/5',
    'hover:bg-gray-100': 'hover:bg-gray-100 dark:hover:bg-white/10',
    'hover:bg-gray-200': 'hover:bg-gray-200 dark:hover:bg-white/20',
    'hover:text-gray-900': 'hover:text-gray-900 dark:hover:text-white',
    'hover:text-gray-700': 'hover:text-gray-700 dark:hover:text-zinc-200',
    'hover:border-gray-200': 'hover:border-gray-200 dark:hover:border-white/10',
    'hover:border-gray-300': 'hover:border-gray-300 dark:hover:border-white/20',
};

// Sort the keys by length descending to replace larger chunks first.
const sortedKeys = Object.keys(replacements).sort((a, b) => b.length - a.length);

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    for (const key of sortedKeys) {
        // Create a regex that avoids matching if it's already preceded by 'dark:'
        // or if it's part of a larger word. 
        // We use positive lookahead and positive lookbehind instead of negative if possible, 
        // wait, node supports negative lookarounds.
        const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        // We only want to match if not preceded by `dark:` or a word char.
        // We only want to match if not followed by a word char or `/`
        const regex = new RegExp(`(?<!dark:)(?<![-a-zA-Z0-9])${escapedKey}(?![-a-zA-Z0-9/])`, 'g');
        content = content.replace(regex, replacements[key]);
    }

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            processFile(fullPath);
        }
    }
}

processDirectory(path.join(__dirname, 'src/components'));
processDirectory(path.join(__dirname, 'src/pages'));

console.log("Done.");
