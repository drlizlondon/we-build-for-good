// Builds assets/tailwind.css (replaces the cdn.tailwindcss.com runtime, which is not for production).
// Regenerate after changing classes in index.html:
//   npx tailwindcss@3.4.17 -c tailwind/tailwind.config.js -i tailwind/input.css -o assets/tailwind.css --minify
const path = require('path');
module.exports = {
  content: [path.join(__dirname, '..', 'index.html'), path.join(__dirname, '..', 'agents', 'index.html')],
  theme: { extend: {} },
  plugins: [],
};
