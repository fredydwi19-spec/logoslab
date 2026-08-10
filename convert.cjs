const fs = require('fs');
const path = require('path');

const componentsToConvert = [
  'PembuatGameDashboard.tsx',
  'PembuatMateriDashboard.tsx',
  'PakarDashboard.tsx'
];

componentsToConvert.forEach(file => {
  const sourcePath = path.join(__dirname, 'src', 'views', 'components', file);
  const destPath = path.join(__dirname, 'src', 'pages', 'dashboard', file);
  
  if (!fs.existsSync(sourcePath)) {
    console.log('Skipping', file, 'as it does not exist');
    return;
  }
  
  let content = fs.readFileSync(sourcePath, 'utf8');
  
  // Extract the string literal returned by the component
  const returnMatch = content.match(/return\s+`([\s\S]+?)`;/);
  if (!returnMatch) {
    console.log('Could not extract return string for', file);
    return;
  }
  
  let html = returnMatch[1];
  
  // Remove <script> tags
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  
  // Replace attributes
  html = html.replace(/\bclass="/g, 'className="');
  html = html.replace(/\bfor="/g, 'htmlFor="');
  
  // Replace Alpine directives that break JSX
  // Change x- to data-x- so they are valid JSX custom attributes
  html = html.replace(/\bx-data=/g, 'data-x-data=');
  html = html.replace(/\bx-init=/g, 'data-x-init=');
  html = html.replace(/\bx-show=/g, 'data-x-show=');
  html = html.replace(/\bx-model(\.[a-z]+)*=/g, 'data-x-model=');
  html = html.replace(/\bx-text=/g, 'data-x-text=');
  html = html.replace(/\bx-html=/g, 'data-x-html=');
  html = html.replace(/\bx-if=/g, 'data-x-if=');
  html = html.replace(/\bx-for=/g, 'data-x-for=');
  html = html.replace(/\bx-cloak\b/g, 'data-x-cloak="true"');
  html = html.replace(/\bx-transition(\.[a-z]+)*\b/g, 'data-x-transition="true"');
  
  // Replace @click to data-x-click
  html = html.replace(/\B@click=/g, 'data-x-click=');
  html = html.replace(/\B@change=/g, 'data-x-change=');
  html = html.replace(/\B@input=/g, 'data-x-input=');
  
  // Replace :class to data-x-bind-class
  html = html.replace(/\B:class=/g, 'data-x-bind-class=');
  html = html.replace(/\B:style=/g, 'data-x-bind-style=');
  html = html.replace(/\B:key=/g, 'data-x-bind-key=');
  html = html.replace(/\B:disabled=/g, 'data-x-bind-disabled=');
  
  // Fix self-closing tags
  html = html.replace(/<img([^>]+[^\/])>/g, '<img$1 />');
  html = html.replace(/<input([^>]+[^\/])>/g, '<input$1 />');
  html = html.replace(/<br>/g, '<br />');
  html = html.replace(/<hr>/g, '<hr />');
  
  // Fix inline template strings interpolations like ${ProjectHeader()}
  html = html.replace(/\$\{([^\}]+)\}/g, '{/* Interpolated: $1 */}');

  // Wrap in a React component
  const componentName = file.replace('.tsx', '');
  
  const reactComponent = `import React from 'react';

export const ${componentName} = () => {
  return (
    <>
      {/* 
        This component was automatically converted from SSR HTML to JSX.
        Alpine.js logic has been disabled (attributes prefixed with data-x-) 
        to ensure valid JSX compilation. 
      */}
      ${html}
    </>
  );
};
`;

  fs.writeFileSync(destPath, reactComponent);
  console.log('Converted', file);
});
