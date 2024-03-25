API ReferenceThe Next.js API reference is divided into the following sections:
Components
Font Module
This API reference will help you understand how to use next/font/google and next/font/local. For features and usage, please see the Optimizing Fonts page.
Font Function Arguments
  
    
    
  

For usage, review Google Fonts and Local Fonts.
Keyfont/googlefont/localTypeRequiredsrcString or Array of ObjectsYesweightString or ArrayRequired/OptionalstyleString or Array-subsetsArray of Strings-axesArray of Strings-displayString-preloadBoolean-fallbackArray of Strings-adjustFontFallbackBoolean or String-variableString-declarationsArray of Objects-
src
  
    
    
  

The path of the font file as a string or an array of objects (with type Array<{path: string, weight?: string, style?: string}>) relative to the directory where the font loader function is called.
Used in next/font/local

Required

Examples:

src:'./fonts/my-font.woff2' where my-font.woff2 is placed in a directory named fonts inside the app directory
src:[{path: './inter/Inter-Thin.ttf', weight: '100',},{path: './inter/Inter-Regular.ttf',weight: '400',},{path: './inter/Inter-Bold-Italic.ttf', weight: '700',style: 'italic',},]
if the font loader function is called in app/page.tsx using src:'../styles/fonts/my-font.ttf', then my-font.ttf is placed in styles/fonts at the root of the project

weight
  
    
    
  

The font weight with the following possibilities:

A string with possible values of the weights available for the specific font or a range of values if it's a variable font
An array of weight values if the font is not a variable google font. It applies to next/font/google only.

Used in next/font/google and next/font/local

Required if the font being used is not variable

Examples:

weight: '400': A string for a single weight value - for the font Inter, the possible values are '100', '200', '300', '400', '500', '600', '700', '800', '900' or 'variable' where 'variable' is the default)
weight: '100 900': A string for the range between 100 and 900 for a variable font
weight: ['100','400','900']: An array of 3 possible values for a non variable font

style
  
    
    
  

The font style with the following possibilities:

A string value with default value of 'normal'
An array of style values if the font is not a variable google font. It applies to next/font/google only.

Used in next/font/google and next/font/local

Optional

Examples:

style: 'italic': A string - it can be normal or italic for next/font/google
style: 'oblique': A string - it can take any value for next/font/local but is expected to come from standard font styles
style: ['italic','normal']: An array of 2 values for next/font/google - the values are from normal and italic

subsets
  
    
    
  